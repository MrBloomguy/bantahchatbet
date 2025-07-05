import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import NewEventChat from './NewEventChat'; // Assuming this is the correct path

const EventChatWrapper: React.FC = () => {
  const navigate = useNavigate();
  const { eventId } = useParams();

  const onBack = () => {
    navigate('/events'); // Navigate back to the events page
  };

  if (!eventId) {
    // Handle the case where eventId is not available, e.g., redirect or show an error
    return <div>Event ID not found.</div>; // Replace with appropriate error handling
  }

  // Assuming NewEventChat expects eventId as a prop
  //  You'll likely need to fetch the event details here to pass to NewEventChat.
  //  For now, I'm just passing the eventId and onBack.
  return <NewEventChat eventId={eventId} onBack={onBack} />;
};

export default EventChatWrapper;