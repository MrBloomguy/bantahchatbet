import React, { useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';

const CreateEvent: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const toast = useToast();

  const handleCreateEvent = async () => {
    try {
      const { error } = await supabase.from('events').insert({
        title,
        description,
        start_time: startTime,
        end_time: endTime,
      });

      if (error) throw error;

      toast.showSuccess('Event created successfully');
      setTitle('');
      setDescription('');
      setStartTime('');
      setEndTime('');
    } catch (error) {
      console.error('Error creating event:', error);
      toast.showError('Failed to create event');
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto p-4 lg:p-8">
        <h2 className="text-xl font-bold text-white mb-6">Create Event</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-white mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 rounded bg-gray-800 text-white"
            />
          </div>
          <div>
            <label className="block text-white mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 rounded bg-gray-800 text-white"
            />
          </div>
          <div>
            <label className="block text-white mb-1">Start Time</label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full p-2 rounded bg-gray-800 text-white"
            />
          </div>
          <div>
            <label className="block text-white mb-1">End Time</label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full p-2 rounded bg-gray-800 text-white"
            />
          </div>
          <button
            onClick={handleCreateEvent}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Create Event
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CreateEvent;