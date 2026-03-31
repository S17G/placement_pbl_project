const express = require('express')
const authRoutes = require('./auth.routes')
const adminRoutes = require('./admin.routes')
const placementRoutes = require('./placement.routes')
const discussionRoutes = require('./discussion.routes')
const faqRoutes = require('./faq.routes')
const resumeRoutes = require('./resume.routes')
const readinessRoutes = require('./readiness.routes')

const router = express.Router()

router.use('/auth', authRoutes)
router.use('/admin', adminRoutes)
router.use('/placements', placementRoutes)
router.use('/discussion', discussionRoutes)
router.use('/faq', faqRoutes)
router.use('/resumes', resumeRoutes)
router.use('/readiness', readinessRoutes)

module.exports = router
