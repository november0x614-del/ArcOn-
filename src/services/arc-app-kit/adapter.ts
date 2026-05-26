import { useStore } from "../../store/useStore";
import { ARC_TESTNET } from "../../lib/arcConfig";

/**
 * ArcAppKitAdapter
 * Abstraction layer for interacting with the backend and Arc Network.
 * Handles intents like bridge, swap, and unified balance transfers.
 */
export const ArcAppKitAdapter = {
    /**
     * Executes a token swap on Arc Testnet.
     */
    async swapTokens(amount: number, fromToken: string, toToken: string, tokenAddress: string) {
        const { registeredUser } = useStore.getState();
        if (!registeredUser?.supabaseUid) throw new Error("User not registered");

        console.log(`[Adapter] Initiating swap: ${amount} ${fromToken} -> ${toToken}`);

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
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Swap failed');
        }
        return await response.json();
    },

    /**
     * Sends funds using the Unified Balance intent.
     */
    async sendUnifiedBalance(amount: number, destinationAddress: string) {
        const { registeredUser } = useStore.getState();
        if (!registeredUser?.supabaseUid) throw new Error("User not registered");

        console.log(`[Adapter] Sending unified balance: ${amount} to ${destinationAddress}`);

        const response = await fetch('/api/transfer/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: registeredUser.supabaseUid,
                amount,
                destinationAddress
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Transfer failed');
        }
        return await response.json();
    },

    /**
     * Bridges tokens between networks using CCTP (Cross-Chain Transfer Protocol).
     */
    async bridgeTokenCCTP(amount: number, destinationAddress: string, destinationDomain: number) {
        const { registeredUser } = useStore.getState();
        if (!registeredUser?.supabaseUid) throw new Error("User not registered");

        console.log(`[Adapter] [CCTP] Initiating bridge: ${amount} to domain ${destinationDomain}`);

        const response = await fetch('/api/bridge/cctp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: registeredUser.supabaseUid,
                amount,
                destinationAddress,
                destinationDomain
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'CCTP Bridge failed');
        }
        return await response.json();
    },

    /**
     * Bridges tokens between networks (General intent).
     */
    async bridgeToken(amount: number, fromNetwork: string, toNetwork: string) {
        const { registeredUser } = useStore.getState();
        if (!registeredUser?.supabaseUid) throw new Error("User not registered");

        console.log(`[Adapter] Initiating bridge: ${amount} from ${fromNetwork} to ${toNetwork}`);

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

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Bridge failed');
        }
        return await response.json();
    },

    /**
     * Executes a withdrawal to a specified bank (Simulated/Off-ramp).
     */
    async executeWithdraw(amount: number, bank: string) {
        const { registeredUser } = useStore.getState();
        if (!registeredUser?.supabaseUid) throw new Error("User not registered");

        console.log(`[Adapter] Requesting withdrawal: ${amount} to ${bank}`);

        const response = await fetch('/api/withdraw/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: registeredUser.supabaseUid,
                amount,
                bank
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Withdraw failed');
        }
        return await response.json();
    },

    /**
     * Executes a purchase transaction.
     */
    async executePurchase(amount: number, product: string) {
        const { registeredUser } = useStore.getState();
        if (!registeredUser?.supabaseUid) throw new Error("User not registered");

        console.log(`[Adapter] Executing purchase: ${amount} for ${product}`);

        const response = await fetch('/api/purchase/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: registeredUser.supabaseUid,
                amount,
                product
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Purchase failed');
        }
        return await response.json();
    },

    /**
     * Fetches current balances for the registered user.
     */
    async getBalance() {
        const { registeredUser } = useStore.getState();
        if (!registeredUser?.supabaseUid) throw new Error("User not registered");

        const response = await fetch(`/api/balance/${registeredUser.supabaseUid}`);
        if (!response.ok) throw new Error('Failed to fetch balance');
        
        const contentType = response.headers.get("content-type");
        if (!contentType || contentType.indexOf("application/json") === -1) {
            console.error("Non-JSON response from getBalance");
            return { balance: 0, realBalance: 0, simulatedBalance: 0, allBalances: [] };
        }
        
        return await response.json();
    },

    /**
     * Fetches live rates between tokens.
     */
    async getLiveRate(fromToken: string, toToken: string) {
        const response = await fetch(`/api/rates?from=${fromToken}&to=${toToken}`);
        if (!response.ok) throw new Error('Failed to fetch rate');
        return await response.json();
    },

    /**
     * Fetches available tokens list.
     */
    async getTokens() {
        const response = await fetch(`/api/tokens`);
        if (!response.ok) throw new Error('Failed to fetch tokens');
        return await response.json();
    },

    /**
     * Returns the network configuration.
     */
    getNetworkConfig() {
        return ARC_TESTNET;
    }
};
