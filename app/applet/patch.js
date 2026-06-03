const fs = require('fs');
let content = fs.readFileSync('src/components/router/ViewRouter.tsx', 'utf8');

const stateHook = '    const [platformConfig, setPlatformConfig] = React.useState<any>(null);';
content = content.replace(stateHook, stateHook + '\n    const [transferSuccessData, setTransferSuccessData] = React.useState<any>(null);');

const importToken = '} from "../../store/useStore";';
if (!content.includes('TransferSuccessScreen')) {
  content = content.replace(importToken, importToken + '\nimport { TransferSuccessScreen } from "../screens/TransferSuccessScreen";');
}

const oldTransferSuccess = '                setSelectedTransaction(txData as any);\n                setReceiptSource("transfer");\n                setViewState("receipt");';
const newTransferSuccess = '                setTransferSuccessData({\n                  txId: result.txId || "",\n                  amount: numAmount.toString(),\n                  recipientName: selectedContact.name,\n                  fee: fee\n                });\n                setViewState("transferSuccess");';
content = content.replace(oldTransferSuccess, newTransferSuccess);

const viewStateReceipt = '{viewState === "receipt" && (';
const viewStateSuccess = '{viewState === "transferSuccess" && transferSuccessData && (\n          <TransferSuccessScreen \n            txId={transferSuccessData.txId}\n            amount={transferSuccessData.amount}\n            recipientName={transferSuccessData.recipientName}\n            fee={transferSuccessData.fee}\n            onBack={() => { setViewState("home"); fetchTransactions(); }}\n          />\n        )}\n\n        {viewState === "receipt" && (';
if (!content.includes('TransferSuccessScreen txId')) {
  content = content.replace(viewStateReceipt, viewStateSuccess);
}

// Modify Batch Transfer Success 
// We want to handle Batch Transfer as well!
fs.writeFileSync('src/components/router/ViewRouter.tsx', content);
