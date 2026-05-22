export type ViewState = 
  | 'splash' 
  | 'register' 
  | 'registerSuccess' 
  | 'swap' 
  | 'ecommerce' 
  | 'bayarVA' 
  | 'otherAccounts' 
  | 'password' 
  | 'home' 
  | 'transfer' 
  | 'newTransfer' 
  | 'amountInput' 
  | 'processing' 
  | 'success' 
  | 'settings' 
  | 'inbox' 
  | 'accountDetail' 
  | 'namaPanggilan' 
  | 'email' 
  | 'manageFavorites' 
  | 'connectEWallet' 
  | 'topup'
  | 'receipt'
  | 'scanQR'
  | 'aiAgent'
  | 'forgotPassword'
  | 'biometricVerify'
  | 'transactionHistory'
  | 'merchant'
  | 'faucet'
  | 'receive'
  | 'stablestake'
  | 'depositOptions'
  | 'receiveVA'
  | 'receiveQRIS'
  | 'logout'
  | 'arcswap'
  | 'arcbird'
  | 'withdraw'
  | 'bridge'
  | 'batchTransfer';

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

export type UIDCardTheme = 'default' | 'premium' | 'emerald';

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
  type: 'deposit' | 'withdraw' | 'transfer' | 'purchase' | 'swap' | 'payment' | 'receive';
  title: string;
  amount: string;
  currency: string;
  timestamp: string;
  status: 'pending' | 'success' | 'failed';
  txHash?: string;
  internal_ref?: string;
  metadata?: {
    voucherCode?: string;
    productCategory?: string;
    instructions?: string;
    merchantId?: string;
    fromToken?: string;
    toToken?: string;
  };
}

export interface Contact {
  id: string;
  name: string;
  number: string;
  avatar: string;
}

export interface SourceAccount {
  name: string;
  accountNumber: string;
  balance: number;
  currency: string;
}
