import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCampaigns,
  selectCampaigns,
  selectCampaignsStatus,
  selectCampaignsError,
} from '../store/campaignsSlice';
import CampaignCard from '../components/CampaignCard';

export default function BrowseCampaigns() {
  const dispatch = useDispatch();
  const campaigns = useSelector(selectCampaigns);
  const status = useSelector(selectCampaignsStatus);
  const error = useSelector(selectCampaignsError);

  useEffect(() => {
    if (status === 'idle') {
      // Pass token from localStorage as argument to thunk
      const token = localStorage.getItem('token');
      dispatch(fetchCampaigns(token));
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
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-10 place-items-center">
          {campaigns.map((campaign, index) => (
              <CampaignCard key={campaign._id || index} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  );
}
