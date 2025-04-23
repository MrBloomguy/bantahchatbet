import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import LoadingSpinner from './LoadingSpinner';
import EnhancedChallengeChat from './EnhancedChallengeChat';
import { Trophy, Search } from 'lucide-react';

interface Challenge {
  id: string;
  title: string;
  status: string;
  wager_amount: number;
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
}

const ChallengeChatTab: React.FC = () => {
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
        // First check if the table has the necessary columns
        const { data: tableInfo, error: tableError } = await supabase
          .from('challenges')
          .select('id')
          .limit(1);

        if (tableError) {
          console.error('Error checking challenges table:', tableError);
          toast.showError('Failed to check challenges table structure');
          setLoading(false);
          return;
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
    setSelectedChallengeId(challengeId);
    setShowMobileChat(true);

    // Update URL without navigating
    const currentPath = location.pathname;
    const isOnChallengesPage = currentPath === '/challenges';

    if (isOnChallengesPage) {
      navigate(`/challenges?chatId=${challengeId}`, { replace: true });
    } else {
      const searchParams = new URLSearchParams(location.search);
      searchParams.set('tab', 'challenges');
      searchParams.set('chatId', challengeId);
      navigate(`/messages?${searchParams.toString()}`, { replace: true });
    }
  };

  const handleBackToList = () => {
    setShowMobileChat(false);
    setSelectedChallengeId(null);

    // Update URL without navigating
    const currentPath = location.pathname;
    const isOnChallengesPage = currentPath === '/challenges';

    if (isOnChallengesPage) {
      navigate('/challenges', { replace: true });
    } else {
      const searchParams = new URLSearchParams(location.search);
      searchParams.set('tab', 'challenges');
      searchParams.delete('chatId');
      navigate(`/messages?${searchParams.toString()}`, { replace: true });
    }
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
        return 'bg-green-500/20 text-green-400';
      case 'completed':
        return 'bg-blue-500/20 text-blue-400';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-1 overflow-hidden">
      {/* Challenge List */}
      <div
        className={`w-full lg:w-1/3 lg:max-w-sm flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto ${
          showMobileChat ? 'hidden lg:block' : 'block'
        }`}
      >
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
              className="w-full pl-12 pr-4 py-2 rounded-full bg-gray-100 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
          </div>
        </div>

        <div className="flex-grow overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredChallenges.length > 0 ? (
            <div className="space-y-2 pt-1 pb-4">
              {filteredChallenges.map(challenge => {
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
                          <span
                            className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(
                              challenge.status
                            )}`}
                          >
                            {challenge.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <p className="text-xs text-gray-500 truncate">
                            <Trophy className="inline-block w-3 h-3 mr-1" />
                            {challenge.wager_amount} coins
                          </p>
                          <span className="text-xs text-gray-400">
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
      </div>
    </div>
  );
};

export default ChallengeChatTab;
