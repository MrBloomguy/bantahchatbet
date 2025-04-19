import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Smile, Loader, Trophy, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import UserAvatar from './UserAvatar';
import UserLevelBadge from './UserLevelBadge';
import { useEventChat } from '../hooks/useEventChat';
import { formatDistanceToNow } from 'date-fns';
import ProfileCard from './ProfileCard';
import { useProfile } from '../hooks/useProfile';
import { supabase } from '../lib/supabase';
import ChatBubble from './ChatBubble';

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
}

interface UserProfile {
  id: string;
  username?: string;
  name?: string;
  avatar_url?: string;
}

interface CurrentUser extends UserProfile {
  name?: string;
  username?: string;
  avatar_url?: string;
}

const PointsBadge: React.FC<{ points: number }> = ({ points }) => (
  <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
    <Trophy className="w-3 h-3" />
    <span>{points}</span>
  </div>
);

const NewEventChat: React.FC<NewEventChatProps> = ({
  eventId,
  onBack,
}) => {
  const { getProfile } = useProfile();
  const { currentUser } = useAuth();
  const toast = useToast();
  const { messages, sendMessage, isLoading } = useEventChat(eventId);

  const [event, setEvent] = useState<any>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedProfile, setSelectedProfile] = useState<ChatMessage['sender'] | null>(null);
  const [countdown, setCountdown] = useState('');
  const [userPoints, setUserPoints] = useState<{ [key: string]: number }>({});
  const [bannerOpen, setBannerOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && currentUser) {
      const success = await sendMessage(message.trim());
      if (!success) {
        toast.showError('Failed to send message');
      }
      setMessage('');
    }
  };

  const openProfileCard = (sender: ChatMessage['sender']) => {
    setSelectedProfile(sender);
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

  useEffect(() => {
    const fetchEvent = async () => {
      setLoadingEvent(true);
      const { data, error } = await supabase
        .from('events')
        .select(`*, creator:creator_id(*), pool:event_pools(*), participants:event_participants(user_id), banner_url`)
        .eq('id', eventId)
        .single();
      if (!error && data) setEvent(data);
      setLoadingEvent(false);
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

  const userProfile = currentUser as CurrentUser;

  if (loadingEvent || !event) {
    return (
      <div className="flex flex-col h-screen bg-white items-center justify-center">
        <Loader className="animate-spin text-purple-500" size={32} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Top Bar */}
      <div className="bg-gray-50 border-b border-gray-200 p-3 flex items-center shadow-sm">
        <button onClick={onBack} className="mr-4 text-gray-600 hover:text-purple-700">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center flex-1 min-w-0 gap-3">
          <UserAvatar
            url={event.creator?.avatar_url || '/bantahlogo.png'}
            size="sm"
            username={event.creator?.username || ''}
          />
          <div className="flex-1 min-w-0">
            <h6 className="font-semibold text-gray-800 truncate flex items-center gap-2">
              {event.title}
              <span className="text-xs text-gray-400 font-normal flex items-center gap-1">
                by @{event.creator?.username}
                <UserLevelBadge points={userPoints[event.creator?.id] ?? 0} size="sm" showLabel={false} />
                <span className="ml-1 align-middle inline-flex items-center" title="Verified">
                  <svg viewBox="0 0 24 24" aria-label="Verified" className="w-4 h-4 text-blue-500" fill="currentColor">
                    <g>
                      <path d="M22.5 12.87c0-.6-.33-1.15-.85-1.42l-1.7-.98.3-1.89c.09-.6-.14-1.22-.6-1.6-.46-.38-1.1-.47-1.64-.23l-1.7.98-1.7-.98c-.54-.24-1.18-.15-1.64.23-.46.38-.69 1-.6 1.6l.3 1.89-1.7.98c-.52.27-.85.82-.85 1.42s.33 1.15.85 1.42l1.7.98-.3 1.89c-.09.6.14 1.22.6 1.6.46.38 1.1.47 1.64.23l1.7-.98 1.7.98c.54.24 1.18.15 1.64-.23.46-.38.69-1 .6-1.6l-.3-1.89 1.7-.98c.52-.27.85-.82.85-1.42z"></path>
                      <path d="M10.59 14.58l-2.09-2.09a.75.75 0 111.06-1.06l1.56 1.56 3.56-3.56a.75.75 0 111.06 1.06l-4.09 4.09a.75.75 0 01-1.06 0z" fill="#fff"></path>
                    </g>
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
      <div className="relative mx-3" style={{ marginTop: 0 }}>
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
                <span className="text-xs">{event?.participants?.length || 0}</span>
              </span>
              <span className="flex items-center gap-1">
                <img src="/bet_icon.png" alt="Pool" className="w-4 h-4" />
                <span className="text-xs">₦{event.pool?.total_amount?.toLocaleString() || 0}</span>
              </span>
            </div>
            <div className="relative flex items-center gap-2 z-10">
              <button className="bg-green-500 text-white rounded-md px-3 py-1 text-sm font-semibold hover:bg-green-600">
                YES
              </button>
              <button className="bg-red-500 text-white rounded-md px-3 py-1 text-sm font-semibold hover:bg-red-600">
                NO
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

      {/* Chat Messages Area */}
      <div className="flex-grow overflow-y-auto p-4 space-y-3">
        {isLoading && (
          <div className="flex justify-center items-center py-10">
            <Loader className="animate-spin text-purple-500" size={32} />
          </div>
        )}
        {!isLoading &&
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
                  points={userPoints[msg.sender_id]}
                />
              </div>
            );
          })}
        <div ref={messagesEndRef} />
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

      {/* Input Area */}
      <div className="bg-gray-50 border-t border-gray-200 p-3 flex items-center space-x-3">
        <button className="text-gray-500 hover:text-purple-700">
          <Smile size={24} />
        </button>
        <form onSubmit={handleSubmit} className="flex-grow flex items-center">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Message #${event.title}`}
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
      </div>
    </div>
  );
};

export default NewEventChat;