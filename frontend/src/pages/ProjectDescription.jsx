// /* eslint-disable react/prop-types */
// import { useNavigate, useLocation } from 'react-router-dom';

// const ProjectDescription = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const project = location.state?.project;

//   if (!project) {
//     return <div className="p-8 text-center">No project data available.</div>;
//   }

//   // --- IMAGE URL FIX ---
//   const BACKEND_URL = 'http://localhost:5000';

//   const rawImagePath =
//     project.coverImage ||
//     project.cover_image ||
//     project.coverImageUrl ||
//     project.imageUrl ||
//     project.image ||
//     (project.images && project.images.length > 0 && project.images[0]);

//   const coverImage = rawImagePath
//     ? `${BACKEND_URL}${rawImagePath}`
//     : 'https://placehold.co/1200x800/201E43/FFFFFF?text=No+Image';
//   // --- END IMAGE URL FIX ---

//   // Calculate days left for funding deadline safely
//   const now = new Date();
//   let daysLeft = 'N/A';
//   const fundingDeadline = project.fundingDeadline || project.funding_deadline;
//   if (fundingDeadline) {
//     const deadline = new Date(fundingDeadline);
//     const diff = deadline - now;
//     daysLeft = diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;
//   }

//   // Format dates nicely
//   const formatDate = (date) => {
//     if (!date) return 'N/A';
//     return new Date(date).toLocaleDateString();
//   };

//   return (
//     <div className="p-8 bg-gray-100 min-h-screen">
//       <div className="max-w-5xl mx-auto bg-white p-8 rounded-lg shadow-lg">
//         {/* Page Title */}
//         <h1 className="font-black font-[inter] text-3xl mb-4">
//           {project.title || project.project_name || 'Project'}
//         </h1>

//         {/* Content wrapper with main text and sidebar */}
//         <div className="flex flex-col md:flex-row gap-8">
//           {/* Main content area */}
//           <div className="flex-1">
//             {/* Image placed between Project Title and Project Overview */}
//             <img
//               src={coverImage}
//               alt={project.title || project.project_name || 'Project'}
//               onError={(e) => {
//                 e.target.onerror = null; // Prevent infinite loop
//                 e.target.src = 'https://placehold.co/1200x800/201E43/FFFFFF?text=Invalid+Image';
//               }}
//               // Added h-96 for a consistent, larger hero image size
//               className="w-full h-100 my-4 rounded-md object-cover object-center"
//             />

//             <h2 className="font-black font-[inter] text-2xl py-4">Project Overview</h2>
//             <p className="mb-4">{project.description}</p>

//             <h2 className="text-xl font-semibold mt-6 py-4">About the Entrepreneur</h2>
//             <p className="mb-4">
//               {project.aboutEntrepreneur || project.about_entrepreneur || 'N/A'}
//             </p>
//           </div>

//           {/* Sidebar */}
//           <div className="w-full md:w-72 flex-shrink-0">
//             <button
//               onClick={() => {
//                 navigate('/funder/selectamount', {
//                   state: { projectId: project._id || project.id },
//                 });
//               }}
//               className="w-full bg-[#201E43] text-white py-3 rounded-lg text-lg font-medium hover:bg-[#423E80] transition mb-4"
//             >
//               Fund this project
//             </button>

//             <div className="bg-[#508C9B] text-white px-4 py-2 rounded-md mb-2">
//               Funding Type: {project.fundingType || project.fund_type || 'N/A'}
//             </div>
//             <div className="bg-[#508C9B] text-white px-4 py-2 rounded-md mb-2">Days left: {daysLeft}</div>
//             <div className="bg-[#508C9B] text-white px-4 py-2 rounded-md mb-2">
//               Project deadline: {formatDate(project.projectDeadline || project.project_deadline)}
//             </div>
//             <div className="bg-[#508C9B] text-white px-4 py-2 rounded-md mb-2">
//               Funding Goal: ₹ {project.fundingGoalINR?.toLocaleString() || project.amount?.toLocaleString() || 'N/A'}
//             </div>
//             <div className="bg-[#508C9B] text-white px-4 py-2 rounded-md">
//               Funding Acquired: ₹ {project.amountRaisedINR?.toLocaleString() || project.fund_acquired?.toLocaleString() || 0}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ProjectDescription;



import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';

const ProjectDescription = () => {
    const { id } = useParams();
    const location = useLocation();
    const [project, setProject] = useState(location.state?.project || null);
    const [isLoading, setIsLoading] = useState(!location.state?.project);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!project) {
            const fetchProject = async () => {
                try {
                    const response = await fetch(`http://localhost:5000/api/projects/${id}`);
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
    }, [id, project]);
    
    if (isLoading) {
        return <div className="p-8 text-center">Loading project...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-500">{error}</div>;
    }

    if (!project) {
        return <div className="p-8 text-center">Project data could not be loaded.</div>;
    }

    const BACKEND_URL = 'http://localhost:5000';
    const coverImage = project.coverImageUrl || project.cover_image ? `${BACKEND_URL}${project.coverImageUrl || project.cover_image}` : 'https://placehold.co/1200x800/201E43/FFFFFF?text=WattTogether';
    
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


