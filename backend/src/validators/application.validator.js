const { body } = require('express-validator')

const applicationValidator = [
  body('companyName').trim().notEmpty().withMessage('Company name is required'),
  body('role').trim().notEmpty().withMessage('Role is required'),
  body('status')
    .trim()
    .isIn(['Applied', 'Interview', 'Rejected', 'Selected'])
    .withMessage('Status must be one of Applied, Interview, Rejected, Selected'),
  body('dateApplied')
    .trim()
    .isISO8601()
    .withMessage('Date applied must be a valid date'),
  body('notes').optional({ checkFalsy: true }).trim(),
]

module.exports = {
  applicationValidator,
}
