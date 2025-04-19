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
  const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const bubbleClassName = `rounded-xl px-4 py-2 break-words shadow-sm relative ${
    isSender
      ? 'bg-blue-600 text-white rounded-br-none'
      : 'bg-gray-100 text-gray-900 rounded-bl-none'
  }`;

  const tailClassName = `absolute bottom-1 ${isSender ? 'right-[-10px]' : 'left-[-10px]'} w-0 h-0 border-t-8 border-b-8 ${
    isSender ? 'border-l-blue-600 border-r-transparent' : 'border-r-gray-100 border-l-transparent'
  }`;

  const usernameColorClass = getRandomColor(senderUsername || senderName);

  return (
    <div className={`flex ${isSender ? 'flex-row-reverse items-end' : 'items-start'} mb-2`}>
      {/* Avatar with Loading Indicator */}
      {!isSender && hasAvatar && (
        <div className="relative mr-2">
          <div className="w-8 h-8 rounded-full bg-gray-300 self-end overflow-hidden">
            {/* Avatar content */}
          </div>
          {isWaitingForMatch && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
              <Loader className="w-3 h-3 text-purple-500 animate-spin" />
            </div>
          )}
        </div>
      )}
      {isSender && hasAvatar && (
        <div className="relative ml-2">
          <div className="w-8 h-8 rounded-full bg-gray-300 self-end overflow-hidden">
            {/* Avatar content */}
          </div>
          {isWaitingForMatch && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
              <Loader className="w-3 h-3 text-purple-500 animate-spin" />
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col">
        {/* Header with Username and Timestamp */}
        <div className={`flex items-center gap-2 mb-0.5 ${isSender ? 'justify-end' : ''}`}>
          <span className={`font-semibold text-xs ${usernameColorClass} flex items-center gap-1`}>
            {senderUsername || senderName}
            {/* Level badge */}
            {typeof points === 'number' && (
              <span className="ml-1 w-4 h-4 flex items-center justify-center">
                <UserLevelBadge points={typeof points === 'number' ? points : 0} size="sm" showLabel={false} />
              </span>
            )}
            {/* Verification badge */}
            {isVerified && (
              <span className="ml-1 w-4 h-4 align-middle inline-flex items-center justify-center" title="Verified">
                <svg viewBox="0 0 24 24" aria-label="Verified" className="w-full h-full text-blue-500" fill="currentColor">
                  <g>
                    <path d="M22.5 12.87c0-.6-.33-1.15-.85-1.42l-1.7-.98.3-1.89c.09-.6-.14-1.22-.6-1.6-.46-.38-1.1-.47-1.64-.23l-1.7.98-1.7-.98c-.54-.24-1.18-.15-1.64.23-.46.38-.69 1-.6 1.6l.3 1.89-1.7.98c-.52.27-.85.82-.85 1.42s.33 1.15.85 1.42l1.7.98-.3 1.89c-.09.6.14 1.22.6 1.6.46.38 1.1.47 1.64.23l1.7-.98 1.7.98c.54.24 1.18-.15 1.64-.23.46-.38.69-1 .6-1.6l-.3-1.89 1.7-.98c.52-.27.85-.82.85-1.42z"></path>
                    <path d="M10.59 14.58l-2.09-2.09a.75.75 0 111.06-1.06l1.56 1.56 3.56-3.56a.75.75 0 111.06 1.06l-4.09 4.09a.75.75 0 01-1.06 0z" fill="#fff"></path>
                  </g>
                </svg>
              </span>
            )}
          </span>
          <span className="text-[10px] text-gray-400">| {dateStr} | {timeStr}</span>
        </div>
        <div className="relative">
          <div className={bubbleClassName}>
            <p className="text-sm leading-snug">{content}</p>
          </div>
          <div className={tailClassName}></div>
        </div>
        <span
          className={`text-[0.7rem] text-gray-500 mt-0.5 ${isSender ? 'text-right' : 'text-left'}`}
        >
          {isSender && (
            <span className="ml-1">{isRead ? <CheckCheck size={10} /> : <Check size={10} />}</span>
          )}
        </span>
      </div>
    </div>
  );
};

export default ChatBubble;