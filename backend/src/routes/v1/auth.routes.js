const express = require('express')
const authController = require('../../controllers/auth.controller')
const validateRequest = require('../../middlewares/validateRequest')
const { loginValidator, registerValidator } = require('../../validators/auth.validator')

const router = express.Router()

router.post('/register-request', registerValidator, validateRequest, authController.registerRequest)
router.post('/login', loginValidator, validateRequest, authController.login)
router.post('/logout', authController.logout)

module.exports = router
