import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES, WALLET_ADAPTERS } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import { ethers } from "ethers";

const Web3AuthContext = createContext(null);

export const Web3AuthProvider = ({ children }) => {
    const [web3auth, setWeb3auth] = useState(null);
    const [provider, setProvider] = useState(null);
    const [walletAddress, setWalletAddress] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false); // Add this to prevent multiple connections

    const clientId = import.meta.env.VITE_WEB3AUTH_CLIENT_ID;
    const verifierName = import.meta.env.VITE_WEB3AUTH_VERIFIER_NAME;

    useEffect(() => {
        const init = async () => {
            if (!clientId) {
                setError("Web3Auth Client ID is missing.");
                setIsLoading(false);
                return;
            }

            if (!verifierName) {
                setError("Web3Auth Verifier name is missing.");
                setIsLoading(false);
                return;
            }

            try {
                // Chain configuration
                const chainConfig = {
                    chainNamespace: CHAIN_NAMESPACES.EIP155,
                    chainId: "0x13882",
                    rpcTarget: "https://rpc-amoy.polygon.technology",
                    displayName: "Polygon Amoy Testnet",
                    blockExplorerUrl: "https://amoy.polygonscan.com/",
                    ticker: "POL",
                    tickerName: "Polygon",
                };

                // Create the private key provider
                const privateKeyProvider = new EthereumPrivateKeyProvider({
                    config: { chainConfig },
                });

                // Initialize Web3Auth
                const web3AuthInstance = new Web3Auth({
                    clientId,
                    web3AuthNetwork: "sapphire_devnet",
                    privateKeyProvider,
                    chainConfig,
                    uiConfig: {
                        loginMethodsOrder: [],
                        theme: { primary: "#768729" },
                    },
                });

                // Configure Openlogin Adapter for Custom JWT
                const openloginAdapter = new OpenloginAdapter({
                    privateKeyProvider,
                    adapterSettings: {
                        network: "sapphire_devnet",
                        uxMode: "popup",
                        loginConfig: {
                            jwt: {
                                name: "Custom JWT",
                                verifier: verifierName,
                                typeOfLogin: "jwt",
                                clientId
                            }
                        }
                    }
                });
                web3AuthInstance.configureAdapter(openloginAdapter);

                await web3AuthInstance.initModal();
                setWeb3auth(web3AuthInstance);

                // Check if already connected (but don't auto-connect)
                if (web3AuthInstance.connected) {
                    console.log("Web3Auth already connected, getting provider...");
                    const web3authProvider = web3AuthInstance.provider;
                    if (web3authProvider) {
                        setProvider(web3authProvider);
                        const ethersProvider = new ethers.BrowserProvider(web3authProvider);
                        const signer = await ethersProvider.getSigner();
                        const address = await signer.getAddress();
                        setWalletAddress(address);
                    }
                }

            } catch (err) {
                console.error("Web3Auth Error:", err);
                setError("Could not initialize Web3Auth.");
            } finally {
                setIsLoading(false);
            }
        };
        
        init();
    }, [clientId]);

    // Custom JWT wallet connection with proper connection management
    const connectWithCustomJWT = useCallback(async () => {
        if (!web3auth) {
            setError("Web3Auth is not ready, please wait.");
            return;
        }

        if (isConnecting) {
            console.log("Already connecting, please wait...");
            return;
        }

        if (web3auth.connected) {
            console.log("Already connected, getting existing wallet...");
            try {
                const ethersProvider = new ethers.BrowserProvider(web3auth.provider);
                const signer = await ethersProvider.getSigner();
                const address = await signer.getAddress();
                setWalletAddress(address);
                await saveWalletToBackend(address);
            } catch (err) {
                console.error("Error getting existing wallet:", err);
            }
            return;
        }

        setIsConnecting(true);
        setIsLoading(true);
        setError(null);

        try {
            // Get tokens
            const idToken = localStorage.getItem('id_token');
            const regularToken = localStorage.getItem('token');
            
            console.log('Tokens check:', {
                idToken: idToken ? 'Present' : 'Missing',
                regularToken: regularToken ? 'Present' : 'Missing'
            });
            
            if (!idToken) {
                setError("Please login first to get your authentication token.");
                return;
            }

            console.log("Starting Web3Auth connection with custom JWT...");

            // Add timeout to prevent hanging
            const connectionPromise = web3auth.connectTo(WALLET_ADAPTERS.OPENLOGIN, {
                loginProvider: "jwt",
                extraLoginOptions: {
                    id_token: idToken,
                    verifierIdField: "email",
                },
            });

            // Set a timeout for the connection
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error("Connection timeout after 30 seconds")), 30000);
            });

            const web3authProvider = await Promise.race([connectionPromise, timeoutPromise]);

            if (!web3authProvider) {
                throw new Error("Failed to get provider from Web3Auth");
            }

            console.log("✅ Web3Auth provider received");
            setProvider(web3authProvider);
            
            const ethersProvider = new ethers.BrowserProvider(web3authProvider);
            const signer = await ethersProvider.getSigner();
            const address = await signer.getAddress();
            
            setWalletAddress(address);
            console.log('✅ Custom JWT wallet connected:', address);

            await saveWalletToBackend(address);

        } catch (err) {
            console.error("Custom JWT Connection Error:", err);
            
            // Handle specific errors
            if (err.message.includes("timeout")) {
                setError("Connection timed out. Please try again.");
            } else if (err.message.includes("Already connecting")) {
                setError("Connection in progress. Please wait and try again in a moment.");
            } else if (err.message.includes("User closed modal")) {
                setError("Connection cancelled by user.");
            } else {
                setError(`Connection failed: ${err.message}`);
            }
        } finally {
            setIsConnecting(false);
            setIsLoading(false);
        }
    }, [web3auth, isConnecting]);

    // Save wallet to backend
    const saveWalletToBackend = async (address) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.log("No auth token, skipping wallet save");
                return;
            }

            const apiBaseUrl = "http://localhost:5000"; // Direct URL since your backend is on 5000
            const response = await fetch(`${apiBaseUrl}/api/members/save-wallet`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token
                },
                body: JSON.stringify({ walletAddress: address })
            });

            const data = await response.json();
            if (data.success) {
                console.log('✅ Wallet saved to backend');
            } else {
                console.log('Backend save failed:', data.message);
            }
        } catch (err) {
            console.error("Error saving wallet to backend:", err);
        }
    };

    const disconnectWallet = useCallback(async () => {
        if (!web3auth) return;
        
        setIsConnecting(true);
        try {
            await web3auth.logout();
            setProvider(null);
            setWalletAddress(null);
            setError(null);
            console.log('✅ Wallet disconnected');
        } catch (err) {
            console.error("Logout Error:", err);
            setError("Failed to disconnect wallet.");
        } finally {
            setIsConnecting(false);
        }
    }, [web3auth]);

    const value = {
        web3auth,
        provider,
        walletAddress,
        isLoading,
        error,
        isConnecting, // Expose this so UI can show "connecting" state
        connectWithCustomJWT,
        disconnectWallet,
        isConnected: !!web3auth?.connected && !!walletAddress,
    };

    return (
        <Web3AuthContext.Provider value={value}>
            {children}
        </Web3AuthContext.Provider>
    );
};

export const useWeb3Auth = () => {
    const context = useContext(Web3AuthContext);
    if (!context) {
        throw new Error("useWeb3Auth must be used within Web3AuthProvider");
    }
    return context;
};
