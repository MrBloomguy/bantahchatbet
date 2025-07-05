import React from 'react';
import AdminLayout from '../layouts/AdminLayout';
import CreateEventForm from '../components/CreateEventForm';

const AdminCreateEvent = () => {
  return (
    <AdminLayout>
      <div className="p-6 bg-[#242538] rounded-lg">
        <h1 className="text-2xl font-bold text-white mb-6">Create New Event</h1>
        <CreateEventForm isAdmin={true} />
      </div>
    </AdminLayout>
  );
};

export default AdminCreateEvent;