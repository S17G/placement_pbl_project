import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import http from '../api/http';

const RoadmapGeneratorPage = () => {
    const [formData, setFormData] = useState({
        currentSkills: [],
        targetRole: '',
        experienceLevel: 'beginner',
        timeAvailable: 'moderate',
        goals: []
    });
    const [roadmaps, setRoadmaps] = useState([]);
    const [selectedRoadmap, setSelectedRoadmap] = useState(null);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [skillInput, setSkillInput] = useState('');
    const [goalInput, setGoalInput] = useState('');

    useEffect(() => {
        fetchRoadmaps();
    }, []);

    const fetchRoadmaps = async () => {
        try {
            setLoading(true);
            const response = await http.get('/v1/roadmaps');
            setRoadmaps(response.data.data);
        } catch (error) {
            toast.error('Failed to fetch roadmaps');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const addSkill = () => {
        if (skillInput.trim() && !formData.currentSkills.includes(skillInput.trim())) {
            setFormData(prev => ({
                ...prev,
                currentSkills: [...prev.currentSkills, skillInput.trim()]
            }));
            setSkillInput('');
        }
    };

    const removeSkill = (skill) => {
        setFormData(prev => ({
            ...prev,
            currentSkills: prev.currentSkills.filter(s => s !== skill)
        }));
    };

    const addGoal = () => {
        if (goalInput.trim() && !formData.goals.includes(goalInput.trim())) {
            setFormData(prev => ({
                ...prev,
                goals: [...prev.goals, goalInput.trim()]
            }));
            setGoalInput('');
        }
    };

    const removeGoal = (goal) => {
        setFormData(prev => ({
            ...prev,
            goals: prev.goals.filter(g => g !== goal)
        }));
    };

    const handleGenerateRoadmap = async (e) => {
        e.preventDefault();
        try {
            setGenerating(true);
            const response = await http.post('/v1/roadmaps/generate', formData);
            toast.success('Roadmap generated successfully!');
            setRoadmaps(prev => [response.data.data, ...prev]);
            setSelectedRoadmap(response.data.data);
            // Reset form
            setFormData({
                currentSkills: [],
                targetRole: '',
                experienceLevel: 'beginner',
                timeAvailable: 'moderate',
                goals: []
            });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to generate roadmap');
        } finally {
            setGenerating(false);
        }
    };

    const updatePhaseStatus = async (roadmapId, phaseId, status) => {
        try {
            const roadmap = roadmaps.find(r => r.id === roadmapId);
            const updatedPhases = roadmap.phases.map(phase =>
                phase.id === phaseId ? { ...phase, status } : phase
            );

            const response = await http.put(`/v1/roadmaps/${roadmapId}`, {
                phases: updatedPhases
            });

            setRoadmaps(prev => prev.map(r =>
                r.id === roadmapId ? response.data.data : r
            ));

            if (selectedRoadmap?.id === roadmapId) {
                setSelectedRoadmap(response.data.data);
            }

            toast.success('Phase status updated!');
        } catch (error) {
            toast.error('Failed to update phase status');
        }
    };

    const deleteRoadmap = async (roadmapId) => {
        if (!confirm('Are you sure you want to delete this roadmap?')) return;

        try {
            await http.delete(`/v1/roadmaps/${roadmapId}`);
            setRoadmaps(prev => prev.filter(r => r.id !== roadmapId));
            if (selectedRoadmap?.id === roadmapId) {
                setSelectedRoadmap(null);
            }
            toast.success('Roadmap deleted successfully!');
        } catch (error) {
            toast.error('Failed to delete roadmap');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800';
            case 'in-progress': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Personalized Roadmap Generator</h1>
                <p className="text-gray-600">Create customized learning and career development roadmaps based on your goals and current skills.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Roadmap Generator Form */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Generate New Roadmap</h2>
                    <form onSubmit={handleGenerateRoadmap} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Target Role *
                            </label>
                            <input
                                type="text"
                                name="targetRole"
                                value={formData.targetRole}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="e.g., Frontend Developer, Data Scientist"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Experience Level *
                            </label>
                            <select
                                name="experienceLevel"
                                value={formData.experienceLevel}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                            >
                                <option value="beginner">Beginner (0-2 years)</option>
                                <option value="intermediate">Intermediate (2-5 years)</option>
                                <option value="experienced">Experienced (5+ years)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Time Available *
                            </label>
                            <select
                                name="timeAvailable"
                                value={formData.timeAvailable}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                            >
                                <option value="limited">Limited (5-10 hours/week)</option>
                                <option value="moderate">Moderate (10-20 hours/week)</option>
                                <option value="plenty">Plenty (20+ hours/week)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Current Skills
                            </label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={skillInput}
                                    onChange={(e) => setSkillInput(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    placeholder="Add a skill..."
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                                />
                                <button
                                    type="button"
                                    onClick={addSkill}
                                    className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
                                >
                                    Add
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {formData.currentSkills.map((skill, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800"
                                    >
                                        {skill}
                                        <button
                                            type="button"
                                            onClick={() => removeSkill(skill)}
                                            className="ml-1 text-orange-600 hover:text-orange-800"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Career Goals
                            </label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={goalInput}
                                    onChange={(e) => setGoalInput(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    placeholder="Add a goal..."
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGoal())}
                                />
                                <button
                                    type="button"
                                    onClick={addGoal}
                                    className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
                                >
                                    Add
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {formData.goals.map((goal, index) => (
                                    <span
                                        key={index}
                                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800"
                                    >
                                        {goal}
                                        <button
                                            type="button"
                                            onClick={() => removeGoal(goal)}
                                            className="ml-1 text-green-600 hover:text-green-800"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={generating}
                            className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {generating ? 'Generating...' : 'Generate Roadmap'}
                        </button>
                    </form>
                </div>

                {/* Roadmaps List */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Your Roadmaps</h2>
                    {loading ? (
                        <div className="text-center py-4">Loading...</div>
                    ) : roadmaps.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">
                            No roadmaps generated yet. Create your first roadmap!
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {roadmaps.map((roadmap) => (
                                <div
                                    key={roadmap.id}
                                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                        selectedRoadmap?.id === roadmap.id
                                            ? 'border-orange-500 bg-orange-50/70'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                    onClick={() => setSelectedRoadmap(roadmap)}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-medium text-gray-900">{roadmap.title}</h3>
                                            <p className="text-sm text-gray-600">
                                                Target: {roadmap.targetRole} • {roadmap.experienceLevel} • {roadmap.timeAvailable} time
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Created: {new Date(roadmap.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteRoadmap(roadmap.id);
                                            }}
                                            className="text-red-500 hover:text-red-700 text-sm"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Selected Roadmap Details */}
            {selectedRoadmap && (
                <div className="mt-8 bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold">{selectedRoadmap.title}</h2>
                        <div className="text-sm text-gray-600">
                            {selectedRoadmap.phases.filter(p => p.status === 'completed').length} of {selectedRoadmap.phases.length} phases completed
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {selectedRoadmap.phases.map((phase) => (
                            <div key={phase.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-medium text-gray-900">{phase.title}</h3>
                                    <select
                                        value={phase.status}
                                        onChange={(e) => updatePhaseStatus(selectedRoadmap.id, phase.id, e.target.value)}
                                        className={`text-xs px-2 py-1 rounded-full border-0 ${getStatusColor(phase.status)}`}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="in-progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{phase.description}</p>
                                <p className="text-xs text-orange-600 mb-3">Duration: {phase.duration}</p>
                                <ul className="text-sm text-gray-700 space-y-1">
                                    {phase.tasks.map((task, index) => (
                                        <li key={index} className="flex items-start">
                                            <span className="text-gray-400 mr-2">•</span>
                                            {task}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoadmapGeneratorPage;