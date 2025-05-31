import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import LoadingSpinner from './LoadingSpinner';
import EnhancedChallengeChat from './EnhancedChallengeChat';
import ChallengeDetailsModal from './ChallengeDetailsModal';
import { Trophy, Search, Clock, ArrowLeft, MapPin } from 'lucide-react';
import { isScheduledDatePast } from '../utils/handlePastScheduledChallenges';

interface Challenge {
  id: string;
  title: string;
  status: string | 'accepted' | 'completed' | 'declined' | 'missed' | 'pending' | 'expired'; // Fix Challenge type for modal compatibility
  amount: number; // The database only has 'amount', not 'wager_amount'
  challenger_id: string;
  challenged_id: string;
  challenger: {
    username: string;
    avatar_url: string;
  };
  challenged: {
    username: string;
    avatar_url: string;
  };
  created_at: string;
  scheduled_at?: string; // Add this if your DB supports it
  game_type?: string;
  platform?: string;
  expires_at?: string;
}

interface ChallengeChatTabProps {
  embedded?: boolean;
}

const ChallengeChatTab: React.FC<ChallengeChatTabProps> = ({ embedded = false }) => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [filteredChallenges, setFilteredChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalChallenge, setModalChallenge] = useState<Challenge | null>(null);

  // Parse query parameters to get chatId
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const chatId = searchParams.get('chatId');
    if (chatId) {
      setSelectedChallengeId(chatId);
      setShowMobileChat(true);
    } else {
      // If no chatId in URL, reset the selected challenge
      setSelectedChallengeId(null);
      setShowMobileChat(false);
    }
  }, [location.search]);

  // Fetch challenges
  useEffect(() => {
    const fetchChallenges = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);

        // First check for past scheduled challenges
        try {
          await supabase.rpc('handle_past_scheduled_challenges');
        } catch (error) {
          console.warn('Error handling past scheduled challenges:', error);
          // Continue with fetching challenges even if this fails
        }

        const { data, error } = await supabase
          .from('challenges')
          .select(`
            *,
            challenger:challenger_id(username, avatar_url),
            challenged:challenged_id(username, avatar_url)
          `)
          .or(`challenger_id.eq.${currentUser.id},challenged_id.eq.${currentUser.id}`)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setChallenges(data || []);
        setFilteredChallenges(data || []);
      } catch (error) {
        console.error('Error fetching challenges:', error);
        toast.showError('Failed to load challenges');
      } finally {
        setLoading(false);
      }
    };

    fetchChallenges();
  }, [currentUser]);

  // Filter challenges based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredChallenges(challenges);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = challenges.filter(
      challenge =>
        challenge.title?.toLowerCase().includes(query) ||
        challenge.challenger?.username.toLowerCase().includes(query) ||
        challenge.challenged?.username.toLowerCase().includes(query)
    );
    setFilteredChallenges(filtered);
  }, [searchQuery, challenges]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleChallengeClick = (challengeId: string) => {
    const challenge = filteredChallenges.find(c => c.id === challengeId);
    if (!challenge) return;
    // Only allow navigation if the challenge is yours
    if (challenge.challenger_id === currentUser?.id || challenge.challenged_id === currentUser?.id) {
      setSelectedChallengeId(challengeId);
      setShowMobileChat(true);
      // Only navigate if not already on /challenges
      if (!location.pathname.includes('/challenges')) {
        navigate(`/challenges?chatId=${challengeId}`, { replace: true });
      }
      // If on /games, do NOT navigate, just update state for in-place chat
    } else {
      setModalChallenge(challenge);
      setShowModal(true);
    }
  };

  const handleBackToList = () => {
    setShowMobileChat(false);
    setSelectedChallengeId(null);
    navigate('/challenges', { replace: true });
  };

  const getOpponentName = (challenge: Challenge) => {
    if (!currentUser) return '';
    return challenge.challenger_id === currentUser.id
      ? challenge.challenged?.username
      : challenge.challenger?.username;
  };

  const getOpponentAvatar = (challenge: Challenge) => {
    if (!currentUser) return '';
    return challenge.challenger_id === currentUser.id
      ? challenge.challenged?.avatar_url
      : challenge.challenger?.avatar_url;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'accepted':
        return 'bg-green-500/20 text-green-400';
      case 'completed':
        return 'bg-blue-500/20 text-blue-400';
      case 'cancelled':
      case 'declined':
        return 'bg-red-500/20 text-red-400';
      case 'missed':
        return 'bg-orange-500/20 text-orange-400';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'expired':
        return 'bg-gray-500/20 text-gray-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  // Remove duplicates: only include user's own challenges once
  const userChallengeIds = new Set();
  const sortedChallenges = [
    ...filteredChallenges.filter(c => {
      const isMine = c.challenger_id === currentUser?.id || c.challenged_id === currentUser?.id;
      if (isMine && !userChallengeIds.has(c.id)) {
        userChallengeIds.add(c.id);
        return true;
      }
      return false;
    }),
    ...filteredChallenges.filter(c => {
      const isMine = c.challenger_id === currentUser?.id || c.challenged_id === currentUser?.id;
      if (!isMine && !userChallengeIds.has(c.id)) {
        userChallengeIds.add(c.id);
        return true;
      }
      return false;
    })
  ];

  return (
    <div className={`flex flex-col h-full ${embedded ? 'overflow-hidden' : ''}`}>
      <div className="flex flex-1 overflow-hidden">
      {/* Challenge List */}
      <div
        className={`${embedded ? 'w-full' : 'w-full lg:w-1/3 lg:max-w-sm'} flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto ${
          showMobileChat ? 'hidden lg:block' : 'block'
        }`}
      >
        {!embedded && (
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-2">
            <div className="relative mb-2">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4">
                <Search className="h-5 w-5 text-gray-400" />
              </span>
              <input
                type="text"
                placeholder="Search challenges..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-12 pr-12 py-2 rounded-full bg-gray-100 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              />
              <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                <MapPin className="h-5 w-5 text-gray-400 cursor-pointer hover:text-purple-500 transition-colors" title="Find friends by location" />
              </span>
            </div>
          </div>
        )}

        {embedded && (
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-2">
            <div className="relative mb-2">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4">
                <Search className="h-5 w-5 text-gray-400" />
              </span>
              <input
                type="text"
                placeholder="Search challenges..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-12 pr-12 py-2 rounded-full bg-gray-100 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              />
              <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                <MapPin className="h-5 w-5 text-gray-400 cursor-pointer hover:text-purple-500 transition-colors" title="Find friends by location" />
              </span>
            </div>
          </div>
        )}

        <div className="flex-grow overflow-y-auto">
          {loading ? (
            <div className="space-y-2 p-2 animate-pulse">
              {/* Skeleton challenge items */}
              {[...Array(5)].map((_, index) => (
                <div key={index} className="p-3 mx-2 rounded-lg bg-white">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gray-300"></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div className="h-4 w-32 bg-gray-300 rounded"></div>
                        <div className="h-4 w-16 bg-gray-300 rounded-full"></div>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <div className="h-3 w-24 bg-gray-300 rounded"></div>
                        <div className="h-3 w-12 bg-gray-300 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : sortedChallenges.length > 0 ? (
            <div className="space-y-2 pt-1 pb-4">
              {sortedChallenges.map(challenge => {
                const isActive = challenge.id === selectedChallengeId;
                return (
                  <div
                    key={challenge.id}
                    className={`p-3 mx-2 rounded-lg cursor-pointer transition-colors duration-150 ${
                      isActive
                        ? 'bg-purple-100 shadow-md'
                        : 'bg-white hover:bg-gray-50/60 shadow-sm'
                    }`}
                    onClick={() => handleChallengeClick(challenge.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative flex-shrink-0">
                        <img
                          src={getOpponentAvatar(challenge) || '/avatar.svg'}
                          alt={getOpponentName(challenge)}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <span
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                            challenge.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                          }`}
                        ></span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {challenge.title || `Challenge vs @${getOpponentName(challenge)}`}
                          </h3>
                          <div className="flex items-center gap-1">
                            {challenge.status !== 'pending' && (
                              <span
                                className={`px-1.5 py-0.5 text-[10px] rounded-full ${getStatusColor(
                                  challenge.status
                                )}`}
                              >
                                {challenge.status.toUpperCase()}
                              </span>
                            )}
                            {challenge.status === 'pending' && challenge.scheduled_at && isScheduledDatePast(challenge.scheduled_at) && (
                              <span className="flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-600">
                                <Clock className="w-2 h-2 mr-0.5" />
                                Past Due
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-xs text-gray-500 truncate flex items-center">
                            <Trophy className="inline-block w-3 h-3 mr-1" />
                            <span className="bg-purple-100 text-purple-600 text-[10px] px-1 py-0.5 rounded-full mr-1">Total Pool</span>
                            ₦{(challenge.amount * 2).toLocaleString()}
                          </p>
                          <span className="text-[10px] text-gray-400">
                            {new Date(challenge.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col justify-center items-center h-64 text-center">
              <Trophy className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">
                {searchQuery
                  ? 'No matching challenges found.'
                  : 'No challenges yet. Create a challenge to start!'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Challenge Chat */}
      <div className={`flex-grow ${!showMobileChat ? 'hidden lg:block' : 'block'}`}>
        {selectedChallengeId ? (
          <div className="h-full flex flex-col">
            {showMobileChat && (
              <div className="lg:hidden flex items-center gap-2 p-4 bg-white border-b border-gray-200">
                <button
                  type="button"
                  onClick={handleBackToList}
                  className="p-2 hover:bg-gray-100 rounded-full"
                  title="Back to challenge list"
                >
                  <ArrowLeft className="w-6 h-6 text-gray-600" />
                </button>
                <div className="flex-1 font-medium">
                  {challenges.find(c => c.id === selectedChallengeId)?.title || 'Challenge Details'}
                </div>
              </div>
            )}
            <div className="flex-1 bg-gray-900">
              <EnhancedChallengeChat challengeId={selectedChallengeId} hideHeader={false} />
            </div>
          </div>
        ) : (
          <div className="hidden lg:flex items-center justify-center h-full">
            <div className="text-center">
              <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No challenge selected</h3>
              <p className="text-gray-500">
                Choose a challenge from the sidebar to view the chat
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal for non-owned challenges */}
      {showModal && modalChallenge && (
        <ChallengeDetailsModal
          challenge={modalChallenge}
          onClose={() => setShowModal(false)}
        />
      )}
      </div>
    </div>
  );
};

export default ChallengeChatTab;
