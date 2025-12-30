
import { useEffect, useState } from "react";
import { useMemberAuth } from "../hooks/useMemberAuth";
import { useNavigate } from "react-router-dom";

export default function MyInvestments() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedCampaign, setExpandedCampaign] = useState(null);
  const [sortBy, setSortBy] = useState("recent"); // "recent", "amount", "name"
  const { getAuthHeader } = useMemberAuth();
  const navigate = useNavigate();
  const BACKEND_URL = import.meta.env.VITE_API_GATEWAY_URL;

  useEffect(() => {
    const fetchInvestments = async () => {
      try {
        const authHeader = await getAuthHeader();
        const res = await fetch(`${BACKEND_URL}/donations/my-investments`, {
          method: "GET",
          headers: {
            Authorization: authHeader,
          },
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `HTTP ${res.status}`);
        }

        const data = await res.json();
        if (!data?.success) {
          throw new Error(data?.message || "Failed to fetch investments");
        }

        setItems(data.campaigns || []);
      } catch (err) {
        setError(err?.message || "Failed to load investments");
      } finally {
        setLoading(false);
      }
    };

    fetchInvestments();
  }, []); // getAuthHeader is stable, no need to track it

  // Sort campaigns based on selected option
  const sortedItems = [...items].sort((a, b) => {
    switch (sortBy) {
      case "recent":
        // Sort by most recent donation (latest donation date)
        const latestDateA = a.myDonations?.[0]?.date || a.createdAt;
        const latestDateB = b.myDonations?.[0]?.date || b.createdAt;
        return new Date(latestDateB) - new Date(latestDateA);
      case "amount":
        // Sort by total donated (highest first)
        return (b.myTotalDonated || 0) - (a.myTotalDonated || 0);
      case "name":
        // Sort alphabetically by campaign title
        return (a.title || "").localeCompare(b.title || "");
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Investments</h1>
          <p className="text-gray-600">Track campaigns you have supported</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#508C9B] mb-4"></div>
            <p className="text-gray-600 text-lg">Loading your investments...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 text-center">
            <p className="text-red-800 font-semibold">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && items.length === 0 && !error && (
          <div className="text-center py-20 bg-gray-50 rounded-xl">
            <svg className="w-20 h-20 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No investments yet</h3>
            <p className="text-gray-500">Start supporting campaigns to see them here</p>
          </div>
        )}

        {/* Investments List */}
        {!loading && !error && items.length > 0 && (
          <>
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="text-sm text-gray-600">
                Supporting <span className="font-semibold text-gray-900">{items.length}</span> campaign{items.length !== 1 ? 's' : ''}
                <span className="mx-2">•</span>
                Total donated: <span className="font-semibold text-green-600">₹{items.reduce((sum, c) => sum + (c.myTotalDonated || 0), 0).toLocaleString()}</span>
              </div>
              
              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <label htmlFor="sort" className="text-sm text-gray-600 font-semibold">Sort by:</label>
                <select
                  id="sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                >
                  <option value="recent">Recent Donation</option>
                  <option value="amount">Highest Contribution</option>
                  <option value="name">Campaign Name (A-Z)</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-8">
              {sortedItems.map((campaign) => {
                const baseUrl = BACKEND_URL.replace(/\/api\/?$/, '');
                const coverImage = campaign.coverImageUrl || campaign.cover_image
                  ? `${baseUrl}${campaign.coverImageUrl || campaign.cover_image}`
                  : 'https://placehold.co/1200x600/201E43/FFFFFF?text=WattTogether';
                
                return (
                  <div key={campaign._id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300">
                    <div className="md:flex md:items-stretch">
                      {/* Cover Image - Fixed Height */}
                      <div className="md:w-1/3 md:flex-shrink-0">
                        <img
                          src={coverImage}
                          alt={campaign.title}
                          className="h-64 w-full object-cover cursor-pointer"
                          onClick={() => navigate(`/member/campaign/${campaign._id}`)}
                          onError={(e) => { 
                            e.target.onerror = null; 
                            e.target.src = 'https://placehold.co/1200x600/201E43/FFFFFF?text=Image+Not+Found'; 
                          }}
                        />
                      </div>

                      {/* Content - Can Expand */}
                      <div className="md:w-2/3 flex flex-col">
                        <div className="p-5 flex-1">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                              <h3 className="text-xl font-bold text-gray-900 hover:text-blue-600 cursor-pointer" onClick={() => navigate(`/member/campaign/${campaign._id}`)}>
                                {campaign.title}
                              </h3>
                              {campaign.needsVote && (
                                <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse flex items-center space-x-1">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                  </svg>
                                  <span>Vote Now!</span>
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-1">{campaign.description}</p>
                          </div>
                          <span className={`ml-4 px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                            campaign.status === 'funded' ? 'bg-green-100 text-green-800' :
                            campaign.status === 'active' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {campaign.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                          <div className="bg-gradient-to-br from-green-50 to-green-100 p-2.5 rounded-lg">
                            <p className="text-xs text-green-700 font-semibold mb-0.5">My Contribution</p>
                            <p className="text-lg font-bold text-green-700">₹{(campaign.myTotalDonated || 0).toLocaleString()}</p>
                          </div>
                          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-2.5 rounded-lg">
                            <p className="text-xs text-purple-700 font-semibold mb-0.5">Times Donated</p>
                            <p className="text-lg font-bold text-purple-700">{campaign.myDonationCount || 0}</p>
                          </div>
                          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-2.5 rounded-lg">
                            <p className="text-xs text-blue-700 font-semibold mb-0.5">Total Raised</p>
                            <p className="text-lg font-bold text-blue-700">₹{(campaign.amountRaisedINR || 0).toLocaleString()}</p>
                          </div>
                          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-2.5 rounded-lg">
                            <p className="text-xs text-gray-700 font-semibold mb-0.5">Goal</p>
                            <p className="text-lg font-bold text-gray-700">₹{(campaign.fundingGoalINR || 0).toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/member/campaign/${campaign._id}`)}
                            className="flex-1 bg-[#508C9B] hover:bg-[#3d6f7c] text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center text-sm"
                          >
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Campaign
                          </button>
                          <button
                            onClick={() => setExpandedCampaign(expandedCampaign === campaign._id ? null : campaign._id)}
                            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-all duration-300 flex items-center justify-center text-sm"
                          >
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {expandedCampaign === campaign._id ? 'Hide' : 'Show'} Donations
                            <svg className={`w-4 h-4 ml-2 transition-transform ${expandedCampaign === campaign._id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                        </div>

                        {/* Expanded Donations List - Outside the main content wrapper */}
                        {expandedCampaign === campaign._id && campaign.myDonations && (
                          <div className="px-5 pb-5 border-t">
                            <div className="pt-5">
                            <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                              <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Donation History ({campaign.myDonations.length})
                            </h4>
                            <div className="space-y-3">
                              {campaign.myDonations.map((donation) => (
                                <div key={donation._id} className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-lg border-l-4 border-green-500 hover:shadow-md transition-shadow">
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <p className="text-lg font-bold text-gray-900">₹{donation.amount.toLocaleString()}</p>
                                      <p className="text-xs text-gray-600 flex items-center mt-1">
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        {new Date(donation.date).toLocaleDateString('en-IN', { 
                                          year: 'numeric', 
                                          month: 'long', 
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </p>
                                    </div>
                                    {donation.txHash && (
                                      <a
                                        href={`https://amoy.polygonscan.com/tx/${donation.txHash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md flex items-center transition-colors font-semibold"
                                      >
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                        View on Polygonscan
                                      </a>
                                    )}
                                  </div>
                                  {donation.txHash && (
                                    <div className="mt-2 bg-white p-2 rounded border border-gray-200">
                                      <p className="text-xs text-gray-500 mb-1">Transaction Hash:</p>
                                      <p className="text-xs font-mono text-gray-700 break-all">
                                        {donation.txHash}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}