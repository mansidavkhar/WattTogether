import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useMemberAuth } from '../hooks/useMemberAuth';
import { convertINRtoUSDC, convertINRtoEUR } from '../utils/currencyUtils';
import OptimisticTimer from './OptimisticTimer';
import MilestoneDiscussion from './MilestoneDiscussion';
import GovernanceActions from './GovernanceActions';
import SignatureModal from './SignatureModal';
import { ethers } from 'ethers';

const MilestonesPanel = ({ campaignId, creatorId, campaignStatus }) => {
  const { authenticated, getAuthHeader, walletAddress, memberData } = useMemberAuth();
  const { signMessage } = usePrivy();
  const { wallets } = useWallets();
  
  const [milestones, setMilestones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userHasVotingPower, setUserHasVotingPower] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [votingResult, setVotingResult] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [currentMemberId, setCurrentMemberId] = useState(null);
  const [isCreatingMilestone, setIsCreatingMilestone] = useState(false);
  const [isReleasingFunds, setIsReleasingFunds] = useState(null);
  const [isVetoingMilestoneId, setIsVetoingMilestoneId] = useState(null);
  const [expandedDiscussions, setExpandedDiscussions] = useState(new Set());
  
  // Signature modal state
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureStatus, setSignatureStatus] = useState('awaiting');
  const [signatureError, setSignatureError] = useState('');
  const [signatureAction, setSignatureAction] = useState(null); // { type: 'veto', milestoneId: '...' }
  
  const [newMilestone, setNewMilestone] = useState({
    amount: '',
    description: '',
    proofDocuments: []
  });

  const BACKEND_URL = import.meta.env.VITE_API_GATEWAY_URL;
  const hasFetchedMemberId = useRef(false);
  
  // Check if current user is the creator
  const creatorOwnerId = typeof creatorId === 'object' ? creatorId._id : creatorId;
  const isCreator = currentMemberId && creatorOwnerId && (currentMemberId === creatorOwnerId);

  // Fetch current member ID on mount
  useEffect(() => {
    const fetchMemberId = async () => {
      if (!authenticated || hasFetchedMemberId.current) return;
      hasFetchedMemberId.current = true;
      
      try {
        const authHeader = await getAuthHeader();
        if (!authHeader) return;

        const response = await fetch(`${BACKEND_URL}/members/me`, {
          headers: { 'Authorization': authHeader }
        });

        const data = await response.json();
        if (data.success && data.member) {
          setCurrentMemberId(data.member._id);
          console.log('✅ Member ID fetched:', data.member._id);
        }
      } catch (error) {
        console.error('Error fetching member ID:', error);
        hasFetchedMemberId.current = false; // Allow retry on error
      }
    };

    fetchMemberId();
  }, [authenticated]); // Only depend on authenticated

  useEffect(() => {
    if (campaignId && authenticated) {
      fetchMilestones();
    }
  }, [campaignId, authenticated]); // Removed getAuthHeader to prevent infinite loop

  const fetchMilestones = async () => {
    try {
      setIsLoading(true);
      const authHeader = await getAuthHeader();
      if (!authHeader) {
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${BACKEND_URL}/milestones/campaign/${campaignId}?_t=${Date.now()}`, {
        headers: { 'Authorization': authHeader },
        cache: 'no-store'
      });

      const data = await response.json();
      console.log('🔍 Milestones API Response:', data);
      
      if (data.success) {
        // Sort milestones: pending/disputed first, released last
        const sortedMilestones = (data.data.milestones || []).sort((a, b) => {
          const statusOrder = { 'pending': 1, 'disputed': 2, 'cancelled': 3, 'released': 4 };
          return (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
        });
        
        console.log('📋 Milestones after sorting:', sortedMilestones.map(m => ({ 
          id: m._id, 
          status: m.status, 
          hasTxHash: !!m.releaseTxHash,
          txHash: m.releaseTxHash 
        })));
        
        setMilestones(sortedMilestones);
        setUserHasVotingPower(data.data.userHasVotingPower || false);
        console.log('📊 Voting Check:', {
          count: data.data.milestones?.length || 0,
          userHasVotingPower: data.data.userHasVotingPower,
          isCreator,
          authenticated,
          memberId: currentMemberId
        });
      }
    } catch (error) {
      console.error('Error fetching milestones:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateMilestone = async (e) => {
    e.preventDefault();
    setIsCreatingMilestone(true);
    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) return;

      // Create FormData for file uploads
      const formData = new FormData();
      formData.append('campaignId', campaignId);
      formData.append('amount', parseInt(newMilestone.amount));
      formData.append('description', newMilestone.description);
      
      // Append files
      newMilestone.proofDocuments.forEach(file => {
        formData.append('proofDocuments', file);
      });

      const response = await fetch(`${BACKEND_URL}/milestones/submit`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader
          // Don't set Content-Type - browser will set it with boundary for multipart/form-data
        },
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        setShowCreateForm(false);
        setNewMilestone({ amount: '', description: '', proofDocuments: [] });
        fetchMilestones();
      } else {
        alert(data.message || 'Failed to create milestone');
      }
    } catch (error) {
      console.error('Error creating milestone:', error);
      alert('Failed to create milestone');
    } finally {
      setIsCreatingMilestone(false);
    }
  };

  const handleVote = async (milestoneId, vote) => {
    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) return;

      const response = await fetch(`${BACKEND_URL}/milestones/${milestoneId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify({ vote })
      });

      const data = await response.json();
      if (data.success) {
        setVotingResult({
          status: 'success',
          message: `Vote recorded! Status: ${data.data.status}`,
          result: data.data
        });
        setTimeout(() => {
          fetchMilestones();
          setVotingResult(null);
          setSelectedMilestone(null);
        }, 2000);
      } else {
        setVotingResult({
          status: 'error',
          message: data.message
        });
      }
    } catch (error) {
      setVotingResult({
        status: 'error',
        message: 'Failed to submit vote'
      });
    }
  };

  const handleReleaseFunds = async (milestoneId) => {
    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) return;

      if (!window.confirm('Release funds for this approved milestone?')) return;

      setIsReleasingFunds(milestoneId);

      const response = await fetch(`${BACKEND_URL}/milestones/${milestoneId}/release`, {
        method: 'POST',
        headers: { 'Authorization': authHeader }
      });

      const data = await response.json();
      console.log('Release funds response:', data);

      if (data.success) {
        alert(`✅ Funds released successfully!\nTransaction: ${data.data.txHash.substring(0, 20)}...`);
        
        // Wait a moment for the blockchain transaction to be indexed
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Force state update by clearing first, then fetching
        setMilestones([]);
        await fetchMilestones();
      } else {
        alert(`❌ ${data.message || 'Failed to release funds'}`);
      }
    } catch (error) {
      console.error('Release funds error:', error);
      alert('Failed to release funds: ' + error.message);
    } finally {
      setIsReleasingFunds(null);
    }
  };

  // NEW: Handle veto with Privy signature
  const handleVetoMilestone = async (milestone) => {
    try {
      // EXTREME WARNING CONFIRMATION
      const userConfirmed = window.confirm(
        '🚨🚨🚨 CRITICAL WARNING - VETO ACTION 🚨🚨🚨\n\n' +
        '⚠️ YOU ARE ABOUT TO TRIGGER AN EMERGENCY BRAKE ⚠️\n\n' +
        'This action will:\n' +
        '❌ FREEZE all funds immediately\n' +
        '❌ HALT the entire project\n' +
        '❌ Trigger guardian investigation\n' +
        '❌ Could lead to project cancellation\n\n' +
        '⚡ Use ONLY if you have SERIOUS concerns about:\n' +
        '  • Fraudulent activity\n' +
        '  • False documentation\n' +
        '  • Milestone authenticity\n\n' +
        '❗ This is NOT a "dislike" button!\n' +
        '❗ False alarms waste everyone\'s time!\n\n' +
        'Are you ABSOLUTELY CERTAIN you want to proceed?\n' +
        '(This cannot be easily undone)'
      );

      if (!userConfirmed) {
        return;
      }

      setIsVetoingMilestoneId(milestone._id);

      // Get wallet address
      const embeddedWallet = wallets.find((wallet) => wallet.walletClientType === 'privy');
      const userWalletAddress = embeddedWallet?.address || walletAddress;
      
      if (!userWalletAddress) {
        alert('No wallet found. Please reconnect your wallet.');
        return;
      }

      if (!embeddedWallet) {
        alert('Embedded wallet not found. Please reload and try again.');
        return;
      }

      // Show signature modal
      setSignatureAction({ type: 'veto', milestoneId: milestone._id, milestone });
      setShowSignatureModal(true);
      setSignatureStatus('awaiting');

      // Get campaign contract address
      const response = await fetch(`${BACKEND_URL}/campaigns/${campaignId}`, {
        headers: { 'Authorization': await getAuthHeader() }
      });
      const campaignData = await response.json();
      const contractAddress = campaignData.campaign.escrowContractAddress;

      // Create the EXACT message hash that the contract expects
      // Contract: keccak256(abi.encodePacked("VETO_MILESTONE", milestoneId, donor, contractAddress))
      // We need to create this hash in JavaScript to match Solidity's abi.encodePacked
      
      const ethers = (await import('ethers')).ethers;
      
      // CRITICAL: Use milestone.onChainId (not _id)
      const onChainId = milestone.onChainId || '0';
      
      // Build the message hash exactly as the contract does
      const messageHash = ethers.solidityPackedKeccak256(
        ['string', 'uint256', 'address', 'address'],
        ['VETO_MILESTONE', onChainId, userWalletAddress, contractAddress]
      );
      
      console.log('📝 Message hash to sign:', messageHash);
      console.log('   OnChain ID:', onChainId);
      console.log('   Donor:', userWalletAddress);
      console.log('   Contract:', contractAddress);
      
      // Request signature from Privy
      setSignatureStatus('signing');
      let signature;
      
      try {
        console.log('About to call signMessage with hash:', messageHash);
        const result = await signMessage({ message: messageHash });
        // Ensure signature is a string (Privy might return object or string)
        signature = typeof result === 'string' ? result : result?.signature || String(result);
        console.log('✅ Veto signature received:', signature.substring(0, 20) + '...');
        setSignatureStatus('success');
      } catch (signError) {
        console.error('❌ Signature rejected:', signError);
        setSignatureStatus('error');
        setSignatureError(signError.message || 'Signature rejected');
        setTimeout(() => setShowSignatureModal(false), 2000);
        return;
      }

      // Close signature modal
      setTimeout(() => setShowSignatureModal(false), 1500);

      // Submit veto to backend with signature (relayer pays gas)
      const vetoResponse = await fetch(`${BACKEND_URL}/governance/${milestone._id}/veto`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': await getAuthHeader()
        },
        body: JSON.stringify({
          signature: signature,
          message: messageHash, // The hash that was signed
          walletAddress: userWalletAddress
        })
      });

      const data = await vetoResponse.json();
      if (data.success) {
        const isDisputed = data.data?.statusString === 'disputed' || data.data?.status === 1;
        
        if (isDisputed) {
          alert(`🚨 MILESTONE FROZEN!\n\nVeto threshold (10%) reached! This milestone is now DISPUTED.\n\nFunds are frozen and the guardian will review:\n• Resume (false alarm)\n• Cancel milestone (bad proof)\n• Cancel project (scam detected)\n\nTx: ${data.data.txHash.substring(0, 20)}...`);
        } else {
          alert(`✅ Veto recorded! Your voting power added.\n\nCurrent veto weight: ${data.data.vetoWeight?.toFixed(2) || 'unknown'} USDC\n\nTx: ${data.data.txHash.substring(0, 20)}...`);
        }
        
        // Refresh milestones to show updated status
        fetchMilestones();
      } else {
        alert(`❌ ${data.message || 'Failed to veto milestone'}`);
      }
      
    } catch (error) {
      console.error('Veto error:', error);
      let errorMsg = 'Failed to veto milestone';
      if (error.message.includes('Already vetoed')) {
        errorMsg = '❌ You have already vetoed this milestone';
      } else if (error.message.includes('Not a donor')) {
        errorMsg = '❌ Only donors can veto milestones';
      } else if (error.message.includes('Cannot veto')) {
        errorMsg = '❌ This milestone cannot be vetoed (already released, cancelled, or disputed)';
      }
      alert(errorMsg + ': ' + error.message);
    } finally {
      setIsVetoingMilestoneId(null);
    }
  };

  // NEW: Handle document voting (thumbs up/down)
  const handleDocumentVote = async (milestoneId, documentIndex, voteType) => {
    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) {
        alert('Please login to vote on documents');
        return;
      }

      const response = await fetch(`${BACKEND_URL}/milestones/${milestoneId}/document-vote`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documentIndex,
          voteType // 'up' or 'down'
        })
      });

      const data = await response.json();
      if (data.success) {
        // Refresh milestones to show updated votes
        fetchMilestones();
      } else {
        alert(`❌ ${data.message || 'Failed to record vote'}`);
      }
    } catch (error) {
      console.error('Document vote error:', error);
      alert('Failed to record vote: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      approved: 'bg-green-100 text-green-800 border-green-300',
      rejected: 'bg-red-100 text-red-800 border-red-300',
      released: 'bg-blue-100 text-blue-800 border-blue-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#508C9B]"></div>
      </div>
    );
  }

  // Check if campaign is funded
  const isFunded = campaignStatus === 'funded';

  // Show message if campaign is not funded
  if (!isFunded) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-md p-8 mt-8 border border-blue-200">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Milestones Locked</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Milestone creation and voting will be available once this campaign reaches its funding goal. 
            Back this project to help unlock transparent fund management!
          </p>
        </div>
      </div>
    );
  }

  // Show cancelled message for creators
  if (campaignStatus === 'cancelled' && isCreator) {
    return (
      <div className="bg-red-50 border-2 border-red-400 rounded-lg shadow-md p-8 mt-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-red-800 mb-3">🚨 Project Cancelled by Guardian</h3>
          <p className="text-red-700 mb-2 max-w-xl mx-auto">
            This campaign has been terminated by the guardian due to policy violations or suspicious activity.
          </p>
          <p className="text-red-600 text-sm max-w-xl mx-auto">
            All milestone submissions are frozen. Donors can claim pro-rata refunds. You cannot submit new milestones or access funds.
          </p>
          <div className="mt-6 bg-red-100 border border-red-300 rounded-lg p-4 max-w-xl mx-auto">
            <p className="text-sm text-red-800">
              <strong>What happened?</strong> The guardian reviewed disputed activity and determined this project violated platform policies. 
              This decision is final and cannot be reversed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show cancelled message for donors/visitors
  if (campaignStatus === 'cancelled' && !isCreator) {
    return (
      <div className="bg-orange-50 border-2 border-orange-400 rounded-lg shadow-md p-8 mt-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-orange-800 mb-3">Project Cancelled</h3>
          <p className="text-orange-700 mb-2 max-w-xl mx-auto">
            This campaign was terminated by the guardian. All donors can claim refunds.
          </p>
          <p className="text-orange-600 text-sm max-w-xl mx-auto">
            Use the "Claim Refund" button above to withdraw your contribution.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Signature Modal for Governance Actions */}
      <SignatureModal
        isOpen={showSignatureModal}
        title={signatureAction?.type === 'veto' ? 'Sign Veto Action' : 'Sign Transaction'}
        message={signatureAction?.type === 'veto' ? 'Sign to veto this milestone' : 'Please sign this transaction'}
        signatureData={signatureAction?.type === 'veto' ? {
          action: 'Veto Milestone',
          amount: `₹${signatureAction?.milestone?.amount || 0}`,
          description: signatureAction?.milestone?.description?.substring(0, 50) + '...',
          impact: 'Triggers dispute if 10% quorum reached'
        } : {}}
        status={signatureStatus}
        errorMessage={signatureError}
        onClose={() => {
          setShowSignatureModal(false);
          setSignatureAction(null);
        }}
      />

      {/* Header with Create Button */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-[#134B70] to-[#508C9B] rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Project Milestones</h2>
        </div>
        
        {isCreator && authenticated && (() => {
          const allMilestonesReleased = milestones.length > 0 && milestones.every(m => m.status === 'released');
          
          if (allMilestonesReleased) {
            return (
              <div className="bg-blue-50 border border-blue-500 px-4 py-2 rounded-lg">
                <p className="text-sm text-blue-700 font-semibold">✅ All Funds Released</p>
              </div>
            );
          }
          
          return (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-gradient-to-r from-[#134B70] to-[#508C9B] hover:opacity-90 text-white font-semibold py-2.5 px-5 rounded-lg transition-all duration-300 flex items-center space-x-2 shadow-md hover:shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>{showCreateForm ? 'Cancel' : 'Create Milestone'}</span>
            </button>

        );
      })()}
      </div>

      {/* Create Milestone Form */}
      {showCreateForm && isCreator && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-[#134B70] to-[#508C9B] px-6 py-3">
            <h3 className="text-white font-semibold text-lg">New Milestone</h3>
          </div>
          <form onSubmit={handleCreateMilestone} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Amount (INR)</label>
                  <input
                    type="number"
                    required
                    value={newMilestone.amount}
                    onChange={(e) => setNewMilestone({ ...newMilestone, amount: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#508C9B] focus:border-transparent"
                    placeholder="Enter amount in INR"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    required
                    value={newMilestone.description}
                    onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#508C9B] focus:border-transparent"
                    rows="4"
                    placeholder="Describe what this milestone will achieve..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Proof Documents (Optional)
                    <span className="text-xs text-gray-500 ml-2">Max 5 files, 10MB each (PDF, Images, Word)</span>
                  </label>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(e) => {
                      const files = Array.from(e.target.files);
                      if (files.length > 5) {
                        alert('Maximum 5 files allowed');
                        e.target.value = '';
                        return;
                      }
                      setNewMilestone({ ...newMilestone, proofDocuments: files });
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#508C9B] focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#508C9B] file:text-white hover:file:bg-[#134B70]"
                  />
                  {newMilestone.proofDocuments.length > 0 && (
                    <div className="mt-2 text-sm text-gray-600">
                      {newMilestone.proofDocuments.length} file(s) selected
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isCreatingMilestone}
                  className="w-full bg-gradient-to-r from-[#134B70] to-[#508C9B] text-white font-bold py-3 rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isCreatingMilestone ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Submit Milestone</span>
                  )}
                </button>
          </form>
        </div>
      )}

      {/* Voting Result Alert */}
      {votingResult && (
        <div className={`p-4 rounded-lg border-l-4 ${
          votingResult.status === 'success' 
            ? 'bg-green-50 border-green-500 text-green-800' 
            : 'bg-red-50 border-red-500 text-red-800'
        }`}>
          <p className="font-semibold">{votingResult.message}</p>
        </div>
      )}

      {/* Milestones List */}
      {milestones.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-gray-500 text-lg">No milestones yet</p>
          {isCreator && (
            <p className="text-gray-400 text-sm mt-2">Create your first milestone to start tracking progress</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {milestones.map((milestone, index) => {
            // V5 status mapping: pending, disputed, released, cancelled
            const statusColors = {
              pending: 'bg-amber-50 text-amber-700',
              disputed: 'bg-red-50 text-red-700',
              released: 'bg-blue-50 text-blue-700',
              cancelled: 'bg-gray-50 text-gray-700'
            };

            const statusLabels = {
              pending: '⏳ Pending Release',
              disputed: '⚠️ Disputed',
              released: '✓ Released',
              cancelled: '✕ Cancelled'
            };

            return (
              <div
                key={milestone._id}
                className="bg-white border border-gray-200 rounded-md hover:shadow-sm transition-shadow"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-gray-500">#{index + 1}</span>
                    <span className={`px-2 py-0.5 text-sm font-medium rounded ${statusColors[milestone.status] || 'bg-gray-50 text-gray-700'}`}>
                      {statusLabels[milestone.status] || milestone.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-semibold text-gray-900">
                      ₹{parseInt(milestone.amount).toLocaleString()} <span className="text-gray-400 font-normal">/ ₹{parseInt(milestone.campaignTotalRaised || 0).toLocaleString()}</span>
                    </div>
                    <div className="text-xs text-gray-500">${convertINRtoUSDC(milestone.amount || 0).toFixed(2)} / €{convertINRtoEUR(milestone.amount || 0).toFixed(2)}</div>
                  </div>
                </div>

                {/* Content */}
                <div className="px-4 py-3 space-y-3">
                  
                  {/* MOVED: Cooling Period Timer - Now at TOP */}
                  {milestone.status === 'pending' && milestone.releaseableAt && (
                    <OptimisticTimer releaseableAt={milestone.releaseableAt} />
                  )}

                  {/* MOVED: Veto Weight Progress - Now at TOP (for donors only) */}
                  {authenticated && userHasVotingPower && milestone.status === 'pending' && !isCreator && milestone.vetoWeight !== undefined && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-amber-800 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Veto Weight
                        </span>
                        <span className="text-sm font-bold text-amber-900">
                          {((milestone.vetoWeight / milestone.totalRaised) * 100).toFixed(1)}% / 10%
                        </span>
                      </div>
                      <div className="h-2 bg-amber-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            (milestone.vetoWeight / milestone.totalRaised) * 100 >= 10 ? 'bg-red-600' : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.min(100, (milestone.vetoWeight / milestone.totalRaised) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <p className="text-base text-gray-700 leading-relaxed">{milestone.description}</p>

                  {/* Documents with Voting */}
                  {milestone.proofDocuments && milestone.proofDocuments.length > 0 && (
                    <div className="border-l-2 border-blue-200 pl-3 py-1">
                      <p className="text-sm font-medium text-gray-600 mb-1.5">Documents</p>
                      <div className="space-y-1">
                        {milestone.proofDocuments.map((doc, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-2 group">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded flex-shrink-0">
                                {idx + 1}
                              </span>
                              <a
                                href={`${BACKEND_URL.replace(/\/api\/?$/, '')}/${doc.path}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 hover:underline flex-1 min-w-0"
                              >
                                <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="truncate">{doc.filename}</span>
                              </a>
                            </div>
                            {/* Document Voting */}
                            {authenticated && userHasVotingPower && (
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                  onClick={() => handleDocumentVote(milestone._id, idx, 'up')}
                                  className="p-1 hover:bg-green-100 rounded transition-colors"
                                  title="Approve authenticity"
                                >
                                  <svg className={`w-4 h-4 ${doc.upvotes?.includes(currentMemberId) ? 'text-green-600 fill-current' : 'text-gray-400'}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                  </svg>
                                  {doc.upvotes?.length ? <span className="text-xs text-green-600 font-medium">{doc.upvotes.length}</span> : null}
                                </button>
                                <button
                                  onClick={() => handleDocumentVote(milestone._id, idx, 'down')}
                                  className="p-1 hover:bg-red-100 rounded transition-colors"
                                  title="Question authenticity"
                                >
                                  <svg className={`w-4 h-4 ${doc.downvotes?.includes(currentMemberId) ? 'text-red-600 fill-current' : 'text-gray-400'}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                                  </svg>
                                  {doc.downvotes?.length ? <span className="text-xs text-red-600 font-medium">{doc.downvotes.length}</span> : null}
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* V5 OPTIMISTIC GOVERNANCE UI */}

                  {/* Donor view for DISPUTED milestones */}
                  {authenticated && userHasVotingPower && milestone.status === 'disputed' && !isCreator && (
                    <div className="bg-orange-50 border-2 border-orange-400 rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2 text-orange-800 font-bold text-sm">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        ✅ Veto Recorded - Milestone Frozen
                      </div>
                      <p className="text-sm text-orange-700">
                        Your veto helped reach the 10% threshold. This milestone is now frozen and awaiting guardian review.
                      </p>
                      <p className="text-xs text-orange-600 font-semibold">
                        Guardian will either: Resume milestone (false alarm), Cancel milestone (bad proof), or Cancel entire project (scam detected)
                      </p>
                    </div>
                  )}

                  {/* Creator release button (only after 48h cooling period) */}
                  {isCreator && milestone.status === 'pending' && milestone.releaseableAt && (() => {
                    const now = new Date().getTime();
                    const releaseTime = new Date(milestone.releaseableAt).getTime();
                    const canRelease = now >= releaseTime;
                    
                    return canRelease ? (
                    <button
                      onClick={() => handleReleaseFunds(milestone._id)}
                      disabled={isReleasingFunds === milestone._id}
                      className="w-full bg-[#508C9B] hover:bg-[#3d6f7c] disabled:opacity-50 text-white text-sm font-medium py-2 rounded transition-colors flex items-center justify-center gap-1.5"
                    >
                      {isReleasingFunds === milestone._id ? (
                        <>
                          <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Release Funds
                        </>
                      )}
                    </button>
                    ) : (
                      <div className="w-full bg-amber-50 border border-amber-300 text-amber-700 text-sm font-medium py-2 px-3 rounded flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Cooling Period: {Math.floor((releaseTime - now) / (1000 * 60 * 60))}h {Math.floor(((releaseTime - now) % (1000 * 60 * 60)) / (1000 * 60))}m remaining
                      </div>
                    );
                  })()}

                  {/* Creator view for DISPUTED milestones - Frozen state */}
                  {isCreator && milestone.status === 'disputed' && (
                    <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-2 text-red-800 font-bold text-base">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        🔒 MILESTONE FROZEN - Disputed by Donors
                      </div>
                      <div className="bg-white border border-red-200 rounded p-3 space-y-2">
                        <p className="text-sm text-red-700 font-semibold">
                          Veto threshold (10%) reached. Funds are locked until guardian resolves the dispute.
                        </p>
                        <p className="text-xs text-red-600">
                          <strong>What this means:</strong> Donors flagged this milestone as suspicious. The guardian will review your proof documents and either:
                        </p>
                        <ul className="text-xs text-red-600 list-disc list-inside space-y-1 ml-2">
                          <li><strong>Resume:</strong> False alarm, milestone continues</li>
                          <li><strong>Cancel Milestone:</strong> Proof insufficient, try again with better proof</li>
                          <li><strong>Cancel Project:</strong> Scam detected, all donors get refunds</li>
                        </ul>
                      </div>
                      <p className="text-xs text-gray-600 text-center italic">
                        You cannot release funds while disputed. Contact guardian if you believe this is a false alarm.
                      </p>
                    </div>
                  )}

                  {/* Status indicators */}
                  {milestone.status === 'released' && (
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2 text-green-700 font-bold text-base">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        ✅ Funds Released
                      </div>
                      {milestone.releaseTxHash && (
                        <div className="bg-white border border-green-200 rounded p-2">
                          <p className="text-xs font-semibold text-gray-600 mb-1">Transaction Hash:</p>
                          <a
                            href={`https://amoy.polygonscan.com/tx/${milestone.releaseTxHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-mono text-blue-600 hover:text-blue-800 hover:underline break-all flex items-center gap-1"
                          >
                            {milestone.releaseTxHash}
                            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      )}
                      {milestone.releasedAt && (
                        <p className="text-xs text-gray-600">
                          Released on {new Date(milestone.releasedAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {milestone.status === 'cancelled' && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-gray-700 font-semibold text-sm">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        ✕ Milestone Cancelled
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Funds returned to pool. Creator must submit new milestone with better proof.
                      </p>
                    </div>
                  )}

                  {/* MOVED: Milestone Discussion Thread - Now ABOVE Veto Button */}
                  {(milestone.status === 'pending' || milestone.status === 'disputed') && (
                    <div className="border-t border-gray-200 pt-3 mt-2">
                      <MilestoneDiscussion
                        milestoneId={milestone._id}
                        campaignId={campaignId}
                        milestoneStatus={milestone.status}
                        releaseableAt={milestone.releaseableAt}
                        userHasVotingPower={userHasVotingPower}
                        isCreator={isCreator}
                        isExpanded={expandedDiscussions.has(milestone._id)}
                        onToggle={() => {
                          const newExpanded = new Set(expandedDiscussions);
                          if (newExpanded.has(milestone._id)) {
                            newExpanded.delete(milestone._id);
                          } else {
                            newExpanded.add(milestone._id);
                          }
                          setExpandedDiscussions(newExpanded);
                        }}
                      />
                    </div>
                  )}

                  {/* Veto Button - At the VERY BOTTOM */}
                  {authenticated && userHasVotingPower && milestone.status === 'pending' && !isCreator && (
                    <div className="border-t border-gray-200 pt-3 mt-3 flex justify-center">
                      <button
                        onClick={() => !milestone.hasVetoed && handleVetoMilestone(milestone)}
                        disabled={milestone.hasVetoed || isVetoingMilestoneId === milestone._id}
                        className={`${
                          milestone.hasVetoed || isVetoingMilestoneId === milestone._id
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-orange-500 hover:bg-orange-600'
                        } text-white font-semibold py-2 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm shadow-md`}
                      >
                        {milestone.hasVetoed ? (
                          <>
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>✅ Already Vetoed</span>
                          </>
                        ) : isVetoingMilestoneId === milestone._id ? (
                          <>
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Processing Veto...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span>🚫 Veto Emergency Brake</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Discussion closed notice for released/cancelled milestones */}
                  {(milestone.status === 'released' || milestone.status === 'cancelled') && (
                    <div className="border-t border-gray-200 mt-3 pt-3">
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <svg className="w-5 h-5 text-gray-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p className="text-sm text-gray-500">
                          Discussion closed - Milestone {milestone.status === 'released' ? 'completed' : 'cancelled'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Box - V5 Optimistic Governance Explanation */}
      {authenticated && !isCreator && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-4 rounded-lg">
          <div className="flex">
            <svg className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-blue-900">
                ⚡ Optimistic Guardian Governance
              </p>
              <p className="text-sm text-blue-700 leading-relaxed">
                {userHasVotingPower 
                  ? "✓ Milestones auto-release after 48 hours (optimistic approval)\n✓ You can veto suspicious activity - if 10% agree, dispute is triggered\n✓ Guardian reviews disputes and decides: Resume, Cancel, or Kill Project\n✓ Your voting power = your donation amount (1 USDC = 1 vote)"
                  : "Only backers can veto milestones. Donate to gain voting power based on your contribution amount."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

MilestonesPanel.propTypes = {
  campaignId: PropTypes.string.isRequired,
  creatorId: PropTypes.string,
  campaignStatus: PropTypes.string.isRequired
};

export default MilestonesPanel;
