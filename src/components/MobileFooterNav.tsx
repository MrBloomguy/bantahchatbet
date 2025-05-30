import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useMessageNotifications } from '../hooks/useMessageNotifications';

const MobileFooterNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  // Don't render on admin pages
  if (isAdminPage) return null;
  const currentPath = location.pathname;
  const { currentUser } = useAuth();
  const [eventCount, setEventCount] = useState(0);
  const [challengeCount, setChallengeCount] = useState(0);
  const { unreadMessages, pendingFriendRequests } = useMessageNotifications();

  // Calculate total message notifications
  const totalMessageNotifications = unreadMessages + pendingFriendRequests;

  useEffect(() => {
    const fetchCounts = async () => {
      // Get active events count (excluding challenges)
      const { count: eventsCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .neq('type', 'challenge');

      // Get active challenges count
      const { count: challengesCount } = await supabase
        .from('challenges')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      setEventCount(eventsCount || 0);
      setChallengeCount(challengesCount || 0);
    };

    fetchCounts();

    // Set up real-time subscription for updates
    const eventsSubscription = supabase
      .channel('events-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'events'
      }, () => {
        fetchCounts();
      })
      .subscribe();

    const challengesSubscription = supabase
      .channel('challenges-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'challenges'
      }, () => {
        fetchCounts();
      })
      .subscribe();

    return () => {
      eventsSubscription.unsubscribe();
      challengesSubscription.unsubscribe();
    };
  }, []);

  // Format the notification count for display
  const formatNotificationCount = (count: number) => {
    if (count > 99) return '99+';
    return count.toString();
  };

  const navItems = [
    {
      id: 'events',
      path: '/events',
      icon: <img src="/eventssvg.svg" alt="Events Icon" className="w-7 h-7" />,
      label: 'Events',
      badge: eventCount > 0 ? formatNotificationCount(eventCount) : undefined,
    },
    {
      id: 'games',
      path: '/games',
      icon: <img src="/gamessvg.svg" alt="Games Icon" className="w-8 h-8" />,
      label: 'Challenge',
      badge: challengeCount > 0 ? formatNotificationCount(challengeCount) : undefined,
    },

    {
      id: 'create',
      path: '/create',
      icon: <img src="/create.png" alt="Create Icon" className="w-10 h-10" />,
      label: '',
      isMain: true,
    },
    {
      id: 'myevents',
      path: '/myevents',
      icon: <img src="/listsvg.svg" alt="My Events Icon" className="w-8 h-8" />,
      label: 'History',
    },
    {
      id: 'profile',
      path: '/profile',
      icon: currentUser?.avatar_url ? (
        <img
          src={currentUser.avatar_url}
          alt="Profile"
          className={`w-8 h-8 rounded-full object-cover border-2 ${currentPath === '/profile' ? 'border-[#CCFF00]' : 'border-transparent'}`}
        />
      ) : (
        <img src="/avatar.svg" alt="Profile Icon" className="w-8 h-8" />
      ),
      label: 'Profile',
      badge: totalMessageNotifications > 0 ? formatNotificationCount(totalMessageNotifications) : undefined,
    },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-light-bg safe-bottom h-[60px]">
      <div className="flex items-center justify-around px-1 h-full">
        {navItems.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-between h-full pt-2 pb-1"
            >
              <div className="relative">
                {item.badge && (
                  <span className="absolute -top-1 -right-2 bg-[#FF2E2EFF] text-white text-[10px] font-medium rounded-md px-1 py-0.5 min-w-[15px] h-[15px] flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
                <div
                  className={`${
                    isActive ? 'text-[#7440ff] font-semibold bg-[#7440ff]/10 rounded-lg p-1' : 'text-black/80'
                  }`}
                >
                  {item.icon}
                </div>
              </div>
              <span
                className={`text-xs mt-1 font-poppins font-light ${isActive ? 'text-[#7440ff] font-semibold' : 'text-black/80'}`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileFooterNav;
