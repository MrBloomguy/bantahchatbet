import React, { useState, useEffect, useRef } from 'react';
import { Send, Upload, AlertTriangle, Check, X, Shield, Clock, Trophy } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDistanceToNow } from 'date-fns';
import { isScheduledDatePast } from '../utils/handlePastScheduledChallenges';

interface Message {
  id: string;
  sender_id: string | null;
  content: string;
  type: 'text' | 'image' | 'evidence' | 'system_message';
  metadata?: any;
  created_at: string;
  sender?: {
    username: string;
    avatar_url: string;
  };
}

interface Challenge {
  id: string;
  title: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'expired' | 'missed';
  amount: number; // The database only has 'amount', not 'wager_amount'
  game_type: string;
  platform: string;
  challenger_id: string;
  challenged_id: string;
  winner_id?: string;
  expires_at: string;
  created_at: string;
  completed_at?: string;
  scheduled_at?: string;
  challenger: {
    username: string;
    avatar_url: string;
  };
  challenged: {
    username: string;
    avatar_url: string;
  };
}

interface EvidenceReview {
  id: string;
  message_id: string;
  user_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  comment?: string;
  created_at: string;
}

interface EnhancedChallengeChatProps {
  challengeId: string;
  hideHeader?: boolean;
}

const EnhancedChallengeChat: React.FC<EnhancedChallengeChatProps> = ({ challengeId, hideHeader = false }) => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [evidenceReviews, setEvidenceReviews] = useState<Record<string, EvidenceReview[]>>({});
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);

  // Fetch challenge details
  useEffect(() => {
    const fetchChallengeDetails = async () => {
      try {
        console.log('Fetching challenge details for ID:', challengeId);
        const { data, error } = await supabase
          .from('challenges')
          .select(`
            id,
            title,
            status,
            amount,
            game_type,
            platform,
            challenger_id,
            challenged_id,
            winner_id,
            expires_at,
            created_at,
            completed_at,
            challenger:challenger_id(username, avatar_url),
            challenged:challenged_id(username, avatar_url)
          `)
          .eq('id', challengeId)
          .single();

        if (error) {
          console.error('Error in Supabase query:', error);
          throw error;
        }

        console.log('Challenge data received:', data);
        setChallenge(data);

        // Calculate time remaining if challenge is active or pending
        if ((data.status === 'active' || data.status === 'pending') && data.expires_at) {
          console.log('Challenge is active/pending with expiry:', data.expires_at);
          updateTimeRemaining(new Date(data.expires_at));
        }
      } catch (error) {
        console.error('Error fetching challenge details:', error);
        toast.showError('Failed to load challenge details');
      }
    };

    if (challengeId) {
      fetchChallengeDetails();
    } else {
      console.error('No challengeId provided');
    }
  }, [challengeId]);

  // Update time remaining
  useEffect(() => {
    if (!challenge || (challenge.status !== 'active' && challenge.status !== 'pending') || !challenge.expires_at) return;

    const expiryDate = new Date(challenge.expires_at);
    const interval = setInterval(() => {
      updateTimeRemaining(expiryDate);
    }, 60000); // Update every minute

    // Initial update
    updateTimeRemaining(expiryDate);

    return () => clearInterval(interval);
  }, [challenge]);

  const updateTimeRemaining = (expiryDate: Date) => {
    const now = new Date();
    console.log('Updating time remaining. Now:', now, 'Expiry:', expiryDate);

    if (now >= expiryDate) {
      console.log('Challenge has expired');
      setTimeRemaining('Expired');
      return;
    }

    const timeString = formatDistanceToNow(expiryDate, { addSuffix: true });
    console.log('Time remaining:', timeString);
    setTimeRemaining(timeString);
  };

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        // First fetch the messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('challenge_messages')
          .select('*')
          .eq('challenge_id', challengeId)
          .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;

        // Then fetch sender details for non-system messages
        const messagesWithSenders = await Promise.all((messagesData || []).map(async (message) => {
          if (!message.sender_id) {
            // It's a system message, no need to fetch sender
            return message;
          }

          // Fetch sender details
          const { data: senderData } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', message.sender_id)
            .single();

          return {
            ...message,
            sender: senderData || null
          };
        }));

        // Use the processed messages
        setMessages(messagesWithSenders || []);

        // Fetch evidence reviews
        await fetchEvidenceReviews(messagesWithSenders || []);

        scrollToBottom();
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast.showError('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Subscribe to new messages
    const subscription = supabase
      .channel(`challenge_${challengeId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'challenge_messages',
        filter: `challenge_id=eq.${challengeId}`
      }, async payload => {
        const newMessage = payload.new as Message;

        // Fetch sender details if it's not a system message
        if (newMessage.sender_id) {
          try {
            const { data } = await supabase
              .from('profiles')
              .select('username, avatar_url')
              .eq('id', newMessage.sender_id)
              .single();

            if (data) {
              newMessage.sender = data;
            }
          } catch (error) {
            console.error('Error fetching sender details:', error);
          }
        }

        // Add the message to the list
        setMessages(prev => [...prev, newMessage]);
        scrollToBottom();

        // If it's an evidence message, fetch reviews
        if (newMessage.type === 'evidence') {
          fetchEvidenceReviews([newMessage]);
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [challengeId]);

  const fetchEvidenceReviews = async (messages: Message[]) => {
    const evidenceMessages = messages.filter(m => m.type === 'evidence');
    if (evidenceMessages.length === 0) return;

    try {
      const { data, error } = await supabase
        .from('challenge_evidence_reviews')
        .select('*, reviewer:user_id(username, avatar_url)')
        .in('message_id', evidenceMessages.map(m => m.id));

      if (error) throw error;

      // Group reviews by message_id
      const reviewsByMessage: Record<string, EvidenceReview[]> = {};
      data?.forEach(review => {
        if (!reviewsByMessage[review.message_id]) {
          reviewsByMessage[review.message_id] = [];
        }
        reviewsByMessage[review.message_id].push(review);
      });

      setEvidenceReviews(prev => ({...prev, ...reviewsByMessage}));
    } catch (error) {
      console.error('Error fetching evidence reviews:', error);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !currentUser || sending) return;

    try {
      setSending(true);
      const { error } = await supabase
        .from('challenge_messages')
        .insert({
          challenge_id: challengeId,
          sender_id: currentUser.id,
          content: message,
          type: 'text'
        });

      if (error) throw error;
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.showError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${challengeId}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('challenge-evidence')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('challenge-evidence')
        .getPublicUrl(fileName);

      await supabase
        .from('challenge_messages')
        .insert({
          challenge_id: challengeId,
          sender_id: currentUser.id,
          content: publicUrl,
          type: 'evidence',
          metadata: {
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size
          }
        });

      toast.showSuccess('Evidence uploaded successfully');

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.showError('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleReviewEvidence = async (messageId: string, status: 'accepted' | 'rejected', comment?: string) => {
    if (!currentUser) return;

    try {
      const { error } = await supabase.rpc('review_challenge_evidence', {
        p_message_id: messageId,
        p_user_id: currentUser.id,
        p_status: status,
        p_comment: comment || null
      });

      if (error) throw error;

      toast.showSuccess(`Evidence ${status} successfully`);

      // Refresh evidence reviews
      const { data, error: fetchError } = await supabase
        .from('challenge_evidence_reviews')
        .select('*, reviewer:user_id(username, avatar_url)')
        .eq('message_id', messageId);

      if (fetchError) throw fetchError;

      setEvidenceReviews(prev => ({
        ...prev,
        [messageId]: data || []
      }));
    } catch (error) {
      console.error('Error reviewing evidence:', error);
      toast.showError('Failed to review evidence');
    }
  };

  const handleInitiateDispute = async () => {
    if (!disputeReason.trim() || !currentUser) return;

    try {
      const { error } = await supabase.rpc('initiate_challenge_dispute', {
        p_challenge_id: challengeId,
        p_user_id: currentUser.id,
        p_reason: disputeReason
      });

      if (error) throw error;

      toast.showSuccess('Dispute initiated successfully');
      setShowDisputeForm(false);
      setDisputeReason('');
    } catch (error) {
      console.error('Error initiating dispute:', error);
      toast.showError('Failed to initiate dispute');
    }
  };

  const handleRequestSupport = async () => {
    if (!currentUser) return;

    try {
      const { error } = await supabase.rpc('add_support_to_challenge', {
        p_challenge_id: challengeId
      });

      if (error) throw error;

      toast.showSuccess('Support requested successfully');
    } catch (error) {
      console.error('Error requesting support:', error);
      toast.showError('Failed to request support');
    }
  };

  const handleChallengeResponse = async (response: 'accepted' | 'declined') => {
    if (!currentUser || !challenge) return;

    try {
      // Update challenge status
      const { error } = await supabase
        .from('challenges')
        .update({ status: response })
        .eq('id', challengeId);

      if (error) throw error;

      // Add system message about the response
      await supabase
        .from('challenge_messages')
        .insert({
          challenge_id: challengeId,
          sender_id: null, // System message
          content: `Challenge ${response} by ${currentUser.username || 'user'}`,
          type: 'system_message'
        });

      // Update local state
      setChallenge(prev => prev ? {...prev, status: response} : null);

      toast.showSuccess(`Challenge ${response} successfully`);
    } catch (error) {
      console.error(`Error ${response} challenge:`, error);
      toast.showError(`Failed to ${response} challenge`);
    }
  };

  const renderMessage = (message: Message) => {
    const isCurrentUser = message.sender_id === currentUser?.id;
    const isSystemMessage = message.type === 'system_message';

    if (isSystemMessage) {
      return (
        <div key={message.id} className="flex justify-center my-1">
          <div className="bg-gray-200/80 text-gray-600 px-2 py-0.5 rounded text-[10px] max-w-[90%] text-center">
            {message.content}
          </div>
        </div>
      );
    }

    if (message.type === 'evidence') {
      return (
        <div key={message.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-1.5`}>
          <div className="flex items-start">
            {!isCurrentUser && message.sender && (
              <div className="mr-1.5">
                <img
                  src={message.sender.avatar_url || '/default-avatar.png'}
                  alt={message.sender.username}
                  className="w-6 h-6 rounded-full border border-gray-700"
                />
              </div>
            )}
            <div>
              <div className={`rounded-md py-1.5 px-2.5 max-w-[75%] ${isCurrentUser ? 'bg-amber-500/20 text-white' : 'bg-amber-500/20 text-white'}`}>
                <div className="text-xs mb-1.5">
                  <span className="text-amber-500 font-medium">Evidence Submitted:</span>
                </div>
                <a
                  href={message.content}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center p-1 bg-gray-800/80 rounded hover:bg-gray-700 transition-colors mb-1.5"
                >
                  <Upload className="w-3 h-3 mr-1 text-amber-500" />
                  <span className="text-xs truncate text-amber-500">
                    {message.metadata?.fileName || 'View Evidence'}
                  </span>
                </a>

                {/* Evidence review actions */}
                {currentUser && message.sender_id !== currentUser.id && (
                  <div className="mt-1 border-t border-gray-600 pt-1">
                    <div className="text-xs text-gray-400 mb-1">Review this evidence:</div>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => handleReviewEvidence(message.id, 'accepted')}
                        className="flex items-center px-2 py-1 bg-green-500/20 text-green-400 rounded-md hover:bg-green-500/30 transition-colors text-xs"
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReviewEvidence(message.id, 'rejected')}
                        className="flex items-center px-2 py-1 bg-red-500/20 text-red-400 rounded-md hover:bg-red-500/30 transition-colors text-xs"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Reject
                      </button>
                    </div>
                  </div>
                )}

                {/* Evidence reviews */}
                {evidenceReviews[message.id] && evidenceReviews[message.id].length > 0 && (
                  <div className="mt-1 border-t border-gray-600 pt-1">
                    <div className="text-xs text-gray-400 mb-1">Reviews:</div>
                    {evidenceReviews[message.id].map(review => (
                      <div key={review.id} className="text-xs flex items-start mb-1">
                        <span className={`inline-block w-2 h-2 rounded-full mt-1 mr-1 ${
                          review.status === 'accepted' ? 'bg-green-500' :
                          review.status === 'rejected' ? 'bg-red-500' : 'bg-gray-500'
                        }`}></span>
                        <div>
                          <span className="font-medium">{review.reviewer?.username || 'User'}</span>
                          <span className="mx-1">•</span>
                          <span className={
                            review.status === 'accepted' ? 'text-green-400' :
                            review.status === 'rejected' ? 'text-red-400' : 'text-gray-400'
                          }>
                            {review.status}
                          </span>
                          {review.comment && (
                            <p className="text-gray-400 mt-0.5">{review.comment}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5 ml-1">
              {new Date(message.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div key={message.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-1.5`}>
        <div className="flex items-start max-w-[80%]">
          {!isCurrentUser && message.sender && (
            <div className="mr-1.5 flex-shrink-0">
              <img
                src={message.sender.avatar_url || '/default-avatar.png'}
                alt={message.sender.username}
                className="w-6 h-6 rounded-full border border-gray-700"
              />
            </div>
          )}
          <div className="min-w-0">
            {!isCurrentUser && message.sender && (
              <div className="text-[9px] text-gray-400 mb-0.5 ml-0.5">
                {message.sender.username}
              </div>
            )}
            <div className={`rounded-lg py-1.5 px-2.5 ${
              isCurrentUser
                ? 'bg-purple-600 text-white rounded-tr-none'
                : 'bg-white text-gray-800 rounded-tl-none shadow-sm'
            }`}>
              <div className="text-xs leading-tight break-words">{message.content}</div>
            </div>
            <div className="text-[9px] text-gray-500 mt-0.5 ml-0.5 text-right">
              {new Date(message.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
          </div>
          {isCurrentUser && (
            <div className="ml-1.5 flex-shrink-0">
              <img
                src={currentUser?.avatar_url || '/default-avatar.png'}
                alt={currentUser?.username || 'You'}
                className="w-6 h-6 rounded-full border border-gray-700"
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-white">
        {/* Skeleton Header */}
        <div className="bg-white border-b border-gray-200 p-3 flex items-center justify-between animate-pulse">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gray-300"></div>
            <div className="space-y-2">
              <div className="h-4 w-32 bg-gray-300 rounded"></div>
              <div className="h-3 w-24 bg-gray-300 rounded"></div>
            </div>
          </div>
          <div className="h-8 w-20 bg-gray-300 rounded-full"></div>
        </div>

        {/* Skeleton Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
          {/* Skeleton message bubbles */}
          <div className="flex justify-start">
            <div className="w-8 h-8 rounded-full bg-gray-300 mr-2"></div>
            <div className="w-2/3 h-16 bg-gray-300 rounded-lg"></div>
          </div>

          <div className="flex justify-end">
            <div className="w-2/3 h-12 bg-gray-300 rounded-lg"></div>
          </div>

          <div className="flex justify-start">
            <div className="w-8 h-8 rounded-full bg-gray-300 mr-2"></div>
            <div className="w-1/2 h-20 bg-gray-300 rounded-lg"></div>
          </div>

          <div className="flex justify-end">
            <div className="w-3/4 h-14 bg-gray-300 rounded-lg"></div>
          </div>
        </div>

        {/* Skeleton Input Area */}
        <div className="bg-white border-t border-gray-200 p-3 animate-pulse">
          <div className="flex items-center">
            <div className="w-full h-10 bg-gray-300 rounded-full"></div>
            <div className="w-10 h-10 bg-gray-300 rounded-full ml-2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="text-center p-4 text-gray-400">
        Challenge not found or you don't have access to this chat.
      </div>
    );
  }

  // Log the challenge data to help debug
  console.log('Challenge data in chat:', challenge);

  // Ensure all required fields exist with real data
  const safeChallenge = {
    ...challenge,
    title: challenge.title || `${challenge.game_type || 'Game'} Challenge`,
    status: challenge.status || 'unknown',
    amount: challenge.amount || 0, // Only use amount since wager_amount doesn't exist
    game_type: challenge.game_type || '',
    platform: challenge.platform || '',
    challenger: challenge.challenger || { username: 'Unknown User', avatar_url: '' },
    challenged: challenge.challenged || { username: 'Unknown User', avatar_url: '' },
    created_at: challenge.created_at || new Date().toISOString(),
    expires_at: challenge.expires_at || null
  };

  // Log the safe challenge data
  console.log('Safe challenge data:', safeChallenge);

  return (
    <div className="flex flex-col h-full bg-white rounded-lg overflow-hidden">
      {/* Challenge Info Header */}
      <div className="bg-white p-3 border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="p-1 mr-2 text-gray-600 hover:text-gray-800"
              title="Go back"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div className="flex flex-col">
              <h3 className="text-base font-semibold text-gray-900">
                <span className="text-gray-500 text-sm mr-1">Title:</span>
                {safeChallenge.title || `${safeChallenge.game_type} Challenge`}
              </h3>
              <div className="flex items-center text-xs text-gray-500 mt-1">
                <div className="flex items-center">
                  <div className="bg-amber-500/20 w-2 h-2 rounded-full mr-1"></div>
                  <img
                    src={safeChallenge.challenger.avatar_url || '/default-avatar.png'}
                    alt={safeChallenge.challenger.username}
                    className="w-4 h-4 rounded-full mr-1"
                  />
                  <span className="font-bold text-gray-900">{safeChallenge.challenger.username}</span>
                </div>
                <span className="mx-1">vs</span>
                <div className="flex items-center">
                  <div className="bg-blue-500/20 w-2 h-2 rounded-full mr-1"></div>
                  <img
                    src={safeChallenge.challenged.avatar_url || '/default-avatar.png'}
                    alt={safeChallenge.challenged.username}
                    className="w-4 h-4 rounded-full mr-1"
                  />
                  <span>{safeChallenge.challenged.username}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center px-2 py-1 bg-purple-100 text-purple-600 rounded-md text-[10px] font-medium">
            <span className="text-gray-500 mr-1">Total Pool:</span>
            <span className="mr-1">₦</span>
            {(safeChallenge.amount * 2).toLocaleString()}
          </div>
        </div>

        {/* Winner info for completed challenges */}
        {safeChallenge.status === 'completed' && safeChallenge.winner_id && (
          <div className="mt-2 text-xs text-green-400 text-center">
            Winner: {safeChallenge.winner_id === safeChallenge.challenger_id ? safeChallenge.challenger.username : safeChallenge.challenged.username}
          </div>
        )}
      </div>

      {/* Challenge Info Bar */}
      <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
        <div className="flex items-center justify-between space-x-2 overflow-x-auto">
          {safeChallenge.status !== 'pending' && (
            <div className={`px-2 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
              safeChallenge.status === 'active' || safeChallenge.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
              safeChallenge.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
              safeChallenge.status === 'missed' || (safeChallenge.status === 'expired' && safeChallenge.scheduled_at && isScheduledDatePast(safeChallenge.scheduled_at)) ? 'bg-orange-500/20 text-orange-400' :
              safeChallenge.status === 'expired' ? 'bg-gray-500/20 text-gray-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {safeChallenge.status === 'expired' && safeChallenge.scheduled_at && isScheduledDatePast(safeChallenge.scheduled_at) ? 'PAST DUE' : safeChallenge.status.toUpperCase()}
            </div>
          )}
          {safeChallenge.status === 'pending' && safeChallenge.scheduled_at && isScheduledDatePast(safeChallenge.scheduled_at) && (
            <div className="px-2 py-1.5 rounded-md text-xs font-medium whitespace-nowrap bg-red-500/20 text-red-500 flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              PAST DUE
            </div>
          )}

          <div className="px-2 py-1.5 bg-gray-100 rounded-md text-xs text-gray-700 whitespace-nowrap">
            <span className="text-gray-500">Game: </span>
            <span>{safeChallenge.game_type}</span>
            {safeChallenge.platform && (
              <span className="text-gray-500"> ({safeChallenge.platform})</span>
            )}
          </div>

          <div className="flex items-center px-2 py-1.5 bg-gray-100 rounded-md text-xs text-gray-700 whitespace-nowrap">
            <Clock className="w-3 h-3 mr-1 text-gray-500" />
            {new Date(safeChallenge.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {safeChallenge.status === 'active' && (
        <div className="bg-white px-3 py-2 border-b border-gray-200 flex space-x-2">
          <button
            type="button"
            onClick={() => setShowDisputeForm(prev => !prev)}
            className="flex items-center px-3 py-1.5 bg-red-50 text-red-600 rounded-md text-xs font-medium hover:bg-red-100 transition-colors"
          >
            <AlertTriangle className="w-3 h-3 mr-1" />
            {showDisputeForm ? 'Cancel' : 'Dispute'}
          </button>

          <button
            type="button"
            onClick={handleRequestSupport}
            className="flex items-center px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md text-xs font-medium hover:bg-blue-100 transition-colors"
          >
            <Shield className="w-3 h-3 mr-1" />
            Request Support
          </button>
        </div>
      )}

      {/* Dispute Form */}
      {showDisputeForm && (
        <div className="bg-white p-3 border-b border-gray-200">
          <h4 className="text-xs font-medium text-red-600 mb-2">Initiate Dispute</h4>
          <textarea
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            placeholder="Describe the issue in detail..."
            className="w-full bg-gray-50 border border-gray-300 rounded-md p-2 text-gray-700 text-xs mb-2 focus:border-red-300 focus:ring focus:ring-red-200 focus:ring-opacity-50"
            rows={3}
          />
          <button
            type="button"
            onClick={handleInitiateDispute}
            disabled={!disputeReason.trim()}
            className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 text-xs font-medium transition-colors"
          >
            Submit Dispute
          </button>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
        {/* System message for missed/expired challenges with past scheduled dates */}
        {(safeChallenge.status === 'missed' || (safeChallenge.status === 'expired' && safeChallenge.scheduled_at && isScheduledDatePast(safeChallenge.scheduled_at))) && (
          <div className="bg-orange-50 p-3 rounded-lg mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              <span className="text-sm font-medium text-orange-700">
                Challenge past due
              </span>
            </div>
            <p className="text-xs text-orange-600 mt-1 ml-6">
              This challenge was scheduled for {safeChallenge.scheduled_at ? new Date(safeChallenge.scheduled_at).toLocaleString() : 'a time'} that has passed.
              Your funds have been refunded to your wallet.
            </p>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map(renderMessage)
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Support Icon */}
      <div className="fixed bottom-20 left-4 z-20">
        <button
          type="button"
          onClick={handleRequestSupport}
          className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
          title="Request Support"
        >
          <Shield className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 p-2 bg-white sticky bottom-0 z-10">
        <div className="flex items-center space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx"
            aria-label="Upload evidence file"
            title="Upload evidence file"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
            title="Upload evidence"
          >
            {uploading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
            )}
          </button>

          <div className="flex-1 relative">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message"
              className="w-full bg-gray-50 border border-gray-300 rounded-full px-4 py-2 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            />
          </div>

          <button
            type="button"
            onClick={handleSendMessage}
            disabled={!message.trim() || sending}
            className="p-2 text-white bg-purple-600 rounded-full disabled:opacity-50 flex items-center justify-center w-10 h-10 hover:bg-purple-700 transition-colors"
            title="Send message"
          >
            {sending ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedChallengeChat;
