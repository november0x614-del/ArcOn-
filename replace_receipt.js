            {/* Receipt Details Card */}
            <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 flex flex-col p-6">
              {/* Amount Row */}
              <div className="flex flex-col items-center justify-center pb-6 border-b border-slate-100 mb-6">
                <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  {isBatch ? "Total Batch Amount" : "Total Amount"}
                </span>
                <span
                  className={`text-[32px] font-black tracking-tight ${isSuccess ? "text-slate-900" : "text-slate-500 line-through decoration-slate-300"}`}
                >
                  {tx ? tx.amount : "0.00"} {tx?.currency || "USDC"}
                </span>
                {isBatch && (
                  <div className="mt-2 text-[11px] font-black text-purple-600 bg-purple-50 px-3 py-1 rounded-full uppercase tracking-tighter italic border border-purple-100">
                    SCA BATCH OPTIMIZED
                  </div>
                )}
                {isBridge && (
                  <div className="mt-2 text-[11px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-tighter italic border border-blue-100">
                    BRIDGE TRANSACTION
                  </div>
                )}
              </div>

              {/* Batch Recipients Breakdown */}
              {isBatch && tx?.metadata?.recipients && (
                <div className="w-full bg-slate-50 rounded-3xl p-4 mb-6 border border-slate-100 animate-in fade-in slide-in-from-top-4 duration-500">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">
                    Distribution Summary
                  </p>
                  <div className="space-y-2">
                    {(tx.metadata.recipients as any[]).map((recipient, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center bg-white p-3 rounded-2xl border border-slate-50 shadow-sm"
                      >
                        <div className="flex flex-col">
                          <span className="text-[13px] font-bold text-slate-800">
                            {recipient.name || recipient.username || "Unknown"}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {recipient.address
                              ? formatAddrShort(recipient.address)
                              : ""}
                          </span>
                        </div>
                        <span className="text-[13px] font-black text-slate-900">
                          {recipient.amount}{" "}
                          <span className="text-[10px] text-slate-400">
                            USDC
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Details List */}
              <div className="flex flex-col gap-5">
                {/* Transaction Hash */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">
                    Transaction ID
                  </span>
                  {hasHash ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          window.open(
                            tx?.metadata?.explorerUrl ||
                              `https://testnet.arcscan.app/tx/${txHash}`,
                            "_blank",
                          )
                        }
                        className="text-[14px] font-medium text-blue-600 hover:text-blue-700 font-mono tracking-tight cursor-pointer bg-transparent border-0 p-0 text-left flex items-center transition-colors break-all"
                        title="View on Arcscan"
                      >
                        {txHash.substring(0, 10)}...
                        {txHash.substring(txHash.length - 8)}
                        <ExternalLink size={14} className="ml-1 opacity-70" />
                      </button>
                      <button
                        onClick={() => handleCopy(txHash, "TxHash")}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-50 transition-colors bg-transparent border-0 cursor-pointer flex items-center justify-center ml-auto"
                        title="Copy transaction ID"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  ) : (
                    <span className="text-[14px] font-bold text-slate-400 font-mono">
                      -
                    </span>
                  )}
                </div>

                {/* Sender */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    Sender
                    {(tx?.metadata?.isAsync || tx?.metadata?.real) && (
                      <div className="relative group flex items-center">
                        <HelpCircle
                          size={12}
                          className="text-slate-300 cursor-pointer"
                        />
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-[220px] bg-slate-800 text-[10px] text-white p-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity text-center z-50">
                          Karena menggunakan Account Abstraction (ERC-4337),
                          pengirim (From) di Explorer adalah Paymaster/Bundler,
                          bukan personal address Anda.
                          <div className="absolute left-1/2 -translate-x-1/2 top-full border-4 border-transparent border-t-slate-800"></div>
                        </div>
                      </div>
                    )}
                  </span>
                  <span className="text-[14px] font-bold text-slate-800">
                    {senderName}
                  </span>
                  {senderAddress && (
                    <span className="font-mono text-[12px] text-slate-500 truncate">
                      {senderAddress.substring(0, 8)}...
                      {senderAddress.slice(-8)}
                    </span>
                  )}
                </div>

                {/* Receiver */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">
                    Receiver
                  </span>
                  <span className="text-[14px] font-bold text-slate-800 truncate">
                    {receiverName}
                  </span>
                  {receiverAddress && (
                    <span className="font-mono text-[12px] text-slate-500 truncate">
                      {receiverAddress.substring(0, 8)}...
                      {receiverAddress.slice(-8)}
                    </span>
                  )}
                </div>

                {/* Date */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">
                    Date & Time
                  </span>
                  <span className="text-[14px] font-medium text-slate-800">
                    {displayDate}
                  </span>
                </div>

                {/* Account Type (New) */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">
                    Infrastructure
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                      Smart Contract Account (SCA)
                    </span>
                  </div>
                </div>

                {/* Fee Breakdown */}
                <div className="flex flex-col gap-1.5 pt-4 border-t border-slate-50">
                  {tx?.metadata?.platformFee && (
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">
                        Platform Fee
                      </span>
                      <span className="text-[14px] font-medium text-slate-800">
                        {tx.metadata.platformFee} USDC
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">
                      Network Fee
                    </span>
                    <span className="text-[14px] font-bold text-slate-800">
                      {isBatch ? "0.05" : "0.01"} USDC
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium italic">
                    {isBatch
                      ? "*Termasuk efisiensi gas batch SCA dan biaya kemudahan platform."
                      : "*Biaya eksekusi jaringan untuk transfer tunggal."}
                  </p>
                </div>
              </div>

              {/* Voucher Area if any */}
              {tx?.metadata?.voucherCode && (
                <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col gap-3">
                  <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">
                    Digital Product
                  </span>
                  {tx.metadata.productCategory === "Subscription" ? (
                    <div className="bg-slate-50 p-4 rounded-[16px] border border-slate-100">
                      <div className="text-emerald-600 font-bold text-[13px] flex items-center gap-2 mb-1.5">
                        <Check size={16} strokeWidth={2.5} />
                        <span>Subscription Active</span>
                      </div>
                      <p className="text-[12px] text-slate-600 leading-relaxed font-medium">
                        {tx.metadata.instructions}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-4 rounded-[16px] border border-slate-100 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Voucher Code
                        </span>
                        <button
                          onClick={() =>
                            handleCopy(
                              tx.metadata?.voucherCode || "",
                              "Voucher Code",
                            )
                          }
                          className="text-slate-500 hover:text-slate-800 flex items-center gap-1.5 font-bold text-[11px] bg-white px-2 py-1/2 rounded-md shadow-sm border border-slate-200 cursor-pointer"
                        >
                          <Copy size={12} /> Copy
                        </button>
                      </div>
                      <div className="bg-white border border-slate-200 py-3 px-4 rounded-xl text-center shadow-sm">
                        <span className="font-mono font-black text-[18px] text-slate-800 tracking-widest select-all">
                          {tx.metadata.voucherCode}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed text-center font-medium mt-1">
                        {tx.metadata.instructions}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
