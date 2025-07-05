import React, { useState, useEffect } from 'react';
import { MoreVertical, Smile, Reply } from 'lucide-react';
import UserAvatar from './UserAvatar';
import { useUserPresenceContext } from '../contexts/UserPresenceContext';
import { supabase } from '../lib/supabase';

interface ChatMessageProps {
  message: any;
  isOwnMessage: boolean;
  onReply: (messageId: string) => void;
  onReaction?: (messageId: string, emoji: string) => void;
  isOptimistic?: boolean;
}

const ChatMessageItem: React.FC<ChatMessageProps> = ({
  message,
  isOwnMessage,
  onReply,
  onReaction,
  isOptimistic = false
}) => {
  const [showReactions, setShowReactions] = useState(false);
  const { getUserStatus } = useUserPresenceContext();
  const [userStatus, setUserStatus] = useState<string>('offline');
  const [userPoints, setUserPoints] = useState<number>(0);

  // Fetch user status and points
  useEffect(() => {
    const fetchUserData = async () => {
      if (message.sender_id) {
        // Fetch status
        const status = await getUserStatus(message.sender_id);
        setUserStatus(status);

        // Fetch user points
        try {
          const { data, error } = await supabase
            .from('users')
            .select('reputation_score')
            .eq('id', message.sender_id)
            .single();

          if (!error && data) {
            setUserPoints(data.reputation_score || 0);
          }
        } catch (error) {
          console.error('Error fetching user points:', error);
        }
      }
    };

    fetchUserData();
  }, [message.sender_id, getUserStatus]);

  const formattedTime = message.created_at
    ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  const reactions = message.reactions || [];

  return (
    <div
      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4 group`}
      onMouseEnter={() => setShowReactions(true)}
      onMouseLeave={() => setShowReactions(false)}
    >
      {!isOwnMessage && (
        <div className="flex-shrink-0 mr-3">
          <UserAvatar
            src={message.sender?.avatar_url}
            alt={message.sender?.name || 'User'}
            size="md"
            status={userStatus as any}
            points={userPoints}
            showLevelBadge={true}
          />
        </div>
      )}

      <div className={`max-w-[75%] ${isOptimistic ? 'opacity-70' : ''}`}>
        {!isOwnMessage && (
          <div className="text-xs text-gray-500 mb-1">
            {message.sender?.name || message.sender?.username || 'User'}
          </div>
        )}

        <div className="flex items-end">
          <div
            className={`rounded-lg py-2 px-3 ${
              isOwnMessage
                ? 'bg-[#7440ff] text-white rounded-br-none'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none'
            }`}
          >
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>

            {reactions.length > 0 && (
              <div className="flex mt-1 space-x-1">
                {reactions.map((reaction: any) => (
                  <span
                    key={reaction.id}
                    className="inline-flex items-center justify-center bg-white dark:bg-gray-700 rounded-full px-1.5 py-0.5 text-xs"
                  >
                    {reaction.emoji}
                  </span>
                ))}
              </div>
            )}
          </div>

          {showReactions && !isOptimistic && (
            <div className="flex items-center ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => onReply(message.id)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 p-1"
                aria-label="Reply to message"
              >
                <Reply size={16} />
              </button>
              <button
                type="button"
                onClick={() => setShowReactions(prev => !prev)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 p-1"
                aria-label="Add reaction"
              >
                <Smile size={16} />
              </button>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 p-1"
                aria-label="More options"
              >
                <MoreVertical size={16} />
              </button>
            </div>
          )}
        </div>

        <div className={`text-xs text-gray-500 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
          {formattedTime}
          {isOptimistic && <span className="ml-2">Sending...</span>}
        </div>
      </div>

      {isOwnMessage && (
        <div className="flex-shrink-0 ml-3">
          <UserAvatar
            src={message.sender?.avatar_url}
            alt={message.sender?.name || 'You'}
            size="md"
            status={userStatus as any}
            points={userPoints}
            showLevelBadge={true}
          />
        </div>
      )}
    </div>
  );
};

export default ChatMessageItem;
