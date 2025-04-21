import React, { useState, useEffect } from 'react';
import { Search, Trophy, Clock, Users, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { useChat } from '../hooks/useChat';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import LoadingSpinner from './LoadingSpinner';
import LoadingOverlay from './LoadingOverlay';
import SocialChallengeSuccess from './SocialChallengeSuccess';

interface SocialPlatform {
  id: 'twitter' | 'telegram';
  label: string;
  placeholder: string;
  prefix: string;
}

interface ChallengeData {
  title: string;
  wagerAmount: number;
  gameType: 'FIFA' | 'NBA2K' | 'OTHER';
  platform: 'PS5' | 'XBOX' | 'PC';
  expiresIn: string; // in minutes
  rules: string;
  evidence: 'SCREENSHOT' | 'VIDEO' | 'BOTH';
  category: string; // Add this if needed
}

interface User {
  id: string;
  name: string;
  username: string;
  avatar_url?: string;
  stats?: {
    wins: number;
    total_matches: number;
  };
}

const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    id: 'twitter',
    label: 'Twitter',
    placeholder: 'Enter Twitter username',
    prefix: '@'
  },
  {
    id: 'telegram',
    label: 'Telegram',
    placeholder: 'Enter Telegram username',
    prefix: '@'
  }
];

interface CreateChallengeFormProps {
  onClose: () => void;
}

interface SuccessChallenge {
  platform: string;
  username: string;
  link: string;
}

