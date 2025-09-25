import { useEffect, useState } from 'react';
import ProjectCard from '../components/ProjectCard';

const ViewMyCampaigns = () => {
  const token = localStorage.getItem('token');
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_GATEWAY_URL}/campaigns?mine=true`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCampaigns(data.campaigns || []);
        } else {
          console.error('Failed to fetch member campaigns:', data.message);
        }
      })
      .catch((error) => {
        console.error('Error fetching member campaigns:', error);
      });
  }, []);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 max-w-6xl">
        {campaigns.map((campaign, index) => (
          <ProjectCard key={campaign._id || index} project={campaign} />
        ))}
      </div>
    </div>
  );
};

export default ViewMyCampaigns;
