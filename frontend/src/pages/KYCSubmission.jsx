import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMemberAuth } from '../hooks/useMemberAuth';

const KYCSubmission = () => {
  const navigate = useNavigate();
  const { getAuthHeader } = useMemberAuth();
  const [kycStatus, setKycStatus] = useState('none');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  const API_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:5000/api';

  // Check current KYC status on mount
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
        
        // If already verified, redirect to campaign creation
        if (data.kycStatus === 'verified') {
          navigate('/member/newcampaigndetails');
        }
      }
    } catch (err) {
      console.error('Error checking KYC status:', err);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length > 5) {
      setError('Maximum 5 documents allowed');
      return;
    }

    setSelectedFiles(files);
    
    // Create preview URLs
    const urls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedFiles.length === 0) {
      setError('Please select at least one document');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('documents', file);
      });

      const authHeader = await getAuthHeader();
      const response = await fetch(`${API_URL}/kyc/submit`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('KYC documents submitted successfully! Awaiting admin approval.');
        setKycStatus('pending');
        setTimeout(() => {
          navigate('/member/browsecampaigns');
        }, 3000);
      } else {
        setError(data.message || 'Failed to submit KYC documents');
      }
    } catch (err) {
      setError('Failed to submit KYC documents. Please try again.');
      console.error('KYC submission error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStatusMessage = () => {
    switch (kycStatus) {
      case 'pending':
        return (
          <div className="bg-yellow-50 border border-yellow-400 rounded-lg p-6 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-yellow-800">KYC Verification Pending</h3>
                <p className="mt-2 text-sm text-yellow-700">
                  Your documents have been submitted and are awaiting admin approval. 
                  You'll be able to create campaigns once your KYC is verified.
                </p>
              </div>
            </div>
          </div>
        );
      case 'rejected':
        return (
          <div className="bg-red-50 border border-red-400 rounded-lg p-6 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-red-800">KYC Verification Rejected</h3>
                <p className="mt-2 text-sm text-red-700">
                  Your documents did not meet our requirements. Please submit new documents below.
                </p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              KYC Verification Required
            </h1>
            <p className="text-gray-600">
              To create campaigns, you need to complete KYC verification
            </p>
          </div>

          {renderStatusMessage()}

          {(kycStatus === 'none' || kycStatus === 'rejected') && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Identity Documents
                </label>
                <p className="text-sm text-gray-500 mb-4">
                  Please upload clear photos of your ID (Passport, Driver's License, or National ID Card).
                  Maximum 5 documents, up to 5MB each.
                </p>
                
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors
                           file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold 
                           file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  disabled={isLoading}
                />
              </div>

              {/* Preview uploaded files */}
              {previewUrls.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative">
                      <img
                        src={url}
                        alt={`Document ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <p className="text-xs text-gray-600 mt-1 text-center">
                        {selectedFiles[index].name}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded">
                  {success}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isLoading || selectedFiles.length === 0}
                  className="flex-1 bg-[#508C9B] hover:bg-[#457a87] text-white font-semibold py-3 px-6 rounded-md 
                           transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Submitting...' : 'Submit for Verification'}
                </button>
                
                <button
                  type="button"
                  onClick={() => navigate('/member/browsecampaigns')}
                  className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50
                           transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">📋 What happens next?</h3>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Your documents will be reviewed by our admin team</li>
                  <li>Verification usually takes 1-2 business days</li>
                  <li>You'll be notified once your KYC is approved</li>
                  <li>After approval, you can create campaigns</li>
                </ul>
              </div>
            </form>
          )}

          {kycStatus === 'pending' && (
            <div className="text-center">
              <button
                onClick={() => navigate('/member/browsecampaigns')}
                className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-8 rounded-md 
                         transition-colors duration-200"
              >
                Back to Browse Campaigns
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KYCSubmission;
