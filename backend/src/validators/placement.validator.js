const { body } = require('express-validator')

const placementRecordValidator = [
  body('company').trim().notEmpty(),
  body('role').trim().notEmpty(),
  body('package').trim().notEmpty(),
  body('eligibility').trim().notEmpty(),
  body('process').trim().notEmpty(),
]

module.exports = {
  placementRecordValidator,
}
