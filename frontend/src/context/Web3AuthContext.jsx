import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES, WALLET_ADAPTERS } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { ethers } from "ethers";

const Web3AuthContext = createContext(null);

export const Web3AuthProvider = ({ children }) => {
    const [web3auth, setWeb3auth] = useState(null);
    const [provider, setProvider] = useState(null);
    const [walletAddress, setWalletAddress] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const clientId = import.meta.env.VITE_WEB3AUTH_CLIENT_ID;
    const verifierName = import.meta.env.VITE_WEB3AUTH_VERIFIER_NAME;

    useEffect(() => {
        const init = async () => {
            if (!clientId) {
                setError("Web3Auth Client ID is missing.");
                setIsLoading(false);
                return;
            }

            try {
                // Chain configuration
                const chainConfig = {
                    chainNamespace: CHAIN_NAMESPACES.EIP155,
                    chainId: "0x13881",
                    rpcTarget: "https://rpc.ankr.com/polygon_mumbai",
                    displayName: "Polygon Mumbai Testnet",
                    blockExplorerUrl: "https://mumbai.polygonscan.com/",
                    ticker: "MATIC",
                    tickerName: "Matic",
                };

                // Create the private key provider (required for v8)
                const privateKeyProvider = new EthereumPrivateKeyProvider({
                    config: { chainConfig },
                });

                // Initialize Web3Auth with private key provider
                const web3AuthInstance = new Web3Auth({
                    clientId,
                    web3AuthNetwork: "sapphire_devnet",
                    privateKeyProvider,
                    chainConfig,
                    uiConfig: {
                        // Disable social logins, focus on custom auth
                        loginMethodsOrder: [],
                        theme: {
                            primary: "#768729"
                        },
                        logoLight: "https://web3auth.io/images/web3authlog.png",
                        logoDark: "https://web3auth.io/images/web3authlogodark.png",
                    },
                });

                await web3AuthInstance.initModal();
                setWeb3auth(web3AuthInstance);

            } catch (err) {
                console.error("Web3Auth Error:", err);
                setError("Could not initialize Web3Auth.");
            } finally {
                setIsLoading(false);
            }
        };
        
        init();
    }, [clientId]);

    // Custom JWT wallet connection
    const connectWithCustomJWT = useCallback(async () => {
        if (!web3auth) {
            setError("Web3Auth is not ready, please wait.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Get the JWT token that your backend generates
            const idToken = localStorage.getItem('id_token');
            
            if (!idToken) {
                setError("Please login first to get your authentication token.");
                setIsLoading(false);
                return;
            }

            console.log("Connecting with custom JWT...");

            // Connect using your custom verifier (v8 syntax)
            const web3authProvider = await web3auth.connectTo(WALLET_ADAPTERS.OPENLOGIN, {
                loginProvider: "jwt",
                extraLoginOptions: {
                    id_token: idToken,
                    verifierIdField: "email",
                },
            });

            if (!web3authProvider) {
                throw new Error("Failed to get provider from Web3Auth");
            }

            setProvider(web3authProvider);
            
            const ethersProvider = new ethers.BrowserProvider(web3authProvider);
            const signer = await ethersProvider.getSigner();
            const address = await signer.getAddress();
            
            setWalletAddress(address);
            console.log('✅ Custom JWT wallet connected:', address);

            // Save wallet address to your backend
            await saveWalletToBackend(address);

        } catch (err) {
            console.error("Custom JWT Connection Error:", err);
            setError(`Failed to connect with custom authentication: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [web3auth]);

    // Save wallet to backend
    const saveWalletToBackend = async (address) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const apiBaseUrl = import.meta.env.VITE_API_GATEWAY_URL;
            const response = await fetch(`${apiBaseUrl}/members/save-wallet`, {
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
            }
        } catch (err) {
            console.error("Error saving wallet to backend:", err);
        }
    };

    const disconnectWallet = useCallback(async () => {
        if (!web3auth) return;
        
        try {
            await web3auth.logout();
            setProvider(null);
            setWalletAddress(null);
            setError(null);
            console.log('✅ Wallet disconnected');
        } catch (err) {
            console.error("Logout Error:", err);
        }
    }, [web3auth]);

    const value = {
        web3auth,
        provider,
        walletAddress,
        isLoading,
        error,
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
        throw new error("useWeb3Auth must be used within Web3AuthProvider");
    }
    return context;
};
