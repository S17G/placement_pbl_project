const mongoose = require('mongoose')

const placementRecordSchema = new mongoose.Schema(
  {
    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    package: { type: String, required: true, trim: true },
    eligibility: { type: String, required: true, trim: true },
    process: { type: String, required: true, trim: true },
  },
  { timestamps: true },
)

module.exports = mongoose.model('PlacementRecord', placementRecordSchema)
