
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

const NotificationTester: React.FC = () => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const testGroupMessage = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      // Simulate a message from another group
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: currentUser.id,
          type: 'group_message',
          title: 'New message in Premier League Bets',
          content: 'John: What do you think about the match tomorrow?',
          notification_type: 'group_message',
          metadata: {
            group_name: 'Premier League Bets',
            sender: 'John',
            chat_id: 'test-group-1'
          }
        });

      if (error) throw error;
      
      toast.showSuccess('Test notification sent!');
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.showError('Failed to send test notification');
    } finally {
      setLoading(false);
    }
  };

  const testDirectMessage = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      // Simulate a direct message
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: currentUser.id,
          type: 'direct_message',
          title: 'New message from Jane',
          content: 'Hey! Are you available for a quick chat?',
          notification_type: 'direct_message',
          metadata: {
            sender: 'Jane',
            sender_id: 'test-user-jane',
            chat_id: 'test-direct-1'
          }
        });

      if (error) throw error;
      
      toast.showSuccess('Test direct message sent!');
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.showError('Failed to send test notification');
    } finally {
      setLoading(false);
    }
  };

  const testChallengeNotification = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      // Simulate a challenge notification
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: currentUser.id,
          type: 'challenge',
          title: 'New Challenge Received!',
          content: 'Mike challenged you to "Liverpool vs Arsenal - Who will win?"',
          notification_type: 'challenge_received',
          metadata: {
            challenger: 'Mike',
            challenge_id: 'test-challenge-1',
            amount: 500
          }
        });

      if (error) throw error;
      
      toast.showSuccess('Test challenge notification sent!');
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.showError('Failed to send test notification');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <p className="text-gray-600">Please log in to test notifications</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        🧪 Notification Tester
      </h3>
      
      <p className="text-sm text-gray-600 mb-4">
        Test different types of notifications while you're in any chatroom. 
        These will appear as toast notifications.
      </p>

      <div className="space-y-3">
        <button
          onClick={testGroupMessage}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Sending...' : '💬 Test Group Message'}
        </button>

        <button
          onClick={testDirectMessage}
          disabled={loading}
          className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Sending...' : '📨 Test Direct Message'}
        </button>

        <button
          onClick={testChallengeNotification}
          disabled={loading}
          className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Sending...' : '⚔️ Test Challenge'}
        </button>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-700">
          <strong>How to test:</strong><br/>
          1. Navigate to any chatroom<br/>
          2. Click any test button above<br/>
          3. Watch for toast notifications to appear
        </p>
      </div>
    </div>
  );
};

export default NotificationTester;
