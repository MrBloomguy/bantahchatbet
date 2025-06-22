import React from 'react';

interface NowPaymentsWidgetProps {
  amount: number; // in fiat (e.g. USD)
  currency?: string; // e.g. 'usd', 'ngn'
  onSuccess?: (data: any) => void;
  onClose?: () => void;
}

// NOTE: This is a simple redirect-based widget. For production, you may want to use the NowPayments API for full control.
const NOWPAYMENTS_PUBLIC_KEY = 'e5e2a623-fdaa-405c-a2c7-3e651dc37ade';
const NOWPAYMENTS_API_URL = 'https://api.nowpayments.io/v1/invoice';

const SUPPORTED_CRYPTOS = [
  { label: 'USDT', value: 'usdt' },
  { label: 'BTC', value: 'btc' },
  { label: 'ETH', value: 'eth' },
  { label: 'BNB', value: 'bnb' },
  { label: 'TRX', value: 'trx' },
  { label: 'SOL', value: 'sol' },
];

export const NowPaymentsWidget: React.FC<NowPaymentsWidgetProps> = ({ amount, currency = 'usd', onSuccess, onClose }) => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedCrypto, setSelectedCrypto] = React.useState(SUPPORTED_CRYPTOS[0].value);

  const handleNowPay = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(NOWPAYMENTS_API_URL, {
        method: 'POST',
        headers: {
          'x-api-key': NOWPAYMENTS_PUBLIC_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price_amount: amount,
          price_currency: currency,
          pay_currency: selectedCrypto,
          order_id: 'wallet-' + Date.now(),
          order_description: 'Deposit to wallet',
          success_url: window.location.origin + '/wallet?status=success',
          cancel_url: window.location.origin + '/wallet?status=cancel',
        }),
      });
      const data = await res.json();
      if (data && data.invoice_url) {
        window.open(data.invoice_url, '_blank');
        if (onSuccess) onSuccess(data);
      } else {
        setError('Failed to create invoice.');
      }
    } catch (e) {
      setError('Error connecting to NowPayments.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1 mb-1">
        {SUPPORTED_CRYPTOS.map((crypto) => (
          <button
            key={crypto.value}
            type="button"
            className={`px-2 py-1 rounded text-xs font-medium border transition-colors ${
              selectedCrypto === crypto.value
                ? 'bg-black text-white border-black'
                : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setSelectedCrypto(crypto.value)}
            disabled={loading}
          >
            {crypto.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="w-full bg-black text-white rounded-lg py-2 font-semibold flex items-center justify-center gap-2 hover:bg-gray-900 transition"
        onClick={handleNowPay}
        disabled={loading}
      >
        <img src="https://nowpayments.io/images/logo/nowpayments-logo.svg" alt="NowPayments" className="h-5" />
        {loading ? 'Processing...' : `Pay with ${selectedCrypto.toUpperCase()} (NowPayments)`}
      </button>
      {error && <div className="text-xs text-red-500">{error}</div>}
    </div>
  );
};
