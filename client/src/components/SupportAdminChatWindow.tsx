import React, { useEffect, useState } from 'react';
import ChatWindow from './ChatWindow';
import LoadingSpinner from './LoadingSpinner';
import { supabase } from '../lib/supabase';

// You can change this to your actual admin email
const ADMIN_EMAIL = 'admin@bantahchatbet.com';

const SupportAdminChatWindow: React.FC = () => {
  const [adminId, setAdminId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminId = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('email', ADMIN_EMAIL)
        .single();
      if (!error && data) {
        setAdminId(data.id);
      }
      setLoading(false);
    };
    fetchAdminId();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <LoadingSpinner />
      </div>
    );
  }

  if (!adminId) {
    return <div className="text-center text-gray-500">Admin not found.</div>;
  }

  return <ChatWindow userId={adminId} />;
};

export default SupportAdminChatWindow;
