const fs = require('fs');
const content = fs.readFileSync('src/components/screens/ReceiptScreen.tsx', 'utf8');

const targetStr = `            ) : isMint ? (`;

const stakeUnstakeStr = `            ) : isStake ? (
              <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 flex flex-col overflow-hidden">
                <div className="bg-slate-900 p-5 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10 blur-xl bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                  <span className="text-[11px] font-black tracking-widest uppercase text-white/50 mb-1 z-10">Metode Transaksi</span>
                  <span className="text-[20px] font-extrabold text-white tracking-widest z-10">STAKE / DEPOSIT EARN</span>
                </div>
                <div className="p-6 flex flex-col gap-6">
                  {/* 1. Status & Tipe Penguncian */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-wider mb-1 border-b border-slate-100 pb-2">1. Status & Tipe Penguncian</h4>
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
                      <span className="text-[12px] font-bold text-slate-400">Jenis Staking</span>
                      <span className="text-[12px] font-bold text-slate-800">
                        {((tx?.metadata as any)?.stakeType as string) || "Flexible"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Durasi Penguncian</span>
                      <span className="text-[12px] font-bold text-slate-800">
                        {((tx?.metadata as any)?.lockDuration as string) || "Flexible"}
                      </span>
                    </div>
                  </div>

                  {/* 2. Proyeksi Keuntungan */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-wider mb-1 border-b border-slate-100 pb-2">2. Proyeksi Keuntungan</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Estimasi APY / APR</span>
                      <span className="text-[12px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">
                         {((tx?.metadata as any)?.apy as string) || "Est. APY 5.5%"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Aset Berlangganan</span>
                      <span className="text-[13px] font-black text-slate-900">
                         {tx?.amount?.replace("-", "") || "0.00"} {tx?.currency || "USDC"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Mata Uang Imbalan</span>
                      <span className="text-[12px] font-bold text-slate-800">
                         {((tx?.metadata as any)?.rewardToken as string) || tx?.currency || "USDC"}
                      </span>
                    </div>
                  </div>

                  {/* 3. Jadwal Waktu Finansial */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-wider mb-1 border-b border-slate-100 pb-2">3. Jadwal Waktu Finansial (Timeline)</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Tanggal Mulai (Value Date)</span>
                      <span className="text-[12px] font-bold text-slate-800">
                        {((tx?.metadata as any)?.valueDate as string) || "H+1 setelah staking"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Distribusi Imbalan</span>
                      <span className="text-[12px] font-bold text-slate-800">
                        {((tx?.metadata as any)?.distributionDate as string) || "Harian"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Tanggal Selesai (Maturity)</span>
                      <span className="text-[12px] font-bold text-slate-800">
                        {((tx?.metadata as any)?.maturityDate as string) || "Flexible"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : isUnstake ? (
              <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 flex flex-col overflow-hidden">
                <div className="bg-slate-900 p-5 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10 blur-xl bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                  <span className="text-[11px] font-black tracking-widest uppercase text-white/50 mb-1 z-10">Metode Transaksi</span>
                  <span className="text-[20px] font-extrabold text-white tracking-widest z-10">UNSTAKE / REDEEM</span>
                </div>
                <div className="p-6 flex flex-col gap-6">
                  {/* 1. Identitas Transaksi */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-wider mb-1 border-b border-slate-100 pb-2">1. Identitas Transaksi</h4>
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
                  </div>

                  {/* 2. Rincian Penarikan Berhenti */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-wider mb-1 border-b border-slate-100 pb-2">2. Rincian Penarikan Dana</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Modal Ditarik (Principal)</span>
                      <span className="text-[14px] font-black text-slate-900">
                         {((tx?.metadata as any)?.principalAmount as string) || \`\${tx?.amount?.replace("-", "") || "0.00"} \${tx?.currency || "USDC"}\`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Total Keuntungan (Reward)</span>
                      <span className="text-[14px] font-black text-green-600">
                         +{((tx?.metadata as any)?.rewardAmount as string) || \`0.00 \${((tx?.metadata as any)?.rewardToken as string) || tx?.currency || "USDC"}\`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-bold text-slate-400">Periode Pencairan (Unbonding)</span>
                      <span className="text-[12px] font-bold text-slate-800">
                        {((tx?.metadata as any)?.unbondingPeriod as string) || "Instant"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : isMint ? (`;

fs.writeFileSync('src/components/screens/ReceiptScreen.tsx', content.replace(targetStr, stakeUnstakeStr));
