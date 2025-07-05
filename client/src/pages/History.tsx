import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Clock, Star, Award } from 'lucide-react';
import { useEventHistory } from '../hooks/useEventHistory';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const tabs = [
  { id: 'created', label: 'Created Events', icon: Star },
  { id: 'joined', label: 'Participated', icon: Clock },
  { id: 'won', label: 'Won', icon: Trophy },
  { id: 'lost', label: 'Lost', icon: Award },
];

const History = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('created');
  const { createdEvents, history: joinedEvents, loading } = useEventHistory();
  const { currentUser } = useAuth();

  const getFilteredEvents = () => {
    switch (activeTab) {
      case 'created':
        return createdEvents;
      case 'joined':
        return joinedEvents;
      case 'won':
        return joinedEvents.filter(event => 
          event.status === 'completed' && 
          event.participants?.some(p => 
            p.user_id === currentUser?.id && p.prediction === true
          )
        );
      case 'lost':
        return joinedEvents.filter(event => 
          event.status === 'completed' && 
          event.participants?.some(p => 
            p.user_id === currentUser?.id && p.prediction === false
          )
        );
      default:
        return [];
    }
  };

  const renderEventCard = (event: any) => (
    <div key={event.id} className="bg-[#242538] rounded-lg p-4 mb-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-semibold text-white">{event.title}</h3>
            <span className={`px-2 py-1 rounded-full text-xs ${
              event.status === 'completed' 
                ? 'bg-green-500 text-white' 
                : 'bg-[#CCFF00] text-black'
            }`}>
              {event.status}
            </span>
          </div>
          
          <p className="text-gray-400 mb-2">{event.description}</p>
          
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
            <div>
              <p>Start: {new Date(event.start_time).toLocaleDateString()}</p>
              <p>End: {new Date(event.end_time).toLocaleDateString()}</p>
            </div>
            <div>
              <p>Pool Amount: ${event.pool_amount}</p>
              <p>Participants: {event.participant_count}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 ml-4">
          <button
            onClick={() => navigate(`/events/${event.id}`)}
            className="px-4 py-2 bg-[#CCFF00] text-black rounded-lg text-sm"
          >
            View Details
          </button>
          {event.is_editable && event.status === 'active' && (
            <button
              onClick={() => navigate(`/events/${event.id}/edit`)}
              className="px-4 py-2 border border-[#CCFF00] text-white rounded-lg text-sm"
            >
              Edit Event
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#1a1b2e] p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Event History</h1>

        <div className="flex gap-4 mb-6 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[#CCFF00] text-black'
                  : 'bg-[#242538] text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="space-y-4">
            {getFilteredEvents().length === 0 ? (
              <div className="bg-[#242538] rounded-lg p-6 text-center text-white">
                <p className="text-lg mb-2">No events found</p>
                <p className="text-sm text-gray-400">
                  {activeTab === 'created' 
                    ? "You haven't created any events yet" 
                    : `No ${activeTab} events found`}
                </p>
              </div>
            ) : (
              getFilteredEvents().map(renderEventCard)
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;