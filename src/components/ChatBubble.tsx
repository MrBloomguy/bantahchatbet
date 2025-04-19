import React from 'react';
import { Check, CheckCheck, Loader } from 'lucide-react';
import UserLevelBadge from './UserLevelBadge';

interface ChatBubbleProps {
  content: string;
  timestamp: string;
  isSender: boolean;
  isRead?: boolean;
  senderName?: string;
  senderUsername?: string;
  isVerified?: boolean;
  hasAvatar?: boolean; // Optional prop to indicate if there's an avatar
  points?: number; // Optional prop for points badge
  isWaitingForMatch?: boolean; // Optional prop for waiting indicator
}

// Function to generate a random color based on the username
const getRandomColor = (username: string | undefined): string => {
  if (!username) return 'text-gray-800'; // Default color if no username

  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += value.toString(16).padStart(2, '0');
  }

  // Basic luminance check to ensure readability
  const luminance = (0.299 * parseInt(color.slice(1, 3), 16) +
                     0.587 * parseInt(color.slice(3, 5), 16) +
                     0.114 * parseInt(color.slice(5, 7), 16)) / 255;

  return luminance > 0.7 ? getRandomColor(username + 'salt') : `text-[${color}]`;
};

const ChatBubble: React.FC<ChatBubbleProps> = ({
  content,
  timestamp,
  isSender,
  isRead,
  senderName,
  senderUsername,
  isVerified,
  hasAvatar = false,
  points,
  isWaitingForMatch = false,
}) => {
  const dateObj = new Date(timestamp);
  const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  // All bubbles are blue
  const bubbleClassName = `rounded-full px-2 py-1 break-words shadow-sm relative max-w-[60%] bg-blue-500 text-white rounded-full`;

  const tailClassName = `absolute bottom-1 ${isSender ? 'right-[-10px]' : 'left-[-10px]'} w-0 h-0 border-t-8 border-b-8 border-l-blue-500 border-r-transparent`;

  const usernameColorClass = getRandomColor(senderUsername || senderName);

  return (
    <div className={`flex ${isSender ? 'flex-row-reverse items-end' : 'items-start'} mb-2`}>
      {/* Avatar */}
      {!isSender && hasAvatar && (
        <div className="relative mr-2">
          <div className="w-8 h-8 rounded-full bg-gray-300 self-end overflow-hidden">
            {senderUsername ? (
              <img
                src={`https://example.com/avatars/${senderUsername}.png`} // Replace with your actual avatar URL logic
                alt={`${senderUsername}'s avatar`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-400 flex items-center justify-center text-white text-xs">
                {senderName?.charAt(0).toUpperCase() || '?'}
              </div>
            )}
          </div>
        </div>
      )}
      {isSender && hasAvatar && (
        <div className="relative ml-2">
          <div className="w-8 h-8 rounded-full bg-gray-300 self-end overflow-hidden">
            {senderUsername ? (
              <img
                src={`https://example.com/avatars/${senderUsername}.png`} // Replace with your actual avatar URL logic
                alt={`${senderUsername}'s avatar`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-400 flex items-center justify-center text-white text-xs">
                {senderName?.charAt(0).toUpperCase() || '?'}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col">
        {/* Header with Username, Verification Badge, and Level Badge */}
        <div className={`flex items-center gap-2 mb-1 ${isSender ? 'justify-end' : ''}`}>
          <span className={`font-semibold text-xs ${usernameColorClass} flex items-center gap-1`}>
            {senderUsername || senderName}
            {/* Verification Badge */}
            {isVerified && (
              <span
                className="ml-1 w-4 h-4 align-middle inline-flex items-center justify-center rounded-full"
                title="Verified"
              >
                <img
                  src="https://example.com/verified-badge.svg" // Replace with the actual URL of your verification badge SVG
                  alt="Verified"
                  className="w-3 h-3"
                />
              </span>
            )}
            {/* Level Badge */}
            {typeof points === 'number' && (
              <span className="ml-1 w-3 h-3 flex items-center justify-center">
                <UserLevelBadge points={points} size="sm" showLabel={false} />
              </span>
            )}
          </span>
        </div>

        {/* Chat Bubble */}
        <div className="relative">
          <div className={bubbleClassName}>
            <p className="text-sm leading-tight">{content}</p>
          </div>
          <div className={tailClassName}></div>
        </div>

        {/* Time and Date Below the Bubble */}
        <span
          className={`text-[8px] text-gray-300 font-thin mt-1 ${isSender ? 'text-right' : 'text-left'}`}
        >
          {dateStr} | {timeStr}
        </span>

        {/* Read Indicator */}
        {isSender && (
          <span className="text-[0.7rem] text-gray-300 mt-0.5 text-right">
            {isRead ? <CheckCheck size={10} /> : <Check size={10} />}
          </span>
        )}
      </div>
    </div>
  );
};

export default ChatBubble;