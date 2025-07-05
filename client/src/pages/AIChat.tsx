import React, { useState, useRef, useEffect } from 'react';
import { Send, ImagePlus, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Message {
  role: 'assistant' | 'user';
  content: string;
  timestamp: string;
  avatar_url?: string | null;
}

const SUGGESTED_QUESTIONS = [
  "What are the best betting strategies for soccer matches?",
  "How do I analyze team statistics effectively?",
  "Tips for managing my betting bankroll?",
  "How to identify value bets?",
];

const AIChat: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: 'Hi! I am Bantzz, your AI chat assistant. I can help you with betting strategies, game analysis, and making informed decisions in social betting. How can I assist you today?',
      timestamp: new Date().toISOString(),
      avatar_url: '/bantahlogo.png'
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
      avatar_url: currentUser?.avatar_url ?? '/avatar.svg'
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    // Placeholder for AI response
    setTimeout(() => {
      const aiResponse: Message = {
        role: 'assistant',
        content: 'This is a sample AI response. The backend integration is coming soon! I\'ll be able to help you with betting strategies, game analysis, and social betting tips.',
        timestamp: new Date().toISOString(),
        avatar_url: '/bantahlogo.png'
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsProcessing(false);
    }, 1200);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-[#FCFCFC] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto w-full px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <div className="relative">
                <img src="/bantahlogo.png" alt="Bantzz" className="w-8 h-8 rounded-full" />
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-[15px] text-gray-900">Bantzz AI</span>
                <span className="text-[11px] text-green-600">Online</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 flex flex-col max-w-3xl w-full mx-auto">
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-6">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8">
                    <img src="/bantahlogo.png" alt="Bantzz" className="w-full h-full rounded-full shadow-sm" />
                  </div>
                )}
                <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%]`}>
                  <div 
                    className={`px-4 py-2 rounded-2xl break-words ${
                      msg.role === 'user' 
                        ? 'bg-[#7440ff] text-white rounded-br-lg' 
                        : 'bg-white text-gray-900 shadow-sm border border-gray-100 rounded-bl-lg'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[11px] text-gray-400 mt-1 px-1">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
                {msg.role === 'user' && msg.avatar_url && (
                  <div className="flex-shrink-0 w-8 h-8">
                    <img 
                      src={msg.avatar_url} 
                      alt="User"
                      className="w-full h-full rounded-full shadow-sm" 
                    />
                  </div>
                )}
              </div>
            ))}

            {/* Show suggested questions after AI's first message */}
            {messages.length === 1 && (
              <div className="mt-6 space-y-2">
                <p className="text-sm text-gray-500 mb-3">Suggested questions:</p>
                {SUGGESTED_QUESTIONS.map((question, idx) => (
                  <button
                    key={idx}
                    className="w-full text-left p-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm transition-colors"
                    onClick={() => {
                      setInput(question);
                      // Call handleSend with a synthetic event
                      handleSend(new Event('click') as unknown as React.FormEvent);
                    }}
                  >
                    {question}
                  </button>
                ))}
              </div>
            )}

            {/* Loading indicator */}
            {isProcessing && (
              <div className="flex gap-3">
                <div className="w-8 h-8">
                  <img src="/bantahlogo.png" alt="Bantzz" className="w-full h-full rounded-full shadow-sm" />
                </div>
                <div className="px-4 py-3 bg-white shadow-sm border border-gray-100 rounded-2xl rounded-bl-lg">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t bg-white p-4">
          <form onSubmit={handleSend} className="flex items-start gap-2 max-w-3xl mx-auto">
            <button
              type="button"
              className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
              aria-label="Add image"
            >
              <ImagePlus className="w-5 h-5" />
            </button>
            <div className="flex-1 flex">
              <input
                type="text"
                className="flex-1 outline-none bg-gray-100 hover:bg-gray-50 focus:bg-white text-gray-900 rounded-xl px-4 py-3 text-[15px] border border-transparent focus:border-gray-300 transition-all"
                placeholder="Ask me anything about betting..."
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={isProcessing}
                autoFocus
                maxLength={500}
              />
            </div>
            <button
              type="submit"
              className="p-3 rounded-xl bg-[#7440ff] hover:bg-[#5930cc] text-white transition-colors disabled:opacity-50 disabled:hover:bg-[#7440ff]"
              disabled={isProcessing || !input.trim()}
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AIChat;
