import fs from 'fs';

let content = fs.readFileSync('src/components/router/ViewRouter.tsx', 'utf8');

const viewsToRemove = [
  'forgotPassword', 'namaPanggilan', 'ecommerce', 'merchant', 'faucet',
  'bayarVA', 'email', 'otherAccounts', 'receiveVA', 'receiveQRIS', 'arcswap', 'arcbird', 'manageFavorites', 'connectEWallet', 'scanQR', 'aiAgent', 'batchTransfer', 'stablestake'
];

// Clean imports we've deleted and also unneeded imports.
// It'll be easier to just remove all these screens.
let newContent = content;

// Remove the conditional blocks
viewsToRemove.forEach(view => {
    // try to match the `{viewState === "viewName" && (...)}` block
    // including the platform config lock screen logic
    const regex = new RegExp(`\\{\\s*viewState === "${view}" && \\([\\s\\S]*?\\)\\s*\\}`, 'g');
    newContent = newContent.replace(regex, '');
});

fs.writeFileSync('src/components/router/ViewRouter.tsx', newContent);
