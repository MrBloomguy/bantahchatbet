import React, { useState, useEffect } from 'react';
import { Dialog } from '@radix-ui/react-dialog';
import { useSupabase } from '../../contexts/SupabaseContext';
import { useToast } from '../../contexts/ToastContext';
import { X } from 'lucide-react';
import LoadingSpinner from '../LoadingSpinner';
import EventStartedModal from './EventStartedModal';

interface EditEventModalProps {
  event: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditEventModal({ event, isOpen, onClose, onSuccess }: EditEventModalProps) {
  const [formData, setFormData] = useState({
    title: event.title || '',
    description: event.description || '',
    start_time: event.start_time || '',
    end_time: event.end_time || '',
  });
  const [loading, setLoading] = useState(false);
  const [showStartedModal, setShowStartedModal] = useState(false);
  const { supabase } = useSupabase();
  const toast = useToast();

  // Check if event has started
  useEffect(() => {
    const startTime = new Date(event.start_time);
    if (startTime <= new Date()) {
      setShowStartedModal(true);
    }
  }, [event.start_time]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate dates
    const startDate = new Date(formData.start_time);
    const endDate = new Date(formData.end_time);
    const now = new Date();

    // Additional check for started events
    if (startDate <= now) {
      setShowStartedModal(true);
      return;
    }

    if (endDate <= startDate) {
      toast.showError('End time must be after start time');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('events')
        .update({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq('id', event.id);

      if (error) throw error;

      toast.showSuccess('Event updated successfully');
      onSuccess();
    } catch (error: any) {
      console.error('Error updating event:', error);
      toast.showError(error.message || 'Failed to update event');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Calculate minimum end time based on start time
  const minEndTime = formData.start_time
    ? new Date(new Date(formData.start_time).getTime() + 15 * 60000)
        .toISOString()
        .slice(0, 16)
    : '';

  return (
    <>
      <Dialog open={isOpen}>
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="fixed inset-0 bg-black/50" aria-hidden="true" onClick={onClose} />

            <div className="relative bg-white rounded-xl w-full max-w-2xl p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Edit Event</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Two Column Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Title</label>
                        <input
                          type="text"
                          name="title"
                          value={formData.title}
                          onChange={handleChange}
                          className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Start Time</label>
                        <input
                          type="datetime-local"
                          name="start_time"
                          value={formData.start_time}
                          onChange={handleChange}
                          min={new Date().toISOString().slice(0, 16)}
                          className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleChange}
                          className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent"
                          rows={3}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">End Time</label>
                        <input
                          type="datetime-local"
                          name="end_time"
                          value={formData.end_time}
                          onChange={handleChange}
                          min={minEndTime}
                          className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-[#7440ff] text-white rounded-lg font-medium hover:bg-[#7440ff]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      'Update Event'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Dialog>

      <EventStartedModal
        isOpen={showStartedModal}
        onClose={() => {
          setShowStartedModal(false);
          onClose();
        }}
      />
    </>
  );
}