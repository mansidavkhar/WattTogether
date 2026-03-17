import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import DonationModal from '../components/DonationModalV2.jsx';
import MilestonesPanel from '../components/MilestonesPanel.jsx';
import RefundClaim from '../components/RefundClaim.jsx';
import { useMemberAuth } from '../hooks/useMemberAuth.js';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import { convertINRtoUSDC, convertINRtoEUR, resolveAssetUrl } from '../utils/currencyUtils.js';

const CampaignDescription = () => {
  const { id } = useParams();
  const location = useLocation();
  const [campaign, setCampaign] = useState(location.state?.campaign || null);
  const [isLoading, setIsLoading] = useState(!location.state?.campaign);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get Privy auth context
  const { authenticated, walletAddress: memberWalletAddress } = useMemberAuth();
  const { wallets } = useWallets();
  const isMember = authenticated;

  // Get the Privy embedded wallet provider for blockchain interactions
  const embeddedWallet = wallets.find((wallet) => wallet.walletClientType === 'privy');
  const walletProvider = embeddedWallet?.getEthereumProvider();

  // Set the backend URL here (env or localhost fallback)
  const BACKEND_URL = import.meta.env.VITE_API_GATEWAY_URL;

  // Scroll to top when component mounts or when campaign ID changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (!campaign) {
      const fetchCampaign = async () => {
        try {
          const response = await fetch(`${BACKEND_URL}/campaigns/${id}`);
          const data = await response.json();
          if (data.success) {
            setCampaign(data.campaign);
          } else {
            setError(data.message || 'Campaign not found.');
          }
        } catch (err) {
          setError('Failed to fetch campaign data.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchCampaign();
    }
  }, [id, BACKEND_URL]); // Removed 'campaign' to prevent infinite loop

  const handleCloseModal = async (didFund) => {
    setIsModalOpen(false);
    if (didFund) {
      // Instead of full page reload, refresh campaign data
      try {
        const response = await fetch(`${BACKEND_URL}/campaigns/${id}`);
        const data = await response.json();
        if (data.success) {
          setCampaign(data.campaign);
          console.log('✅ Campaign data refreshed after donation');
        }
      } catch (err) {
        console.warn('Failed to refresh campaign data, falling back to page reload');
        window.location.reload();
      }
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading campaign...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  if (!campaign) {
    return <div className="p-8 text-center">Campaign data could not be loaded.</div>;
  }

  const coverImage = campaign.coverImageUrl || campaign.cover_image
    ? resolveAssetUrl(campaign.coverImageUrl || campaign.cover_image, BACKEND_URL)
    : 'https://placehold.co/1200x800/201E43/FFFFFF?text=WattTogether';


  const now = new Date();
  const deadline = new Date(campaign.fundingDeadline || campaign.funding_deadline);
  const daysLeft = Math.max(0, Math.ceil((deadline - now) / (1000 * 60 * 60 * 24)));
  const fundingGoal = campaign.fundingGoalINR || campaign.amount || 0;
  const amountRaised = campaign.raisedAmount || campaign.amountRaisedINR || 0;
  const fundingPercent = Math.min(100, Math.round((amountRaised / (fundingGoal || 1)) * 100));

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-8 font-sans">
      {isModalOpen && (
        <DonationModal
          campaign={campaign}
          onClose={handleCloseModal}
          walletProvider={walletProvider}
          memberWalletAddress={memberWalletAddress}
          escrowAddress={campaign.escrowContractAddress}
        />
      )}

      <div className="max-w-6xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-2/3">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">{campaign.title || campaign.project_name}</h1>
            <div className="relative w-full h-80 sm:h-96 mb-6 rounded-lg overflow-hidden shadow-lg">
              <img
                src={coverImage}
                alt={campaign.title}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/1200x800/201E43/FFFFFF?text=Invalid+Image'; }}
              />
            </div>
            <div className="space-y-6 text-gray-700 leading-relaxed">
              <div>
                <h2 className="text-2xl font-semibold border-b-2 border-gray-200 pb-2 mb-3">Project Overview</h2>
                <div className="prose prose-gray max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkBreaks]}>{campaign.description}</ReactMarkdown>
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-semibold border-b-2 border-gray-200 pb-2 mb-3">About the Entrepreneur</h2>
                <div className="prose prose-gray max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkBreaks]}>{campaign.aboutEntrepreneur || campaign.about_entrepreneur}</ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full md:w-1/3">
            <div className="bg-gray-100 p-6 rounded-lg shadow-inner space-y-4">
              {/* Show refund button for cancelled campaigns */}
              {campaign.status === 'cancelled' && (
                <div className="space-y-4">
                  <div className="bg-red-50 border-2 border-red-500 p-4 rounded-md text-center">
                    <div className="text-red-600 font-bold text-lg mb-1">🚨 Project Cancelled</div>
                    <p className="text-sm text-red-700">This campaign was cancelled by the guardian. Donors can claim refunds.</p>
                  </div>
                  {isMember && memberWalletAddress && (
                    <RefundClaim 
                      campaign={campaign}
                      userWallet={memberWalletAddress}
                      walletProvider={walletProvider}
                    />
                  )}
                  {!isMember && (
                    <p className="text-xs text-center text-gray-600">
                      Please log in to check if you're eligible for refunds.
                    </p>
                  )}
                </div>
              )}
              {campaign.status !== 'funded' && campaign.status !== 'cancelled' && (
                <>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    disabled={!isMember}
                    className="w-full bg-gradient-to-r from-[#134B70] to-[#508C9B] hover:from-[#0d3a54] hover:to-[#3d6f7c] text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 text-lg disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                  >
                    Back this Project
                  </button>
                  {!isMember && (
                    <p className="text-xs text-center text-red-600 -mt-2">
                      Please log in to back this project.
                    </p>
                  )}
                </>
              )}
              {campaign.status === 'funded' && (
                <div className="bg-green-50 border-2 border-green-500 p-4 rounded-md text-center">
                  <div className="text-green-600 font-bold text-lg mb-1">✅ Fully Funded!</div>
                  <p className="text-sm text-green-700">This campaign has reached its funding goal.</p>
                </div>
              )}
              <div className="bg-white p-4 rounded-md shadow-sm text-center">
                <p className="text-gray-600">Funding Type</p>
                <p className="font-bold text-lg">{campaign.fundingType || campaign.fund_type}</p>
              </div>
              <div className="bg-white p-4 rounded-md shadow-sm text-center">
                <p className="text-gray-600">Days Left</p>
                <p className="font-bold text-lg">{daysLeft}</p>
              </div>
              <div className="bg-white p-4 rounded-md shadow-sm text-center">
                <p className="text-gray-600">Funding Deadline</p>
                <p className="font-bold text-lg">{new Date(campaign.fundingDeadline || campaign.funding_deadline).toLocaleDateString()}</p>
              </div>
              <div className="bg-white p-4 rounded-md shadow-sm text-center">
                <p className="text-gray-600">Funding Goal</p>
                <p className="font-bold text-lg">₹{fundingGoal.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">${convertINRtoUSDC(fundingGoal).toFixed(2)} / €{convertINRtoEUR(fundingGoal).toFixed(2)}</p>
              </div>
              <div className="bg-white p-4 rounded-md shadow-sm text-center">
                <p className="text-gray-600">Funding Acquired ({fundingPercent}%)</p>
                <p className="font-bold text-lg">₹{amountRaised.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">${convertINRtoUSDC(amountRaised).toFixed(2)} / €{convertINRtoEUR(amountRaised).toFixed(2)}</p>
              </div>
              <div className="bg-white p-4 rounded-md shadow-sm text-center">
                <p className="text-gray-600">Backers</p>
                <p className="font-bold text-lg">{campaign.backersCount || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Milestones Section - Hide for cancelled campaigns */}
        {campaign.status !== 'cancelled' && (
          <div className="mt-12">
            <div className="border-t-2 border-gray-200 pt-8">
              <MilestonesPanel 
                campaignId={campaign._id} 
                creatorId={campaign.owner?._id || campaign.owner}
                campaignStatus={campaign.status}
              />
            </div>
          </div>
        )}
        
        {/* Message for cancelled campaigns */}
        {campaign.status === 'cancelled' && (
          <div className="mt-12 border-t-2 border-gray-200 pt-8">
            <div className="bg-red-50 border-2 border-red-400 rounded-lg p-8 text-center">
              <svg className="w-16 h-16 text-red-600 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
              </svg>
              <h3 className="text-2xl font-bold text-red-800 mb-3">Project Cancelled</h3>
              <p className="text-red-700 mb-2">This campaign has been terminated by the guardian.</p>
              <p className="text-red-600 text-sm">All donors can claim pro-rata refunds using the button above.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignDescription;
