const express = require('express')
const analyticsController = require('../../controllers/analytics.controller')
const { requireAuth } = require('../../middlewares/auth.middleware')

const router = express.Router()

router.use(requireAuth)

router.get('/placement-stats', analyticsController.getPlacementStats)

module.exports = router
