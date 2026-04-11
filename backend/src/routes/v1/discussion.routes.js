const express = require('express')
const discussionController = require('../../controllers/discussion.controller')
const { requireAuth, requireRole } = require('../../middlewares/auth.middleware')

const router = express.Router()

router.use(requireAuth, requireRole('student'))

router.get('/', discussionController.listDiscussionPosts)
router.post('/', discussionController.createDiscussionPost)
router.patch('/:postId', discussionController.updateDiscussionPost)
router.delete('/:postId', discussionController.deleteDiscussionPost)

module.exports = router
