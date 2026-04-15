const mongoose = require('mongoose')

const placementRecordSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    branch: { type: String, required: true, trim: true },
    batch: { type: String, required: true, trim: true },
    date: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    views: { type: Number, default: 0 },
    profile_pic: { type: String, default: '', trim: true },
    uid: { type: String, default: '', trim: true },
    content_markdown: { type: String, default: '', trim: true },
  },
  { timestamps: true },
)

module.exports = mongoose.model('PlacementRecord', placementRecordSchema)
