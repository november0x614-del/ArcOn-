import { HDNodeWallet, Mnemonic, ethers } from "ethers";

/**
 * ArcNativeService
 * Provides core logic for HD Wallet derivation and Arc Network interaction
 * and deterministic finality handling.
 */
export class ArcNativeService {
    private static MASTER_MNEMONIC = process.env.ARC_MASTER_MNEMONIC;
    private static HD_PATH = "m/44'/60'/0'/0";

    /**
     * Derives a unique deposit address for a user based on their index.
     * This is an offline operation and ensures one address per user.
     */
    static getDepositAddress(userIndex: number): { address: string; privateKey: string } {
        if (!this.MASTER_MNEMONIC) {
            throw new Error("ARC_MASTER_MNEMONIC is not configured in environment variables");
        }

        const mnemonic = Mnemonic.fromPhrase(this.MASTER_MNEMONIC);
        const hdNode = HDNodeWallet.fromMnemonic(mnemonic, `${this.HD_PATH}/${userIndex}`);
        
        return {
            address: hdNode.address,
            privateKey: hdNode.privateKey
        };
    }

    /**
     * Normalizes native 18-decimal USDC to 6-decimal representation
     */
    static toUSDC(nativeValue: bigint): bigint {
        return nativeValue / (10n ** 12n);
    }

    /**
     * Normalizes 6-decimal USDC to 18-decimal native for 'value' fields in tx
     */
    static toNative(usdcValue: bigint): bigint {
        return usdcValue * (10n ** 12n);
    }

    /**
     * Automates sweeping funds from a deposit address to the master hot wallet.
     * Uses Arc's unique USDC-as-gas feature.
     */
    static async sweepFunds(depositPrivateKey: string, amount: bigint): Promise<string> {
        const provider = new ethers.JsonRpcProvider(process.env.ARC_RPC_URL || "https://rpc.testnet.arc.network");
        const wallet = new ethers.Wallet(depositPrivateKey, provider);
        const hotWallet = process.env.ARC_HOT_WALLET_ADDRESS;

        if (!hotWallet) throw new Error("ARC_HOT_WALLET_ADDRESS not configured");

        console.log(`[ArcNative] Sweeping ${amount} units to hot wallet ${hotWallet}`);

        // Arc uses EIP-1559. Since USDC is gas, we just send a standard transaction.
        // The value field is native USDC (18 decimals).
        const tx = await wallet.sendTransaction({
            to: hotWallet,
            value: this.toNative(amount), 
            gasLimit: 21000n, // Standard transfer gas limit
            type: 2
        });

        const receipt = await tx.wait();
        if (!receipt) throw new Error("Sweep transaction failed to provide receipt");
        
        return receipt.hash;
    }
}
