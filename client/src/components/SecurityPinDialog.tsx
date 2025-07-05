import React, { useState, useEffect } from 'react';
import { Lock, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';

interface SecurityPinDialogProps {
  onClose?: () => void;
  onSuccess?: () => void;
  mode?: 'verify' | 'set';
}

const SecurityPinDialog: React.FC<SecurityPinDialogProps> = ({ 
  onClose, 
  onSuccess,
  mode = 'verify' 
}) => {
  const [pin, setPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { verifyPin, setPin: savePin } = useAuth();

  const handlePinChange = (index: number, value: string, isConfirm = false) => {
    if (!/^\d*$/.test(value)) return;

    const newPin = isConfirm ? [...confirmPin] : [...pin];
    newPin[index] = value;

    if (isConfirm) {
      setConfirmPin(newPin);
    } else {
      setPin(newPin);
    }

    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`pin-${isConfirm ? 'confirm-' : ''}${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      if (mode === 'set') {
        const pinStr = pin.join('');
        const confirmPinStr = confirmPin.join('');

        if (pinStr !== confirmPinStr) {
          setError('PINs do not match');
          return;
        }

        const success = await savePin(pinStr);
        if (success) {
          onSuccess?.();
        } else {
          setError('Failed to set PIN');
        }
      } else {
        const success = await verifyPin(pin.join(''));
        if (success) {
          onSuccess?.();
        } else {
          setError('Incorrect PIN');
          setPin(['', '', '', '']);
        }
      }
    } catch (error) {
      console.error('Error with PIN:', error);
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-submit when all digits are entered
    if (mode === 'verify' && pin.every(digit => digit !== '')) {
      handleSubmit();
    }
  }, [pin, mode]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-[#242538] rounded-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#CCFF00]/20 flex items-center justify-center">
              <Lock className="w-5 h-5 text-[#CCFF00]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {mode === 'set' ? 'Set Security PIN' : 'Enter Security PIN'}
              </h2>
              <p className="text-white/60 text-sm">
                {mode === 'set' 
                  ? 'Choose a 4-digit PIN to secure your account'
                  : 'Enter your 4-digit security PIN'
                }
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-500/10 text-red-500 p-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* PIN Input */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {mode === 'set' ? 'Enter PIN' : 'Security PIN'}
            </label>
            <div className="flex gap-3 justify-center">
              {pin.map((digit, index) => (
                <input
                  key={index}
                  id={`pin-${index}`}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(index, e.target.value)}
                  className="w-12 h-12 bg-[#1a1b2e] text-white text-center text-xl font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CCFF00] transition-shadow"
                />
              ))}
            </div>
          </div>

          {/* Confirm PIN (for set mode) */}
          {mode === 'set' && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Confirm PIN
              </label>
              <div className="flex gap-3 justify-center">
                {confirmPin.map((digit, index) => (
                  <input
                    key={index}
                    id={`pin-confirm-${index}`}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePinChange(index, e.target.value, true)}
                    className="w-12 h-12 bg-[#1a1b2e] text-white text-center text-xl font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CCFF00] transition-shadow"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          {mode === 'set' && (
            <button
              onClick={handleSubmit}
              disabled={loading || pin.includes('') || confirmPin.includes('')}
              className="w-full py-3 bg-[#CCFF00] text-black rounded-xl font-medium hover:bg-[#b3ff00] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" color="#000000" />
                  <span>Setting PIN...</span>
                </>
              ) : (
                'Set PIN'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecurityPinDialog;