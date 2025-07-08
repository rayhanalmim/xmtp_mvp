'use client'
import React from 'react';
import { useWallet } from '../context/WalletContext';

const WalletButton = () => {
    const { address, isConnecting, isConnected, connect, disconnect, error } = useWallet();

    // Format the address for display
    const formatAddress = (addr) => {
        if (!addr) return '';
        return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
    };

    return (
        <div className="flex items-center">
            {/* Show error if any */}
            {error && (
                <div className="mr-2 text-sm text-red-600">{error}</div>
            )}

            {/* Connect/disconnect button */}
            {isConnected ? (
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{formatAddress(address)}</span>
                    <button
                        onClick={disconnect}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                        Disconnect
                    </button>
                </div>
            ) : (
                <button
                    onClick={connect}
                    disabled={isConnecting}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
                >
                    {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                </button>
            )}
        </div>
    );
};

export default WalletButton; 
