'use client'

import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { ethers } from "ethers";

interface WalletContextType {
    address: string | null;
    signer: ethers.Signer | null;
    provider: ethers.providers.Web3Provider | null;
    isConnecting: boolean;
    isConnected: boolean;
    error: string | null;
    connect: () => Promise<{ address: string; provider: ethers.providers.Web3Provider; signer: ethers.Signer; } | null>;
    disconnect: () => void;
}


const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = (): WalletContextType => {
    const context = useContext(WalletContext);
    if (!context) {
        throw new Error("useWallet must be used within a WalletProvider");
    }
    return context;
};

export const WalletProvider = ({ children }: { children: ReactNode }) => {
    const [address, setAddress] = useState<string | null>(null);
    const [signer, setSigner] = useState<ethers.Signer | null>(null);
    const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Connect to MetaMask wallet
    const connect = async (): Promise<{ address: string; provider: ethers.providers.Web3Provider; signer: ethers.Signer; } | null> => {
        setIsConnecting(true);
        setError(null);

        try {
            // Check if MetaMask is installed
            if (!window.ethereum) {
                throw new Error("MetaMask is not installed");
            }

            // Request account access
            const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
            const address = accounts[0];

            // Create ethers provider
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();

            // Store connection details
            setAddress(address);
            setProvider(provider);
            setSigner(signer);
            setIsConnected(true);

            return { address, provider, signer };
        } catch (err: any) {
            setError((err as Error).message || "Failed to connect wallet");
            console.error("Error connecting wallet:", err);
            return null;
        } finally {
            setIsConnecting(false);
        }
    };

    // Disconnect wallet
    const disconnect = () => {
        setAddress(null);
        setSigner(null);
        setProvider(null);
        setIsConnected(false);
    };

    // Check if the wallet is already connected on initial load
    useEffect(() => {
        const checkConnection = async () => {
            if (window.ethereum) {
                try {
                    const accounts = await window.ethereum.request({ method: "eth_accounts" });
                    if (accounts.length > 0) {
                        const address = accounts[0];
                        const provider = new ethers.providers.Web3Provider(window.ethereum);
                        const signer = provider.getSigner();

                        setAddress(address);
                        setProvider(provider);
                        setSigner(signer);
                        setIsConnected(true);
                    }
                } catch (err: any) {
                    console.error("Error checking connection:", err);
                }
            }
        };

        checkConnection();
    }, []);

    // Handle account changes
    useEffect(() => {
        if (window.ethereum) {
            const handleAccountsChanged = (accounts: string[]) => {
                if (accounts.length === 0) {
                    // User disconnected their wallet
                    disconnect();
                } else if (accounts[0] !== address) {
                    // User switched accounts
                    setAddress(accounts[0]);
                    if (provider) {
                        const signer = provider.getSigner();
                        setSigner(signer);
                    }
                }
            };

            // Subscribe to account changes
            window.ethereum.on("accountsChanged", handleAccountsChanged);

            // Cleanup listener on unmount
            return () => {
                window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
            };
        }
    }, [address, provider]);

    // Value object to be provided by the context
    const value: WalletContextType = {
        address,
        signer,
        provider,
        isConnecting,
        isConnected,
        error,
        connect,
        disconnect,
    };

    return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}; 