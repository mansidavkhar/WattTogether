import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCampaigns,
  selectCampaigns,
  selectCampaignsStatus,
  selectCampaignsError,
} from '../store/campaignsSlice';
import ProjectCard from '../components/ProjectCard';

export default function BrowseCampaigns() {
  const dispatch = useDispatch();
  const campaigns = useSelector(selectCampaigns);
  const status = useSelector(selectCampaignsStatus);
  const error = useSelector(selectCampaignsError);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchCampaigns());
    }
  }, [dispatch, status]);

  return (
    <div className="p-8 bg-white min-h-screen">
      {status === 'loading' && (
        <div className="text-center text-gray-600 py-10">Loading campaigns...</div>
      )}
      {status === 'failed' && (
        <div className="text-center text-red-600 py-10">{error || 'Failed to load campaigns'}</div>
      )}
      {status === 'succeeded' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-10 place-items-center">
          {campaigns.map((campaign, index) => (
            <ProjectCard key={index} project={campaign} />
          ))}
        </div>
      )}
    </div>
  );
}
