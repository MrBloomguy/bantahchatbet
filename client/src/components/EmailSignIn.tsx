import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface EmailSignInProps {
  onClose: () => void;
}

const EmailSignIn: React.FC<EmailSignInProps> = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithEmail, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmail(email, password);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('user-not-found')) {
          try {
            await signUp(email, password);
          } catch (signUpErr) {
            setError('Failed to create account');
          }
        } else {
          setError('Failed to sign in');
        }
      }
    }

    setLoading(false);
  };

  return (
    <div className="bg-[#242538] rounded-2xl w-full max-w-md p-6">
      <form onSubmit={handleSubmit}>
        <h2 className="text-2xl font-bold text-white mb-6">
          Sign in with email
        </h2>

        {error && (
          <div className="bg-red-500/10 text-red-500 p-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4 mb-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-400 mb-2"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#1a1b2e] text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#CCFF00]/50"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-400 mb-2"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1a1b2e] text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#CCFF00]/50"
              placeholder="Enter your password"
              required
            />
          </div>
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {loading ? 'Processing...' : 'Continue'}
          <ArrowRight className="w-5 h-5" />
        </button>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-outline flex-1"
          >
            Forgot Password?
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmailSignIn;
