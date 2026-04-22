const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const InternshipRecord = require('../models/InternshipRecord')

const fallbackFilePath = path.join(process.cwd(), 'uploads', 'internships.json')

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

async function listInternshipRecords() {
  let databaseRecords = []

  try {
    databaseRecords = await InternshipRecord.find().sort({ createdAt: -1 }).lean()
  } catch {
    databaseRecords = []
  }

  return mergeUniqueRecords(databaseRecords, readFallbackRecords())
}

async function createInternshipRecord(payload) {
  try {
    const created = await InternshipRecord.create(payload)

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

async function updateInternshipRecord(recordId, payload) {
  let dbRecord = null

  try {
    dbRecord = await InternshipRecord.findByIdAndUpdate(recordId, payload, {
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

async function deleteInternshipRecord(recordId) {
  let deleted = null

  try {
    deleted = await InternshipRecord.findByIdAndDelete(recordId)
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
  listInternshipRecords,
  createInternshipRecord,
  updateInternshipRecord,
  deleteInternshipRecord,
}