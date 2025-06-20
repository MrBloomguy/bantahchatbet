import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import UserAvatar from '../../components/UserAvatar';
import UserLevelBadge from '../../components/UserLevelBadge';

interface UserProfile {
  id: string;
  username: string;
  name: string;
  avatar_url: string | null;
  reputation_score: number;
  bio?: string;
}

interface Event {
  id: string;
  title: string;
  created_at: string;
  status: string;
}

interface Challenge {
  id: string;
  title: string;
  created_at: string;
  status: string;
}

const TABS = ["Events", "Challenges"];

const PublicProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState("Events");
  const [events, setEvents] = useState<Event[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingChallenges, setLoadingChallenges] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setNotFound(false);
      const { data, error } = await supabase
        .from('users')
        .select('id, username, name, avatar_url, reputation_score, bio')
        .eq('username', username)
        .single();
      if (error || !data) {
        setNotFound(true);
        setUser(null);
      } else {
        setUser(data);
      }
      setLoading(false);
    };
    if (username) fetchUser();
  }, [username]);

  useEffect(() => {
    if (!user) return;
    // Fetch events
    const fetchEvents = async () => {
      setLoadingEvents(true);
      const { data, error } = await supabase
        .from('events')
        .select('id, title, created_at, status')
        .or(`creator_id.eq.${user.id},participants.cs.{${user.id}}`)
        .order('created_at', { ascending: false })
        .limit(10);
      setEvents(data || []);
      setLoadingEvents(false);
    };
    // Fetch challenges
    const fetchChallenges = async () => {
      setLoadingChallenges(true);
      const { data, error } = await supabase
        .from('challenges')
        .select('id, title, created_at, status')
        .or(`creator_id.eq.${user.id},participants.cs.{${user.id}}`)
        .order('created_at', { ascending: false })
        .limit(10);
      setChallenges(data || []);
      setLoadingChallenges(false);
    };
    fetchEvents();
    fetchChallenges();
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="w-20 h-20 rounded-full bg-gray-200 animate-pulse mb-4" />
        <div className="h-4 w-32 bg-gray-200 rounded mb-2 animate-pulse" />
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  if (notFound || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white text-gray-500">
        <div className="text-2xl font-bold mb-2">User Not Found</div>
        <div>The profile you are looking for does not exist.</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-white p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-6 flex flex-col items-center mb-6">
        <UserAvatar src={user.avatar_url || '/bantahlogo.png'} alt={user.username} size="xl" />
        <h2 className="mt-4 text-2xl font-bold text-gray-900">{user.name || user.username}</h2>
        <div className="text-gray-500 text-sm mb-2">@{user.username}</div>
        <UserLevelBadge points={user.reputation_score} size="md" showLabel={true} />
        {user.bio && <div className="mt-2 text-center text-gray-700 text-sm">{user.bio}</div>}
      </div>
      <div className="w-full max-w-md">
        <div className="flex border-b mb-4">
          {TABS.map(tab => (
            <button
              key={tab}
              className={`flex-1 py-2 text-center font-semibold transition-colors ${activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <div>
          {activeTab === 'Events' && (
            <div>
              {loadingEvents ? (
                <div>
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3 py-3 border-b last:border-b-0 animate-pulse">
                      <div className="w-10 h-10 bg-gray-200 rounded" />
                      <div className="flex-1">
                        <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
                        <div className="h-3 w-20 bg-gray-100 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : events.length === 0 ? (
                <div className="text-gray-400 text-center py-8">No events found.</div>
              ) : (
                <ul>
                  {events.map(event => (
                    <li key={event.id} className="flex items-center space-x-3 py-3 border-b last:border-b-0">
                      <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center text-blue-600 font-bold text-lg">
                        E
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{event.title}</div>
                        <div className="text-xs text-gray-400">{new Date(event.created_at).toLocaleDateString()}</div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${event.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{event.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {activeTab === 'Challenges' && (
            <div>
              {loadingChallenges ? (
                <div>
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-3 py-3 border-b last:border-b-0 animate-pulse">
                      <div className="w-10 h-10 bg-gray-200 rounded" />
                      <div className="flex-1">
                        <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
                        <div className="h-3 w-20 bg-gray-100 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : challenges.length === 0 ? (
                <div className="text-gray-400 text-center py-8">No challenges found.</div>
              ) : (
                <ul>
                  {challenges.map(challenge => (
                    <li key={challenge.id} className="flex items-center space-x-3 py-3 border-b last:border-b-0">
                      <div className="w-10 h-10 bg-yellow-100 rounded flex items-center justify-center text-yellow-600 font-bold text-lg">
                        C
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{challenge.title}</div>
                        <div className="text-xs text-gray-400">{new Date(challenge.created_at).toLocaleDateString()}</div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${challenge.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{challenge.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicProfilePage;
