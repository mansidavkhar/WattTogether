// import { useState } from 'react';
// import PropTypes from 'prop-types';

// const DonationModal = ({ campaign, onClose }) => {
//     const [amount, setAmount] = useState('');
//     const [isProcessing, setIsProcessing] = useState(false);
//     const [error, setError] = useState('');
//     const [successMessage, setSuccessMessage] = useState('');

//     const handleDevFaucet = async (e) => {
//         e.preventDefault();
//         if (!amount || isNaN(amount) || amount <= 0) {
//             setError('Please enter a valid amount.');
//             return;
//         }

//         setIsProcessing(true);
//         setError('');
//         setSuccessMessage('');

//         try {
//             const token = localStorage.getItem('token');
//             const response = await fetch('http://localhost:5000/api/campaigns/dev-fund', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'x-auth-token': token,
//                 },
//                 body: JSON.stringify({
//                     amount: parseFloat(amount),
//                     campaignId: campaign._id,
//                 }),
//             });

//             const data = await response.json();

//             if (data.success) {
//                 // Record this investment locally so MyInvestments can display it
//                 try {
//                     const key = 'my_investments';
//                     const arr = JSON.parse(localStorage.getItem(key) || '[]');
//                     if (Array.isArray(arr)) {
//                         if (!arr.includes(campaign._id)) {
//                             arr.push(campaign._id);
//                             localStorage.setItem(key, JSON.stringify(arr));
//                         }
//                     } else {
//                         localStorage.setItem(key, JSON.stringify([campaign._id]));
//                     }
//                 } catch {}

//                 setSuccessMessage(data.message);
//                 setTimeout(() => {
//                     onClose(true); // Close the modal and indicate success
//                 }, 2000);
//             } else {
//                 setError(data.message || 'Developer faucet failed.');
//             }
//         } catch (err) {
//             console.error(err);
//             setError('An error occurred. Please check the console.');
//         } finally {
//             setIsProcessing(false);
//         }
//     };

//     return (
//         <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
//             <div className="bg-white p-6 md:p-8 rounded-lg shadow-2xl w-11/12 max-w-md">
//                 <h2 className="text-2xl font-bold mb-2 text-gray-800">Fund "{campaign.title}"</h2>
//                 <p className="mb-6 text-gray-600">Enter the amount you'd like to contribute.</p>

//                 <form onSubmit={handleDevFaucet}>
//                     <div className="mb-4">
//                         <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Amount (INR)</label>
//                         <input
//                             type="number"
//                             id="amount"
//                             className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
//                             placeholder="e.g., 500"
//                             value={amount}
//                             onChange={(e) => setAmount(e.target.value)}
//                             disabled={isProcessing}
//                         />
//                     </div>

//                     {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
//                     {successMessage && <p className="text-green-500 text-sm mb-4">{successMessage}</p>}

//                     <div className="flex flex-col gap-3 mt-6">
//                         <button
//                             type="submit"
//                             className="w-full px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
//                             disabled={isProcessing}
//                         >
//                             {isProcessing ? 'Processing...' : 'Fund with Test USDC (Dev Faucet)'}
//                         </button>
//                          <button
//                             type="button"
//                             onClick={() => onClose(false)}
//                             className="w-full px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 disabled:bg-gray-400"
//                             disabled={isProcessing}
//                         >
//                             Cancel
//                         </button>
//                     </div>
//                 </form>
//             </div>
//         </div>
//     );
// };

// DonationModal.propTypes = {
//     campaign: PropTypes.object.isRequired,
//     onClose: PropTypes.func.isRequired,
// };

// export default DonationModal;






















// import { useState, useEffect } from 'react';
// import PropTypes from 'prop-types';
// // Import from CDN to resolve build error
// import { initOnRamp } from 'https://esm.sh/@coinbase/cbpay-js@2';
// import { ethers } from 'https://esm.sh/ethers@5';

// // --- CONFIGURATION ---
// // !! MOVE TO .env file in a real app !!
// const COINBASE_PROJECT_ID = 'b4f963bb-ce47-4915-869c-3544d7860442';
// const MUMBAI_USDC_ADDRESS = '0x0fa8781a83e46826621b3bc094ea2a0212e71b23'; // Common test USDC on Mumbai

// // A simplified ABI for USDC transfer
// const USDC_ABI = [
//   "function transfer(address to, uint256 amount) public returns (bool)"
// ];
// // ---

// const DonationModal = ({ campaign, onClose, web3AuthProvider, memberWalletAddress }) => {
//     const [amount, setAmount] = useState(''); // This will now be in USDC
//     const [isProcessing, setIsProcessing] = useState(false);
//     const [error, setError] = useState('');
//     const [statusMessage, setStatusMessage] = useState('');
//     const [onrampInstance, setOnrampInstance] = useState(null);

//     // Initialize the Coinbase Pay SDK instance
//     useEffect(() => {
//         initOnRamp({
//             appId: COINBASE_PROJECT_ID,
//             widgetParameters: {
//                 destinationWallets: [{
//                     address: memberWalletAddress,
//                     blockchains: ['polygon'], // Use 'polygon' for Polygon mainnet, 'polygon-mumbai' might be needed for testnet
//                     assets: ['USDC'],
//                 }],
//             },
//             onSuccess: (response) => {
//                 console.log('Coinbase On-Ramp Success:', response);
//                 setStatusMessage('Step 2/3: Fiat purchase successful! Processing donation...');
//                 // Fiat purchase is done, crypto is in their wallet.
//                 // Now, trigger the actual crypto donation.
//                 handleCryptoDonation(amount);
//             },
//             onError: (err) => {
//                 console.error('Coinbase On-Ramp Error:', err);
//                 setError('Fiat payment failed. Please try again.');
//                 setIsProcessing(false);
//                 setStatusMessage('');
//             },
//             onExit: () => {
//                 console.log('User exited Coinbase modal.');
//                 if (isProcessing) {
//                     // Only reset if they exited during a transaction
//                     setIsProcessing(false);
//                     setStatusMessage('');
//                     setError('');
//                 }
//             }
//         }, (instance, error) => {
//             if (error) {
//                 console.error('Failed to initialize Coinbase Pay:', error);
//                 setError('Payment service failed to load. Please refresh.');
//             } else {
//                 setOnrampInstance(instance);
//             }
//         });

//         // Cleanup instance on unmount
//         return () => {
//             onrampInstance?.destroy();
//         };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [memberWalletAddress, amount]); // Re-init if wallet or amount changes

//     /**
//      * PART 1: Kicks off the Coinbase Fiat-to-Crypto On-Ramp
//      */
//     const handleBuyAndDonate = async (e) => {
//         e.preventDefault();
//         if (!amount || isNaN(amount) || amount <= 0) {
//             setError('Please enter a valid USDC amount.');
//             return;
//         }
//         if (!web3AuthProvider) {
//             setError('Wallet not connected. Please reconnect.');
//             return;
//         }
//         if (!onrampInstance) {
//             setError('Payment service is not ready. Please wait.');
//             return;
//         }

//         setIsProcessing(true);
//         setError('');
//         setStatusMessage('Step 1/3: Opening fiat payment window...');

//         // Update instance parameters with the final amount
//         onrampInstance.setWidgetParameters({
//             destinationWallets: [{
//                 address: memberWalletAddress,
//                 blockchains: ['polygon'],
//                 assets: ['USDC'],
//             }],
//             destinationAmount: amount, // The amount in USDC
//             destinationAsset: 'USDC'
//         });

//         // Open the Coinbase Pay modal
//         onrampInstance.open();
//     };

//     /**
//      * PART 2: Sends the Crypto Donation using Web3Auth
//      */
//     const handleCryptoDonation = async (usdcAmount) => {
//         try {
//             // Get ethers provider and signer from Web3Auth
//             const provider = new ethers.providers.Web3Provider(web3AuthProvider);
//             const signer = provider.getSigner();

//             // Create a contract instance for USDC
//             const usdcContract = new ethers.Contract(MUMBAI_USDC_ADDRESS, USDC_ABI, signer);

//             // Convert amount to the correct decimal format (USDC has 6 decimals)
//             const amountInSmallestUnit = ethers.utils.parseUnits(usdcAmount, 6);
            
//             // This is the campaign's wallet address from your backend
//             const campaignWalletAddress = campaign.walletAddress; 
//             if (!campaignWalletAddress) {
//                 throw new Error("Campaign wallet address is missing.");
//             }

//             setStatusMessage('Step 2/3: Please approve the donation transaction in your wallet...');
            
//             // Send the USDC transfer transaction
//             const tx = await usdcContract.transfer(campaignWalletAddress, amountInSmallestUnit);
            
//             setStatusMessage('Step 2/3: Waiting for blockchain confirmation...');
//             await tx.wait(); // Wait for the transaction to be mined

//             console.log('Crypto Donation successful! TxHash:', tx.hash);
//             setStatusMessage('Step 3/3: Donation confirmed! Recording transaction...');

//             // PART 3: Record the donation in our backend
//             await recordDonationInBackend(usdcAmount, tx.hash);

//             setStatusMessage('Donation complete! Thank you, member.');
//             setTimeout(() => {
//                 onClose(true); // Close modal on success
//             }, 2000);

//         } catch (err) {
//             console.error('Crypto Donation Failed:', err);
//             setError(`Crypto donation failed: ${err.message}. Your fiat purchase may have succeeded, but the donation failed. Please check your wallet.`);
//             setStatusMessage('');
//             setIsProcessing(false); // Stop processing, but don't close modal
//         }
//     };

//     /**
//      * PART 3: Calls our backend to log the successful donation
//      */
//     const recordDonationInBackend = async (usdcAmount, txHash) => {
//         try {
//             const token = localStorage.getItem('token');
//             const response = await fetch('http://localhost:5000/api/payments/record-donation', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'x-auth-token': token,
//                 },
//                 body: JSON.stringify({
//                     campaignId: campaign._id,
//                     amount: parseFloat(usdcAmount),
//                     currency: 'USDC',
//                     txHash: txHash
//                 }),
//             });

//             const data = await response.json();
//             if (!data.success) {
//                 throw new Error(data.message || 'Failed to record donation on server.');
//             }
//             console.log('Donation recorded in backend.');
//         } catch (err) {
//             console.error('Failed to record donation:', err);
//             // This is not critical for the user, so we just log it.
//             // The donation *did* succeed on-chain.
//             setError('Donation successful, but failed to save to your profile. Please contact support with your transaction hash.');
//         }
//     };


//     // --- Render ---
//     // Show loading spinner if SDK is not ready
//     if (!onrampInstance) {
//         return (
//              <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
//                 <div className="bg-white p-6 md:p-8 rounded-lg shadow-2xl w-11/12 max-w-md text-center">
//                     <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
//                     <p className="mt-4 text-gray-600">Loading payment service...</p>
//                 </div>
//             </div>
//         )
//     }

//     return (
//         <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
//             <div className="bg-white p-6 md:p-8 rounded-lg shadow-2xl w-11/12 max-w-md">
//                 <h2 className="text-2xl font-bold mb-2 text-gray-800">Fund "{campaign.title}"</h2>
//                 <p className="mb-6 text-gray-600">You're donating with USDC on the Polygon network.</p>

//                 <form onSubmit={handleBuyAndDonate}>
//                     <div className="mb-4">
//                         <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Amount (USDC)</label>
//                         <input
//                             type="number"
//                             id="amount"
//                             className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
//                             placeholder="e.g., 10"
//                             value={amount}
//                             onChange={(e) => setAmount(e.target.value)}
//                             disabled={isProcessing}
//                         />
//                         <p className="text-xs text-gray-500 mt-1">Coinbase will show you the final price in INR.</p>
//                     </div>

//                     {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
//                     {statusMessage && <p className="text-blue-600 text-sm mb-4">{statusMessage}</p>}

//                     <div className="flex flex-col gap-3 mt-6">
//                         <button
//                             type="submit"
//                             className="w-full px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
//                             disabled={isProcessing || !onrampInstance}
//                         >
//                             {isProcessing ? statusMessage.split('...')[0] : `Buy & Donate ${amount || ''} USDC`}
//                         </button>
//                          <button
//                             type="button"
//                             onClick={() => onClose(false)}
//                             className="w-full px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 disabled:bg-gray-400"
//                             disabled={isProcessing}
//                         >
//                             Cancel
//                         </button>
//                     </div>
//                 </form>
//             </div>
//         </div>
//     );
// };

// DonationModal.propTypes = {
//     campaign: PropTypes.object.isRequired,
//     onClose: PropTypes.func.isRequired,
//     web3AuthProvider: PropTypes.object, // Pass the Web3Auth provider object
//     memberWalletAddress: PropTypes.string.isRequired, // Pass the member's wallet address
// };

// export default DonationModal;















