const { body } = require('express-validator');

const validateGenerateRoadmap = [
    body('currentSkills')
        .optional()
        .isArray()
        .withMessage('Current skills must be an array'),
    body('currentSkills.*')
        .optional()
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Each skill must be a non-empty string'),
    body('targetRole')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Target role is required'),
    body('experienceLevel')
        .isIn(['beginner', 'intermediate', 'experienced'])
        .withMessage('Experience level must be beginner, intermediate, or experienced'),
    body('timeAvailable')
        .isIn(['limited', 'moderate', 'plenty'])
        .withMessage('Time available must be limited, moderate, or plenty'),
    body('goals')
        .optional()
        .isArray()
        .withMessage('Goals must be an array'),
    body('goals.*')
        .optional()
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Each goal must be a non-empty string')
];

const validateUpdateRoadmap = [
    body('title')
        .optional()
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Title must be a non-empty string'),
    body('phases')
        .optional()
        .isArray()
        .withMessage('Phases must be an array'),
    body('phases.*.status')
        .optional()
        .isIn(['pending', 'in-progress', 'completed'])
        .withMessage('Phase status must be pending, in-progress, or completed')
];

module.exports = {
    validateGenerateRoadmap,
    validateUpdateRoadmap
};