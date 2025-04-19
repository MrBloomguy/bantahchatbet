import React from 'react';
import { Check, CheckCheck } from 'lucide-react';
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
}

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
}) => {
  const dateObj = new Date(timestamp);
  const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`flex ${isSender ? 'flex-row-reverse items-start' : 'items-start'} mb-2`}>
      {/* Space for Avatar */}
      {!isSender && hasAvatar && <div className="w-8 h-8 mr-2 rounded-full bg-gray-300"></div>}
      {isSender && hasAvatar && <div className="w-8 h-8 ml-2 rounded-full bg-gray-300"></div>}

      <div className="flex flex-col">
        {/* Discord-style header */}
        <div className={`flex items-center gap-2 mb-0.5 ${isSender ? 'justify-end' : ''}`}>
          <span className="font-semibold text-xs text-gray-800 flex items-center gap-1">
            {senderUsername || senderName}
            {/* Level badge (UserLevelBadge) */}
            {typeof points === 'number' && (
              <span className="ml-1">
                <UserLevelBadge points={typeof points === 'number' ? points : 0} size="sm" showLabel={false} />
              </span>
            )}
            {/* Twitter-style verification badge for everyone */}
            <span className="ml-1 align-middle inline-flex items-center" title="Verified">
              <svg viewBox="0 0 24 24" aria-label="Verified" className="w-4 h-4 text-blue-500" fill="currentColor">
                <g>
                  <path d="M22.5 12.87c0-.6-.33-1.15-.85-1.42l-1.7-.98.3-1.89c.09-.6-.14-1.22-.6-1.6-.46-.38-1.1-.47-1.64-.23l-1.7.98-1.7-.98c-.54-.24-1.18-.15-1.64.23-.46.38-.69 1-.6 1.6l.3 1.89-1.7.98c-.52.27-.85.82-.85 1.42s.33 1.15.85 1.42l1.7.98-.3 1.89c-.09.6.14 1.22.6 1.6.46.38 1.1.47 1.64.23l1.7-.98 1.7.98c.54.24 1.18.15 1.64-.23.46-.38.69-1 .6-1.6l-.3-1.89 1.7-.98c.52-.27.85-.82.85-1.42z"></path>
                  <path d="M10.59 14.58l-2.09-2.09a.75.75 0 111.06-1.06l1.56 1.56 3.56-3.56a.75.75 0 111.06 1.06l-4.09 4.09a.75.75 0 01-1.06 0z" fill="#fff"></path>
                </g>
              </svg>
            </span>
          </span>
          <span className="text-[10px] text-gray-400">| {dateStr} | {timeStr}</span>
        </div>
        <div className={`${isSender ? 'items-end' : 'items-start'}`}>
          <div
            className={`rounded-2xl px-4 py-2 break-words shadow-sm max-w-xs ${
              isSender
                ? 'bg-blue-600 text-white rounded-br-2xl'
                : 'bg-gray-100 text-gray-900 rounded-bl-2xl'
            }`}
          >
            <p className="text-sm leading-snug">{content}</p>
          </div>
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