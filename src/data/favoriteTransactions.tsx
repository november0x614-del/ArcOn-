import React from 'react';
import { Send, Receipt, PlusCircle, CreditCard, ArrowDownToLine, Globe, Nfc, Coins, QrCode, TrendingUp, ShieldCheck, Building, Headphones } from 'lucide-react';

export type MenuItemData = {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  badge?: string;
  badgeColor?: string;
  bgCircle?: string;
  isTextIcon?: boolean;
  textIcon?: string;
};

export const ALL_TRANSACTION_MENUS: MenuItemData[] = [
  { id: 'transfer', label: 'USDC Transfer', icon: <Send size={24} />, color: 'text-indigo-500' },
  { id: 'pay', label: 'Pay/VA', icon: <Receipt size={24} />, color: 'text-indigo-500', badge: 'NEW' },
  { id: 'topup', label: 'Top-up', icon: <PlusCircle size={24} />, color: 'text-indigo-500' },
  { id: 'emoney', label: 'e-money', icon: <CreditCard size={24} />, color: 'text-yellow-500', bgCircle: 'bg-yellow-50' },
  { id: 'deposit', label: 'Deposit/ Withdraw', icon: <ArrowDownToLine size={24} />, color: 'text-[#6366f1]' },
  { id: 'fx', label: 'FX Transfer', icon: <Globe size={24} />, color: 'text-[#6366f1]', badge: 'Rp', badgeColor: 'bg-yellow-400' },
  { id: 'tap', label: 'Tap to Pay', icon: <Nfc size={24} />, color: 'text-[#6366f1]' },
  { id: 'request', label: 'Request Money', icon: <Coins size={24} />, color: 'text-[#6366f1]', badge: 'Rp' },
  { id: 'qr_receive', label: 'QR Receive', icon: <QrCode size={24} />, color: 'text-yellow-500', isTextIcon: true, textIcon: 'QRIS' },
  { id: 'invest', label: 'Investment', icon: <TrendingUp size={24} />, color: 'text-[#6366f1]' },
  { id: 'token', label: 'Online Token', icon: <ShieldCheck size={24} />, color: 'text-[#6366f1]' },
  { id: 'branch', label: 'Branch Service', icon: <Building size={24} />, color: 'text-[#6366f1]' },
  { id: 'qris_tap', label: 'QRIS Tap', icon: <QrCode size={24} />, color: 'text-[#6366f1]', isTextIcon: true, textIcon: 'QRIS', badge: 'NEW' },
  { id: 'arcon_support', label: "ArcOn Support", icon: <Headphones size={24} />, color: 'text-[#6366f1]' },
];

export const DEFAULT_FAVORITE_IDS = [
  'transfer', 'pay', 'topup', 'emoney', 'deposit', 'fx', 'tap', 'request', 'qr_receive'
];
