const express = require('express')
const multer = require('multer')
const fs = require('fs')
const path = require('path')
const resumeController = require('../../controllers/resume.controller')
const { requireAuth, requireRole } = require('../../middlewares/auth.middleware')

const router = express.Router()

const upload = multer({
	storage: multer.diskStorage({
		destination: (req, file, cb) => {
			const targetDir = path.join(process.cwd(), 'uploads', 'resumes')
			fs.mkdirSync(targetDir, { recursive: true })
			cb(null, targetDir)
		},
		filename: (req, file, cb) => {
			const safeExt = path.extname(file.originalname || '.pdf') || '.pdf'
			cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`)
		},
	}),
	limits: {
		fileSize: 10 * 1024 * 1024,
	},
})

router.use(requireAuth, requireRole('student'))

router.get('/', resumeController.listResumes)
router.post('/upload', upload.single('resume'), resumeController.uploadResume)
router.patch('/:resumeId', resumeController.updateResume)
router.delete('/:resumeId', resumeController.deleteResume)

module.exports = router
