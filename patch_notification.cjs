const fs = require('fs');

const content = fs.readFileSync('src/components/screens/ReceiptScreen.tsx', 'utf8');

const targetStr = `              <div className="flex flex-col">
                <h3 className="text-[17px] font-bold text-slate-800 tracking-tight leading-snug">
                  {isSuccess ? "Transaction Successful" : "Transaction Failed"}
                </h3>
                <span className="text-[12px] text-slate-500 font-medium mt-0.5">
                  {isSuccess
                    ? "Confirmed on Arc Testnet"
                    : "Reverted by network"}
                </span>
              </div>`;

const replacement = `              <div className="flex flex-col">
                <h3 className="text-[17px] font-bold text-slate-800 tracking-tight leading-snug">
                  {!isSuccess 
                    ? "Transaction Failed" 
                    : (isDeposit && isBridge)
                    ? "Dana berhasil dijembatani!"
                    : (isDeposit)
                    ? \`Anda menerima \${tx?.amount?.replace("-", "") || "0"} \${tx?.currency || "USDC"}\`
                    : "Transaction Successful"
                  }
                </h3>
                <span className="text-[12px] text-slate-500 font-medium mt-0.5">
                  {!isSuccess 
                    ? "Reverted by network"
                    : (isDeposit && isBridge)
                    ? \`\${tx?.amount?.replace("-", "") || "0"} \${tx?.currency || "USDC"} sukses diterima di jaringan \${((tx?.metadata as any)?.destinationDomain || "Arc") as string}\`
                    : (isDeposit)
                    ? \`dari \${senderName || formatAddrShort(senderAddress)}\`
                    : "Confirmed on Arc Testnet"
                  }
                </span>
              </div>`;

if (content.includes(targetStr)) {
  fs.writeFileSync('src/components/screens/ReceiptScreen.tsx', content.replace(targetStr, replacement));
}
