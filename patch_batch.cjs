const fs = require('fs');

let batchContent = fs.readFileSync('src/components/screens/BatchTransferScreen.tsx', 'utf8');

if (!batchContent.includes('TransferSuccessScreen')) {
  batchContent = batchContent.replace('import { Users, Send,', 'import { TransferSuccessScreen } from "./TransferSuccessScreen";\nimport { Users, Send,');
  
  const successStepRender = '{multiSendStep === "success" && (';
  
  const nextStepRender = '</motion.div>\n          )}';
  
  const startIndex = batchContent.indexOf(successStepRender);
  if (startIndex !== -1) {
    const endIndex = batchContent.indexOf(nextStepRender, startIndex) + nextStepRender.length;
    
    if (endIndex > startIndex) {
        let totalAmount = 'recipients.reduce((acc, curr) => acc + parseFloat(curr.amount || "0"), 0).toFixed(2)';
        const replacement = `{multiSendStep === "success" && (
            <TransferSuccessScreen
              txId={actualTxId || "ARC_BATCH_FINALIZED"}
              amount={${totalAmount}}
              recipientName={recipients.length + " Recipients"}
              fee={PLATFORM_FEE}
              title="Batch Transfer Confirmed"
              description={\`Your batch transfer to \${recipients.length} recipients has been successfully broadcast.\`}
              onBack={() => { setMultiSendStep("form"); onBack(); }}
            />
        )}`;
        batchContent = batchContent.substring(0, startIndex) + replacement + batchContent.substring(endIndex);
    }
  }
  
  fs.writeFileSync('src/components/screens/BatchTransferScreen.tsx', batchContent);
}
