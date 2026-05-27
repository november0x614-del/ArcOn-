import { ethers } from "ethers";
import { ArcNativeService } from "./arcNative.js";

const USDC_ADDRESS = process.env.ARC_USDC_CONTRACT || "0x3600000000000000000000000000000000000000";
const MEMO_ADDRESS = ArcNativeService.MEMO_CONTRACT_ADDRESS;
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const MEMO_TOPIC = "0x" + ethers.id("MemoSent(address,address,uint256,bytes)").slice(2);

// Detect if we should use WebSockets for lower latency monitoring
const RPC_URL = process.env.ARC_RPC_URL || "https://rpc.testnet.arc.network";
const WSS_URL = RPC_URL.replace("http", "ws");

export async function startArcMonitor(supabase: any) {
    console.log(`[ArcMonitor] Initializing for Arc Network (Deterministic Finality Mode)...`);
    
    let provider: ethers.Provider;
    try {
        // Try WebSocket first for real-time monitoring
        provider = new ethers.WebSocketProvider(WSS_URL);
        console.log(`[ArcMonitor] WebSocket connection established at ${WSS_URL}`);
    } catch (e) {
        console.warn(`[ArcMonitor] WebSocket failed, falling back to sub-second polling: ${RPC_URL}`);
        provider = new ethers.JsonRpcProvider(RPC_URL);
    }
    
    let lastProcessedBlock = await provider.getBlockNumber();
    let pollInterval = 1000; // Arc has very fast blocks
    let failCount = 0;

    const runMonitor = async () => {
        try {
            const currentBlock = await provider.getBlockNumber();
            if (currentBlock <= lastProcessedBlock) {
                setTimeout(runMonitor, pollInterval);
                return;
            }

            // Scan blocks
            const toBlock = Math.min(currentBlock, lastProcessedBlock + 50);
            
            const logs = await provider.getLogs({
                address: [USDC_ADDRESS, MEMO_ADDRESS],
                fromBlock: lastProcessedBlock + 1,
                toBlock: toBlock
            });

            // Group logs by transaction hash to correlate Memos
            const txLogsMap = new Map<string, any[]>();
            for (const log of logs) {
                if (!txLogsMap.has(log.transactionHash)) {
                    txLogsMap.set(log.transactionHash, []);
                }
                txLogsMap.get(log.transactionHash)!.push(log);
            }

            for (const [txHash, txLogs] of txLogsMap.entries()) {
                await processTransactionGroup(txHash, txLogs, supabase);
            }

            lastProcessedBlock = toBlock;
            failCount = 0;
            pollInterval = 3000;
        } catch (error: any) {
            console.error("[ArcMonitor] Error in monitoring loop:", error);
            
            // Handle Rate Limit Error
            if (error.message?.includes("limit reached") || error.code === -32008) {
                failCount++;
                pollInterval = Math.min(60000, 5000 * Math.pow(2, failCount)); // Exponential backoff up to 60s
                console.warn(`[ArcMonitor] Rate limit detected. Backing off for ${pollInterval}ms`);
            }
        }
        
        setTimeout(runMonitor, pollInterval);
    };

    runMonitor();
}

async function processTransactionGroup(txHash: string, txLogs: any[], supabase: any) {
    const erc20Interface = new ethers.Interface([
        "event Transfer(address indexed from, address indexed to, uint256 value)"
    ]);
    const memoInterface = new ethers.Interface(ArcNativeService.MEMO_ABI);

    // Find Transfer log related to our USDC contract
    const transferLog = txLogs.find(l => 
        l.address.toLowerCase() === USDC_ADDRESS.toLowerCase() && 
        l.topics[0] === TRANSFER_TOPIC
    );

    if (!transferLog) return;

    let parsedTransfer;
    try {
        parsedTransfer = erc20Interface.parseLog({
            topics: transferLog.topics,
            data: transferLog.data
        });
    } catch (e) {
        return;
    }

    if (!parsedTransfer) return;

    const to = parsedTransfer.args.to.toLowerCase();
    const amount = parsedTransfer.args.value;

    // Check if it's one of our user wallets
    const { data: wallet, error: walletError } = await supabase
        .from('user_wallets')
        .select('id, hd_index, native_private_key')
        .ilike('native_deposit_address', to)
        .single();

    if (walletError || !wallet) {
        return;
    }

    // Capture Memo if present in same transaction
    let memoText = "";
    const memoLog = txLogs.find(l => 
        l.address.toLowerCase() === MEMO_ADDRESS.toLowerCase() && 
        l.topics[0] === MEMO_TOPIC
    );

    if (memoLog) {
        try {
            const parsedMemo = memoInterface.parseLog({
                topics: memoLog.topics,
                data: memoLog.data
            });
            if (parsedMemo) {
                const memoHex = parsedMemo.args.memo;
                memoText = ethers.toUtf8String(memoHex);
                console.log(`[ArcMonitor] Memo found for tx ${txHash}: ${memoText}`);
            }
        } catch (e) {
            console.warn(`[ArcMonitor] Failed to parse memo for tx ${txHash}`);
        }
    }

    // Idempotency check
    const uniqueRef = `${txHash}_${transferLog.index}`;
    const { data: existingTx } = await supabase
        .from('transactions')
        .select('id')
        .eq('internal_ref', uniqueRef)
        .single();

    if (existingTx) return;

    console.log(`[ArcMonitor] Processing Arc Native Transfer. To: ${to}, Amount: ${amount}, Memo: ${memoText}`);

    // Credit User
    const usdcUnits = amount;
    const internalAmount = ArcNativeService.toInternal(usdcUnits);
    const displayAmount = Number(usdcUnits) / 1e6;

    const { error: insertError } = await supabase.from('transactions').insert({
        user_id: wallet.id,
        amount: displayAmount,
        type: 'deposit',
        status: 'success',
        internal_ref: uniqueRef,
        metadata: {
            description: memoText || `Deposit via Arc Network`,
            source: 'arc_native',
            finality: 'deterministic',
            txHash: txHash,
            explorerUrl: `https://testnet.arcscan.app/tx/${txHash}`,
            logIndex: transferLog.index,
            blockNumber: transferLog.blockNumber,
            sweep_status: 'pending',
            memo: memoText,
            internal_amount_wei: internalAmount.toString()
        }
    });

    if (insertError) {
        console.error("[ArcMonitor] Insertion error:", insertError);
        return;
    }

    // Trigger Automated Sweep
    try {
        await ArcNativeService.sweepFunds(wallet.native_private_key, internalAmount);
        await supabase.from('transactions')
            .update({ metadata: { sweep_status: 'completed' } })
            .eq('internal_ref', uniqueRef);
    } catch (e) {
        console.error("[ArcMonitor] Sweep error:", e);
    }
}
