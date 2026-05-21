import React from 'react';

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
  | 'forgotPassword';

export interface ShortcutItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  color: string;
  bgCircle?: string;
  badge?: string;
  badgeColor?: string;
  isTextIcon?: boolean;
  textIcon?: string;
}

export interface Contact {
  id: string;
  name: string;
  number: string;
  avatar: string;
}
