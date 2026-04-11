const express = require('express')
const readinessController = require('../../controllers/readiness.controller')
const { requireAuth, requireRole } = require('../../middlewares/auth.middleware')

const router = express.Router()

router.use(requireAuth, requireRole('student'))

router.get('/', readinessController.checkReadiness)

module.exports = router
