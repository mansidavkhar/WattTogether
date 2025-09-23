// import { useEffect } from 'react';
// import { useWeb3Auth } from '../context/Web3AuthContext';

// const Wallet = () => {
//     // Use our custom hook to get context values
//     const { 
//         connectWithCustomJWT, 
//         disconnectWallet, 
//         walletAddress, 
//         isLoading, 
//         error 
//     } = useWeb3Auth();

//     // This effect runs once when the component mounts
//     useEffect(() => {
//         // Check if user has both regular token AND id_token for Web3Auth
//         const token = localStorage.getItem('token');
//         const idToken = localStorage.getItem('id_token');
        
//         if (token && idToken && !walletAddress) {
//             console.log('Auto-connecting wallet with existing tokens...');
//             connectWithCustomJWT();
//         }
//     }, [connectWithCustomJWT, walletAddress]);

//     // Manual connect function
//     const handleConnectWallet = async () => {
//         const token = localStorage.getItem('token');
//         const idToken = localStorage.getItem('id_token');
        
//         if (!token) {
//             alert('Please login to your account first!');
//             return;
//         }
        
//         if (!idToken) {
//             alert('Authentication token missing. Please login again.');
//             return;
//         }
        
//         await connectWithCustomJWT();
//     };

//     return (
//         <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
//             <h1 className="text-4xl font-bold mb-4">Member Wallet</h1>
//             <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-2xl text-center">
//                 <h2 className="text-2xl mb-4 text-cyan-400">Your Web3 Wallet</h2>
                
//                 {/* Loading State */}
//                 {isLoading && (
//                     <div className="flex flex-col items-center">
//                         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mb-4"></div>
//                         <p className="text-lg">Connecting your secure wallet...</p>
//                     </div>
//                 )}
                
//                 {/* Error State */}
//                 {error && (
//                     <div className="bg-red-800 border border-red-600 p-4 rounded-md mb-4">
//                         <p className="text-red-200">❌ {error}</p>
//                         <button 
//                             onClick={handleConnectWallet}
//                             className="mt-2 bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm transition-colors"
//                         >
//                             Try Again
//                         </button>
//                     </div>
//                 )}
                
//                 {/* Connected State */}
//                 {walletAddress && (
//                     <div className="space-y-4">
//                         <div className="bg-green-800 border border-green-600 p-4 rounded-md">
//                             <p className="text-green-200 mb-2">✅ Wallet Successfully Connected!</p>
//                         </div>
                        
//                         <div>
//                             <p className="text-lg mb-2 text-gray-300">Your Wallet Address:</p>
//                             <div className="bg-gray-700 p-3 rounded-md font-mono text-sm break-all border">
//                                 {walletAddress}
//                             </div>
//                             <p className="text-xs text-gray-400 mt-1">
//                                 This is your unique blockchain wallet address
//                             </p>
//                         </div>
                        
//                         <button 
//                             onClick={disconnectWallet} 
//                             className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded transition-colors"
//                         >
//                             Disconnect Wallet
//                         </button>
//                     </div>
//                 )}
                
//                 {/* Not Connected State */}
//                 {!walletAddress && !isLoading && (
//                     <div className="space-y-4">
//                         <div className="bg-yellow-800 border border-yellow-600 p-4 rounded-md">
//                             <p className="text-yellow-200">🔐 Connect your secure Web3 wallet using your account credentials</p>
//                         </div>
                        
//                         <button 
//                             onClick={handleConnectWallet}
//                             className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-6 rounded-lg transition-colors text-lg"
//                         >
//                             Connect Wallet with Custom Auth
//                         </button>
                        
//                         <p className="text-sm text-gray-400">
//                             Uses your existing login to create a secure blockchain wallet
//                         </p>
//                     </div>
//                 )}
                
//                 {/* Auth Status Info */}
//                 <div className="mt-6 pt-4 border-t border-gray-700">
//                     <p className="text-xs text-gray-500">
//                         Auth Status: {localStorage.getItem('token') ? '✅ Logged In' : '❌ Not Logged In'} | 
//                         JWT Token: {localStorage.getItem('id_token') ? '✅ Available' : '❌ Missing'}
//                     </p>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default Wallet;













