import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';
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
  Users
} from 'lucide-react';
import AdminMobileNav from '../components/AdminMobileNav';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    logout();
    navigate('/admin/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Events', href: '/admin/events', icon: Trophy },
    { name: 'Create Event', href: '/admin/create-event', icon: Plus },
    { name: 'Stories', href: '/admin/stories', icon: Newspaper },
    { name: 'Broadcast', href: '/admin/broadcast', icon: Bell },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Reports', href: '/admin/reports', icon: AlertCircle },
    { name: 'Withdrawals', href: '/admin/withdrawals', icon: Wallet },
    { name: 'Platform Fees', href: '/admin/platform-fees', icon: Coins },
    { name: 'Audit Log', href: '/admin/audit-log', icon: ClipboardList },
  ];

  return (
    <div className="min-h-screen bg-[#1a1b2e]">
      <nav className="bg-[#242538] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center text-white font-medium">
                Admin Dashboard
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                        isActive
                          ? 'text-[#CCFF00] bg-white/5'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-white/60 text-sm">
                {admin?.email}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
      <AdminMobileNav />
    </div>
  );
};

export default AdminLayout;
