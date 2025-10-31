/* eslint-disable react/prop-types */
import { useNavigate } from 'react-router-dom';

export default function ProjectCard({ project }) {
  const navigate = useNavigate();

  const onViewClick = () => {
    navigate(`/member/project/${project._id}`, { state: { project } });
  };


  const rawImagePath = project.coverImage || project.coverImageUrl || project.cover_image;
  const imageUrl = rawImagePath
    ? `${import.meta.env.VITE_API_GATEWAY_URL}${rawImagePath}`
    : `https://placehold.co/600x400/2d3748/FFFFFF?text=${encodeURIComponent(project.title || 'Project')}`;

  const title = project.title || 'Project';
  const fundType = project.fundingType || 'N/A';
  const status = project.status || 'Ongoing';

  const fundingGoal = project.fundingGoalINR || 1;
  const amountRaised = project.amountRaisedINR || 0;
  const fundingPercent = Math.min(100, Math.round((amountRaised / fundingGoal) * 100));

  return (
    <div className="w-lg flex h-75 bg-white rounded-2xl shadow-lg overflow-hidden border">
      <div className="w-1/2">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover object-center"
          onError={e => {
            e.target.onerror = null;
            e.target.src = 'https://placehold.co/600x400/201E43/FFFFFF?text=Invalid+Image';
          }}
        />
      </div>
      <div className="w-1/2 bg-[#2d3748] text-white p-4 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
           <p className="text-sm">
            <span className="font-semibold">Status: </span>
            <span className="capitalize">{status}</span>
          </p>
          <p className="text-sm">
            <span className="font-semibold">Fund Type: </span>
            {fundType}
          </p>
          <p className="text-sm">
            <span className="font-semibold">Funding: </span>
            {fundingPercent}% of goal met
          </p>
           <p className="text-sm">
            <span className="font-semibold">Backers: </span>
            {project.backersCount || 0}
          </p>
        </div>
        <button
          onClick={onViewClick}
          className="mt-4 bg-[#508C9B] hover:bg-[#215461] text-white text-sm font-semibold py-2 rounded-lg w-full"
        >
          View Project
        </button>
      </div>
    </div>
  );
}


