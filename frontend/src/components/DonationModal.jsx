import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

// We import ethers from the CDN, as it's not a local dependency
import { ethers } from 'https://esm.sh/ethers@5';

// Minimal ABIs (Application Binary Interfaces) for interacting with the contracts
const usdcAbi = [
  // Read-only: get symbol
  "function symbol() external view returns (string)",
  // Read-only: get decimals
  "function decimals() external view returns (uint8)",
  // Read-only: get allowance
  "function allowance(address owner, address spender) external view returns (uint256)",
  // Write: approve
  "function approve(address spender, uint256 amount) external returns (bool)"
];
const escrowAbi = [
  // Write: donate
  "function donate(uint256 _amount) public"
];

const DonationModal = ({ 
  campaign, 
  onClose, 
  web3AuthProvider, 
  memberWalletAddress,
  escrowAddress // The address of your ProjectEscrow.sol contract
}) => {
  const [inrAmount, setInrAmount] = useState('');
  const [usdcAmount, setUsdcAmount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  // Removed Coinbase Pay state
  
  // New state to manage the donation flow
  // '1_Amount', '2_Confirm', '3_Purchase', '4_Approving', '5_Donating', '6_Success'
  const [step, setStep] = useState('1_Amount'); 
  const [txHash, setTxHash] = useState(''); // To store the final transaction hash

  // This is a mock rate. In a real app, you'd fetch this from an oracle or API.
  const INR_TO_USDC_RATE = 85; 

  // Simulated fiat-to-crypto: no Coinbase SDK. Nothing to init here.
  useEffect(() => {
    setError('');
    return () => {};
  }, []);

  // 2. Handle the "Continue" button press
  const handleAmountSubmit = (e) => {
    e.preventDefault();
    if (!inrAmount || isNaN(inrAmount) || inrAmount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    const calculatedUsdc = (parseFloat(inrAmount) / INR_TO_USDC_RATE).toFixed(2);
    setUsdcAmount(calculatedUsdc);
    setError('');
    setStep('2_Confirm');
  };

  // 3. Simulated fiat purchase using backend faucet
  const handleSimulatedPurchase = async () => {
    try {
      setIsProcessing(true);
      setError('');
      setStep('3_Purchase');
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to continue.');
        setStep('2_Confirm');
        return;
      }
      const res = await fetch(`${import.meta.env.VITE_API_GATEWAY_URL}/faucet/fund-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
        body: JSON.stringify({ toAddress: memberWalletAddress, amount: parseFloat(usdcAmount) }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'Simulated purchase failed.');
        setStep('2_Confirm');
        return;
      }
      // Proceed to Approve + Donate
      setStep('4_Approving');
      await handleCryptoDonation();
    } catch (e) {
      setError(e?.message || 'Simulated purchase error.');
      setStep('2_Confirm');
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Handle the two-step crypto donation (Approve + Donate)
  const handleCryptoDonation = async () => {
    if (!web3AuthProvider || !escrowAddress) {
      setError('Wallet connection lost. Please re-login and try again.');
      return;
    }

    setIsProcessing(true); // Disable all buttons
    setError(''); // Clear old errors

    try {
      // --- Setup Ethers.js ---
      const ethersProvider = new ethers.BrowserProvider(web3AuthProvider);
      const signer = await ethersProvider.getSigner();
      
      const usdcContractAddress = '0x41e94Eb019C0762f9BfCF9Fb1E58725BfB0e7582'; // Polygon Amoy USDC
      const usdcContract = new ethers.Contract(usdcContractAddress, usdcAbi, signer);
      
      const escrowContract = new ethers.Contract(escrowAddress, escrowAbi, signer);

      // --- Step 4A: Approve ---
      setStep('4_Approving');
      
      // Convert USDC amount to the correct decimal format (USDC has 6 decimals)
      const amountToDonate = ethers.parseUnits(usdcAmount.toString(), 6);

      // Check existing allowance
      const currentAllowance = await usdcContract.allowance(memberWalletAddress, escrowAddress);

      if (currentAllowance < amountToDonate) {
        // We need to approve.
        console.log(`Current allowance is ${currentAllowance}. Need ${amountToDonate}. Approving...`);
        const approveTx = await usdcContract.approve(escrowAddress, amountToDonate);
        
        // Wait for the approval transaction to be mined
        await approveTx.wait();
        console.log('Approval transaction successful:', approveTx.hash);
      } else {
        console.log(`Sufficient allowance (${currentAllowance}) already exists. Skipping approval.`);
      }

      // --- Step 4B: Donate ---
      setStep('5_Donating');
      console.log(`Donating ${amountToDonate} USDC to ${escrowAddress}...`);

      const donateTx = await escrowContract.donate(amountToDonate);
      
      // Wait for the donation transaction to be mined
      const receipt = await donateTx.wait();
      const finalTxHash = receipt.hash;
      
      console.log('Donation transaction successful:', finalTxHash);
      setTxHash(finalTxHash);

      // --- Step 5: Record in Backend ---
      await recordDonationInBackend(finalTxHash);

      // --- Step 6: Success ---
      setStep('6_Success');

    } catch (err) {
      console.error('Crypto donation failed:', err);
      let friendlyMessage = err.message;
      if (err.code === 'ACTION_REJECTED') {
        friendlyMessage = 'You rejected the transaction in your wallet.';
      } else if (err.message.includes('insufficient funds')) {
        friendlyMessage = 'You have insufficient funds in your wallet to complete this transaction.';
      }
      setError(`Donation failed: ${friendlyMessage}`);
      setStep('2_Confirm'); // Go back to confirm step on failure
    } finally {
      setIsProcessing(false);
    }
  };
  
  // 5. Helper function to call your backend
  const recordDonationInBackend = async (txHash) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${import.meta.env.VITE_API_GATEWAY_URL}/payments/record-donation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token,
      },
      body: JSON.stringify({
        campaignId: campaign._id,
        amount: parseFloat(usdcAmount),
        currency: 'USDC',
        txHash: txHash,
      }),
    });

    const data = await response.json();
    if (!data.success) {
      console.error("Failed to record donation in backend:", data.message);
    } else {
      console.log("Donation successfully recorded in backend.");
    }
  } catch (err) {
    console.error("Error calling backend to record donation:", err);
  }
};

  
  // --- UI Rendering ---

  // Helper to get transaction link
  const getPolygonScanLink = () => {
    return `https://amoy.polygonscan.com/tx/${txHash}`;
  }

  const renderStep = () => {
    switch (step) {
      case '1_Amount':
        return (
          <form onSubmit={handleAmountSubmit}>
            <h2 className="text-2xl font-bold mb-2 text-gray-800">Fund "{campaign.title}"</h2>
            <p className="mb-6 text-gray-600">Enter the amount you'd like to contribute in INR.</p>
            <div className="mb-4">
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Amount (INR)</label>
              <input
                type="number"
                id="amount"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., 500"
                value={inrAmount}
                onChange={(e) => setInrAmount(e.target.value)}
                disabled={isProcessing}
              />
            </div>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <button
              type="submit"
              className="w-full px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
              disabled={isProcessing}
            >
              Continue
            </button>
          </form>
        );

      case '2_Confirm':
        return (
          <div>
            <h2 className="text-2xl font-bold mb-2 text-gray-800">Confirm Donation</h2>
            <p className="mb-6 text-gray-600">You are about to purchase crypto to donate.</p>
            <div className="bg-gray-100 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount (INR):</span>
                <span className="font-semibold text-gray-800">₹ {parseFloat(inrAmount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Est. Amount (USDC):</span>
                <span className="font-semibold text-gray-800">$ {usdcAmount}</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="font-bold text-gray-800">Total:</span>
                <span className="font-bold text-green-600">~ ₹ {parseFloat(inrAmount).toLocaleString()}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">This will simulate a fiat purchase by crediting your wallet with test USDC on the Polygon Amoy network, then proceed to donate from your wallet.</p>
            
            {error && <p className="text-red-500 text-sm my-4">{error}</p>}

            <button
              onClick={handleSimulatedPurchase}
              className="w-full mt-6 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              disabled={isProcessing}
            >
              Simulate purchase (Testnet USDC) & Donate
            </button>
            <button
              type="button"
              onClick={() => setStep('1_Amount')}
              className="w-full mt-2 px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300"
              disabled={isProcessing}
            >
              Back
            </button>
          </div>
        );

      case '3_Purchase':
      case '4_Approving':
      case '5_Donating':
        const messages = {
          '3_Purchase': 'Simulating fiat purchase... Crediting test USDC to your wallet.',
          '4_Approving': 'Approving... Please confirm the "Approve" transaction in your wallet.',
          '5_Donating': 'Donating... Please confirm the "Donate" transaction in your wallet.',
        };
        return (
          <div className="text-center">
            <div className="flex justify-center items-center mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-green-600"></div>
            </div>
            <h2 className="text-xl font-bold mb-2 text-gray-800">{messages[step]}</h2>
            <p className="text-gray-600">This may take a few moments. Please do not close this window.</p>
          </div>
        );

      case '6_Success':
        return (
          <div className="text-center">
            <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <h2 className="text-2xl font-bold mb-2 text-green-700">Donation Successful!</h2>
            <p className="mb-4 text-gray-700">Thank you for funding the future! Your donation of {usdcAmount} USDC has been sent.</p>
            <a
              href={getPolygonScanLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline break-all"
            >
              View Transaction on PolygonScan
            </a>
            <button
              type="button"
              onClick={() => onClose(true)} // Close modal and refresh
              className="w-full mt-6 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700"
            >
              Done
            </button>
          </div>
        );
      
      default:
        return <p>Loading...</p>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-2xl w-full max-w-md">
        
        {renderStep()}

        {/* General Cancel Button (only show if not on success step) */}
        {step !== '1_Amount' && step !== '6_Success' && (
          <button
            type="button"
            onClick={() => onClose(false)}
            className="w-full mt-2 px-4 py-2 text-gray-600 text-sm text-center font-medium rounded-lg hover:bg-gray-100 disabled:text-gray-400"
            disabled={isProcessing}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

DonationModal.propTypes = {
  campaign: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  web3AuthProvider: PropTypes.object.isRequired,
  memberWalletAddress: PropTypes.string.isRequired,
  escrowAddress: PropTypes.string.isRequired,
};

export default DonationModal;

