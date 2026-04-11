const {
  listApplicationsForUser,
  createApplicationForUser,
  updateApplicationForUser,
  deleteApplicationForUser,
} = require('../services/application.service')
const ApiError = require('../utils/ApiError')
const ApiResponse = require('../utils/ApiResponse')

function buildApplicationPayload(body) {
  return {
    companyName: String(body.companyName || '').trim(),
    role: String(body.role || '').trim(),
    status: String(body.status || '').trim(),
    dateApplied: String(body.dateApplied || '').trim(),
    notes: String(body.notes || '').trim(),
  }
}

async function listApplications(req, res) {
  const userId = String(req.user?.sub || '')
  const applications = await listApplicationsForUser(userId)
  return res.status(200).json(new ApiResponse(200, 'Application tracker fetched', applications))
}

async function createApplication(req, res) {
  const userId = String(req.user?.sub || '')
  const payload = buildApplicationPayload(req.body)
  const application = await createApplicationForUser(userId, payload)
  return res.status(201).json(new ApiResponse(201, 'Application added', application))
}

async function updateApplication(req, res) {
  const userId = String(req.user?.sub || '')
  const { applicationId } = req.params
  const payload = buildApplicationPayload(req.body)
  const updated = await updateApplicationForUser(applicationId, userId, payload)

  if (!updated) {
    throw new ApiError(404, 'Application not found')
  }

  return res.status(200).json(new ApiResponse(200, 'Application updated', updated))
}

async function deleteApplication(req, res) {
  const userId = String(req.user?.sub || '')
  const { applicationId } = req.params
  const deleted = await deleteApplicationForUser(applicationId, userId)

  if (!deleted) {
    throw new ApiError(404, 'Application not found')
  }

  return res.status(200).json(new ApiResponse(200, 'Application deleted'))
}

module.exports = {
  listApplications,
  createApplication,
  updateApplication,
  deleteApplication,
}
