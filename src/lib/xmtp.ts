import { Client, Conversation } from '@xmtp/browser-sdk';
import { ethers } from 'ethers';

// Create a client using a wallet
export const getClient = async (wallet: ethers.Wallet) => {
    try {
        // Create the XMTP client with wallet as signer
        const client = await Client.create(wallet, { env: 'dev' });
        return client;
    } catch (e) {
        console.error('Error creating XMTP client: ', e);
        return null;
    }
};

// Check if an address has an XMTP identity
export const canMessage = async (
    address: string,
    client: Client | null
): Promise<boolean> => {
    if (!address || !client) return false;
    try {
        const canMessage = await client.canMessage(address);
        return canMessage;
    } catch (e) {
        console.error('Error checking if can message: ', e);
        return false;
    }
};

// Start a new conversation with an address
export const startNewConversation = async (
    client: Client,
    address: string
) => {
    if (!client) return null;
    try {
        return await client.conversations.newConversation(address);
    } catch (e) {
        console.error('Error starting new conversation: ', e);
        return null;
    }
};

// List all conversations
export const listConversations = async (client: Client) => {
    if (!client) return [];
    try {
        return await client.conversations.list();
    } catch (e) {
        console.error('Error listing conversations: ', e);
        return [];
    }
};

// Load messages from a conversation
export const getMessages = async (conversation: Conversation | null) => {
    if (!conversation) return [];
    try {
        return await conversation.messages();
    } catch (e) {
        console.error('Error getting messages: ', e);
        return [];
    }
}; 