import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  const [headerOffset, setHeaderOffset] = useState(0);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

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

  // Scroll handler for header/category hide/show
  useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          if (currentScrollY > lastScrollY.current) {
            setHeaderOffset(-80); // Hide header/category
          } else if (currentScrollY < lastScrollY.current) {
            setHeaderOffset(0); // Show header/category
          }
          lastScrollY.current = currentScrollY;
          ticking.current = false;
        });
        ticking.current = true;
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Animated header/category wrapper */}
      <div
        style={{
          transform: `translateY(${headerOffset}px)`,
          transition: 'transform 0.25s cubic-bezier(.4,0,.2,1)',
          zIndex: 50,
          position: 'sticky',
          top: 0,
          background: 'white',
        }}
      >
        <Header />
        {/* Category section here, e.g. horizontally scrollable categories */}
        <div className="overflow-x-auto flex gap-2 px-4 py-2 border-b bg-white">
          <CategoryButton icon="🔥" label="Trending" />
          <CategoryButton icon="⚽" label="Sports" />
          <CategoryButton icon="🎵" label="Music" />
          <CategoryButton icon="🎮" label="Games" />
          <CategoryButton icon="📰" label="News" />
        </div>
      </div>
      {/* Rest of your JSX */}
      <MobileFooterNav />
    </div>
  );
}

export default Home;
