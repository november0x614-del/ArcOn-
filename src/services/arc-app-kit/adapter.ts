import { useStore } from "../../store/useStore";

export const ArcAppKitAdapter = {
    async executeSwap(amount: number, fromToken: string, toToken: string) {
        const { registeredUser } = useStore.getState();
        if (!registeredUser?.supabaseUid) throw new Error("User not registered");

        const response = await fetch('/api/swap/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: registeredUser.supabaseUid,
                amount,
                fromToken,
                toToken
            }),
        });
        
        if (!response.ok) throw new Error('Swap failed');
        return await response.json();
    },

    async executeTransfer(amount: number, destinationAddress: string) {
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

    async executeBridge(amount: number, fromNetwork: string, toNetwork: string) {
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
};
