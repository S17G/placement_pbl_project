const RegistrationRequest = require('../models/RegistrationRequest')

function listRegistrationRequests() {
  return RegistrationRequest.find().sort({ createdAt: -1 }).lean()
}

function createRegistrationRequest(payload) {
  return RegistrationRequest.create(payload)
}

async function updateRegistrationStatus(requestId, status, decidedBy) {
  return RegistrationRequest.findByIdAndUpdate(
    requestId,
    {
      $set: {
        status,
        decidedBy,
        decidedAt: new Date(),
      },
    },
    { returnDocument: 'after' },
  )
}

module.exports = {
  listRegistrationRequests,
  createRegistrationRequest,
  updateRegistrationStatus,
}
