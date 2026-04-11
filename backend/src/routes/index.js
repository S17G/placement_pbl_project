const express = require('express')
const { healthCheck } = require('../controllers/health.controller')
const v1Routes = require('./v1')

const router = express.Router()

router.get('/health', healthCheck)
router.use('/v1', v1Routes)

module.exports = router
