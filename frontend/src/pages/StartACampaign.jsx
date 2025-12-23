import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMemberAuth } from '../hooks/useMemberAuth';

const StartACampaign = () => {
  const navigate = useNavigate();
  const { getAuthHeader } = useMemberAuth();
  const [kycStatus, setKycStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:5000/api';

  useEffect(() => {
    checkKYCStatus();
  }, []);

  const checkKYCStatus = async () => {
    try {
      const authHeader = await getAuthHeader();
      const response = await fetch(`${API_URL}/kyc/status`, {
        headers: {
          'Authorization': authHeader,
        },
      });

      const data = await response.json();
      if (data.success) {
        setKycStatus(data.kycStatus);
      }
    } catch (err) {
      console.error('Error checking KYC status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartCampaign = () => {
    // Check KYC status before allowing campaign creation
    if (kycStatus === 'verified') {
      navigate('/member/newcampaigndetails');
    } else if (kycStatus === 'pending') {
      alert('Your KYC is pending approval. Please wait for admin verification.');
    } else {
      // Redirect to KYC submission
      navigate('/member/kyc-submission');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Main content section */}
      <div className="max-w-4xl mx-auto pt-16 px-4">
        {/* Hero section with text */}
        <div className="bg-[#201E43] rounded-lg p-8 text-center mb-8">
          <h1 className="text-white text-3xl font-bold leading-tight">
            The best way to predict the future is to create it—
            <br />
            with clean energy.
          </h1>
        </div>

        {/* Start Campaign Button */}
        <div className="text-center">
          <button
            onClick={handleStartCampaign}
            className="bg-[#508C9B] hover:bg-[#457a87] text-white font-semibold py-3 px-8 rounded-md transition-colors duration-200"
          >
            {kycStatus === 'verified' ? 'Start a Campaign' : 'Complete KYC to Start Campaign'}
          </button>
          
          {kycStatus === 'pending' && (
            <p className="text-yellow-600 mt-4 text-sm">
              ⏳ Your KYC is pending approval
            </p>
          )}
          {kycStatus === 'rejected' && (
            <p className="text-red-600 mt-4 text-sm">
              ❌ KYC rejected - Click to resubmit
            </p>
          )}
          {kycStatus === 'none' && (
            <p className="text-gray-600 mt-4 text-sm">
              📋 Complete KYC verification to create campaigns
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StartACampaign;