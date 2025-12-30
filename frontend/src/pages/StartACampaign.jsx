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
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#508C9B] mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  const getStatusConfig = () => {
    switch (kycStatus) {
      case 'verified':
        return {
          icon: (
            <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          title: 'Ready to Launch',
          message: 'Your KYC is verified. Start creating your campaign.',
          buttonText: 'Start a Campaign',
          statusBadge: { text: 'Verified', color: 'bg-green-100 text-green-800' }
        };
      case 'pending':
        return {
          icon: (
            <svg className="w-16 h-16 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          title: 'KYC Under Review',
          message: 'Your KYC submission is being reviewed by our team. You\'ll be notified once approved.',
          buttonText: 'View KYC Status',
          statusBadge: { text: 'Pending Approval', color: 'bg-yellow-100 text-yellow-800' }
        };
      case 'rejected':
        return {
          icon: (
            <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          title: 'KYC Not Approved',
          message: 'Your KYC was not approved. Please resubmit with correct information.',
          buttonText: 'Resubmit KYC',
          statusBadge: { text: 'Rejected', color: 'bg-red-100 text-red-800' }
        };
      default:
        return {
          icon: (
            <svg className="w-16 h-16 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
          title: 'KYC Verification Required',
          message: 'Complete KYC verification to start creating campaigns on our platform.',
          buttonText: 'Complete KYC',
          statusBadge: { text: 'Not Started', color: 'bg-gray-100 text-gray-800' }
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Start a Campaign</h1>
          <p className="text-gray-600">Launch your renewable energy project</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          {/* Status Banner */}
          <div className="bg-gradient-to-r from-[#134B70] to-[#508C9B] px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold">Campaign Creation Status</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.statusBadge.color}`}>
                {config.statusBadge.text}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 text-center">
            <div className="flex justify-center mb-6">
              {config.icon}
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              {config.title}
            </h3>
            
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {config.message}
            </p>

            <button
              onClick={handleStartCampaign}
              className="bg-gradient-to-r from-[#134B70] to-[#508C9B] hover:from-[#0d3a54] hover:to-[#3d6f7c] text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
            >
              {config.buttonText}
            </button>
          </div>
        </div>

        {/* Info Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <svg className="w-8 h-8 text-[#508C9B] mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h4 className="font-semibold text-sm text-gray-900 mb-1">Secure</h4>
            <p className="text-xs text-gray-600">KYC verified campaigns only</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <svg className="w-8 h-8 text-[#508C9B] mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h4 className="font-semibold text-sm text-gray-900 mb-1">Fast</h4>
            <p className="text-xs text-gray-600">Quick campaign setup</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <svg className="w-8 h-8 text-[#508C9B] mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h4 className="font-semibold text-sm text-gray-900 mb-1">Transparent</h4>
            <p className="text-xs text-gray-600">Blockchain-backed funding</p>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Need help? <Link to="/how-it-works" className="text-[#134B70] hover:text-[#508C9B] font-semibold">Learn how it works</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default StartACampaign;