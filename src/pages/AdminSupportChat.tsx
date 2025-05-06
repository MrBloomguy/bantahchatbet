import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Search, UserCircle } from 'lucide-react';
import AdminLayout from "../layouts/AdminLayout";
import { supabase } from '../lib/supabase';
import LoadingSpinner from '../components/LoadingSpinner';

interface SupportMessage {
  id: string;
  content: string;
  created_at: string;
  is_support: boolean;
  user_id: string;
  user_name?: string;
  user_avatar_url?: string;
  username?: string;
  support_name?: string;
  support_avatar_url?: string;
}

interface ChatSession {
  user_id: string;
  user_name: string;
  user_avatar_url?: string;
  username: string;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
}

const AdminSupportChat: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load chat sessions
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const { data: messages, error } = await supabase
          .from('support_messages_with_users')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Group messages by user and get latest message
        const sessionsMap = new Map<string, ChatSession>();
        messages?.forEach(msg => {
          if (!sessionsMap.has(msg.user_id)) {
            sessionsMap.set(msg.user_id, {
              user_id: msg.user_id,
              user_name: msg.user_name || 'Unknown User',
              user_avatar_url: msg.user_avatar_url,
              username: msg.username || 'unknown',
              last_message: msg.content,
              last_message_time: msg.created_at,
              unread_count: msg.is_support ? 0 : 1
            });
          }
        });

        setSessions(Array.from(sessionsMap.values()));
      } catch (error) {
        console.error('Error loading chat sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSessions();

    // Subscribe to new messages
    const subscription = supabase
      .channel('admin-support-chat')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages'
        },
        (payload) => {
          const newMessage = payload.new as SupportMessage;
          // Update sessions list
          setSessions(prev => {
            const existing = prev.find(s => s.user_id === newMessage.user_id);
            if (existing) {
              return prev.map(s => 
                s.user_id === newMessage.user_id 
                  ? {
                      ...s,
                      last_message: newMessage.content,
                      last_message_time: newMessage.created_at,
                      unread_count: newMessage.is_support ? s.unread_count : s.unread_count + 1
                    }
                  : s
              );
            }
            // New session
            return [...prev, {
              user_id: newMessage.user_id,
              user_name: 'New User',
              username: 'unknown',
              last_message: newMessage.content,
              last_message_time: newMessage.created_at,
              unread_count: 1
            }];
          });

          // Update messages list if it's the current chat
          if (selectedUserId === newMessage.user_id) {
            setMessages(prev => [...prev, newMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [selectedUserId]);

  // Load messages for selected user
  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedUserId) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('support_messages_with_users')
          .select('*')
          .eq('user_id', selectedUserId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages(data || []);
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [selectedUserId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUserId) return;

    try {
      setSending(true);
      const { error } = await supabase
        .from('support_messages')
        .insert({
          content: newMessage.trim(),
          user_id: selectedUserId,
          is_support: true
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const filteredSessions = sessions.filter(session => 
    session.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <AdminPageLayout title="Support Chat">
        <div className="flex h-[calc(100vh-200px)] bg-[#1a1b2e] rounded-lg overflow-hidden">
          {/* Sessions List */}
          <div className="w-80 bg-[#242538] border-r border-white/10">
            <div className="p-4 border-b border-white/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users..."
                  className="w-full pl-10 pr-4 py-2 bg-[#1a1b2e] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CCFF00]/50"
                />
              </div>
            </div>
            <div className="overflow-y-auto h-full">
              {filteredSessions.map((session) => (
                <button
                  key={session.user_id}
                  onClick={() => setSelectedUserId(session.user_id)}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-[#1a1b2e] transition-colors ${
                    selectedUserId === session.user_id ? 'bg-[#1a1b2e]' : ''
                  }`}
                >
                  {session.user_avatar_url ? (
                    <img
                      src={session.user_avatar_url}
                      alt={session.user_name}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <UserCircle className="w-10 h-10 text-white/60" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="text-white font-medium truncate">{session.user_name}</p>
                      {session.unread_count > 0 && (
                        <span className="px-2 py-0.5 bg-[#CCFF00] text-black text-xs rounded-full">
                          {session.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="text-white/60 text-sm truncate">@{session.username}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedUserId ? (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {loading ? (
                    <div className="flex justify-center items-center h-full">
                      <LoadingSpinner size="lg" />
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.is_support ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`flex items-start gap-2 max-w-[70%] ${
                            message.is_support ? 'flex-row-reverse' : 'flex-row'
                          }`}
                        >
                          {message.is_support ? (
                            message.support_avatar_url ? (
                              <img
                                src={message.support_avatar_url}
                                alt="Support"
                                className="w-8 h-8 rounded-full"
                              />
                            ) : (
                              <UserCircle className="w-8 h-8 text-[#CCFF00]" />
                            )
                          ) : message.user_avatar_url ? (
                            <img
                              src={message.user_avatar_url}
                              alt={message.user_name}
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <UserCircle className="w-8 h-8 text-white/60" />
                          )}
                          <div
                            className={`rounded-lg px-4 py-2 ${
                              message.is_support
                                ? 'bg-[#CCFF00] text-black'
                                : 'bg-[#242538] text-white'
                            }`}
                          >
                            <p>{message.content}</p>
                            <span className="text-xs opacity-60">
                              {new Date(message.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 bg-[#242538] text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#CCFF00]/50"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sending}
                      className="p-2 text-[#CCFF00] hover:bg-[#242538] rounded-lg transition-colors disabled:opacity-50"
                    >
                      {sending ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-white/60">
                <UserCircle className="w-16 h-16 mb-4" />
                <p>Select a conversation to start chatting</p>
              </div>
            )}
          </div>
        </div>
      </AdminPageLayout>
    </AdminLayout>
  );
};

export default AdminSupportChat;