import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

interface Challenge {
  id: string;
  challenger_id: string;
  challenged_id: string;
  amount: number;
  game_type: string;
  platform: string;
  status: string;
  created_at: string;
  expires_at: string;
  challenger: {
    name: string;
    avatar_url: string;
  };
  challenged: {
    name: string;
    avatar_url: string;
  };
}

export const ChallengeList = () => {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    fetchChallenges();
  }, [activeTab]);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      
      // Map the status from UI to database values
      const statusMap: { [key: string]: string } = {
        'active': 'accepted',
        'scheduled': 'pending',
        'ended': 'completed'
      };

      const { data, error } = await supabase
        .from('challenges')
        .select(`
          *,
          challenger:challenger_id(name, avatar_url),
          challenged:challenged_id(name, avatar_url)
        `)
        .eq('status', statusMap[activeTab])
        .order('created_at', { ascending: false });

      console.log('Fetched challenges:', data);

      if (error) throw error;
      setChallenges(data || []);
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex space-x-4 mb-6">
        {['active', 'scheduled', 'ended'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg ${
              activeTab === tab
                ? 'bg-[#CCFF00] text-black'
                : 'bg-[#242538] text-white'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Challenge Cards */}
      {loading ? (
        <div className="text-white">Loading...</div>
      ) : challenges.length === 0 ? (
        <div className="text-white">No {activeTab} challenges found</div>
      ) : (
        <div className="grid gap-4">
          {challenges.map((challenge) => (
            <div
              key={challenge.id}
              onClick={() => navigate(`/challenge/${challenge.id}`)}
              className="p-4 bg-[#242538] rounded-xl hover:bg-[#2A2C42] transition-colors cursor-pointer"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-medium">
                    {challenge.challenger?.name} vs {challenge.challenged?.name}
                  </h3>
                  <span className="text-[#CCFF00]">₦{challenge.amount.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between text-sm text-white/60">
                  <span>{challenge.game_type}</span>
                  <span>{formatDate(challenge.expires_at)}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">{challenge.platform}</span>
                  <button className="text-[#CCFF00] hover:underline">
                    View Details →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
