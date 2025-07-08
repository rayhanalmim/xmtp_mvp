'use client'
import React, { useState } from 'react';
import { useXMTP } from '../context/XMTPContext';

const NewConversation = ({ onConversationStarted }) => {
    const { startConversation } = useXMTP();
    const [addressInput, setAddressInput] = useState('');
    const [isStarting, setIsStarting] = useState(false);
    const [error, setError] = useState(null);

    // Handle starting a new conversation
    const handleStartConversation = async (e) => {
        e.preventDefault();

        if (!addressInput.trim()) return;

        setIsStarting(true);
        setError(null);

        try {
            // Start a new conversation with the input address
            const conversation = await startConversation(addressInput);

            if (!conversation) {
                throw new Error('Failed to start conversation');
            }

            // Clear the input and notify parent component
            setAddressInput('');
            onConversationStarted(conversation);
        } catch (err) {
            setError(err.message || 'Failed to start conversation');
        } finally {
            setIsStarting(false);
        }
    };

    return (
        <div className="p-4 border-b border-gray-700">
            <form onSubmit={handleStartConversation} className="space-y-3">
                <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-300">
                        New conversation
                    </label>
                    <div className="mt-1">
                        <input
                            type="text"
                            id="address"
                            placeholder="Enter Ethereum address or ENS name"
                            value={addressInput}
                            onChange={(e) => setAddressInput(e.target.value)}
                            className="block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-black"
                            disabled={isStarting}
                        />
                    </div>
                    {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
                </div>
                <button
                    type="submit"
                    disabled={!addressInput.trim() || isStarting}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-600"
                >
                    {isStarting ? 'Starting...' : 'Start conversation'}
                </button>
            </form>
        </div>
    );
};

export default NewConversation; 
