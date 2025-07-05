import React, { useState } from 'react';
import { Smile } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

interface PrivateMessageReactionsProps {
  messageId: string;
  reactions: Array<{
    id: string;
    emoji: string;
    user_id: string;
  }>;
}

export const PrivateMessageReactions: React.FC<PrivateMessageReactionsProps> = ({
  messageId,
  reactions = []
}) => {
  const { currentUser } = useAuth();
  const [showReactionPicker, setShowReactionPicker] = useState(false);

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
          .from('private_message_reactions')
          .delete()
          .match({ id: existingReaction.id });
      } else {
        await supabase
          .from('private_message_reactions')
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

  return (
    <div className="relative">
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

      <button
        onClick={() => setShowReactionPicker(!showReactionPicker)}
        className="opacity-0 group-hover:opacity-100 absolute -top-8 right-0 p-2 rounded-full bg-gray-100 hover:bg-gray-200"
      >
        <Smile className="w-4 h-4" />
      </button>

      {showReactionPicker && (
        <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-lg p-2 flex gap-1 z-50">
          {REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleReaction(emoji)}
              className="hover:bg-gray-100 p-1 rounded"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
