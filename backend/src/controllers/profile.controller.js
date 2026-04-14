const User = require('../models/User')
const ApiResponse = require('../utils/ApiResponse')
const ApiError = require('../utils/ApiError')
const asyncHandler = require('../middlewares/asyncHandler')

// Get profile
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-passwordHash')
  if (!user) {
    throw new ApiError(404, 'User not found')
  }
  res.status(200).json(new ApiResponse(200, user, 'Profile fetched successfully'))
})

// Update profile
const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, prn, branch, year, cgpa, skills, achievements } = req.body

  const updateData = {}
  if (fullName !== undefined) updateData.fullName = fullName
  if (prn !== undefined) updateData.prn = prn
  if (branch !== undefined) updateData.branch = branch
  if (year !== undefined) updateData.year = year
  if (cgpa !== undefined) updateData.cgpa = parseFloat(cgpa)
  if (skills !== undefined) updateData.skills = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim())
  if (achievements !== undefined) updateData.achievements = achievements
  if (req.file) updateData.resume = req.file.path

  const user = await User.findByIdAndUpdate(req.user.id, updateData, { new: true }).select('-passwordHash')
  if (!user) {
    throw new ApiError(404, 'User not found')
  }
  res.status(200).json(new ApiResponse(200, user, 'Profile updated successfully'))
})

module.exports = {
  getProfile,
  updateProfile,
}