const fs = require('fs')
const path = require('path')
const mongoose = require('mongoose')
const { connectDatabase, disconnectDatabase } = require('../src/config/db')
const env = require('../src/config/env')
const PlacementRecord = require('../src/models/PlacementRecord')

function parseLooseJson(raw) {
  try {
    return JSON.parse(raw)
  } catch {
    // Accept non-standard NaN tokens present in some exported datasets.
    const sanitized = raw.replace(/\bNaN\b/g, 'null')
    return JSON.parse(sanitized)
  }
}

function normalizeRole(value) {
  const text = String(value || '').replace(/\s+/g, ' ').trim()
  if (!text || text === '-') {
    return 'Placement Opportunity'
  }

  const first = text
    .split(/,|\||\//)
    .map((chunk) => chunk.trim())
    .filter(Boolean)[0]

  return first || 'Placement Opportunity'
}

function deriveBatch(value) {
  const text = String(value || '')
  const yearMatch = text.match(/(20\d{2})/)
  return yearMatch ? yearMatch[1] : '2025'
}

function normalizePlacementEntries(rawEntries) {
  if (!Array.isArray(rawEntries)) {
    return []
  }

  const mapped = rawEntries
    .filter((item) => item && (item.company || item.company_name))
    .map((item) => ({
      name: String(item.name || 'Placement Cell').trim(),
      company: String(item.company || item.company_name || '').trim(),
      role: normalizeRole(item.role || item.skills_required),
      branch: String(item.branch || 'All Branches').trim() || 'All Branches',
      batch: String(item.batch || deriveBatch(item.date)).trim() || '2025',
      date: String(item.date || '').trim() || new Date().toISOString().slice(0, 10),
      email: String(item.email || 'na@placemate.local').trim() || 'na@placemate.local',
      views: Number(item.views || 0),
      profile_pic: String(item.profile_pic || '').trim(),
      uid: String(item.uid || '').trim(),
      content_markdown: String(item.content_markdown || '').trim(),
      package: String(item.package || item.ctc || 'N/A').trim() || 'N/A',
      eligibility: String(item.eligibility || item.cgpa_criteria || '-').trim() || '-',
      process: String(item.process || item.activity || '-').trim() || '-',
      ctc: String(item.ctc || item.package || '-').trim() || '-',
      cgpa_criteria: String(item.cgpa_criteria || item.eligibility || '-').trim() || '-',
      stipend: String(item.stipend || '-').trim() || '-',
      activity: String(item.activity || item.process || '-').trim() || '-',
      venue: String(item.venue || '-').trim() || '-',
      skills_required: String(item.skills_required || item.role || '-').trim() || '-',
      createdAt: new Date(),
    }))
    .filter((item) => item.company && item.role)

  // Keep one record per unique company + role + date.
  const seen = new Set()
  return mapped.filter((row) => {
    const key = `${row.company.toLowerCase()}|${row.role.toLowerCase()}|${String(row.date).toLowerCase()}`
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

function mergeIntoFallbackFile(fallbackFilePath, normalizedEntries) {
  let existing = []

  if (fs.existsSync(fallbackFilePath)) {
    try {
      const raw = fs.readFileSync(fallbackFilePath, 'utf8')
      const parsed = JSON.parse(raw)
      existing = Array.isArray(parsed) ? parsed : []
    } catch {
      existing = []
    }
  }

  const indexByKey = new Map()
  for (let idx = 0; idx < existing.length; idx += 1) {
    const row = existing[idx]
    const key = `${String(row.company || '').toLowerCase()}|${String(row.role || '').toLowerCase()}|${String(row.date || '').toLowerCase()}`
    indexByKey.set(key, idx)
  }

  let added = 0
  let updated = 0
  for (const row of normalizedEntries) {
    const key = `${row.company.toLowerCase()}|${row.role.toLowerCase()}|${String(row.date).toLowerCase()}`
    const existingIndex = indexByKey.get(key)

    if (existingIndex !== undefined) {
      existing[existingIndex] = {
        ...existing[existingIndex],
        ...row,
        _id: existing[existingIndex]._id,
        createdAt: existing[existingIndex].createdAt || row.createdAt.toISOString(),
      }
      updated += 1
      continue
    }

    indexByKey.set(key, existing.length)
    existing.unshift({
      _id: new mongoose.Types.ObjectId().toString(),
      name: row.name,
      company: row.company,
      role: row.role,
      branch: row.branch,
      batch: row.batch,
      date: row.date,
      email: row.email,
      views: row.views,
      profile_pic: row.profile_pic,
      uid: row.uid,
      content_markdown: row.content_markdown,
      package: row.package,
      eligibility: row.eligibility,
      process: row.process,
      ctc: row.ctc,
      cgpa_criteria: row.cgpa_criteria,
      stipend: row.stipend,
      activity: row.activity,
      venue: row.venue,
      skills_required: row.skills_required,
      createdAt: row.createdAt.toISOString(),
    })
    added += 1
  }

  fs.mkdirSync(path.dirname(fallbackFilePath), { recursive: true })
  fs.writeFileSync(fallbackFilePath, JSON.stringify(existing, null, 2), 'utf8')
  return { added, updated }
}

async function mergeIntoMongo(normalizedEntries) {
  await connectDatabase(env.mongodbUri, { enableInMemoryMongo: env.enableInMemoryMongo })

  const operations = normalizedEntries.map((row) => ({
    updateOne: {
      filter: {
        company: row.company,
        role: row.role,
        date: row.date,
      },
      update: {
        $set: {
          name: row.name,
          branch: row.branch,
          batch: row.batch,
          email: row.email,
          views: row.views,
          profile_pic: row.profile_pic,
          uid: row.uid,
          content_markdown: row.content_markdown,
          package: row.package,
          eligibility: row.eligibility,
          process: row.process,
          ctc: row.ctc,
          cgpa_criteria: row.cgpa_criteria,
          stipend: row.stipend,
          activity: row.activity,
          venue: row.venue,
          skills_required: row.skills_required,
        },
        $setOnInsert: {
          company: row.company,
          role: row.role,
          date: row.date,
        },
      },
      upsert: true,
    },
  }))

  const bulkResult = operations.length > 0
    ? await PlacementRecord.bulkWrite(operations, { ordered: false })
    : { upsertedCount: 0, modifiedCount: 0 }

  await disconnectDatabase()
  return {
    upserted: bulkResult.upsertedCount || 0,
    modified: bulkResult.modifiedCount || 0,
  }
}

async function main() {
  const sourcePath = process.argv[2]

  if (!sourcePath) {
    throw new Error('Usage: node scripts/importPlacementsFromJson.js <absolute_json_path>')
  }

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`File not found: ${sourcePath}`)
  }

  const raw = fs.readFileSync(sourcePath, 'utf8')
  const parsed = parseLooseJson(raw)
  const normalizedEntries = normalizePlacementEntries(parsed)

  const fallbackFilePath = path.resolve(__dirname, '..', 'uploads', 'placements.json')
  const fallbackResult = mergeIntoFallbackFile(fallbackFilePath, normalizedEntries)
  const mongoResult = await mergeIntoMongo(normalizedEntries)

  console.log(`Source entries: ${Array.isArray(parsed) ? parsed.length : 0}`)
  console.log(`Normalized unique company-role entries: ${normalizedEntries.length}`)
  console.log(`Fallback placements added: ${fallbackResult.added}`)
  console.log(`Fallback placements updated: ${fallbackResult.updated}`)
  console.log(`Mongo placements upserted: ${mongoResult.upserted}`)
  console.log(`Mongo placements modified: ${mongoResult.modified}`)
}

main().catch((error) => {
  console.error('Import failed:', error.message)
  process.exit(1)
})
