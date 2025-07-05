import React, { useState } from 'react';
import { Smile } from 'lucide-react';

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

interface MessageReactionsProps {
  messageId: string;
  reactions: Array<{
    id: string;
    emoji: string;
    user_id: string;
  }>;
  onReact: (emoji: string) => void;
}

export const MessageReactions: React.FC<MessageReactionsProps> = ({
  messageId,
  reactions,
  onReact,
}) => {
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  const reactionCounts = reactions.reduce((acc, reaction) => {
    acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="relative flex items-center gap-1">
      {/* Existing Reactions */}
      {Object.entries(reactionCounts).map(([emoji, count]) => (
        <button
          key={emoji}
          onClick={() => onReact(emoji)}
          className="flex items-center gap-1 text-xs bg-white/5 hover:bg-white/10 
          rounded-full px-2 py-1 transition-colors"
        >
          <span>{emoji}</span>
          <span className="text-white/60">{count}</span>
        </button>
      ))}

      {/* Add Reaction Button */}
      <button
        onClick={() => setShowReactionPicker(!showReactionPicker)}
        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full 
        bg-[#242538] text-white/60 hover:text-white hover:bg-[#2c2d44] transition-all"
      >
        <Smile className="w-4 h-4" />
      </button>

      {/* Reaction Picker */}
      {showReactionPicker && (
        <div className="absolute bottom-full right-0 mb-2 bg-[#242538] 
        rounded-lg p-2 flex gap-1 shadow-lg z-50">
          {REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                onReact(emoji);
                setShowReactionPicker(false);
              }}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
