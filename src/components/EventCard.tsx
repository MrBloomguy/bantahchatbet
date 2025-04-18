import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import JoinRequestModal from './JoinRequestModal';

const DEFAULT_BANNER = 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&auto=format&fit=crop';

interface Creator {
  id: string;
  name: string;
  avatar_url: string;
  avatar?: string;
  username?: string;
  stats: any;
}

interface Event {
  id: string;
  title: string;
  banner_url?: string;
  status?: string;
  start_time: string;
  end_time: string;
  is_private?: boolean;
  creator: Creator;
  pool?: {
    total_amount?: number;
  };
  participants?: Array<{ avatar?: string }>;
  current_participants?: number;
  max_participants: number;
  category: string;
}

interface EventCardProps {
  event: Event;
  onChatClick: (event: Event) => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onChatClick }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [showJoinModal, setShowJoinModal] = useState(false);

  const getEventStatus = () => {
    const now = new Date();
    const startTime = new Date(event.start_time);
    const endTime = new Date(event.end_time);

    if (event.status === 'CANCELLED') {
      return {
        label: '',
        bg: 'bg-red-500',
        dot: 'bg-red',
        text: 'text-white',
        animate: false,
      };
    }

    if (now < startTime) {
      return {
        label: '',
        bg: 'bg-[#CCFF00]',
        dot: 'bg-[#CCFF00]',
        text: 'text-white',
        animate: true,
      };
    }

    if (now >= startTime && now <= endTime) {
      return {
        label: '',
        bg: 'bg-[#CCFF00]',
        dot: 'bg-red-500',
        text: 'text-black',
        animate: true,
      };
    }

    return {
      label: 'ENDED',
      bg: 'bg-gray-500',
      dot: 'bg-red-500',
      text: 'text-white',
      animate: false,
    };
  };

  const handleJoinClick = () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (event.is_private) {
      setShowJoinModal(true);
    } else {
      handleChatClick();
    }
  };

  const handleChatClick = () => {
    if (currentUser) {
      navigate(`/event/${event.id}/chat`);
    } else {
      navigate('/login');
    }
  };

  const handleJoinRequestSubmit = () => {
    setShowJoinModal(false);
    // In a real application, you would handle the join request submission here
    // Upon successful request (or immediate join for non-private events),
    // you would navigate to the chat page.
    navigate(`/event/${event.id}/chat`);
  };

  return (
    <>
      <div className="bg-black rounded-3xl overflow-hidden relative">
        <div className="relative w-full aspect-video">
          <img
            src={event.banner_url || DEFAULT_BANNER}
            alt={event.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = DEFAULT_BANNER;
            }}
          />

          {/* Single header row with creator info, title, and status */}
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent pt-2 pb-1.5">
            <div className="px-3 grid grid-cols-[auto_1fr_auto] items-center w-full gap-2">
              {/* Creator info - Left side */}
              <div className="flex items-center flex-shrink-0">
                <div className="overflow-hidden rounded-full h-5 w-5 border border-white/50 flex-shrink-0">
                  <img
                    src={
                      event.creator.avatar_url
                        || event.creator.avatar
                        || `https://api.dicebear.com/7.x/avataaars/svg?seed=${event.creator.username || event.creator.id || 'user'}`
                    }
                    alt={event.creator.username}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-white/90 text-xs ml-1.5">
                  {event.creator.username || "mikki24"}
                </span>
              </div>

              {/* Centered title */}
              <h2 className="text-white text-lg font-bold leading-tight text-center mx-auto truncate px-2">
                {event.title}
              </h2>

              {/* Status icon - Right side */}
              <div className="flex-shrink-0">
                {event.status !== 'HIDDEN' && (
                  <div className={`${getEventStatus().bg} w-2.5 h-2.5 rounded-full shadow-sm relative`}>
                    {getEventStatus().animate && (
                      <div className={`absolute inset-0 ${getEventStatus().dot} rounded-full animate-ping opacity-75`} />
                    )}
                    <div className={`absolute inset-0 ${getEventStatus().dot} rounded-full`} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom section with adjusted padding and alignment */}
        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
          {/* Event Pool section */}
          <div className="flex flex-col justify-end">
            <span className="text-white text-xl font-bold">Event Pool</span>
            <div className="flex items-center gap-2 mt-1">
              <div className="bg-white rounded-full px-2 py-1">
                <span className="text-black font-bold text-sm">
                  ₦{event.pool?.total_amount?.toLocaleString() || '0'}
                </span>
              </div>
              <div className="flex items-center">
                <div className="overflow-hidden rounded-full h-5 w-5 border-2 border-orange-500 flex items-center justify-center">
                  <img
                    src={event.participants?.[0]?.avatar || event.creator.avatar || "/default-avatar.png"}
                    alt="Participant"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="bg-white rounded-full ml-[-0.75rem] px-2 py-1 text-black font-bold text-xs">
                  +{(Array.isArray(event.participants) ? event.participants.length : event.current_participants) || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Join Button */}
          <button
            onClick={handleJoinClick}
            disabled={['CANCELLED', 'ENDED'].includes(event.status || getEventStatus().label)}
            className={`${
              ['CANCELLED', 'ENDED'].includes(event.status || getEventStatus().label)
                ? 'bg-gray-500 cursor-not-allowed text-white'
                : 'btn-primary'
            } h-10 flex items-center justify-center gap-1`}
          >
            {event.is_private && <Lock className="h-4 w-4" />}
            {['CANCELLED', 'ENDED'].includes(event.status || getEventStatus().label) ? 'Closed' : 'Join'}
          </button>
        </div>
      </div>

      <JoinRequestModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onSubmit={handleJoinRequestSubmit}
        eventTitle={event.title}
        wagerAmount={event.pool?.total_amount || 0}
        creator={{
          id: event.creator.id || '',
          name: event.creator.name || '',
          avatar_url: event.creator.avatar_url || event.creator.avatar || '',
          stats: event.creator.stats || {},
          username: event.creator.username || ''
        }}
        eventDetails={{
          category: event.category || '',
          startTime: event.start_time,
          maxParticipants: event.max_participants || 0,
          currentParticipants: event.current_participants || 0
        }}
      />
    </>
  );
};

export default EventCard;