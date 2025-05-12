import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, ArrowRight } from 'lucide-react';
import EventCard from '../components/EventCard';
import CategoryButton from '../components/CategoryButton';
import MobileFooterNav from '../components/MobileFooterNav';
import Header from '../components/Header';
import Logo from '../components/Logo';
import { useEvent } from '../hooks/useEvent';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useSplashScreen } from '../contexts/SplashScreenContext';

function Home() {
  const navigate = useNavigate();
  const [showTour, setShowTour] = useState(true);
  const { currentUser } = useAuth();
  const { events, loading, joinEvent, fetchEvents } = useEvent();
  const toast = useToast();
  const { setIsLoading } = useSplashScreen();
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Show splash screen when loading important data
    setIsLoading(true);
    
    // Your data loading logic here
    
    // Hide splash screen when done
    setIsLoading(false);
  }, []);

  const debouncedSearch = useCallback(
    (query: string) => {
      const timeoutId = setTimeout(() => {
        fetchEvents(query);
      }, 300);
      return () => clearTimeout(timeoutId);
    },
    [fetchEvents]
  );

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  }, [debouncedSearch]);

  // Filter events for different sections
  const featuredEvents = events?.filter(event => 
    new Date(event.start_time) > new Date()
  ) || [];

  const popularEvents = events?.filter(event => 
    event.participants?.length > 5
  ) || [];

  return (
    <div className="min-h-screen bg-white">
      <Header>
        <div className="flex items-center gap-2">
          <Logo className="w-8 h-8" />
        </div>
      </Header>
      {/* Rest of your JSX */}
      <MobileFooterNav />
      {showTour && <AppTour />}
    </div>
  );
}

export default Home;
