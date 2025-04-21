import React from 'react';
import { ArrowLeft, Bell, Moon, Eye, Globe, Volume2, Mail, Radio, Activity, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import Header from '../components/Header';
import MobileFooterNav from '../components/MobileFooterNav';
import PageHeader from '../components/PageHeader';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { settings, toggleSetting, updateSettings } = useSettings();

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
    { code: 'es', label: 'Español' },
  ];

  return (
    <div className="min-h-screen bg-[#F6F7FB] flex flex-col pb-[70px]">
      <PageHeader title="Settings" />

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Notifications */}
        <div className="bg-light-card dark:bg-dark-card rounded-xl p-6">
          <h2 className="text-light-text dark:text-dark-text font-semibold mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#7440ff]" />
            Notifications
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Radio className="w-5 h-5 text-light-text/60 dark:text-dark-text/60" />
                <span className="text-light-text dark:text-dark-text">Push Notifications</span>
              </div>
              <button
                onClick={() => toggleSetting('notifications', 'push')}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.notifications.push ? 'bg-[#7440ff]' : 'bg-gray-600'
                } relative`}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full transition-transform ${
                  settings.notifications.push ? 'bg-black right-1' : 'bg-white left-1'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-light-text/60 dark:text-dark-text/60" />
                <span className="text-light-text dark:text-dark-text">Email Notifications</span>
              </div>
              <button
                onClick={() => toggleSetting('notifications', 'email')}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.notifications.email ? 'bg-[#7440ff]' : 'bg-gray-600'
                } relative`}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full transition-transform ${
                  settings.notifications.email ? 'bg-black right-1' : 'bg-white left-1'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-light-text/60 dark:text-dark-text/60" />
                <span className="text-light-text dark:text-dark-text">Sound Effects</span>
              </div>
              <button
                onClick={() => toggleSetting('notifications', 'sound')}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.notifications.sound ? 'bg-[#7440ff]' : 'bg-gray-600'
                } relative`}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full transition-transform ${
                  settings.notifications.sound ? 'bg-black right-1' : 'bg-white left-1'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-light-card dark:bg-dark-card rounded-xl p-6">
          <h2 className="text-light-text dark:text-dark-text font-semibold mb-4 flex items-center gap-2">
            <Moon className="w-5 h-5 text-[#7440ff]" />
            Appearance
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-light-text/60 dark:text-dark-text/60" />
                <span className="text-light-text dark:text-dark-text">Dark Mode</span>
              </div>
              <button
                onClick={() => toggleSetting('appearance', 'darkMode')}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.appearance.darkMode ? 'bg-[#7440ff]' : 'bg-gray-600'
                } relative`}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full transition-transform ${
                  settings.appearance.darkMode ? 'bg-black right-1' : 'bg-white left-1'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-light-text/60 dark:text-dark-text/60" />
                <span className="text-light-text dark:text-dark-text">Reduced Motion</span>
              </div>
              <button
                onClick={() => toggleSetting('appearance', 'reducedMotion')}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.appearance.reducedMotion ? 'bg-[#7440ff]' : 'bg-gray-600'
                } relative`}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full transition-transform ${
                  settings.appearance.reducedMotion ? 'bg-black right-1' : 'bg-white left-1'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Privacy */}
        <div className="bg-light-card dark:bg-dark-card rounded-xl p-6">
          <h2 className="text-light-text dark:text-dark-text font-semibold mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-[#7440ff]" />
            Privacy
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserCheck className="w-5 h-5 text-light-text/60 dark:text-dark-text/60" />
                <span className="text-light-text dark:text-dark-text">Show Online Status</span>
              </div>
              <button
                onClick={() => toggleSetting('privacy', 'showOnlineStatus')}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.privacy.showOnlineStatus ? 'bg-[#7440FF]' : 'bg-gray-600'
                } relative`}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full transition-transform ${
                  settings.privacy.showOnlineStatus ? 'bg-black right-1' : 'bg-white left-1'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-light-text/60 dark:text-dark-text/60" />
                <span className="text-light-text dark:text-dark-text">Show Activity Status</span>
              </div>
              <button
                onClick={() => toggleSetting('privacy', 'showActivity')}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.privacy.showActivity ? 'bg-[#7440FF]' : 'bg-gray-600'
                } relative`}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full transition-transform ${
                  settings.privacy.showActivity ? 'bg-black right-1' : 'bg-white left-1'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Language */}
        <div className="bg-light-card dark:bg-dark-card rounded-xl p-6">
          <h2 className="text-light-text dark:text-dark-text font-semibold mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#CCFF00]" />
            Language
          </h2>
          <select
            value={settings.language}
            onChange={(e) => updateSettings({ language: e.target.value as Settings['language'] })}
            className="w-full bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#CCFF00] transition-shadow"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <MobileFooterNav />
    </div>
  );
};

export default Settings;