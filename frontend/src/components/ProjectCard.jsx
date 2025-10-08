/* eslint-disable react/prop-types */
import { useNavigate } from 'react-router-dom';

export default function ProjectCard({ project }) {
  const navigate = useNavigate();

  // FOR DEBUGGING: This will log the project data to your browser's console.
  console.log('Project Data Received:', project);

  const onViewClick = (e, projectData) => {
    navigate('/member/projectdescription', { state: { project: projectData } });
  };

  // --- IMAGE URL FIX ---
  // If your backend server is running on a different address, change this URL.
  const BACKEND_URL = 'http://localhost:5000';

  // Try all field names for cross-compatibility, now including `coverImage`.
  const rawImagePath =
    project.coverImage || // Added this based on your console log
    project.cover_image ||
    project.coverImageUrl ||
    project.imageUrl ||
    project.image ||
    (project.images && project.images.length > 0 && project.images[0]);

  // Prepend the backend URL to the relative image path.
  // If no image path is found, use a placeholder.
  const imageUrl = rawImagePath
    ? `${BACKEND_URL}${rawImagePath}`
    : 'https://placehold.co/600x400/201E43/FFFFFF?text=No+Image';
  // --- END IMAGE URL FIX ---

  // Use all possible title/name fields for robust display
  const projectTitle = project.title || project.project_name || 'Project';

  const fundType = project.fundingType || project.fund_type || 'N/A';
  const fundingGoal = project.fundingGoalINR || project.amount || 1; // avoid divide by zero
  const amountRaised = project.amountRaisedINR || project.fund_acquired || 0;
  const fundingPercent = Math.min(100, Math.round((amountRaised / fundingGoal) * 100));

  const fundingDeadline = project.fundingDeadline || project.funding_deadline;
  const now = new Date();
  let daysLeft = null;
  if (fundingDeadline) {
    const deadline = new Date(fundingDeadline);
    const diffMs = deadline - now;
    daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  return (
    // Added h-56 to ensure all cards have a consistent height
    <div className="w-lg flex h-75 bg-white rounded-2xl shadow-lg overflow-hidden border">
      {/* Left side image */}
      <div className="w-1/2">
        <img
          src={imageUrl}
          alt={projectTitle}
          className="w-full h-full object-cover object-center" // Added object-center
          onError={e => {
            e.target.onerror = null;
            e.target.src = 'https://placehold.co/600x400/201E43/FFFFFF?text=Invalid+Image';
          }}
        />
      </div>

      {/* Right side content */}
      <div className="w-1/2 bg-[#201E43] text-white p-4 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-2">{projectTitle}</h3>
          <p className="text-sm">
            <span className="font-semibold">Fund Type: </span>
            {fundType}
          </p>
          <p className="text-sm">
            <span className="font-semibold">Funding acquired: </span>
            {fundingPercent}%
          </p>
          <p className="text-sm">
            <span className="font-semibold">Impact Score: </span>
            92
          </p>
          <p className="text-sm">
            <span className="font-semibold">Days left for Funding: </span>
            {daysLeft !== null ? daysLeft : 'N/A'}
          </p>
        </div>
        {/* Button */}
        <button
          onClick={e => onViewClick(e, project)}
          className="mt-4 bg-[#508C9B] hover:bg-[#215461] text-white text-sm font-semibold py-2 rounded-lg w-full"
        >
          View Details
        </button>
      </div>
    </div>
  );
}

