const { body } = require('express-validator')

const placementRecordValidator = [
  body('name').trim().notEmpty(),
  body('company').trim().notEmpty(),
  body('role').trim().notEmpty(),
  body('branch').trim().notEmpty(),
  body('batch').trim().notEmpty(),
  body('date').trim().notEmpty(),
  body('email').trim().notEmpty(),
  body('views').optional({ nullable: true }).isInt({ min: 0 }),
  body('profile_pic').optional({ nullable: true }).trim(),
  body('uid').optional({ nullable: true }).trim(),
  body('content_markdown').optional({ nullable: true }).trim(),
]

module.exports = {
  placementRecordValidator,
}
