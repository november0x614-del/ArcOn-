import { useStore } from "../../store/useStore";

export const ArcAppKitAdapter = {
    async swapTokens(amount: number, fromToken: string, toToken: string, tokenAddress: string) {
        const { registeredUser } = useStore.getState();
        if (!registeredUser?.supabaseUid) throw new Error("User not registered");

        const response = await fetch('/api/swap/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: registeredUser.supabaseUid,
                amount,
                fromToken,
                toToken,
                tokenAddress
            }),
        });
        
        if (!response.ok) throw new Error('Swap failed');
        return await response.json();
    },

    async sendUnifiedBalance(amount: number, destinationAddress: string) {
        const { registeredUser } = useStore.getState();
        if (!registeredUser?.supabaseUid) throw new Error("User not registered");

        const response = await fetch('/api/transfer/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: registeredUser.supabaseUid,
                amount,
                destinationAddress
            }),
        });

        if (!response.ok) throw new Error('Transfer failed');
        return await response.json();
    },

    async bridgeToken(amount: number, fromNetwork: string, toNetwork: string) {
        const { registeredUser } = useStore.getState();
        if (!registeredUser?.supabaseUid) throw new Error("User not registered");

        const response = await fetch('/api/bridge/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: registeredUser.supabaseUid,
                amount,
                fromNetwork,
                toNetwork
            }),
        });

        if (!response.ok) throw new Error('Bridge failed');
        return await response.json();
    },

    async executeWithdraw(amount: number, bank: string) {
        const { registeredUser } = useStore.getState();
        if (!registeredUser?.supabaseUid) throw new Error("User not registered");

        const response = await fetch('/api/withdraw/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: registeredUser.supabaseUid,
                amount,
                bank
            }),
        });

        if (!response.ok) throw new Error('Withdraw failed');
        return await response.json();
    },

    async executePurchase(amount: number, product: string) {
        const { registeredUser } = useStore.getState();
        if (!registeredUser?.supabaseUid) throw new Error("User not registered");

        const response = await fetch('/api/purchase/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: registeredUser.supabaseUid,
                amount,
                product
            }),
        });

        if (!response.ok) throw new Error('Purchase failed');
        return await response.json();
    },

    async getBalance() {
        const { registeredUser } = useStore.getState();
        if (!registeredUser?.supabaseUid) throw new Error("User not registered");

        const response = await fetch(`/api/balance/${registeredUser.supabaseUid}`);
        if (!response.ok) throw new Error('Failed to fetch balance');
        return await response.json(); // Expected format: { balance: number, realBalance: number, simulatedBalance: number }
    },

    async getLiveRate(fromToken: string, toToken: string) {
        const response = await fetch(`/api/rates?from=${fromToken}&to=${toToken}`);
        if (!response.ok) throw new Error('Failed to fetch rate');
        return await response.json(); // Expected format: { rate: number }
    },

    async getTokens() {
        const response = await fetch(`/api/tokens`);
        if (!response.ok) throw new Error('Failed to fetch tokens');
        return await response.json();
    },
};
