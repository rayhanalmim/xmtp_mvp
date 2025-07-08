'use client';

import React, { createContext, useState, useContext, useCallback, useMemo } from "react";
import { Client, Identifier, Signer as XMSigner, Conversation, Dm, Group, ConsentState } from "@xmtp/browser-sdk";
import { ethers } from "ethers";

export type AnyConversation = Conversation<unknown> | Dm<unknown> | Group<unknown>;

interface XMTPContextType {
    client: Client | null;
    isConnected: boolean;
    conversations: AnyConversation[];
    conversationRequests: AnyConversation[];
    loadingConversations: boolean;
    initClient: (signer: ethers.Signer) => Promise<Client | null>;
    disconnect: () => void;
    loadConversations: () => Promise<void>;
    startConversation: (addressOrName: string) => Promise<AnyConversation | null>;
    sendMessage: (conversation: AnyConversation, message: string) => Promise<unknown | null>;
    allowConversation: (conversation: AnyConversation) => void;
}

const XMTPContext = createContext<XMTPContextType | undefined>(undefined);

export const useXMTP = (): XMTPContextType => {
    const context = useContext(XMTPContext);
    if (!context) {
        throw new Error("useXMTP must be used within an XMTPProvider");
    }
    return context;
};

export const XMTPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [client, setClient] = useState<Client | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [conversations, setConversations] = useState<AnyConversation[]>([]);
    const [conversationRequests, setConversationRequests] = useState<AnyConversation[]>([]);
    const [loadingConversations, setLoadingConversations] = useState(false);

    // Initialize the XMTP client
    const initClient = async (ethSigner: ethers.Signer) => {
        try {
            if (!ethSigner) return null;

            const address = await ethSigner.getAddress();

            // Build an XMTP-compatible EOA signer wrapper
            const accountIdentifier: Identifier = {
                identifier: address.toLowerCase(),
                identifierKind: "Ethereum",
            };

            const xmtpSigner: XMSigner = {
                type: "EOA",
                getIdentifier: () => accountIdentifier,
                signMessage: async (message: string): Promise<Uint8Array> => {
                    const signature = await ethSigner.signMessage(message);
                    return ethers.utils.arrayify(signature);
                },
            };

            // Create the XMTP client with the wrapped signer
            const xmtp = await Client.create(xmtpSigner);
            setClient(xmtp);
            setIsConnected(true);
            return xmtp;
        } catch (error) {
            console.error("Error initializing XMTP client:", error);
            setIsConnected(false);
            return null;
        }
    };

    // Disconnect the XMTP client
    const disconnect = () => {
        setClient(null);
        setIsConnected(false);
        setConversations([]);
        setConversationRequests([]);
    };

    // Load conversations for the connected client
    const loadConversations = useCallback(async (): Promise<void> => {
        if (!client) return;

        try {
            setLoadingConversations(true);
            try {
                // Sync with the network first so we have the latest conversations and messages
                console.debug('[XMTP] Syncing conversations from network...');
                await client.conversations.sync();
                console.debug('[XMTP] Sync complete');
            } catch (err) {
                console.error('[XMTP] Error syncing conversations', err);
            }
            const convos = await client.conversations.list();
            const allowedConvos: AnyConversation[] = [];
            const requestConvos: AnyConversation[] = [];

            for (const convo of convos) {
                const consentState = (convo as any).consentState; // Changed from a function call to property access
                if (consentState === 'allowed') {
                    allowedConvos.push(convo as AnyConversation);
                } else {
                    requestConvos.push(convo as AnyConversation);
                }
            }

            setConversations(allowedConvos);
            setConversationRequests(requestConvos);
            setLoadingConversations(false);
        } catch (error) {
            console.error("Error loading conversations:", error);
            setLoadingConversations(false);
        }
    }, [client]);

    // Start a new conversation with an address
    const startConversation = useCallback(async (addressOrName: string) => {
        if (!client) return null;

        try {
            let address = addressOrName;
            if (addressOrName.includes(".eth")) {
                const provider = new ethers.providers.JsonRpcProvider(
                    "https://eth-mainnet.g.alchemy.com/v2/3YZEMwwXrlGYDY4t-PQED7DOx28wR9av"
                );
                const resolvedAddress = await provider.resolveName(addressOrName);
                if (!resolvedAddress) {
                    throw new Error(`Could not resolve ENS name: ${addressOrName}`);
                }
                address = resolvedAddress;
            }

            const identifier: Identifier = {
                identifier: address.toLowerCase(),
                identifierKind: "Ethereum",
            };
            const conversation = await client.conversations.newDmWithIdentifier(identifier);
            // Immediately allow the conversation
            await (conversation as any).updateConsentState(ConsentState.Allowed); // Corrected method
            // Reload conversations to reflect the change
            await loadConversations();
            return conversation as unknown as AnyConversation;
        } catch (error) {
            console.error("Error starting conversation:", error);
            return null;
        }
    }, [client, loadConversations]);

    // Send a message in a conversation
    const sendMessage = useCallback(async (conversation: AnyConversation, message: string) => {
        if (!client || !conversation) return null;

        try {
            const sent = await conversation.send(message);
            return sent;
        } catch (error) {
            console.error("Error sending message:", error);
            return null;
        }
    }, [client]);

    const allowConversation = useCallback(async (conversation: AnyConversation) => {
        await (conversation as any).updateConsentState(ConsentState.Allowed); // Corrected method
        await loadConversations();
    }, [loadConversations]);

    // Value object to be provided by the context
    const value: XMTPContextType = useMemo(() => ({
        client,
        isConnected,
        conversations,
        conversationRequests,
        loadingConversations,
        initClient,
        disconnect,
        loadConversations,
        startConversation,
        sendMessage,
        allowConversation,
    }), [client, isConnected, conversations, conversationRequests, loadingConversations, initClient, disconnect, loadConversations, startConversation, sendMessage, allowConversation]);

    return (
        <XMTPContext.Provider value={value}>
            {children}
        </XMTPContext.Provider>
    );
}; 