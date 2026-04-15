const fs = require('fs')
const path = require('path')
const mongoose = require('mongoose')
const { connectDatabase, disconnectDatabase } = require('../src/config/db')
const env = require('../src/config/env')
const PlacementRecord = require('../src/models/PlacementRecord')

function normalizePlacementEntries(rawEntries) {
  if (!Array.isArray(rawEntries)) {
    return []
  }

  const mapped = rawEntries
    .filter((item) => item && item.company && item.role)
    .map((item) => ({
      company: String(item.company || '').trim(),
      role: String(item.role || '').trim(),
      package: 'N/A',
      eligibility: `${String(item.branch || '').trim() || 'All Branches'} ${String(item.batch || '').trim() || ''}`.trim(),
      process: 'Imported from student placement dataset',
      createdAt: item.date ? new Date(item.date) : new Date(),
    }))
    .filter((item) => item.company && item.role)

  // Keep one record per unique company + role for placement table readability.
  const seen = new Set()
  return mapped.filter((row) => {
    const key = `${row.company.toLowerCase()}|${row.role.toLowerCase()}`
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

  const existingKeys = new Set(
    existing.map((row) => `${String(row.company || '').toLowerCase()}|${String(row.role || '').toLowerCase()}`),
  )

  let added = 0
  for (const row of normalizedEntries) {
    const key = `${row.company.toLowerCase()}|${row.role.toLowerCase()}`
    if (existingKeys.has(key)) {
      continue
    }

    existingKeys.add(key)
    existing.unshift({
      _id: new mongoose.Types.ObjectId().toString(),
      company: row.company,
      role: row.role,
      package: row.package,
      eligibility: row.eligibility,
      process: row.process,
      createdAt: row.createdAt.toISOString(),
    })
    added += 1
  }

  fs.mkdirSync(path.dirname(fallbackFilePath), { recursive: true })
  fs.writeFileSync(fallbackFilePath, JSON.stringify(existing, null, 2), 'utf8')
  return added
}

async function mergeIntoMongo(normalizedEntries) {
  await connectDatabase(env.mongodbUri, { enableInMemoryMongo: env.enableInMemoryMongo })

  const existing = await PlacementRecord.find({}, 'company role').lean()
  const existingKeys = new Set(
    existing.map((row) => `${String(row.company || '').toLowerCase()}|${String(row.role || '').toLowerCase()}`),
  )

  const toInsert = normalizedEntries.filter((row) => {
    const key = `${row.company.toLowerCase()}|${row.role.toLowerCase()}`
    if (existingKeys.has(key)) {
      return false
    }

    existingKeys.add(key)
    return true
  })

  if (toInsert.length > 0) {
    await PlacementRecord.insertMany(toInsert, { ordered: false })
  }

  await disconnectDatabase()
  return toInsert.length
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
  const parsed = JSON.parse(raw)
  const normalizedEntries = normalizePlacementEntries(parsed)

  const fallbackFilePath = path.resolve(__dirname, '..', 'uploads', 'placements.json')
  const fallbackAdded = mergeIntoFallbackFile(fallbackFilePath, normalizedEntries)
  const mongoAdded = await mergeIntoMongo(normalizedEntries)

  console.log(`Source entries: ${Array.isArray(parsed) ? parsed.length : 0}`)
  console.log(`Normalized unique company-role entries: ${normalizedEntries.length}`)
  console.log(`Added to fallback placements.json: ${fallbackAdded}`)
  console.log(`Added to MongoDB placements: ${mongoAdded}`)
}

main().catch((error) => {
  console.error('Import failed:', error.message)
  process.exit(1)
})
