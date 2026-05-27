import React, { useState } from 'react';
import { ArcAppKitAdapter } from '../services/arc-app-kit/adapter';

export const BridgeForm = () => {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    const handleBridge = async () => {
        setLoading(true);
        setResult(null);
        try {
            // Placeholder: Assume networks are selected elsewhere
            const res = await ArcAppKitAdapter.bridgeToken(parseFloat(amount), 'Solana_Devnet', 'Arc_Testnet');
            setResult(`Bridge initiated: ${JSON.stringify(res)}`);
        } catch (error: any) {
            setResult(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 border rounded shadow-md bg-white">
            <h2 className="text-xl font-bold mb-4">Bridge USDC</h2>
            <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount"
                className="w-full p-2 border rounded mb-4"
            />
            <button
                onClick={handleBridge}
                disabled={loading}
                className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
                {loading ? 'Bridging...' : 'Bridge Token'}
            </button>
            {result && <p className="mt-4 break-words text-sm">{result}</p>}
        </div>
    );
};
