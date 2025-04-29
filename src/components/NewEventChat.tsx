import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Smile, Loader, X } from 'lucide-react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useEventParticipation } from '../hooks/useEventParticipation';
import { useEventPool } from '../hooks/useEventPool';
import UserAvatar from './UserAvatar';
import UserLevelBadge from './UserLevelBadge';
import { useEventChat } from '../hooks/useEventChat';
import ProfileCard from './ProfileCard';
import { supabase } from '../lib/supabase';
import ChatBubble from './ChatBubble';

interface Gif {
  id: string;
  title: string;
  images: {
    fixed_height_small: {
      url: string;
    };
  };
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

const NewEventChat: React.FC<NewEventChatProps> = ({
  eventId,
  onBack,
}) => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const { messages, sendMessage, isLoading } = useEventChat(eventId);
  const { joinEvent, getUserPrediction, getPredictionCounts } = useEventParticipation();
  const { updatePoolAmount } = useEventPool();

  const [event, setEvent] = useState<Event | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [message, setMessage] = useState('');
  const [prediction, setPrediction] = useState<boolean | null>(null);
  const [predictionCounts, setPredictionCounts] = useState({
    yes_count: 0,
    no_count: 0,
    total_participants: 0
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedProfile, setSelectedProfile] = useState<ChatMessage['sender'] | null>(null);
  const [countdown, setCountdown] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionResults, setMentionResults] = useState<Array<{id: string, username: string}>>([]);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [userPoints, setUserPoints] = useState<{ [key: string]: number }>({});
  const [bannerOpen, setBannerOpen] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifs, setGifs] = useState<Gif[]>([]);

  // Add handleMention function
  const handleMention = async (input: string) => {
    const mentionMatch = input.match(/@(\w*)$/);
    if (mentionMatch) {
      const query = mentionMatch[1];
      setMentionQuery(query);
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

  // Handle message input changes
  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setMessage(newValue);
    handleMention(newValue);
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

  // Modified handleSubmit to include mentions and replies
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && currentUser) {
      // Extract mentions from message
      const mentionRegex = /@(\w+)/g;
      const mentions = [];
      let match;
      while ((match = mentionRegex.exec(message)) !== null) {
        const username = match[1];
        const { data } = await supabase
          .from('users')
          .select('id, username')
          .eq('username', username)
          .single();
        
        if (data) {
          mentions.push({ id: data.id, username: data.username });
        }
      }

      // Send the message with the structured content
      const success = await sendMessage(message.trim(), undefined, {
        mentions,
        reply_to: replyingTo ? {
          id: replyingTo.id,
          content: replyingTo.content,
          sender_username: replyingTo.sender?.username
        } : undefined
      });

      if (!success) {
        toast.showError('Failed to send message');
      } else {
        setMessage('');
        setReplyingTo(null);
      }
    }
  };

  const fetchUserPoints = async (userId: string) => {
    if (userPoints[userId]) return;

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

  const fetchGifs = async (searchTerm: string) => {
    try {
      const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY;
      if (!GIPHY_API_KEY) {
        throw new Error('GIPHY API key not configured');
      }

      const response = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(
          searchTerm
        )}&limit=9&rating=g`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setGifs(data.data);
    } catch (error) {
      console.error('Error fetching GIFs:', error);
      toast.showError('Failed to load GIFs. ' + (error instanceof Error ? error.message : 'Unknown error'));
      setGifs([]);
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
            creator:users!creator_id (
              id,
              username,
              avatar_url
            ),
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
          const formattedEvent: Event = {
            id: data.id,
            title: data.title,
            creator: {
              id: data.creator?.id || '',
              username: data.creator?.username || '',
              avatar_url: data.creator?.avatar_url
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
    if (!event?.end_time) return;

    const updateCountdown = () => {
      const endTime = new Date(event.end_time);
      const now = new Date();

      if (!isNaN(endTime.getTime())) {
        if (endTime > now) {
          const diff = endTime.getTime() - now.getTime();
          const hours = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, '0');
          const minutes = String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
          const seconds = String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, '0');
          setCountdown(`${hours}h ${minutes}m ${seconds}s`);
        } else {
          setCountdown('Event ended');
        }
      } else {
        setCountdown('Invalid end time');
      }
    };

    updateCountdown();
    const intervalId = setInterval(updateCountdown, 1000);
    return () => clearInterval(intervalId);
  }, [event?.end_time]);

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

  if (loadingEvent || !event) {
    return (
      <div className="flex flex-col h-screen bg-white items-center justify-center">
        <Loader className="animate-spin text-purple-500" size={32} />
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
            <UserAvatar
              src={event.creator?.avatar_url || '/bantahlogo.png'}
alt={event.creator?.username || ''}
              size="sm"
                        />
            <div className="flex-1 min-w-0">
              <h6 className="font-semibold text-gray-800 flex items-center gap-2">
<span className="truncate max-w-[200px]">              {event.title}</span>
                <span className="text-xs text-gray-400 font-normal flex items-center gap-1 flex-shrink-0">
                  by @{event.creator?.username}
                  <UserLevelBadge points={userPoints[event.creator?.id] ?? 0} size="xs" showLabel={false} />
                  <span className="ml-1 align-middle inline-flex items-center" title="Verified">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 inline-block" fill="#7440ff">
                    <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.085 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.165.865.25 1.336.25 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.437.695.21 1.04z" />
                  </svg>
                  </span>
                </span>
              </h6>
            </div>
          </div>
          {/* Menu Dropdown */}
          <div className="relative ml-2">
            <button className="p-2 rounded-full hover:bg-gray-200 transition-colors" aria-label="Menu">
              <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="1.5"/><circle cx="19.5" cy="12" r="1.5"/><circle cx="4.5" cy="12" r="1.5"/></svg>
            </button>
          </div>
        </div>

        {/* Compact Banner with Drawer */}
        <div className="relative mx-3">
          <div
            className={`transition-all duration-300 ${bannerOpen ? 'max-h-[80px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'} overflow-hidden`}
          >
            <div
              className="relative border-b border-gray-200 py-2 px-4 shadow-sm flex items-center justify-between min-h-[64px] rounded-xl overflow-hidden"
              style={{
                backgroundImage: event.banner_url ? `url(${event.banner_url})` : undefined,
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
                  <span className="text-xs">{countdown}</span>
                </span>
                <span className="flex items-center gap-1">
                  <img src="/avatar-count.svg" alt="Members" className="w-4 h-4" />
                  <span className="text-xs">{event?.participant_count || 0}</span>
                </span>
                <span className="flex items-center gap-1">
                  <img src="/bet_icon.png" alt="Pool" className="w-4 h-4" />
                  <span className="text-xs">₦{event.pool_total_amount?.toLocaleString() || 0}</span>
                </span>
              </div>
              <div className="relative flex items-center gap-2 z-10">
                <button
                  onClick={() => handlePrediction(true)}
                  disabled={isProcessing || prediction !== null || countdown === 'Event ended'}
                  className={`px-3 py-1.5 text-base font-semibold rounded-md transition-colors ${
                    prediction === true
                      ? 'bg-green-700 text-white cursor-not-allowed'
                      : prediction !== null
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  YES {predictionCounts.yes_count > 0 && `(${predictionCounts.yes_count})`}
                </button>
                <button
                  onClick={() => handlePrediction(false)}
                  disabled={isProcessing || prediction !== null || countdown === 'Event ended'}
                  className={`px-3 py-1.5 text-base font-semibold rounded-md transition-colors ${
                    prediction === false
                      ? 'bg-red-700 text-white cursor-not-allowed'
                      : prediction !== null
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                >
                  NO {predictionCounts.no_count > 0 && `(${predictionCounts.no_count})`}
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
                    mediaType={msg.media_type}
                    mediaUrl={msg.media_url}
                    onReply={() => handleReply(msg)}
                    replyTo={msg.reply_to}
                    mentions={msg.mentions}
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
        {replyingTo && (
          <div className="mb-2 p-2 bg-gray-100 rounded-lg flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Replying to {replyingTo.sender?.username}: {replyingTo.content}
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <input
            type="text"
            value={message}
            onChange={handleMessageChange}
            placeholder={`Message #${event?.title}`}
            className="flex-grow bg-gray-100 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
          />
          <button
            type="submit"
            className="ml-3 bg-purple-500 text-white rounded-full p-3 hover:bg-purple-600 disabled:opacity-50"
            disabled={!message.trim() || isLoading}
          >
            <Send size={20} />
          </button>
        </form>

        {/* Mentions dropdown */}
        {showMentionDropdown && mentionResults.length > 0 && (
          <div className="absolute bottom-16 left-4 bg-white rounded-lg shadow-lg border border-gray-200 max-h-48 overflow-y-auto">
            {mentionResults.map((user) => (
              <button
                key={user.id}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:outline-none"
                onClick={() => insertMention(user.username)}
              >
                @{user.username}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Profile Card Modal */}
      {selectedProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-full max-w-md">
            <button
              onClick={() => setSelectedProfile(null)}
              className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-100 text-gray-600"
            >
              <X size={20} />
            </button>
            <ProfileCard
              profile={{
                id: selectedProfile.username || '',
                name: selectedProfile.name || selectedProfile.username || '',
                username: selectedProfile.username || selectedProfile.name || '',
                avatar_url: selectedProfile.avatar_url,
                bio: '',
                followers_count: 0,
                following_count: 0,
                points: userPoints[selectedProfile.username || ''] || 0,
                is_following: false
              }}
              onClose={() => setSelectedProfile(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default NewEventChat;