const DiscussionPost = require('../models/DiscussionPost')
const mongoose = require('mongoose')
const ApiError = require('../utils/ApiError')
const ApiResponse = require('../utils/ApiResponse')

const DISCUSSION_TTL_MS = 72 * 60 * 60 * 1000

function serializeDiscussion(post, currentUserId) {
  const author = post.author || {}

  return {
    _id: post._id,
    message: post.message,
    postedAt: post.createdAt,
    authorId: author._id,
    authorName: author.fullName || 'Unknown User',
    authorYear: author.year || '',
    authorBranch: author.branch || '',
    authorEmail: author.email || '',
    isOwner: String(author._id || '') === String(currentUserId || ''),
  }
}

async function listDiscussionPosts(req, res) {
  const cutoffDate = new Date(Date.now() - DISCUSSION_TTL_MS)

  await DiscussionPost.deleteMany({ createdAt: { $lt: cutoffDate } })

  const query = { createdAt: { $gte: cutoffDate } }
  if (String(req.query.mine || '') === 'true') {
    query.author = req.user.sub
  }

  const posts = await DiscussionPost.find(query)
    .populate('author', 'fullName year branch email')
    .sort({ createdAt: -1 })

  const data = posts.map((post) => serializeDiscussion(post, req.user.sub))

  return res.status(200).json(new ApiResponse(200, 'Discussion posts fetched', data))
}

async function createDiscussionPost(req, res) {
  const message = String(req.body.message || '').trim()

  if (!message) {
    throw new ApiError(400, 'Message is required')
  }

  const created = await DiscussionPost.create({
    author: req.user.sub,
    message,
  })

  const populated = await DiscussionPost.findById(created._id).populate(
    'author',
    'fullName year branch email',
  )

  return res
    .status(201)
    .json(new ApiResponse(201, 'Discussion post created', serializeDiscussion(populated, req.user.sub)))
}

async function updateDiscussionPost(req, res) {
  const { postId } = req.params
  if (!mongoose.isValidObjectId(postId)) {
    throw new ApiError(400, 'Invalid post id')
  }
  const message = String(req.body.message || '').trim()

  if (!message) {
    throw new ApiError(400, 'Message is required')
  }

  const post = await DiscussionPost.findById(postId)
  if (!post) {
    throw new ApiError(404, 'Discussion post not found')
  }

  if (String(post.author) !== String(req.user.sub)) {
    throw new ApiError(403, 'You can only edit your own discussion posts')
  }

  post.message = message
  await post.save()

  const populated = await DiscussionPost.findById(post._id).populate(
    'author',
    'fullName year branch email',
  )

  return res
    .status(200)
    .json(new ApiResponse(200, 'Discussion post updated', serializeDiscussion(populated, req.user.sub)))
}

async function deleteDiscussionPost(req, res) {
  const { postId } = req.params
  if (!mongoose.isValidObjectId(postId)) {
    throw new ApiError(400, 'Invalid post id')
  }
  const post = await DiscussionPost.findById(postId)

  if (!post) {
    throw new ApiError(404, 'Discussion post not found')
  }

  if (String(post.author) !== String(req.user.sub)) {
    throw new ApiError(403, 'You can only delete your own discussion posts')
  }

  await post.deleteOne()

  return res.status(200).json(new ApiResponse(200, 'Discussion post deleted'))
}

module.exports = {
  listDiscussionPosts,
  createDiscussionPost,
  updateDiscussionPost,
  deleteDiscussionPost,
}
