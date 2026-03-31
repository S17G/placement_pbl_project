const express = require('express')
const placementController = require('../../controllers/placement.controller')
const { requireAuth, requireRole } = require('../../middlewares/auth.middleware')
const validateRequest = require('../../middlewares/validateRequest')
const { placementRecordValidator } = require('../../validators/placement.validator')

const router = express.Router()

router.get('/', requireAuth, placementController.listPlacements)
router.post('/', requireAuth, requireRole('admin'), placementRecordValidator, validateRequest, placementController.createPlacement)
router.patch('/:recordId', requireAuth, requireRole('admin'), placementRecordValidator, validateRequest, placementController.updatePlacement)
router.delete('/:recordId', requireAuth, requireRole('admin'), placementController.deletePlacement)

module.exports = router
