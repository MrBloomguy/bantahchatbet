import React, { useState, useEffect } from 'react';
import {
  Users,
  Gamepad2,
  Trophy,
  Plus,
  Map,
  Zap,
  Phone,
  DollarSign,
  Search,
  X,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

// Local components
import MobileFooterNav from '../components/MobileFooterNav';
import Header from '../components/Header';
import { ChallengeList } from '../components/ChallengeList';
import ChallengeModal from '../components/ChallengeModal';
import ChallengeDetailsModal from '../components/ChallengeDetailsModal';
import { ContactsList } from '../components/ContactsList';
import ActiveContentModal from '../components/modals/ActiveContentModal';

// Hooks and contexts
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { sendChallengeNotification } from '../utils/challengeNotifications';

// Types
interface User {
  id: string;
  name: string;
  username: string;
  avatar_url: string;
  bio: string;
  status?: 'online' | 'offline';
  last_seen?: string;
  stats: {
    challenges_created: number;
    challenges_won: number;
    total_earnings: number;
  };
}

interface Challenge {
  id: string;
  challenger: {
    id: string;
    name: string;
    avatar_url: string;
  };
  challenged: {
    id: string;
    name: string;
    avatar_url: string;
  };
  amount: number;
  game_type: string;
  platform: string;
  title: string;
  rules?: string;
  required_evidence?: 'SCREENSHOT' | 'VIDEO' | 'BOTH';
  created_at: string;
  scheduled_at: string | null;
  expires_at: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'expired';
  winner_id?: string;
}

const Games: React.FC = () => {
  // Change the default tab from 'users' to 'active'
  const [activeTab, setActiveTab] = useState<'users' | 'active' | 'scheduled' | 'ended'>('active');
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showActiveModal, setShowActiveModal] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [showChallengeDetailsModal, setShowChallengeDetailsModal] = useState(false);
  const { currentUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (error) {
      return 'N/A';
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else {
      fetchChallenges();
    }
  }, [activeTab]);

  // Filter users based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = users.filter(
      user =>
        user.name.toLowerCase().includes(query) ||
        user.username.toLowerCase().includes(query)
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  // Search for users across the platform
  const searchUsers = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setFilteredUsers(users);
      return;
    }

    try {
      setSearching(true);

      // Search for users with the query
      const { data, error } = await supabase
        .from('users')
        .select('id, name, username, avatar_url')
        .or(`name.ilike.%${query}%,username.ilike.%${query}%`)
        .neq('id', currentUser?.id)
        .limit(20);

      if (error) throw error;

      if (data && data.length > 0) {
        const formattedUsers = data.map(user => ({
          id: user.id,
          name: user.name || 'Anonymous',
          username: user.username || `user_${user.id.slice(0, 8)}`,
          avatar_url: user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
          bio: '',
          status: 'offline' as const,
          stats: {
            challenges_created: 0,
            challenges_won: 0,
            total_earnings: 0
          }
        }));
        setFilteredUsers(formattedUsers);
      } else {
        setFilteredUsers([]);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearching(false);
    }
  };

  // Handle search input with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length >= 2) {
      // Debounce search for better performance
      const timeoutId = setTimeout(() => {
        searchUsers(query);
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setFilteredUsers(users);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, username, avatar_url')
        .limit(50);

      if (usersError) throw usersError;

      if (!usersData) {
        setUsers([]);
        setFilteredUsers([]);
        return;
      }

      const formattedUsers = usersData
        .filter(user => user.id !== currentUser?.id)
        .map(user => ({
          id: user.id,
          name: user.name || 'Anonymous',
          username: user.username || `user_${user.id.slice(0, 8)}`,
          avatar_url: user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
          bio: '',
          status: 'offline' as const,
          stats: {
            challenges_created: 0,
            challenges_won: 0,
            total_earnings: 0
          }
        }));

      setUsers(formattedUsers);
      setFilteredUsers(formattedUsers);
    } catch (error) {
      console.error('Error in fetchUsers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('challenges')
        .select(`
          id,
          amount,
          game_type,
          platform,
          title,
          rules,
          required_evidence,
          created_at,
          scheduled_at,
          expires_at,
          status,
          winner_id,
          challenger:challenger_id(id, name, avatar_url),
          challenged:challenged_id(id, name, avatar_url)
        `);

      switch (activeTab) {
        case 'active':
          query = query.eq('status', 'accepted');
          break;
        case 'scheduled':
          query = query
            .eq('status', 'pending')
            .not('scheduled_at', 'is', null);
          break;
        case 'ended':
          query = query.in('status', ['completed', 'expired', 'declined']);
          break;
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      setChallenges(data || []);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChallenge = (user: User) => {
    setSelectedUser(user);
    setShowChallengeModal(true);
  };

  const handleCreateChallenge = async (challengeData: any) => {
    try {
      // Show optimistic UI feedback immediately
      toast.showInfo('Creating challenge...');

      const { data: challenge, error } = await supabase
        .from('challenges')
        .insert([challengeData])
        .select()
        .single();

      if (error) throw error;

      // Send notification to challenged user with improved error handling
      const notificationResult = await sendChallengeNotification('challenge_received', {
        userId: challengeData.challenged_id,
        challengeId: challenge.id,
        challengeTitle: challengeData.title,
        amount: challengeData.amount,
        opponentName: currentUser?.name || '',
        opponentUsername: currentUser?.username || ''
      });

      if (!notificationResult.success) {
        console.warn('Challenge created but notification may be delayed:', notificationResult.error);
        // Continue anyway since the challenge was created successfully
      }

      // Refresh challenges list
      fetchChallenges();
      toast.showSuccess('Challenge created successfully!');
    } catch (error) {
      console.error('Error creating challenge:', error);
      toast.showError('Failed to create challenge');
    }
  };

  const handleChallengeResponse = async (challengeId: string, accept: boolean) => {
    try {
      // Show immediate feedback
      toast.showInfo(accept ? 'Accepting challenge...' : 'Declining challenge...');

      const { data: challenge, error } = await supabase
        .from('challenges')
        .update({ status: accept ? 'accepted' : 'declined' })
        .eq('id', challengeId)
        .select()
        .single();

      if (error) throw error;

      // Send notification to challenger with improved error handling
      const notificationResult = await sendChallengeNotification(
        accept ? 'challenge_accepted' : 'challenge_declined',
        {
          userId: challenge.challenger_id,
          challengeId: challenge.id,
          challengeTitle: challenge.title,
          amount: challenge.amount,
          opponentName: currentUser?.name || '',
          opponentUsername: currentUser?.username || ''
        }
      );

      if (!notificationResult.success) {
        console.warn('Challenge response processed but notification may be delayed:', notificationResult.error);
      }

      // Initialize chat for the challenge if accepted
      if (accept) {
        await initializeChallengeChat(challenge.id, challenge.challenger_id, challenge.challenged_id);
        toast.showSuccess('Challenge accepted! Chat initialized.');
      } else {
        toast.showSuccess('Challenge declined successfully.');
      }

      fetchChallenges();
    } catch (error) {
      console.error('Error responding to challenge:', error);
      toast.showError('Failed to respond to challenge');
    }
  };

  const initializeChallengeChat = async (challengeId: string, challengerId: string, challengedId: string) => {
    try {
      const { data: existingChat, error: existingChatError } = await supabase
        .from('chats')
        .select('id')
        .eq('challenge_id', challengeId)
        .single();

      if (existingChatError && existingChatError.code !== 'PGRST116') {
        console.error('Error checking for existing chat:', existingChatError);
        return;
      }

      if (!existingChat) {
        const { data: newChat, error: newChatError } = await supabase
          .from('chats')
          .insert({
            challenge_id: challengeId,
            participants: [challengerId, challengedId],
          })
          .select()
          .single();

        if (newChatError) {
          console.error('Error creating new chat for challenge:', newChatError);
        } else {
          console.log('Challenge chat initialized:', newChat);
        }
      }
    } catch (error) {
      console.error('Error initializing challenge chat:', error);
    }
  };

  const renderUsersList = () => (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        {users.map((user) => (
          <div
            key={user.id}
            className="bg-[#242538] rounded-xl p-3 hover:bg-[#2a2b42] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="w-10 h-10 rounded-full"
                />
                <div
                  className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#242538]
                    ${user.status === 'online' ? 'bg-[#7440ff]' : 'bg-gray-400'}`}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-white truncate">{user.name}</h3>
                  <span className="text-sm text-white/60">@{user.username}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="flex items-center gap-1 text-white/60">
                    <Trophy className="w-3.5 h-3.5 text-[#7440ff]" />
                    {user.stats.challenges_won}
                  </span>
                  <span className="flex items-center gap-1 text-white/60">
                    <Zap className="w-3.5 h-3.5 text-[#CCFF00]" />
                    {user.stats.challenges_created}
                  </span>
                  <span className="flex items-center gap-1 text-white/60">
                    <DollarSign className="w-3.5 h-3.5 text-[#CCFF00]" />
                    ₦{user.stats.total_earnings.toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleChallenge(user)}
                className="flex-shrink-0 bg-[#7440FF] text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-opacity-90 transition-colors"
              >
                Challenge
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <div className="border-t border-white/10 pt-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Invite Friends
          </h3>
          <ContactsList />
        </div>
      </div>
    </div>
  );

  const renderEmptyState = () => (
    <div className="text-center py-8">
      <Gamepad2 className="w-12 h-12 text-white/20 mx-auto mb-3" />
      <p className="text-white/60">No {activeTab} challenges found</p>
    </div>
  );

  const renderChallengesList = () => (
    <div className="space-y-3">
      {challenges.map((challenge) => {
        if (!challenge.challenger || !challenge.challenged) {
          console.warn('Skipping challenge with missing data:', challenge);
          return null;
        }

        return (
          <div
            key={challenge.id}
            onClick={() => navigate(`/messages?tab=challenges&chatId=${challenge.id}`)}
            className="bg-[#242538] rounded-xl p-4 hover:bg-[#2a2b42] transition-colors cursor-pointer"
          >
            {/* Title and Amount */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-medium">{challenge.title || 'Untitled Challenge'}</h3>
              <span className="text-[#000000] font-medium">
                ₦{challenge.amount.toLocaleString()}
              </span>
            </div>

            {/* Players */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <img
                  src={challenge.challenger.avatar_url}
                  alt={challenge.challenger.name}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-white">{challenge.challenger.name}</span>
              </div>

              <span className="text-white/60">vs</span>

              <div className="flex items-center gap-2">
                <span className="text-white">{challenge.challenged.name}</span>
                <img
                  src={challenge.challenged.avatar_url}
                  alt={challenge.challenged.name}
                  className="w-8 h-8 rounded-full"
                />
              </div>
            </div>

            {/* Game Details */}
            <div className="flex items-center justify-between text-sm">
              <div className="space-x-2">
                <span className="text-white/60">{challenge.game_type}</span>
                <span className="text-white/60">•</span>
                <span className="text-white/60">{challenge.platform}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-white/60">
                  {formatDate(challenge.scheduled_at || challenge.created_at)}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(challenge.status)}`}>
                  {challenge.status}
                </span>
                {/* Add "Ongoing Challenge" badge for active challenges */}
                {challenge.status === 'accepted' && (
                  <span className="px-2 py-1 bg-[#CCFF00] text-black text-xs font-semibold rounded-full">Ongoing Challenge</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  // Add this helper function for status colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-500';
      case 'accepted':
        return 'bg-[#7440ff]/20 text-[#7440ff]';
      case 'completed':
        return 'bg-green-500/20 text-green-500';
      case 'declined':
        return 'bg-red-500/20 text-red-500';
      case 'expired':
        return 'bg-gray-500/20 text-gray-500';
      default:
        return 'bg-white/20 text-white';
    }
  };

  const renderActiveContent = () => {
    switch (activeTab) {
      case 'users':
        return renderUsersList();
      case 'active':
        return renderChallengesList();
      case 'scheduled':
        return renderChallengesList();
      case 'ended':
        return renderChallengesList();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F7FB] flex flex-col pb-[70px]">
      <Header title="Versus" showBackButton={true} showMenu={false} />
      <div className="flex-1 flex flex-col items-center w-full">
      <div className="w-full max-w-2xl mx-auto px-2 sm:px-4 py-4">
          {/* Compact Tabs Bar */}
          <div className="flex justify-center gap-1 mb-6 bg-white rounded-xl shadow-sm p-1 overflow-x-auto">            {[
              { id: 'active', label: 'Active', icon: <Gamepad2 className="w-4 h-4" /> },
              { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
              { id: 'scheduled', label: 'Scheduled', icon: <Gamepad2 className="w-4 h-4" /> },
              { id: 'ended', label: 'Ended', icon: <Trophy className="w-4 h-4" /> }
            ].map((tab) => (
              <button
                type="button"
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[#7440ff] text-white shadow'
                    : 'bg-transparent text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
            <div className="flex items-center gap-2 ml-auto">

            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CCFF00]" />
            </div>
          ) : (
            <>
              {activeTab === 'users' && (
                <>
                  {/* Search Bar */}
                  <div className="relative mb-4">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search users to challenge..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#7440FF] focus:border-transparent"
                    />
                    {searching && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#7440FF]" />
                      </div>
                    )}
                  </div>

                  {filteredUsers.length > 0 ? (
                    <div className="flex flex-col gap-4">
                      {filteredUsers.map((user) => (
                        <div key={user.id} className="flex items-center bg-white rounded-2xl shadow-sm px-4 py-3 transition border border-transparent hover:border-[#CCFF00]/40 group">
                          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#F6F7FB] flex items-center justify-center mr-4 relative">
                            <img src={user.avatar_url} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                            <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${user.status === 'online' ? 'bg-[#CCFF00]' : 'bg-gray-400'}`}></span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900 truncate">{user.name}</span>
                              <span className="text-sm text-gray-500">@{user.username}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs mt-1">
                              <span className="flex items-center gap-1 text-gray-500">
                                <Trophy className="w-3.5 h-3.5 text-[#7440ff]" />
                                {user.stats.challenges_won}
                              </span>
                              <span className="flex items-center gap-1 text-gray-500">
                                <Zap className="w-3.5 h-3.5 text-[#7440ff]" />
                                {user.stats.challenges_created}
                              </span>
                              <span className="flex items-center gap-1 text-gray-500">
                                <DollarSign className="w-3.5 h-3.5 text-[#7440ff]" />
                                ₦{user.stats.total_earnings.toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleChallenge(user)}
                            className="flex-shrink-0 bg-[#7440ff] text-white px-4 py-1.5 rounded-full text-sm font-medium hover:bg-opacity-90 transition-colors ml-4"
                          >
                            Challenge
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16">
                      {searchQuery ? (
                        <>
                          <img src="/noti-lonely.svg" alt="No users" className="w-32 h-32 mb-4 opacity-80" />
                          <p className="text-lg font-semibold text-gray-700 mb-1">No users found matching "{searchQuery}"</p>
                          <p className="text-sm text-gray-500">Try a different search term</p>
                        </>
                      ) : (
                        <>
                          <img src="/noti-lonely.svg" alt="No users" className="w-32 h-32 mb-4 opacity-80" />
                          <p className="text-lg font-semibold text-gray-700 mb-1">No users found</p>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
              {activeTab !== 'users' && (
                challenges.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {challenges.map((challenge) => (
                      <div
                        key={challenge.id}
                        onClick={() => {
                          // For active challenges, go directly to the challenge chat
                          if (challenge.status === 'accepted') {
                            navigate(`/challenge-chat/${challenge.id}`);
                          } else if (activeTab === 'scheduled') {
                            // For scheduled challenges, show the details modal
                            setSelectedChallenge(challenge);
                            setShowChallengeDetailsModal(true);
                          } else {
                            navigate(`/messages?tab=challenges&chatId=${challenge.id}`);
                          }
                        }}
                        className="bg-white rounded-2xl shadow-sm px-4 py-3 transition border border-transparent hover:border-[#CCFF00]/40 cursor-pointer group flex flex-col gap-2">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-gray-900 font-semibold truncate">{challenge.title || 'Untitled Challenge'}</h3>
                          <span className="text-[#7440ff] font-semibold">₦{challenge.amount.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <img src={challenge.challenger.avatar_url} alt={challenge.challenger.name} className="w-8 h-8 rounded-full object-cover" />
                            <span className="text-gray-900 font-medium">{challenge.challenger.name}</span>
                          </div>
                          <span className="text-gray-400">vs</span>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-900 font-medium">{challenge.challenged.name}</span>
                            <img src={challenge.challenged.avatar_url} alt={challenge.challenged.name} className="w-8 h-8 rounded-full object-cover" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <div className="space-x-2 text-gray-500">
                            <span>{challenge.game_type}</span>
                            <span>•</span>
                            <span>{challenge.platform}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-gray-400">
                              {formatDate(challenge.scheduled_at || challenge.created_at)}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(challenge.status)}`}>
                              {challenge.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16">
                    <img src="/noti-lonely.svg" alt="No challenges" className="w-32 h-32 mb-4 opacity-80" />
                    <p className="text-lg font-semibold text-gray-700 mb-1">No {activeTab} challenges found</p>
                  </div>
                )
              )}
            </>
          )}
          {showChallengeModal && selectedUser && currentUser && (
            <ChallengeModal
              challengerId={currentUser.id}
              challengedId={selectedUser.id}
              challengedName={selectedUser.name}
              challengedUsername={selectedUser.username}
              challengedAvatar={selectedUser.avatar_url}
              onClose={() => setShowChallengeModal(false)}
              onSuccess={() => {
                setShowChallengeModal(false);
                setActiveTab('active');
              }}
            />
          )}
          {showActiveModal && (
            <ActiveContentModal
              onClose={() => setShowActiveModal(false)}
              content={renderActiveContent()}
            />
          )}
          {showChallengeDetailsModal && selectedChallenge && (
            <ChallengeDetailsModal
              challenge={selectedChallenge}
              onClose={() => setShowChallengeDetailsModal(false)}
            />
          )}
        </div>
      </div>
      <MobileFooterNav />
    </div>
  );
};

export default Games;
