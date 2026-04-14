const {
  listInternshipRecords,
  createInternshipRecord,
  updateInternshipRecord,
  deleteInternshipRecord,
} = require('../services/internship.service')
const ApiError = require('../utils/ApiError')
const ApiResponse = require('../utils/ApiResponse')

function buildInternshipPayload(body) {
  return {
    company: String(body.company || '').trim(),
    role: String(body.role || '').trim(),
    package: String(body.package || '').trim(),
    eligibility: String(body.eligibility || '').trim(),
    process: String(body.process || '').trim(),
  }
}

async function listInternships(req, res) {
  const records = await listInternshipRecords()
  return res.status(200).json(new ApiResponse(200, 'Internship records fetched', records))
}

async function createInternship(req, res) {
  const payload = buildInternshipPayload(req.body)
  const record = await createInternshipRecord(payload)

  return res.status(201).json(new ApiResponse(201, 'Internship record created', record))
}

async function updateInternship(req, res) {
  const { recordId } = req.params
  const payload = buildInternshipPayload(req.body)

  const record = await updateInternshipRecord(recordId, payload)

  if (!record) {
    throw new ApiError(404, 'Internship record not found')
  }

  return res.status(200).json(new ApiResponse(200, 'Internship record updated', record))
}

async function deleteInternship(req, res) {
  const { recordId } = req.params
  const deleted = await deleteInternshipRecord(recordId)

  if (!deleted) {
    throw new ApiError(404, 'Internship record not found')
  }

  return res.status(200).json(new ApiResponse(200, 'Internship record deleted'))
}

module.exports = {
  listInternships,
  createInternship,
  updateInternship,
  deleteInternship,
}