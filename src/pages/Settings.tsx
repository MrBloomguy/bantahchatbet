import React from 'react';
import { ArrowRight, Bell, Moon, Eye, Radio, Activity, UserCheck, LogOut, Lock, Trash2, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import PageHeader from '../components/PageHeader';
import PushNotificationToggle from '../components/PushNotificationToggle';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { settings, toggleSetting } = useSettings();

  return (
    <div className="min-h-screen bg-[#F6F7FB] flex flex-col pb-[70px]">
      <div className="w-full max-w-xl mx-auto">
        <PageHeader title="Settings" />
        <div className="p-4 space-y-4">
          {/* Notifications Section (Grouped Card) */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <h2 className="text-gray-900 dark:text-gray-100 font-semibold mb-3 flex items-center gap-2 text-sm">
              <Bell className="w-4 h-4 text-[#7440ff]" />
              Notifications
            </h2>
            <div className="space-y-2">
              {/* Web Push Notifications Toggle */}
              <PushNotificationToggle className="py-1" />

              {/* App Push Notifications Toggle */}
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  <Radio className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-800 dark:text-gray-200 text-sm">In-App Alerts</span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleSetting('notifications', 'push')}
                  className={`w-11 h-5 rounded-full transition-colors ${
                    settings.notifications.push ? 'bg-[#7440ff]' : 'bg-gray-400 dark:bg-gray-600'
                  } relative focus:outline-none`}
                  aria-label={settings.notifications.push ? "Disable in-app notifications" : "Enable in-app notifications"}
                >
                  <span className={`absolute top-[2px] w-3 h-3 rounded-full transition-transform ${
                    settings.notifications.push ? 'bg-white right-1' : 'bg-white left-1'
                  }`} />
                </button>
              </div>

            </div>
          </div>

          {/* Appearance Section (Grouped Card) */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <h2 className="text-gray-900 dark:text-gray-100 font-semibold mb-3 flex items-center gap-2 text-sm">
              <Moon className="w-4 h-4 text-[#7440ff]" />
              Appearance
            </h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  <Moon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-800 dark:text-gray-200 text-sm">Dark Mode</span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleSetting('appearance', 'darkMode')}
                  className={`w-11 h-5 rounded-full transition-colors ${
                    settings.appearance.darkMode ? 'bg-[#7440ff]' : 'bg-gray-400 dark:bg-gray-600'
                  } relative focus:outline-none`}
                  aria-label={settings.appearance.darkMode ? "Disable dark mode" : "Enable dark mode"}
                >
                  <span className={`absolute top-[2px] w-3 h-3 rounded-full transition-transform ${
                    settings.appearance.darkMode ? 'bg-white right-1' : 'bg-white left-1'
                  }`} />
                </button>
              </div>
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  <Activity className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-800 dark:text-gray-200 text-sm">Reduced Motion</span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleSetting('appearance', 'reducedMotion')}
                  className={`w-11 h-5 rounded-full transition-colors ${
                    settings.appearance.reducedMotion ? 'bg-[#7440ff]' : 'bg-gray-400 dark:bg-gray-600'
                  } relative focus:outline-none`}
                  aria-label={settings.appearance.reducedMotion ? "Disable reduced motion" : "Enable reduced motion"}
                >
                  <span className={`absolute top-[2px] w-3 h-3 rounded-full transition-transform ${
                    settings.appearance.reducedMotion ? 'bg-white right-1' : 'bg-white left-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Privacy Section (Grouped Card) */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <h2 className="text-gray-900 dark:text-gray-100 font-semibold mb-3 flex items-center gap-2 text-sm">
              <Eye className="w-4 h-4 text-[#7440ff]" />
              Privacy
            </h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  <UserCheck className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-800 dark:text-gray-200 text-sm">Show Online Status</span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleSetting('privacy', 'showOnlineStatus')}
                  className={`w-11 h-5 rounded-full transition-colors ${
                    settings.privacy.showOnlineStatus ? 'bg-[#7440ff]' : 'bg-gray-400 dark:bg-gray-600'
                  } relative focus:outline-none`}
                  aria-label={settings.privacy.showOnlineStatus ? "Hide online status" : "Show online status"}
                >
                  <span className={`absolute top-[2px] w-3 h-3 rounded-full transition-transform ${
                    settings.privacy.showOnlineStatus ? 'bg-white right-1' : 'bg-white left-1'
                  }`} />
                </button>
              </div>

              <div
                className="flex items-center justify-between py-1 cursor-pointer"
                onClick={() => navigate('/privacy')}
              >
                <div className="flex items-center gap-3">
                  <Lock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-800 dark:text-gray-200 text-sm">Privacy Policy</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </div>

              <div
                className="flex items-center justify-between py-1 cursor-pointer"
                onClick={() => navigate('/settings/data-deletion')}
              >
                <div className="flex items-center gap-3">
                  <Trash2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-800 dark:text-gray-200 text-sm">Request Data Deletion</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </div>

              <div
                className="flex items-center justify-between py-1 cursor-pointer"
                onClick={() => navigate('/terms')}
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-800 dark:text-gray-200 text-sm">Terms of Service</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </div>
            </div>
          </div>

          {/* Logout Section (Subtler Card) */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 cursor-pointer" onClick={() => {/* Handle Logout Logic */}}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <LogOut className="w-4 h-4 text-[#FF4D4D]" />
                <span className="text-gray-900 dark:text-gray-100 font-semibold text-sm">Logout</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </div>
          </div>
        </div>
        <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-4">
          App ver 1.0.1
        </div>
      </div>
    </div>
  );
};

export default Settings;