const {
  listPlacementRecords,
  createPlacementRecord,
  updatePlacementRecord,
  deletePlacementRecord,
} = require('../services/placement.service')
const ApiError = require('../utils/ApiError')
const ApiResponse = require('../utils/ApiResponse')

function buildPlacementPayload(body) {
  return {
    company: String(body.company || '').trim(),
    role: String(body.role || '').trim(),
    package: String(body.package || '').trim(),
    eligibility: String(body.eligibility || '').trim(),
    process: String(body.process || '').trim(),
  }
}

async function listPlacements(req, res) {
  const records = await listPlacementRecords()
  return res.status(200).json(new ApiResponse(200, 'Placement records fetched', records))
}

async function createPlacement(req, res) {
  const payload = buildPlacementPayload(req.body)
  const record = await createPlacementRecord(payload)

  return res.status(201).json(new ApiResponse(201, 'Placement record created', record))
}

async function updatePlacement(req, res) {
  const { recordId } = req.params
  const payload = buildPlacementPayload(req.body)

  const record = await updatePlacementRecord(recordId, payload)

  if (!record) {
    throw new ApiError(404, 'Placement record not found')
  }

  return res.status(200).json(new ApiResponse(200, 'Placement record updated', record))
}

async function deletePlacement(req, res) {
  const { recordId } = req.params
  const deleted = await deletePlacementRecord(recordId)

  if (!deleted) {
    throw new ApiError(404, 'Placement record not found')
  }

  return res.status(200).json(new ApiResponse(200, 'Placement record deleted'))
}

module.exports = {
  listPlacements,
  createPlacement,
  updatePlacement,
  deletePlacement,
}
