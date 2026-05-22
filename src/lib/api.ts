
export const api = {
  wallet: {
    create: async (userId: string) => {
      const response = await fetch('/api/wallets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) throw new Error('Gagal membuat wallet');
      return response.json();
    }
  },
  payment: {
    execute: async (walletId: string, destinationAddress: string, amount: string, userId: string) => {
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletId, destinationAddress, amount, userId }),
      });
      if (!response.ok) throw new Error('Gagal melakukan pembayaran');
      return response.json();
    }
  }
};
