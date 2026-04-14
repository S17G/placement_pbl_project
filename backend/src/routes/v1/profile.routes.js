const express = require('express')
const multer = require('multer')
const { getProfile, updateProfile } = require('../controllers/profile.controller')
const { authenticate } = require('../middlewares/auth.middleware')
const validateRequest = require('../middlewares/validateRequest')

const router = express.Router()

const upload = multer({ dest: 'uploads/resumes/' })

router.use(authenticate)

router.get('/', getProfile)
router.put('/', upload.single('resume'), validateRequest, updateProfile)

module.exports = router