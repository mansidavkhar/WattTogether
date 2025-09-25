/* eslint-disable react/prop-types */
import { useNavigate, useLocation } from 'react-router-dom';

const ProjectDescription = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const project = location.state?.project;

  if (!project) {
    return <div className="p-8 text-center">No project data available.</div>;
  }

  // Calculate days left for funding deadline safely
  const now = new Date();
  let daysLeft = 'N/A';
  const fundingDeadline = project.fundingDeadline || project.funding_deadline;
  if (fundingDeadline) {
    const deadline = new Date(fundingDeadline);
    const diff = deadline - now;
    daysLeft = diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;
  }

  // Format dates nicely
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  // Determine cover image URL safely, fallback to default image if none/invalid
  const coverImage =
    project.coverImageUrl || project.cover_image || '/default-image.jpg';

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="max-w-5xl mx-auto bg-white p-8 rounded-lg shadow-lg">
        {/* Page Title */}
        <h1 className="font-black font-[inter] text-3xl mb-4">
          {project.title || project.project_name || 'Project'}
        </h1>

        {/* Content wrapper with main text and sidebar */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Main content area */}
          <div className="flex-1">
            {/* Image placed between Project Title and Project Overview */}
            <img
              src={coverImage}
              alt={project.title || project.project_name || 'Project'}
              onError={(e) => {
                e.target.onerror = null; // Prevent infinite loop
                e.target.src = '/default-image.jpg';
              }}
              className="w-full my-4 rounded-md object-cover"
            />

            <h2 className="font-black font-[inter] text-2xl py-4">Project Overview</h2>
            <p className="mb-4">{project.description}</p>

            <h2 className="text-xl font-semibold mt-6 py-4">About the Entrepreneur</h2>
            <p className="mb-4">
              {project.aboutEntrepreneur || project.about_entrepreneur || 'N/A'}
            </p>
          </div>

          {/* Sidebar */}
          <div className="w-full md:w-72 flex-shrink-0">
            <button
              onClick={() => {
                navigate('/funder/selectamount', {
                  state: { projectId: project._id || project.id },
                });
              }}
              className="w-full bg-[#201E43] text-white py-3 rounded-lg text-lg font-medium hover:bg-[#423E80] transition mb-4"
            >
              Fund this project
            </button>

            <div className="bg-[#508C9B] text-white px-4 py-2 rounded-md mb-2">
              Funding Type: {project.fundingType || project.fund_type || 'N/A'}
            </div>
            <div className="bg-[#508C9B] text-white px-4 py-2 rounded-md mb-2">Days left: {daysLeft}</div>
            <div className="bg-[#508C9B] text-white px-4 py-2 rounded-md mb-2">
              Project deadline: {formatDate(project.projectDeadline || project.project_deadline)}
            </div>
            <div className="bg-[#508C9B] text-white px-4 py-2 rounded-md mb-2">
              Funding Goal: ₹ {project.fundingGoalINR?.toLocaleString() || project.amount?.toLocaleString() || 'N/A'}
            </div>
            <div className="bg-[#508C9B] text-white px-4 py-2 rounded-md">
              Funding Acquired: ₹ {project.amountRaisedINR?.toLocaleString() || project.fund_acquired?.toLocaleString() || 0}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDescription;
