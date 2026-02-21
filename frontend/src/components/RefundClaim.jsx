import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useMemberAuth } from '../hooks/useMemberAuth';

const RefundClaim = ({ campaign, userContribution, userWallet, walletProvider }) => {
  const { user, signMessage } = usePrivy();
  const { wallets } = useWallets();
  const { getAuthHeader } = useMemberAuth();
  const [isClaiming, setIsClaiming] = useState(false);
  const [refundStatus, setRefundStatus] = useState(null);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [checkingClaimed, setCheckingClaimed] = useState(true);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureStatus, setSignatureStatus] = useState('awaiting');

  const BACKEND_URL = import.meta.env.VITE_API_GATEWAY_URL;

  // Support both prop patterns for backwards compatibility
  const campaignData = campaign || {};
  const contractAddress = campaignData.escrowContractAddress;
  const campaignId = campaignData._id;
  const campaignTitle = campaignData.title || campaignData.project_name || 'this campaign';

  // Check if user has already claimed on component mount
  useEffect(() => {
    const checkClaimedStatus = async () => {
      if (!contractAddress || !userWallet) {
        console.warn('Missing contract address or wallet for refund check');
        setCheckingClaimed(false);
        return;
      }

      try {
        console.log('🔍 Checking if refund already claimed...');
        console.log('   Contract:', contractAddress);
        console.log('   User:', userWallet);

        // Try blockchain check first
        let claimed = false;
        try {
          const ProjectEscrowV6ABI = [
            'function hasClaimedRefund(address) view returns (bool)',
            'function contributions(address) view returns (uint256)'
          ];

          const provider = new ethers.BrowserProvider(walletProvider || window.ethereum);
          const contract = new ethers.Contract(contractAddress, ProjectEscrowV6ABI, provider);
          
          claimed = await contract.hasClaimedRefund(userWallet);
          console.log('   Blockchain check result:', claimed);
        } catch (contractError) {
          console.warn('Blockchain check failed, trying backend API:', contractError.message);
          
          // Fallback: Check via backend API
          try {
            const authHeader = await getAuthHeader();
            const response = await fetch(`${BACKEND_URL}/campaigns/${campaignId}/refund-status`, {
              headers: { 'Authorization': authHeader }
            });
            const data = await response.json();
            if (data.success) {
              claimed = data.hasClaimed || false;
              console.log('   Backend check result:', claimed);
            }
          } catch (apiError) {
            console.error('Backend check also failed:', apiError);
          }
        }
        
        setHasClaimed(claimed);
        
        if (claimed) {
          console.log('✅ User has already claimed refund');
          setRefundStatus({
            type: 'success',
            message: '✅ Refund Already Claimed!\n\nYou have successfully claimed your refund from this campaign.'
          });
        } else {
          console.log('ℹ️ User has not claimed refund yet');
        }
      } catch (error) {
        console.error('Error checking claim status:', error);
        // On error, default to showing the claim button (safer option)
      } finally {
        setCheckingClaimed(false);
      }
    };

    checkClaimedStatus();
  }, [contractAddress, userWallet, walletProvider, campaignId, getAuthHeader, BACKEND_URL]);

  const handleClaimRefund = async () => {
    if (!contractAddress) {
      alert('❌ Contract address not found. Cannot process refund.');
      return;
    }

    if (!window.confirm(`Claim your pro-rata refund?\n\nYou contributed ${userContribution || 'some'} USDC.\n\nYou'll receive a proportional share of the remaining escrow funds.\n\n✨ This is GASLESS - we pay the fees!`)) {
      return;
    }

    try {
      setIsClaiming(true);
      setRefundStatus(null);

      const userWalletAddress = userWallet || user?.wallet?.address;
      
      if (!userWalletAddress) {
        throw new Error('Wallet address not found. Please connect your wallet.');
      }

      console.log('🔐 Creating signature for refund claim...');
      console.log('   Donor:', userWalletAddress);
      console.log('   Contract:', contractAddress);

      // Create message hash matching contract's expected format (EXACT same as veto)
      // Contract: keccak256(abi.encodePacked("CLAIM_REFUND", donor, contractAddress))
      const messageHash = ethers.solidityPackedKeccak256(
        ['string', 'address', 'address'],
        ['CLAIM_REFUND', userWalletAddress, contractAddress]
      );

      console.log('   Message hash:', messageHash);

      // Show signature modal
      setShowSignatureModal(true);

      // CRITICAL: Use wallet provider's signer directly (NOT Privy's signMessage helper)
      // Privy's signMessage() creates incompatible signatures
      // We need to use the embedded wallet's signer like ethers.Wallet.signMessage()
      setSignatureStatus('signing');
      let signature;
      
      try {
        console.log('Getting embedded wallet signer...');
        
        // Get the embedded wallet from Privy
        const embeddedWallet = wallets.find(w => w.walletClientType === 'privy');
        if (!embeddedWallet) {
          throw new Error('Privy embedded wallet not found. Please reconnect.');
        }
        
        // Get the Ethereum provider from the wallet
        const provider = await embeddedWallet.getEthereumProvider();
        if (!provider) {
          throw new Error('Could not get Ethereum provider from wallet.');
        }
        
        // Create ethers provider and signer
        const ethersProvider = new ethers.BrowserProvider(provider);
        const signer = await ethersProvider.getSigner();
        
        console.log('Signer address:', await signer.getAddress());
        console.log('Signing message hash:', messageHash);
        
        // Sign the message hash using the wallet's signer (same as ethers.Wallet.signMessage)
        signature = await signer.signMessage(ethers.getBytes(messageHash));
        
        console.log('✅ Signature received:', signature.substring(0, 20) + '...');
        console.log('   Signature length:', signature.length);
        setSignatureStatus('success');
      } catch (signError) {
        console.error('❌ Signature rejected:', signError);
        setSignatureStatus('error');
        setTimeout(() => setShowSignatureModal(false), 2000);
        throw new Error(signError.message || 'Signature rejected');
      }

      // Close signature modal
      setTimeout(() => setShowSignatureModal(false), 1500);

      // Submit to backend (relayer pays gas)
      console.log('📤 Submitting refund claim to backend...');
      
      const response = await fetch(`${BACKEND_URL}/campaigns/${campaign._id}/claim-refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': await getAuthHeader()
        },
        body: JSON.stringify({
          walletAddress: userWalletAddress,
          signature: signature,
          message: messageHash
        })
      });

      const data = await response.json();

      if (data.success) {
        setHasClaimed(true);
        setRefundStatus({
          type: 'success',
          message: `✅ Refund claimed! You received ${data.refundAmount} USDC.\n\n💸 Gasless transaction - we paid the fees!\n\nTx: ${data.txHash.substring(0, 20)}...`,
          txHash: data.txHash
        });
      } else {
        // Check if error is "already claimed"
        const errorMessage = data.message || 'Failed to claim refund';
        if (errorMessage.toLowerCase().includes('already claimed') || 
            errorMessage.toLowerCase().includes('already received') ||
            errorMessage.toLowerCase().includes('has already claimed')) {
          console.log('Backend says refund already claimed, updating state');
          setHasClaimed(true);
          setRefundStatus({
            type: 'success',
            message: '✅ Refund Already Claimed!\n\nYou have successfully claimed your refund from this campaign.'
          });
        } else {
          setRefundStatus({
            type: 'error',
            message: `❌ ${errorMessage}`
          });
        }
      }

    } catch (error) {
      console.error('Refund claim error:', error);
      
      let errorMsg = 'Failed to claim refund';
      
      if (error.message.includes('Already claimed')) {
        errorMsg = 'You have already claimed your refund';
        setHasClaimed(true);
        setRefundStatus({
          type: 'success',
          message: '✅ Refund Already Claimed!\n\nYou have successfully claimed your refund from this campaign.'
        });
        setShowSignatureModal(false);
        setIsClaiming(false);
        return;
      } else if (error.message.includes('No contributions')) {
        errorMsg = 'You have no contributions to this campaign';
      } else if (error.message.includes('User rejected')) {
        errorMsg = 'Signature cancelled';
      } else if (error.code === 'ACTION_REJECTED') {
        errorMsg = 'Signature rejected';
      }
      
      setRefundStatus({
        type: 'error',
        message: `❌ ${errorMsg}`
      });
      
      setShowSignatureModal(false);
    } finally {
      setIsClaiming(false);
    }
  };

  // If checking status, show loading
  if (checkingClaimed) {
    return (
      <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
        <div className="flex items-center justify-center gap-2 text-gray-600">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm font-medium">Checking refund status...</span>
        </div>
      </div>
    );
  }

  // If already claimed, show compact success message
  if (hasClaimed) {
    return (
      <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <svg className="w-8 h-8 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <p className="font-bold text-green-900 text-lg">✅ Refund Already Claimed</p>
            <p className="text-sm text-green-700 mt-1">You have successfully claimed your refund from this cancelled campaign.</p>
          </div>
        </div>
      </div>
    );
  }

  // Show refund claim form
  return (
    <div className="bg-red-50 border-2 border-red-400 rounded-lg p-6 space-y-4">
      {/* Signature Modal */}
      {showSignatureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm">
            <div className="text-center">
              <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-800 font-semibold">Please sign the message</p>
              <p className="text-sm text-gray-600 mt-2">Check your wallet popup</p>
            </div>
          </div>
        </div>
      )}

      {/* Alert Header */}
      <div className="flex items-center gap-3">
        <svg className="w-12 h-12 text-red-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
        </svg>
        <div>
          <h3 className="text-xl font-bold text-red-900">🚨 Project Cancelled</h3>
          <p className="text-sm text-red-700">This campaign has been terminated by the guardian</p>
        </div>
      </div>

      {/* Refund Info */}
      <div className="bg-white border border-red-300 rounded-lg p-4 space-y-2">
        <p className="text-sm font-semibold text-gray-800">
          You are eligible for a pro-rata refund based on remaining escrow funds.
        </p>
        <div className="text-sm text-gray-700">
          <p><strong>Your Contribution:</strong> {userContribution} USDC</p>
          <p className="text-xs text-gray-600 mt-1">
            Refund = (Your contribution ÷ Total raised) × Remaining escrow balance
          </p>
        </div>
      </div>

      {/* Claim Button - Hide if refund is claimed */}
      {!hasClaimed && !(refundStatus?.type === 'success' && refundStatus?.message?.includes('Already Claimed')) && (
        <button
          onClick={handleClaimRefund}
          disabled={isClaiming}
          className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isClaiming ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Processing Refund...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              ✨ Claim Refund (Gasless)
            </>
          )}
        </button>
      )}

      {/* Status Messages */}
      {refundStatus && (
        <div className={`p-4 rounded-lg border-l-4 ${
          refundStatus.type === 'success' 
            ? 'bg-green-50 border-green-500' 
            : 'bg-red-100 border-red-600'
        }`}>
          <p className="text-sm font-semibold whitespace-pre-line">
            {refundStatus.message}
          </p>
          {refundStatus.txHash && (
            <a
              href={`https://amoy.polygonscan.com/tx/${refundStatus.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 hover:underline mt-2 inline-block"
            >
              View on PolygonScan →
            </a>
          )}
        </div>
      )}

      {/* Warning */}
      <p className="text-xs text-gray-600 italic text-center">
        ✨ <strong>Gasless transaction</strong> - No MATIC needed! We pay the gas fees for you. Once claimed, this action cannot be undone.
      </p>
    </div>
  );
};

export default RefundClaim;
