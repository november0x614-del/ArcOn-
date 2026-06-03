const fs = require('fs');
let content = fs.readFileSync('src/components/screens/ReceiptScreen.tsx', 'utf8');

const targetStart = '            ) : (\\n            <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 flex flex-col p-6">';

let replacement = \`            ) : isBatch ? (
              <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 flex flex-col overflow-hidden">
                <div className="bg-slate-900 p-5 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10 blur-xl bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                  <span className="text-[11px] font-black tracking-widest uppercase text-white/50 mb-1 z-10">Metode Transaksi</span>
                  <span className="text-[20px] font-extrabold text-white tracking-widest z-10">BATCH TRANSFER</span>
                </div>
                <div className="p-6 flex flex-col gap-6">
                  {/* 1. Data Ringkasan Induk (Master Data) */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-wider mb-1 border-b border-slate-100 pb-2">1. Data Ringkasan Induk (Master Data)</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">ID Transaksi (Batch TxID)</span>
                      {hasHash ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => window.open(tx?.metadata?.explorerUrl || \\\`https://testnet.arcscan.app/tx/\\\${txHash}\\\`, "_blank")}
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
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Total Alamat Tujuan</span>
                      <span className="text-[12px] font-bold text-slate-800">
                        {tx?.metadata?.recipients ? (tx.metadata.recipients as any[]).length : "0"} Alamat
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Total Dana Keluar</span>
                      <span className="text-[14px] font-black text-slate-900">{tx?.amount?.replace("-", "") || "0.00"} {tx?.currency || "USDC"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Total Biaya (Total Fee)</span>
                      <span className="text-[12px] font-bold text-slate-800 text-right">
                        {tx?.metadata?.platformFee ? \\\`\\\${tx.metadata.platformFee} USDC\\\` : "Bebas Biaya (Disponsori)"}
                      </span>
                    </div>
                  </div>

                  {/* 2. Data Rincian Penerima (Detail Sub-Transaksi) */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-wider mb-1 border-b border-slate-100 pb-2">2. Data Rincian Penerima (Detail Sub-Transaksi)</h4>
                    {tx?.metadata?.recipients ? (
                      <div className="w-full bg-slate-50 rounded-2xl p-3 border border-slate-100 flex flex-col gap-2 relative">
                        {(tx.metadata.recipients as any[]).map((r, i) => (
                          <div key={i} className="flex flex-col bg-white p-3 rounded-xl border border-slate-100 shadow-sm relative">
                            <span className="absolute top-2 right-2 text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-600 px-2 py-0.5 rounded-full border border-green-100">
                               {isSuccess ? "Sukses" : "Gagal"}
                            </span>
                            <div className="flex justify-between items-center mb-1">
                               <span className="text-[11px] font-bold text-slate-500">Penerima [{i + 1}]</span>
                            </div>
                            <span className="text-[13px] font-bold text-slate-800 mb-1">{r.name || r.username || "Unknown"}</span>
                            <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded w-fit mb-2">
                               {r.address || "0x..."}
                            </span>
                            <div className="flex justify-between items-center border-t border-slate-100 pt-2 mt-1">
                               <span className="text-[11px] font-bold text-slate-400">Nominal</span>
                               <span className="text-[13px] font-black text-slate-900">{r.amount} USDC</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[12px] font-medium text-slate-500 italic text-center py-4 bg-slate-50 rounded-xl border border-slate-100">Data rincian alamat tidak tersedia.</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
            <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 flex flex-col p-6">\`;

if(content.includes(targetStart)){
   fs.writeFileSync('src/components/screens/ReceiptScreen.tsx', content.replace(targetStart, replacement));
}
