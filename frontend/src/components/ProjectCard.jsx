// /* eslint-disable react/prop-types */

// import {useNavigate} from 'react-router-dom'

// export default function ProjectCard({project}) {
//   const navigate = useNavigate();

//   const onViewClick = (e, projectData)=>{
//     navigate("/member/projectdescription", { state: { project: projectData } });
//   }
//     return (
//       <div className="w-lg flex bg-white rounded-2xl shadow-lg overflow-hidden border">
//         {/* Left side image */}
//         <div className="w-1/2">
//           <img
//             src={project.cover_image}
//             alt="Project"
//             className="w-full h-full object-cover"
//           />
//         </div>
  
//         {/* Right side content */}
//         <div className="w-1/2 bg-[#201E43] text-white p-4 flex flex-col justify-between">
//           <div>
//             <h3 className="text-lg font-semibold mb-2">{project.project_name}</h3>
//             <p className="text-sm">
//               <span className="font-semibold">Fund Type: </span>{project.fund_type}
//             </p>
//             <p className="text-sm">
//               <span className="font-semibold">Funding acquired: </span>90%
//             </p>
//             <p className="text-sm">
//               <span className="font-semibold">Impact Score: </span>92
//             </p>
//             <p className="text-sm">
//               <span className="font-semibold">Days left for Funding: </span> {Math.ceil((new Date(project.funding_deadline) - new Date() )/ (1000 * 60 * 60 * 24))}
//             </p>
//           </div>
  
//           {/* Button */}
//          <button onClick={(e)=>onViewClick(e, project)} className="mt-4 bg-[#508C9B] hover:bg-[#215461] text-white text-sm font-semibold py-2 rounded-lg w-full">
//             View Details
//           </button>
//         </div>
//       </div>
//     );
//   }








/* eslint-disable react/prop-types */

import { useNavigate } from 'react-router-dom';

export default function ProjectCard({ project }) {
  const navigate = useNavigate();

  const onViewClick = (e, projectData) => {
    navigate('/member/projectdescription', { state: { project: projectData } });
  };

  // Use the correct fields from your schema
  const fundingGoal = project.fundingGoalINR || 1; // avoid divide by zero
  const amountRaised = project.amountRaisedINR || 0;
  const fundingPercent = Math.min(100, Math.round((amountRaised / fundingGoal) * 100));

  const now = new Date();
  let daysLeft = null;
  if (project.fundingDeadline) {
    const deadline = new Date(project.fundingDeadline);
    const diffMs = deadline - now;
    daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  return (
    <div className="w-lg flex bg-white rounded-2xl shadow-lg overflow-hidden border">
      {/* Left side image */}
      <div className="w-1/2">
        <img
          src={project.coverImageUrl || '/default-image.jpg'}
          alt={project.title || 'Project'}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Right side content */}
      <div className="w-1/2 bg-[#201E43] text-white p-4 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-semibold mb-2">{project.title}</h3>
          <p className="text-sm">
            <span className="font-semibold">Fund Type: </span>
            {project.fundingType}
          </p>
          <p className="text-sm">
            <span className="font-semibold">Funding acquired: </span>
            {fundingPercent}%
          </p>
          <p className="text-sm">
            <span className="font-semibold">Impact Score: </span>
            {/* Placeholder - implement if you track impact score */}
            92
          </p>
          <p className="text-sm">
            <span className="font-semibold">Days left for Funding: </span>
            {daysLeft !== null ? daysLeft : 'N/A'}
          </p>
        </div>

        {/* Button */}
        <button
          onClick={(e) => onViewClick(e, project)}
          className="mt-4 bg-[#508C9B] hover:bg-[#215461] text-white text-sm font-semibold py-2 rounded-lg w-full"
        >
          View Details
        </button>
      </div>
    </div>
  );
}
