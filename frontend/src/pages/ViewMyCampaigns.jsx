import { useEffect, useState } from 'react';
import ProjectCard from '../components/ProjectCard';

const ViewMyCampaigns = () => {
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (!t) {
      console.error('No auth token found.');
      setCampaigns([]);
      return;
    }

    fetch(`${import.meta.env.VITE_API_GATEWAY_URL}/campaigns?mine=true`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${t}`,
        'x-auth-token': t,
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          const msg = data?.message || res.statusText || `HTTP ${res.status}`;
          throw new Error(msg);
        }
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          setCampaigns(data.campaigns || []);
        } else {
          console.error('Failed to fetch member campaigns:', data.message);
        }
      })
      .catch((error) => {
        console.error('Failed to fetch member campaigns:', error?.message || error);
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
