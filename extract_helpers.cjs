const fs = require('fs');

const code = fs.readFileSync('src/App.tsx', 'utf8');

function extract(startStr, endStr) {
  const startIndex = code.indexOf(startStr);
  let endIndex = code.length;
  if(endStr) {
      endIndex = code.indexOf(endStr);
  }

  if (startIndex !== -1) {
    const chunk = code.substring(startIndex, endIndex);
    return chunk;
  } else {
    console.log("Could not find start for " + startStr);
    return "";
  }
}

const detailActionButton = extract("function DetailActionButton", "function DetailTransactionItem");
const detailTransactionItem = extract("function DetailTransactionItem", "function InstantAccessScreen");

// remove both from App.tsx
let newCode = code.replace(detailActionButton, "").replace(detailTransactionItem, "");
fs.writeFileSync('src/App.tsx', newCode);

const accountDetailSrc = fs.readFileSync('src/components/screens/AccountDetailScreen.tsx', 'utf8');
const newAccountDetailSrc = accountDetailSrc.replace("function AccountDetailScreen", "export function AccountDetailScreen") + "\n\n" + detailActionButton + "\n\n" + detailTransactionItem;
fs.writeFileSync('src/components/screens/AccountDetailScreen.tsx', newAccountDetailSrc);

const amountInputSrc = fs.readFileSync('src/components/screens/AmountInputScreen.tsx', 'utf8');
fs.writeFileSync('src/components/screens/AmountInputScreen.tsx', amountInputSrc.replace("function AmountInputScreen", "export function AmountInputScreen"));

const newTransferSrc = fs.readFileSync('src/components/screens/NewTransferScreen.tsx', 'utf8');
fs.writeFileSync('src/components/screens/NewTransferScreen.tsx', newTransferSrc.replace("function NewTransferScreen", "export function NewTransferScreen"));

const successSrc = fs.readFileSync('src/components/screens/SuccessScreen.tsx', 'utf8');
fs.writeFileSync('src/components/screens/SuccessScreen.tsx', successSrc.replace("function SuccessScreen", "export function SuccessScreen"));

console.log("Extracted subcomponents for AccountDetailScreen and exported components.");
