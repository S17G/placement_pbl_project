const ResumeResource = require('../models/ResumeResource')
const mongoose = require('mongoose')
const ApiError = require('../utils/ApiError')
const ApiResponse = require('../utils/ApiResponse')

function serializeResume(resume, currentUserId) {
  const author = resume.author || {}

  return {
    _id: resume._id,
    studentName: resume.studentName,
    year: resume.year,
    company: resume.company,
    placementDate: resume.placementDate,
    fileUrl: resume.fileUrl,
    postedAt: resume.createdAt,
    authorId: author._id,
    authorName: author.fullName || '',
    isOwner: String(author._id || '') === String(currentUserId || ''),
  }
}

async function listResumes(req, res) {
  const query = {}
  if (String(req.query.mine || '') === 'true') {
    query.author = req.user.sub
  }

  const resumes = await ResumeResource.find(query)
    .populate('author', 'fullName')
    .sort({ createdAt: -1 })

  const data = resumes.map((resume) => serializeResume(resume, req.user.sub))

  return res.status(200).json(new ApiResponse(200, 'Resume resources fetched', data))
}

async function uploadResume(req, res) {
  const file = req.file

  if (!file) {
    throw new ApiError(400, 'Resume PDF file is required')
  }

  if (file.mimetype !== 'application/pdf') {
    throw new ApiError(400, 'Only PDF resumes are allowed')
  }

  const studentName = String(req.body.studentName || req.body.name || '').trim()
  const year = String(req.body.year || '').trim()
  const company = String(req.body.company || '').trim()
  const placementDate = String(req.body.placementDate || '').trim()

  if (!studentName || !year || !company || !placementDate) {
    throw new ApiError(400, 'Please provide all resume details')
  }

  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/resumes/${file.filename}`

  const created = await ResumeResource.create({
    author: req.user.sub,
    studentName,
    year,
    company,
    placementDate: new Date(placementDate),
    fileUrl,
  })

  return res.status(201).json(new ApiResponse(201, 'Resume uploaded successfully', created))
}

async function updateResume(req, res) {
  const { resumeId } = req.params
  if (!mongoose.isValidObjectId(resumeId)) {
    throw new ApiError(400, 'Invalid resume id')
  }
  const studentName = String(req.body.studentName || req.body.name || '').trim()
  const year = String(req.body.year || '').trim()
  const company = String(req.body.company || '').trim()
  const placementDate = String(req.body.placementDate || '').trim()

  if (!studentName || !year || !company || !placementDate) {
    throw new ApiError(400, 'Please provide all resume details')
  }

  const resume = await ResumeResource.findById(resumeId)
  if (!resume) {
    throw new ApiError(404, 'Resume not found')
  }

  if (!resume.author.equals(req.user.sub)) {
    throw new ApiError(403, 'You can only edit your own resume entry')
  }

  resume.studentName = studentName
  resume.year = year
  resume.company = company
  resume.placementDate = new Date(placementDate)
  await resume.save()

  const populated = await ResumeResource.findById(resume._id).populate('author', 'fullName')

  return res
    .status(200)
    .json(new ApiResponse(200, 'Resume entry updated', serializeResume(populated, req.user.sub)))
}

async function deleteResume(req, res) {
  const { resumeId } = req.params
  if (!mongoose.isValidObjectId(resumeId)) {
    throw new ApiError(400, 'Invalid resume id')
  }
  const resume = await ResumeResource.findById(resumeId)

  if (!resume) {
    throw new ApiError(404, 'Resume not found')
  }

  if (!resume.author.equals(req.user.sub)) {
    throw new ApiError(403, 'You can only delete your own resume entry')
  }

  await resume.deleteOne()

  return res.status(200).json(new ApiResponse(200, 'Resume entry deleted'))
}

module.exports = {
  listResumes,
  uploadResume,
  updateResume,
  deleteResume,
}
