import React from 'react';
import { Check } from 'lucide-react';

interface BankCardProps {
  bank: {
    name: string;
    code: string;
  };
  isSelected: boolean;
  onSelect: () => void;
}

const BankCard: React.FC<BankCardProps> = ({ bank, isSelected, onSelect }) => {
  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-xl border ${
        isSelected ? 'border-purple-600' : 'border-gray-200'
      } cursor-pointer`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-xl font-semibold">{bank.name[0]}</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{bank.name}</h3>
            <p className="text-sm text-gray-500">Code: {bank.code}</p>
          </div>
        </div>
        <div className={`w-6 h-6 rounded-full border flex items-center justify-center
          ${isSelected ? 'bg-purple-600 border-purple-600' : 'border-gray-300'}`}>
          {isSelected && <Check className="w-4 h-4 text-white" />}
        </div>
      </div>
    </div>
  );
};

export default BankCard;