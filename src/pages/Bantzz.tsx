import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  ImagePlus, 
  Search, 
  History, 
  Folder, 
  Compass, 
  Sparkles, 
  Menu, 
  X, 
  ChevronDown, 
  User as UserIcon,
  ChevronRight,
  MessageCircle,
  Users
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

interface Message {
  role: 'assistant' | 'user';
  content: string;
  timestamp: string;
  avatar_url?: string | null;
  image_url?: string;
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
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!activeChatId && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `Hi! I am Bantzz, your AI chat assistant. I can help you with betting strategies, game analysis, and making informed decisions in social betting. How can I assist you today?`,
        timestamp: new Date().toISOString(),
        avatar_url: '/bantahlogo.png'
      }]);
    }
  }, [activeChatId, messages.length]);

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
    if (!messageContent || isProcessing) return;

    if (messages.length === 1 && messages[0].content.includes('Hi! I am Bantzz')) {
      setMessages([]);
    }

    const userMessage: Message = {
      role: 'user',
      content: messageContent,
      timestamp: new Date().toISOString(),
      avatar_url: currentUser?.avatar_url ?? '/avatar.svg'
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    setTimeout(() => {
      const aiResponse: Message = {
        role: 'assistant',
        content: `Acknowledged: "${messageContent}". This is a sample AI response. The backend integration is coming soon! I'll be able to help you with betting strategies, game analysis, and social betting tips.`,
        timestamp: new Date().toISOString(),
        avatar_url: '/bantahlogo.png',
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsProcessing(false);
    }, 1500);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const showWelcomeScreen = messages.length === 1 && messages[0].content.includes('Hi! I am Bantzz');

  return (
    <div className="flex h-screen bg-gray-100 font-sans antialiased overflow-hidden text-gray-900 max-w-[100vw]">
      {/* Hide DesktopNav on this page */}
      <style>{`
        @media (min-width: 1024px) {
          /* Hide the desktop nav completely */
          .lg\\:flex.fixed.left-0.top-0.bottom-0,
          .lg\\:fixed.left-0.top-0.bottom-0 {
            display: none !important;
            visibility: hidden !important;
            width: 0 !important;
            min-width: 0 !important;
            max-width: 0 !important;
            opacity: 0 !important;
            pointer-events: none !important;
          }
          /* Remove any spacing from root elements */
          html, body, #root {
            --left-nav-width: 0 !important;
            --nav-width: 0 !important;
            padding-left: 0 !important;
            margin-left: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          /* Reset container spacing */
          .app-container,
          [class*="container"],
          main,
          .flex-1,
          .flex,
          .relative,
          .absolute {
            width: 100% !important;
          }
          /* Ensure proper scaling */
          html, body {
            width: 100vw !important;
            max-width: 100vw !important;
            overflow-x: hidden !important;
          }
          /* Center content properly */
          .max-w-xl,
          .max-w-lg,
          .max-w-7xl {
            margin-left: auto !important;
            margin-right: auto !important;
            width: 100% !important;
            padding-left: 1rem !important;
            padding-right: 1rem !important;
          }
          .max-w-xl { max-width: 36rem !important; }
          .max-w-lg { max-width: 32rem !important; }
          .max-w-7xl { max-width: 80rem !important; }
          /* Remove any shadows that might be visible */
          .shadow,
          .shadow-sm,
          .shadow-md,
          .shadow-lg,
          .shadow-xl {
            box-shadow: none !important;
          }
          /* Remove any fixed positioning that might interfere */
          .fixed {
            position: relative !important;
          }
        }
      `}</style>
      
      {/* Mobile Sidebar Overlay */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden ${isSidebarOpen ? 'block' : 'hidden'}`}
        onClick={() => setIsSidebarOpen(false)}
      ></div>

      {/* Chat Sidebar with Drawer */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-100 flex flex-col shadow-lg z-50 transform lg:hidden transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Close button for mobile */}
        <div className="flex justify-end p-2">
          <button onClick={() => setIsSidebarOpen(false)} className="p-1.5 rounded-md hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search Chats */}
        <div className="px-4 py-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search chats..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#7440ff] focus:border-transparent"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Recent Chats */}
        <div className="mb-auto">
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">RECENT CHATS</h3>
          <ul className="space-y-1.5">
            {RECENT_CHATS.map(chat => (
              <li key={chat.id}>
                <button
                  onClick={() => {
                    setActiveChatId(chat.id);
                    setMessages([
                      {
                        role: 'assistant',
                        content: `You selected chat: "${chat.title}". This is a placeholder. Real chat history will load here.`,
                        timestamp: new Date().toISOString(),
                        avatar_url: '/bantahlogo.png'
                      }
                    ]);
                    setIsSidebarOpen(false); // Close sidebar on mobile after selection
                  }}
                  className={`w-full text-left p-2.5 rounded-md text-sm transition-colors ${activeChatId === chat.id ? 'bg-purple-100 text-purple-700 font-semibold' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  {chat.title}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Upgrade to Pro */}
        <div className="bg-purple-50 rounded-lg p-3 mt-5">
          <p className="font-semibold text-sm text-purple-800 mb-1.5">Upgrade to <span className="font-extrabold">PRO</span></p>
          <p className="text-xs text-purple-700 mb-2.5">Upgrade for image uploads,
            <br />
            priorities &amp; lot more Pro Search.</p>
          <button className="flex items-center justify-between w-full bg-purple-200 text-purple-800 text-xs font-semibold px-2.5 py-1.5 rounded-md hover:bg-purple-300 transition-colors">
            Learn More <span className="ml-2">&rarr;</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-white">
        <Header 
          showBackButton={true}
          showMenu={false}
          title="Chat"
          showSearch={false}
        />
        
        {/* Chat / Welcome Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 flex flex-col justify-between">
          {showWelcomeScreen ? (
            <div className="flex flex-col items-center text-center max-w-xl mx-auto py-6 lg:py-10">
              <h2 className="text-2xl md:text-4xl font-bold text-gray-800 mb-2 md:mb-3">Hello {currentUser?.email?.split('@')[0] || 'Marcus'}</h2>
              <p className="text-lg md:text-2xl text-gray-600 mb-5 md:mb-8">How can I help you today?</p>

              {/* Suggested Questions Grid - Responsive and Compact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 w-full">
                {SUGGESTED_QUESTIONS.map((item, idx) => (
                  <button
                    key={idx}
                    className="flex flex-col items-start p-3 md:p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors text-left group"
                    onClick={() => handleSend(undefined, item.title)}
                  >
                    <div className="p-2 rounded-full bg-purple-100 mb-2 group-hover:bg-purple-200 transition-colors">
                      {item.icon}
                    </div>
                    <h4 className="font-semibold text-sm text-gray-800 mb-0.5">{item.title}</h4>
                    <p className="text-xs text-gray-500">{item.description}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Active Chat Messages Area
            <div className="flex-1 w-full overflow-y-auto space-y-3 lg:space-y-4 px-0 pb-3 pt-8">
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
                          ? 'bg-purple-600 text-white rounded-br-md' // More subtle corner cut
                          : 'bg-gray-100 text-gray-900 rounded-bl-md' // More subtle corner cut
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
        </main>

        {/* Input Area (Bottom of Main Content) */}
        <div className="p-3 lg:p-4 pb-4 lg:pb-5 border-t border-gray-100">
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
                disabled={isProcessing}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                autoFocus
                maxLength={1000}
                style={{ minHeight: '20px', maxHeight: '100px', overflowY: 'auto' }} // Adjusted height limits
              />
            </div>
            <button
              type="submit"
              className="p-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-300"
              disabled={isProcessing || !input.trim()}
              aria-label="Send message"
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Custom CSS for scrollbar and bounce animation */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px; /* Slightly thinner scrollbar */
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
        /* Custom sizes for icons (e.g., w-4.5, h-4.5) if not provided by lucide-react default sizes */
        .w-4\.5 { width: 1.125rem; /* 18px */ }
        .h-4\.5 { height: 1.125rem; /* 18px */ }
      `}</style>
    </div>
  );
};

export default Bantzz;