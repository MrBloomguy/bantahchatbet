import React from 'react';
import CreateEventForm from '../../components/CreateEventForm';
import AdminLayout from '../../layouts/AdminLayout';

const AdminCreateEvent = () => {
  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Create New Event</h1>
        <CreateEventForm isAdmin={true} />
      </div>
    </AdminLayout>
  );
};

export default AdminCreateEvent;