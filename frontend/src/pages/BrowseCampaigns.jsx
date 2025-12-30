import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import CardGrid from '../components/CardGrid';
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
      dispatch(fetchCampaigns());
    }
  }, [dispatch, status]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Browse Campaigns</h1>
          <p className="text-gray-600">Discover and support innovative projects making a difference</p>
        </div>

        {/* Loading State */}
        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#508C9B] mb-4"></div>
            <p className="text-gray-600 text-lg">Loading campaigns...</p>
          </div>
        )}

        {/* Error State */}
        {status === 'failed' && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 text-center">
            <div className="flex flex-col items-center">
              <svg className="w-12 h-12 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800 font-semibold mb-2">Failed to load campaigns</p>
              <p className="text-red-600 text-sm">{error || 'Please try again later'}</p>
            </div>
          </div>
        )}

        {/* Success State - Campaigns Grid */}
        {status === 'succeeded' && (
          <>
            {campaigns.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 rounded-xl">
                <svg className="w-20 h-20 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No campaigns available</h3>
                <p className="text-gray-500">Check back soon for new projects</p>
              </div>
            ) : (
              <>
                <div className="mb-6 text-sm text-gray-600">
                  Showing <span className="font-semibold text-gray-900">{campaigns.length}</span> campaign{campaigns.length !== 1 ? 's' : ''}
                </div>
                <CardGrid>
                  {campaigns.map((campaign, index) => (
                    <CampaignCard key={campaign._id || index} campaign={campaign} />
                  ))}
                </CardGrid>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
