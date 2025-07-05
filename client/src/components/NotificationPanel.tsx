const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'event_win':
    case 'event_loss':
    case 'new_event':
    case 'event_update':
      return <Trophy className="w-5 h-5 text-[#CCFF00]" />;
    case 'earnings':
    case 'deposit':  // Add deposit case
      return <Wallet className="w-5 h-5 text-[#CCFF00]" />;
    case 'group_message':
      return <MessageSquare className="w-5 h-5 text-[#CCFF00]" />;
    // ... rest of the cases ...
  }
};

const getNotificationBackground = (type: Notification['type']) => {
  switch (type) {
    case 'event_win':
    case 'earnings':
    case 'deposit':  // Add deposit case
      return 'bg-[#CCFF00]/20';
    case 'event_loss':
      return 'bg-red-500/20';
    case 'leaderboard_update':
      return 'bg-[#7C3AED]/20';
    default:
      return 'bg-[#242538]';
  }
};
