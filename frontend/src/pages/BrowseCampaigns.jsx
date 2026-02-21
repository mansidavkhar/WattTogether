import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import CardGrid from '../components/CardGrid';
import {
  fetchCampaigns,
  selectCampaigns,
  selectCampaignsStatus,
  selectCampaignsError,
} from '../store/campaignsSlice';
import CampaignCard from '../components/CampaignCard';
import { useMemberAuth } from '../hooks/useMemberAuth';

export default function BrowseCampaigns() {
  const dispatch = useDispatch();
  const campaigns = useSelector(selectCampaigns);
  const status = useSelector(selectCampaignsStatus);
  const error = useSelector(selectCampaignsError);
  const { memberData } = useMemberAuth();

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchCampaigns());
    }
  }, [dispatch, status]);

  // Filter out campaigns created by the current user and separate by status
  const { activeCampaigns, fundedCampaigns, totalCampaigns, selfCampaigns } = useMemo(() => {
    const currentUserId = memberData?.id || memberData?._id;
    
    console.log('🔍 Browse Campaigns Debug:');
    console.log('   Current User ID:', currentUserId);
    console.log('   Total Campaigns:', campaigns.length);
    
    // Filter out self campaigns
    const othersCampaigns = campaigns.filter(campaign => {
      const ownerId = campaign.owner?._id || campaign.owner;
      const isSelf = ownerId === currentUserId;
      if (isSelf) {
        console.log('   ❌ Filtered out (self):', campaign.title);
      }
      return !isSelf;
    });

    console.log('   Campaigns after filter:', othersCampaigns.length);

    // Separate into active and funded
    const active = othersCampaigns.filter(c => c.status === 'active');
    const funded = othersCampaigns.filter(c => c.status === 'funded');

    return { 
      activeCampaigns: active, 
      fundedCampaigns: funded,
      totalCampaigns: campaigns.length,
      selfCampaigns: campaigns.length - othersCampaigns.length
    };
  }, [campaigns, memberData]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Loading State */}
      {status === 'loading' && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#508C9B] mb-4"></div>
          <p className="text-gray-600 text-lg">Loading campaigns...</p>
        </div>
      )}

      {/* Error State */}
      {status === 'failed' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 text-center">
            <div className="flex flex-col items-center">
              <svg className="w-12 h-12 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800 font-semibold mb-2">Failed to load campaigns</p>
              <p className="text-red-600 text-sm">{error || 'Please try again later'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success State */}
      {status === 'succeeded' && (
        <>
          {/* Hero Banner Section */}
          <div className="bg-white border-b-2 border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
              <div className="text-center">
                <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-[#134B70] via-[#508C9B] to-[#134B70] bg-clip-text text-transparent">
                  Discover Innovative Projects
                </h1>
                <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                  Support meaningful campaigns that are making a real difference in communities worldwide
                </p>
                <div className="flex justify-center gap-8 text-center">
                  <div className="bg-gradient-to-br from-[#134B70] to-[#508C9B] text-white rounded-xl px-8 py-5 shadow-lg">
                    <div className="text-4xl font-bold">{activeCampaigns.length}</div>
                    <div className="text-sm opacity-90 mt-1">Active Campaigns</div>
                  </div>
                  <div className="bg-gradient-to-br from-[#508C9B] to-[#134B70] text-white rounded-xl px-8 py-5 shadow-lg">
                    <div className="text-4xl font-bold">{fundedCampaigns.length}</div>
                    <div className="text-sm opacity-90 mt-1">Successfully Funded</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* No Campaigns State */}
            {activeCampaigns.length === 0 && fundedCampaigns.length === 0 && (
              <div className="text-center py-20 bg-gray-50 rounded-xl">
                <svg className="w-20 h-20 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No campaigns from other creators</h3>
                <p className="text-gray-500">
                  {totalCampaigns > 0 
                    ? `${selfCampaigns} campaign${selfCampaigns !== 1 ? 's' : ''} hidden (your own projects). Visit "My Projects" to manage them.`
                    : 'Check back soon for new projects to support'}
                </p>
              </div>
            )}

            {/* Active Campaigns Section */}
            {activeCampaigns.length > 0 && (
              <section className="mb-16">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Active Campaigns</h2>
                    <p className="text-gray-600">Support these campaigns currently seeking funding</p>
                  </div>
                  <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-semibold">
                    {activeCampaigns.length} Active
                  </div>
                </div>
                <CardGrid>
                  {activeCampaigns.map((campaign, index) => (
                    <CampaignCard key={campaign._id || index} campaign={campaign} />
                  ))}
                </CardGrid>
              </section>
            )}

            {/* Successfully Funded Campaigns Section */}
            {fundedCampaigns.length > 0 && (
              <section>
                <div className="relative bg-white rounded-2xl border-2 border-gray-100 shadow-lg overflow-hidden p-8 mb-8">
                  {/* Gradient accent bar */}
                  <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#134B70] via-[#508C9B] to-[#134B70]"></div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-[#134B70] to-[#508C9B] rounded-lg">
                          <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-[#134B70] to-[#508C9B] bg-clip-text text-transparent">
                          Successfully Funded
                        </h2>
                      </div>
                      <p className="text-gray-600 text-lg">
                        These campaigns have reached their funding goals and are making their vision a reality. 
                        Join our community of supporters who made these success stories possible!
                      </p>
                    </div>
                    <div className="ml-8 bg-gradient-to-br from-[#134B70] to-[#508C9B] rounded-xl px-8 py-6 shadow-lg min-w-[140px] text-center">
                      <div className="text-5xl font-bold text-white">{fundedCampaigns.length}</div>
                      <div className="text-sm text-white/90 mt-2 font-medium">Completed</div>
                    </div>
                  </div>
                </div>
                <CardGrid>
                  {fundedCampaigns.map((campaign, index) => (
                    <CampaignCard key={campaign._id || index} campaign={campaign} />
                  ))}
                </CardGrid>
              </section>
            )}
          </div>
        </>
      )}
    </div>
  );
}
