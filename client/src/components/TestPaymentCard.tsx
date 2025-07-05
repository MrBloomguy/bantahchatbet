import React from 'react';

interface TestPaymentCardProps {
  onCopy: (cardDetails: string) => void;
}

const TestPaymentCard: React.FC<TestPaymentCardProps> = ({ onCopy }) => {
  const testCards = [
    {
      type: 'Success Card',
      number: '4084 0840 8408 4081',
      cvv: '408',
      pin: '0000',
      expiry: '01/25',
      otp: '123456'
    },
    {
      type: 'Failure Card',
      number: '4084 0840 8408 4080',
      cvv: '408',
      pin: '0000',
      expiry: '01/25',
      otp: '123456'
    }
  ];

  return (
    <div className="bg-gray-50 p-4 rounded-lg mb-4">
      <h3 className="text-lg font-semibold mb-2">Test Cards</h3>
      <div className="space-y-4">
        {testCards.map((card, index) => (
          <div key={index} className="border p-3 rounded">
            <h4 className="font-medium text-sm text-gray-700">{card.type}</h4>
            <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
              <div>
                <p>Card Number:</p>
                <p className="font-mono">{card.number}</p>
              </div>
              <div>
                <p>CVV:</p>
                <p className="font-mono">{card.cvv}</p>
              </div>
              <div>
                <p>Expiry:</p>
                <p className="font-mono">{card.expiry}</p>
              </div>
              <div>
                <p>PIN:</p>
                <p className="font-mono">{card.pin}</p>
              </div>
              <div>
                <p>OTP:</p>
                <p className="font-mono">{card.otp}</p>
              </div>
            </div>
            <button
              onClick={() => onCopy(`Card: ${card.number}\nCVV: ${card.cvv}\nExpiry: ${card.expiry}\nPIN: ${card.pin}\nOTP: ${card.otp}`)}
              className="mt-2 text-xs text-blue-600 hover:text-blue-800"
            >
              Copy Details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestPaymentCard;