import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase-client';
import AdminLayout from '@/components/layouts/AdminLayout';
import AdminPageLayout from '@/components/layouts/AdminPageLayout';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/hooks/useToast';
import { useAdmin } from '@/hooks/useAdmin';
import EventPayoutDetails from '@/components/admin/EventPayoutDetails';

const AdminEvents: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const { getEvents, deleteEvent, markEventComplete } = useAdmin();
  const toast = useToast();
  const navigate = useNavigate();

  const loadEvents = async () => {
    setLoading(true);
    try {
      const eventsData = await getEvents();
      setEvents(eventsData);
    } catch (error) {
      console.error('Error loading events:', error);
      toast.showError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleMarkComplete = async (eventId: string, result: boolean) => {
    try {
      setLoading(true);
      
      // First, set the result
      const { error: resultError } = await supabase
        .from('events')
        .update({ result: result })
        .eq('id', eventId);

      if (resultError) throw resultError;
      
      // Then use the admin hook to mark as complete
      const success = await markEventComplete(eventId);
      
      if (success) {
        toast.showSuccess('Event marked as complete');
        await loadEvents();
      } else {
        throw new Error('Failed to mark event as complete');
      }
    } catch (error) {
      console.error('Error completing event:', error);
      toast.showError('Failed to complete event');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      setLoading(true);
      await deleteEvent(eventId);
      toast.showSuccess('Event deleted successfully');
      await loadEvents();
    } catch (error: any) {
      console.error('Error deleting event:', error);
      toast.showError(error.message || 'Failed to delete event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <AdminPageLayout title="Events">
        {loading && <Spinner />}

        {/* Desktop Table View */}
        <div className="hidden md:block">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#333]">
              <thead className="bg-[#1a1b2e]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Event</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Creator</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1b2e]">
                {events.map((event) => (
                  <React.Fragment key={event.id}>
                    <tr 
                      className={`border-b border-[#333] hover:bg-[#2a2c42] ${selectedEvent === event.id ? 'bg-[#2a2c42]' : ''}`}
                      onClick={() => setSelectedEvent(selectedEvent === event.id ? null : event.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white">{event.title}</div>
                            <div className="text-sm text-white/60">{event.category}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60">
                        {new Date(event.start_time).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white/60">
                        @{event.creator?.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          event.status === 'active' ? 'bg-green-500/20 text-green-400' :
                          event.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {event.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/events/${event.id}`);
                            }}
                            className="px-3 py-1.5 text-sm bg-[#CCFF00]/10 text-[#CCFF00] rounded-lg hover:bg-[#CCFF00]/20"
                          >
                            View
                          </button>
                          {event.status === 'active' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkComplete(event.id, true);
                              }}
                              className="px-3 py-1.5 text-sm bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20"
                            >
                              Complete
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteEvent(event.id);
                            }}
                            className="px-3 py-1.5 text-sm bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                    {selectedEvent === event.id && (
                      <tr>
                        <td colSpan={5} className="p-0">
                          <div className="p-4 bg-[#1e1f33]">
                            <EventPayoutDetails eventId={event.id} />
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-[#242538] rounded-xl p-4 space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-white font-medium">{event.title}</h3>
                  <div className="flex items-center mt-1 text-sm text-white/60">
                    <span>By @{event.creator?.username}</span>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  event.status === 'active' ? 'bg-green-500/20 text-green-400' :
                  event.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {event.status.toUpperCase()}
                </span>
              </div>

              <div>
                <p className="text-sm text-white/60">
                  {new Date(event.start_time).toLocaleString()}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-[#333]">
                <button
                  type="button"
                  onClick={() => navigate(`/events/${event.id}`)}
                  className="px-3 py-1.5 text-sm bg-[#CCFF00]/10 text-[#CCFF00] rounded-lg hover:bg-[#CCFF00]/20"
                >
                  View
                </button>
                {event.status === 'active' && (
                  <button
                    type="button"
                    onClick={() => handleMarkComplete(event.id, true)}
                    className="px-3 py-1.5 text-sm bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20"
                  >
                    Complete
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDeleteEvent(event.id)}
                  className="px-3 py-1.5 text-sm bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedEvent(selectedEvent === event.id ? null : event.id)}
                  className="px-3 py-1.5 text-sm bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20"
                >
                  {selectedEvent === event.id ? 'Hide Details' : 'Show Details'}
                </button>
              </div>
              
              {selectedEvent === event.id && event.status === 'completed' && (
                <div className="mt-4">
                  <EventPayoutDetails eventId={event.id} />
                </div>
              )}
            </div>
          ))}
        </div>

        {events.length === 0 && !loading && (
          <div className="bg-[#242538] rounded-xl p-8 text-center">
            <p className="text-white/60 text-lg">No events found</p>
          </div>
        )}
      </AdminPageLayout>
    </AdminLayout>
  );
};

export default AdminEvents;
