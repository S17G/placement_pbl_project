const express = require('express');
const router = express.Router();
const roadmapController = require('../../controllers/roadmap.controller');
const { validateGenerateRoadmap, validateUpdateRoadmap } = require('../../validators/roadmap.validator');
const { requireAuth } = require('../../middlewares/auth.middleware');

// Get roadmap template by branch and year (public, no auth required)
router.get('/template/:branch/:year', roadmapController.getTemplate);

// All other roadmap routes require authentication
router.use(requireAuth);

// Generate a new roadmap
router.post('/generate', validateGenerateRoadmap, roadmapController.generateRoadmap);

// Get all roadmaps for the authenticated user
router.get('/', roadmapController.getUserRoadmaps);

// Get a specific roadmap by ID
router.get('/:id', roadmapController.getRoadmapById);

// Update a roadmap
router.put('/:id', validateUpdateRoadmap, roadmapController.updateRoadmap);

// Delete a roadmap
router.delete('/:id', roadmapController.deleteRoadmap);

module.exports = router;