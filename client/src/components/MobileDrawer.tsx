import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trophy, Users, TrendingUp, Settings, LogOut, BarChart2 } from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../contexts/AuthContext';
import { useMediaQuery } from '../hooks/useMediaQuery';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileDrawer: React.FC<MobileDrawerProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const menuItems = [
    { icon: <Trophy className="w-5 h-5" />, label: 'Events', path: '/events' },
    { icon: <Users className="w-5 h-5" />, label: 'Groups', path: '/groups' },
    { icon: <TrendingUp className="w-5 h-5" />, label: 'My Events', path: '/myevents' },
    { icon: <BarChart2 className="w-5 h-5" />, label: 'Leaderboard', path: '/leaderboard' },
    { icon: <Settings className="w-5 h-5" />, label: 'Settings', path: '/settings' },
  ];

  const socialLinks = [
    { 
      icon: "/telegram.svg", 
      label: 'Telegram', 
      url: 'https://t.me/yourtelegram' 
    },
    { 
      icon: "/twitter.svg", 
      label: 'Twitter', 
      url: 'https://twitter.com/yourtwitter' 
    },
    { 
      icon: "/discord.svg", 
      label: 'Discord', 
      url: 'https://discord.gg/yourdiscord' 
    },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`absolute top-0 ${isMobile ? 'left-0' : 'right-0'} bottom-0 w-64 bg-[#242538] p-4 safe-top`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => {
              navigate('/');
              onClose();
            }}
            className="flex items-center gap-2"
            aria-label="Go to homepage"
          >
            <Logo className="w-8 h-8 text-[#CCFF00]" />
            <span className="text-white font-bold text-xl">Bantah</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Social Links */}
        <div className="mt-8 px-4">
          <div className="flex justify-center gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                aria-label={social.label}
              >
                <img 
                  src={social.icon} 
                  alt={social.label} 
                  className="w-6 h-6 invert" // invert to make icons white
                />
              </a>
            ))}
          </div>
        </div>

        {/* Logout */}
        {currentUser && (
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-white/10 rounded-xl transition-colors mt-8"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default MobileDrawer;
