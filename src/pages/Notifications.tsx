import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useNotification } from '../hooks/useNotification';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import PageHeader from '../components/PageHeader';
import MobileFooterNav from '../components/MobileFooterNav';
import { supabase } from '../lib/supabase';

const filters = [
  { id: 'all', label: 'All', types: [] },
  {
    id: 'events',
    label: 'Events',
    types: [
      'event_win',
      'event_loss',
      'new_event',
      'event_update',
      'event_created',
      'event_participation',
      'event_joined',
      'event_milestone',
      'event_deleted_by_admin'
    ]
  },
  {
    id: 'challenges',
    label: 'Challenges',
    types: [
      'challenge_received',
      'challenge_accepted',
      'challenge_declined',
      'challenge_completed',
      'challenge_winner',
      'challenge_loser',
      'challenge_expired'
    ]
  },
  {
    id: 'messages',
    label: 'Messages',
    types: ['direct_message', 'group_message', 'group_mention']
  },
  {
    id: 'system',
    label: 'System',
    types: ['system']
  }
];

const Notifications = () => {
  const navigate = useNavigate();
  const { notifications, loading, unreadCount, refetchNotifications, markAsRead, markAllAsRead } = useNotification();
  const { currentUser } = useAuth();
  const [filter, setFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const filterNotifications = React.useMemo(() => {
    return notifications.filter(notification => {
      // Handle both notification_type and type fields
      const notificationType = notification.notification_type || notification.type;
      const { metadata } = notification;

      if (filter === 'all') return true;

      if (filter === 'challenges') {
        return notificationType === 'challenge_received';
      }

      const filterConfig = filters.find(f => f.id === filter);
      if (!filterConfig) return false;
      return filterConfig.types.includes(notificationType);
    });
  }, [notifications, filter]);

  // Debug log for filtered notifications
  // console.log('Filtered Notifications:', filterNotifications);

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      toast.showSuccess('All notifications marked as read');
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      toast.showError('Failed to mark notifications as read');
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
      toast.showSuccess('Notification marked as read');
    } catch (err) {
      console.error('Failed to mark as read:', err);
      toast.showError('Failed to mark notification as read');
    }
  };

  const sendChallengeEndNotification = async (challengeId: string, userIds: string[]) => {
    try {
      const notifications = userIds.map(userId => ({
        user_id: userId,
        type: 'challenge_ended',
        title: 'Challenge Ended',
        content: 'Challenge ended, winnings will be released soon or check your wallet for your payout.',
        metadata: { challenge_id: challengeId }
      }));

      await supabase.from('notifications').insert(notifications);
    } catch (error) {
      console.error('Error sending challenge end notifications:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F7FB] flex flex-col">
      <PageHeader title="Notifications" />
      <div className="flex-1 flex flex-col items-center w-full">
        <div className="w-full max-w-2xl mx-auto px-2 sm:px-4 py-4">
          {/* Compact Filter Bar */}
          <div className="flex gap-1 mb-6 bg-white rounded-xl shadow-sm p-1 overflow-x-auto">
            {filters.map(filterOption => (
              <button
                key={filterOption.id}
                onClick={() => setFilter(filterOption.id)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  filter === filterOption.id
                    ? 'bg-[#7440ff] text-white'
                    : 'bg-transparent text-white-700 hover:bg-gray-100'
                }`}
                style={{ minWidth: 0 }}
              >
                {filterOption.label}
              </button>
            ))}
          </div>

          {/* Notification List */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex flex-col gap-4 py-8">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center bg-white rounded-2xl shadow-sm px-4 py-3 animate-pulse">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-200 mr-4" />
                    <div className="flex-1 min-w-0">
                      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                      <div className="h-3 bg-gray-100 rounded w-1/2 mb-1" />
                      <div className="flex gap-2 mt-2">
                        <div className="h-3 w-8 bg-gray-100 rounded" />
                        <div className="h-3 w-8 bg-gray-100 rounded" />
                        <div className="h-3 w-12 bg-gray-100 rounded" />
                      </div>
                    </div>
                    <div className="w-20 h-8 bg-gray-200 rounded-full ml-4" />
                  </div>
                ))}
              </div>
            ) : filterNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <img src="/noti-lonely.svg" alt="No notifications" className="w-32 h-32 mb-4 opacity-80" />
                <p className="text-lg font-semibold text-gray-700 mb-1">No notifications found</p>
                <p className="text-sm text-gray-400">
                  {filter === 'all'
                    ? "You don't have any notifications yet"
                    : `No ${filter} notifications found`}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {filterNotifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`flex items-center bg-white rounded-2xl shadow-sm px-4 py-3 transition border border-transparent hover:border-[#CCFF00]/10 relative group ${!notification.read_at ? 'ring-1 ring-[#7440ff]/7' : ''}`}
                  >
                    {console.log('Notification Debug:', notification)}
                    {/* Icon/Avatar */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#F6F7FB] flex items-center justify-center mr-4">
                      {notification.metadata?.banner_url ? (
                        <img src={notification.metadata.banner_url} alt="Banner" className="w-10 h-10 object-cover rounded-full" />
                      ) : (
                         <img src="/notify22.svg" alt="Notifications" className="w-5 h-5" />
                      )}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold text-gray-900 truncate ${!notification.read_at ? 'font-bold' : ''}`}>{notification.title}</span>
                        {!notification.read_at && <span className="w-2 h-2 bg-[#CCFF00] rounded-full inline-block" />}
                      </div>
                      <p className="text-gray-500 text-sm truncate">{notification.content}</p>
                      {/* Challenge Accept/Decline Buttons */}
                      {(notification.type === 'challenge_received' || notification.notification_type === 'challenge_received') && notification.metadata?.challenge_id && !notification.read_at && (
                        <div className="flex gap-2 mt-2">
                          <button
                            className="px-3 py-1 rounded-full bg-[#7440ff] text-white text-xs font-semibold shadow hover:bg-[#7440ff] transition"
                            onClick={async () => {
                              try {
                                // Check if the challenge is already accepted or declined
                                const { data: challenge, error } = await supabase
                                  .from('challenges')
                                  .select('status')
                                  .eq('id', notification.metadata.challenge_id)
                                  .single();

                                if (error) throw error;
                                if (challenge.status !== 'pending') {
                                  toast.showError('This challenge has already been responded to.');
                                  return;
                                }

                                // Update challenge status to accepted
                                await supabase
                                  .from('challenges')
                                  .update({ status: 'accepted' })
                                  .eq('id', notification.metadata.challenge_id);

                                // Notify both parties
                                await supabase.from('notifications').insert([
                                  {
                                    user_id: notification.metadata.challenger_id,
                                    type: 'challenge_accepted',
                                    title: 'Challenge Accepted',
                                    content: `Your challenge with @${currentUser.username} has been accepted!`,
                                    metadata: notification.metadata
                                  },
                                  {
                                    user_id: currentUser.id,
                                    type: 'challenge_started',
                                    title: 'Challenge Started',
                                    content: `The challenge has started! Duration: 1 hour, Amount: ₦${notification.metadata.amount}`,
                                    metadata: notification.metadata
                                  }
                                ]);

                                toast.showSuccess('Challenge accepted! Notifications sent.');
                                refetchNotifications();
                              } catch (error) {
                                console.error('Error accepting challenge:', error);
                                toast.showError('Failed to accept challenge');
                              }
                            }}
                          >
                            Accept
                          </button>
                          <button
                            className="px-3 py-1 rounded-full bg-red-100 text-red-600 text-xs font-semibold shadow hover:bg-red-200 transition"
                            onClick={async () => {
                              try {
                                // Update challenge status to declined
                                await supabase
                                  .from('challenges')
                                  .update({ status: 'declined' })
                                  .eq('id', notification.metadata.challenge_id);

                                // Notify the challenger
                                await supabase.from('notifications').insert({
                                  user_id: notification.metadata.challenger_id,
                                  type: 'challenge_declined',
                                  title: 'Challenge Declined',
                                  content: `Your challenge with @${currentUser.username} was declined.`,
                                  metadata: notification.metadata
                                });

                                toast.showSuccess('Challenge declined! Notification sent.');
                                refetchNotifications();
                              } catch (error) {
                                console.error('Error declining challenge:', error);
                                toast.showError('Failed to decline challenge');
                              }
                            }}
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                    {/* Time & Actions */}
                    <div className="flex flex-col items-end ml-4 gap-2 min-w-[80px]">
                      <span className="text-xs text-gray-400 whitespace-nowrap">{new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {!notification.read_at && !(notification.notification_type?.startsWith('challenge_') || notification.type?.startsWith('challenge_')) && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="text-xs px-3 py-1 rounded-full bg-[#7440ff] text-white font-medium shadow hover:bg-[#7440ff] transition"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Floating Mark All as Read Button */}
      </div>
      <MobileFooterNav />
    </div>
  );
};

export default Notifications;
