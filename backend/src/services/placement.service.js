const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const PlacementRecord = require('../models/PlacementRecord')

const fallbackFilePath = path.join(process.cwd(), 'uploads', 'placements.json')
const externalImportFilePath = 'C:/Users/Admin/Downloads/all_90_entries.json'

function ensureFallbackDir() {
  fs.mkdirSync(path.dirname(fallbackFilePath), { recursive: true })
}

function readFallbackRecords() {
  ensureFallbackDir()

  if (!fs.existsSync(fallbackFilePath)) {
    return []
  }

  try {
    const raw = fs.readFileSync(fallbackFilePath, 'utf8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeFallbackRecords(records) {
  ensureFallbackDir()
  fs.writeFileSync(fallbackFilePath, JSON.stringify(records, null, 2), 'utf8')
}

function readExternalImportedRecords() {
  if (!fs.existsSync(externalImportFilePath)) {
    return []
  }

  try {
    const raw = fs.readFileSync(externalImportFilePath, 'utf8')
    const parsed = JSON.parse(raw)

    if (!Array.isArray(parsed)) {
      return []
    }

    const normalized = parsed
      .filter((item) => item && item.company && item.role)
      .map((item) => ({
        _id: String(item.id || crypto.randomUUID()),
        name: String(item.name || '').trim(),
        company: String(item.company || '').trim(),
        role: String(item.role || '').trim(),
        branch: String(item.branch || '').trim(),
        batch: String(item.batch || '').trim(),
        email: String(item.email || '').trim(),
        views: Number(item.views || 0),
        date: item.date || new Date().toISOString(),
        package: 'N/A',
        eligibility: `${String(item.branch || '').trim() || 'All Branches'} ${String(item.batch || '').trim() || ''}`.trim(),
        process: 'Imported from student placement dataset',
        createdAt: item.date || new Date().toISOString(),
      }))
      .filter((item) => item.company && item.role)

    return normalized
  } catch {
    return []
  }
}

function mergeUniqueRecords(...recordSets) {
  const merged = []
  const seen = new Set()

  for (const records of recordSets) {
    for (const record of records) {
      const key = String(record._id || `${record.company || ''}|${record.role || ''}|${record.createdAt || ''}`)
      if (!record.company || !record.role || seen.has(key)) {
        continue
      }

      seen.add(key)
      merged.push(record)
    }
  }

  return merged.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
}

async function listPlacementRecords() {
  let databaseRecords = []

  try {
    databaseRecords = await PlacementRecord.find().sort({ createdAt: -1 }).lean()
  } catch {
    databaseRecords = []
  }

  const fallbackRecords = readFallbackRecords()
  const importedRecords = readExternalImportedRecords()

  return mergeUniqueRecords(databaseRecords, fallbackRecords, importedRecords)
}

async function createPlacementRecord(payload) {
  try {
    const created = await PlacementRecord.create(payload)

    const fallback = readFallbackRecords()
    const merged = [
      {
        _id: String(created._id),
        ...payload,
        createdAt: created.createdAt,
      },
      ...fallback.filter((record) => String(record._id) !== String(created._id)),
    ]
    writeFallbackRecords(merged)

    return created
  } catch {
    const fallbackRecord = {
      _id: crypto.randomUUID(),
      ...payload,
      createdAt: new Date().toISOString(),
    }
    const fallback = [fallbackRecord, ...readFallbackRecords()]
    writeFallbackRecords(fallback)
    return fallbackRecord
  }
}

async function updatePlacementRecord(recordId, payload) {
  let dbRecord = null

  try {
    dbRecord = await PlacementRecord.findByIdAndUpdate(recordId, payload, {
      returnDocument: 'after',
    })
  } catch {
    // Continue with fallback update.
  }

  const fallback = readFallbackRecords()
  const index = fallback.findIndex((record) => String(record._id) === String(recordId))

  if (index >= 0) {
    fallback[index] = { ...fallback[index], ...payload }
    writeFallbackRecords(fallback)
  }

  return dbRecord || (index >= 0 ? fallback[index] : null)
}

async function deletePlacementRecord(recordId) {
  let deleted = null

  try {
    deleted = await PlacementRecord.findByIdAndDelete(recordId)
  } catch {
    // Continue with fallback delete.
  }

  const fallback = readFallbackRecords()
  const filtered = fallback.filter((record) => String(record._id) !== String(recordId))

  if (filtered.length !== fallback.length) {
    writeFallbackRecords(filtered)
    return deleted || { _id: recordId }
  }

  return deleted
}

module.exports = {
  listPlacementRecords,
  createPlacementRecord,
  updatePlacementRecord,
  deletePlacementRecord,
}
