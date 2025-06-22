import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSupport } from '../hooks/useSupport';
import UserAvatar from './UserAvatar';
import LoadingSpinner from './LoadingSpinner';
import { format } from 'date-fns';

interface SupportMessage {
  id: string;
  content: string;
  created_at: string;
  is_support: boolean;
  read: boolean;
  read_at?: string;
  user_id: string;
}

const SupportChat: React.FC = () => {
  const { currentUser } = useAuth();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, loading, sendMessage } = useSupport();

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !currentUser) return;

    try {
      await sendMessage(message.trim());
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const defaultQuestions = [
    "How can I get help?"
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Default Questions */}
      {messages.length === 0 && !loading && (
        <div className="p-4 pb-0">
          <div className="mb-2 text-gray-700 font-semibold">Quick questions:</div>
          <div className="flex flex-wrap gap-2">
            {defaultQuestions.map((q) => (
              <button
                key={q}
                className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm hover:bg-purple-200 transition"
                onClick={async () => {
                  setMessage("");
                  await sendMessage(q);
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <LoadingSpinner />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            Start a conversation with our support team!
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg: SupportMessage) => (
              <div
                key={msg.id}
                className={`flex ${msg.is_support ? 'justify-start' : 'justify-end'}`}
              >
                {msg.is_support && (
                  <UserAvatar
                    src="/bantahlogo.png"
                    alt="Support"
                    size="sm"
                    className="mr-2"
                  />
                )}
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    msg.is_support
                      ? 'bg-gray-100 text-gray-900'
                      : 'bg-purple-600 text-white'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <span className="text-xs opacity-75 mt-1 block">
                    {format(new Date(msg.created_at), 'HH:mm')}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            disabled={!message.trim()}
            className="p-2 bg-purple-600 text-white rounded-full disabled:opacity-50 hover:bg-purple-700"
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default SupportChat;