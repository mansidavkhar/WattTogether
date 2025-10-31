// import { useState, useEffect } from 'react';
// import { useParams, useLocation } from 'react-router-dom';
// import DonationModal from '../components/DonationModal'; // Make sure the path is correct

// const CampaignDescription = () => {
//     const { id } = useParams();
//     const location = useLocation();
//     const [campaign, setCampaign] = useState(location.state?.campaign || null);
//     const [isLoading, setIsLoading] = useState(!location.state?.campaign);
//     const [error, setError] = useState('');
//     const [isModalOpen, setIsModalOpen] = useState(false);

//     useEffect(() => {
//         if (!campaign) {
//             const fetchCampaign = async () => {
//                 try {
//                     const response = await fetch(`http://localhost:5000/api/campaigns/${id}`);
//                     const data = await response.json();
//                     if (data.success) {
//                         setCampaign(data.campaign);
//                     } else {
//                         setError(data.message || 'Campaign not found.');
//                     }
//                 } catch (err) {
//                     setError('Failed to fetch campaign data.');
//                 } finally {
//                     setIsLoading(false);
//                 }
//             };
//             fetchCampaign();
//         }
//     }, [id, campaign]);

//     const handleCloseModal = (didFund) => {
//         setIsModalOpen(false);
//         if (didFund) {
//             window.location.reload(); 
//         }
//     };

//     if (isLoading) {
//         return <div className="p-8 text-center">Loading campaign...</div>;
//     }

//     if (error) {
//         return <div className="p-8 text-center text-red-500">{error}</div>;
//     }
    
//     if (!campaign) {
//         return <div className="p-8 text-center">Campaign data could not be loaded.</div>;
//     }

//     // --- Data processing ---
//     const BACKEND_URL = 'http://localhost:5000';
//     const coverImage = campaign.coverImageUrl || campaign.cover_image ? `${BACKEND_URL}${campaign.coverImageUrl || campaign.cover_image}` : 'https://placehold.co/1200x800/201E43/FFFFFF?text=WattTogether';
    
//     const now = new Date();
//     const deadline = new Date(campaign.fundingDeadline || campaign.funding_deadline);
//     const daysLeft = Math.max(0, Math.ceil((deadline - now) / (1000 * 60 * 60 * 24)));
    
//     // FIX: Handle both original and mapped property names
//     const fundingGoal = campaign.fundingGoalINR || campaign.amount || 0;
//     const amountRaised = campaign.amountRaisedINR || 0;
//     const fundingPercent = Math.min(100, Math.round((amountRaised / (fundingGoal || 1)) * 100)); // Avoid division by zero

//     return (
//         <div className="bg-gray-50 min-h-screen p-4 sm:p-8 font-sans">
//             {isModalOpen && <DonationModal campaign={campaign} onClose={handleCloseModal} />}
//             <div className="max-w-6xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-md">
//                 <div className="flex flex-col md:flex-row gap-8">
//                     {/* Main Content */}
//                     <div className="w-full md:w-2/3">
//                         <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">{campaign.title || campaign.project_name}</h1>
//                         <div className="relative w-full h-80 sm:h-96 mb-6 rounded-lg overflow-hidden shadow-lg">
//                              <img
//                                 src={coverImage}
//                                 alt={campaign.title}
//                                 className="w-full h-full object-cover"
//                                 onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/1200x800/201E43/FFFFFF?text=Invalid+Image'; }}
//                             />
//                         </div>
//                         <div className="space-y-6 text-gray-700 leading-relaxed">
//                              <div>
//                                 <h2 className="text-2xl font-semibold border-b-2 border-gray-200 pb-2 mb-3">Project Overview</h2>
//                                 <p>{campaign.description}</p>
//                             </div>
//                             <div>
//                                 <h2 className="text-2xl font-semibold border-b-2 border-gray-200 pb-2 mb-3">About the Entrepreneur</h2>
//                                 <p>{campaign.aboutEntrepreneur || campaign.about_entrepreneur}</p>
//                             </div>
//                         </div>
//                     </div>

