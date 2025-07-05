import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SupabaseContext } from '../contexts/SupabaseContext';
import defaultAvatar from '../../public/avatar.svg';
import SimpleProfileCard from '../components/SimpleProfileCard';
import { Smile, ArrowLeft } from 'lucide-react';
import { Camera, Paperclip, Image, PaperPlaneRight } from 'phosphor-react';
import UserAvatar from './UserAvatar';

interface Message {
 id: string;
 content: string;
 sender_id: string;
 receiver_id: string; // Added for filtering in subscription
 created_at: string;
 received_at?: string;
 reactions: {
  [emoji: string]: string[]; // key is emoji, value is array of user ids
 };
}

const ChatMessage: React.FC = () => {
 const [messages, setMessages] = useState<Message[]>([]);
 const [userProfiles, setUserProfiles] = useState<{ [userId: string]: any }>({});
 const [newMessage, setNewMessage] = useState('');
 const [currentUserId, setCurrentUserId] = useState<string | null>(null);
 const messagesEndRef = useRef<HTMLDivElement>(null);
 const { supabase } = useContext(SupabaseContext);
 const { chatId } = useParams<{ chatId: string }>(); // Get chatId from route params
 const navigate = useNavigate();

 // Use chatId as the recipientId
 const recipientId = chatId;

 useEffect(() => {
  if (!supabase) return;

  const fetchCurrentUser = async () => {
   const { data: { session } } = await supabase.auth.getSession();
   if (session?.user?.id) {
    setCurrentUserId(session.user.id);
   } else {
    console.error('User not logged in');
    // Handle case where user is not logged in
   }
  };

  fetchCurrentUser();
 }, [supabase]);

 useEffect(() => {
  // Ensure recipientId is a valid UUID before proceeding (basic check)
  if (!supabase || !currentUserId || !recipientId /* Removed placeholder check */) {
   // Add a more specific check for UUID validity if needed
   if (!recipientId) {
    console.warn('Recipient ID is missing or invalid from route params.');
   } else {
    console.warn('Missing supabase or currentUserId');
   }
   return;
  }

  const getUserProfile = async (userId: string) => {
   if (userProfiles[userId]) {
    return userProfiles[userId];
   }
   const { data, error } = await supabase
    .from('users')
    .select('id, name, username, avatar_url')
    .eq('id', userId)
    .single();
   if (error) {
    console.error('Error fetching user profile for ID:', userId, error);
    return null;
   }
   setUserProfiles((prev) => ({ ...prev, [userId]: data }));
   return data;
  };

  // Fetch recipient profile specifically for the header
  getUserProfile(recipientId);

  const fetchMessages = async () => {
   console.log(`Fetching messages between ${currentUserId} and ${recipientId}`); // Debug log
   const { data, error } = await supabase
    .from('private_messages')
    .select('id, content, sender_id, created_at, reactions, receiver_id') // Include receiver_id
    .order('created_at', { ascending: true })
    .or(
     `and(sender_id.eq.${currentUserId},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${currentUserId})`
    );

   if (error) {
    console.error('Error fetching private messages:', error); // Log the specific error
   } else {
    setMessages(data || []);
    data?.forEach(async (message) => {
     if (!userProfiles[message.sender_id]) {
      await getUserProfile(message.sender_id);
     }
    });
   }
  };

  fetchMessages();

  // Corrected Subscription using .channel()
  const messageSubscription = supabase
   .channel(`private_messages:${currentUserId}:${recipientId}`) // Unique channel name
   .on(
    'postgres_changes',
    {
     event: 'INSERT',
     schema: 'public',
     table: 'private_messages',
    },
    (payload) => {
     const newMessageData = payload.new as Message;
     if (
      newMessageData &&
      ((newMessageData.sender_id === currentUserId && newMessageData.receiver_id === recipientId) ||
       (newMessageData.sender_id === recipientId && newMessageData.receiver_id === currentUserId))
     ) {
      console.log('New message received via subscription:', newMessageData);
      if (!userProfiles[newMessageData.sender_id]) {
       getUserProfile(newMessageData.sender_id);
      }
      setMessages((oldMessages) => [...oldMessages, newMessageData]);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
     }
    }
   )
   .on(
    'postgres_changes',
    {
     event: 'UPDATE',
     schema: 'public',
     table: 'private_messages',
    },
    (payload) => {
     const updatedMessage = payload.new as Message;
     if (
      updatedMessage &&
      ((updatedMessage.sender_id === currentUserId && updatedMessage.receiver_id === recipientId) ||
       (updatedMessage.sender_id === recipientId && updatedMessage.receiver_id === currentUserId))
     ) {
      console.log('Message updated via subscription:', updatedMessage);
      setMessages((oldMessages) =>
       oldMessages.map((msg) => (msg.id === updatedMessage.id ? updatedMessage : msg))
      );
     }
    }
   )
   .subscribe((status, err) => {
    if (err) {
     console.error('Subscription error:', err);
    }
    console.log('Subscription status:', status);
   });

  return () => {
   if (messageSubscription) {
    supabase.removeChannel(messageSubscription);
   }
  };
 }, [supabase, recipientId, currentUserId, userProfiles]);

 const sendMessage = async (text: string) => {
    if (!supabase || text.trim() === '' || !currentUserId || !recipientId) {
      console.error('Cannot send message: Invalid parameters');
      return;
    }

    // Optimistically add message to UI
    const tempId = crypto.randomUUID();
    const tempMessage = {
      id: tempId,
      content: text,
      sender_id: currentUserId,
      created_at: new Date().toISOString(),
      reactions: {}
    };
    setMessages(prev => [...prev, tempMessage]);

    const { error } = await supabase.rpc('send_private_message', {
      p_content: text,
      p_receiver_id: recipientId,
      p_sender_id: currentUserId,
    });

  if (error) {
   console.error('Error sending message:', error);
  } else {
   setNewMessage(''); // Clear input on success
  }
 };

 const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === 'Enter') {
   sendMessage(newMessage);
  }
 };

 // --- MessageItem Component ---
 const MessageItem: React.FC<{ message: Message }> = ({ message }) => {
  const [showProfileCard, setShowProfileCard] = useState(false);
  const isSelf = message.sender_id === currentUserId;
  const senderProfile = userProfiles[message.sender_id];
  const [showReactionPicker, setShowReactionPicker] = useState(false)

  const handleReactionClick = async (emoji: string) => {
   if (!supabase || !currentUserId) return;

   const existingReactions = message.reactions || {};
   const usersWhoReacted = existingReactions[emoji] || [];
   const userHasReacted = usersWhoReacted.includes(currentUserId);
   let updatedReactions = { ...existingReactions };

   if (userHasReacted) {
    updatedReactions[emoji] = usersWhoReacted.filter((userId) => userId !== currentUserId);
    if (updatedReactions[emoji].length === 0) {
     delete updatedReactions[emoji];
    }
   } else {
    updatedReactions[emoji] = [...usersWhoReacted, currentUserId];
   }

   const { data, error } = await supabase
    .from('private_messages')
    .update({ reactions: updatedReactions })
    .eq('id', message.id)
    .select('id, content, sender_id, created_at, reactions, receiver_id');

   if (error) {
    console.error('Error adding/removing reaction:', error);
   }
   setShowReactionPicker(false);
  };

  const ReactionsDisplay: React.FC<{ reactions: { [emoji: string]: string[] } | null | undefined }> = ({ reactions }) => {
   if (!reactions || Object.keys(reactions).length === 0) {
    return null;
   }

   return (
    <div className="flex space-x-1 mt-1">
     {Object.entries(reactions).map(([emoji, users]) => (
      users.length > 0 && (
       <span
        key={emoji}
        className="cursor-pointer px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-700 text-xs flex items-center"
        title={`Reacted by: ${users.length} user(s)`}
        onClick={() => handleReactionClick(emoji)}
       >
        {emoji} {users.length}
       </span>
      )
     ))}
    </div>
   );
  };

  return (
   <div className={`flex ${isSelf ? 'justify-end' : 'justify-start'} items-start my-2 group relative`}>
    {!isSelf && (
     <div
      className="relative mr-2 flex-shrink-0"
      onClick={(e) => {
        e.stopPropagation();
        console.log('Avatar container clicked, toggling profile card');
        setShowProfileCard(!showProfileCard);
      }}
     >
      <UserAvatar
       src={senderProfile?.avatar_url || defaultAvatar}
       alt={senderProfile?.name || "Sender"}
       size="sm"
       points={senderProfile?.points || 0}
       showLevelBadge={true}
       className="cursor-pointer"
      />
      {showProfileCard && senderProfile && (
       <div
         className="absolute left-10 -top-2 z-10 w-max"
         onClick={(e) => {
           e.stopPropagation(); // Prevent event bubbling
           console.log('Profile card container clicked');
         }}
       >
        <SimpleProfileCard
          user={{
            id: senderProfile.id,
            name: senderProfile.name || senderProfile.username || 'User',
            username: senderProfile.username || 'user',
            avatar_url: senderProfile.avatar_url,
            points: senderProfile.points || 0,
            followers_count: senderProfile.followers_count || 0,
            stats: {
              events_won: senderProfile.stats?.events_won || 0,
              total_earnings: senderProfile.stats?.total_earnings || 0
            }
          }}
          onClose={() => {
            console.log('Closing profile card from ChatMessage');
            setShowProfileCard(false);
          }}
        />
       </div>
      )}
     </div>
    )}

    <div className={`flex flex-col max-w-[75%] ${isSelf ? 'items-end' : 'items-start'}`}>
     <div
      className={`relative py-2 px-3 rounded-lg shadow-sm ${isSelf ? 'bg-blue-500 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none'}`}
      onMouseEnter={() => setShowReactionPicker(true)}
      onMouseLeave={() => setShowReactionPicker(false)}
     >
      <p className="text-sm break-words">{message.content}</p>
      {showReactionPicker && (
       <div className={`absolute ${isSelf ? 'left-0 -top-8' : 'right-0 -top-8'} z-20 bg-white shadow-md rounded-full p-1 flex space-x-1`}>
        {['👍', '❤️', '😂', '😮', '😢', '😡'].map((emoji) => (
         <button
          key={emoji}
          className="p-1 hover:bg-gray-200 rounded-full text-lg transition-transform duration-100 ease-in-out transform hover:scale-125"
          onClick={() => handleReactionClick(emoji)}
         >
          {emoji}
         </button>
        ))}
       </div>
      )}
      <ReactionsDisplay reactions={message.reactions} />
     </div>
     <span className="text-xs text-gray-500 mt-1">{new Date(message.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
    </div>

    {isSelf && (
     <div className="relative ml-2 flex-shrink-0">
      {/* Optional: Add avatar for self messages */}
     </div>
    )}
   </div>
  );
 };

 // --- MessageInput Component with Buttons ---
 const MessageInput: React.FC = () => (
  <div className="bg-white py-2 px-4 flex items-center border-t border-gray-200 space-x-2">
   {/* Emoji Button */}
   <button className="text-gray-400 hover:text-gray-600 p-1">
    <Smile size={24} />
   </button>
   {/* Attach File Button */}
   <button className="text-gray-400 hover:text-gray-600 p-1">
    <Paperclip size={24} />
   </button>
   {/* Image Button */}
   <button className="text-gray-400 hover:text-gray-600 p-1">
    <Image size={24} />
   </button>
   {/* Camera Button */}
   <button className="text-gray-400 hover:text-gray-600 p-1">
    <Camera size={24} />
   </button>
   {/* Text Input */}
   <input
    type="text"
    className="flex-1 py-2 px-3 rounded-full bg-gray-50 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-300"
    placeholder="Start a message"
    value={newMessage}
    onChange={(e) => setNewMessage(e.target.value)}
    onKeyDown={handleKeyDown}
   />
   {/* Send Button */}
   <button
    onClick={() => sendMessage(newMessage)} // Call sendMessage onClick
    disabled={!newMessage.trim()} // Disable if input is empty
    className="p-2 bg-blue-500 text-white rounded-full disabled:opacity-50 hover:bg-blue-600"
   >
    <PaperPlaneRight size={20} weight="fill" />
   </button>
  </div>
 );

 const recipientProfile = recipientId ? userProfiles[recipientId] : null;

 return (
  <div className="flex flex-col h-screen bg-gray-50">
   {/* Updated Header Section */}
   <header className="bg-white border-b border-gray-200 p-3 flex items-center justify-between sticky top-0 z-10">
    <div className="flex items-center space-x-2">
     {/* Back Button */}
     <button onClick={() => navigate(-1)} className="p-1 text-gray-600 hover:text-gray-800">
      <ArrowLeft size={22} />
     </button>
     {/* Recipient Info */}
     {recipientProfile ? (
      <div className="flex items-center space-x-3 cursor-pointer" /* onClick could navigate to profile */ >
       <UserAvatar
        src={recipientProfile.avatar_url || defaultAvatar}
        alt={recipientProfile.name || 'Recipient'}
        size="md"
        points={recipientProfile.points || 0}
        showLevelBadge={true}
       />
       <div>
        <h2 className="font-semibold text-gray-800 text-sm leading-tight">{recipientProfile.name || recipientProfile.username || 'Chat'}</h2>
        {/* Placeholder for Online Status */}
        <p className="text-xs text-gray-500 leading-tight">Online</p>
       </div>
      </div>
     ) : (
      <div className="flex items-center space-x-3">
       <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse"></div>
       <div>
        <div className="h-4 bg-gray-200 rounded w-24 mb-1 animate-pulse"></div>
        <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
       </div>
      </div>
     )}
    </div>
    {/* Right-side Action Icons (Placeholder) */}
    <div className="flex items-center space-x-2">
     {/* Example: <button className="p-1 text-gray-600 hover:text-gray-800"><Phone size={22} /></button> */}
     {/* Example: <button className="p-1 text-gray-600 hover:text-gray-800"><VideoCamera size={22} /></button> */}
    </div>
   </header>

   {/* Message List */}
   <div className="flex-1 overflow-y-auto p-4">
    {messages.map((message) => (
     <MessageItem key={message.id} message={message} />
    ))}
    <div ref={messagesEndRef} />
   </div>

   {/* Message Input Area */}
   <MessageInput />
  </div>
 );
};
export default ChatMessage;