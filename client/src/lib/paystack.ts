import { supabase } from './supabase';

const PAYSTACK_SECRET_KEY = import.meta.env.VITE_PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

interface PaystackBank {
  id: number;
  name: string;
  code: string;
  active: boolean;
}

interface TransferRecipient {
  recipient_code: string;
  type: string;
  name: string;
  account_number: string;
  bank_code: string;
  currency: string;
  details: {
    account_number: string;
    account_name: string;
    bank_code: string;
    bank_name: string;
  };
}

class PaystackService {
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const headers = {
      'Authorization': `Bearer ${import.meta.env.VITE_PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(`${PAYSTACK_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Paystack API error: ${response.statusText}`);
    }

    return response.json();
  }

  async getBanks(): Promise<PaystackBank[]> {
    const { data } = await this.makeRequest('/bank');
    return data;
  }

  async verifyAccountNumber(accountNumber: string, bankCode: string) {
    try {
      // Create a transfer recipient which includes verification
      const { data } = await this.makeRequest('/transferrecipient', {
        method: 'POST',
        body: JSON.stringify({
          type: 'nuban',
          name: 'Verification',
          account_number: accountNumber,
          bank_code: bankCode,
          currency: 'NGN'
        }),
      });

      // If we get here, the account is valid
      return {
        verified: true,
        accountName: data.details.account_name,
        recipientCode: data.recipient_code // Store this for later use
      };
    } catch (error) {
      // If the request fails, the account is invalid
      return {
        verified: false,
        accountName: '',
        recipientCode: null
      };
    }
  }

  async createTransferRecipient(
    accountNumber: string,
    bankCode: string,
    accountName: string
  ): Promise<TransferRecipient> {
    const { data } = await this.makeRequest('/transferrecipient', {
      method: 'POST',
      body: JSON.stringify({
        type: 'nuban',
        name: accountName,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: 'NGN',
      }),
    });

    // Store the recipient in our database
    await supabase.from('paystack_recipients').insert({
      user_id: (await supabase.auth.getUser()).data.user?.id,
      recipient_code: data.recipient_code,
      account_number: accountNumber,
      bank_code: bankCode,
      account_name: data.details.account_name,
    });

    return data;
  }

  async initiateTransfer(data: {
    amount: number;
    recipient: string;
    reference: string;
  }) {
    try {
      const response = await this.makeRequest('/transfer', {
        method: 'POST',
        body: JSON.stringify({
          source: 'balance',
          amount: data.amount * 100, // Convert to kobo
          recipient: data.recipient,
          reference: data.reference,
          reason: `Withdrawal ${data.reference}`
        })
      });

      if (!response.status) {
        throw new Error(response.message || 'Transfer initiation failed');
      }

      return {
        success: true,
        transferCode: response.data.transfer_code,
        reference: response.data.reference
      };
    } catch (error) {
      console.error('Paystack transfer error:', error);
      throw new Error('Failed to initiate transfer. Please try again later.');
    }
  }
}

export const paystackService = new PaystackService();
