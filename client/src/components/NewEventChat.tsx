import React, { useState, useEffect, useRef } from 'react';
import { Send, X, ArrowLeft } from 'lucide-react';
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
      if (!senderId) {
        return {
          name: 'Unknown User',
          username: 'unknown',
          avatar_url: '/default-avatar.png',
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
            name: data?.name || 'Unknown User',
            username: data?.username || 'unknown',
            avatar_url: '/default-avatar.png',
            isVerified: false,
          };
        }
        return {
          name: data.name || data.username || 'Unknown User',
          username: data.username || 'unknown',
          avatar_url: data.avatar_url || '/default-avatar.png',
          isVerified: !!data.is_verified,
        };
      } catch {
        return {
          name: 'Unknown User',
          username: 'unknown',
          avatar_url: '/default-avatar.png',
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
              sender_id: data.sender_id,
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
              let senderProfile;
              try {
                senderProfile = await fetchProfile(msg.sender_id);
              } catch (error) {
                console.log('Could not fetch profile for', msg.sender_id);
                senderProfile = {
                  name: 'User',
                  username: 'user',
                  avatar_url: '/default-avatar.png',
                  isVerified: false,
                };
              }
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
      console.log('Sending message to channel:', channelName);
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
              name: currentUser.name || currentUser.username || 'User',
              username: currentUser.username || 'user',
              avatar_url: currentUser.avatar_url || '/default-avatar.png',
              isVerified: !!currentUser.is_verified,
            }
          }
        })
      });

      if (!response.ok) {
        console.error('Pusher message failed:', await response.text());
        throw new Error('Failed to send message via Pusher');
      }

      console.log('Message sent successfully via Pusher');

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

  // Helper function to get countdown
  const getCountdown = () => {
    if (!event?.end_time) return '';
    const endTime = new Date(event.end_time);
    const now = new Date();
    
    if (!isNaN(endTime.getTime())) {
      if (endTime > now) {
        const diff = endTime.getTime() - now.getTime();
        const hours = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, '0');
        const minutes = String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
        const seconds = String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, '0');
        return `${hours}h ${minutes}m ${seconds}s`;
      } else {
        return 'Event ended';
      }
    } else {
      return 'Invalid end time';
    }
  };

  // Utility to format numbers as 50k/1.2M
  const formatShortNumber = (num: number): string => {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(num % 1_000_000 === 0 ? 0 : 1) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(num % 1_000 === 0 ? 0 : 1) + 'k';
    return num.toString();
  };

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
      {/* Fixed Header */}
      <div className="flex-shrink-0">
        {/* Top Bar */}
        <div className="bg-gray-50 border-b border-gray-200 p-3 flex items-center shadow-sm">
          <button onClick={onBack} className="mr-4 text-gray-600 hover:text-purple-700">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center flex-1 min-w-0 gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {event?.creator?.avatar_url ? (
                <img src={event.creator.avatar_url} alt={event.creator.username || ''} className="w-full h-full object-cover" />
              ) : (
                <img src="/bantahlogo.png" alt="" className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h6 className="font-semibold text-gray-800 flex items-center gap-2">
                <span className="truncate max-w-[200px]">{event?.title}</span>
                <span className="text-xs text-gray-400 font-normal flex items-center gap-1 flex-shrink-0">
                  {event?.creator?.username ? `by @${event.creator.username}` : ''}
                </span>
                <span className="ml-1 align-middle inline-flex items-center" title="Verified">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 inline-block" fill="#7440ff">
                    <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.085 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.165.865.25 1.336.25 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.437.695.21 1.04z" />
                  </svg>
                </span>
              </h6>
            </div>
          </div>
          {/* Menu Dropdown */}
          <div className="relative ml-2">
            <button
              onClick={() => setShowMenuDropdown(!showMenuDropdown)}
              className="p-2 rounded-full hover:bg-gray-200 transition-colors"
              aria-label="Menu"
            >
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="19.5" cy="12" r="1.5" />
                <circle cx="4.5" cy="12" r="1.5" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showMenuDropdown && (
              <div id="event-chat-menu-dropdown" className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <button
                  onClick={() => {
                    setShowMenuDropdown(false);
                    // Add search functionality here
                  }}
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  Search
                </button>
                <button
                  onClick={() => {
                    setShowMenuDropdown(false);
                    setBannerOpen(!bannerOpen);
                  }}
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  {bannerOpen ? 'Hide Banner' : 'Show Banner'}
                </button>
                <button
                  onClick={() => {
                    setShowMenuDropdown(false);
                    // Add group info functionality here
                  }}
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  View Group Info
                </button>
                <button
                  onClick={() => {
                    setShowMenuDropdown(false);
                    handleShareEvent();
                  }}
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  Share
                </button>
                <button
                  onClick={() => {
                    setShowMenuDropdown(false);
                    // Add report functionality here
                  }}
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  Report
                </button>
              </div>
            )}
          </div>
        </div>

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

        {/* Compact Banner with Drawer */}
        <div className="relative mx-3">
          <div
            className={`transition-all duration-300 ${bannerOpen ? 'max-h-[80px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'} overflow-hidden`}
          >
            <div
              className="relative border-b border-gray-200 py-2 px-4 shadow-sm flex items-center justify-between min-h-[64px] rounded-xl overflow-hidden"
              style={{
                backgroundImage: event?.banner_url ? `url(${event.banner_url})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            >
              <div className="absolute inset-0 bg-gray-900/60 pointer-events-none" />
              <div className="relative flex items-center gap-6 text-sm text-white z-10">
                <span className="flex items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="inline-block h-3 w-3 mr-1 align-text-top text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs">{getCountdown()}</span>
                </span>
                <span className="flex items-center gap-1">
                  <img src="/avatar-count.svg" alt="Members" className="w-4 h-4" />
                  <span className="text-xs">{event?.participant_count || 0}</span>
                </span>
                <span className="flex items-center gap-1">
                  <img src="/bet_icon.png" alt="Pool" className="w-4 h-4" />
                  <span className="text-xs">₦{event?.pool_total_amount?.toLocaleString() || 0}</span>
                </span>
              </div>
              <div className="relative flex items-center gap-2 z-10">
                <button
                  onClick={() => handlePrediction(true)}
                  disabled={isProcessing || prediction !== null || getCountdown() === 'Event ended'}
                  className={`relative px-3 py-1.5 text-base font-semibold rounded-md transition-colors ${
                    prediction === true
                      ? 'bg-green-700 text-white cursor-not-allowed'
                      : prediction !== null
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  YES
                  {predictionCounts && predictionCounts.yes > 0 && (
                    <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-white text-green-700 text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow">
                      {predictionCounts.yes}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => handlePrediction(false)}
                  disabled={isProcessing || prediction !== null || getCountdown() === 'Event ended'}
                  className={`relative px-3 py-1.5 text-base font-semibold rounded-md transition-colors ${
                    prediction === false
                      ? 'bg-red-700 text-white cursor-not-allowed'
                      : prediction !== null
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                >
                  NO
                  {predictionCounts && predictionCounts.no > 0 && (
                    <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-white text-red-700 text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow">
                      {predictionCounts.no}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
          {/* Drawer Button - far left, aligned with header bottom */}
          <div className="absolute -left-4 top-0 z-20">
            <button
              onClick={() => setBannerOpen((prev) => !prev)}
              className="bg-white shadow p-1 border border-gray-200 hover:bg-gray-100 transition-all rounded"
              aria-label="Toggle Banner Drawer"
              style={{ borderRadius: '4px' }}
            >
              <svg className={`w-6 h-6 text-gray-500 transition-transform ${bannerOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

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