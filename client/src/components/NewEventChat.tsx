import React, { useState, useEffect, useRef } from 'react';
import { Send, X } from 'lucide-react';
import Header from './Header';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useEventParticipation } from '../hooks/useEventParticipation';
import { useEventPool } from '../hooks/useEventPool';
import { supabase } from '../lib/supabase';
import ChatBubble from './ChatBubble';
import * as Ably from 'ably';
import { ChatClient, ChatMessageEvent } from '@ably/chat';


// Update the Gif interface to match Tenor's API response
interface Gif {
  id: string;
  media_formats: {
    gif: {
      url: string;
    };
  };
  content_description: string;
}

interface EventCreator {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface EventPool {
  id: string;
  total_amount: number;
  entry_amount: number;
  yes_pool: number;
  no_pool: number;
}

interface Event {
  id: string;
  title: string;
  description?: string; // Added description property
  creator: EventCreator;
  pool: EventPool[];
  participants: { user_id: string }[];
  banner_url: string | null;
  end_time: string;
  participant_count?: number;
  pool_total_amount?: number;
}

export interface NewEventChatProps {
  eventId: string;
  onBack: () => void;
}

interface ChatMessage {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  sender?: {
    name: string;
    username?: string;
    avatar_url: string;
    isVerified?: boolean;
  };
  reactions?: { [key: string]: string[] };
  media_type?: 'image' | 'gif';
  media_url?: string;
  mentions?: Array<{
    id: string;
    username: string;
  }>;
  reply_to?: {
    id: string;
    content: string;
    sender_username?: string;
  };
}

const NewEventChat: React.FC<NewEventChatProps> = ({ eventId, onBack }) => {
  // --- Ably connection state indicator ---
  const [ablyConnectionState, setAblyConnectionState] = useState<string>('connecting');

  const { currentUser } = useAuth();

  // --- Ably config ---
  const roomName = `event-chat-${eventId}`;
  const ablyApiKey = import.meta.env.VITE_ABLY_API_KEY;
  const ablyClientId = currentUser?.user_metadata?.username || 'guest';

  // Memoize Ably Realtime and ChatClient (declare only once!)
  const ablyRealtime = React.useMemo(() => {
    if (!ablyApiKey) return null;
    return new Ably.Realtime({ key: ablyApiKey, clientId: ablyClientId });
  }, [ablyApiKey, ablyClientId]);

  // Listen for Ably connection state changes (must be after ablyRealtime is defined)
  useEffect(() => {
    if (!ablyRealtime) return;
    const handler = (stateChange: any) => {
      setAblyConnectionState(stateChange.current || ablyRealtime.connection.state);
    };
    ablyRealtime.connection.on('connected', handler);
    ablyRealtime.connection.on('connecting', handler);
    ablyRealtime.connection.on('disconnected', handler);
    ablyRealtime.connection.on('suspended', handler);
    ablyRealtime.connection.on('closed', handler);
    ablyRealtime.connection.on('failed', handler);
    // Set initial state
    setAblyConnectionState(ablyRealtime.connection.state);
    return () => {
      ablyRealtime.connection.off('connected', handler);
      ablyRealtime.connection.off('connecting', handler);
      ablyRealtime.connection.off('disconnected', handler);
      ablyRealtime.connection.off('suspended', handler);
      ablyRealtime.connection.off('closed', handler);
      ablyRealtime.connection.off('failed', handler);
    };
  }, [ablyRealtime]);
  const toast = useToast();
  const { joinEvent, getUserPrediction, getPredictionCounts } = useEventParticipation();
  const { updatePoolAmount } = useEventPool();
  // Removed unused followUser, unfollowUser

  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [ablyError, setAblyError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  // Only keep used state
  const [userPoints, setUserPoints] = useState<{ [key: string]: number }>({});
  const [bannerOpen, setBannerOpen] = useState(true);
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [loadingEvent, setLoadingEvent] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // --- Ably Chat SDK direct integration ---
  const chatClient = React.useMemo(() => {
    if (!ablyRealtime) return null;
    return new ChatClient(ablyRealtime);
  }, [ablyRealtime]);

  // State for messages
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Subscribe to room events
  useEffect(() => {
    if (!chatClient) return;
    let room: any;
    let unsubMsg: any;
    let unsubTyping: any;
    let mounted = true;
    setIsLoading(true);
    setAblyError(null);
    // Helper to fetch user profile for a given senderId
    const fetchProfile = async (senderId: string) => {
      if (!senderId || senderId === 'guest') {
        return {
          name: 'Guest',
          username: 'guest',
          avatar_url: '',
          isVerified: false,
        };
      }
      try {
        const { data, error } = await supabase
          .from('users')
          .select('name, username, avatar_url, is_verified')
          .eq('id', senderId)
          .single();
        if (error || !data) {
          return {
            name: senderId,
            username: senderId,
            avatar_url: '',
            isVerified: false,
          };
        }
        return {
          name: data.name || data.username || senderId,
          username: data.username || senderId,
          avatar_url: data.avatar_url || '',
          isVerified: !!data.is_verified,
        };
      } catch {
        return {
          name: senderId,
          username: senderId,
          avatar_url: '',
          isVerified: false,
        };
      }
    };
    (async () => {
      try {
        room = await chatClient.rooms.get(roomName);
        // Attach to room first
        await room.attach();
        // Fetch message history if available
        if (room.messages && room.messages.getHistory) {
          try {
            const history = await room.messages.getHistory({ limit: 50 });
            if (mounted && Array.isArray(history)) {
              // Fetch all unique senderIds
              const senderIds = Array.from(new Set(history.map((m: any) => m.senderId).filter(Boolean)));
              const senderProfiles: { [id: string]: any } = {};
              await Promise.all(senderIds.map(async (id) => {
                senderProfiles[id] = await fetchProfile(id);
              }));
              setMessages(history.map((message: any) => ({
                id: message.id || message.timestamp || Math.random().toString(),
                content: message.text || '',
                created_at: message.timestamp ? new Date(message.timestamp).toISOString() : new Date().toISOString(),
                sender_id: message.senderId || 'guest',
                sender: senderProfiles[message.senderId] || senderProfiles['guest'],
              })));
            }
          } catch (err) {
            // Ignore if not supported
          }
        }
        // Subscribe to messages
        unsubMsg = room.messages.subscribe(async (event: ChatMessageEvent) => {
          if (!mounted) return;
          const msg: any = event.message;
          // Use Ably Chat SDK fields (fallback to any for compatibility)
          let senderProfile = msg.data && msg.data.sender ? msg.data.sender : null;
          const senderId = msg.clientId || 'guest';
          if (!senderProfile) {
            senderProfile = await fetchProfile(senderId);
          }
          setMessages((prev) => [
            ...prev,
            {
              id: msg.id || msg.timestamp?.toString() || Math.random().toString(),
              content: msg.text || '',
              created_at: msg.timestamp ? new Date(msg.timestamp).toISOString() : new Date().toISOString(),
              sender_id: senderId,
              sender: senderProfile,
            }
          ]);
        });
        // Subscribe to typing (if supported)
        // Typing events are not used in UI, so skip subscribing
      } catch (err) {
        // Room attach or history failed
        console.error('Ably room setup error:', err);
        setAblyError('Unable to connect to chat server. Your network or environment may be blocking access to Ably.');
      } finally {
        setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
      if (unsubMsg && typeof unsubMsg.unsubscribe === 'function') unsubMsg.unsubscribe();
      if (unsubTyping && typeof unsubTyping.unsubscribe === 'function') unsubTyping.unsubscribe();
      if (room) {
        try {
          chatClient.rooms.release(roomName);
        } catch (err) {
          // Silently ignore Ably detach errors
        }
      }
    };
  }, [chatClient, roomName, ablyClientId]);

  // Send message function
  const sendAblyMessage = async (content: string) => {
    if (!chatClient) {
      console.error('Ably ChatClient not initialized');
      setAblyError('Chat is not connected. Please refresh.');
      toast.showError('Chat is not connected. Please refresh.');
      return;
    }
    if (!currentUser) {
      toast.showError('You must be signed in to send messages.');
      return;
    }
    try {
      const room = await chatClient.rooms.get(roomName);
      if (!room) {
        console.error('Ably room not found:', roomName);
        setAblyError('Chat room not found.');
        toast.showError('Chat room not found.');
        return;
      }
      await room.attach();
      // Compose user info for payload
      const userInfo = {
        name: currentUser.user_metadata?.name || currentUser.user_metadata?.username || 'Guest',
        username: currentUser.user_metadata?.username || 'guest',
        avatar_url: currentUser.user_metadata?.avatar_url || '',
        isVerified: !!currentUser.user_metadata?.is_verified,
      };
      // Send message with user info in data (cast as any to satisfy TS)
      await room.messages.send({
        text: content,
        data: {
          sender: userInfo
        }
      } as any);
    } catch (err: any) {
      console.error('Failed to send Ably message:', err);
      setAblyError('Unable to connect to chat server. Your network or environment may be blocking access to Ably.');
      if (err && err.message && err.message.includes('network unreachable')) {
        toast.showError('Unable to connect to chat server. Your network or environment is blocking access to Ably. Please try from a different network or run locally.');
      } else {
        toast.showError('Failed to send message.');
      }
    }
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  // Move fetchUserPoints above useEffect to avoid ReferenceError
  // (fetchUserPoints moved above)

  // Fetch user points for all message senders
  useEffect(() => {
    messages.forEach((msg: any) => {
      if (msg.sender_id) {
        fetchUserPoints(msg.sender_id);
      }
    });
  }, [messages]);

  // Handle message input changes
  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setMessage(newValue);
    handleMention(newValue);
    // No need to manually broadcast typing
  };

  // (Old sendAblyMessage removed, now using direct SDK sendAblyMessage only)

  // Removed unused handleSubmit

  // Correct the sendMessage function calls to use valid properties
  const handleGifSelection = async (gifUrl: string) => {
    try {
      await sendAblyMessage('');
      setShowGifPicker(false);
    } catch (error) {
      toast.showError('Failed to send GIF');
    }
  };

  // Add handleMention function
  const handleMention = async (input: string) => {
    const mentionMatch = input.match(/@(\w*)$/);
    if (mentionMatch) {
      const query = mentionMatch[1];
      if (query.length >= 1) {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('id, username')
            .ilike('username', `${query}%`)
            .limit(5);

          if (error) throw error;
          setMentionResults(data || []);
          setShowMentionDropdown(true);
        } catch (error) {
          console.error('Error fetching mentions:', error);
        }
      } else {
        setShowMentionDropdown(false);
      }
    } else {
      setShowMentionDropdown(false);
    }
  };

  const insertMention = (username: string) => {
    const beforeMention = message.split('@').slice(0, -1).join('@');
    setMessage(beforeMention + `@${username} `);
    setShowMentionDropdown(false);
  };

  // Handle reply
  const handleReply = (msg: ChatMessage) => {
    setReplyingTo(msg);
    // Focus the input field
    const inputField = document.querySelector('input[type="text"]') as HTMLInputElement;
    if (inputField) {
      inputField.focus();
    }
  };

  const fetchUserPoints = async (userId: string) => {
    // Prevent invalid uuid queries (e.g., 'guest')
    if (userPoints[userId] || userId === 'guest') return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('reputation_score')
        .eq('id', userId)
        .single();

      if (error) throw error;

      setUserPoints((prev) => ({
        ...prev,
        [userId]: data.reputation_score || 0,
      }));
    } catch (error) {
      console.error('Error fetching user points:', error);
    }
  };

  const handlePrediction = async (selectedPrediction: boolean) => {
    if (!currentUser) {
      toast.showError('You must be logged in to participate');
      return;
    }

    if (!event) return;

    setIsProcessing(true);
    try {
      const entryAmount = event.pool?.[0]?.entry_amount ?? 0;

      const { success } = await joinEvent({
        eventId,
        userId: currentUser.id,
        prediction: selectedPrediction,
        wagerAmount: entryAmount
      });

      if (success) {
        setPrediction(selectedPrediction);
        await updatePoolAmount(eventId, entryAmount, selectedPrediction);
        const counts = await getPredictionCounts(eventId);
        if (counts) setPredictionCounts(counts);
        toast.showSuccess('Prediction placed successfully!');
      }
    } catch (error) {
      console.error('Error handling prediction:', error);
      toast.showError('Failed to submit prediction');
    } finally {
      setIsProcessing(false);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `event_chat/${eventId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  // Update the GIF system to use Tenor instead of Giphy
  const fetchGifs = async (searchTerm: string) => {
    try {
      const TENOR_API_KEY = import.meta.env.VITE_TENOR_API_KEY;
      if (!TENOR_API_KEY) {
        throw new Error('Tenor API key not configured');
      }

      const response = await fetch(
        `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(searchTerm)}&key=${TENOR_API_KEY}&limit=9`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setGifs(data.results);
    } catch (error) {
      console.error('Error fetching GIFs:', error);
      toast.showError('Failed to load GIFs. ' + (error instanceof Error ? error.message : 'Unknown error'));
      setGifs([]);
    }
  };

  // Share event: just share the event chatroom link, no OG image, no description
  const handleShareEvent = () => {
    const eventChatUrl = `${window.location.origin}/event/${eventId}`;
    const shareContent = {
      title: event?.title || 'Event',
      text: `Join this event chatroom: ${eventChatUrl}`,
      url: eventChatUrl,
    };

    if (navigator.share) {
      navigator.share(shareContent)
        .catch((error) => {
          console.error('Error sharing:', error);
          // Fallback to clipboard if Web Share API fails
          copyToClipboard(eventChatUrl);
        });
    } else {
      copyToClipboard(eventChatUrl);
    }
  };

  // Helper to copy text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.showSuccess('Event link copied to clipboard!'))
      .catch(() => toast.showError('Failed to copy event link.'));
  };

  // Search handler
  const handleSearch = async () => {
    if (!searchInput.trim()) return;
    try {
      // Search messages
      const { data: messages, error: messageError } = await supabase
        .from('event_chat_messages')
        .select('*')
        .ilike('content', `%${searchInput}%`)
        .eq('event_id', eventId);
      if (messageError) throw messageError;
      // Search users
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, username, name')
        .ilike('username', `%${searchInput}%`);
      if (userError) throw userError;
      setSearchResults({ messages: messages || [], users: users || [] });
    } catch (error) {
      toast.showError('Search failed');
    }
  };

  useEffect(() => {
    const fetchEvent = async () => {
      setLoadingEvent(true);
      try {
        const { data, error } = await supabase
          .from('events')
          .select(`
            id,
            title,
            creator_id,
            users!creator_id (id, username, avatar_url),
            pool:event_pools(
              id,
              total_amount,
              entry_amount,
              yes_pool,
              no_pool
            ),
            participants:event_participants(
              user_id
            ),
            banner_url,
            end_time
          `)
          .eq('id', eventId)
          .single();

        if (error) throw error;

        if (data) {
          const creatorObj = Array.isArray(data.users) ? data.users[0] : data.users;
          const formattedEvent: Event = {
            id: data.id,
            title: data.title,
            creator: {
              id: creatorObj?.id || '',
              username: creatorObj?.username || '',
              avatar_url: creatorObj?.avatar_url || null
            },
            pool: data.pool || [],
            participants: data.participants || [],
            banner_url: data.banner_url,
            end_time: data.end_time,
            participant_count: data.participants?.length || 0,
            pool_total_amount: data.pool?.[0]?.total_amount || 0
          };
          setEvent(formattedEvent);
        }
      } catch (error) {
        console.error('Error fetching event:', error);
        toast.showError('Failed to load event');
      } finally {
        setLoadingEvent(false);
      }
    };
    fetchEvent();
  }, [eventId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Removed countdown effect (setCountdown not defined)

  useEffect(() => {
    messages.forEach((msg) => {
      if (msg.sender_id) {
        fetchUserPoints(msg.sender_id);
      }
    });
  }, [messages]);

  useEffect(() => {
    const loadPredictionData = async () => {
      if (!currentUser?.id || !eventId) return;

      try {
        const [userPred, counts] = await Promise.all([
          getUserPrediction(eventId, currentUser.id),
          getPredictionCounts(eventId)
        ]);

        if (userPred !== null) setPrediction(userPred);
        if (counts) setPredictionCounts(counts);
      } catch (error) {
        console.error('Error loading prediction data:', error);
      }
    };

    loadPredictionData();
  }, [currentUser?.id, eventId]);

  // Close menu dropdown when clicking outside
  React.useEffect(() => {
    if (!showMenuDropdown) return;
    const handleClick = (e: MouseEvent) => {
      const dropdown = document.getElementById('event-chat-menu-dropdown');
      if (dropdown && !dropdown.contains(e.target as Node)) {
        setShowMenuDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMenuDropdown]);

  // Removed reactions effect (setMessageReactions not defined)

  // Fetch initial follow state for event creator
  // Removed follow state effect (setIsFollowing not defined)

  // Removed handleFollowBadgeClick (follow state not implemented)

  if (loadingEvent || !event) {
    return (
      <div className="flex flex-col h-screen bg-white items-center justify-center p-6">
        {/* Skeleton loader for chat room */}
        <div className="w-full max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
            <div className="flex-1 h-4 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-4 w-1/2 bg-gray-200 rounded mb-4 animate-pulse" />
          <div className="space-y-3 mb-8">
            <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
            <div className="flex-1 h-10 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // ...existing code before render...

  return (
    <div className="flex flex-col h-screen bg-white">

      {/* Site Header */}
      <Header
        title="Event Chat"
        showBackButton={true}
        onMenuClick={undefined}
        showMenu={false}
        showSearch={false}
        onSearchChange={undefined}
        searchValue={''}
        onBack={onBack}
      />

      {/* Ably connection state indicator */}
      <div className="w-full flex items-center justify-center bg-gray-50 border-b border-gray-200 text-xs text-gray-600 py-1">
        <span className={
          ablyConnectionState === 'connected' ? 'text-green-600' :
          ablyConnectionState === 'connecting' ? 'text-yellow-600' :
          ablyConnectionState === 'disconnected' || ablyConnectionState === 'suspended' || ablyConnectionState === 'closed' || ablyConnectionState === 'failed' ? 'text-red-600' : 'text-gray-600'
        }>
          Ably connection: {ablyConnectionState}
        </span>
      </div>

      {/* Compact event banner below header (restored original minimal design) */}
      {event && bannerOpen && (
        <div className="flex items-center bg-purple-50 border-b border-purple-200 px-3 py-1.5 text-xs min-h-[38px]">
          {event.banner_url && (
            <img src={event.banner_url} alt="Event banner" className="h-7 w-7 rounded object-cover mr-2" />
          )}
          <span className="font-semibold text-purple-900 truncate max-w-[120px] mr-2">{event.title}</span>
          <div className="flex items-center gap-1 mr-2">
            {event.creator?.avatar_url && (
              <img src={event.creator.avatar_url} alt="Creator avatar" className="h-5 w-5 rounded-full object-cover" />
            )}
            <span className="text-purple-700 font-medium truncate max-w-[80px]">@{event.creator?.username}</span>
          </div>
          <button onClick={() => setBannerOpen(false)} className="ml-auto text-purple-400 hover:text-purple-700 p-1" aria-label="Close banner">
            <X size={16} />
          </button>
        </div>
      )}
      {/* Ably connection error banner */}
      {ablyError && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-2 text-center text-sm">
          {ablyError} <br />
          <span className="text-xs">If you are on a restricted network, try a different network or check your Ably API key.</span>
        </div>
      )}
      {/* Scrollable Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-3">
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <div className="text-gray-500">Loading messages...</div>
            </div>
          ) : (
            messages.map((msg: ChatMessage) => {
              const isCurrentUserSender = msg.sender_id === currentUser?.id;
              return (
                <div key={msg.id}>
                  <ChatBubble
                    content={msg.content}
                    timestamp={msg.created_at}
                    isSender={isCurrentUserSender}
                    senderName={msg.sender?.name}
                    senderUsername={msg.sender?.username}
                    isVerified={true}
                    hasAvatar={!!msg.sender?.avatar_url}
                    avatarUrl={msg.sender?.avatar_url}
                    points={userPoints[msg.sender_id]}
                    // ...other props as needed...
                  />
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Fixed Input Area */}
      <div className="flex-shrink-0 bg-gray-50 border-t border-gray-200 p-3">
        {!currentUser && (
          <div className="mb-2 p-2 bg-yellow-100 rounded-lg text-center text-yellow-800 text-sm">
            Please sign in to send messages or react in this chatroom.
          </div>
        )}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!currentUser) return;
            if (message.trim()) {
              try {
                await sendAblyMessage(message.trim());
                setMessage('');
              } catch (err) {
                toast.showError('Failed to send message.');
              }
            }
          }}
          className="flex items-center space-x-2"
        >
          <div className="relative flex items-center w-full">
            <input
              type="text"
              value={message}
              onChange={handleMessageChange}
              className="w-full p-2 text-sm rounded-md border border-gray-300 focus:ring-2 focus:ring-purple-600 focus:outline-none"
              placeholder="Type your message here..."
              disabled={!currentUser}
            />
            <button
              type="submit"
              className="p-2 rounded-md bg-purple-600 text-white shadow-md hover:bg-purple-700 transition-colors"
              aria-label="Send Message"
            >
              <Send size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Utility to format numbers as 50k/1.2M
// Removed unused formatShortNumber

export default NewEventChat;