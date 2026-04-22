const mongoose = require('mongoose')

const internshipRecordSchema = new mongoose.Schema(
  {
    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    package: { type: String, required: true, trim: true },
    eligibility: { type: String, required: true, trim: true },
    process: { type: String, required: true, trim: true },
    date: { type: String, default: '-', trim: true },
    cgpa_criteria: { type: String, default: '-', trim: true },
    ctc: { type: String, default: '-', trim: true },
    stipend: { type: String, default: '-', trim: true },
    activity: { type: String, default: '-', trim: true },
    branch: { type: String, default: '-', trim: true },
    venue: { type: String, default: '-', trim: true },
    skills_required: { type: String, default: '-', trim: true },
  },
  { timestamps: true },
)

module.exports = mongoose.model('InternshipRecord', internshipRecordSchema)