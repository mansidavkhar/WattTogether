// import { createContext, useContext, useState, useEffect, useCallback } from 'react';
// import { Web3Auth } from "@web3auth/modal";
// import { CHAIN_NAMESPACES } from "@web3auth/base";
// import { ethers } from "ethers";

// // 1. Create the context to be shared across the application
// const Web3AuthContext = createContext(null);

// // 2. Create the Provider component that will wrap your app
// export const Web3AuthProvider = ({ children }) => {
//     const [web3auth, setWeb3auth] = useState(null);
//     const [provider, setProvider] = useState(null);
//     const [walletAddress, setWalletAddress] = useState(null);
//     const [isLoading, setIsLoading] = useState(true);
//     const [error, setError] = useState(null);

//     // --- IMPORTANT ---
//     // Replace this with the Client ID you copied from the Web3Auth Dashboard.
//     // For best practice, store this in your .env file as VITE_WEB3AUTH_CLIENT_ID
//     const clientId = import.meta.env.VITE_WEB3AUTH_CLIENT_ID;

//     // This effect initializes the Web3Auth instance as soon as the provider mounts.
//     useEffect(() => {
//         const init = async () => {
//             if (!clientId) {
//                 setError("Web3Auth Client ID is missing. Please add it to Web3AuthContext.jsx");
//                 setIsLoading(false);
//                 return;
//             }
//             try {
//                 // Initialize the Web3Auth modal
//                 const web3AuthInstance = new Web3Auth({
//                     clientId,
//                     web3AuthNetwork: "sapphire_devnet", // Use "sapphire_mainnet" for production
//                     chainConfig: {
//                         chainNamespace: CHAIN_NAMESPACES.EIP155, // Standard for EVM chains
//                         chainId: "0x13881", // Hexadecimal code for Polygon Mumbai testnet
//                         rpcTarget: "https://rpc.ankr.com/polygon_mumbai", // Public RPC endpoint
//                         displayName: "Polygon Mumbai Testnet",
//                         blockExplorer: "https://mumbai.polygonscan.com/",
//                         ticker: "MATIC",
//                         tickerName: "Matic",
//                     },
//                     uiConfig: {
//                         theme: "dark",
//                         loginMethodsOrder: ["google", "facebook", "email_passwordless"],
//                         appLogo: "../assets/wattTogether_logo.png", // Optional: Add your app's logo URL
//                     },
//                 });

//                 await web3AuthInstance.initModal();
//                 setWeb3auth(web3AuthInstance);
//             } catch (err) {
//                 console.error("Web3Auth Initialization Error:", err);
//                 setError("Could not initialize Web3Auth. Please refresh the page.");
//             } finally {
//                 setIsLoading(false);
//             }
//         };
//         init();
//     }, [clientId]);

//     // Function to connect the wallet. This is called from the Dashboard after a user logs in.
//     const connectWallet = useCallback(async () => {
//         if (!web3auth) {
//             console.log("Web3Auth not initialized yet.");
//             setError("Web3Auth is not ready, please wait.");
//             return;
//         }
//         setIsLoading(true);
//         setError(null);
//         try {
//             // This opens the Web3Auth modal and connects the user.
//             const web3authProvider = await web3auth.connect();
//             setProvider(web3authProvider);
            
//             // Use ethers.js to wrap the provider and get the wallet address
//             const ethersProvider = new ethers.providers.Web3Provider(web3authProvider);
//             const signer = ethersProvider.getSigner();
//             const address = await signer.getAddress();
            
//             setWalletAddress(address);
            
//             // After getting the address, immediately save it to the user's profile on the backend.
//             await saveWalletAddressToDB(address);

//         } catch (err) {
//             console.error("Wallet Connection Error:", err);
//             setError("Failed to connect wallet. Please try again.");
//         } finally {
//             setIsLoading(false);
//         }
//     }, [web3auth]);
    
//     // Function to securely send the new wallet address to your backend API.
//     const saveWalletAddressToDB = async (address) => {
//         const token = localStorage.getItem('token');
//         if (!token) {
//             console.error("Authentication token not found. Cannot save wallet address.");
//             return;
//         }

//         try {
//             // Make sure your .env file has VITE_API_GATEWAY_URL="http://localhost:5000"
//             const apiBaseUrl = import.meta.env.VITE_API_GATEWAY_URL;
//             const response = await fetch(`${apiBaseUrl}/api/members/save-wallet`, {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                     'Authorization': `Bearer ${token}` // Send the JWT for authentication
//                 },
//                 body: JSON.stringify({ walletAddress: address })
//             });
//             const data = await response.json();
//             if (!data.success) {
//                 console.error("Backend Error: Failed to save wallet address:", data.message);
//             } else {
//                 console.log("Success: Wallet address has been securely saved to your member profile!");
//             }
//         } catch(err) {
//             console.error("Network Error: Could not save wallet address to DB:", err);
//         }
//     };

//     // Function to log the user out of Web3Auth.
//     const disconnectWallet = async () => {
//         if (!web3auth) {
//             console.log("Web3Auth not initialized yet.");
//             return;
//         }
//         await web3auth.logout();
//         setProvider(null);
//         setWalletAddress(null);
//     };

