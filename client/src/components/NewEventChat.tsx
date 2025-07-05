
import React, { useState, useEffect, useRef } from 'react';
import { Send, X } from 'lucide-react';
import Header from './Header';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useEventParticipation } from '../hooks/useEventParticipation';
import { useEventPool } from '../hooks/useEventPool';
import { supabase } from '../lib/supabase';
import ChatBubble from './ChatBubble';
import Pusher from 'pusher-js';

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
  description?: string;
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
  // --- Pusher connection state indicator ---
  const [pusherConnectionState, setPusherConnectionState] = useState<string>('connecting');

  const { currentUser } = useAuth();

  // --- Pusher config ---
  const channelName = `event-chat-${eventId}`;
  const pusherKey = "decd2cca5e39cf0cbcd4";
  const pusherCluster = "mt1";

  // Memoize Pusher client
  const pusherClient = React.useMemo(() => {
    if (!pusherKey) return null;
    
    const pusher = new Pusher(pusherKey, {
      cluster: pusherCluster,
      encrypted: true,
      authEndpoint: '/api/pusher/auth',
      auth: {
        headers: {
          'Authorization': `Bearer ${currentUser?.access_token || ''}`
        }
      }
    });

    return pusher;
  }, [pusherKey, pusherCluster, currentUser?.access_token]);

  // Listen for Pusher connection state changes
  useEffect(() => {
    if (!pusherClient) return;
    
    const handleStateChange = (state: string) => {
      setPusherConnectionState(state);
    };

    pusherClient.connection.bind('state_change', (states: any) => {
      handleStateChange(states.current);
    });

    // Set initial state
    setPusherConnectionState(pusherClient.connection.state);

    return () => {
      pusherClient.connection.unbind('state_change');
    };
  }, [pusherClient]);

  const toast = useToast();
  const { joinEvent, getUserPrediction, getPredictionCounts } = useEventParticipation();
  const { updatePoolAmount } = useEventPool();

  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pusherError, setPusherError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [userPoints, setUserPoints] = useState<{ [key: string]: number }>({});
  const [bannerOpen, setBannerOpen] = useState(true);
  const [showMenuDropdown, setShowMenuDropdown] = useState(false);
  const [loadingEvent, setLoadingEvent] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // State for messages
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prediction, setPrediction] = useState<boolean | null>(null);
  const [predictionCounts, setPredictionCounts] = useState<{yes: number, no: number} | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifs, setGifs] = useState<Gif[]>([]);
  const [mentionResults, setMentionResults] = useState<Array<{id: string, username: string}>>([]);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<{messages: any[], users: any[]}>({messages: [], users: []});

  // Subscribe to Pusher channel events
  useEffect(() => {
    if (!pusherClient) return;
    
    let channel: any;
    let mounted = true;
    
    setIsLoading(true);
    setPusherError(null);

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

    const setupChannel = async () => {
      try {
        channel = pusherClient.subscribe(channelName);
        
        // Bind to message events
        channel.bind('new-message', async (data: any) => {
          if (!mounted) return;
          
          const senderProfile = data.sender || await fetchProfile(data.sender_id);
          
          setMessages((prev) => [
            ...prev,
            {
              id: data.id || Math.random().toString(),
              content: data.content || '',
              created_at: data.created_at || new Date().toISOString(),
              sender_id: data.sender_id || 'guest',
              sender: senderProfile,
            }
          ]);
        });

        // Load initial message history from Supabase
        try {
          const { data: messageHistory, error } = await supabase
            .from('event_chat_messages')
            .select(`
              id,
              content,
              sender_id,
              created_at,
              media_url,
              media_type,
              mentions,
              reply_to
            `)
            .eq('event_id', eventId)
            .order('created_at', { ascending: true })
            .limit(50);

          if (!error && messageHistory && mounted) {
            const formattedMessages = await Promise.all(messageHistory.map(async (msg: any) => {
              const senderProfile = await fetchProfile(msg.sender_id);
              return {
                id: msg.id,
                content: msg.content,
                created_at: msg.created_at,
                sender_id: msg.sender_id,
                sender: senderProfile,
                media_type: msg.media_type,
                media_url: msg.media_url,
                mentions: msg.mentions,
                reply_to: msg.reply_to,
              };
            }));
            setMessages(formattedMessages);
          }
        } catch (err) {
          console.error('Error loading message history:', err);
        }

      } catch (err) {
        console.error('Pusher channel setup error:', err);
        setPusherError('Unable to connect to chat server. Please check your connection.');
      } finally {
        setIsLoading(false);
      }
    };

    setupChannel();

    return () => {
      mounted = false;
      if (channel) {
        pusherClient.unsubscribe(channelName);
      }
    };
  }, [pusherClient, channelName, eventId]);

  // Send message function
  const sendPusherMessage = async (content: string) => {
    if (!currentUser) {
      toast.showError('You must be signed in to send messages.');
      return;
    }

    try {
      // Save message to Supabase first
      const { data: newMessage, error } = await supabase
        .from('event_chat_messages')
        .insert([{
          event_id: eventId,
          sender_id: currentUser.id,
          content: content,
          created_at: new Date().toISOString()
        }])
        .select(`
          id,
          content,
          sender_id,
          created_at,
          media_url,
          media_type
        `)
        .single();

      if (error) throw error;

      // Send to Pusher channel via API endpoint
      const response = await fetch('/api/pusher/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.access_token || ''}`
        },
        body: JSON.stringify({
          channel: channelName,
          event: 'new-message',
          data: {
            ...newMessage,
            sender: {
              name: currentUser.user_metadata?.name || currentUser.user_metadata?.username || 'Guest',
              username: currentUser.user_metadata?.username || 'guest',
              avatar_url: currentUser.user_metadata?.avatar_url || '',
              isVerified: !!currentUser.user_metadata?.is_verified,
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message via Pusher');
      }

    } catch (err: any) {
      console.error('Failed to send Pusher message:', err);
      setPusherError('Unable to send message. Please try again.');
      toast.showError('Failed to send message.');
    }
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
  };

  // Handle GIF selection
  const handleGifSelection = async (gifUrl: string) => {
    try {
      await sendPusherMessage('');
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
    const inputField = document.querySelector('input[type="text"]') as HTMLInputElement;
    if (inputField) {
      inputField.focus();
    }
  };

  const fetchUserPoints = async (userId: string) => {
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

  // Share event
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
      const { data: messages, error: messageError } = await supabase
        .from('event_chat_messages')
        .select('*')
        .ilike('content', `%${searchInput}%`)
        .eq('event_id', eventId);
      if (messageError) throw messageError;
      
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

  if (loadingEvent || !event) {
    return (
      <div className="flex flex-col h-screen bg-white items-center justify-center p-6">
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

      {/* Pusher connection state indicator */}
      <div className="w-full flex items-center justify-center bg-gray-50 border-b border-gray-200 text-xs text-gray-600 py-1">
        <span className={
          pusherConnectionState === 'connected' ? 'text-green-600' :
          pusherConnectionState === 'connecting' ? 'text-yellow-600' :
          pusherConnectionState === 'disconnected' || pusherConnectionState === 'unavailable' || pusherConnectionState === 'failed' ? 'text-red-600' : 'text-gray-600'
        }>
          Pusher connection: {pusherConnectionState}
        </span>
      </div>

      {/* Compact event banner below header */}
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

      {/* Pusher connection error banner */}
      {pusherError && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-2 text-center text-sm">
          {pusherError}
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
                await sendPusherMessage(message.trim());
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

export default NewEventChat;
