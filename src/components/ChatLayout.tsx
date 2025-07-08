'use client'
import React, { useState, useEffect } from 'react';
import { useXMTP } from '../context/XMTPContext';
import { useWallet } from '../context/WalletContext';
import WalletButton from './WalletButton';
import ConversationsList from './ConversationsList';
import ConversationMessages from './ConversationMessages';
import NewConversation from './NewConversation';

const ChatLayout = () => {
    const { client, isConnected: isClientConnected, initClient } = useXMTP();
    const { signer, isConnected: isWalletConnected } = useWallet();
    const [selectedConversation, setSelectedConversation] = useState<any>(null);
    const [isInitializing, setIsInitializing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize XMTP client when wallet is connected
    useEffect(() => {
        const initializeClient = async () => {
            if (isWalletConnected && signer && !client && !isInitializing) {
                setIsInitializing(true);
                setError(null);

                try {
                    await initClient(signer);
                } catch (err) {
                    setError('Failed to initialize XMTP client. Please try again.');
                    console.error('Error initializing XMTP client:', err);
                } finally {
                    setIsInitializing(false);
                }
            }
        };

        initializeClient();
    }, [signer, isWalletConnected, client, initClient, isInitializing]);

    // Handle conversation selection
    const handleSelectConversation = (conversation: any) => {
        setSelectedConversation(conversation);
    };

    // Handle new conversation started
    const handleConversationStarted = (conversation: any) => {
        setSelectedConversation(conversation);
    };

    // Render wallet connection UI
    if (!isWalletConnected) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="max-w-md w-full space-y-8 text-center">
                    <h1 className="text-3xl font-extrabold text-gray-900">XMTP Chat</h1>
                    <p className="text-gray-600">Connect your wallet to start messaging</p>
                    <div className="flex justify-center">
                        <WalletButton />
                    </div>
                </div>
            </div>
        );
    }

    // Render client initialization UI
    if (!isClientConnected && !error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="max-w-md w-full space-y-8 text-center">
                    <h1 className="text-3xl font-extrabold text-gray-900">XMTP Chat</h1>
                    <p className="text-gray-600">
                        {isInitializing
                            ? 'Initializing XMTP client...'
                            : 'Ready to initialize your XMTP client'}
                    </p>
                    {isInitializing && (
                        <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                    )}
                    {!isInitializing && (
                        <div className="flex justify-center">
                            <button
                                onClick={() => initClient(signer!)}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Initialize XMTP
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Render error UI
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="max-w-md w-full space-y-8 text-center">
                    <h1 className="text-3xl font-extrabold text-gray-900">XMTP Chat</h1>
                    <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
                        <p>{error}</p>
                    </div>
                    <div className="flex justify-center">
                        <WalletButton />
                    </div>
                </div>
            </div>
        );
    }

    // Render chat UI
    return (
        <div className="h-screen flex flex-col bg-gray-900 text-white">
            <header className="bg-gray-800 shadow-sm z-10 border-b border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-xl font-semibold">XMTP Chat</h1>
                    <WalletButton />
                </div>
            </header>

            <div className="flex-1 flex min-h-0">
                {/* Sidebar */}
                <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
                    <NewConversation onConversationStarted={handleConversationStarted} />
                    <div className="flex-1 overflow-y-auto">
                        <ConversationsList
                            onSelectConversation={handleSelectConversation}
                            selectedConversationId={selectedConversation?.topic}
                        />
                    </div>
                </div>

                {/* Main content */}
                <div className="flex-1 flex">
                    <ConversationMessages conversation={selectedConversation} />
                </div>
            </div>
        </div>
    );
};

export default ChatLayout; 