const CreateChallengeForm: React.FC<CreateChallengeFormProps> = ({
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [challengeData, setChallengeData] = useState<ChallengeData>({
    title: '',
    description: '',
    wagerAmount: 100,
    gameType: 'FIFA',
    platform: 'PS5',
    expiresIn: '30',
    rules: '',
    evidence: 'SCREENSHOT',
    category: 'Sports'
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [socialUsernames, setSocialUsernames] = useState<Record<string, string>>({
    twitter: '',
    telegram: ''
  });
  const [challengeLinks, setChallengeLinks] = useState<Record<string, string>>({
    twitter: '',
    telegram: ''
  });
  const [successChallenge, setSuccessChallenge] = useState<SuccessChallenge | null>(null);

  const { currentUser } = useAuth();
  const { wallet } = useWallet();
  const toast = useToast();

  useEffect(() => {
    // Update challenge links when usernames change
    const baseUrl = window.location.origin;
    const updatedLinks: Record<string, string> = {};

    Object.entries(socialUsernames).forEach(([platform, username]) => {
      if (username) {
        const linkData = {
          title: challengeData.title,
          amount: challengeData.wagerAmount,
          challenger: currentUser?.username,
          platform
        };
        
        const queryParams = new URLSearchParams({
          ref: typeof username === 'string' ? username : '',
          data: btoa(JSON.stringify(linkData))
        });

        updatedLinks[platform] = `${baseUrl}/challenge?${queryParams.toString()}`;
      } else {
        updatedLinks[platform] = '';
      }
    });

    setChallengeLinks(updatedLinks);
  }, [socialUsernames, challengeData.title, challengeData.wagerAmount, currentUser?.username]);

  useEffect(() => {
    // Fetch users based on search query
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .neq('id', currentUser?.id)
          .ilike('username', `%${searchQuery}%`)
          .limit(10);

        if (error) throw error;
        setUsers(data || []);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.showError('Failed to fetch users');
      }
    };

    if (searchQuery) {
      fetchUsers();
    } else {
      setUsers([]);
    }
  }, [searchQuery, currentUser?.id, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      if (!wallet || wallet.balance < challengeData.wagerAmount) {
        toast.showError('Insufficient balance');
        return;
      }

      const { error } = await supabase
        .from('challenges')
        .insert({
          challenger_id: currentUser?.id,
          amount: challengeData.wagerAmount,
          title: challengeData.title,
          game_type: challengeData.gameType,
          platform: challengeData.platform,
          expires_at: new Date(Date.now() + parseInt(challengeData.expiresIn) * 60 * 1000),
          rules: challengeData.rules,
          required_evidence: challengeData.evidence
        });

      if (error) throw error;

      // Handle social challenge success
      let socialUsername, platform;
      const socialEntries = Object.entries(socialUsernames)
        .filter(([, username]) => username)
        .slice(0, 1);

      if (socialEntries.length > 0) {
        [, socialUsername] = socialEntries[0];
        [platform] = socialEntries[0];
      }
      
      if (socialUsername && platform) {
        setSuccessChallenge({
          platform,
          username: socialUsername,
          link: challengeLinks[platform]
        });
      } else {
        toast.showSuccess('Challenge created successfully');
        onClose();
      }

    } catch (error) {
      toast.showError('Failed to create challenge');
      console.error('Error creating challenge:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async (platform: string) => {
    const link = challengeLinks[platform];
    if (link) {
      try {
        await navigator.clipboard.writeText(link);
        toast.showSuccess(`${platform} challenge link copied!`);
      } catch (error) {
        console.error('Failed to copy link:', error);
        toast.showError('Failed to copy link');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl mx-auto bg-white rounded-xl p-6 mb-20">
      {loading && <LoadingOverlay message="Sending challenge..." />}

      {/* Two Column Layout for Main Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Title & Game Info */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600">Challenge Title</label>
            <input
              type="text"
              value={challengeData.title}
              onChange={(e) => setChallengeData({...challengeData, title: e.target.value})}
              className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent text-gray-900 placeholder-gray-400"
              placeholder="e.g., FIFA 24 Match"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Game Type</label>
            <select
              value={challengeData.gameType}
              onChange={e => setChallengeData({ ...challengeData, gameType: e.target.value as any })}
              className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent text-gray-900"
              disabled={loading}
            >
              <option value="FIFA">FIFA</option>
              <option value="NBA2K">NBA2K</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Platform</label>
            <select
              value={challengeData.platform}
              onChange={e => setChallengeData({ ...challengeData, platform: e.target.value as any })}
              className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent text-gray-900"
              disabled={loading}
            >
              <option value="PS5">PS5</option>
              <option value="XBOX">XBOX</option>
              <option value="PC">PC</option>
            </select>
          </div>
        </div>
        {/* User Search & Social */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600">Search Bantah Users</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent text-gray-900 placeholder-gray-400"
                placeholder="Search by username"
                disabled={loading}
              />
            </div>
            {users.length > 0 && (
              <div className="mt-2 bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
                {users.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      setSelectedUser(user);
                      setSearchQuery('');
                      setUsers([]);
                    }}
                    className="w-full flex items-center gap-4 p-4 hover:bg-gray-100 transition-colors"
                  >
                    <img
                      src={user.avatar_url}
                      alt={user.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1 text-left">
                      <h3 className="text-gray-900 font-medium">{user.name}</h3>
                      <p className="text-gray-500 text-sm">@{user.username}</p>
                    </div>
                    {user.stats && (
                      <div className="text-right">
                        <p className="text-[#CCFF00] font-medium">
                          {user.stats.wins}/{user.stats.total_matches}
                        </p>
                        <p className="text-gray-500 text-sm">Wins</p>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          {selectedUser && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-4">
                <img
                  src={selectedUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.id}`}
                  alt={selectedUser.name}
                  className="w-12 h-12 rounded-full"
                />
                <div className="flex-1">
                  <h3 className="text-gray-900 font-medium">{selectedUser.name}</h3>
                  <p className="text-gray-500 text-sm">@{selectedUser.username}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Remove selected user"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
          )}
          {/* Social Platform Usernames */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-600">Challenge on Social Platforms</label>
            {SOCIAL_PLATFORMS.map((platform) => (
              <div key={platform.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">{platform.prefix}</span>
                    <input
                      type="text"
                      value={socialUsernames[platform.id]}
                      onChange={(e) => setSocialUsernames(prev => ({ ...prev, [platform.id]: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent text-gray-900 placeholder-gray-400"
                      placeholder={platform.placeholder}
                      disabled={loading}
                    />
                  </div>
                  {challengeLinks[platform.id] && (
                    <button
                      type="button"
                      onClick={() => handleCopyLink(platform.id)}
                      className="px-4 py-2 bg-[#CCFF00]/20 text-[#7440ff] rounded-lg hover:bg-[#CCFF00]/30 transition-colors"
                    >
                      Copy Link
                    </button>
                  )}
                </div>
                {challengeLinks[platform.id] && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-gray-500 text-sm truncate">{challengeLinks[platform.id]}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Description & Rules */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-600">Rules</label>
          <textarea
            value={challengeData.rules}
            onChange={(e) => setChallengeData({ ...challengeData, rules: e.target.value })}
            className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent text-gray-900 placeholder-gray-400 min-h-[80px]"
            placeholder="Describe the rules for this challenge (optional)"
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600">Required Evidence</label>
          <select
            value={challengeData.evidence}
            onChange={e => setChallengeData({ ...challengeData, evidence: e.target.value as any })}
            className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent text-gray-900"
            disabled={loading}
          >
            <option value="SCREENSHOT">Screenshot</option>
            <option value="VIDEO">Video</option>
            <option value="BOTH">Both</option>
          </select>
        </div>
      </div>

      {/* Wager & Expiry Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-600">Wager Amount (₦)</label>
          <input
            type="number"
            id="wagerAmount"
            aria-label="Wager amount in Naira"
            placeholder="Enter wager amount"
            min="100"
            value={challengeData.wagerAmount}
            onChange={(e) => setChallengeData({...challengeData, wagerAmount: parseInt(e.target.value)})}
            className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent text-gray-900 placeholder-gray-400"
            required
            disabled={loading}
          />
          <p className="mt-1 text-sm text-gray-500">Minimum bet: ₦100</p>
        </div>
        <div>
          <label htmlFor="expiresIn" className="block text-sm font-medium text-gray-600">Expires In (minutes)</label>
          <select
            id="expiresIn"
            name="expiresIn"
            aria-label="Challenge expiration time"
            value={challengeData.expiresIn}
            onChange={(e) => setChallengeData({...challengeData, expiresIn: e.target.value})}
            className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent text-gray-900"
            disabled={loading}
          >
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
            <option value="120">2 hours</option>
          </select>
        </div>
      </div>

      {/* Action Buttons - Fixed at bottom on mobile */}
      <div className="space-y-4 sticky bottom-[0px] bg-white p-4 rounded-t-xl shadow-lg md:relative md:bottom-0 md:shadow-none">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-[#CCFF00] focus:ring-[#CCFF00]"
            required
            disabled={loading}
          />
          <span className="text-sm text-gray-600">I accept the terms and conditions</span>
        </label>
        <button
          type="submit"
          disabled={loading || !acceptedTerms || (!selectedUser && !Object.values(socialUsernames).some(Boolean))}
          className="w-full py-4 bg-[#7440ff] text-white rounded-xl font-medium hover:bg-[#7440ff]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" color="#000000" />
              <span>Sending Challenge...</span>
            </>
          ) : (
            'Send Challenge'
          )}
        </button>
      </div>
      {successChallenge && (
        <SocialChallengeSuccess
          platform={successChallenge.platform}
          username={successChallenge.username}
          amount={challengeData.wagerAmount}
          title={challengeData.title}
          link={successChallenge.link}
          onClose={() => {
            setSuccessChallenge(null);
            onClose();
          }}
        />
      )}
    </form>
  );
};

export default CreateChallengeForm;

