import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, Clock, Zap } from 'lucide-react';
import Header from '../components/Header';
import MobileFooterNav from '../components/MobileFooterNav';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';

const ChallengeDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [challenge, setChallenge] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'N/A';
    }
  };

  const navigateToChallengeChat = () => {
    if (challenge && challenge.id) {
      navigate(`/messages?tab=challenges&chatId=${challenge.id}`);
    }
  };

  useEffect(() => {
    const fetchChallengeDetails = async () => {
      if (!id) {
        setError('Invalid challenge ID');
        setLoading(false);
        return;
      }

      try {
        // Add console.log to debug the query
        console.log('Fetching challenge with ID:', id);
        
        const { data, error } = await supabase
          .from('challenges')
          .select(`
            *,
            challenger:challenger_id(*),
            challenged:challenged_id(*)
          `)
          .eq('id', id)
          .single();

        // Add console.log to see the response
        console.log('Challenge data received:', data);
        console.log('Error if any:', error);

        if (error) throw error;
        if (!data) {
          setError('Challenge not found');
          return;
        }

        setChallenge(data);
      } catch (err) {
        console.error('Error fetching challenge:', err);
        setError('Failed to load challenge details');
      } finally {
        setLoading(false);
      }
    };

    fetchChallengeDetails();
  }, [id]);

  // Add this debug log
  console.log('Current challenge state:', challenge);

  if (loading) return <LoadingSpinner />;
  if (error) return (
    <div className="p-4 text-red-500 bg-red-100 rounded-lg">
      {error}
    </div>
  );
  if (!challenge) return (
    <div className="p-4 text-white bg-[#242538] rounded-lg">
      No challenge found
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-[#242538] rounded-xl p-6 space-y-6">
        {/* Back button */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/60 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">
            {challenge.title || 'Challenge Details'}
          </h1>
          <span className="text-[#CCFF00] text-xl font-bold">
            ₦{challenge.amount?.toLocaleString() || 0}
          </span>
        </div>

        {/* Players */}
        <div className="flex items-center justify-between bg-[#1a1b2e] p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <img 
              src={challenge.challenger?.avatar_url} 
              alt="" 
              className="w-12 h-12 rounded-full"
            />
            <div>
              <p className="text-white font-medium">{challenge.challenger?.name}</p>
              <p className="text-sm text-white/60">Challenger</p>
            </div>
          </div>
          <div className="text-white/60">VS</div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-white font-medium">{challenge.challenged?.name}</p>
              <p className="text-sm text-white/60">Challenged</p>
            </div>
            <img 
              src={challenge.challenged?.avatar_url} 
              alt="" 
              className="w-12 h-12 rounded-full"
            />
          </div>
        </div>

        {/* Game Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#1a1b2e] p-4 rounded-lg">
            <p className="text-white/60 mb-1">Game Type</p>
            <p className="text-white">{challenge.game_type || 'Not specified'}</p>
          </div>
          <div className="bg-[#1a1b2e] p-4 rounded-lg">
            <p className="text-white/60 mb-1">Platform</p>
            <p className="text-white">{challenge.platform || 'Not specified'}</p>
          </div>
        </div>

        {/* Rules */}
        {challenge.rules && (
          <div className="bg-[#1a1b2e] p-4 rounded-lg">
            <p className="text-white/60 mb-2">Rules</p>
            <p className="text-white whitespace-pre-wrap">{challenge.rules}</p>
          </div>
        )}

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#1a1b2e] p-4 rounded-lg">
            <p className="text-white/60 mb-1">Created</p>
            <p className="text-white">
              {challenge.created_at ? formatDate(challenge.created_at) : 'N/A'}
            </p>
          </div>
          <div className="bg-[#1a1b2e] p-4 rounded-lg">
            <p className="text-white/60 mb-1">Expires</p>
            <p className="text-white">
              {challenge.expires_at ? formatDate(challenge.expires_at) : 'N/A'}
            </p>
          </div>
        </div>

        {/* Status */}
        <div className="bg-[#1a1b2e] p-4 rounded-lg">
          <p className="text-white/60 mb-1">Status</p>
          <p className="text-white capitalize">{challenge.status || 'Unknown'}</p>
        </div>

        {/* Navigate to Challenge Chat */}
        <button 
          onClick={navigateToChallengeChat}
          className="bg-[#CCFF00] text-black px-4 py-2 rounded-lg font-medium hover:bg-opacity-90 transition"
        >
          Go to Challenge Chat
        </button>
      </div>
    </div>
  );
};

export default ChallengeDetails;