// import { useState, useEffect, useCallback } from 'react';
// import PropTypes from 'prop-types';

// // We use the CDN links here for ethers and the Coinbase SDK
// // Ensure you have `npm install ethers` for local intellisense
// import { initOnRamp } from 'https://esm.sh/@coinbase/cbpay-js@2';
// import { ethers } from 'https://esm.sh/ethers@5';

// // Minimal ABIs (Application Binary Interfaces) for interacting with the contracts
// // This tells ethers.js how to call the `approve` function
// const usdcAbi = [
//   "function approve(address spender, uint256 amount) external returns (bool)"
// ];

// // This tells ethers.js how to call the `donate` function
// const escrowAbi = [
//   "function donate(uint256 _amount) public"
// ];

// // Main Component
// const DonationModal = ({ 
//   campaign, 
//   onClose, 
//   web3AuthProvider, 
//   memberWalletAddress,
//   coinbaseAppId // <-- NEW PROP: Your Coinbase Project ID
// }) => {
//   const [amount, setAmount] = useState('');
//   const [amountInUsdc, setAmountInUsdc] = useState(0);
//   const [onrampInstance, setOnrampInstance] = useState(null);
  
//   // State for the multi-step process
//   const [step, setStep] = useState('1_Amount'); // 1_Amount, 2_Confirm, 3_OnRamp, 4_Donating, 5_Success
//   const [statusMessage, setStatusMessage] = useState('');
//   const [error, setError] = useState('');
//   const [blockExplorerUrl, setBlockExplorerUrl] = useState('');

//   // --- CONFIGURATION ---
//   // We'll use Polygon Amoy, as per your Web3Auth context
//   const POLYGON_AMOY_USDC_ADDRESS = '0x41e94Eb019C0762f9BFCcf9fB93Afe843a41103A'; // This is a common Amoy USDC, please VERIFY this is the one you want
//   const INR_TO_USDC_RATE = 85; // Mock rate: 1 USDC = 85 INR. In production, you'd fetch this.

//   // 1. Initialize Coinbase Pay SDK
//   useEffect(() => {
//     if (initOnRamp && coinbaseAppId && memberWalletAddress) {
//       initOnRamp(
//         {
//           appId: coinbaseAppId,
//           widgetParameters: {
//             destinationWallets: [
//               {
//                 address: memberWalletAddress,
//                 blockchains: ['polygon-amoy'],
//                 assets: ['USDC'],
//               },
//             ],
//             defaultNetwork: 'polygon-amoy',
//           },
//           onSuccess: () => {
//             console.log('Coinbase Onramp success, proceeding to donation.');
//             setStep('4_Donating');
//             handleCryptoDonation(); // <-- Trigger the smart contract donation
//           },
//           onExit: (error) => {
//             console.log('Coinbase Onramp exited.');
//             if (error) {
//               setError(`Payment failed: ${error.message}`);
//             }
//             setStep('2_Confirm'); // Go back to confirm step
//           },
//           onEvent: (event) => {
//             console.log('Coinbase Event:', event);
//           },
//         },
//         (instance, error) => {
//           if (error) {
//             console.error("Failed to initialize Coinbase Pay:", error);
//             setError(`Coinbase Pay SDK failed to load. Please refresh. (${error.message})`);
//           } else {
//             setOnrampInstance(instance);
//           }
//         }
//       );
//     }

//     // Cleanup on unmount
//     return () => {
//       onrampInstance?.destroy();
//     };
//   }, [coinbaseAppId, memberWalletAddress]); // Only re-run if these change

//   // 2. Handle the "Continue" button press
//   const handleAmountSubmit = (e) => {
//     e.preventDefault();
//     const inrValue = parseFloat(amount);
//     if (!amount || isNaN(inrValue) || inrValue <= 0) {
//       setError('Please enter a valid INR amount.');
//       return;
//     }
    
//     // Convert INR to USDC
//     const usdcValue = (inrValue / INR_TO_USDC_RATE).toFixed(6); // 6 decimal places for USDC
//     setAmountInUsdc(usdcValue);
//     setError('');
//     setStep('2_Confirm');
//   };

//   // 3. Handle the "Buy & Donate" button press
//   const handleCoinbaseOnramp = () => {
//     if (!onrampInstance) {
//       setError('Payment SDK is not ready. Please wait or refresh.');
//       return;
//     }
    