import { useEffect } from 'react';
import { useWeb3Auth } from '../context/Web3AuthContext';

const Wallet = () => {
    const { 
        connectWithCustomJWT, 
        disconnectWallet, 
        walletAddress, 
        isLoading, 
        isConnecting,
        error 
    } = useWeb3Auth();

    // Remove auto-connect on mount to prevent multiple connection attempts
    useEffect(() => {
        // Only log the token status, don't auto-connect
        const token = localStorage.getItem('token');
        const idToken = localStorage.getItem('id_token');
        
        console.log('Wallet component mounted, token status:', {
            regularToken: token ? 'Present' : 'Missing',
            idToken: idToken ? 'Present' : 'Missing'
        });
    }, []);

    // Manual connect function
    const handleConnectWallet = async () => {
        const token = localStorage.getItem('token');
        const idToken = localStorage.getItem('id_token');
        
        if (!token) {
            alert('Please login to your account first!');
            return;
        }
        
        if (!idToken) {
            alert('Authentication token missing. Please login again.');
            return;
        }
        
        await connectWithCustomJWT();
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
            <h1 className="text-4xl font-bold mb-4">Member Wallet</h1>
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-2xl text-center">
                <h2 className="text-2xl mb-4 text-cyan-400">Your Web3 Wallet</h2>
                
                {/* Loading/Connecting State */}
                {(isLoading || isConnecting) && (
                    <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mb-4"></div>
                        <p className="text-lg">
                            {isConnecting ? "Connecting your wallet..." : "Loading Web3Auth..."}
                        </p>
                    </div>
                )}
                
                {/* Error State */}
                {error && !isLoading && !isConnecting && (
                    <div className="bg-red-800 border border-red-600 p-4 rounded-md mb-4">
                        <p className="text-red-200">❌ {error}</p>
                        <button 
                            onClick={handleConnectWallet}
                            className="mt-2 bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm transition-colors"
                            disabled={isConnecting}
                        >
                            Try Again
                        </button>
                    </div>
                )}
                
                {/* Connected State */}
                {walletAddress && !isLoading && !isConnecting && (
                    <div className="space-y-4">
                        <div className="bg-green-800 border border-green-600 p-4 rounded-md">
                            <p className="text-green-200 mb-2">✅ Wallet Successfully Connected!</p>
                        </div>
                        
                        <div>
                            <p className="text-lg mb-2 text-gray-300">Your Wallet Address:</p>
                            <div className="bg-gray-700 p-3 rounded-md font-mono text-sm break-all border">
                                {walletAddress}
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                                This is your unique blockchain wallet address
                            </p>
                        </div>
                        
                        <button 
                            onClick={disconnectWallet} 
                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded transition-colors"
                            disabled={isConnecting}
                        >
                            Disconnect Wallet
                        </button>
                    </div>
                )}
                
                {/* Not Connected State */}
                {!walletAddress && !isLoading && !isConnecting && (
                    <div className="space-y-4">
                        <div className="bg-yellow-800 border border-yellow-600 p-4 rounded-md">
                            <p className="text-yellow-200">🔐 Connect your secure Web3 wallet using your account credentials</p>
                        </div>
                        
                        <button 
                            onClick={handleConnectWallet}
                            className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-6 rounded-lg transition-colors text-lg"
                            disabled={isConnecting}
                        >
                            Connect Wallet with Custom Auth
                        </button>
                        
                        <p className="text-sm text-gray-400">
                            Uses your existing login to create a secure blockchain wallet
                        </p>
                    </div>
                )}
                
                {/* Auth Status Info */}
                <div className="mt-6 pt-4 border-t border-gray-700">
                    <p className="text-xs text-gray-500">
                        Auth Status: {localStorage.getItem('token') ? '✅ Logged In' : '❌ Not Logged In'} | 
                        JWT Token: {localStorage.getItem('id_token') ? '✅ Available' : '❌ Missing'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Wallet;
