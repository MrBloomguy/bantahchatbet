import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from './Logo';
import { ArrowRight, ArrowLeft } from 'lucide-react';

interface DesktopNavProps {
  onMenuToggle?: (isOpen: boolean) => void;
}

const DesktopNav: React.FC<DesktopNavProps> = ({ onMenuToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    const newState = !isMenuOpen;
    setIsMenuOpen(newState);
    if (onMenuToggle) {
      onMenuToggle(newState);
    }
  };

  const menuItems = [
    {
      id: 'events',
      path: '/events',
      icon: <img src="/eventssvg.svg" alt="Events Icon" className="w-8 h-8" />,
      label: 'Events',
    },
    {
      id: 'games',
      path: '/games',
      icon: <img src="/gamessvg.svg" alt="Games Icon" className="w-9 h-9" />,
      label: 'Games',
    },

    {
      id: 'create',
      path: '/create',
      icon: <img src="/create.png" alt="Create Icon" className="w-8 h-8" />,
      label: 'Create',
      isMain: true,
    },
    {
      id: 'myevents',
      path: '/myevents',
      icon: <img src="/listsvg.svg" alt="My Events Icon" className="w-9 h-9" />,
      label: 'My Events',
    },
    {
      id: 'profile',
      path: '/profile',
      icon: currentUser?.avatar_url ? (
        <img
          src={currentUser.avatar_url}
          alt="Profile"
          className="w-9 h-9 rounded-full object-cover border-2 border-transparent"
          style={{
            borderColor: location.pathname === '/profile' ? '#CCFF00' : 'transparent',
          }}
        />
      ) : (
        <img src="/avatar.svg" alt="Profile Icon" className="w-9 h-9" />
      ),
      label: 'Profile',
    },
  ];

  const socialLinks = [
    {
      label: 'TikTok',
      url: 'https://www.tiktok.com/bantahsocial', // Replace with your actual TikTok URL
      icon: <img src="/4362958_tiktok_logo_social media_icon.svg" alt="TikTok" className="w-6 h-6" />,
    },
    {
      label: 'WhatsApp',
      url: 'https://wa.me/+2348120798168', // Replace with your actual WhatsApp link (if applicable)
      icon: <img src="/5296520_bubble_chat_mobile_whatsapp_whatsapp logo_icon.svg" alt="WhatsApp" className="w-6 h-6" />,
    },
    {
      label: 'Instagram',
      url: 'https://www.instagram.com/bantahapp', // Replace with your actual Instagram URL
      icon: <img src="/5296765_camera_instagram_instagram logo_icon.svg" alt="Instagram" className="w-6 h-6" />,
    },
    {
      label: 'X (Twitter)',
      url: 'https://twitter.com/bantahsocial', // Replace with your actual Twitter URL
      icon: <img src="/11244080_x_twitter_elon musk_twitter new logo_icon.svg" alt="X (Twitter)" className="w-6 h-6" />,
    },
  ];

  useEffect(() => {
    if (navRef.current) {
      navRef.current.style.width = isMenuOpen ? '200px' : '70px';
    }
  }, [isMenuOpen]);

  // Call onMenuToggle with initial state when component mounts
  useEffect(() => {
    if (onMenuToggle) {
      onMenuToggle(isMenuOpen);
    }
  }, [onMenuToggle, isMenuOpen]);

  return (
    <div
      ref={navRef}
      className="hidden lg:flex fixed left-0 top-0 bottom-0 bg-light-bg border-r border-gray-200 flex-col z-40 transition-all duration-200 ease-in-out overflow-hidden"
    >
      {/* Logo at the top */}
      <div className="w-full h-[70px] flex items-center justify-center hover:bg-white/10 transition-all">
        <Logo className="w-8 h-8 text-[#CCFF00]" />
      </div>

      {/* Menu Drawer Button (always visible as the first item) */}
      <button
        type="button"
        onClick={toggleMenu}
        className={`w-full flex items-center px-3 py-3 rounded-md transition-all hover:bg-white/5`}
        title={isMenuOpen ? "Collapse menu" : "Expand menu"}
      >
        <div className={`min-w-[32px] flex justify-center mr-3 text-black/80`}>
          {isMenuOpen ? (
            <ArrowLeft className={`w-6 h-6`} />
          ) : (
            <ArrowRight className={`w-6 h-6`} />
          )}
        </div>
        {isMenuOpen && <span className={`font-medium text-sm text-black/80`}>Menu</span>}
      </button>

      {/* Menu Items */}
      <nav className="flex-1 px-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              type="button"
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center px-3 py-3 rounded-md transition-all ${
                isActive ? 'bg-white/10' : 'hover:bg-white/5'
              }`}
              title={item.label}
            >
              <div className={`min-w-[32px] flex justify-center mr-3 ${isActive ? 'text-[#CCFF00]' : 'text-black/80'}`}>
                {item.isMain ?
                  <div className="flex justify-center items-center w-8 h-8">
                    {item.icon}
                  </div> :
                  item.icon
                }
              </div>
              {isMenuOpen && (
                <span className={`font-medium text-sm ${
                  isActive ? 'text-[#CCFF00]' : 'text-black/80'
                }`}>
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Social Links Section at the very bottom */}
      <div className={`px-3 py-3 border-t border-gray-200 mt-auto w-full ${isMenuOpen ? 'flex justify-around' : 'flex flex-col items-center gap-2'}`}>
        {socialLinks.map((social) => (
          <a
            key={social.label}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-white/10 rounded-full transition-all text-black/60 hover:text-black flex items-center justify-center"
            aria-label={social.label}
          >
            {social.icon}
          </a>
        ))}
      </div>
    </div>
  );
};

export default DesktopNav;