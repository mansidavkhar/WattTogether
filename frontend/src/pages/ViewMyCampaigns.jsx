import { useEffect, useState } from 'react';
import { useMemberAuth } from '../hooks/useMemberAuth';
import CampaignCard from '../components/CampaignCard';
import CardGrid from '../components/CardGrid';

const ViewMyCampaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { getAuthHeader } = useMemberAuth();

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const authHeader = await getAuthHeader();
        
        if (!authHeader) {
          setError('Please log in to view your campaigns');
          setLoading(false);
          return;
        }

        // Fetch user's active campaigns only
        const res = await fetch(`${import.meta.env.VITE_API_GATEWAY_URL}/campaigns?mine=true&status=active`, {
          method: 'GET',
          headers: {
            Authorization: authHeader,
          },
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          const msg = data?.message || res.statusText || `HTTP ${res.status}`;
          throw new Error(msg);
        }

        const data = await res.json();
        if (data.success) {
          setCampaigns(data.campaigns || []);
        } else {
          setError(data.message || 'Failed to load campaigns');
        }
      } catch (err) {
        setError(err?.message || 'Failed to load campaigns');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []); // getAuthHeader is stable, no need to track it

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Active Campaigns</h1>
          <p className="text-gray-600">Track your ongoing fundraising campaigns</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#508C9B] mb-4"></div>
            <p className="text-gray-600 text-lg">Loading campaigns...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 text-center">
            <p className="text-red-800 font-semibold">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && campaigns.length === 0 && (
          <div className="text-center py-20 bg-gray-50 rounded-xl">
            <svg className="w-20 h-20 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No active campaigns</h3>
            <p className="text-gray-500">Create a campaign to get started</p>
          </div>
        )}

        {/* Campaigns Grid */}
        {!loading && !error && campaigns.length > 0 && (
          <>
            <div className="mb-6 text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{campaigns.length}</span> active campaign{campaigns.length !== 1 ? 's' : ''}
            </div>
            <CardGrid>
              {campaigns.map((campaign) => (
                <CampaignCard key={campaign._id} campaign={campaign} />
              ))}
            </CardGrid>
          </>
        )}
      </div>
    </div>
  );
};

export default ViewMyCampaigns;
