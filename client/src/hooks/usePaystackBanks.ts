import { useState, useEffect } from 'react';
import { paystackService } from '../lib/paystack';

interface Bank {
  id: number;
  name: string;
  code: string;
  active: boolean;
}

export const usePaystackBanks = () => {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const bankList = await paystackService.getBanks();
        setBanks(bankList.filter(bank => bank.active));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch banks');
      } finally {
        setLoading(false);
      }
    };

    fetchBanks();
  }, []);

  return { banks, loading, error };
};