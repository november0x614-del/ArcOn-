const fs = require('fs');

let content = fs.readFileSync('src/components/screens/ReceiptScreen.tsx', 'utf8');

const targetStart = '{/* Receipt Details Card */}';
const targetEnd = '      </div>\n    </div>\n  );\n}';

const idxStart = content.indexOf(targetStart);
const idxEnd = content.indexOf(targetEnd);

let newContent = content.substring(0, idxStart) + `{/* Receipt Details Card */}
            {isSwap ? (
              <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 flex flex-col overflow-hidden">
                <div className="bg-slate-900 p-5 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10 blur-xl bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                  <span className="text-[11px] font-black tracking-widest uppercase text-white/50 mb-1 z-10">Metode Transaksi</span>
                  <span className="text-[20px] font-extrabold text-white tracking-widest z-10">SWAP</span>
                </div>
                <div className="p-6 flex flex-col gap-6">
                  {/* 1. Data Identitas & Waktu */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-wider mb-1 border-b border-slate-100 pb-2">1. Data Identitas & Waktu</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">ID Transaksi (TxID)</span>
                      {hasHash ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => window.open(tx?.metadata?.explorerUrl || \`https://testnet.arcscan.app/tx/\${txHash}\`, "_blank")}
                            className="text-[12px] font-mono font-bold text-blue-600 hover:text-blue-700 bg-transparent border-0 p-0 text-right cursor-pointer"
                          >
                            {formatAddrShort(txHash)}
                          </button>
                          <button onClick={() => handleCopy(txHash, "TxHash")} className="text-slate-400 hover:text-slate-600 bg-transparent border-0 cursor-pointer p-0"><Copy size={12} /></button>
                        </div>
                      ) : (
                        <span className="text-[12px] font-bold text-slate-400 font-mono">-</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Waktu Selesai</span>
                      <span className="text-[12px] font-bold text-slate-800">{displayDate}</span>
                    </div>
                  </div>

                  {/* 2. Rincian Konversi Aset */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-wider mb-1 border-b border-slate-100 pb-2">2. Rincian Konversi Aset</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Aset Keluar (Dari)</span>
                      <span className="text-[14px] font-black text-slate-900">{tx?.amount?.replace("-", "") || "0.00"} {tx?.metadata?.fromToken?.symbol || "USDC"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Aset Masuk (Ke)</span>
                      <span className="text-[14px] font-black text-emerald-600">
                        {swapRate && tx?.amount 
                          ? (parseFloat(tx.amount.replace("-", "")) * swapRate).toFixed(4)
                          : "~"
                        } {tx?.metadata?.toToken?.symbol || ""}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Kurs Konversi (Rate)</span>
                      <span className="text-[12px] font-bold text-slate-700">
                        {swapRate 
                          ? \`1 \${tx?.metadata?.fromToken?.symbol || ""} = \${swapRate} \${tx?.metadata?.toToken?.symbol || ""}\`
                          : "Fetching rate..."}
                      </span>
                    </div>
                  </div>

                  {/* 3. Data Pasar & Proteksi */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-wider mb-1 border-b border-slate-100 pb-2">3. Data Pasar & Proteksi</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Penyedia Rute</span>
                      <span className="text-[12px] font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md">Arc Network Swap</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Slippage</span>
                      <span className="text-[12px] font-bold text-slate-800">0.5% (Auto)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Biaya Swap (Fee)</span>
                      <span className="text-[12px] font-bold text-slate-800">{tx?.metadata?.platformFee || "0.00"} USDC</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (` + content.substring(idxStart, idxEnd - 29) + `
            )}
          </div>
        )}
      </div>
    </div>
  );
}`;

fs.writeFileSync('src/components/screens/ReceiptScreen.tsx', newContent);
