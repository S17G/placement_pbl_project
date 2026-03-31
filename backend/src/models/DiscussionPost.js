const mongoose = require('mongoose')

const discussionPostSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true },
)

discussionPostSchema.index({ createdAt: 1 }, { expireAfterSeconds: 72 * 60 * 60 })

module.exports = mongoose.model('DiscussionPost', discussionPostSchema)
