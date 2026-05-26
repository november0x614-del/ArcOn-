import { useState, useEffect } from 'react';
import { ARC_CHAIN_ID } from './arcConfig';

/**
 * useArcWallet Hook
 * Implements the connection logic from Arc Documentation.
 * Handles window.__arcWallet events and state.
 */
export function useArcWallet() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected' | 'not-installed'>('checking');
  const [address, setAddress] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const bus = (window as any).__arcWallet;
    
    const syncFromBus = () => {
      const b = (window as any).__arcWallet;
      if (!b) return;

      if (b.state && b.state.address) {
        setAddress(b.state.address);
        setStatus('connected');
      } else if (b.isReady) {
        setStatus('disconnected');
      }
    };

    const handleChanged = () => syncFromBus();
    const handleReady = () => syncFromBus();

    window.addEventListener('arc:wallet:changed', handleChanged);
    window.addEventListener('arc:wallet:ready', handleReady);

    if (bus) syncFromBus();
    else setStatus('not-installed');

    return () => {
      window.removeEventListener('arc:wallet:changed', handleChanged);
      window.removeEventListener('arc:wallet:ready', handleReady);
    };
  }, []);

  const connect = async () => {
    const bus = (window as any).__arcWallet;
    if (!bus) {
        setError('No wallet detected');
        return;
    }

    setIsBusy(true);
    setError(null);
    
    try {
      await bus.connect();
      try {
        await bus.switchChain(ARC_CHAIN_ID);
      } catch (switchErr: any) {
        if (switchErr && switchErr.code !== 4001) {
          throw switchErr;
        }
      }
    } catch (err: any) {
      console.error('[ArcWallet] Connection error:', err);
      if (err.code === 4001) setError('Request rejected');
      else setError(err.message || 'Connection failed');
    } finally {
      setIsBusy(false);
    }
  };

  const disconnect = async () => {
    const bus = (window as any).__arcWallet;
    if (!bus) return;
    
    setIsBusy(true);
    try {
      await bus.disconnect();
      setAddress(null);
      setStatus('disconnected');
    } finally {
      setIsBusy(false);
    }
  };

  return {
    status,
    address,
    isBusy,
    error,
    connect,
    disconnect
  };
}
