import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { useToast } from '../contexts/ToastContext';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        toast.showSuccess('Successfully logged in as admin');
        navigate('/admin/dashboard');
      } else {
        toast.showError('Invalid admin credentials');
      }
    } catch (error) {
      console.error('Admin login error:', error);
      toast.showError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1b2e]">
      <div className="max-w-md w-full space-y-8 p-8 bg-[#242538] rounded-xl shadow-lg">
        <div>
          <h2 className="text-center text-3xl font-bold text-white">
            Admin Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Please sign in with your admin credentials
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-700 bg-[#1a1b2e] text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CCFF00]/50 focus:border-transparent"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-700 bg-[#1a1b2e] text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CCFF00]/50 focus:border-transparent"
                placeholder="Password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-black bg-[#CCFF00] hover:bg-[#CCFF00]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#CCFF00]/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
