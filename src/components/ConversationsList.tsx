'use client';

import React, { useEffect, useState } from "react";
import { useXMTP, AnyConversation } from "../context/XMTPContext";

interface ConversationsListProps {
    onSelectConversation: (conversation: AnyConversation) => void;
    selectedConversationId?: string;
}
const ConversationsList: React.FC<ConversationsListProps> = ({ onSelectConversation, selectedConversationId }) => {
    const { client, conversations, conversationRequests, allowConversation, loadConversations, loadingConversations } = useXMTP();
    const [loading, setLoading] = useState(true);

    // Load conversations on component mount
    useEffect(() => {
        const fetchConversations = async () => {
            if (client) {
                setLoading(true);
                await loadConversations();
                setLoading(false);
            }
        };

        fetchConversations();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [client]);

    // Render loading state
    if (loading || loadingConversations) {
        return (
            <div className="flex-1 overflow-y-auto p-4">
                <div className="flex justify-center items-center h-full">
                    <div className="text-gray-400">Loading conversations...</div>
                </div>
            </div>
        );
    }

    const renderConversation = (conversation: AnyConversation, isRequest: boolean) => {
        const dm = conversation as unknown as { peerAddress?: string; topic?: string };
        const peerAddress: string = dm.peerAddress || "";
        const topic: string = dm.topic || "";
        // Use topic as primary key, fallback to peerAddress, and if both are empty add a unique identifier
        const key = topic || peerAddress || `conversation-${Math.random()}`;
        const displayAddress = peerAddress || topic || "Unknown";
        const isSelected = selectedConversationId === topic;

        return (
            <li
                key={key}
                className={`hover:bg-gray-700 cursor-pointer ${isSelected ? 'bg-blue-900' : ''}`}
                onClick={() => !isRequest && onSelectConversation(conversation)}
            >
                <div className="px-4 py-3 flex justify-between items-center">
                    <p className="font-medium truncate text-gray-200">
                        {displayAddress.substring(0, 6)}...{displayAddress.substring(displayAddress.length - 4)}
                    </p>
                    {isRequest && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                allowConversation(conversation);
                            }}
                            className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                        >
                            Allow
                        </button>
                    )}
                </div>
            </li>
        );
    };

    // Render empty state
    if (conversations.length === 0 && conversationRequests.length === 0) {
        return (
            <div className="flex-1 overflow-y-auto p-4">
                <div className="flex justify-center items-center h-full">
                    <div className="text-gray-400">No conversations yet</div>
                </div>
            </div>
        );
    }

    // Render conversations list
    return (
        <div className="flex-1 overflow-y-auto">
            {conversationRequests.length > 0 && (
                <div>
                    <h2 className="p-4 text-sm font-semibold text-gray-400">Requests</h2>
                    <ul className="divide-y divide-gray-700">
                        {conversationRequests.map((conv) => renderConversation(conv, true))}
                    </ul>
                </div>
            )}
            <h2 className="p-4 text-sm font-semibold text-gray-400">Conversations</h2>
            <ul className="divide-y divide-gray-700">
                {conversations.map((conv) => renderConversation(conv, false))}
            </ul>
        </div>
    );
};

export default ConversationsList;