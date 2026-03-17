import { useState, useEffect } from 'react';
import { useMemberAuth } from '../hooks/useMemberAuth';

const AdminKYCPanel = () => {
  const { getAuthHeader } = useMemberAuth();
  const [pendingKYC, setPendingKYC] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [processingAction, setProcessingAction] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(null);

  const API_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchPendingKYC();
  }, []);

  const fetchPendingKYC = async () => {
    try {
      setIsLoading(true);
      const authHeader = await getAuthHeader();
      const response = await fetch(`${API_URL}/kyc/pending`, {
        headers: {
          'Authorization': authHeader,
        },
      });

      const data = await response.json();
      if (data.success) {
        setPendingKYC(data.members);
      }
    } catch (err) {
      console.error('Error fetching pending KYC:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (memberId) => {
    if (!confirm('Are you sure you want to approve this KYC?')) return;

    try {
      setProcessingId(memberId);
      setProcessingAction('approve');
      const authHeader = await getAuthHeader();
      const response = await fetch(`${API_URL}/kyc/approve/${memberId}`, {
        method: 'PUT',
        headers: {
          'Authorization': authHeader,
        },
      });

      const data = await response.json();
      if (data.success) {
        alert('KYC approved successfully!');
        fetchPendingKYC(); // Refresh list
      } else {
        alert(`Failed to approve: ${data.message}`);
      }
    } catch (err) {
      console.error('Error approving KYC:', err);
      alert('Failed to approve KYC');
    } finally {
      setProcessingId(null);
      setProcessingAction(null);
    }
  };

  const handleReject = async (memberId) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      setProcessingId(memberId);
      setProcessingAction('reject');
      const authHeader = await getAuthHeader();
      const response = await fetch(`${API_URL}/kyc/reject/${memberId}`, {
        method: 'PUT',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: rejectionReason }),
      });

      const data = await response.json();
      if (data.success) {
        alert('KYC rejected');
        setShowRejectModal(null);
        setRejectionReason('');
        fetchPendingKYC(); // Refresh list
      } else {
        alert(`Failed to reject: ${data.message}`);
      }
    } catch (err) {
      console.error('Error rejecting KYC:', err);
      alert('Failed to reject KYC');
    } finally {
      setProcessingId(null);
      setProcessingAction(null);
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
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🛡️ Admin KYC Approval Panel
          </h1>
          <p className="text-gray-600">
            Review and approve member KYC submissions
          </p>
        </div>

        {pendingKYC.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending KYC Requests</h3>
            <p className="text-gray-500">All KYC submissions have been processed</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {pendingKYC.map((member) => (
              <div key={member._id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Member Info */}
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {member.name || 'Member'}
                    </h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><span className="font-medium">Email:</span> {member.email}</p>
                      <p><span className="font-medium">Submitted:</span> {new Date(member.kycSubmittedAt).toLocaleString()}</p>
                      <p><span className="font-medium">Documents:</span> {member.kycDocuments?.length || 0} file(s)</p>
                    </div>
                  </div>

                  {/* Document Previews */}
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Documents:</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {member.kycDocuments?.map((doc, index) => {
                        const apiBase = import.meta.env.VITE_API_GATEWAY_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5000';
                        const imageUrl = `${apiBase}${doc}`;
                        return (
                          <a
                            key={index}
                            href={imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                          >
                            <img
                              src={imageUrl}
                              alt={`Document ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-colors cursor-pointer"
                            />
                          </a>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3 md:w-48">
                    <button
                      onClick={() => handleApprove(member._id)}
                      disabled={processingId === member._id}
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md 
                               transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {processingId === member._id && processingAction === 'approve' ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Approving...
                        </span>
                      ) : '✓ Approve'}
                    </button>
                    
                    <button
                      onClick={() => setShowRejectModal(member._id)}
                      disabled={processingId === member._id}
                      className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md 
                               transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      ✗ Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Reject KYC - Provide Reason
              </h3>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 h-32"
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => handleReject(showRejectModal)}
                  disabled={processingId === showRejectModal}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md 
                           transition-colors duration-200"
                >
                  {processingId === showRejectModal && processingAction === 'reject' ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Rejecting...
                    </span>
                  ) : 'Confirm Rejection'}
                </button>
                <button
                  onClick={() => {
                    setShowRejectModal(null);
                    setRejectionReason('');
                  }}
                  disabled={processingId === showRejectModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminKYCPanel;
