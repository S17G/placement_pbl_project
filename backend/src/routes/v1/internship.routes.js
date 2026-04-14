const express = require('express')
const internshipController = require('../../controllers/internship.controller')
const { requireAuth, requireRole } = require('../../middlewares/auth.middleware')
const validateRequest = require('../../middlewares/validateRequest')
const { internshipRecordValidator } = require('../../validators/internship.validator')

const router = express.Router()

router.get('/', requireAuth, internshipController.listInternships)
router.post('/', requireAuth, requireRole('admin'), internshipRecordValidator, validateRequest, internshipController.createInternship)
router.patch('/:recordId', requireAuth, requireRole('admin'), internshipRecordValidator, validateRequest, internshipController.updateInternship)
router.delete('/:recordId', requireAuth, requireRole('admin'), internshipController.deleteInternship)

module.exports = router