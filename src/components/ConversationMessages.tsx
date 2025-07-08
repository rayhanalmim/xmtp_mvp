'use client'

import React, { useEffect, useState, useRef } from "react";
import { useXMTP, AnyConversation } from "../context/XMTPContext";
import { useWallet } from '../context/WalletContext';
import { DecodedMessage } from "@xmtp/browser-sdk";

interface ConversationMessagesProps {
    conversation?: AnyConversation | null;
}

const ConversationMessages: React.FC<ConversationMessagesProps> = ({ conversation }) => {
    const { sendMessage, client } = useXMTP();
    const { address } = useWallet();
    const [messages, setMessages] = useState<DecodedMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const loadMessages = async () => {
            if (!conversation) return;

            setLoading(true);
            try {
                console.debug('[XMTP] Syncing conversation', (conversation as any).id);
                await (conversation as any).sync?.();
                console.debug('[XMTP] Sync complete for conversation', (conversation as any).id);
                const initialMessages = await conversation.messages();
                setMessages(initialMessages);
            } catch (error) {
                console.error('Error loading messages:', error);
            } finally {
                setLoading(false);
            }
        };

        loadMessages();
    }, [conversation]);

    useEffect(() => {
        if (!conversation) return;

        let isMounted = true;
        let stream: any;

        const streamMessages = async () => {
            // Use the new stream() API (streamMessages() was removed in XMTP v3)
            stream = await (conversation as any).stream();
            for await (const message of stream) {
                if (isMounted) {
                    console.debug('[XMTP] New message received', message);
                    setMessages((prevMessages) => [...prevMessages, message]);
                }
            }
        };

        streamMessages();

        return () => {
            isMounted = false;
            if (stream) {
                stream.return();
            }
        };
    }, [conversation]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !conversation) return;
        try {
            const sent = await sendMessage(conversation, newMessage);
            console.debug('[XMTP] Message sent', sent);
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const renderMessageContent = (message: DecodedMessage): string => {
        const msg = message as any;
        if (typeof msg.content === "string") {
            return msg.content;
        }
        if (msg.contentFallback) {
            return msg.contentFallback;
        }
        if (msg.contentType.typeId.startsWith('xmtp.org/group_membership_change')) {
            return 'Group membership changed';
        }
        return "Unsupported message type";
    };

    if (!conversation) {
        return (
            <div className="flex-1 flex justify-center items-center p-4 bg-gray-900">
                <p className="text-gray-400">Select a conversation or start a new one</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex-1 flex justify-center items-center p-4 bg-gray-900">
                <p className="text-gray-400">Loading messages...</p>
            </div>
        );
    }

    const formatTime = (date: Date | number | string) => {
        return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const conversationLabel = (conversation as any).peerAddress || (conversation as any).topic || "Conversation";

    return (
        <div className="flex-1 flex flex-col h-full bg-gray-900 text-white">
            <div className="p-4 border-b border-gray-700">
                <h2 className="text-lg font-medium">
                    {conversationLabel.substring(0, 6)}...
                    {conversationLabel.substring(conversationLabel.length - 4)}
                </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="flex justify-center items-center h-full">
                        <p className="text-gray-400">No messages yet</p>
                    </div>
                ) : (
                    <>
                        {messages.map((message) => {
                            const isSender = (message as any).senderInboxId === client?.inboxId;
                            return (
                                <div
                                    key={(message as any).id}
                                    className={`flex ${isSender ? 'justify-start' : 'justify-end'}`}
                                >
                                    <div
                                        className={`max-w-[70%] rounded-lg p-3 ${isSender
                                            ? 'bg-gray-700 text-gray-200'
                                            : 'bg-blue-600 text-white'
                                            }`}
                                    >
                                        <p className="text-sm">{renderMessageContent(message)}</p>
                                        <p
                                            className={`text-xs mt-1 ${isSender ? 'text-gray-400' : 'text-blue-200'
                                                }`}
                                        >
                                            {formatTime((message as any).sent)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>
            <div className="border-t border-gray-700 p-4">
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-gray-800 border border-gray-600 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="bg-blue-600 text-white rounded-full px-4 py-2 font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-600"
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ConversationMessages; 
