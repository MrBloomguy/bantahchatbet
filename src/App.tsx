import React, { useState, useEffect } from 'react';
import { useLocation, Routes, Route, Navigate } from 'react-router-dom';
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
import { PrivyAuthProvider } from './contexts/PrivyAuthContext';

import { PointsProvider } from './contexts/PointsContext';
import { UserPresenceProvider } from './contexts/UserPresenceContext';
import { NotificationProvider } from './contexts/NotificationContext';
import LevelUpDialog from './components/LevelUpDialog';
import PointsNotification from './components/PointsNotification';
import SimpleAuthDebugger from './components/SimpleAuthDebugger';

// Admin Pages
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminEvents from './pages/AdminEvents';
import AdminReports from './pages/AdminReports';
import AdminWithdrawals from './pages/AdminWithdrawals';
import AdminAuditLog from './pages/AdminAuditLog';
import AdminPlatformFees from './pages/AdminPlatformFees';
import AdminStories from './pages/AdminStories';
import AdminCreateEvent from './pages/AdminCreateEvent';
import AdminUsers from './pages/AdminUsers';
import AdminBroadcast from './pages/AdminBroadcast';
import AdminBroadcastInfo from './pages/AdminBroadcastInfo';
import AdminChallenges from './pages/AdminChallenges';
import AdminEventPools from './pages/AdminEventPools';
import AdminBonusPoints from './pages/AdminBonusPoints';
import AdminEventBoost from './pages/AdminEventBoost';

// User Pages
import SignIn from './pages/SignIn';
import Events from './pages/Events';
import WalletRedesigned from './pages/WalletRedesigned';
import Games from './pages/Games';
import MyEvents from './pages/MyEvents';
import ChallengeDetails from './pages/ChallengeDetails';
import Create from './pages/Create';
import Profile from './pages/Profile';
import Help from './pages/Help';
import PrivacyRedesigned from './pages/PrivacyRedesigned';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import Leaderboard from './pages/Leaderboard';
import Stories from './pages/Stories';
import ProfileSettings from './pages/ProfileSettings';
import Settings from './pages/Settings';
import Referral from './pages/Referral';
import Levels from './pages/Levels';
import Challenges from './pages/Challenges';
import ChallengeChat from './pages/ChallengeChat';
import EventChallengeHistory from './pages/EventChallengeHistory';
import ProfileCardPopupDemo from './pages/ProfileCardPopupDemo';
import DataDeletionRequest from './pages/DataDeletionRequest';
import TikTokAuthCallback from './components/TikTokAuthCallback';
import DataDeletionCallback from './pages/DataDeletionCallback';
import DataDeletionDocs from './pages/DataDeletionDocs';
import Terms from './pages/Terms';

// Components
import PWAInstallPrompt from './components/PWAInstallPrompt';
import EventChatWrapper from './components/EventChatWrapper';
import ToastDemo from './components/ToastDemo';

const App: React.FC = () => {
  const location = useLocation();
  const isAuthPage = ['/signin', '/admin/login'].includes(location.pathname);
  const isAdminPage = location.pathname.startsWith('/admin');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isEventsPage = location.pathname === '/events';

  return (
    <ToastProvider>
      <SupabaseProvider>
        <PrivyAuthProvider>
          <AuthProvider>
            <AdminAuthProvider>
              <WalletProvider>
                <SettingsProvider>
                  <SplashScreenProvider>
                  <UserPresenceProvider>
                    <NotificationProvider>
                      <PointsProvider>
                    <div className={`min-h-screen ${isAdminPage ? 'bg-[#1a1b2e]' : 'bg-gray-50'}`}>
                      {!isAuthPage && !isAdminPage && <DesktopNav onMenuToggle={setIsSidebarOpen} />}
                      <main className={`${
                        !isAdminPage && !isAuthPage ?
                          isEventsPage ?
                            isSidebarOpen ? 'lg:ml-[200px]' : 'lg:ml-[70px]'
                          : 'lg:ml-[70px]'
                        : ''
                      } flex-1 transition-all duration-200`}>
                        <Routes>
                          {/* Public routes */}
                          <Route path="/" element={<Events />} />
                          <Route path="/signin" element={<SignIn />} />
                          <Route path="/help" element={<Help />} />
                          <Route path="/privacy" element={<PrivacyRedesigned />} />
                          <Route path="/terms" element={<Terms />} />
                          <Route path="/stories" element={<Stories />} />
                          <Route path="/data-deletion-callback" element={<DataDeletionCallback />} />
                          <Route path="/auth/tiktok-callback" element={<TikTokAuthCallback />} />

                          {/* Admin routes */}
                          <Route path="/admin/login" element={<AdminLogin />} />
                          <Route path="/admin" element={
                            <AdminRoute>
                              <Navigate to="/admin/dashboard" replace />
                            </AdminRoute>
                          } />
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
                          <Route path="/admin/create-event" element={
                            <AdminRoute>
                              <AdminCreateEvent />
                            </AdminRoute>
                          } />
                          <Route path="/admin/users" element={
                            <AdminRoute>
                              <AdminUsers />
                            </AdminRoute>
                          } />
                          <Route path="/admin/broadcast" element={
                            <AdminRoute>
                              <AdminBroadcast />
                            </AdminRoute>
                          } />
                          <Route path="/admin/broadcast-info" element={
                            <AdminRoute>
                              <AdminBroadcastInfo />
                            </AdminRoute>
                          } />
                          <Route path="/admin/challenges" element={
                            <AdminRoute>
                              <AdminChallenges />
                            </AdminRoute>
                          } />
                          <Route path="/admin/event-pools" element={
                            <AdminRoute>
                              <AdminEventPools />
                            </AdminRoute>
                          } />
                          <Route path="/admin/bonus-points" element={
                            <AdminRoute>
                              <AdminBonusPoints />
                            </AdminRoute>
                          } />
                          <Route path="/admin/event-boost" element={
                            <AdminRoute>
                              <AdminEventBoost />
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
                                <WalletRedesigned />
                              </ProtectedRoute>
                            }
                          />
                          <Route path="/games" element={
                            <ProtectedRoute>
                              <Games />
                            </ProtectedRoute>
                          } />
                          <Route path="/challenges" element={
                            <ProtectedRoute>
                              <Challenges />
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
                          <Route path="/challenge-chat/:id" element={
                            <ProtectedRoute>
                              <ChallengeChat />
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
                              <PrivacyRedesigned />
                            </ProtectedRoute>
                          } />
                          <Route path="/settings/data-deletion" element={
                            <ProtectedRoute>
                              <DataDeletionRequest />
                            </ProtectedRoute>
                          } />
                          <Route path="/activity-history" element={
                            <ProtectedRoute>
                              <EventChallengeHistory />
                            </ProtectedRoute>
                          } />
                          <Route path="/profile-card-demo" element={
                            <ProtectedRoute>
                              <ProfileCardPopupDemo />
                            </ProtectedRoute>
                          } />
                          <Route path="/toast-demo" element={<ToastDemo />} />
                        </Routes>
                        <PWAInstallPrompt />
                        <SimpleAuthDebugger />
                        <LevelUpDialog />
                        <PointsNotification />
                      </main>
                    </div>
                    </PointsProvider>
                    </NotificationProvider>
                  </UserPresenceProvider>
                  </SplashScreenProvider>
                </SettingsProvider>
              </WalletProvider>
            </AdminAuthProvider>
          </AuthProvider>
        </PrivyAuthProvider>
      </SupabaseProvider>
    </ToastProvider>
  );
};

export default App;