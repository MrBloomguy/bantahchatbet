import React from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { Bell, BellOff } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

interface PushNotificationToggleProps {
  className?: string;
}

const PushNotificationToggle: React.FC<PushNotificationToggleProps> = ({ className = '' }) => {
  const {
    isPushSupported,
    isPushEnabled,
    subscribeToPush,
    unsubscribeFromPush
  } = useNotifications();

  const { settings, toggleSetting } = useSettings();

  if (!isPushSupported) {
    return (
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-3">
          <Bell className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span className="text-gray-800 dark:text-gray-200 text-sm">Push Notifications</span>
          <span className="text-xs text-gray-500">(Not supported in this browser)</span>
        </div>
        <button
          type="button"
          disabled
          className="w-11 h-5 rounded-full bg-gray-400 dark:bg-gray-600 relative focus:outline-none opacity-50"
          aria-label="Push notifications toggle (disabled)"
        >
          <span className="absolute top-[2px] w-3 h-3 rounded-full bg-white left-1" />
        </button>
      </div>
    );
  }

  // Handle push notification toggle
  const handlePushToggle = async () => {
    try {
      if (isPushEnabled) {
        await unsubscribeFromPush();
      } else {
        await subscribeToPush();
      }
      // Also update the settings context
      toggleSetting('notifications', 'push');
    } catch (error) {
      console.error('Error toggling push notifications:', error);
    }
  };

  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-3">
        <Bell className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <span className="text-gray-800 dark:text-gray-200 text-sm">Push Notifications</span>
      </div>
      <button
        type="button"
        onClick={handlePushToggle}
        className={`w-11 h-5 rounded-full transition-colors ${
          isPushEnabled ? 'bg-[#7440ff]' : 'bg-gray-400 dark:bg-gray-600'
        } relative focus:outline-none`}
        aria-label={isPushEnabled ? "Disable push notifications" : "Enable push notifications"}
      >
        <span className={`absolute top-[2px] w-3 h-3 rounded-full transition-transform ${
          isPushEnabled ? 'bg-white right-1' : 'bg-white left-1'
        }`} />
      </button>
    </div>
  );
};

export default PushNotificationToggle;
