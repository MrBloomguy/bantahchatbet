import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import AdminLayout from '../layouts/AdminLayout';
import { useAdmin } from '../hooks/useAdmin';
import { useToast } from '../contexts/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { supabase } from '../lib/supabase';

const AdminEvents: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { getEvents, deleteEvent } = useAdmin();
  const toast = useToast();
  const navigate = useNavigate();

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await getEvents();
      setEvents(data);
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
      const { error } = await supabase
        .from('events')
        .update({ 
          result: result,
          status: 'completed'
        })
        .eq('id', eventId);

      if (error) throw error;
      
      toast.showSuccess('Event marked as complete');
      loadEvents();
    } catch (error) {
      console.error('Error completing event:', error);
      toast.showError('Failed to complete event');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      // Show confirmation dialog
      if (!window.confirm('Are you sure you want to delete this event?')) {
        return;
      }

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
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Manage Events</h1>
        <div className="bg-[#242538] rounded-xl overflow-hidden">
          <table className="w-full">
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
                <tr key={event.id}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-white">{event.title}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-400">{new Date(event.start_time).toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-white">{event.creator?.username}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      event.status === 'active' ? 'bg-green-500/20 text-green-400' :
                      event.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {event.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/events/${event.id}`)}
                        className="px-3 py-1.5 text-sm bg-[#CCFF00]/10 text-[#CCFF00] rounded-lg hover:bg-[#CCFF00]/20"
                      >
                        View
                      </button>
                      {event.status === 'active' && (
                        <button
                          onClick={() => handleMarkComplete(event.id, true)}
                          className="px-3 py-1.5 text-sm bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20"
                        >
                          Complete & Process
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="px-3 py-1.5 text-sm bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminEvents;