//                     {/* Sidebar */}
//                     <div className="w-full md:w-1/3">
//                         <div className="bg-gray-100 p-6 rounded-lg shadow-inner space-y-4">
//                             <button 
//                                 onClick={() => setIsModalOpen(true)}
//                                 className="w-full bg-[#2d3748] text-white font-bold py-3 px-4 rounded-md hover:bg-[#1a202c] transition-colors text-lg">
//                                 Back this Project
//                             </button>
//                             <div className="bg-white p-4 rounded-md shadow-sm text-center">
//                                 <p className="text-gray-600">Funding Type</p>
//                                 <p className="font-bold text-lg">{campaign.fundingType || campaign.fund_type}</p>
//                             </div>
//                             <div className="bg-white p-4 rounded-md shadow-sm text-center">
//                                 <p className="text-gray-600">Days Left</p>
//                                 <p className="font-bold text-lg">{daysLeft}</p>
//                             </div>
//                              <div className="bg-white p-4 rounded-md shadow-sm text-center">
//                                 <p className="text-gray-600">Funding Deadline</p>
//                                 <p className="font-bold text-lg">{new Date(campaign.fundingDeadline || campaign.funding_deadline).toLocaleDateString()}</p>
//                             </div>
//                              <div className="bg-white p-4 rounded-md shadow-sm text-center">
//                                 <p className="text-gray-600">Funding Goal</p>
//                                 <p className="font-bold text-lg">₹{fundingGoal.toLocaleString()}</p>
//                             </div>
//                             <div className="bg-white p-4 rounded-md shadow-sm text-center">
//                                 <p className="text-gray-600">Funding Acquired ({fundingPercent}%)</p>
//                                 <p className="font-bold text-lg">₹{amountRaised.toLocaleString()}</p>
//                             </div>
//                             <button className="w-full bg-gray-200 text-gray-800 font-bold py-3 px-4 rounded-md hover:bg-gray-300 transition-colors">
//                                 Add to Watchlist
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default CampaignDescription;















import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import DonationModal from '../components/DonationModal.jsx';
import { useWeb3Auth } from '../context/Web3AuthContext.jsx';

const CampaignDescription = () => {
  const { id } = useParams();
  const location = useLocation();
  const [campaign, setCampaign] = useState(location.state?.campaign || null);
  const [isLoading, setIsLoading] = useState(!location.state?.campaign);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get Web3Auth context
  const { provider: web3AuthProvider, walletAddress: memberWalletAddress } = useWeb3Auth();
  const isMember = !!web3AuthProvider;

  // Set the backend URL here (env or localhost fallback)
  const BACKEND_URL = import.meta.env.VITE_API_GATEWAY_URL;

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
  }, [id, campaign, BACKEND_URL]);

  const handleCloseModal = (didFund) => {
    setIsModalOpen(false);
    if (didFund) {
      window.location.reload();
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

  const baseUrl = BACKEND_URL.replace(/\/api\/?$/, '');

  const coverImage = campaign.coverImageUrl || campaign.cover_image
    ? `${baseUrl}${campaign.coverImageUrl || campaign.cover_image}`
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
          web3AuthProvider={web3AuthProvider}
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
                <p>{campaign.description}</p>
              </div>
              <div>
                <h2 className="text-2xl font-semibold border-b-2 border-gray-200 pb-2 mb-3">About the Entrepreneur</h2>
                <p>{campaign.aboutEntrepreneur || campaign.about_entrepreneur}</p>
              </div>
            </div>
          </div>
          <div className="w-full md:w-1/3">
            <div className="bg-gray-100 p-6 rounded-lg shadow-inner space-y-4">
              <button
                onClick={() => setIsModalOpen(true)}
                disabled={!isMember}
                className="w-full bg-[#2d3748] text-white font-bold py-3 px-4 rounded-md hover:bg-[#1a202c] transition-colors text-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Back this Project
              </button>
              {!isMember && (
                <p className="text-xs text-center text-red-600 -mt-2">
                  Please log in to back this project.
                </p>
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
              </div>
              <div className="bg-white p-4 rounded-md shadow-sm text-center">
                <p className="text-gray-600">Funding Acquired ({fundingPercent}%)</p>
                <p className="font-bold text-lg">₹{amountRaised.toLocaleString()}</p>
              </div>
              <button className="w-full bg-gray-200 text-gray-800 font-bold py-3 px-4 rounded-md hover:bg-gray-300 transition-colors">
                Add to Watchlist
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignDescription;
