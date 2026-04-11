const fs = require('fs').promises;
const path = require('path');

const ROADMAPS_FILE = path.join(__dirname, '../../data/roadmaps.json');

// Ensure data directory and file exist
const ensureDataFile = async () => {
    const dataDir = path.dirname(ROADMAPS_FILE);
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir, { recursive: true });
    }

    try {
        await fs.access(ROADMAPS_FILE);
    } catch {
        await fs.writeFile(ROADMAPS_FILE, JSON.stringify([], null, 2));
    }
};

// Read roadmaps from file
const readRoadmaps = async () => {
    await ensureDataFile();
    const data = await fs.readFile(ROADMAPS_FILE, 'utf8');
    return JSON.parse(data);
};

// Write roadmaps to file
const writeRoadmaps = async (roadmaps) => {
    await ensureDataFile();
    await fs.writeFile(ROADMAPS_FILE, JSON.stringify(roadmaps, null, 2));
};

// Generate a personalized roadmap based on user input
const generateRoadmap = async (userId, roadmapData) => {
    const { currentSkills, targetRole, experienceLevel, timeAvailable, goals } = roadmapData;

    // Generate roadmap phases based on input
    const phases = generateRoadmapPhases(currentSkills, targetRole, experienceLevel, timeAvailable, goals);

    const roadmap = {
        id: Date.now().toString(),
        userId,
        title: `${targetRole} Preparation Roadmap`,
        currentSkills: currentSkills || [],
        targetRole,
        experienceLevel,
        timeAvailable,
        goals: goals || [],
        phases,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    const roadmaps = await readRoadmaps();
    roadmaps.push(roadmap);
    await writeRoadmaps(roadmaps);

    return roadmap;
};

// Generate roadmap phases based on user data
const generateRoadmapPhases = (currentSkills, targetRole, experienceLevel, timeAvailable, goals) => {
    const phases = [];

    // Phase 1: Foundation Building
    phases.push({
        id: 'foundation',
        title: 'Foundation Building',
        description: 'Build core skills and knowledge base',
        duration: '2-4 weeks',
        status: 'pending',
        tasks: [
            'Assess current skill gaps',
            'Learn fundamental concepts',
            'Complete basic tutorials and courses',
            'Build small projects to practice basics'
        ]
    });

    // Phase 2: Skill Development
    phases.push({
        id: 'skill-dev',
        title: 'Skill Development',
        description: 'Deepen expertise in required technologies',
        duration: '4-8 weeks',
        status: 'pending',
        tasks: [
            'Master key technologies for the role',
            'Complete intermediate/advanced courses',
            'Work on relevant projects',
            'Contribute to open source or personal projects'
        ]
    });

    // Phase 3: Resume and Portfolio
    phases.push({
        id: 'resume-portfolio',
        title: 'Resume & Portfolio',
        description: 'Create compelling resume and showcase work',
        duration: '1-2 weeks',
        status: 'pending',
        tasks: [
            'Update resume with relevant experience',
            'Build portfolio website',
            'Document projects and achievements',
            'Get feedback on resume and portfolio'
        ]
    });

    // Phase 4: Application Preparation
    phases.push({
        id: 'application-prep',
        title: 'Application Preparation',
        description: 'Prepare for job applications and interviews',
        duration: '2-3 weeks',
        status: 'pending',
        tasks: [
            'Research companies and job requirements',
            'Network on LinkedIn and professional platforms',
            'Prepare cover letters and application materials',
            'Practice coding interviews and technical questions'
        ]
    });

    // Phase 5: Interview Phase
    phases.push({
        id: 'interview',
        title: 'Interview Phase',
        description: 'Apply and interview for positions',
        duration: 'Ongoing',
        status: 'pending',
        tasks: [
            'Apply to relevant job openings',
            'Prepare for different interview types',
            'Practice behavioral and technical interviews',
            'Follow up on applications and interviews'
        ]
    });

    // Adjust phases based on experience level
    if (experienceLevel === 'beginner') {
        phases[0].duration = '4-6 weeks'; // More time for basics
        phases[1].duration = '6-10 weeks'; // More time for skill building
    } else if (experienceLevel === 'experienced') {
        phases[0].duration = '1-2 weeks'; // Quick assessment
        phases[1].duration = '3-6 weeks'; // Focused skill enhancement
    }

    // Adjust based on time available
    if (timeAvailable === 'limited') {
        phases.forEach(phase => {
            // Reduce duration estimates
            phase.duration = phase.duration.replace(/(\d+)-(\d+)/, (match, min, max) => `${Math.ceil(min/2)}-${Math.ceil(max/2)}`);
        });
    }

    return phases;
};

// Get all roadmaps for a user
const getUserRoadmaps = async (userId) => {
    const roadmaps = await readRoadmaps();
    return roadmaps.filter(roadmap => roadmap.userId === userId);
};

// Get a specific roadmap by ID
const getRoadmapById = async (userId, roadmapId) => {
    const roadmaps = await readRoadmaps();
    return roadmaps.find(roadmap => roadmap.userId === userId && roadmap.id === roadmapId);
};

// Update a roadmap
const updateRoadmap = async (userId, roadmapId, updateData) => {
    const roadmaps = await readRoadmaps();
    const index = roadmaps.findIndex(roadmap => roadmap.userId === userId && roadmap.id === roadmapId);

    if (index === -1) return null;

    roadmaps[index] = {
        ...roadmaps[index],
        ...updateData,
        updatedAt: new Date().toISOString()
    };

    await writeRoadmaps(roadmaps);
    return roadmaps[index];
};

// Delete a roadmap
const deleteRoadmap = async (userId, roadmapId) => {
    const roadmaps = await readRoadmaps();
    const filteredRoadmaps = roadmaps.filter(roadmap => !(roadmap.userId === userId && roadmap.id === roadmapId));

    if (filteredRoadmaps.length === roadmaps.length) return false;

    await writeRoadmaps(filteredRoadmaps);
    return true;
};

// Get roadmap template by branch and year
const getTemplate = (branch, year, target = 'placement') => {
    const roadmapTemplates = require('../data/roadmapTemplates');
    const key = `${branch.toLowerCase()}-${year}`;
    
    if (!roadmapTemplates[key]) {
        return null;
    }
    
    const template = roadmapTemplates[key];
    return {
        ...template,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
};

module.exports = {
    generateRoadmap,
    getUserRoadmaps,
    getRoadmapById,
    updateRoadmap,
    deleteRoadmap,
    getTemplate
};