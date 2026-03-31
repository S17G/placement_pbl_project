const { body } = require('express-validator')

const registerValidator = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('prn').trim().notEmpty().withMessage('PRN is required'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .customSanitizer((value) => String(value).toLowerCase()),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('branch').optional().isString(),
  body('year').optional().isString(),
  body('cgpa').optional().isFloat({ min: 0, max: 10 }),
  body('skills').optional(),
]

const loginValidator = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .customSanitizer((value) => String(value).toLowerCase()),
  body('password').notEmpty().withMessage('Password is required'),
]

module.exports = {
  registerValidator,
  loginValidator,
}
