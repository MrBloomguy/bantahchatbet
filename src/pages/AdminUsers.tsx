import React, { useState, useEffect } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import { supabase } from '../lib/supabase';
import LoadingSpinner from '../components/LoadingSpinner';

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          name,
          avatar_url,
          events_joined:event_participants(event_id, event:events(title)),
          events_created:events!events_creator_id_fkey(id, title),
          challenges_as_challenger:challenges!challenges_challenger_id_fkey(id, game_type, status),
          challenges_as_challenged:challenges!challenges_challenged_id_fkey(id, game_type, status)
        `);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: 'banned' })
        .eq('id', userId);

      if (error) throw error;
      loadUsers();
    } catch (error) {
      console.error('Error banning user:', error);
    }
  };

  const handleBlockUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: 'blocked' })
        .eq('id', userId);

      if (error) throw error;
      loadUsers();
    } catch (error) {
      console.error('Error blocking user:', error);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-96">
          <LoadingSpinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="bg-[#242538] rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">User Management</h2>

          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="bg-[#1a1b2e] rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img
                      src={user.avatar_url || '/avatar.svg'}
                      alt={`${user.name || 'Unknown User'}'s avatar`}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <h3 className="text-white font-medium">{user.name || 'Unknown User'}</h3>
                      <p className="text-white/60 text-sm">Status: {user.status || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleBanUser(user.id)}
                      className="px-3 py-1.5 text-sm bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20"
                    >
                      Ban
                    </button>
                    <button
                      onClick={() => handleBlockUser(user.id)}
                      className="px-3 py-1.5 text-sm bg-yellow-500/10 text-yellow-400 rounded-lg hover:bg-yellow-500/20"
                    >
                      Block
                    </button>
                    <button
                      onClick={() => console.log('View details for', user.id)}
                      className="px-3 py-1.5 text-sm bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20"
                    >
                      View Details
                    </button>
                  </div>
                </div>

                {/* Add sections to display events joined, created, and challenges */}
                <div className="mt-4">
                  <h4 className="text-white font-semibold">Events Joined</h4>
                  <ul className="list-disc pl-5 text-white/60">
                    {user.events_joined?.length > 0 ? (
                      user.events_joined.map((event: any) => (
                        <li key={event.event_id}>{event.event?.title || 'Unknown Event'}</li>
                      ))
                    ) : (
                      <li>No events joined</li>
                    )}
                  </ul>
                </div>
                <div className="mt-4">
                  <h4 className="text-white font-semibold">Events Created</h4>
                  <ul className="list-disc pl-5 text-white/60">
                    {user.events_created?.length > 0 ? (
                      user.events_created.map((event: any) => (
                        <li key={event.id}>{event.title || 'Unknown Event'}</li>
                      ))
                    ) : (
                      <li>No events created</li>
                    )}
                  </ul>
                </div>
                <div className="mt-4">
                  <h4 className="text-white font-semibold">Challenges as Challenger</h4>
                  <ul className="list-disc pl-5 text-white/60">
                    {user.challenges_as_challenger?.length > 0 ? (
                      user.challenges_as_challenger.map((challenge: any) => (
                        <li key={challenge.id}>{challenge.game_type || 'Unknown Challenge'}</li>
                      ))
                    ) : (
                      <li>No challenges as challenger</li>
                    )}
                  </ul>
                </div>
                <div className="mt-4">
                  <h4 className="text-white font-semibold">Challenges as Challenged</h4>
                  <ul className="list-disc pl-5 text-white/60">
                    {user.challenges_as_challenged?.length > 0 ? (
                      user.challenges_as_challenged.map((challenge: any) => (
                        <li key={challenge.id}>{challenge.game_type || 'Unknown Challenge'}</li>
                      ))
                    ) : (
                      <li>No challenges as challenged</li>
                    )}
                  </ul>
                </div>
              </div>
            ))}

            {users.length === 0 && (
              <div className="text-center py-8 text-white/60">
                No users found
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;