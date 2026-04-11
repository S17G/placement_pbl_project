const express = require('express')
const faqController = require('../../controllers/faq.controller')
const { requireAuth, requireRole } = require('../../middlewares/auth.middleware')

const router = express.Router()

router.use(requireAuth, requireRole('student'))

router.get('/', faqController.listFaqEntries)
router.post('/', faqController.createFaqEntry)
router.patch('/:faqId', faqController.updateFaqEntry)
router.delete('/:faqId', faqController.deleteFaqEntry)

module.exports = router
