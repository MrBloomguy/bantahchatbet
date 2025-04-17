import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import AdminLayout from '../layouts/AdminLayout';
import { useAdmin } from '../hooks/useAdmin';
import { useToast } from '../contexts/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';

const AdminEvents: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { getEvents, markEventComplete, processEventPayouts, deleteEvent } = useAdmin();
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

  const handleMarkComplete = async (eventId: string) => {
    try {
      await markEventComplete(eventId);
      toast.showSuccess('Event marked as complete');
      loadEvents();
    } catch (error) {
      console.error('Error completing event:', error);
      toast.showError('Failed to complete event');
    }
  };

  const handleProcessPayouts = async (eventId: string) => {
    try {
      await processEventPayouts(eventId);
      toast.showSuccess('Payouts processed successfully');
      loadEvents();
    } catch (error) {
      console.error('Error processing payouts:', error);
      toast.showError('Failed to process payouts');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent(eventId);
      toast.showSuccess('Event deleted successfully');
      loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.showError('Failed to delete event');
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
      <div className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="bg-[#242538] rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Event Management</h2>
          
          <div className="space-y-4">
            {events.map((event) => (
              <div 
                key={event.id}
                className="bg-[#1a1b2e] rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">{event.title}</h3>
                    <div className="flex items-center gap-4 mt-1">
                      <p className="text-white/60 text-sm">
                        By @{event.creator?.username}
                      </p>
                      <p className="text-white/60 text-sm">
                        {format(new Date(event.start_time), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                      <p className="text-white/60 text-sm">
                        {event.participants_count} participants
                      </p>
                      <p className="text-white/60 text-sm">
                        Points: {event.creator?.points || 0}
                      </p>
                      <p className="text-white/60 text-sm">
                        Level: {event.creator?.level || 'N/A'}
                      </p>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        event.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        event.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {event.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/events/${event.id}`)}
                      className="px-3 py-1.5 text-sm bg-[#CCFF00]/10 text-[#CCFF00] rounded-lg hover:bg-[#CCFF00]/20"
                    >
                      View
                    </button>
                    {event.status === 'active' && (
                      <button
                        onClick={() => handleMarkComplete(event.id)}
                        className="px-3 py-1.5 text-sm bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20"
                      >
                        Mark Complete
                      </button>
                    )}
                    {event.status === 'completed' && !event.payouts_processed && (
                      <button
                        onClick={() => handleProcessPayouts(event.id)}
                        className="px-3 py-1.5 text-sm bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20"
                      >
                        Process Payouts
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="px-3 py-1.5 text-sm bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20"
                    >
                      Delete
                    </button>
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
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminEvents;