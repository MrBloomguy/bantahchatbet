import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import MobileFooterNav from '../components/MobileFooterNav';
import { supabase } from '../lib/supabase';
import { Search, MessageSquare, MessageSquareText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ChatWindow from '../components/ChatWindow';

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

// --- Updated Compact ChatListItemSkeleton Component ---
const ChatListItemSkeleton: React.FC = () => (
  <div className="bg-white p-3 rounded-lg shadow-sm flex items-center space-x-3 animate-pulse">
    {/* Avatar Placeholder */}
    <div className="w-11 h-11 rounded-full bg-gray-300 flex-shrink-0"></div>
    {/* Text Placeholders */}
    <div className="flex-grow min-w-0 space-y-1.5">
      <div className="h-4 bg-gray-300 rounded w-3/4"></div> {/* Smaller name placeholder */}
      <div className="h-3 bg-gray-300 rounded w-1/2"></div> {/* Smaller message placeholder */}
    </div>
    {/* Timestamp Placeholder */}
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

  const navigateToChallengeChat = (chatId: string) => {
    navigate(`/messages?tab=challenges&chatId=${chatId}`);
  };

  // Fix type predicate for filtering chat list
  const isValidChatListItem = (item: any): item is ChatListItem => {
    return (
      item !== null &&
      typeof item.chat_id === 'string' &&
      typeof item.other_user === 'object' &&
      typeof item.other_user.is_online === 'boolean' &&
      typeof item.unread_count === 'number'
    );
  };

  // --- FetchChatList Logic ---
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

        const unread_count = 0; // Placeholder for unread count

        const lastMessage: LastMessage | null = lastMessageData
          ? { ...lastMessageData } : null;

        return {
          chat_id: chatId,
          other_user: { ...otherUser, is_online: false },
          last_message: lastMessage,
          unread_count: unread_count,
        };
      });

      const chatListResults = (await Promise.all(chatDetailsPromises))
        .filter(isValidChatListItem);

      chatListResults.sort((a, b) => {
        if (!a.last_message) return 1;
        if (!b.last_message) return -1;
        return new Date(b.last_message.created_at).getTime() - new Date(a.last_message.created_at).getTime();
      });

      setChatListItems(chatListResults);

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

  // --- Process Query Parameters ---
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    const chatId = params.get('chatId');

    if (tab === 'challenges') {
      setActiveFilter('challenges');
    }

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

  // --- Filter Logic ---
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

  const handleUserClick = (userId: string) => {
    navigate(`/messages/${userId}`);
  };

  // Fix formatRelativeTime to handle undefined
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
      <Header title="Messages" showBackButton={false} />
      <div className="container mx-auto flex-grow flex">
        {/* Chat List Sidebar (visible on larger screens) */}
        <div className="w-full lg:w-1/3 lg:max-w-sm flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto">
          {/* Search Bar - slightly reduced vertical padding */}
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

            {/* Filter Bar - no changes needed */}
            <div className="flex space-x-2 mb-2">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-150 ${activeFilter === 'all'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                All
              </button>
              <button
                onClick={() => setActiveFilter('unread')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-150 ${activeFilter === 'unread'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Unread
              </button>
              {/* Add Challenges Tab */}
              <button
                onClick={() => setActiveFilter('challenges')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-150 ${activeFilter === 'challenges'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Challenges
                {chatListItems.some(item => item.unread_count > 0 && item.last_message?.content.includes('challenge')) && (
                  <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">!</span>
                )}
              </button>
            </div>
          </div>

          {/* Chat List Area - Compacted */}
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
                      {/* Avatar - Smaller */}
                      <div className="relative flex-shrink-0">
                        <img
                          src={item.other_user.avatar_url || '/avatar.svg'}
                          alt={item.other_user.name}
                          className="w-11 h-11 rounded-full object-cover border border-gray-100"
                        />
                        {/* Online badge placeholder */}
                      </div>
                      {/* Chat Info - Compacted */}
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
                          {/* Unread Badge - slightly smaller */}
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

        {/* Main Content Area (Chat Window) - Take remaining space */}
        <div className="flex-grow">
          {activeChatUserId ? (
            // Render ChatWindow if a chat is selected
            <ChatWindow userId={activeChatUserId} onNewMessageSent={() => setRefreshChatList(prev => !prev)} />
          ) : (
            // Render a placeholder if no chat is selected
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
      <MobileFooterNav />
    </div>
  );
};

export default Messages;
