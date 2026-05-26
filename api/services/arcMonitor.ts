import { ethers } from "ethers";
import { ArcNativeService } from "./arcNative.js";

const USDC_ADDRESS = process.env.ARC_USDC_CONTRACT || "0x3600000000000000000000000000000000000000";
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const provider = new ethers.JsonRpcProvider(process.env.ARC_RPC_URL || "https://rpc.testnet.arc.network");

export async function startArcMonitor(supabase: any) {
    console.log("[ArcMonitor] Starting block listener...");
    
    let lastProcessedBlock = await provider.getBlockNumber();

    setInterval(async () => {
        try {
            const currentBlock = await provider.getBlockNumber();
            if (currentBlock <= lastProcessedBlock) return;

            console.log(`[ArcMonitor] Scanning blocks ${lastProcessedBlock + 1} to ${currentBlock}`);

            const logs = await provider.getLogs({
                address: USDC_ADDRESS,
                topics: [TRANSFER_TOPIC],
                fromBlock: lastProcessedBlock + 1,
                toBlock: currentBlock
            });

            for (const log of logs) {
                await processTransactionLog(log, supabase);
            }

            lastProcessedBlock = currentBlock;
        } catch (error) {
            console.error("[ArcMonitor] Error in monitoring loop:", error);
        }
    }, 5000); // Poll every 5 seconds
}

async function processTransactionLog(log: any, supabase: any) {
    const erc20Interface = new ethers.Interface([
        "event Transfer(address indexed from, address indexed to, uint256 value)"
    ]);

    const parsed = erc20Interface.parseLog({
        topics: log.topics,
        data: log.data
    });

    if (!parsed) return;

    const to = parsed.args.to.toLowerCase();
    const amount = parsed.args.value; // bigint

    // Arc Hardening: Verify transaction status in receipt
    const receipt = await provider.getTransactionReceipt(log.transactionHash);
    if (!receipt || receipt.status !== 1) {
        console.warn(`[ArcMonitor] Skipping tx ${log.transactionHash}: Status failed or receipt missing.`);
        return;
    }

    // Check if recipient matches a native deposit address in our DB
    const { data: wallet, error } = await supabase
        .from('user_wallets')
        .select('id, hd_index, native_private_key')
        .ilike('native_deposit_address', to)
        .single();

    if (wallet && !error) {
        // Idempotency: Check if this specific txHash + logIndex was already processed
        const uniqueRef = `${log.transactionHash}_${log.index}`;
        
        const { data: existingTx } = await supabase
            .from('transactions')
            .select('id')
            .eq('internal_ref', uniqueRef)
            .single();

        if (existingTx) {
            console.log(`[ArcMonitor] Tx ${uniqueRef} already processed. Skipping.`);
            return;
        }

        console.log(`[ArcMonitor] Native Deposit Verified! User: ${wallet.id}, Amount: ${amount}`);

        // 1. Credit User (Immediate due to Arc 1-conf finality)
        const { error: insertError } = await supabase.from('transactions').insert({
            user_id: wallet.id,
            amount: Number(ArcNativeService.toUSDC(amount)),
            type: 'deposit',
            status: 'success',
            internal_ref: uniqueRef,
            metadata: {
                source: 'arc_native',
                finality: 'deterministic',
                txHash: log.transactionHash,
                logIndex: log.index,
                blockNumber: log.blockNumber,
                sweep_status: 'pending'
            }
        });

        if (insertError) {
            console.error("[ArcMonitor] Failed to credit user:", insertError);
            return;
        }

        // 2. Trigger Automated Sweep with logic awareness
        try {
            const sweepTx = await ArcNativeService.sweepFunds(wallet.native_private_key, ArcNativeService.toUSDC(amount));
            
            // Update sweep status in metadata
            await supabase.from('transactions')
                .update({ 
                    metadata: { 
                        ...log.metadata, 
                        sweep_status: 'completed', 
                        sweep_tx: sweepTx 
                    } 
                })
                .eq('internal_ref', uniqueRef);

            console.log(`[ArcMonitor] Sweep completed for ${wallet.id}: ${sweepTx}`);
        } catch (sweepError) {
            console.error(`[ArcMonitor] Sweep failed for user ${wallet.id}:`, sweepError);
        }
    }
}