//     // This will open the Coinbase modal
//     setStep('3_OnRamp');
//     onrampInstance.open({
//       defaultAmount: amountInUsdc,
//       defaultAsset: 'USDC',
//     });
//   };

//   // 4. Handle the Smart Contract Donation (The core logic)
//   const handleCryptoDonation = async () => {
//     if (!web3AuthProvider) {
//       setError('Web3 Provider is missing. Cannot send transaction.');
//       setStep('1_Amount');
//       return;
//     }

//     try {
//       // Get the ethers provider and signer from Web3Auth
//       const ethersProvider = new ethers.BrowserProvider(web3AuthProvider);
//       const signer = await ethersProvider.getSigner();

//       // Convert the USDC amount to the smallest unit (Wei)
//       // USDC has 6 decimals, not 18 like ETH
//       const amountInWei = ethers.parseUnits(amountInUsdc.toString(), 6);
      
//       const escrowContractAddress = campaign.escrowAddress; // <-- Using the new prop
//       if (!escrowContractAddress) {
//         throw new Error("Campaign escrow contract address is missing.");
//       }

//       // --- Step A: Approve Transaction ---
//       setStatusMessage('Please approve the USDC spending in your wallet...');
      
//       const usdcContract = new ethers.Contract(POLYGON_AMOY_USDC_ADDRESS, usdcAbi, signer);
      
//       const approveTx = await usdcContract.approve(escrowContractAddress, amountInWei);
//       await approveTx.wait(); // Wait for the approval to be mined
      
//       // --- Step B: Donate Transaction ---
//       setStatusMessage('Approval successful! Now sending your donation...');

//       const escrowContract = new ethers.Contract(escrowContractAddress, escrowAbi, signer);
      
//       const donateTx = await escrowContract.donate(amountInWei);
//       const txReceipt = await donateTx.wait(); // Wait for the donation to be mined

//       const txHash = txReceipt.hash;
//       const explorerUrl = `https://amoy.polygonscan.com/tx/${txHash}`;
      
//       setBlockExplorerUrl(explorerUrl);
//       setStatusMessage('Donation successful! Thank you for your contribution.');
//       setStep('5_Success');
      
//       // Call your backend to record this successful donation
//       await recordDonationToBackend(txHash);

//     } catch (err) {
//       console.error("Donation failed:", err);
//       setError(`Donation failed: ${err.message}. Please try again.`);
//       setStatusMessage('');
//       setStep('2_Confirm'); // Reset to confirm step
//     }
//   };

//   // 5. Record the donation in your database (Part 3 of our original plan)
//   const recordDonationToBackend = async (txHash) => {
//     try {
//       const token = localStorage.getItem('token');
//       const response = await fetch('http://localhost:5000/api/payments/record-donation', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'x-auth-token': token,
//         },
//         body: JSON.stringify({
//           campaignId: campaign._id,
//           amount: parseFloat(amountInUsdc),
//           currency: 'USDC',
//           txHash: txHash,
//         }),
//       });

//       const data = await response.json();
//       if (!data.success) {
//         // This is not critical to the user, so just log it
//         console.error("Failed to record donation to backend:", data.message);
//       } else {
//         console.log("Donation successfully recorded to backend.");
//       }
//     } catch (err) {
//       console.error("Error recording donation to backend:", err);
//     }
//   };

//   // --- RENDER FUNCTIONS ---

//   const renderStep1_Amount = () => (
//     <form onSubmit={handleAmountSubmit}>
//       <h2 className="text-2xl font-bold mb-2 text-gray-800">Fund "{campaign.title}"</h2>
//       <p className="mb-6 text-gray-600">Enter the amount in INR you'd like to contribute.</p>
      
//       <div className="mb-4">
//         <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Amount (INR)</label>
//         <input
//           type="number"
//           id="amount"
//           className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
//           placeholder="e.g., 500"
//           value={amount}
//           onChange={(e) => setAmount(e.target.value)}
//         />
//       </div>
      
//       <div className="flex flex-col gap-3 mt-6">
//         <button type="submit" className="w-full px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700">
//           Continue
//         </button>
//         <button type="button" onClick={() => onClose(false)} className="w-full px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300">
//           Cancel
//         </button>
//       </div>
//     </form>
//   );

//   const renderStep2_Confirm = () => (
//     <div>
//       <h2 className="text-2xl font-bold mb-2 text-gray-800">Confirm Donation</h2>
//       <p className="mb-6 text-gray-600">You are about to donate:</p>
      
