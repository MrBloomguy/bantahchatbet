import React, { useState, useEffect, useRef } from 'react';
import { useEvent } from '../hooks/useEvent';
import { useToast } from '../contexts/ToastContext';
import EventCard from '../components/EventCard';
import LoadingSpinner from '../components/LoadingSpinner';
import MobileFooterNav from '../components/MobileFooterNav';
import Header from '../components/Header';
import { Gamepad2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Event {
  id: string;
  title: string;
  category: string;
  creator: {
    id: string;
    name: string;
    username: string;
    avatar_url: string;
  };
  is_private: boolean;
  creator_id: string;
  end_time: string;
  wager_amount: number;
  max_participants: number;
  current_participants: number;
  start_time: string;
  pool?: {
    total_amount: number;
  };
  participants?: any[];
}

const Events = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { events, fetchEvents } = useEvent();
  const toast = useToast();

  // Set up a refresh interval to ensure the latest data is displayed
  useEffect(() => {
    // Refresh events every 30 seconds
    const intervalId = setInterval(() => {
      fetchEvents();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [fetchEvents]);

  const handleCategoryClick = (categoryId: string) => {
    if (categoryId === 'create') {
      navigate('/create');
    } else if (categoryId === 'bantzz') {
      navigate('/bantzz');
    } else if (categoryId === 'stories') {
      navigate('/stories');
    } else {
      setSelectedCategory(categoryId);
    }
  };

  const handleChatClick = (event: any) => {
    navigate(`/chat/${event.id}`);
  };

  const categories = [
    {
      id: 'create',
      label: 'Create Event',
      gradient: 'from-[#A020F0] to-[#CCFF00]',
      bgColor: 'bg-[#1A472E]',
      icon: <img src="/create.png" alt="Create Event" className="w-12 h-12" />,
    },
    {
      id: 'bantzz',
      label: 'Bantzz',
      gradient: 'from-[#7440ff] to-[#CCFF00]',
      bgColor: 'bg-[#f8fafc]',
      icon: (
        <span className="relative flex items-center justify-center">
          <span className="bantzz-animated-ring absolute inset-0 z-0" />
          <svg width="40" height="40" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 relative z-10">
            <circle cx="18" cy="18" r="18" fill="#fff"/>
            <ellipse cx="18" cy="22" rx="8" ry="4" fill="#7440ff"/>
            <ellipse cx="13" cy="16" rx="2.5" ry="3.5" fill="#000"/>
            <ellipse cx="23" cy="16" rx="2.5" ry="1.2" fill="#000"/>
            <ellipse cx="13" cy="16" rx="1" ry="1.5" fill="#fff"/>
            <ellipse cx="23" cy="16" rx="0.7" ry="0.4" fill="#fff"/>
            <path d="M12 26 Q18 30 24 26" stroke="#000" strokeWidth="1.5" fill="none"/>
            <ellipse id="wink" cx="23" cy="16" rx="2.5" ry="1.2" fill="#000">
              <animate attributeName="ry" values="1.2;0.2;1.2" keyTimes="0;0.5;1" dur="2s" repeatCount="indefinite" />
            </ellipse>
          </svg>
        </span>
      ),
    },
    {
      id: 'stories',
      label: 'Stories',
      gradient: 'from-[#A020F0] to-[#CCFF00]',
      bgColor: 'bg-[#2A1F0E]',
      icon: <img src="/news.svg" alt="Stories" className="w-8 h-8" />,
    },
    {
      id: 'pop culture',
      label: 'Pop Culture',
      gradient: 'from-[#A020F0] to-[#CCFF00]',
      bgColor: 'bg-[#2A1F0E]',
      icon: <img src="/popcorn.svg" alt="Create Event" className="w-11 h-11" />,
    },
    {
      id: 'sports',
      label: 'Sports',
      gradient: 'from-[#A020F0] to-[#CCFF00]',
      bgColor: 'bg-[#2A1215]',
      icon: <img src="/footballicon.png" alt="Create Event" className="w-12 h-12" />,
    },
    {
      id: 'music',
      label: 'Music',
      gradient: 'from-[#A020F0] to-[#CCFF00]',
      bgColor: 'bg-[#1F1435]',
      icon: <img src="/dj setup.png" alt="Create Event" className="w-12 h-12" />,
    },
    {
      id: 'gaming',
      label: 'Gaming',
      gradient: 'from-[#A020F0] to-[#CCFF00]',
      bgColor: 'bg-[#1A472E]',
      icon: <img src="/22gamepad.svg" alt="Create Event" className="w-12 h-12" />,
    },
    {
      id: 'crypto',
      label: 'Crypto',
      gradient: 'from-[#A020F0] to-[#CCFF00]',
      bgColor: 'bg-[#FFA620FF]',
      icon: <img src="/bitcoin.svg" alt="Create Event" className="w-12 h-12" />,
    },
    {
      id: 'politics',
      label: 'Politics',
      gradient: 'from-[#A020F0] to-[#CCFF00]',
      bgColor: 'bg-light-bg',
      icon: <img src="/politics.png" alt="Create Event" className="w-9 h-10" />,
    },
  ];

  const filteredEvents = events.filter(event =>
    selectedCategory === 'all' ? true : event.category.toLowerCase() === selectedCategory
  );

  // --- Mobile scroll-based header/category animation ---
  const [headerOffset, setHeaderOffset] = useState(0);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (!isMobile) {
      setHeaderOffset(0);
      return;
    }
    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          if (currentScrollY > lastScrollY.current) {
            setHeaderOffset(-80); // Hide header/category
          } else if (currentScrollY < lastScrollY.current) {
            setHeaderOffset(0); // Show header/category
          }
          lastScrollY.current = currentScrollY;
          ticking.current = false;
        });
        ticking.current = true;
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-light-bg dark:bg-[#1a1b2e]">
      {/* Animated header + category wrapper for mobile only */}
      <div
        style={typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches ? {
          transform: `translateY(${headerOffset}px)`,
          transition: 'transform 0.25s cubic-bezier(.4,0,.2,1)',
          zIndex: 50,
          position: 'sticky',
          top: 0,
          background: 'inherit',
          pointerEvents: headerOffset === -80 ? 'none' : 'auto',
          opacity: headerOffset === -80 ? 0 : 1,
        } : {}}
      >
        <Header showSearch />
        {/* Category Bar is now inside the animated wrapper */}
        <div className="bg-light-bg z-40 py-2.5">
          <div className="container mx-auto px-4">
            <div className="flex md:justify-center overflow-x-auto [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-white/20 gap-3">
              <div className="flex gap-3 md:max-w-[800px]">
                {categories.map((category) => (
                  <button
                    type="button"
                    key={category.id}
                    onClick={() => handleCategoryClick(category.id)}
                    className="flex-shrink-0 flex flex-col items-center relative pt-1"
                  >
                    <div className="relative">
                      {/* Gradient outline container */}
                      <div
                        className={`w-16 h-16 rounded-full relative
                          ${selectedCategory === category.id ? 'opacity-100' : 'opacity-100'}
                          transition-all duration-300`}
                      >
                        {/* Gradient border */}
                        <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${category.gradient}`} />
                        {/* Inner circle with icon */}
                        <div
                          className={`absolute inset-[2px] rounded-full
                            flex items-center justify-center
                            bg-light-bg
                            ${selectedCategory === category.id ? 'scale-105' : 'scale-100'}
                            transition-all duration-300`}
                        >
                          <span className="text-2xl">{category.icon}</span>
                        </div>
                      </div>
                      {/* Category Label Badge */}
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 z-10">
                        <div
                          className={`px-2 py-0.5 rounded-full text-[8px] font-sans font-medium whitespace-nowrap
                            bg-white
                            ${selectedCategory === category.id ? 'text-black' : 'text-black/60'}
                            transition-all duration-300`}
                        >
                          {category.label}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-3">
        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
          {filteredEvents.map(event => {
            // Patch creator and participants for EventCard compatibility
            const creator = {
              id: event.creator.id,
              username: event.creator.username,
              name: (event.creator as any).name || event.creator.username || '',
              avatar_url: (event.creator as any).avatar_url || '',
              stats: (event.creator as any).stats || {},
            };
            const participants = (event.participants || []).map((p: any) => ({
              avatar: p.avatar || undefined,
            }));
            return (
              <EventCard
                key={event.id}
                event={{ ...event, creator, participants }}
                onChatClick={handleChatClick}
              />
            );
          })}
        </div>
      </div>

      <MobileFooterNav />
    </div>
  );
};

export default Events;

/* Add this to your global CSS (e.g., src/index.css or tailwind globals):
.bantzz-animated-ring {
  border-radius: 9999px;
  border: 3px solid transparent;
  background: conic-gradient(
    #ff2e2e 0deg 90deg,
    #ffb800 90deg 180deg,
    #7440ff 180deg 270deg,
    #ff2e2e 270deg 360deg
  );
  animation: bantzz-ring-spin 2s linear infinite;
  pointer-events: none;
  width: 44px;
  height: 44px;
  top: -4px;
  left: -4px;
  position: absolute;
  z-index: 0;
  opacity: 0.7;
}
@keyframes bantzz-ring-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
*/