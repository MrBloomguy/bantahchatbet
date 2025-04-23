import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

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

interface EvidenceReview {
  id: string;
  message_id: string;
  user_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  comment?: string;
  created_at: string;
  reviewer?: {
    username: string;
    avatar_url: string;
  };
}

interface UseChallengeChat {
  messages: Message[];
  loading: boolean;
  sending: boolean;
  uploading: boolean;
  evidenceReviews: Record<string, EvidenceReview[]>;
  sendMessage: (content: string) => Promise<void>;
  uploadEvidence: (file: File) => Promise<void>;
  reviewEvidence: (messageId: string, status: 'accepted' | 'rejected', comment?: string) => Promise<void>;
  initiateDispute: (reason: string) => Promise<void>;
  requestSupport: () => Promise<void>;
}

export const useChallengeChat = (challengeId: string): UseChallengeChat => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [evidenceReviews, setEvidenceReviews] = useState<Record<string, EvidenceReview[]>>({});

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('challenge_messages')
          .select(`
            *,
            sender:sender_id(username, avatar_url)
          `)
          .eq('challenge_id', challengeId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages(data || []);
        
        // Fetch evidence reviews
        await fetchEvidenceReviews(data || []);
      } catch (error) {
        console.error('Error fetching messages:', error);
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
      }, payload => {
        const newMessage = payload.new as Message;
        
        // Fetch sender details if it's not a system message
        if (newMessage.sender_id) {
          supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', newMessage.sender_id)
            .single()
            .then(({ data }) => {
              if (data) {
                newMessage.sender = data;
                setMessages(prev => [...prev, newMessage]);
              }
            });
        } else {
          // It's a system message
          setMessages(prev => [...prev, newMessage]);
        }
        
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

  const sendMessage = async (content: string) => {
    if (!content.trim() || !currentUser) {
      throw new Error('Cannot send empty message or user not authenticated');
    }
    
    try {
      setSending(true);
      const { error } = await supabase
        .from('challenge_messages')
        .insert({
          challenge_id: challengeId,
          sender_id: currentUser.id,
          content: content,
          type: 'text'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    } finally {
      setSending(false);
    }
  };

  const uploadEvidence = async (file: File) => {
    if (!file || !currentUser) {
      throw new Error('No file selected or user not authenticated');
    }

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${challengeId}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('challenge-evidence')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('challenge-evidence')
        .getPublicUrl(fileName);

      const { error } = await supabase
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

      if (error) throw error;
    } catch (error) {
      console.error('Error uploading evidence:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const reviewEvidence = async (messageId: string, status: 'accepted' | 'rejected', comment?: string) => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    try {
      const { error } = await supabase.rpc('review_challenge_evidence', {
        p_message_id: messageId,
        p_user_id: currentUser.id,
        p_status: status,
        p_comment: comment || null
      });
      
      if (error) throw error;
      
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
      throw error;
    }
  };

  const initiateDispute = async (reason: string) => {
    if (!reason.trim() || !currentUser) {
      throw new Error('Dispute reason required or user not authenticated');
    }
    
    try {
      const { error } = await supabase.rpc('initiate_challenge_dispute', {
        p_challenge_id: challengeId,
        p_user_id: currentUser.id,
        p_reason: reason
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error initiating dispute:', error);
      throw error;
    }
  };

  const requestSupport = async () => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    try {
      const { error } = await supabase.rpc('add_support_to_challenge', {
        p_challenge_id: challengeId
      });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error requesting support:', error);
      throw error;
    }
  };

  return {
    messages,
    loading,
    sending,
    uploading,
    evidenceReviews,
    sendMessage,
    uploadEvidence,
    reviewEvidence,
    initiateDispute,
    requestSupport
  };
};

export default useChallengeChat;
