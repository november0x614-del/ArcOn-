export interface Contact {
  id: string;
  name: string;
  bank: string;
  accountNumber: string;
  initials?: string;
}

export type ViewState = 
  | 'splash'
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
  | 'email';
