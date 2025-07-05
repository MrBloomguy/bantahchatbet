import React, { useState, useEffect } from 'react';
import { useEventJoinRequest } from '../hooks/useEventJoinRequest';
import UserAvatar from './UserAvatar';

interface EventJoinRequestsProps {
  eventId: string;
  onRequestProcessed?: () => void;
}

const EventJoinRequests: React.FC<EventJoinRequestsProps> = ({
  eventId,
  onRequestProcessed
}) => {
  const { getPendingRequests, respondToRequest, isProcessing } = useEventJoinRequest();
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    loadRequests();
  }, [eventId]);

  const loadRequests = async () => {
    const pendingRequests = await getPendingRequests(eventId);
    setRequests(pendingRequests);
  };

  const handleResponse = async (requestId: string, status: 'accepted' | 'declined') => {
    const response = status === 'declined' 
      ? prompt('Would you like to provide a reason for declining?')
      : undefined;

    const success = await respondToRequest(requestId, status, response);
    if (success) {
      await loadRequests();
      onRequestProcessed?.();
    }
  };

  if (requests.length === 0) {
    return <p className="text-gray-500">No pending join requests</p>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Pending Join Requests</h3>
      {requests.map((request) => (
        <div key={request.id} className="border rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserAvatar user={request.user} />
            <div>
              <p className="font-medium">{request.user.username}</p>
              {request.message && (
                <p className="text-sm text-gray-600">{request.message}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleResponse(request.id, 'accepted')}
              disabled={isProcessing}
              className="px-3 py-1 bg-green-500 text-white rounded-lg"
            >
              Accept
            </button>
            <button
              onClick={() => handleResponse(request.id, 'declined')}
              disabled={isProcessing}
              className="px-3 py-1 bg-red-500 text-white rounded-lg"
            >
              Decline
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EventJoinRequests;