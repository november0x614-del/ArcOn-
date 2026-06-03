export type ViewState =
  | "splash"
  | "register"
  | "registerSuccess"
  | "swap"
  | "ecommerce"
  | "bayarVA"
  | "otherAccounts"
  | "password"
  | "home"
  | "transfer"
  | "newTransfer"
  | "amountInput"
  | "processing"
  | "success"
  | "settings"
  | "inbox"
  | "accountDetail"
  | "namaPanggilan"
  | "email"
  | "manageFavorites"
  | "connectEWallet"
  | "receipt"
  | "scanQR"
  | "aiAgent"
  | "forgotPassword"
  | "transactionHistory"
  | "merchant"
  | "faucet"
  | "receive"
  | "stablestake"
  | "depositOptions"
  | "receiveVA"
  | "receiveQRIS"
  | "logout"
  | "arcswap"
  | "arcbird"
  | "withdraw"
  | "bridge"
  | "mintNFT"
  | "batchTransfer"
  | "transferSuccess"
  | "adminDashboard";

export interface ShortcutItem {
  id: string;
  icon: string;
  label: string;
  color: string;
  path?: string;
  bgCircle?: string;
  badge?: string;
  badgeColor?: string;
  isTextIcon?: boolean;
  textIcon?: string;
}

export type UIDCardTheme = "default" | "premium" | "emerald";

export interface UserIdentity {
  username: string;
  email: string;
  isVerified: boolean;
  registrationDate?: string;
  walletId?: string;
  walletAddress?: string;
  supabaseUid?: string;
  uidTheme?: UIDCardTheme;
}

export interface Transaction {
  id: string;
  type:
    | "deposit"
    | "withdraw"
    | "transfer"
    | "purchase"
    | "swap"
    | "payment"
    | "receive"
    | "bridge"
    | "stake"
    | "unstake"
    | "batchTransfer";
  title: string;
  amount: string;
  currency: string;
  timestamp: string;
  status: "pending" | "success" | "failed" | "pending_approval" | "complete";
  txHash?: string;
  explorerUrl?: string;
  internal_ref?: string;
  metadata?: {
    voucherCode?: string;
    productCategory?: string;
    instructions?: string;
    merchantId?: string;
    fromToken?: any;
    toToken?: any;
    destinationAddress?: string;
    recipientName?: string;
    direction?: "inbound" | "outbound";
    blockNumber?: number;
    explorerUrl?: string;
    senderAddress?: string;
    escrowAddress?: string;
    senderName?: string;
    isAsync?: boolean;
    real?: string | boolean;
    txHash?: string;
    isAtomicBatch?: boolean;
    isBatch?: boolean;
    recipients?: any[];
    platformFee?: number;
    destinationTxHash?: string;
    bridgeFee?: string | number;
    destinationGasFee?: string | number;
  };
}

export interface Product {
  id: string | number;
  name: string;
  price: number | string;
  stock: number;
  image: string;
  category: string;
  sales: number;
  desc?: string;
  date_label?: string;
  seller_address?: string;
  tx_hash?: string;
  created_at?: string;
}

export interface MintedNFT {
  id: string;
  name: string;
  description?: string;
  image: string;
  timestamp: string;
  txHash: string;
}

export interface Contact {
  id: string;
  name: string;
  number: string;
  avatar: string;
  letter?: string;
  network?: string;
  initials?: string;
}

export interface SourceAccount {
  name: string;
  accountNumber: string;
  balance: number;
  currency: string;
}

export interface ImportedToken {
  symbol: string;
  name: string;
  decimals: number;
  contractAddress: string;
  balance: number;
  usdPrice: number;
  color?: string;
}
