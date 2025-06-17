import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  ImagePlus,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import BantzzChatHeader from '../components/BantzzChatHeader';
import { BotpressClient } from '../api/botpress';

interface Message {
  role: 'assistant' | 'user';
  content: string;
  timestamp: string;
  avatar_url?: string | null;
  image_url?: string;
  error?: boolean;
}

interface RecentChat {
  id: string;
  title: string;
  lastUpdated: string;
}

const SUGGESTED_QUESTIONS = [
  { icon: <Sparkles className="w-4 h-4 text-purple-600" />, title: "What's Happen in 24 hours?", description: "See what's been happening in the world over the last 24 hours" },
  { icon: <Sparkles className="w-4 h-4 text-purple-600" />, title: "Stock market update", description: "See what's happening in the stock market in real time" },
  { icon: <Sparkles className="w-4 h-4 text-purple-600" />, title: "Deep economic research", description: "See research from experts that we have simplified." },
];

const RECENT_CHATS: RecentChat[] = [
  { id: '1', title: 'Brainstorming small busine...', lastUpdated: '2 hours ago' },
  { id: '2', title: 'The history of roman empire', lastUpdated: 'Yesterday' },
  { id: '3', title: 'Crypto investment suggestio...', lastUpdated: '3 days ago' },
];

const Bantzz: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [botpress, setBotpress] = useState<BotpressClient | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    const initializeBotpress = async () => {
      try {
        // Initialize Botpress client with user ID
        const client = new BotpressClient(currentUser?.id || 'anonymous');
        await client.initialize();
        setBotpress(client);

        // Create a new conversation
        const conversation = await client.createConversation();
        setConversationId(conversation.id);

        // Set up event listener for bot responses
        const cleanup = client.listenToConversation(conversation.id, (message) => {
          if (message.user_id !== currentUser?.id) {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: message.payload.text || '',
              timestamp: message.created_at,
              avatar_url: '/bantahlogo.png'
            }]);
            setIsProcessing(false);
          }
        });

        // Add welcome message
        setMessages([{
          role: 'assistant',
          content: `Hi! I am Bantzz, your AI chat assistant. I can help you with betting strategies, game analysis, and making informed decisions in social betting. How can I assist you today?`,
          timestamp: new Date().toISOString(),
          avatar_url: '/bantahlogo.png'
        }]);

        return cleanup;
      } catch (error) {
        console.error('Failed to initialize Botpress:', error);
        setMessages([{
          role: 'assistant',
          content: 'Sorry, there was a problem connecting to the chat service.',
          timestamp: new Date().toISOString(),
          avatar_url: '/bantahlogo.png',
          error: true
        }]);
      }
    };

    if (currentUser?.id) {
      initializeBotpress();
    }

    return () => {
      // Cleanup will be handled by the function returned from initializeBotpress
    };
  }, [currentUser?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  };

  const handleSend = async (e?: React.FormEvent, question?: string) => {
    e?.preventDefault();
    const messageContent = question || input.trim();
    if (!messageContent || isProcessing || !botpress || !conversationId) return;

    const userMessage: Message = {
      role: 'user',
      content: messageContent,
      timestamp: new Date().toISOString(),
      avatar_url: currentUser?.avatar_url ?? '/avatar.svg'
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      await botpress.sendMessage(conversationId, messageContent);
      // The bot's response will be handled by the event listener
    } catch (err: any) {
      console.error('Error sending message:', err);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, there was a problem sending your message.',
          timestamp: new Date().toISOString(),
          avatar_url: '/bantahlogo.png',
          error: true
        }
      ]);
      setIsProcessing(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const showWelcomeScreen = messages.length === 1 && messages[0].content.includes('Hi! I am Bantzz');

  return (
    <>
      <div className="h-screen flex flex-col">
        <BantzzChatHeader currentUser={currentUser} />
        <div className="flex-1 flex">
          {/* Sidebar */}
          <div className={`fixed lg:relative inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-200 ease-in-out w-64 lg:w-72 bg-white border-r border-gray-100 z-20`}>
            {/* Recent conversations could go here */}
            <div className="p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Chats</h2>
              <div className="space-y-3">
                {RECENT_CHATS.map((chat) => (
                  <button
                    key={chat.id}
                    className="w-full flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                    onClick={() => {/* Handle chat selection */}}
                  >
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-gray-900 truncate">{chat.title}</p>
                      <p className="text-xs text-gray-500">{chat.lastUpdated}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-6">
                {showWelcomeScreen ? (
                  <div className="flex flex-col items-center text-center max-w-xl mx-auto py-6 lg:py-10">
                    <h2 className="text-2xl md:text-4xl font-bold text-gray-800 mb-2 md:mb-3">
                      Hello {currentUser?.email?.split('@')[0] || 'there'}
                    </h2>
                    <p className="text-lg md:text-2xl text-gray-600 mb-5 md:mb-8">
                      How can I help you today?
                    </p>
                    {/* Suggested Questions Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                      {SUGGESTED_QUESTIONS.map((item, idx) => (
                        <button
                          key={idx}
                          className="flex flex-col items-center p-5 bg-white rounded-2xl shadow-md border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group focus:outline-none"
                          onClick={() => handleSend(undefined, item.title)}
                        >
                          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 mb-3 group-hover:from-purple-200 group-hover:to-purple-300">
                            {item.icon}
                          </div>
                          <h4 className="font-bold text-base text-gray-800 mb-1 text-center">{item.title}</h4>
                          <p className="text-xs text-gray-500 text-center leading-snug">{item.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 w-full space-y-3 lg:space-y-4 px-0 pb-3 pt-8">
                    {messages.map((msg, idx) => (
                      <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'assistant' && (
                          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-white flex items-center justify-center overflow-hidden border border-gray-100 shadow-sm">
                            <img src={msg.avatar_url || '/bantahlogo.png'} alt="Bantzz" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className={`flex flex-col max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                          <div
                            className={`px-3 py-2 rounded-lg break-words text-wrap shadow-sm ${
                              msg.role === 'user'
                                ? 'bg-purple-600 text-white rounded-br-md'
                                : msg.error
                                ? 'bg-red-50 text-red-600 rounded-bl-md'
                                : 'bg-gray-100 text-gray-900 rounded-bl-md'
                            }`}
                          >
                            {msg.content}
                            {msg.image_url && (
                              <img src={msg.image_url} alt="Message attachment" className="mt-2 rounded-md max-w-full h-auto" />
                            )}
                          </div>
                          <span className="text-xs text-gray-500 mt-0.5 px-0.5">
                            {formatTime(msg.timestamp)}
                          </span>
                        </div>
                        {msg.role === 'user' && msg.avatar_url && (
                          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-white flex items-center justify-center overflow-hidden border border-gray-100 shadow-sm">
                            <img
                              src={msg.avatar_url}
                              alt="User"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                    {/* Typing Indicator */}
                    {isProcessing && (
                      <div className="flex gap-2 justify-start">
                        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-white flex items-center justify-center overflow-hidden border border-gray-100 shadow-sm">
                          <img src="/bantahlogo.png" alt="Bantzz" className="w-full h-full object-cover" />
                        </div>
                        <div className="px-3 py-2 bg-gray-100 shadow-sm rounded-lg rounded-bl-md flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce-slow" />
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce-slow delay-75" />
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce-slow delay-150" />
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
            </div>

            {/* Input Area */}
            <div className="p-3 lg:p-4 pb-4 lg:pb-5 border-t border-gray-100 bg-white sticky bottom-0 z-10">
              <form onSubmit={handleSend} className="flex items-end gap-2 max-w-lg mx-auto bg-gray-50 border border-gray-100 rounded-xl p-1.5">
                <button
                  type="button"
                  className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-purple-200"
                  aria-label="Add image"
                >
                  <ImagePlus className="w-4.5 h-4.5" />
                </button>
                <div className="flex-1">
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    className="w-full resize-none outline-none bg-transparent text-gray-800 text-sm py-1.5 placeholder-gray-400 custom-scrollbar"
                    placeholder={showWelcomeScreen ? "Ask something..." : "Type your message..."}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    disabled={isProcessing || !botpress || !conversationId}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  className={`p-1.5 ${isProcessing || !botpress || !conversationId ? 'text-gray-400' : 'text-purple-600 hover:bg-purple-50'} rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-purple-200`}
                  disabled={isProcessing || !botpress || !conversationId}
                  aria-label="Send message"
                >
                  <Send className="w-4.5 h-4.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS for scrollbar and animations */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #999;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-30%); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 1s infinite;
        }
        .delay-75 {
          animation-delay: 0.075s;
        }
        .delay-150 {
          animation-delay: 0.150s;
        }
        .w-4\\.5 { width: 1.125rem; }
        .h-4\\.5 { height: 1.125rem; }
      `}</style>
    </>
  );
};

export default Bantzz;