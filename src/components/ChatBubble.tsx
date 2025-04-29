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
  hasAvatar?: boolean;
  points?: number;
  avatarUrl?: string;
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
  avatarUrl,
}) => {
  const date = new Date(timestamp);
  const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const dateStr = date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined 
  });

  return (
    <div className={`flex w-full ${isSender ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`flex ${isSender ? 'flex-row-reverse' : 'flex-row'} items-start gap-1 max-w-[65%]`}>
        {/* Avatar */}
        {hasAvatar && !isSender && (
          <div className="flex-shrink-0">
            <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden">
              <img
                src={avatarUrl || '/default-avatar.png'}
                alt={`${senderUsername || senderName}'s avatar`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/default-avatar.png';
                }}
              />
            </div>
          </div>
        )}

        <div className="flex flex-col w-full">
          {/* Sender name and badges */}
          {!isSender && (senderName || senderUsername) && (
            <div className="flex items-center gap-1 mb-0.5 px-0.5">
              <span className="text-[11px] text-gray-500 font-medium">
                {senderUsername || senderName}
              </span>
              {isVerified && (
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 inline-block" fill="#7440ff">
                  <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.085 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.165.865.25 1.336.25 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.437.695.21 1.04z" />
                </svg>
              )}
              {typeof points === 'number' && (
                <UserLevelBadge points={points} size="xs" showLabel={false} />
              )}
            </div>
          )}

          {/* Message bubble */}
          <div
            className={`relative group px-2 py-[4px] rounded-2xl min-w-[60px] ${
              isSender 
                ? 'bg-[#7440ff] text-white rounded-tr-sm' 
                : 'bg-[#7440ff] text-white rounded-tl-sm'
            }`}
          >
            <p className="text-[13px] leading-[18px] whitespace-pre-wrap break-words">{content}</p>
          </div>

          {/* Timestamp and read status */}
          <div className={`flex items-center gap-1 mt-0.5 ${isSender ? 'justify-end' : 'justify-start'}`}>
            <span className="text-[9px] text-gray-400 select-none">
              {timeStr} • {dateStr}
            </span>
            {isSender && (
              <span className="text-gray-400">
                {isRead ? (
                  <CheckCheck className="w-3 h-3" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;