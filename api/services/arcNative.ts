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
     * Normalizes native 18-decimal internal USDC to 6-decimal units (display/standard unit)
     */
    static toUnits6(internalValue: bigint): bigint {
        return internalValue / (10n ** 12n);
    }

    /**
     * Normalizes 6-decimal USDC units to 18-decimal internal native balance
     */
    static toInternal(units6Value: bigint): bigint {
        return units6Value * (10n ** 12n);
    }

    /**
     * Arc Memo Contract Configuration
     */
    static MEMO_CONTRACT_ADDRESS = "0x9702466268ccF55eAB64cdf484d272Ac08d3b75b";
    static MEMO_ABI = [
        "event MemoSent(address indexed sender, address indexed recipient, uint256 amount, bytes memo)"
    ];

    /**
     * Automates sweeping funds from a deposit address to the master hot wallet.
     * Uses Arc's unique USDC-as-gas feature.
     * Amount should be provided in 18-decimal internal balance.
     */
    static async sweepFunds(depositPrivateKey: string, internalAmount: bigint): Promise<string> {
        const provider = new ethers.JsonRpcProvider(process.env.ARC_RPC_URL || "https://rpc.testnet.arc.network");
        const wallet = new ethers.Wallet(depositPrivateKey, provider);
        const hotWallet = process.env.ARC_HOT_WALLET_ADDRESS;

        if (!hotWallet) throw new Error("ARC_HOT_WALLET_ADDRESS not configured");

        console.log(`[ArcNative] Sweeping ${internalAmount} units (internal) to hot wallet ${hotWallet}`);

        // Arc uses EIP-1559. Since USDC is gas, we just send a standard transaction.
        // The value field is native USDC (18 decimals).
        const tx = await wallet.sendTransaction({
            to: hotWallet,
            value: internalAmount, 
            gasLimit: 21000n, // Standard transfer gas limit
            type: 2
        });

        const receipt = await tx.wait();
        if (!receipt) throw new Error("Sweep transaction failed to provide receipt");
        
        return receipt.hash;
    }
}
