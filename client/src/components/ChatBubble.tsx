import React, { useState, useRef, useEffect } from 'react';
import { Check, CheckCheck, Reply, Smile } from 'lucide-react';
import UserLevelBadge from './UserLevelBadge';
import { EventChatMessageReactions } from './EventChatMessageReactions';
import { useToast } from '../contexts/ToastContext';

// WhatsApp-style emoji picker
interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
  position: 'left' | 'right';
}
const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect, onClose, position }) => {
  const popularEmojis = ['❤️', '😂', '😮', '😢', '😡', '👍', '👎', '🔥', '💯', '🎉'];
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && (pickerRef.current as HTMLDivElement).contains(event.target as Node) === false) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Horizontal positioning beside the bubble
  const horizontalStyle = position === 'left'
    ? { left: '110%', top: '50%', transform: 'translateY(-50%)' }
    : { right: '110%', top: '50%', transform: 'translateY(-50%)' };

  return (
    <div 
      ref={pickerRef}
      className={`absolute z-50 bg-white/95 backdrop-blur-sm rounded-lg p-2 shadow-lg border border-gray-200`}
      style={horizontalStyle}
    >
      <div className="flex gap-1 flex-wrap max-w-[200px]">
        {popularEmojis.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onEmojiSelect(emoji)}
            className="text-lg hover:scale-125 transition-transform p-1 rounded hover:bg-gray-100"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

// Quick reaction component
interface QuickReactionsProps {
  onReact: (emoji: string) => void;
  position: 'left' | 'right';
}
const QuickReactions: React.FC<QuickReactionsProps> = ({ onReact, position }) => {
  const quickEmojis = ['❤️', '😂', '😮', '😢', '😡', '👍'];
  
  return (
    <div className={`absolute z-40 bg-white/95 backdrop-blur-sm rounded-full px-2 py-1 shadow-lg border border-gray-200 flex gap-1 ${
      position === 'left' ? 'left-0' : 'right-0'
    }`} style={{ top: '-40px' }}>
      {quickEmojis.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onReact(emoji)}
          className="text-sm hover:scale-125 transition-transform p-1 rounded-full hover:bg-gray-100"
        >
          {emoji}
        </button>
      ))}
      <button
        onClick={() => {}} // This would open full emoji picker
        className="text-sm hover:scale-125 transition-transform p-1 rounded-full hover:bg-gray-100"
      >
        <Smile className="w-3 h-3" />
      </button>
    </div>
  );
};

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
  mediaType?: 'image' | 'gif';
  mediaUrl?: string;
  mentions?: Array<{id: string; username: string}>;
  replyTo?: {
    id: string;
    content: string;
    sender: {
      username: string;
    };
  };
  onReply?: () => void;
  onAvatarClick?: () => void;
  messageId?: string;
  reactions?: Array<{ id: string; emoji: string; user_id: string; username?: string }>;
  onReact?: (emoji: string) => void;
  onRemoveReaction?: (reactionId: string) => void;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({
  content,
  timestamp,
  isSender,
  isRead,
  senderName,
  senderUsername,
  isVerified,
  hasAvatar,
  avatarUrl,
  points,
  mediaType,
  mediaUrl,
  mentions,
  replyTo,
  onReply,
  onAvatarClick,
  messageId,
  reactions,
  onReact,
  onRemoveReaction
}) => {
  // Always ensure reactions is an array
  const safeReactions = Array.isArray(reactions) ? reactions : [];
  const [showActions, setShowActions] = useState(false);
  const [showQuickReactions, setShowQuickReactions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [imgSrc, setImgSrc] = useState(avatarUrl || '/default-avatar.png');
  
  // Track local optimistic reactions
  const [optimisticReactions, setOptimisticReactions] = useState<typeof safeReactions>([]);

  useEffect(() => {
    setOptimisticReactions([]);
  }, [JSON.stringify(safeReactions)]);

  // Merge reactions: parent prop + local optimistic, deduped by emoji+user_id
  const mergedReactions = [
    ...safeReactions,
    ...optimisticReactions.filter(or => !safeReactions.some(r => r.emoji === or.emoji && r.user_id === or.user_id))
  ];

  // Group reactions by emoji
  const groupedReactions = mergedReactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, typeof mergedReactions>);

  const date = new Date(timestamp);
  const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const dateStr = date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined 
  });

  // Format content with mentions
  const formatContent = (text: string) => {
    if (!mentions?.length) return text;
    
    let formattedText = text;
    mentions.forEach(mention => {
      formattedText = formattedText.replace(
        `@${mention.username}`,
        `<span class="text-yellow-300 font-semibold hover:underline cursor-pointer">@${mention.username}</span>`
      );
    });
    return <span dangerouslySetInnerHTML={{ __html: formattedText }} />;
  };

  // Mobile: long-press to show quick reactions
  let longPressTimer: NodeJS.Timeout | null = null;
  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.innerWidth <= 768) {
      e.preventDefault();
      longPressTimer = setTimeout(() => {
        setShowQuickReactions(true);
        // Hide after 3 seconds
        setTimeout(() => setShowQuickReactions(false), 3000);
      }, 500);
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
    }
  };

  // Desktop: hover to show actions
  const handleMouseEnter = () => {
    if (window.innerWidth > 768) {
      setShowActions(true);
    }
  };

  const handleMouseLeave = () => {
    if (window.innerWidth > 768) {
      setShowActions(false);
      setShowQuickReactions(false);
      setShowEmojiPicker(false);
    }
  };

  // Track last added emoji for animation
  const [lastAnimatedEmoji, setLastAnimatedEmoji] = useState<string | null>(null);

  const toast = useToast();
  const handleReactionClick = async (emoji: string) => {
    if (!onReact) return;
    try {
      await onReact(emoji);
      // Optimistically add reaction if not already present for this user
      const currentUserId = (typeof window !== 'undefined' && window.localStorage.getItem('supabase_user_id')) || 'me';
      if (!mergedReactions.some(r => r.emoji === emoji && r.user_id === currentUserId)) {
        setOptimisticReactions([...optimisticReactions, { id: `local-${emoji}`, emoji, user_id: currentUserId }]);
        setLastAnimatedEmoji(emoji);
        setTimeout(() => setLastAnimatedEmoji(null), 600); // Animation duration
      }
    } catch (err: any) {
      if (toast && typeof toast.showError === 'function') {
        toast.showError('Failed to react: ' + (err?.message || String(err)));
      } else {
        alert('Failed to react: ' + (err?.message || String(err)));
      }
    }
    setShowQuickReactions(false);
    setShowEmojiPicker(false);
  };

  const handleEmojiSelect = (emoji: string) => {
    handleReactionClick(emoji);
    setShowEmojiPicker(false);
  };

  // Reaction pop animation for emoji reactions
  const style = document.createElement('style');
  style.innerHTML = `
  .animate-reaction-pop {
    animation: reaction-pop 0.6s cubic-bezier(.23,1.12,.67,.99);
  }
  @keyframes reaction-pop {
    0% { transform: scale(0.5); opacity: 0; }
    60% { transform: scale(1.3); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
  }`;
  if (typeof window !== 'undefined' && !document.getElementById('reaction-pop-style')) {
    style.id = 'reaction-pop-style';
    document.head.appendChild(style);
  }

  return (
    <div
      className={`flex w-full ${isSender ? 'justify-end' : 'justify-start'} mb-3`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={`flex ${isSender ? 'flex-row-reverse' : 'flex-row'} items-start gap-1 max-w-[65%] group relative`}>
        {/* Avatar */}
        {hasAvatar && !isSender && (
          <div className="flex-shrink-0">
            <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden cursor-pointer" onClick={onAvatarClick}>
              <img
                src={imgSrc}
                alt={`${senderUsername || senderName}'s avatar`}
                className="w-full h-full object-cover"
                onError={() => {
                  if (imgSrc !== '/default-avatar.png') {
                    setImgSrc('/default-avatar.png');
                  }
                }}
              />
            </div>
          </div>
        )}

        <div className="flex flex-col w-full relative">
          {/* Quick reactions overlay (mobile only) */}
          {showQuickReactions && (
            <QuickReactions 
              onReact={handleReactionClick}
              position={isSender ? 'right' : 'left'}
            />
          )}

          {/* Sender name and badges */}
          {!isSender && (senderName || senderUsername) && (
            <div className="flex items-center gap-1 mb-0.5 px-0.5">
              <span className="text-[11px] text-gray-500 font-medium">
                {senderUsername || senderName}
              </span>
              {isVerified && (
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 inline-block" fill="#7440ff">
                  <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.085 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.165.865.25 1.336.25 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
                </svg>
              )}
              {typeof points === 'number' && (
                <UserLevelBadge points={points} size="xs" showLabel={false} />
              )}
            </div>
          )}

          {/* Reply preview if this is a reply */}
          {replyTo && replyTo.sender && replyTo.content && (
            <div className={`text-[11px] mb-1 px-2 py-1 rounded ${isSender ? 'bg-purple-700/30' : 'bg-purple-600/30'}`}>
              <span className="font-medium text-purple-200">@{replyTo.sender.username}</span>
              <span className="text-purple-100 ml-1">{replyTo.content.substring(0, 50)}{replyTo.content.length > 50 ? '...' : ''}</span>
            </div>
          )}

          {/* Row: hover icons + bubble */}
          <div className="flex items-center relative w-full">
            {/* Desktop: show reply and emoji buttons on hover, outside bubble */}
            {typeof window !== 'undefined' && window.innerWidth > 768 && (
              <div className={`flex flex-col gap-2 absolute z-20 ${isSender ? 'right-full pr-2' : 'left-full pl-2'} top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity`}>
                <button
                  onClick={e => { e.stopPropagation(); setShowEmojiPicker(true); }}
                  className="p-1 rounded-full bg-gray-900/70 hover:bg-gray-900/90"
                  title="React"
                  tabIndex={0}
                >
                  <Smile className="w-4 h-4 text-white" />
                </button>
                {onReply && (
                  <button
                    onClick={onReply}
                    className="p-1 rounded-full bg-gray-900/70 hover:bg-gray-900/90"
                    title="Reply"
                    tabIndex={0}
                  >
                    <Reply className="w-4 h-4 text-white" />
                  </button>
                )}
                {/* Emoji picker (desktop, positioned beside bubble) */}
                {showEmojiPicker && (
                  <EmojiPicker 
                    onEmojiSelect={(emoji: string) => { handleEmojiSelect(emoji); setShowEmojiPicker(false); }}
                    onClose={() => setShowEmojiPicker(false)}
                    position={isSender ? 'right' : 'left'}
                  />
                )}
              </div>
            )}
            {/* Message bubble */}
            <div
              className={`relative group px-2 py-[4px] rounded-2xl ${
                isSender 
                  ? 'bg-white/40 text-black rounded-tr-sm' 
                  : 'bg-white/40 text-black rounded-tl-sm'
              }`}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {mediaType && mediaUrl ? (
                <div className="rounded-lg overflow-hidden mb-1">
                  <img 
                    src={mediaUrl} 
                    alt={mediaType === 'gif' ? 'GIF' : 'Image'} 
                    className="max-w-full rounded-lg"
                    loading="lazy"
                  />
                </div>
              ) : null}
              {content && (
                <div className="text-[13px] leading-[18px] whitespace-pre-wrap break-words">
                  {formatContent(content)}
                </div>
              )}
            </div>
          </div>

          {/* Reactions display (bottom of bubble) */}
          {Object.keys(groupedReactions).length > 0 && (
            <div className={`flex flex-wrap gap-1 mt-1 ${isSender ? 'justify-end' : 'justify-start'}`}>
              {Object.entries(groupedReactions).map(([emoji, reactionList]) => (
                <button
                  key={emoji}
                  onClick={() => handleReactionClick(emoji)}
                  className={`flex items-center gap-0.5 px-1 py-0.5 bg-white/60 rounded-full text-[10px] hover:bg-white/80 transition-colors border border-gray-200 focus:outline-none ${lastAnimatedEmoji === emoji ? 'animate-reaction-pop' : ''}`}
                  title={`Reacted by: ${reactionList.map(r => r.username || r.user_id).join(', ')}`}
                  style={{ fontSize: '0.95rem', lineHeight: 1 }}
                >
                  <span className="text-[13px]">{emoji}</span>
                  <span className="text-gray-600 text-[10px]">{reactionList.length}</span>
                </button>
              ))}
            </div>
          )}

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