//     // The value object contains all the state and functions to be shared with consuming components.
//     const value = {
//         connectWallet,
//         disconnectWallet,
//         walletAddress,
//         provider,
//         isLoading,
//         error,
//     };

//     return (
//         <Web3AuthContext.Provider value={value}>
//             {children}
//         </Web3AuthContext.Provider>
//     );
// };

// // 3. Create a custom hook for easy and clean access to the context's values.
// export const useWeb3Auth = () => {
//     const context = useContext(Web3AuthContext);
//     if (context === null) {
//         throw new Error("useWeb3Auth must be used within a Web3AuthProvider. Did you forget to wrap your App in the provider?");
//     }
//     return context;
// };


import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES } from "@web3auth/base";
import { ethers } from "ethers";

// 1. Create the context
const Web3AuthContext = createContext(null);

// 2. Create the Provider component
export const Web3AuthProvider = ({ children }) => {
    const [web3auth, setWeb3auth] = useState(null);
    const [provider, setProvider] = useState(null);
    const [walletAddress, setWalletAddress] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const clientId = import.meta.env.VITE_WEB3AUTH_CLIENT_ID;

    // Effect to initialize Web3Auth on component mount
    useEffect(() => {
        const init = async () => {
            if (!clientId) {
                setError("Web3Auth Client ID is missing. Please add it to your .env file.");
                setIsLoading(false);
                return;
            }
            try {
                const web3AuthInstance = new Web3Auth({
                    clientId,
                    web3AuthNetwork: "sapphire_devnet",
                    chainConfig: {
                        chainNamespace: CHAIN_NAMESPACES.EIP155,
                        chainId: "0x13881", // Polygon Mumbai
                        rpcTarget: "https://rpc.ankr.com/polygon_mumbai",
                        displayName: "Polygon Mumbai Testnet",
                        blockExplorer: "https://mumbai.polygonscan.com/",
                        ticker: "MATIC",
                        tickerName: "Matic",
                    },
                    uiConfig: {
                        theme: "dark",
                        loginMethodsOrder: ["google", "facebook", "email_passwordless"],
                        appLogo: "https://placehold.co/100x100/1E2A3B/FFFFFF?text=WT",
                    },
                });

                await web3AuthInstance.init();
                setWeb3auth(web3AuthInstance);

                // If user is already logged in to Web3Auth, get their info
                if (web3AuthInstance.connected) {
                    const web3authProvider = web3AuthInstance.provider;
                    setProvider(web3authProvider);
                    const ethersProvider = new ethers.BrowserProvider(web3authProvider);
                    const signer = await ethersProvider.getSigner();
                    const address = await signer.getAddress();
                    setWalletAddress(address);
                }
            } catch (err) {
                console.error("Web3Auth Initialization Error:", err);
                setError("Could not initialize Web3Auth. Please refresh the page.");
            } finally {
                setIsLoading(false);
            }
        };
        init();
    }, [clientId]);

    // Function to save the wallet address to your backend
    const saveWalletAddressToDB = useCallback(async (address) => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error("Auth token not found, cannot save wallet address.");
            return;
        }
        try {
            const apiBaseUrl = import.meta.env.VITE_API_GATEWAY_URL;
            const response = await fetch(`${apiBaseUrl}/api/members/save-wallet`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ walletAddress: address })
            });
            const data = await response.json();
            if (data.success) {
                console.log("Success: Wallet address saved to member profile!");
            } else {
                console.error("Backend Error:", data.message);
            }
        } catch (err) {
            console.error("Network Error: Could not save wallet address:", err);
        }
    }, []);

    // Function to connect wallet, get address, and save it
    const connectWallet = useCallback(async () => {
        if (!web3auth) {
            setError("Web3Auth is not ready, please wait.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const web3authProvider = await web3auth.connect();
            setProvider(web3authProvider);
            
            const ethersProvider = new ethers.BrowserProvider(web3authProvider);
            const signer = await ethersProvider.getSigner();
            const address = await signer.getAddress();
            
            setWalletAddress(address);
            await saveWalletAddressToDB(address);

        } catch (err) {
            console.error("Wallet Connection Error:", err);
            // Don't show an error if the user just closes the modal
            if (err.code !== 4001) {
                 setError("Failed to connect wallet. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    }, [web3auth, saveWalletAddressToDB]);
    
    // Function to disconnect wallet
    const disconnectWallet = useCallback(async () => {
        if (!web3auth) return;
        try {
            await web3auth.logout();
            setProvider(null);
            setWalletAddress(null);
        } catch (err) {
            console.error("Logout Error:", err);
            setError("Failed to disconnect wallet.");
        }
    }, [web3auth]);

    // The value provided to consuming components
    const value = {
        connectWallet,
        disconnectWallet,
        walletAddress,
        provider,
        isLoading,
        error,
    };

    return (
        <Web3AuthContext.Provider value={value}>
            {children}
        </Web3AuthContext.Provider>
    );
};

// 3. Create a custom hook for easy access to the context
export const useWeb3Auth = () => {
    const context = useContext(Web3AuthContext);
    if (context === null) {
        throw new Error("useWeb3Auth must be used within a Web3AuthProvider.");
    }
    return context;
};

