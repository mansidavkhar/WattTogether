import { useEffect } from 'react';
import { useWeb3Auth } from '../context/Web3AuthContext';

const Wallet = () => {
    // Use our custom hook to get context values
    const { connectWallet, disconnectWallet, walletAddress, isLoading, error } = useWeb3Auth();

    // This effect runs once when the component mounts
    useEffect(() => {
        // Only try to connect if there's a token and we don't already have a wallet address
        const token = localStorage.getItem('token');
        if (token && !walletAddress) {
            connectWallet();
        }
    }, [connectWallet, walletAddress]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
            <h1 className="text-4xl font-bold mb-4">Member Wallet</h1>
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-2xl text-center">
                <h2 className="text-2xl mb-4 text-cyan-400">Your Web3 Wallet</h2>
                {isLoading && <p className="text-lg">Connecting your secure wallet...</p>}
                {error && <p className="text-red-400">Error: {error}</p>}
                {walletAddress && (
                    <div>
                        <p className="text-lg mb-2">Wallet Address:</p>
                        <p className="bg-gray-700 p-3 rounded-md font-mono text-sm break-all">{walletAddress}</p>
                        <button 
                            onClick={disconnectWallet} 
                            className="mt-6 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors"
                        >
                            Disconnect Wallet
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Wallet;
