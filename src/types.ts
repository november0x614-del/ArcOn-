export type ViewState = 
  | 'splash' 
  | 'register' 
  | 'registerSuccess' 
  | 'swap' 
  | 'ecommerce' 
  | 'bayarVA' 
  | 'otherAccounts' 
  | 'password' 
  | 'inputName' 
  | 'home' 
  | 'transfer' 
  | 'newTransfer' 
  | 'amountInput' 
  | 'processing' 
  | 'success' 
  | 'settings' 
  | 'inbox' 
  | 'accountDetail' 
  | 'instantAccess' 
  | 'pusatNotifikasi' 
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

export interface UserIdentity {
  username: string;
  email: string;
  isVerified: boolean;
  registrationDate?: string;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'transfer' | 'purchase' | 'swap';
  title: string;
  amount: string;
  currency: string;
  timestamp: string;
  status: 'pending' | 'success' | 'failed';
  txHash?: string;
  metadata?: {
    voucherCode?: string;
    productCategory?: string;
    instructions?: string;
    merchantId?: string;
  };
}

export interface Contact {
  id: string;
  name: string;
  number: string;
  avatar: string;
}
