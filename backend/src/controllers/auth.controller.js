const env = require('../config/env')
const RegistrationRequest = require('../models/RegistrationRequest')
const User = require('../models/User')
const { comparePassword, createAccessToken, hashPassword } = require('../services/auth.service')
const ApiError = require('../utils/ApiError')
const ApiResponse = require('../utils/ApiResponse')

function toPublicUser(user) {
  return {
    id: user._id,
    fullName: user.fullName,
    prn: user.prn,
    email: user.email,
    role: user.role,
    branch: user.branch,
    year: user.year,
    cgpa: user.cgpa,
    skills: user.skills,
  }
}

async function registerRequest(req, res) {
  const {
    fullName,
    prn,
    email,
    password,
    branch = '',
    year = '',
    cgpa = null,
    skills = [],
  } = req.body

  const normalizedEmail = email.toLowerCase()

  const existingUser = await User.findOne({
    $or: [{ email: normalizedEmail }, { prn }],
  })

  if (existingUser?.isApproved) {
    throw new ApiError(409, 'User already approved. Please login.')
  }

  const passwordHash = await hashPassword(password)

  const payload = {
    fullName,
    prn,
    email: normalizedEmail,
    passwordHash,
    branch,
    year,
    cgpa: cgpa === '' ? null : Number(cgpa),
    skills: Array.isArray(skills)
      ? skills
      : String(skills)
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
    status: 'pending',
    decidedBy: null,
    decidedAt: null,
  }

  const existingRequest = await RegistrationRequest.findOne({
    $or: [{ email: normalizedEmail }, { prn }],
  })

  if (existingRequest) {
    existingRequest.fullName = payload.fullName
    existingRequest.prn = payload.prn
    existingRequest.email = payload.email
    existingRequest.passwordHash = payload.passwordHash
    existingRequest.branch = payload.branch
    existingRequest.year = payload.year
    existingRequest.cgpa = payload.cgpa
    existingRequest.skills = payload.skills
    existingRequest.status = 'pending'
    existingRequest.decidedBy = null
    existingRequest.decidedAt = null
    await existingRequest.save()
  } else {
    await RegistrationRequest.create(payload)
  }

  return res.status(201).json(
    new ApiResponse(
      201,
      'Registration request sent to admin. Please login after 24 hours for approval update.',
    ),
  )
}

async function login(req, res) {
  const { email, password } = req.body
  const normalizedEmail = email.toLowerCase()

  const user = await User.findOne({ email: normalizedEmail })

  if (!user) {
    const pendingRequest = await RegistrationRequest.findOne({ email: normalizedEmail })

    if (pendingRequest?.status === 'pending') {
      throw new ApiError(403, 'Registration request is still pending. Please login after 24 hours.')
    }

    if (pendingRequest?.status === 'declined') {
      throw new ApiError(403, 'Your registration request has been declined by admin.')
    }

    throw new ApiError(404, 'No account found. Please register first.')
  }

  if (!user.isApproved && user.role === 'student') {
    throw new ApiError(403, 'Your account is not approved yet.')
  }

  const isValidPassword = await comparePassword(password, user.passwordHash)
  if (!isValidPassword) {
    throw new ApiError(401, 'Invalid email or password.')
  }

  const token = createAccessToken({
    sub: String(user._id),
    email: user.email,
    role: user.role,
  })

  res.cookie(env.jwtCookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.nodeEnv === 'production',
    maxAge: 24 * 60 * 60 * 1000,
  })

  return res.status(200).json(
    new ApiResponse(200, 'Login successful', {
      token,
      user: toPublicUser(user),
    }),
  )
}

async function logout(req, res) {
  res.clearCookie(env.jwtCookieName)
  return res.status(200).json(new ApiResponse(200, 'Logout successful'))
}

module.exports = {
  registerRequest,
  login,
  logout,
}
