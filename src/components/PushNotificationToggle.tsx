import React from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { Bell, BellOff } from 'lucide-react';

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

  if (!isPushSupported) {
    return null; // Don't show the toggle if push notifications aren't supported
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="text-sm font-medium">Push Notifications</span>
      <button
        onClick={isPushEnabled ? unsubscribeFromPush : subscribeToPush}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
          isPushEnabled 
            ? 'bg-[#CCFF00] text-black hover:bg-[#CCFF00]/80' 
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        {isPushEnabled ? (
          <>
            <Bell size={16} />
            <span>Enabled</span>
          </>
        ) : (
          <>
            <BellOff size={16} />
            <span>Disabled</span>
          </>
        )}
      </button>
    </div>
  );
};

export default PushNotificationToggle;
