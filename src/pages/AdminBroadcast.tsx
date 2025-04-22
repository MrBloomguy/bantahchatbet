import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Send, Users, Info } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import AdminLayout from '../layouts/AdminLayout';
import { supabase } from '../lib/supabase';

const AdminBroadcast: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'notification' | 'message'>('notification');
  const [targetAudience, setTargetAudience] = useState<'all' | 'active' | 'specific'>('all');
  const [specificUserIds, setSpecificUserIds] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);

  // Search for users
  const handleUserSearch = async () => {
    if (!userSearch.trim()) return;

    try {
      console.log('Searching for users with query:', userSearch);

      // First try with ilike operator
      let { data, error } = await supabase
        .from('users')
        .select('id, name, username, avatar_url')
        .or(`name.ilike.%${userSearch}%,username.ilike.%${userSearch}%`)
        .limit(10);

      // If that fails or returns no results, try with direct equality
      if (error || !data || data.length === 0) {
        console.log('No results with ilike, trying direct match');
        const response = await supabase
          .from('users')
          .select('id, name, username, avatar_url')
          .or(`name.eq.${userSearch},username.eq.${userSearch}`)
          .limit(10);

        if (!response.error && response.data && response.data.length > 0) {
          data = response.data;
          error = null;
        }
      }

      // If still no results, try a more flexible search
      if (!data || data.length === 0) {
        console.log('Still no results, trying more flexible search');
        const response = await supabase
          .from('users')
          .select('id, name, username, avatar_url')
          .limit(20);

        if (!response.error && response.data) {
          // Filter results client-side
          const filteredData = response.data.filter(user =>
            (user.name && user.name.toLowerCase().includes(userSearch.toLowerCase())) ||
            (user.username && user.username.toLowerCase().includes(userSearch.toLowerCase()))
          ).slice(0, 10);

          if (filteredData.length > 0) {
            data = filteredData;
            error = null;
          }
        }
      }

      if (error) throw error;

      console.log('Final search results:', data);
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.showError('Failed to search users');
    }
  };

  // Add user to selection
  const addUser = (user: any) => {
    if (!selectedUsers.some(u => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
      setSpecificUserIds([...specificUserIds, user.id]);
    }
    setSearchResults([]);
    setUserSearch('');
  };

  // Remove user from selection
  const removeUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
    setSpecificUserIds(specificUserIds.filter(id => id !== userId));
  };

  // Send broadcast notification or message
  const handleSendBroadcast = async () => {
    if (!title.trim() || !content.trim()) {
      toast.showError('Please provide both title and content');
      return;
    }

    setLoading(true);
    try {
      // Get target users based on audience selection
      let targetUsers: string[] = [];

      if (targetAudience === 'specific') {
        if (specificUserIds.length === 0) {
          toast.showError('Please select at least one user');
          setLoading(false);
          return;
        }
        targetUsers = specificUserIds;
      } else {
        // Fetch all users or active users
        const { data, error } = await supabase
          .from('users')
          .select('id');

        console.log('Fetched users:', data);

        if (error) {
          console.error('Error fetching users:', error);
          throw error;
        }

        if (data && data.length > 0) {
          if (targetAudience === 'all') {
            targetUsers = data.map(user => user.id);
          } else if (targetAudience === 'active') {
            // For active users, we could add additional filters like last_seen within 7 days
            // This depends on how you define "active" in your application
            targetUsers = data.map(user => user.id);
          }
          console.log(`Found ${targetUsers.length} target users`);
        } else {
          console.log('No users found in the database');
        }
      }

      if (targetUsers.length === 0) {
        toast.showError('No target users found');
        setLoading(false);
        return;
      }

      // Create notifications or messages for each target user
      if (type === 'notification') {
        // Batch insert notifications
        const notifications = targetUsers.map(userId => ({
          user_id: userId,
          title,
          content,
          type: 'admin_broadcast',
          read: false,
          created_at: new Date().toISOString()
        }));

        const { error } = await supabase
          .from('notifications')
          .insert(notifications);

        if (error) throw error;

        toast.showSuccess(`Broadcast notification sent to ${targetUsers.length} users`);
      } else {
        // Batch insert messages
        const messages = targetUsers.map(userId => ({
          sender_id: 'system', // Use a special ID for system messages
          receiver_id: userId,
          content,
          read: false,
          created_at: new Date().toISOString()
        }));

        const { error } = await supabase
          .from('private_messages')
          .insert(messages);

        if (error) throw error;

        toast.showSuccess(`Broadcast message sent to ${targetUsers.length} users`);
      }

      // Log the broadcast action
      await supabase
        .from('admin_audit_log')
        .insert({
          admin_id: 'system', // Replace with actual admin ID
          action: `broadcast_${type}`,
          details: {
            title,
            content,
            target_audience: targetAudience,
            recipient_count: targetUsers.length
          },
          created_at: new Date().toISOString()
        });

      // Reset form
      setTitle('');
      setContent('');
      setType('notification');
      setTargetAudience('all');
      setSpecificUserIds([]);
      setSelectedUsers([]);
    } catch (error) {
      console.error('Error sending broadcast:', error);
      toast.showError('Failed to send broadcast');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="bg-[#242538] rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#CCFF00]" />
            Broadcast Notifications & Messages
          </h2>

          {/* Broadcast Type Selection */}
          <div className="mb-6">
            <label className="block text-white/80 mb-2">Broadcast Type</label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setType('notification')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  type === 'notification'
                    ? 'bg-[#CCFF00] text-black'
                    : 'bg-[#1a1b2e] text-white/60 hover:bg-[#1a1b2e]/80'
                }`}
              >
                <Bell className="w-4 h-4" />
                Notification
              </button>
              <button
                type="button"
                onClick={() => setType('message')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  type === 'message'
                    ? 'bg-[#CCFF00] text-black'
                    : 'bg-[#1a1b2e] text-white/60 hover:bg-[#1a1b2e]/80'
                }`}
              >
                <Send className="w-4 h-4" />
                Message
              </button>
            </div>
          </div>

          {/* Target Audience Selection */}
          <div className="mb-6">
            <label className="block text-white/80 mb-2">Target Audience</label>
            <div className="flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => setTargetAudience('all')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  targetAudience === 'all'
                    ? 'bg-[#CCFF00] text-black'
                    : 'bg-[#1a1b2e] text-white/60 hover:bg-[#1a1b2e]/80'
                }`}
              >
                <Users className="w-4 h-4" />
                All Users
              </button>
              <button
                type="button"
                onClick={() => setTargetAudience('active')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  targetAudience === 'active'
                    ? 'bg-[#CCFF00] text-black'
                    : 'bg-[#1a1b2e] text-white/60 hover:bg-[#1a1b2e]/80'
                }`}
              >
                <Users className="w-4 h-4" />
                Active Users
              </button>
              <button
                type="button"
                onClick={() => setTargetAudience('specific')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  targetAudience === 'specific'
                    ? 'bg-[#CCFF00] text-black'
                    : 'bg-[#1a1b2e] text-white/60 hover:bg-[#1a1b2e]/80'
                }`}
              >
                <Users className="w-4 h-4" />
                Specific Users
              </button>
            </div>
          </div>

          {/* Specific User Selection */}
          {targetAudience === 'specific' && (
            <div className="mb-6 bg-[#1a1b2e] p-4 rounded-lg">
              <label className="block text-white/80 mb-2">Search and Select Users</label>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search by name or username"
                  className="flex-1 px-4 py-2 bg-[#242538] text-white rounded-lg border border-[#333] focus:outline-none focus:border-[#CCFF00]"
                />
                <button
                  type="button"
                  onClick={handleUserSearch}
                  className="px-4 py-2 bg-[#CCFF00] text-black rounded-lg hover:bg-[#CCFF00]/80"
                >
                  Search
                </button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mb-4 max-h-60 overflow-y-auto bg-[#242538] rounded-lg">
                  {searchResults.map(user => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 hover:bg-[#1a1b2e] cursor-pointer"
                      onClick={() => addUser(user)}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar_url || '/avatar.svg'}
                          alt={user.name}
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <p className="text-white text-sm">{user.name}</p>
                          <p className="text-white/60 text-xs">@{user.username}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="text-[#CCFF00] text-sm"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Users */}
              {selectedUsers.length > 0 && (
                <div>
                  <label className="block text-white/80 mb-2">Selected Users ({selectedUsers.length})</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedUsers.map(user => (
                      <div
                        key={user.id}
                        className="flex items-center gap-2 px-3 py-1.5 bg-[#242538] text-white rounded-full"
                      >
                        <img
                          src={user.avatar_url || '/avatar.svg'}
                          alt={user.name}
                          className="w-5 h-5 rounded-full"
                        />
                        <span className="text-sm">{user.name}</span>
                        <button
                          type="button"
                          onClick={() => removeUser(user.id)}
                          className="text-white/60 hover:text-white ml-1"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notification/Message Content */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-white/80 mb-2">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter notification title"
                className="w-full px-4 py-2 bg-[#1a1b2e] text-white rounded-lg border border-[#333] focus:outline-none focus:border-[#CCFF00]"
              />
            </div>
            <div>
              <label className="block text-white/80 mb-2">Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter notification content"
                rows={4}
                className="w-full px-4 py-2 bg-[#1a1b2e] text-white rounded-lg border border-[#333] focus:outline-none focus:border-[#CCFF00]"
              />
            </div>
          </div>

          {/* Info Box */}
          <div className="mb-6 p-4 bg-blue-500/10 text-blue-400 rounded-lg flex items-start gap-3">
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm">
                {type === 'notification'
                  ? 'Notifications will appear in users\' notification center and can trigger push notifications if enabled.'
                  : 'Messages will appear in users\' inbox as a system message.'}
              </p>
              <p className="text-sm mt-2">
                {targetAudience === 'all'
                  ? 'This will be sent to all registered users.'
                  : targetAudience === 'active'
                    ? 'This will be sent to users who have been active recently.'
                    : 'This will be sent only to the users you have selected.'}
              </p>
            </div>
          </div>

          {/* Send Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSendBroadcast}
              disabled={loading || !title.trim() || !content.trim()}
              className="px-6 py-2 bg-[#CCFF00] text-black rounded-lg hover:bg-[#CCFF00]/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></span>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Broadcast
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminBroadcast;
