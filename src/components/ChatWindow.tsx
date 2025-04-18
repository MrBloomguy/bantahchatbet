import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
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
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const findOrCreateChat = async (currentUserId: string, otherUserId: string): Promise<string | null> => {
        try {
            const { data: existingChats, error: existingChatsError } = await supabase
                .from('chat_participants')
                .select('chat_id')
                .in('user_id', [currentUserId, otherUserId])
                .limit(2);

            if (existingChatsError) {
                console.error('Error checking for existing chats:', existingChatsError);
                return null;
            }

            if (existingChats && existingChats.length > 0) {
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

            const { data: newChat, error: newChatError } = await supabase
                .from('chats')
                .insert([{}])
                .select('id')
                .single();

            if (newChatError) {
                console.error('Error creating new chat:', newChatError);
                return null;
            }

            const newChatId = newChat.id;

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

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Messages List */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
                {loading ? (
                    <div className="flex justify-center items-center h-full">
                        <LoadingSpinner />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex justify-center items-center h-full text-gray-500">
                        No messages yet
                    </div>
                ) : (
                    messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex mb-4 ${
                                message.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'
                            }`}
                        >
                            {message.sender_id !== currentUser?.id && (
                                <UserAvatar
                                    src={message.sender.avatar_url || '/avatar.svg'}
                                    alt={message.sender.name}
                                    size="sm"
                                    className="mr-2"
                                />
                            )}
                            <div
                                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                                    message.sender_id === currentUser?.id
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-white text-gray-900'
                                }`}
                            >
                                <p className="text-sm">{message.content}</p>
                                <span className="text-xs opacity-75 mt-1 block">
                                    {format(new Date(message.created_at), 'HH:mm')}
                                </span>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSubmit} className="bg-white px-4 py-3 border-t border-gray-200">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-grow p-2 bg-gray-100 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                    />
                    <button
                        type="submit"
                        disabled={!message.trim() || loading || !chatId}
                        className="p-2 bg-purple-600 text-white rounded-full disabled:opacity-50 transition-opacity hover:opacity-90"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChatWindow;