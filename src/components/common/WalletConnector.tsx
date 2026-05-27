import React from 'react';
import { ethers } from 'ethers';

interface WalletConnectorProps {
    onAddressConnected: (address: string) => void;
}

export const WalletConnector = ({ onAddressConnected }: WalletConnectorProps) => {
    const connect = async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const accounts = await provider.send("eth_requestAccounts", []);
                onAddressConnected(accounts[0]);
            } catch (error: any) {
                console.error("Wallet connection rejected", error);
            }
        } else {
            console.error("Please install MetaMask");
        }
    };

    return (
        <button 
          onClick={connect} 
          className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600 bg-indigo-50 px-2 py-1.5 rounded-lg border-0 cursor-pointer flex items-center gap-1 transition-all"
        >
          Connect External
        </button>
    );
};
