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
  | "batchTransfer"
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
    | "stake";
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
    fromToken?: string;
    toToken?: string;
    destinationAddress?: string;
    recipientName?: string;
    direction?: "inbound" | "outbound";
    blockNumber?: number;
    explorerUrl?: string;
  };
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
