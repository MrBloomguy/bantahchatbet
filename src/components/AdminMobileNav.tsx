import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Trophy,
  Wallet,
  AlertCircle,
  Coins,
  ClipboardList,
  Newspaper,
  Plus,
  Bell,
  Users,
  Menu,
  X,
  Gamepad2,
  Award
} from 'lucide-react';

const AdminMobileNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Events', href: '/admin/events', icon: Trophy },
    { name: 'Event Pools', href: '/admin/event-pools', icon: Coins },
    { name: 'Event Boost', href: '/admin/event-boost', icon: Users },
    { name: 'Challenges', href: '/admin/challenges', icon: Gamepad2 },
    { name: 'Create Event', href: '/admin/create-event', icon: Plus },
    { name: 'Stories', href: '/admin/stories', icon: Newspaper },
    { name: 'Broadcast', href: '/admin/broadcast', icon: Bell },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Bonus Points', href: '/admin/bonus-points', icon: Award },
    { name: 'Reports', href: '/admin/reports', icon: AlertCircle },
    { name: 'Withdrawals', href: '/admin/withdrawals', icon: Wallet },
    { name: 'Platform Fees', href: '/admin/platform-fees', icon: Coins },
    { name: 'Audit Log', href: '/admin/audit-log', icon: ClipboardList },
  ];

  // Mobile navigation items (limited set for bottom bar)
  const mobileNavItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Events', href: '/admin/events', icon: Trophy },
    { name: 'Pools', href: '/admin/event-pools', icon: Coins },
    { name: 'Challenges', href: '/admin/challenges', icon: Gamepad2 },
    { name: 'More', href: '#', icon: Menu, action: () => setMenuOpen(true) }
  ];

  return (
    <>
      {/* Bottom navigation bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#242538] border-t border-[#333] py-2 px-4 flex justify-around items-center z-50">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <button
              key={item.name}
              type="button"
              onClick={() => item.action ? item.action() : navigate(item.href)}
              className={`flex flex-col items-center ${active ? 'text-[#CCFF00]' : 'text-white/60'}`}
              aria-label={item.name}
            >
              <Icon size={24} />
              <span className="text-xs mt-1">{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* Full screen mobile menu */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 bg-[#1a1b2e] z-50 flex flex-col">
          <div className="bg-[#242538] p-4 flex justify-between items-center">
            <h2 className="text-white font-medium">Admin Menu</h2>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="text-white/60 hover:text-white"
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-3 mb-2 rounded-lg ${active ? 'bg-[#CCFF00]/10 text-[#CCFF00]' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

export default AdminMobileNav;