const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const PlacementRecord = require('../models/PlacementRecord')

const fallbackFilePath = path.join(process.cwd(), 'uploads', 'placements.json')

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

async function listPlacementRecords() {
  try {
    const records = await PlacementRecord.find().sort({ createdAt: -1 }).lean()

    if (records.length > 0) {
      return records
    }
  } catch {
    // Fall back to file storage when database read fails.
  }

  return readFallbackRecords()
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
