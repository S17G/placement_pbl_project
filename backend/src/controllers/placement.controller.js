const {
  listPlacementRecords,
  createPlacementRecord,
  updatePlacementRecord,
  deletePlacementRecord,
} = require('../services/placement.service')
const ApiError = require('../utils/ApiError')
const ApiResponse = require('../utils/ApiResponse')

function buildPlacementPayload(body) {
  const payload = {}
  const stringFields = [
    'name',
    'company',
    'role',
    'branch',
    'batch',
    'date',
    'email',
    'profile_pic',
    'uid',
    'content_markdown',
    'package',
    'eligibility',
    'process',
  ]

  for (const field of stringFields) {
    const value = body[field]
    if (value === undefined || value === null) {
      continue
    }

    const normalized = String(value).trim()
    if (normalized.length > 0) {
      payload[field] = normalized
    }
  }

  if (body.views !== undefined && body.views !== null && String(body.views).trim().length > 0) {
    payload.views = Number(body.views)
  }

  return payload
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
