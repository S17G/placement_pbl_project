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

function hasValue(value) {
  if (value === undefined || value === null) {
    return false
  }

  const normalized = String(value).trim()
  return normalized.length > 0 && normalized !== '-'
}

function buildRecordKey(record) {
  const company = String(record.company || '').trim().toLowerCase()
  const role = String(record.role || '').trim().toLowerCase()
  const date = String(record.date || '').trim().toLowerCase()
  const fallbackDate = String(record.createdAt || '').trim().toLowerCase()

  return `${company}|${role}|${date || fallbackDate}`
}

function mergeMissingFields(target, source) {
  for (const [field, value] of Object.entries(source)) {
    if (!hasValue(target[field]) && hasValue(value)) {
      target[field] = value
    }
  }

  return target
}

function normalizeForUi(record) {
  const normalized = { ...record }

  normalized.company_name = hasValue(normalized.company_name) ? normalized.company_name : normalized.company
  normalized.date = hasValue(normalized.date)
    ? normalized.date
    : (normalized.createdAt ? new Date(normalized.createdAt).toLocaleDateString() : '-')
  normalized.cgpa_criteria = hasValue(normalized.cgpa_criteria)
    ? normalized.cgpa_criteria
    : normalized.eligibility
  normalized.ctc = hasValue(normalized.ctc) ? normalized.ctc : '-'
  normalized.stipend = hasValue(normalized.stipend) ? normalized.stipend : normalized.package
  normalized.activity = hasValue(normalized.activity) ? normalized.activity : normalized.process
  normalized.branch = hasValue(normalized.branch) ? normalized.branch : '-'
  normalized.venue = hasValue(normalized.venue) ? normalized.venue : '-'
  normalized.skills_required = hasValue(normalized.skills_required)
    ? normalized.skills_required
    : normalized.role

  return normalized
}

function mergeUniqueRecords(...recordSets) {
  const mergedByKey = new Map()

  for (const records of recordSets) {
    for (const record of records) {
      if (!record.company || !record.role) {
        continue
      }

      const key = buildRecordKey(record)
      const existing = mergedByKey.get(key)

      if (!existing) {
        mergedByKey.set(key, { ...record })
        continue
      }

      mergedByKey.set(key, mergeMissingFields(existing, record))
    }
  }

  return Array.from(mergedByKey.values())
    .map(normalizeForUi)
    .sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0))
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