import React, { useState } from 'react';
import { Smile } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

interface EventChatMessageReactionsProps {
  messageId: string;
  reactions: Array<{
    id: string;
    emoji: string;
    user_id: string;
  }>;
}

export const EventChatMessageReactions: React.FC<EventChatMessageReactionsProps> = ({
  messageId,
  reactions = []
}) => {
  const { currentUser } = useAuth();
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  let longPressTimer: NodeJS.Timeout | null = null;

  const reactionCounts = reactions.reduce((acc, reaction) => {
    acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleReaction = async (emoji: string) => {
    if (!currentUser) return;

    try {
      const existingReaction = reactions.find(
        r => r.user_id === currentUser.id && r.emoji === emoji
      );

      if (existingReaction) {
        await supabase
          .from('event_chat_message_reactions')
          .delete()
          .match({ id: existingReaction.id });
      } else {
        await supabase
          .from('event_chat_message_reactions')
          .insert({
            message_id: messageId,
            user_id: currentUser.id,
            emoji: emoji
          });
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
    setShowReactionPicker(false);
  };

  // Desktop: show on hover, Mobile: show on long press
  const handleMouseEnter = () => {
    if (window.innerWidth > 768) setShowReactionPicker(true);
  };
  const handleMouseLeave = () => {
    if (window.innerWidth > 768) setShowReactionPicker(false);
  };
  const handleTouchStart = () => {
    if (window.innerWidth <= 768) {
      longPressTimer = setTimeout(() => setShowReactionPicker(true), 400);
    }
  };
  const handleTouchEnd = () => {
    if (window.innerWidth <= 768) {
      if (longPressTimer) clearTimeout(longPressTimer);
      setTimeout(() => setShowReactionPicker(false), 1200);
    }
  };

  return (
    <div
      className="relative group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex gap-1">
        {Object.entries(reactionCounts).map(([emoji, count]) => (
          <button
            key={emoji}
            onClick={() => handleReaction(emoji)}
            className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full px-2 py-1"
          >
            <span>{emoji}</span>
            <span>{count}</span>
          </button>
        ))}
      </div>

      {/* Reaction Picker: WhatsApp style */}
      {showReactionPicker && (
        <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-lg p-2 flex gap-1 z-50 border border-gray-200 animate-fade-in">
          {REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleReaction(emoji)}
              className="hover:bg-gray-100 p-1 rounded text-2xl transition-transform duration-100 hover:scale-125"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Smile icon for accessibility (optional) */}
      <button
        onClick={() => setShowReactionPicker((v) => !v)}
        className="opacity-0 group-hover:opacity-100 absolute -top-8 right-0 p-2 rounded-full bg-gray-100 hover:bg-gray-200 md:hidden"
        aria-label="Show reactions"
      >
        <Smile className="w-4 h-4" />
      </button>
    </div>
  );
};