//       <div className="bg-gray-100 p-4 rounded-lg text-center mb-4">
//         <div className="text-3xl font-bold text-gray-800">{amountInUsdc} USDC</div>
//         <div className="text-sm text-gray-600">(~ ₹{amount})</div>
//       </div>
      
//       <p className="text-xs text-gray-500 mb-6">
//         You will be redirected to Coinbase to purchase {amountInUsdc} USDC which will then be automatically donated to the campaign's smart contract.
//       </p>

//       <div className="flex flex-col gap-3 mt-6">
//         <button 
//           onClick={handleCoinbaseOnramp} 
//           disabled={!onrampInstance}
//           className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
//           {onrampInstance ? 'Buy & Donate with Coinbase' : 'Loading SDK...'}
//         </button>
//         <button type="button" onClick={() => setStep('1_Amount')} className="w-full px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300">
//           Back
//         </button>
//       </div>
//     </div>
//   );
  
//   const renderStep3_OnRamp = () => (
//     <div className="text-center p-8">
//       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
//       <h2 className="text-xl font-semibold mt-4 text-gray-800">Redirecting to Coinbase...</h2>
//       <p className="text-gray-600 mt-2">Please complete your purchase in the Coinbase window.</p>
//     </div>
//   );

//   const renderStep4_Donating = () => (
//     <div className="text-center p-8">
//       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
//       <h2 className="text-xl font-semibold mt-4 text-gray-800">Processing Donation...</h2>
//       <p className="text-gray-600 mt-2">{statusMessage}</p>
//       <p className="text-xs text-gray-500 mt-4">This involves two transactions (approve and donate). Please wait.</p>
//     </div>
//   );

//   const renderStep5_Success = () => (
//     <div className="text-center p-8">
//       <svg className="w-16 h-16 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
//       <h2 className="text-2xl font-bold mt-4 text-gray-800">Thank You!</h2>
//       <p className="text-gray-600 mt-2">{statusMessage}</p>
      
//       <a 
//         href={blockExplorerUrl} 
//         target="_blank" 
//         rel="noopener noreferrer"
//         className="text-blue-600 hover:underline mt-4 inline-block"
//       >
//         View your transaction on Polygonscan
//       </a>

//       <button 
//         onClick={() => onClose(true)} 
//         className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 mt-8">
//         Done
//       </button>
//     </div>
//   );
  
//   // Main render logic
//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
//       <div className="bg-white p-6 md:p-8 rounded-lg shadow-2xl w-full max-w-md">
//         {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        
//         {step === '1_Amount' && renderStep1_Amount()}
//         {step === '2_Confirm' && renderStep2_Confirm()}
//         {step === '3_OnRamp' && renderStep3_OnRamp()}
//         {step === '4_Donating' && renderStep4_Donating()}
//         {step === '5_Success' && renderStep5_Success()}

//       </div>
//     </div>
//   );
// };

// DonationModal.propTypes = {
//   campaign: PropTypes.object.isRequired,
//   onClose: PropTypes.func.isRequired,
//   web3AuthProvider: PropTypes.object, // It's null until user logs in
//   memberWalletAddress: PropTypes.string,
//   coinbaseAppId: PropTypes.string.isRequired, // Make this required
// };

