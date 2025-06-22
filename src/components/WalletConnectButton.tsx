import React from 'react';
import WalletConnectProvider from '@walletconnect/web3-provider';

export const WalletConnectButton: React.FC<{ onConnect?: (address: string) => void }> = ({ onConnect }) => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Create WalletConnect Provider
      const provider = new WalletConnectProvider({
        rpc: {
          1: 'https://mainnet.infura.io/v3/1c7e2e7e7e7e4e7e8e7e7e7e7e7e7e7e', // fallback
        },
      });
      // 2. Enable session (triggers QR Code modal)
      await provider.enable();
      const accounts = provider.accounts;
      if (accounts && accounts.length > 0 && onConnect) {
        onConnect(accounts[0]);
      }
    } catch (e) {
      setError('Failed to connect to WalletConnect.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      className="w-full flex items-center justify-center gap-2 bg-[#3b99fc] hover:bg-[#1a7ed6] text-white font-medium py-2 px-3 rounded-full transition-colors text-sm font-sans"
      onClick={handleConnect}
      disabled={loading}
    >
      <img src="https://walletconnect.com/_next/static/media/logo_mark.4c4876b6.svg" alt="WalletConnect" className="h-5" />
      {loading ? 'Connecting...' : 'Sign in with WalletConnect'}
    </button>
  );
};
