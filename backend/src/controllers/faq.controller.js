const FaqEntry = require('../models/FaqEntry')
const mongoose = require('mongoose')
const ApiError = require('../utils/ApiError')
const ApiResponse = require('../utils/ApiResponse')

function serializeFaq(entry, currentUserId) {
  const author = entry.author || {}

  return {
    _id: entry._id,
    question: entry.question,
    answer: entry.answer,
    postedAt: entry.createdAt,
    authorId: author._id,
    authorName: author.fullName || 'Unknown User',
    authorYear: author.year || '',
    authorBranch: author.branch || '',
    authorEmail: author.email || '',
    isOwner: String(author._id || '') === String(currentUserId || ''),
  }
}

async function listFaqEntries(req, res) {
  const query = {}
  if (String(req.query.mine || '') === 'true') {
    query.author = req.user.sub
  }

  const faqs = await FaqEntry.find(query)
    .populate('author', 'fullName year branch email')
    .sort({ createdAt: -1 })

  const data = faqs.map((entry) => serializeFaq(entry, req.user.sub))

  return res.status(200).json(new ApiResponse(200, 'FAQ entries fetched', data))
}

async function createFaqEntry(req, res) {
  const question = String(req.body.question || '').trim()
  const answer = String(req.body.answer || '').trim()

  if (!question || !answer) {
    throw new ApiError(400, 'Question and answer are required')
  }

  const created = await FaqEntry.create({
    author: req.user.sub,
    question,
    answer,
  })

  const populated = await FaqEntry.findById(created._id).populate('author', 'fullName year branch email')

  return res
    .status(201)
    .json(new ApiResponse(201, 'FAQ entry created', serializeFaq(populated, req.user.sub)))
}

async function updateFaqEntry(req, res) {
  const { faqId } = req.params
  if (!mongoose.isValidObjectId(faqId)) {
    throw new ApiError(400, 'Invalid FAQ id')
  }
  const question = String(req.body.question || '').trim()
  const answer = String(req.body.answer || '').trim()

  if (!question || !answer) {
    throw new ApiError(400, 'Question and answer are required')
  }

  const entry = await FaqEntry.findById(faqId)
  if (!entry) {
    throw new ApiError(404, 'FAQ entry not found')
  }

  if (String(entry.author) !== String(req.user.sub)) {
    throw new ApiError(403, 'You can only edit your own FAQ entries')
  }

  entry.question = question
  entry.answer = answer
  await entry.save()

  const populated = await FaqEntry.findById(entry._id).populate('author', 'fullName year branch email')

  return res
    .status(200)
    .json(new ApiResponse(200, 'FAQ entry updated', serializeFaq(populated, req.user.sub)))
}

async function deleteFaqEntry(req, res) {
  const { faqId } = req.params
  if (!mongoose.isValidObjectId(faqId)) {
    throw new ApiError(400, 'Invalid FAQ id')
  }
  const entry = await FaqEntry.findById(faqId)

  if (!entry) {
    throw new ApiError(404, 'FAQ entry not found')
  }

  if (String(entry.author) !== String(req.user.sub)) {
    throw new ApiError(403, 'You can only delete your own FAQ entries')
  }

  await entry.deleteOne()

  return res.status(200).json(new ApiResponse(200, 'FAQ entry deleted'))
}

module.exports = {
  listFaqEntries,
  createFaqEntry,
  updateFaqEntry,
  deleteFaqEntry,
}