// export default DonationModal;

















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
  coinbaseAppId,
  escrowAddress // The address of your ProjectEscrow.sol contract
}) => {
  const [inrAmount, setInrAmount] = useState('');
  const [usdcAmount, setUsdcAmount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [onrampInstance, setOnrampInstance] = useState(null);
  
  // New state to manage the donation flow
  // '1_Amount', '2_Confirm', '3_Purchase', '4_Approving', '5_Donating', '6_Success'
  const [step, setStep] = useState('1_Amount'); 
  const [txHash, setTxHash] = useState(''); // To store the final transaction hash

  // This is a mock rate. In a real app, you'd fetch this from an oracle or API.
  const INR_TO_USDC_RATE = 85; 

  // --- NEW: Robust Coinbase SDK Initializer ---
  useEffect(() => {
    let instance = null;
    let poller = null;

    const initCoinbasePay = () => {
      // Check if the SDK is *actually* ready
      if (!window.CoinbasePay || typeof window.CoinbasePay.initOnRamp !== 'function') {
        setError("Coinbase Pay SDK failed to initialize. Please try refreshing.");
        console.error("initCoinbasePay called, but window.CoinbasePay.initOnRamp is still not available.");
        return;
      }

      console.log("Coinbase Pay SDK is ready, initializing...");

      // Initialize the onramp SDK
      window.CoinbasePay.initOnRamp(
        {
          appId: coinbaseAppId,
          widgetParameters: {
            destinationWallets: [
              {
                address: memberWalletAddress,
                blockchains: ['polygon-amoy'],
                assets: ['USDC'], // Make sure this matches your token
              },
            ],
            defaultNetwork: 'polygon-amoy',
          },
          onSuccess: () => {
            console.log('Coinbase Onramp success, proceeding to donation.');
            // The funds are now in the member's wallet.
            // Move to the crypto donation step.
            setStep('4_Approving'); // Show "Approving..."
            handleCryptoDonation(); 
          },
          onExit: (error) => {
            console.log('Coinbase Onramp exited.');
            if (error) {
              const errorMessage = error.message || JSON.stringify(error);
              setError(`Payment was cancelled or failed: ${errorMessage}`);
            }
            // Go back to the confirmation step
            setStep('2_Confirm'); 
          },
          onEvent: (event) => {
            console.log('Coinbase Event:', event);
          },
        },
        (sdkInstance, error) => {
          if (error) {
            const errorMessage = error.message || JSON.stringify(error);
            console.error("Failed to initialize Coinbase Pay:", error);
            setError(`Coinbase Pay SDK failed to load. Please refresh. (${errorMessage})`);
          } else {
            setOnrampInstance(sdkInstance);
            instance = sdkInstance; // Save for cleanup
            setError(''); // Clear any "loading" errors
          }
        }
      );
    };

    // --- Main Logic ---
    if (onrampInstance) {
      // Already initialized
      return;
    }

    // Case 1: SDK is already loaded.
    if (window.CoinbasePay && typeof window.CoinbasePay.initOnRamp === 'function') {
      console.log("Coinbase SDK was already loaded.");
      initCoinbasePay();
    } else {
      // Case 2: SDK is not loaded yet. Poll for it.
      setError("Loading payment provider...");
      let attempts = 0;
      poller = setInterval(() => {
        attempts++;
        if (window.CoinbasePay && typeof window.CoinbasePay.initOnRamp === 'function') {
          // Found it!
          clearInterval(poller);
          setError(''); // Clear "loading" message
          initCoinbasePay();
        } else if (attempts > 20) { // Timeout after 10 seconds
          clearInterval(poller);
          setError("Failed to load payment provider. Please check your internet connection and refresh.");
          console.error("Coinbase SDK polling timed out.");
        }
      }, 500); // Check every 500ms
    }

    // Cleanup
    return () => {
      if (poller) {
        clearInterval(poller);
      }
      if (instance && typeof instance.destroy === 'function') {
        console.log("Destroying Coinbase Pay instance");
        instance.destroy();
      }
    };
    
  }, [coinbaseAppId, memberWalletAddress, onrampInstance]); // Re-run if these change

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

  // 3. Handle the "Buy with Coinbase" button press
  const handleCoinbasePurchase = () => {
    if (!onrampInstance) {
      setError('Coinbase Pay is not ready. Please wait a moment.');
      return;
    }

    // Set the amount for the onramp
    onrampInstance.setPurchaseAmount({
      amount: usdcAmount.toString(),
      currency: 'USDC',
    });
    
    setStep('3_Purchase'); // Show "Purchasing..."
    onrampInstance.open();
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
              disabled={isProcessing || !onrampInstance}
            >
              {onrampInstance ? 'Continue' : 'Loading Payments...'}
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
            <p className="text-xs text-gray-500 mt-2">You will purchase {usdcAmount} USDC on the Polygon Amoy network, which will then be donated to the campaign's escrow contract.</p>
            
            {error && <p className="text-red-500 text-sm my-4">{error}</p>}

            <button
              onClick={handleCoinbasePurchase}
              className="w-full mt-6 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              disabled={isProcessing}
            >
              Buy & Donate with Coinbase
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
          '3_Purchase': 'Purchasing USDC... Follow the Coinbase popup.',
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
  coinbaseAppId: PropTypes.string.isRequired,
  escrowAddress: PropTypes.string.isRequired,
};

export default DonationModal;

