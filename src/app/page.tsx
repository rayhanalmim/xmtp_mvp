"use client";

import { WalletProvider } from '../context/WalletContext';
import { XMTPProvider } from '../context/XMTPContext';
import ChatLayout from '../components/ChatLayout';

export default function Home() {
  return (
    <WalletProvider>
      <XMTPProvider>
        <ChatLayout />
      </XMTPProvider>
    </WalletProvider>
  );
}
