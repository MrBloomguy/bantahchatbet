import React, { useState } from 'react';
import { Search, Check, ArrowLeft } from 'lucide-react';
import { useWalletOperations } from '../hooks/useWalletOperations';
import { NIGERIAN_BANKS } from '../constants/banks';
import BankCard from '../components/BankCard';

interface Bank {
  name: string;
  code: string;
}

const WithdrawalScreen: React.FC = () => {
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { withdraw } = useWalletOperations();

  const filteredBanks = NIGERIAN_BANKS.filter(bank => 
    bank.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="flex items-center p-4">
          <button onClick={() => window.history.back()} className="p-2">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold flex-1 text-center">Withdraw</h1>
        </div>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-purple-700">Withdraw to</h2>
          <div className="relative">
            <input
              type="text"
              placeholder="Search banks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg"
            />
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
          </div>
        </div>

        <div className="space-y-4 mb-24">
          {filteredBanks.map((bank) => (
            <BankCard
              key={bank.code}
              bank={bank}
              isSelected={selectedBank?.code === bank.code}
              onSelect={() => setSelectedBank(bank)}
            />
          ))}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
          <button
            onClick={() => selectedBank && navigate(`/withdrawal/details/${selectedBank.code}`)}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium"
            disabled={!selectedBank}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default WithdrawalScreen;