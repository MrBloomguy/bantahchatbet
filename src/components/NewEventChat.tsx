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

export interface NewEventChatProps {
  eventId: string;
  eventName: string;
  eventCreatorUsername: string;
  eventPoolAmount: number;
  eventStartTime: string;
  eventEndTime: string;
  numberOfMembers: number;
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

const CompactBanner: React.FC<{ eventPoolAmount: number; countdown: string }> = ({
  eventPoolAmount,
  countdown,
}) => (
  <div className="bg-gray-100 border-b border-gray-200 py-2 px-4 shadow-sm">
    <p className="text-sm text-gray-600">
      <span className="font-semibold">Event Pool:</span> ₦ {(eventPoolAmount / 1000).toFixed(1)}K
      <span className="ml-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="inline-block h-4 w-4 mr-1 align-text-top text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {countdown}
      </span>
    </p>
  </div>
);

const PointsBadge: React.FC<{ points: number }> = ({ points }) => (
  <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
    <Trophy className="w-3 h-3" />
    <span>{points}</span>
  </div>
);

const NewEventChat: React.FC<NewEventChatProps> = ({
  eventId,
  eventName,
  eventCreatorUsername,
  eventPoolAmount,
  eventEndTime,
  numberOfMembers,
  onBack,
}) => {
  const { getProfile } = useProfile();
  const { currentUser } = useAuth();
  const toast = useToast();
  const { messages, sendMessage, isLoading } = useEventChat(eventId);

  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedProfile, setSelectedProfile] = useState<ChatMessage['sender'] | null>(null);
  const [countdown, setCountdown] = useState('');
  const [creatorAvatar, setCreatorAvatar] = useState<string | null>(null);
  const [userPoints, setUserPoints] = useState<{ [key: string]: number }>({});
  const isCurrentUserAdmin = currentUser?.username === eventCreatorUsername;

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
    const fetchCreatorProfile = async () => {
      const profile = await getProfile(eventCreatorUsername);
      if (profile) {
        setCreatorAvatar(profile.avatar_url);
      }
    };
    fetchCreatorProfile();
  }, [eventCreatorUsername, getProfile]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const updateCountdown = () => {
      try {
        const endTime = new Date(eventEndTime);
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
      } catch (error) {
        console.error('Error parsing event end time:', error);
        setCountdown('Error');
      }
    };

    updateCountdown();
    const intervalId = setInterval(updateCountdown, 1000);

    return () => clearInterval(intervalId);
  }, [eventEndTime]);

  useEffect(() => {
    messages.forEach((msg) => {
      if (msg.sender_id) {
        fetchUserPoints(msg.sender_id);
      }
    });
  }, [messages]);

  // Cast currentUser to include additional properties
  const userProfile = currentUser as CurrentUser;

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Top Bar */}
      <div className="bg-gray-50 border-b border-gray-200 p-3 flex items-center shadow-sm">
        <button onClick={onBack} className="mr-4 text-gray-600 hover:text-purple-700">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center flex-1 min-w-0">
          <UserAvatar
            url={creatorAvatar || '/bantahlogo.png'}
            size="sm"
            username={eventCreatorUsername}
          />
          <div className="flex-1 min-w-0">
            <h6 className="font-semibold text-gray-800 truncate">{eventName}</h6>
            <p className="text-sm text-gray-500 truncate">{numberOfMembers} Members</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 ml-2">
          <button className="bg-green-500 text-white rounded-md px-2 py-1 text-sm font-semibold hover:bg-green-600">
            YES
          </button>
          <button className="bg-red-500 text-white rounded-md px-2 py-1 text-sm font-semibold hover:bg-red-600">
            NO
          </button>
        </div>
      </div>

      {/* Compact Banner */}
      <CompactBanner eventPoolAmount={eventPoolAmount} countdown={countdown} />

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
            const messageAlignment = isCurrentUserSender ? 'justify-end' : 'justify-start';
            const messageBubbleStyle = isCurrentUserSender
              ? 'bg-purple-100 text-gray-800 rounded-lg rounded-br-none py-2 px-3'
              : 'bg-gray-100 text-gray-800 rounded-lg rounded-bl-none py-2 px-3';

            return (
              <div
                key={msg.id}
                className={`flex ${messageAlignment} items-start`}
              >
                {!isCurrentUserSender && msg.sender && (
                  <div className="mr-2 cursor-pointer" onClick={() => openProfileCard(msg.sender!)}>
                    <UserAvatar 
                      url={msg.sender.avatar_url} 
                      size="sm"
                      username={msg.sender.username || msg.sender.name} 
                    />
                  </div>
                )}
                <div className="max-w-xs">
                  <div className={messageBubbleStyle}>
                    {(!isCurrentUserSender && msg.sender) && (
                      <div className="flex items-center gap-2 text-sm mb-1">
                        <span className="font-semibold text-gray-700">@{msg.sender.username || msg.sender.name}</span>
                        {userPoints[msg.sender_id] !== undefined && (
                          <UserLevelBadge points={userPoints[msg.sender_id]} size="sm" showLabel={false} />
                        )}
                      </div>
                    )}
                    <p className="text-sm break-words">{msg.content}</p>
                    <p className="text-xs text-gray-500 mt-1 text-right">
                      {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                {isCurrentUserSender && currentUser && (
                  <div className="ml-2">
                    <UserAvatar 
                      url={userProfile?.avatar_url || '/avatar.svg'} 
                      size="sm"
                      username={userProfile?.name || userProfile?.username || currentUser.id} 
                    />
                  </div>
                )}
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
            placeholder={`Message #${eventName}`}
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