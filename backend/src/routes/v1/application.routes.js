const express = require('express')
const applicationController = require('../../controllers/application.controller')
const { requireAuth } = require('../../middlewares/auth.middleware')
const validateRequest = require('../../middlewares/validateRequest')
const { applicationValidator } = require('../../validators/application.validator')

const router = express.Router()

router.get('/', requireAuth, applicationController.listApplications)
router.post('/', requireAuth, applicationValidator, validateRequest, applicationController.createApplication)
router.put('/:applicationId', requireAuth, applicationValidator, validateRequest, applicationController.updateApplication)
router.delete('/:applicationId', requireAuth, applicationController.deleteApplication)

module.exports = router
