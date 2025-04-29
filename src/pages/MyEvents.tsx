import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Clock, Star, Award, Users, ArrowLeft, MessageCircle } from 'lucide-react';
import { useEventHistory } from '../hooks/useEventHistory';
import { useChatEngagement } from '../hooks/useChatEngagement';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import EditEventModal from '../components/modals/EditEventModal';
import Header from '../components/Header';
import MobileFooterNav from '../components/MobileFooterNav';
import { supabase } from '../lib/supabase';
import PageHeader from '../components/PageHeader';

const tabs = [
  { id: 'created', label: 'Created', icon: Star },
  { id: 'joined', label: 'Joined', icon: Clock },
  { id: 'engaged', label: 'Engaged', icon: MessageCircle },
  { id: 'won', label: 'Won', icon: Trophy },
  { id: 'lost', label: 'Lost', icon: Award },
];

const MyEvents = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('created');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { createdEvents, history: joinedEvents, loading: eventsLoading, refetchEvents } = useEventHistory();
  const { engagedEvents, loading: engagedLoading, refetchEngagedEvents } = useChatEngagement();
  const loading = eventsLoading || engagedLoading;
  const { currentUser } = useAuth();

  const getFilteredEvents = () => {
    switch (activeTab) {
      case 'created':
        return createdEvents;
      case 'joined':
        return joinedEvents;
      case 'engaged':
        return engagedEvents;
      case 'won':
        return joinedEvents.filter(event =>
          event.status === 'completed' &&
          event.user_prediction === true
        );
      case 'lost':
        return joinedEvents.filter(event =>
          event.status === 'completed' &&
          event.user_prediction === false
        );
      default:
        return [];
    }
  };

  const renderEventCard = (event: any) => (
    <div key={event.id} className="bg-[#242538] rounded-lg overflow-hidden">
      <div className="flex">
        {event.banner_url && (
          <div
            className="relative w-32 h-24 cursor-pointer"
            onClick={() => navigate(`/event/${event.id}/chat`)}
          >
            <img
              src={event.banner_url}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex-1 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3
                  className="text-base font-semibold text-white truncate cursor-pointer hover:text-[#7440ff]"
                  onClick={() => navigate(`/event/${event.id}/chat`)}
                >
                  {event.title}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  event.status === 'completed'
                    ? 'bg-green-500 text-white'
                    : 'bg-[#7440ff] text-black'
                }`}>
                  {event.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-3 text-xs text-gray-400 mb-2">
                {activeTab !== 'created' && event.creator && (
                  <div
                    className="flex items-center gap-1 cursor-pointer hover:text-[#7440ff]"
                    onClick={() => navigate(`/event/${event.id}/chat`)}
                  >
                    <Users className="w-3 h-3" />
                    <span>By {event.creator.username}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(event.start_time).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{typeof event.participant_count === 'number' ? event.participant_count : (event.participant_count?.count || 0)}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="bg-black/30 px-2 py-1 rounded">
                  <span className="text-[#7440ff]">₦ {Number(event.pool_amount || event.pool?.total_amount || 0).toLocaleString()}</span> Pool
                </div>
                {event.status === 'completed' && (
                  <div className="bg-black/30 px-2 py-1 rounded">
                    <span className="text-[#7440ff]">
                      ₦ {Number(event.user_earnings || 0).toLocaleString()}
                    </span>
                    {' '}
                    {event.user_earnings > 0 ? 'Won' : 'Lost'}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <button
                onClick={() => navigate(`/event/${event.id}/chat`)}
                className="px-2 py-1 bg-[#7440ff] text-black rounded text-xs font-medium whitespace-nowrap"
              >
                Chat
              </button>
              {event.is_editable && event.status === 'active' && (
                <button
                  onClick={() => {
                    setSelectedEvent(event);
                    setIsEditModalOpen(true);
                  }}
                  className="px-2 py-1 border border-[#7440ff] text-white rounded text-xs font-medium whitespace-nowrap"
                >
                  Edit
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F6F7FB] flex flex-col">
      <PageHeader title="My Events" />
      <div className="flex-1 flex flex-col items-center w-full">
        <div className="w-full max-w-2xl mx-auto px-2 sm:px-4 py-4">
          {/* Compact Tabs Bar */}
          <div className="flex gap-1 mb-6 bg-white rounded-xl shadow-sm p-1 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[#7440ff] text-white shadow'
                    : 'bg-transparent text-gray-700 hover:bg-gray-100'
                }`}
                style={{ minWidth: 0 }}
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
                <div className="flex flex-col items-center justify-center py-16">
                  <img src="/noti-lonely.svg" alt="No events" className="w-32 h-32 mb-4 opacity-80" />
                  <p className="text-lg font-semibold text-gray-700 mb-1">No events found</p>
                  <p className="text-sm text-gray-400">
                    {activeTab === 'created'
                      ? "You haven't created any events yet"
                      : activeTab === 'engaged'
                      ? "You haven't chatted in any events yet"
                      : `No ${activeTab} events found`}
                  </p>
                </div>
              ) : (
                getFilteredEvents().map(event => (
                  <div key={event.id} className="flex items-center bg-white rounded-2xl shadow-sm px-4 py-3 transition border border-transparent hover:border-[#7440ff]/40 relative group">
                    {/* Banner */}
                    {event.banner_url && (
                      <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden mr-4 bg-[#F6F7FB] flex items-center justify-center">
                        <img
                          src={event.banner_url}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3
                          className="text-base font-semibold text-gray-900 truncate cursor-pointer hover:text-[#7440ff]"
                          onClick={() => navigate(`/event/${event.id}/chat`)}
                        >
                          {event.title}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          event.status === 'completed'
                            ? 'bg-green-500 text-white'
                            : 'bg-[#7440ff] text-white'
                        }`}>
                          {event.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-2">
                        {activeTab !== 'created' && event.creator && (
                          <div
                            className="flex items-center gap-1 cursor-pointer hover:text-[#7440ff]"
                            onClick={() => navigate(`/event/${event.id}/chat`)}
                          >
                            <Users className="w-3 h-3" />
                            <span>By {event.creator.username}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(event.start_time).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{typeof event.participant_count === 'number' ? event.participant_count : (event.participant_count?.count || 0)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <div className="bg-gray-100 px-2 py-1 rounded">
                          <span className="text-[#000000] font-semibold">₦ {Number(event.pool_amount || event.pool?.total_amount || 0).toLocaleString()}</span> Pool
                        </div>
                        {event.status === 'completed' && (
                          <div className="bg-gray-100 px-2 py-1 rounded">
                            <span className="text-[#000000] font-semibold">
                              ₦ {Number(event.user_earnings || 0).toLocaleString()}
                            </span>
                            {' '}
                            {event.user_earnings > 0 ? 'Won' : 'Lost'}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex flex-col gap-1.5 ml-4">
                      <button
                        onClick={() => navigate(`/event/${event.id}/chat`)}
                        className="px-4 py-1.5 bg-[#7440ff] text-white rounded-full text-xs font-medium whitespace-nowrap shadow-sm hover:bg-[#6030ff] transition-colors duration-200 flex items-center gap-2"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Chat
                      </button>
                      {event.is_editable && event.status === 'active' && (
                        <button
                          onClick={() => {
                            setSelectedEvent(event);
                            setIsEditModalOpen(true);
                          }}
                          className="px-4 py-1.5 border border-[#7440ff] text-gray-900 rounded-full text-xs font-medium whitespace-nowrap hover:bg-[#7440ff]/5 transition-colors duration-200 flex items-center gap-2"
                        >
                          <Star className="w-3.5 h-3.5" />
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
          {selectedEvent && (
            <EditEventModal
              event={selectedEvent}
              isOpen={isEditModalOpen}
              onClose={() => {
                setIsEditModalOpen(false);
                setSelectedEvent(null);
              }}
              onSuccess={() => {
                setIsEditModalOpen(false);
                setSelectedEvent(null);
                // Refresh both event lists
                refetchEvents();
                refetchEngagedEvents();
              }}
            />
          )}
        </div>
      </div>
      <MobileFooterNav />
    </div>
  );
};

export default MyEvents;