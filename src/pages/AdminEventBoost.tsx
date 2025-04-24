import React, { useState, useEffect } from 'react';
import { Users, Plus, Minus } from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import AdminPageLayout from '../components/AdminPageLayout';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';

interface Event {
  id: string;
  title: string;
  status: string;
  start_time: string;
  display_participant_boost: number;
  participant_count: { count: number } | number;
}

const AdminEventBoost: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select(`
          id,
          title,
          status,
          start_time,
          display_participant_boost,
          participant_count:event_participants(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
      toast.showError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get the actual participant count
  const getParticipantCount = (event: Event): number => {
    if (typeof event.participant_count === 'object') {
      return event.participant_count.count || 0;
    }
    return event.participant_count || 0;
  };

  const updateBoostCount = async (eventId: string, newCount: number) => {
    if (newCount < 0) newCount = 0;

    try {
      setUpdating(eventId);
      const { error } = await supabase
        .from('events')
        .update({ display_participant_boost: newCount })
        .eq('id', eventId);

      if (error) throw error;

      // Update local state
      setEvents(events.map(event =>
        event.id === eventId
          ? { ...event, display_participant_boost: newCount }
          : event
      ));

      toast.showSuccess('Participant boost updated');
    } catch (error) {
      console.error('Error updating boost count:', error);
      toast.showError('Failed to update participant boost');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <AdminLayout>
      <AdminPageLayout
        title="Event Participant Boost"
        icon={<Users className="w-6 h-6" />}
      >
        <div className="bg-[#242538] rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            Boost Event Participant Numbers
          </h2>
          <p className="text-white/70 mb-6">
            Add virtual participants to make events appear more popular. These numbers will be added to the actual participant count shown on event cards.
          </p>

          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="space-y-4">
              {events.map(event => (
                <div key={event.id} className="bg-[#1a1b2e] p-4 rounded-lg">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-white font-medium">{event.title}</h3>
                      <div className="flex flex-wrap gap-3 mt-2 text-sm">
                        <span className="text-white/60">Status: {event.status}</span>
                        <span className="text-white/60">
                          Date: {new Date(event.start_time).toLocaleDateString()}
                        </span>
                        <span className="text-white/60">
                          Real participants: {getParticipantCount(event)}
                        </span>
                        <span className="text-[#CCFF00]">
                          Displayed total: {getParticipantCount(event) + (event.display_participant_boost || 0)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => updateBoostCount(event.id, (event.display_participant_boost || 0) - 1)}
                        disabled={updating === event.id || (event.display_participant_boost || 0) <= 0}
                        className="w-8 h-8 flex items-center justify-center bg-[#242538] text-white rounded-full hover:bg-[#2a2b42] disabled:opacity-50"
                        aria-label="Decrease participant boost"
                        title="Decrease participant boost"
                      >
                        <Minus className="w-4 h-4" />
                      </button>

                      <div className="w-16 bg-[#242538] text-white text-center py-2 rounded-lg">
                        {updating === event.id ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          event.display_participant_boost || 0
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => updateBoostCount(event.id, (event.display_participant_boost || 0) + 1)}
                        disabled={updating === event.id}
                        className="w-8 h-8 flex items-center justify-center bg-[#242538] text-white rounded-full hover:bg-[#2a2b42] disabled:opacity-50"
                        aria-label="Increase participant boost"
                        title="Increase participant boost"
                      >
                        <Plus className="w-4 h-4" />
                      </button>

                      <div className="ml-2">
                        <input
                          type="number"
                          min="0"
                          value={event.display_participant_boost || 0}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (!isNaN(value) && value >= 0) {
                              updateBoostCount(event.id, value);
                            }
                          }}
                          aria-label="Participant boost count"
                          title="Enter number of additional participants to display"
                          placeholder="Boost count"
                          className="w-20 bg-[#242538] text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CCFF00]/50"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {events.length === 0 && (
                <div className="text-center py-8 text-white/60">
                  No events found
                </div>
              )}
            </div>
          )}
        </div>
      </AdminPageLayout>
    </AdminLayout>
  );
};

export default AdminEventBoost;
