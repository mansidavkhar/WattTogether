import {Link} from 'react-router-dom';

const Projects = () => {
  const handleStartCampaign = () => {
    // Add your logic for starting a campaign
    console.log('Start a Campaign clicked');
  };

  const handleViewCampaigns = () => {
    // Add your logic for viewing campaigns
    console.log('View my Campaigns clicked');
  };

  const handleViewOngoingProjects = () => {
    // Add your logic for viewing ongoing projects
    console.log('View my Ongoing Projects clicked');
  };

  return (
    <div className="p-30">
    <div className="flex flex-col space-y-4 p-6 max-w-md mx-auto">
      <Link to="/member/startaproject" className="text-white text-xl hover:underline underline-offset-8 px-5 py-2">
      <button
        onClick={handleStartCampaign}
        className="w-full bg-[#508C9B] hover:bg-indigo-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-300 shadow-md"
      >
        Start a Campaign
      </button>
      </Link>
      
      <Link to="/member/viewmycampaigns" className="text-white text-xl hover:underline underline-offset-8 px-5 py-2">
      <button
        onClick={handleViewCampaigns}
        className="w-full bg-[#508C9B] hover:bg-indigo-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-300 shadow-md"
      >
        View my Campaigns
      </button>
      </Link>
      
      <Link to="/member/myprojects" className="text-white text-xl hover:underline underline-offset-8 px-5 py-2">
      <button
        onClick={handleViewOngoingProjects}
        className="w-full bg-[#508C9B] hover:bg-indigo-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-300 shadow-md"
      >
        View my Ongoing Projects
      </button>
      </Link>
    </div>
    </div>
  );
};

export default Projects;