import React, { useState } from 'react';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

interface EmailLoginButtonProps {
  className?: string;
  label?: string;
}

const EmailLoginButton: React.FC<EmailLoginButtonProps> = ({
  className = "w-full flex items-center justify-center gap-2 bg-[#CCFF00] hover:bg-[#b3ff00] text-black font-medium py-2 px-3 rounded-full transition-colors text-sm font-sans",
  label = "Continue with Email"
}) => {
  const toast = useToast();
  const { refreshUser } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // Open the modal
  const handleClick = () => {
    setShowModal(true);
  };

  // Close the modal
  const handleClose = () => {
    setShowModal(false);
    setEmail('');
  };

  // Handle email login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast.showError('Please enter a valid email address');
      return;
    }
    
    setLoading(true);
    
    try {
      // Generate a unique ID
      const userId = uuidv4();
      
      // Check if user exists by email
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();
        
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error checking for existing user:', fetchError);
        toast.showError('Error checking user account');
        setLoading(false);
        return;
      }
      
      if (!existingUser) {
        // Create a simple username from the email
        const displayName = email.split('@')[0];
        const username = `email_${displayName}_${userId.substring(0, 6)}`.toLowerCase().replace(/[^a-z0-9_]/g, '_');
        
        // Create a new user
        const newUser = {
          id: userId,
          name: displayName,
          username: username,
          email: email,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
          bio: `Email user (${email})`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          reputation_score: 0
        };
        
        // Insert the new user
        const { data: insertedUser, error: insertError } = await supabase
          .from('users')
          .insert(newUser)
          .select()
          .single();
          
        if (insertError) {
          console.error('Error creating user:', insertError);
          toast.showError('Error creating user account');
          setLoading(false);
          return;
        }
        
        // Store the user in state
        refreshUser({
          ...insertedUser,
          points: 0
        });
        
        toast.showSuccess('Account created successfully!');
      } else {
        // Update existing user's last login time
        const { error: updateError } = await supabase
          .from('users')
          .update({
            updated_at: new Date().toISOString()
          })
          .eq('id', existingUser.id);
          
        if (updateError) {
          console.error('Error updating user:', updateError);
        }
        
        // Store the user in state
        refreshUser({
          ...existingUser,
          points: existingUser.reputation_score || 0
        });
        
        toast.showSuccess('Welcome back!');
      }
      
      // Close the modal
      handleClose();
    } catch (error) {
      console.error('Error handling email login:', error);
      toast.showError('Authentication error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={className}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z"
            fill="currentColor"
          />
        </svg>
        {label}
      </button>

      {/* Email Login Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
          <div className="relative w-full max-w-md mx-4 bg-white rounded-xl shadow-xl overflow-hidden">
            {/* Close button */}
            <button 
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <div className="p-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Sign In</h2>
                <p className="text-gray-600 mt-1">Enter your email to continue</p>
              </div>

              {/* Email Sign In Form */}
              <form onSubmit={handleEmailLogin} className="mb-4">
                <div className="mb-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-[#CCFF00] hover:bg-[#b3ff00] text-black font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
                >
                  {loading ? 'Signing in...' : 'Continue with Email'}
                </button>
              </form>

              <p className="text-gray-500 text-sm text-center">
                We'll create an account if you don't have one
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EmailLoginButton;
