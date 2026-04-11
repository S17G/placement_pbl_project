const asyncHandler = require('../middlewares/asyncHandler');
const roadmapService = require('../services/roadmap.service');
const { validationResult } = require('express-validator');

// Generate a personalized roadmap
const generateRoadmap = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation errors',
            errors: errors.array()
        });
    }

    const userId = req.user.id;
    const roadmapData = req.body;

    const roadmap = await roadmapService.generateRoadmap(userId, roadmapData);

    res.status(201).json({
        success: true,
        message: 'Roadmap generated successfully',
        data: roadmap
    });
});

// Get all roadmaps for a user
const getUserRoadmaps = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const roadmaps = await roadmapService.getUserRoadmaps(userId);

    res.status(200).json({
        success: true,
        data: roadmaps
    });
});

// Get a specific roadmap by ID
const getRoadmapById = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const roadmapId = req.params.id;

    const roadmap = await roadmapService.getRoadmapById(userId, roadmapId);

    if (!roadmap) {
        return res.status(404).json({
            success: false,
            message: 'Roadmap not found'
        });
    }

    res.status(200).json({
        success: true,
        data: roadmap
    });
});

// Update a roadmap
const updateRoadmap = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation errors',
            errors: errors.array()
        });
    }

    const userId = req.user.id;
    const roadmapId = req.params.id;
    const updateData = req.body;

    const roadmap = await roadmapService.updateRoadmap(userId, roadmapId, updateData);

    if (!roadmap) {
        return res.status(404).json({
            success: false,
            message: 'Roadmap not found'
        });
    }

    res.status(200).json({
        success: true,
        message: 'Roadmap updated successfully',
        data: roadmap
    });
});

// Delete a roadmap
const deleteRoadmap = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const roadmapId = req.params.id;

    const deleted = await roadmapService.deleteRoadmap(userId, roadmapId);

    if (!deleted) {
        return res.status(404).json({
            success: false,
            message: 'Roadmap not found'
        });
    }

    res.status(200).json({
        success: true,
        message: 'Roadmap deleted successfully'
    });
});

// Get roadmap template by branch and year
const getTemplate = asyncHandler(async (req, res) => {
    const { branch, year } = req.params;

    if (!branch || !year) {
        return res.status(400).json({
            success: false,
            message: 'Branch and year are required'
        });
    }

    const template = roadmapService.getTemplate(branch, year);

    if (!template) {
        return res.status(404).json({
            success: false,
            message: `Roadmap template not found for ${branch} ${year}`
        });
    }

    res.status(200).json({
        success: true,
        data: template
    });
});

module.exports = {
    generateRoadmap,
    getUserRoadmaps,
    getRoadmapById,
    updateRoadmap,
    deleteRoadmap,
    getTemplate
};