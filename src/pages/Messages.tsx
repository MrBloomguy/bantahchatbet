import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import MobileFooterNav from '../components/MobileFooterNav';
import { supabase } from '../lib/supabase';
import { Search, MessageSquare, MessageSquareText, ArrowLeft, Trophy } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ChatWindow from '../components/ChatWindow';
import ChallengeChatTab from '../components/ChallengeChatTab';

interface User {
  id: string;
  name: string;
  avatar_url: string | null;
  is_online?: boolean;
}

interface LastMessage {
  content: string;
  created_at: string;
  sender_id: string;
  sender_name?: string;
}

interface ChatListItem {
  chat_id: string;
  other_user: User;
  last_message: LastMessage | null;
  unread_count: number;
}

const ChatListItemSkeleton: React.FC = () => (
  <div className="bg-white p-3 rounded-lg shadow-sm flex items-center space-x-3 animate-pulse">
    <div className="w-11 h-11 rounded-full bg-gray-300 flex-shrink-0"></div>
    <div className="flex-grow min-w-0 space-y-1.5">
      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
      <div className="h-3 bg-gray-300 rounded w-1/2"></div>
    </div>
    <div className="h-3 bg-gray-300 rounded w-10 flex-shrink-0 self-start mt-0.5"></div>
  </div>
);

const Messages: React.FC = () => {
  const [chatListItems, setChatListItems] = useState<ChatListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredChatList, setFilteredChatList] = useState<ChatListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'challenges'>('all');
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { userId: activeChatUserId } = useParams<{ userId?: string }>();
  const { chatId } = useParams<{ chatId?: string }>();
  const [refreshChatList, setRefreshChatList] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);

  useEffect(() => {
    if (activeChatUserId) {
      setShowMobileChat(true);
    }
  }, [activeChatUserId]);

  const handleUserClick = (userId: string) => {
    navigate(`/messages/${userId}`);
    setShowMobileChat(true);
  };

  const handleBackToList = () => {
    navigate('/messages');
    setShowMobileChat(false);
  };

  const fetchChatList = async () => {
    setLoading(true);
    try {
      if (!currentUser) return;

      const { data: chatParticipants, error: participantsError } = await supabase
        .from('chat_participants')
        .select('chat_id')
        .eq('user_id', currentUser.id);

      if (participantsError) {
        console.error('Error fetching chat participants:', participantsError);
        setChatListItems([]);
        return;
      }

      const chatIds = chatParticipants.map(p => p.chat_id);
      if (chatIds.length === 0) {
        setChatListItems([]);
        setLoading(false);
        return;
      }

      const chatDetailsPromises = chatIds.map(async (chatId) => {
        const { data: otherParticipant, error: otherParticipantError } = await supabase
          .from('chat_participants')
          .select('user_id')
          .eq('chat_id', chatId)
          .neq('user_id', currentUser.id)
          .single();

        if (otherParticipantError || !otherParticipant) return null;
        const otherUserId = otherParticipant.user_id;

        const { data: otherUser, error: otherUserError } = await supabase
          .from('users_view')
          .select('id, name, avatar_url')
          .eq('id', otherUserId)
          .single();

        if (otherUserError || !otherUser) return null;

        const { data: lastMessageData } = await supabase
          .from('messages')
          .select('content, created_at, sender_id')
          .eq('chat_id', chatId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const unread_count = 0;

        const lastMessage: LastMessage | null = lastMessageData
          ? { ...lastMessageData } : null;

        return {
          chat_id: chatId,
          other_user: { ...otherUser, is_online: false },
          last_message: lastMessage,
          unread_count: unread_count,
        } as ChatListItem;
      });

      const validResults = (await Promise.all(chatDetailsPromises))
        .filter((item): item is ChatListItem => item !== null)
        .sort((a, b) => {
          if (!a?.last_message) return 1;
          if (!b?.last_message) return -1;
          const dateA = new Date(a.last_message.created_at).getTime();
          const dateB = new Date(b.last_message.created_at).getTime();
          return dateB - dateA;
        });

      setChatListItems(validResults);

    } catch (error) {
      console.error('Error fetching chat list:', error);
      setChatListItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChatList();
  }, [currentUser, refreshChatList]);

  // Handle chat ID from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const chatId = params.get('chatId');

    if (chatId) {
      setTimeout(() => {
        navigate(`/messages/${chatId}`);
      }, 0);
    }
  }, [location.search]);

  useEffect(() => {
    if (chatId) {
      setActiveFilter('challenges');
    }
  }, [chatId]);

  useEffect(() => {
    let listToFilter = chatListItems;

    if (activeFilter === 'unread') {
      listToFilter = listToFilter.filter(item => item.unread_count > 0);
    } else if (activeFilter === 'challenges') {
      listToFilter = listToFilter.filter(item => item.last_message?.content.includes('challenge'));
    }

    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      const filtered = listToFilter.filter(item =>
        item.other_user.name?.toLowerCase().includes(lowerCaseQuery) ||
        item.last_message?.content?.toLowerCase().includes(lowerCaseQuery)
      );
      setFilteredChatList(filtered);
    } else {
      setFilteredChatList(listToFilter);
    }
  }, [searchQuery, chatListItems, activeFilter]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const formatRelativeTime = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: false });
    } catch (error) {
      return '';
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header title="Messages" showBackButton={true} />
      <div className="container mx-auto flex-grow flex">
        <div className={`w-full lg:w-1/3 lg:max-w-sm flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto ${
          showMobileChat ? 'hidden lg:block' : 'block'
        }`}>
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-2">
            <div className="relative mb-2">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4">
                <Search className="h-5 w-5 text-gray-400" />
              </span>
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-11 pr-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-gray-50 text-sm"
              />
            </div>
            <div className="flex space-x-2 mb-2">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-150 ${activeFilter === 'all'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('unread')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-150 ${activeFilter === 'unread'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Unread
              </button>
              <button
                type="button"
                onClick={() => navigate('/challenges')}
                className="px-3 py-1 rounded-full text-sm font-medium transition-colors duration-150 bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Challenges
                {chatListItems.some(item => item.unread_count > 0 && item.last_message?.content.includes('challenge')) && (
                  <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">!</span>
                )}
              </button>
            </div>
          </div>
          <div className="flex-grow overflow-y-auto">
            {loading ? (
              <div className="space-y-2 pt-1">
                <ChatListItemSkeleton />
                <ChatListItemSkeleton />
                <ChatListItemSkeleton />
              </div>
            ) : filteredChatList.length > 0 ? (
              <div className="space-y-2 pt-1 pb-4">
                {filteredChatList.map(item => {
                  const isActive = item.other_user.id === activeChatUserId;
                  return (
                    <div
                      key={item.chat_id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors duration-150 flex items-center space-x-3 ${isActive
                        ? 'bg-purple-100 shadow-md'
                        : 'bg-white hover:bg-gray-50/60 shadow-sm'}`}
                      onClick={() => handleUserClick(item.other_user.id)}
                    >
                      <div className="relative flex-shrink-0">
                        <img
                          src={item.other_user.avatar_url || '/avatar.svg'}
                          alt={item.other_user.name}
                          className="w-11 h-11 rounded-full object-cover border border-gray-100"
                        />
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-start mb-0.5">
                          <h6 className={`text-sm font-semibold text-gray-800 truncate ${item.unread_count > 0 ? 'font-bold' : ''}`}>
                            {item.other_user.name}
                          </h6>
                          <span className="text-xs text-gray-400 flex-shrink-0 ml-2 pt-0.5">
                            {formatRelativeTime(item.last_message?.created_at)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          {item.last_message ? (
                            <p className={`text-xs text-gray-500 truncate ${item.unread_count > 0 ? 'font-semibold text-gray-700' : ''}`}>
                              {item.last_message.sender_id === currentUser?.id ? 'You: ' : ''}
                              {item.last_message.content}
                            </p>
                          ) : (
                            <p className="text-xs text-gray-400 italic">No messages</p>
                          )}
                          {item.unread_count > 0 && (
                            <div className="w-4.5 h-4.5 bg-purple-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 ml-1.5">
                              {item.unread_count < 10 ? item.unread_count : '9+'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col justify-center items-center h-full text-center">
                <MessageSquare className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">
                  {searchQuery
                    ? 'No matching chats found.'
                    : activeFilter === 'unread'
                      ? 'No unread messages.'
                      : activeFilter === 'challenges'
                        ? 'No challenges found.'
                        : 'No chats yet. Start a conversation!'}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className={`flex-grow ${!showMobileChat ? 'hidden lg:block' : 'block'}`}>
          {activeChatUserId ? (
            <div className="h-full flex flex-col">
              {showMobileChat && (
                <div className="lg:hidden flex items-center gap-2 p-4 bg-white border-b border-gray-200">
                  <button
                    type="button"
                    onClick={handleBackToList}
                    className="p-2 hover:bg-gray-100 rounded-full"
                    title="Back to chat list"
                  >
                    <ArrowLeft className="w-6 h-6 text-gray-600" />
                  </button>
                  <div className="flex-1">
                    {filteredChatList.find(chat => chat.other_user.id === activeChatUserId)?.other_user.name || 'Chat'}
                  </div>
                </div>
              )}
              <div className="flex-1">
                <ChatWindow
                  userId={activeChatUserId}
                  onNewMessageSent={() => setRefreshChatList(prev => !prev)}
                />
              </div>
            </div>
          ) : (
            <div className="hidden lg:flex items-center justify-center h-full">
              <div className="text-center">
                <MessageSquareText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
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
      </div>
      {!showMobileChat && <MobileFooterNav />}
    </div>
  );
};

export default Messages;