import { useState } from 'react';
import { paystackService } from '../lib/paystack';

interface VerificationResult {
  verified: boolean;
  accountName: string;
  recipientCode?: string;
}

export const usePaystackAccount = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getBanks = async () => {
    setLoading(true);
    setError(null);
    try {
      const banks = await paystackService.getBanks();
      return banks;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch banks');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const verifyAccount = async (
    accountNumber: string, 
    bankCode: string
  ): Promise<VerificationResult> => {
    setLoading(true);
    setError(null);
    try {
      const result = await paystackService.verifyAccountNumber(
        accountNumber,
        bankCode
      );
      
      if (!result.verified) {
        throw new Error('Invalid account details. Please check and try again.');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? 
        err.message : 
        'Failed to verify account';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    getBanks,
    verifyAccount,
    loading,
    error
  };
};
