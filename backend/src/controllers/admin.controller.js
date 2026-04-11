const RegistrationRequest = require('../models/RegistrationRequest')
const User = require('../models/User')
const DiscussionPost = require('../models/DiscussionPost')
const FaqEntry = require('../models/FaqEntry')
const ResumeResource = require('../models/ResumeResource')
const ApiError = require('../utils/ApiError')
const ApiResponse = require('../utils/ApiResponse')

async function listRequests(req, res) {
  const requests = await RegistrationRequest.find()
    .sort({ createdAt: -1 })
    .select('fullName prn status createdAt decidedAt')
    .lean()

  return res.status(200).json(new ApiResponse(200, 'Registration requests fetched', requests))
}

async function updateRequestStatus(req, res) {
  const { requestId } = req.params
  const { status } = req.body

  const registrationRequest = await RegistrationRequest.findById(requestId)

  if (!registrationRequest) {
    throw new ApiError(404, 'Registration request not found')
  }

  registrationRequest.status = status
  registrationRequest.decidedBy = req.user?.sub || null
  registrationRequest.decidedAt = new Date()
  await registrationRequest.save()

  if (status === 'accepted') {
    await User.findOneAndUpdate(
      {
        $or: [
          { email: registrationRequest.email.toLowerCase() },
          { prn: registrationRequest.prn },
        ],
      },
      {
        $set: {
          fullName: registrationRequest.fullName,
          prn: registrationRequest.prn,
          email: registrationRequest.email.toLowerCase(),
          passwordHash: registrationRequest.passwordHash,
          role: 'student',
          branch: registrationRequest.branch || '',
          year: registrationRequest.year || '',
          cgpa: registrationRequest.cgpa ?? null,
          skills: registrationRequest.skills || [],
          isApproved: true,
        },
      },
      {
        upsert: true,
        returnDocument: 'after',
        setDefaultsOnInsert: true,
      },
    )
  }

  if (status === 'declined') {
    await User.findOneAndUpdate(
      { email: registrationRequest.email.toLowerCase() },
      { $set: { isApproved: false } },
      { returnDocument: 'after' },
    )
  }

  return res
    .status(200)
    .json(new ApiResponse(200, `Registration request ${status} successfully`))
}

async function listUsers(req, res) {
  const searchText = String(req.query.search || '').trim()
  const query = { role: 'student' }

  if (searchText) {
    const safeRegex = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    query.$or = [
      { fullName: safeRegex },
      { email: safeRegex },
      { prn: safeRegex },
      { branch: safeRegex },
      { year: safeRegex },
    ]
  }

  const users = await User.find(query)
    .select('fullName email prn branch year cgpa isApproved createdAt')
    .sort({ createdAt: -1 })
    .lean()

  return res.status(200).json(new ApiResponse(200, 'Users fetched', users))
}

async function deleteUser(req, res) {
  const { userId } = req.params

  const user = await User.findById(userId)
  if (!user) {
    throw new ApiError(404, 'User not found')
  }

  if (user.role === 'admin') {
    throw new ApiError(403, 'Admin users cannot be deleted')
  }

  await Promise.all([
    DiscussionPost.deleteMany({ author: user._id }),
    FaqEntry.deleteMany({ author: user._id }),
    ResumeResource.deleteMany({ author: user._id }),
    RegistrationRequest.deleteMany({ $or: [{ email: user.email }, { prn: user.prn }] }),
  ])

  await user.deleteOne()

  return res.status(200).json(new ApiResponse(200, 'User deleted successfully'))
}

module.exports = {
  listRequests,
  updateRequestStatus,
  listUsers,
  deleteUser,
}
