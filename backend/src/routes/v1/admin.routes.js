const express = require('express')
const adminController = require('../../controllers/admin.controller')
const { requireAuth, requireRole } = require('../../middlewares/auth.middleware')
const validateRequest = require('../../middlewares/validateRequest')
const {
	updateRequestStatusValidator,
	deleteUserValidator,
} = require('../../validators/admin.validator')

const router = express.Router()

router.use(requireAuth, requireRole('admin'))

router.get('/registration-requests', adminController.listRequests)
router.get('/users', adminController.listUsers)
router.patch(
	'/registration-requests/:requestId/status',
	updateRequestStatusValidator,
	validateRequest,
	adminController.updateRequestStatus,
)
router.delete('/users/:userId', deleteUserValidator, validateRequest, adminController.deleteUser)

module.exports = router
