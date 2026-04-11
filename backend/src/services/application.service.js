const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const fallbackFilePath = path.join(process.cwd(), 'uploads', 'applications.json')

function ensureFallbackDir() {
  fs.mkdirSync(path.dirname(fallbackFilePath), { recursive: true })
}

function readFallbackApplications() {
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

function writeFallbackApplications(applications) {
  ensureFallbackDir()
  fs.writeFileSync(fallbackFilePath, JSON.stringify(applications, null, 2), 'utf8')
}

async function listApplicationsForUser(userId) {
  return readFallbackApplications().filter((application) => String(application.userId) === String(userId))
}

async function createApplicationForUser(userId, payload) {
  const application = {
    _id: crypto.randomUUID(),
    userId,
    companyName: payload.companyName,
    role: payload.role,
    status: payload.status,
    dateApplied: payload.dateApplied,
    notes: payload.notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const existing = readFallbackApplications()
  const next = [application, ...existing]
  writeFallbackApplications(next)
  return application
}

async function updateApplicationForUser(applicationId, userId, payload) {
  const existing = readFallbackApplications()
  const index = existing.findIndex(
    (application) => String(application._id) === String(applicationId) && String(application.userId) === String(userId),
  )

  if (index < 0) {
    return null
  }

  const updated = {
    ...existing[index],
    companyName: payload.companyName,
    role: payload.role,
    status: payload.status,
    dateApplied: payload.dateApplied,
    notes: payload.notes,
    updatedAt: new Date().toISOString(),
  }

  existing[index] = updated
  writeFallbackApplications(existing)
  return updated
}

async function deleteApplicationForUser(applicationId, userId) {
  const existing = readFallbackApplications()
  const filtered = existing.filter(
    (application) =>
      !(
        String(application._id) === String(applicationId) &&
        String(application.userId) === String(userId)
      ),
  )

  if (filtered.length === existing.length) {
    return null
  }

  writeFallbackApplications(filtered)
  return { _id: applicationId }
}

module.exports = {
  listApplicationsForUser,
  createApplicationForUser,
  updateApplicationForUser,
  deleteApplicationForUser,
}
