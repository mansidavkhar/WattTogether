import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';

const ProjectDescription = () => {
    const { id } = useParams();
    const location = useLocation();
    const [project, setProject] = useState(location.state?.project || null);
    const [isLoading, setIsLoading] = useState(!location.state?.project);
    const [error, setError] = useState('');

    const API_URL = import.meta.env.VITE_API_GATEWAY_URL;

    useEffect(() => {
        if (!project) {
            const fetchProject = async () => {
                try {
                    const response = await fetch(`${API_URL}/projects/${id}`);
                    const data = await response.json();
                    if (data.success) {
                        setProject(data.project);
                    } else {
                        setError(data.message || 'Project not found.');
                    }
                } catch (err) {
                    setError('Failed to fetch project data.');
                } finally {
                    setIsLoading(false);
                }
            };
            fetchProject();
        }
    }, [id, project, API_URL]);

    if (isLoading) {
        return <div className="p-8 text-center">Loading project...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-500">{error}</div>;
    }

    if (!project) {
        return <div className="p-8 text-center">Project data could not be loaded.</div>;
    }

    const BACKEND_URL = API_URL.replace(/\/api\/?$/, '');

    const coverImage = project.coverImageUrl || project.cover_image
        ? `${BACKEND_URL}${project.coverImageUrl || project.cover_image}`
        : 'https://placehold.co/1200x800/201E43/FFFFFF?text=WattTogether';

    // FIX: Handle both original and mapped property names
    const fundingGoal = project.fundingGoalINR || project.amount || 0;
    const amountRaised = project.amountRaisedINR || 0;
    const fundingPercent = Math.min(100, Math.round((amountRaised / (fundingGoal || 1)) * 100)); // Avoid division by zero

    return (
        <div className="bg-gray-50 min-h-screen p-4 sm:p-8 font-sans">
            <div className="max-w-6xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Main Content */}
                    <div className="w-full md:w-2/3">
                        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">{project.title || project.project_name}</h1>
                        <div className="relative w-full h-80 sm:h-96 mb-6 rounded-lg overflow-hidden shadow-lg">
                            <img
                                src={coverImage}
                                alt={project.title}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/1200x800/201E43/FFFFFF?text=Invalid+Image'; }}
                            />
                        </div>

                        {/* Milestone & Voting Section */}
                        <div className="mb-6">
                            <h2 className="text-2xl font-semibold border-b-2 border-gray-200 pb-2 mb-3">Project Milestones & Governance</h2>
                            <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
                                <p className="font-semibold text-blue-800">DAO Voting and Milestone Tracking</p>
                                <p className="text-blue-700">This section will soon allow you to view project milestones, review evidence, and vote on releasing funds. This feature is under active development.</p>
                            </div>
                        </div>

                        <div className="space-y-6 text-gray-700 leading-relaxed">
                            <div>
                                <h2 className="text-2xl font-semibold border-b-2 border-gray-200 pb-2 mb-3">Project Overview</h2>
                                <p>{project.description}</p>
                            </div>
                            <div>
                                <h2 className="text-2xl font-semibold border-b-2 border-gray-200 pb-2 mb-3">About the Entrepreneur</h2>
                                <p>{project.aboutEntrepreneur || project.about_entrepreneur}</p>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="w-full md:w-1/3">
                        <div className="bg-gray-100 p-6 rounded-lg shadow-inner space-y-4">
                            <div className="bg-green-100 border-l-4 border-green-500 text-green-800 p-4 rounded-r-lg text-center">
                                <p className="font-bold text-lg">Project Fully Funded!</p>
                            </div>
                            <div className="bg-white p-4 rounded-md shadow-sm text-center">
                                <p className="text-gray-600">Funding Type</p>
                                <p className="font-bold text-lg">{project.fundingType || project.fund_type}</p>
                            </div>
                            <div className="bg-white p-4 rounded-md shadow-sm text-center">
                                <p className="text-gray-600">Project Deadline</p>
                                <p className="font-bold text-lg">{project.projectDeadline ? new Date(project.projectDeadline).toLocaleDateString() : 'N/A'}</p>
                            </div>
                            <div className="bg-white p-4 rounded-md shadow-sm text-center">
                                <p className="text-gray-600">Total Funding Goal</p>
                                <p className="font-bold text-lg">₹{fundingGoal.toLocaleString()}</p>
                            </div>
                            <div className="bg-white p-4 rounded-md shadow-sm text-center">
                                <p className="text-gray-600">Total Funding Acquired ({fundingPercent}%)</p>
                                <p className="font-bold text-lg">₹{amountRaised.toLocaleString()}</p>
                            </div>
                            <div className="bg-white p-4 rounded-md shadow-sm text-center">
                                <p className="text-gray-600">Number of Backers</p>
                                <p className="font-bold text-lg">{project.backersCount}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectDescription;
