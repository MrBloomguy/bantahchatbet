import React, { useState, useRef, useEffect } from 'react';
import { Send, ArrowLeft } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import UserAvatar from './UserAvatar';
import LoadingSpinner from './LoadingSpinner';
import { format } from 'date-fns';

interface Message {
    id: string;
    content: string;
    created_at: string;
    sender_id: string;
    chat_id: string;
    sender: {
        id: string;
        name: string;
        username: string;
        avatar_url?: string;
    };
}

interface OtherUser {
    id: string;
    name: string;
    username: string;
    avatar_url?: string;
}

interface ChatWindowProps {
    onNewMessageSent?: () => void;
    userId: string; // Ensure userId prop is required
}

const ChatWindow: React.FC<ChatWindowProps> = ({ onNewMessageSent, userId: otherUserId }) => {
    const { currentUser } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [chatId, setChatId] = useState<string | null>(null);
    const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
    const [ongoingChallenge, setOngoingChallenge] = useState(null); // State to store ongoing challenge details
    const [challengeDetails, setChallengeDetails] = useState<any | null>(null);
    const [timeLeft, setTimeLeft] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // --- Function to find or create chat ID (Direct Supabase Query) ---
    const findOrCreateChat = async (currentUserId: string, otherUserId: string): Promise<string | null> => {
        try {
            // 1. Check if a chat already exists between the two users
            const { data: existingChats, error: existingChatsError } = await supabase
                .from('chat_participants')
                .select('chat_id')
                .in('user_id', [currentUserId, otherUserId]) // Both users are participants
                .limit(2) // Should only return a maximum of two rows for a 1:1 chat

            if (existingChatsError) {
                console.error('Error checking for existing chats:', existingChatsError);
                return null;
            }

            if (existingChats && existingChats.length > 0) {
                // Check both users exist as participants of a same chat
                const existingChatIds = existingChats.map(chat => chat.chat_id);
                for (const chatId of existingChatIds) {
                    const { data: participants, error: participantsError } = await supabase
                        .from('chat_participants')
                        .select('user_id')
                        .eq('chat_id', chatId);

                    if (participantsError) {
                        console.error('Error fetching participants:', participantsError);
                        continue;
                    }

                    const userIds = participants.map(p => p.user_id);
                    if (userIds.includes(currentUserId) && userIds.includes(otherUserId)) {
                        return chatId;
                    }
                }
            }

            // 2. If no chat exists, create a new one
            const { data: newChat, error: newChatError } = await supabase
                .from('chats')
                .insert([{ /* You might have initial chat data here */ }])
                .select('id') // Select the new chat ID
                .single();

            if (newChatError) {
                console.error('Error creating new chat:', newChatError);
                return null;
            }

            const newChatId = newChat.id;

            // 3. Add both users as participants in the new chat
            const { error: addParticipantsError } = await supabase
                .from('chat_participants')
                .insert([
                    { chat_id: newChatId, user_id: currentUserId },
                    { chat_id: newChatId, user_id: otherUserId },
                ]);

            if (addParticipantsError) {
                console.error('Error adding participants to new chat:', addParticipantsError);
                return null;
            }

            return newChatId;
        } catch (error) {
            console.error('Error finding or creating chat:', error);
            return null;
        }
    };

    useEffect(() => {
        const initializeChat = async () => {
            if (!currentUser || !otherUserId) return;

            setLoading(true);
            try {
                const { data: userData, error: userError } = await supabase
                    .from('users_view')
                    .select('id, name, username, avatar_url')
                    .eq('id', otherUserId)
                    .single();

                if (userError) throw new Error(`Error fetching user details: ${userError.message}`);
                if (!userData) throw new Error('Other user not found.');
                setOtherUser(userData as OtherUser);

                const foundChatId = await findOrCreateChat(currentUser.id, otherUserId);
                if (!foundChatId) {
                    console.error('Could not find or create chat ID');
                    setLoading(false);
                    return;
                }
                setChatId(foundChatId);

                const { data: messagesData, error: messagesError } = await supabase
                    .from('messages')
                    .select(`
            id, content, created_at, sender_id, chat_id,
            sender:users_view(id, name, username, avatar_url)
          `)
                    .eq('chat_id', foundChatId)
                    .order('created_at', { ascending: true });

                if (messagesError) throw new Error(`Error loading messages: ${messagesError.message}`);
                setMessages(messagesData || []);
            } catch (error) {
                console.error('Error initializing chat window:', error);
            } finally {
                setLoading(false);
            }
        };

        initializeChat();
    }, [currentUser, otherUserId]);

    useEffect(() => {
        const fetchOngoingChallenge = async () => {
            if (!currentUser || !otherUserId) return;

            try {
                const { data: challenge, error } = await supabase
                    .from('challenges')
                    .select('*')
                    .eq('status', 'accepted')
                    .or(`challenger_id.eq.${currentUser.id},challenger_id.eq.${otherUserId}`)
                    .or(`challenged_id.eq.${currentUser.id},challenged_id.eq.${otherUserId}`)
                    .single();

                if (error) {
                    console.error('Error fetching ongoing challenge:', error);
                    return;
                }

                setOngoingChallenge(challenge);
            } catch (error) {
                console.error('Error fetching ongoing challenge:', error);
            }
        };

        fetchOngoingChallenge();
    }, [currentUser, otherUserId]);

    useEffect(() => {
        const fetchChallengeDetails = async () => {
            if (!chatId) return;

            try {
                const { data: challenge, error } = await supabase
                    .from('challenges')
                    .select('game_type, amount, expires_at')
                    .eq('chat_id', chatId)
                    .single();

                if (error) {
                    console.error('Error fetching challenge details:', error);
                    return;
                }

                setChallengeDetails(challenge);

                if (challenge.expires_at) {
                    const updateCountdown = () => {
                        const now = new Date();
                        const expiresAt = new Date(challenge.expires_at);
                        const diff = expiresAt.getTime() - now.getTime();

                        if (diff <= 0) {
                            setTimeLeft('Challenge expired');
                        } else {
                            const hours = Math.floor(diff / (1000 * 60 * 60));
                            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                            setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
                        }
                    };

                    updateCountdown();
                    const interval = setInterval(updateCountdown, 1000);
                    return () => clearInterval(interval);
                }
            } catch (error) {
                console.error('Error fetching challenge details:', error);
            }
        };

        fetchChallengeDetails();
    }, [chatId]);

    useEffect(() => {
        if (timeLeft === 'Challenge expired') {
            setTimeLeft('Challenge ended, winnings will be released soon or check your wallet for your payout.');
        }
    }, [timeLeft]);

    const scrollToBottom = () => {
        requestAnimationFrame(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        });
    };

    useEffect(() => {
        if (!loading) {
            scrollToBottom();
        }
    }, [messages, loading]);

    const formatTimestamp = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return format(date, 'p');
        } catch {
            return 'Invalid date';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedMessage = message.trim();

        if (!trimmedMessage || !currentUser || !chatId) {
            console.warn("Cannot send message:", { trimmedMessage, currentUser, chatId });
            return;
        }

        const optimisticMessage: Message = {
            id: `temp-${Date.now()}`,
            content: trimmedMessage,
            created_at: new Date().toISOString(),
            sender_id: currentUser.id,
            chat_id: chatId,
            sender: {
                id: currentUser.id,
                name: currentUser.user_metadata?.name || 'You',
                username: currentUser.user_metadata?.username || 'you',
                avatar_url: currentUser.user_metadata?.avatar_url,
            },
        };
        setMessages(prev => [...prev, optimisticMessage]);
        setMessage('');
        scrollToBottom();

        try {
            const { error } = await supabase
                .from('messages')
                .insert([{
                    chat_id: chatId,
                    sender_id: currentUser.id,
                    content: trimmedMessage,
                }]);

            if (error) {
                console.error('Error sending message:', error);
                setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
                setMessage(trimmedMessage);
                return;
            }

            onNewMessageSent?.();
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
            setMessage(trimmedMessage);
        }
    };

    const renderChallengeBanner = () => {
        if (!ongoingChallenge) return null;

        return (
            <div className="bg-yellow-100 text-yellow-800 p-3 text-center rounded-md shadow-md mb-4">
                <p className="font-semibold">Ongoing Challenge</p>
                <p>Game: {ongoingChallenge.game_type}</p>
                <p>Platform: {ongoingChallenge.platform}</p>
                <p>Amount: ₦{ongoingChallenge.amount.toLocaleString()}</p>
                {timeLeft && <p>Time Left: {timeLeft}</p>}
            </div>
        );
    };

    const challengeBanner = () => {
        if (!challengeDetails) return null;

        return (
            <div className="bg-yellow-100 text-yellow-800 p-3 rounded-md shadow-md mb-4">
                <p className="font-semibold">Ongoing Challenge</p>
                <p>Game: {challengeDetails.game_type}</p>
                <p>Amount: ₦{challengeDetails.amount.toLocaleString()}</p>
                {timeLeft && <p>Time Left: {timeLeft}</p>}
            </div>
        );
    };

    // --- Chat Header ---
    const chatHeader = () => {
        if (loading && !otherUser) {
            return <div className="flex items-center justify-center w-full h-16"><LoadingSpinner size="sm" /></div>;
        }

        if (otherUser) {
            return (
                <div className="bg-white h-16 px-4 py-3 flex items-center shadow-md">
                    <button onClick={() => navigate('/messages')} className="mr-2">
                        <ArrowLeft className="h-6 w-6 text-gray-500" />
                    </button>
                    <div className="flex items-center">
                        <UserAvatar src={otherUser.avatar_url || '/avatar.svg'} alt={otherUser.username} size="sm" className="mr-2" />
                        <div>
                            <h6 className="font-semibold text-gray-800">{otherUser.name}</h6>
                            {/* Add Online Status here if available */}
                        </div>
                    </div>
                </div>
            );
        }
        return (
            <div className="bg-white shadow-md p-3">
                <button onClick={() => navigate('/messages')} className="mr-2">
                    <ArrowLeft className="h-6 w-6 text-gray-500" />
                </button>
                {/* Add Loading State here */}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {chatHeader()}
            <div className="flex-grow overflow-y-auto px-4 py-2 space-y-2">
                {renderChallengeBanner()}
                {challengeBanner()}
                {loading && messages.length === 0 && (
                    <div className="flex justify-center items-center h-full">
                        <LoadingSpinner />
                    </div>
                )}
                {!loading && messages.length === 0 && (
                    <div className="flex justify-center items-center h-full">
                        <p className="text-gray-500">No messages yet. Start the conversation!</p>
                    </div>
                )}
                {messages.map(msg => {
                    const isCurrentUserSender = msg.sender_id === currentUser?.id;
                    const messageAlignment = isCurrentUserSender ? 'self-end items-end' : 'self-start items-start';
                    const messageBgColor = isCurrentUserSender ? 'bg-green-100 rounded-xl' : 'bg-white rounded-xl';
                    const messageTextColor = 'text-gray-700'; // Ensure consistent text color
                    const avatarDisplay = !isCurrentUserSender ? 'block' : 'hidden';
                    const messageMaxWidth = 'max-w-[75%]' // Restrict Message bubble width

                    return (
                        <div key={msg.id} className={`flex flex-col ${messageAlignment}`}>
                            <div className={`flex items-end space-x-2 ${messageAlignment}`}>
                                {/* Conditionally render avatar for received messages */}
                                <div className={`w-6 h-6 rounded-full overflow-hidden ${avatarDisplay}`}>
                                    <img
                                        src={msg.sender.avatar_url || '/avatar.svg'}
                                        alt={msg.sender.username}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                <div className={`px-3 py-2 ${messageMaxWidth} ${messageBgColor} ${messageTextColor} rounded-xl shadow-sm relative`}>
                                    <p className="text-sm break-words">{msg.content}</p>
                                    <span className="absolute text-xs text-gray-500 bottom-1 right-2">{formatTimestamp(msg.created_at)}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSubmit} className="bg-gray-100 px-4 py-3 border-t border-gray-200 flex items-center">
                <input
                    type="text"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-grow p-2 bg-white rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                />
                <button
                    type="submit"
                    disabled={!message.trim() || loading || !chatId}
                    className="ml-2 p-2 bg-blue-500 text-white rounded-full disabled:opacity-50 transition-opacity hover:opacity-90"
                >
                    <Send size={16} />
                </button>
            </form>
        </div>
    );
};

export default ChatWindow;