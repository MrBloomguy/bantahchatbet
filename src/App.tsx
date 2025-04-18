import React from 'react';
import { useLocation, Routes, Route } from 'react-router-dom';
import AdminRoute from './components/AdminRoute';
import ProtectedRoute from './components/ProtectedRoute';
import DesktopNav from './components/DesktopNav';
import { ToastProvider } from './contexts/ToastContext';
import { SupabaseProvider } from './contexts/SupabaseContext';
import { AuthProvider } from './contexts/AuthContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import { WalletProvider } from './contexts/WalletContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { SplashScreenProvider } from './contexts/SplashScreenContext';
import { PointsProvider } from './contexts/PointsContext';
import LevelUpDialog from './components/LevelUpDialog';
import PointsNotification from './components/PointsNotification';

// Admin Pages
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminEvents from './pages/AdminEvents';
import AdminReports from './pages/AdminReports';
import AdminWithdrawals from './pages/AdminWithdrawals';
import AdminAuditLog from './pages/AdminAuditLog';
import AdminPlatformFees from './pages/AdminPlatformFees';
import AdminStories from './pages/AdminStories';
import AdminCreateEvent from './pages/AdminCreateEvent'; // Fix import path
import AdminUsers from './pages/AdminUsers'; // Import AdminUsers page

// User Pages
import SignIn from './pages/SignIn';
import Events from './pages/Events';
import Wallet from './pages/Wallet';
import Games from './pages/Games';
import MyEvents from './pages/MyEvents';
import ChallengeDetails from './pages/ChallengeDetails';
import Create from './pages/Create';
import Profile from './pages/Profile';
import Help from './pages/Help';
import Privacy from './pages/Privacy';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import Leaderboard from './pages/Leaderboard';
import Stories from './pages/Stories';
import ProfileSettings from './pages/ProfileSettings';
import Settings from './pages/Settings';
import Referral from './pages/Referral';
import Levels from './pages/Levels';

// Components
import PWAInstallPrompt from './components/PWAInstallPrompt';
import EventChatWrapper from './components/EventChatWrapper';

const App: React.FC = () => {
  const location = useLocation();
  const isAuthPage = ['/signin', '/admin/login'].includes(location.pathname);

  return (
    <ToastProvider>
      <SupabaseProvider>
        <AuthProvider>
          <AdminAuthProvider>
            <WalletProvider>
              <SettingsProvider>
                <SplashScreenProvider>
                  <PointsProvider>
                    <div className="min-h-screen bg-gray-50">
                      {!isAuthPage && <DesktopNav />}
                      <main className="lg:ml-[200px] flex-1">
                        <Routes>
                          {/* Public routes */}
                          <Route path="/" element={<Events />} />
                          <Route path="/signin" element={<SignIn />} />
                          <Route path="/help" element={<Help />} />
                          <Route path="/privacy" element={<Privacy />} />
                          <Route path="/stories" element={<Stories />} />
                          
                          {/* Admin routes */}
                          <Route path="/admin/login" element={<AdminLogin />} />
                          <Route
                            path="/admin/dashboard"
                            element={
                              <AdminRoute>
                                <AdminDashboard />
                              </AdminRoute>
                            }
                          />
                          <Route
                            path="/admin/events"
                            element={
                              <AdminRoute>
                                <AdminEvents />
                              </AdminRoute>
                            }
                          />
                          <Route
                            path="/admin/reports"
                            element={
                              <AdminRoute>
                                <AdminReports />
                              </AdminRoute>
                            }
                          />
                          <Route
                            path="/admin/withdrawals"
                            element={
                              <AdminRoute>
                                <AdminWithdrawals />
                              </AdminRoute>
                            }
                          />
                          <Route
                            path="/admin/platform-fees"
                            element={
                              <AdminRoute>
                                <AdminPlatformFees />
                              </AdminRoute>
                            }
                          />
                          <Route
                            path="/admin/audit-log"
                            element={
                              <AdminRoute>
                                <AdminAuditLog />
                              </AdminRoute>
                            }
                          />
                          <Route
                            path="/admin/stories"
                            element={
                              <AdminRoute>
                                <AdminStories />
                              </AdminRoute>
                            }
                          />
                          <Route path="/admin/create" element={
                            <AdminRoute>
                              <AdminCreateEvent />
                            </AdminRoute>
                          } />
                          <Route path="/admin/users" element={
                            <AdminRoute>
                              <AdminUsers />
                            </AdminRoute>
                          } />

                          {/* Protected routes */}
                          <Route 
                            path="/events" 
                            element={
                              <ProtectedRoute>
                                <Events />
                              </ProtectedRoute>
                            } 
                          />
                          <Route 
                            path="/wallet" 
                            element={
                              <ProtectedRoute>
                                <Wallet />
                              </ProtectedRoute>
                            } 
                          />
                          <Route path="/games" element={
                            <ProtectedRoute>
                              <Games />
                            </ProtectedRoute>
                          } />
                          <Route path="/myevents" element={
                            <ProtectedRoute>
                              <MyEvents />
                            </ProtectedRoute>
                          } />
                          <Route path="/challenge/:id" element={
                            <ProtectedRoute>
                              <ChallengeDetails />
                            </ProtectedRoute>
                          } />
                          <Route path="/create" element={
                            <ProtectedRoute>
                              <Create />
                            </ProtectedRoute>
                          } />
                          <Route path="/profile" element={
                            <ProtectedRoute>
                              <Profile />
                            </ProtectedRoute>
                          } />
                          <Route path="/messages" element={
                            <ProtectedRoute>
                              <Messages />
                            </ProtectedRoute>
                          } />
                          <Route path="/messages/:userId" element={
                            <ProtectedRoute>
                              <Messages />
                            </ProtectedRoute>
                          } />
                          <Route path="/notifications" element={
                            <ProtectedRoute>
                              <Notifications />
                            </ProtectedRoute>
                          } />
                          <Route path="/leaderboard" element={
                            <ProtectedRoute>
                              <Leaderboard />
                            </ProtectedRoute>
                          } />
                          <Route path="/event/:eventId/chat" element={
                            <ProtectedRoute>
                              <EventChatWrapper />
                            </ProtectedRoute>
                          } />
                          <Route path="/settings/profile" element={
                            <ProtectedRoute>
                              <ProfileSettings />
                            </ProtectedRoute>
                          } />
                          <Route path="/settings" element={
                            <ProtectedRoute>
                              <Settings />
                            </ProtectedRoute>
                          } />
                          <Route path="/referral" element={
                            <ProtectedRoute>
                              <Referral />
                            </ProtectedRoute>
                          } />
                          <Route path="/levels" element={
                            <ProtectedRoute>
                              <Levels />
                            </ProtectedRoute>
                          } />
                          <Route path="/settings/privacy" element={
                            <ProtectedRoute>
                              <Privacy />
                            </ProtectedRoute>
                          } />
                        </Routes>
                        <PWAInstallPrompt />
                        <LevelUpDialog />
                        <PointsNotification />
                      </main>
                    </div>
                  </PointsProvider>
                </SplashScreenProvider>
              </SettingsProvider>
            </WalletProvider>
          </AdminAuthProvider>
        </AuthProvider>
      </SupabaseProvider>
    </ToastProvider>
  );
};

export default App;