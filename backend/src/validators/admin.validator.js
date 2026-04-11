const { body, param } = require('express-validator')

const updateRequestStatusValidator = [
  param('requestId').isMongoId().withMessage('Valid requestId is required'),
  body('status')
    .isIn(['accepted', 'declined'])
    .withMessage('Status must be either accepted or declined'),
]

const deleteUserValidator = [
  param('userId').isMongoId().withMessage('Valid userId is required'),
]

module.exports = {
  updateRequestStatusValidator,
  deleteUserValidator,
}
