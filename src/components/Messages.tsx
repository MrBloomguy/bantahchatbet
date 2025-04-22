import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageSquare, Search, Phone, Video, Info, Image, Smile, Send, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import UserAvatar from './UserAvatar';
import MobileFooterNav from './MobileFooterNav';
import { useChat } from '../hooks/useChat';
import ChatMessageItem from './ChatMessageItem';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { useUserPresenceContext } from '../contexts/UserPresenceContext';

interface Chat {
  id: string;
  title: string;
  avatar?: string;
  lastMessage?: {
    content: string;
    timestamp: string;
  };
  unreadCount?: number;
}

const Messages: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const toast = useToast();
  const { getUserStatus } = useUserPresenceContext();
  const [userStatuses, setUserStatuses] = useState<Record<string, string>>({});
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const [messages, setMessages] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    loading,
    chats,
    toggleReaction,
    refreshMessages,
    refreshChats
  } = useChat(selectedChat?.id);

  const fetchPrivateMessages = useCallback(async () => {
    if (!selectedChat || !currentUser) return;

    try {
      const { data, error } = await supabase
        .from('private_messages')
        .select('*')
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
        .or(`sender_id.eq.${selectedChat.id},receiver_id.eq.${selectedChat.id}`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching private messages:', error);
      toast.showError('Failed to load messages');
    }
  }, [selectedChat, currentUser, toast]);

  useEffect(() => {
    if (selectedChat) {
      fetchPrivateMessages();
    }
  }, [selectedChat, fetchPrivateMessages]);

  // Removed socket useEffect

  // Removed socket useEffect

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch user statuses for the chat list
  useEffect(() => {
    const fetchStatuses = async () => {
      const statusMap: Record<string, string> = {};

      for (const chat of chats) {
        const otherParticipant = chat.participants.find(p => p.user_id !== currentUser?.id);
        if (otherParticipant) {
          const status = await getUserStatus(otherParticipant.user_id);
          statusMap[otherParticipant.user_id] = status;
        }
      }

      setUserStatuses(statusMap);
    };

    if (chats.length > 0) {
      fetchStatuses();
    }
  }, [chats, currentUser?.id, getUserStatus]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedChat) return;

    // Optimistically add message to UI
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      content: messageText.trim(),
      sender_id: currentUser.id,
      receiver_id: selectedChat.id,
      created_at: new Date().toISOString(),
      sender: currentUser,
      isOptimistic: true
    };

    setMessages(prev => [...prev, optimisticMessage]);
    const messageToBeSent = messageText.trim();
    setMessageText(''); // Clear input immediately

    try {
      // Use Supabase to send the message
      const { data, error } = await supabase
        .from('private_messages')
        .insert([
          {
            content: messageToBeSent,
            sender_id: currentUser.id,
            receiver_id: selectedChat.id,
          }
        ])
        .select()

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // Replace optimistic message with real one
      setMessages(prev => prev.map(msg =>
        msg.id === optimisticMessage.id ? data[0] : msg
      ));
    } catch (error) {
      console.error('Error sending message:', error);
      toast.showError('Failed to send message');

      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
    }
  };

  const handleReply = (messageId: string) => {
    const messageToReply = messages.find(m => m.id === messageId);
    if (messageToReply) {
      setReplyingTo(messageToReply);
    }
  };

  // Search for users across the platform
  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      console.log('Searching for users with query:', query);

      // First try with ilike operator
      let { data, error } = await supabase
        .from('users')
        .select('id, name, username, avatar_url')
        .or(`name.ilike.%${query}%,username.ilike.%${query}%`)
        .neq('id', currentUser?.id) // Exclude current user
        .limit(10);

      // If that fails or returns no results, try with direct equality
      if (error || !data || data.length === 0) {
        console.log('No results with ilike, trying direct match');
        const response = await supabase
          .from('users')
          .select('id, name, username, avatar_url')
          .or(`name.eq.${query},username.eq.${query}`)
          .neq('id', currentUser?.id)
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
          .neq('id', currentUser?.id)
          .limit(20);

        if (!response.error && response.data) {
          // Filter results client-side
          const filteredData = response.data.filter(user =>
            (user.name && user.name.toLowerCase().includes(query.toLowerCase())) ||
            (user.username && user.username.toLowerCase().includes(query.toLowerCase()))
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
      setShowSearchResults(true);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.showError('Failed to search users');
    } finally {
      setIsSearching(false);
    }
  }, [currentUser?.id, toast]);

  // Handle search input with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounce
    searchTimeoutRef.current = setTimeout(() => {
      searchUsers(query);
    }, 300);
  };

  // Start a new chat with a user
  const startNewChat = async (userId: string) => {
    console.log('Starting new chat with user ID:', userId);
    try {
      // Check if chat already exists
      console.log('Checking if chat already exists...');
      const { data: existingChats, error: chatsError } = await supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('user_id', currentUser?.id);

      if (chatsError) {
        console.error('Error fetching existing chats:', chatsError);
        throw chatsError;
      }

      const userChats = existingChats || [];
      console.log('User has', userChats.length, 'existing chats');

      for (const userChat of userChats) {
        console.log('Checking chat:', userChat.chat_id);
        const { data: otherParticipant, error: participantError } = await supabase
          .from('chat_participants')
          .select('user_id')
          .eq('chat_id', userChat.chat_id)
          .neq('user_id', currentUser?.id)
          .single();

        if (participantError) {
          console.log('Error or no other participant found:', participantError);
          continue; // Skip to next chat if error
        }

        if (otherParticipant && otherParticipant.user_id === userId) {
          console.log('Found existing chat with this user:', userChat.chat_id);
          // Chat already exists, select it
          const existingChat = chats.find(chat =>
            chat.participants.some(p => p.user_id === userId)
          );

          if (existingChat) {
            console.log('Selecting existing chat:', existingChat.id);
            setSelectedChat(existingChat);
            setShowMobileChat(true);
            setSearchQuery('');
            setShowSearchResults(false);
            return;
          } else {
            console.log('Chat exists in DB but not in local state, refreshing chats...');
            await refreshChats();
            // Try to find the chat again after refresh
            const refreshedChat = chats.find(chat =>
              chat.participants.some(p => p.user_id === userId)
            );

            if (refreshedChat) {
              console.log('Found chat after refresh:', refreshedChat.id);
              setSelectedChat(refreshedChat);
              setShowMobileChat(true);
              setSearchQuery('');
              setShowSearchResults(false);
              return;
            }
          }
        }
      }

      // Create new chat
      console.log('No existing chat found, creating new chat...');
      const { data: newChat, error: createError } = await supabase.rpc('create_chat', {
        p_user_id: currentUser?.id,
        p_other_user_id: userId
      });

      if (createError) {
        console.error('Error creating chat:', createError);
        throw createError;
      }

      console.log('New chat created:', newChat);

      // Refresh chats to include the new one
      await refreshChats();
      setSearchQuery('');
      setShowSearchResults(false);

      // Select the new chat
      console.log('Fetching new chat data...');
      const { data: chatData, error: fetchError } = await supabase
        .from('chats')
        .select(`
          id,
          created_at,
          updated_at,
          participants:chat_participants(
            user_id,
            users(
              id,
              name,
              avatar_url,
              username
            )
          )
        `)
        .eq('id', newChat.chat_id)
        .single();

      if (fetchError) {
        console.error('Error fetching new chat:', fetchError);
        throw fetchError;
      }

      if (chatData) {
        console.log('New chat data:', chatData);
        const processedChat = {
          ...chatData,
          participants: chatData.participants.map((p: any) => ({
            user_id: p.users.id,
            name: p.users.name,
            avatar_url: p.users.avatar_url,
            username: p.users.username
          }))
        };

        console.log('Processed chat:', processedChat);
        setSelectedChat(processedChat);
        setShowMobileChat(true);
      } else {
        console.error('No chat data returned after creation');
      }
    } catch (error) {
      console.error('Error starting new chat:', error);
      toast.showError('Failed to start new chat: ' + (error.message || 'Unknown error'));
    }
  };

  // Process chats to get proper titles and filter based on search query
  const processedChats = chats.map(chat => {
    // Find the other participant (not the current user)
    const otherParticipant = chat.participants.find(p => p.user_id !== currentUser?.id);
    return {
      ...chat,
      title: otherParticipant?.name || otherParticipant?.username || 'Unknown User',
      avatar: otherParticipant?.avatar_url,
      lastMessage: chat.last_message ? {
        content: chat.last_message.content,
        timestamp: new Date(chat.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      } : undefined
    };
  });

  // Filter chats based on search query when not showing search results
  const filteredChats = !showSearchResults ? processedChats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  ) : processedChats;

  if (!currentUser) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="lg:grid lg:grid-cols-[350px,1fr] h-screen">
        {/* Chat List Sidebar */}
        <div className={`bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700
          ${showMobileChat ? 'hidden lg:block' : ''}`}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chats</h1>
            <div className="mt-4 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
                className="w-full pl-10 pr-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800
                  text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          </div>

          {/* Search Results */}
          {showSearchResults && searchQuery.length >= 2 && (
            <div className="absolute z-10 left-4 right-4 top-[140px] bg-white dark:bg-gray-900 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 max-h-[300px] overflow-y-auto">
              <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Search Results</span>
                <button
                  type="button"
                  onClick={() => setShowSearchResults(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm"
                  aria-label="Close search results"
                >
                  Close
                </button>
              </div>

              {searchResults.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  {isSearching ? 'Searching...' : 'No users found'}
                </div>
              ) : (
                <div>
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => startNewChat(user.id)}
                      className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 text-left"
                    >
                      <UserAvatar
                        src={user.avatar_url}
                        alt={user.name || user.username}
                        size="md"
                        className="flex-shrink-0"
                      />
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {user.name || user.username}
                        </h3>
                        {user.username && user.name && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            @{user.username}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Chat List */}
          <div className="overflow-y-auto h-[calc(100vh-140px)]">
            {filteredChats.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                {searchQuery && !showSearchResults ? 'No matching chats' : 'No chats available'}
              </div>
            ) : (
              filteredChats.map((chat) => (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => {
                    setSelectedChat(chat);
                    setShowMobileChat(true);
                    setShowSearchResults(false);
                  }}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800
                    ${selectedChat?.id === chat.id ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                >
                  <UserAvatar
                    src={chat.avatar_url || chat.avatar}
                    alt={chat.title}
                    size="lg"
                    className="flex-shrink-0"
                    status={userStatuses[chat.participants.find(p => p.user_id !== currentUser?.id)?.user_id || ''] as any || 'offline'}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h3 className={`font-semibold truncate ${chat.unread_count > 0 ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-900 dark:text-white'}`}>
                        {chat.title}
                      </h3>
                      {chat.lastMessage?.timestamp && (
                        <span className="text-xs text-gray-500">
                          {chat.lastMessage.timestamp}
                        </span>
                      )}
                    </div>
                    {chat.lastMessage?.content && (
                      <p className={`text-sm truncate ${chat.unread_count > 0 ? 'text-gray-800 dark:text-gray-300 font-medium' : 'text-gray-500'}`}>
                        {chat.lastMessage.content}
                      </p>
                    )}
                  </div>
                  {chat.unread_count > 0 && (
                    <span className="bg-blue-500 text-white text-xs font-bold rounded-full
                      w-5 h-5 flex items-center justify-center flex-shrink-0">
                      {chat.unread_count}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Window */}
        {selectedChat ? (
          <div className={`flex flex-col h-screen ${!showMobileChat ? 'hidden lg:flex' : ''}`}>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-4">
              <button
                onClick={() => setShowMobileChat(false)}
                className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400
                  dark:hover:text-gray-200"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <UserAvatar
                src={selectedChat.avatar}
                alt={selectedChat.title}
                size="lg"
                status={userStatuses[selectedChat.participants.find(p => p.user_id !== currentUser?.id)?.user_id || ''] as any || 'offline'}
              />
              <div className="flex-1">
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  {selectedChat.title}
                </h2>
                <p className="text-sm text-gray-500">
                  {userStatuses[selectedChat.participants.find(p => p.user_id !== currentUser?.id)?.user_id || ''] === 'online'
                    ? 'Active now'
                    : userStatuses[selectedChat.participants.find(p => p.user_id !== currentUser?.id)?.user_id || ''] === 'away'
                      ? 'Away'
                      : 'Offline'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400
                  dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                  <Phone className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400
                  dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                  <Video className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400
                  dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                  <Info className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <ChatMessageItem
                  key={message.id}
                  message={message}
                  isOwnMessage={message.sender_id === currentUser.id}
                  onReply={handleReply}
                  onReaction={toggleReaction}
                  isOptimistic={message.isOptimistic}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              {replyingTo && (
                <div className="mb-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg flex justify-between items-center">
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Replying to: {replyingTo.content}
                  </div>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
                  >
                    ×
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400
                  dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                  <Image className="w-6 h-6" />
                </button>
                <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400
                  dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                  <Smile className="w-6 h-6" />
                </button>
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800
                    text-gray-900 dark:text-white focus:outline-none"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim()}
                  className="p-2 text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-800
                    rounded-full disabled:opacity-50"
                >
                  <Send className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden lg:flex items-center justify-center h-screen">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No chat selected
              </h3>
              <p className="text-gray-500">
                Choose a conversation from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
      <MobileFooterNav />
    </div>
  );
};

export default Messages;
