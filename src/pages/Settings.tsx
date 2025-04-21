import React from 'react';
import { ArrowRight, Bell, Moon, Eye, Globe, Volume2, Mail, Radio, Activity, UserCheck, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
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
    <div className="min-h-screen bg-[#F6F7FB] flex flex-col pb-[70px] items-center"> {/* Center content */}
      <div className="w-full max-w-md"> {/* Limit width */}
        <PageHeader title="Settings" />

        <div className="p-4 space-y-4">
          {/* Profile Section (Subtler Card) */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 flex items-center justify-between">
          </div>

          {/* Notifications Section (Grouped Card) */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <h2 className="text-gray-900 dark:text-gray-100 font-semibold mb-3 flex items-center gap-2 text-sm">
              <Bell className="w-4 h-4 text-[#7440ff]" />
              Notifications
            </h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  <Radio className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-800 dark:text-gray-200 text-sm">Push Notifications</span>
                </div>
                <button
                  onClick={() => toggleSetting('notifications', 'push')}
                  className={`w-11 h-5 rounded-full transition-colors ${
                    settings.notifications.push ? 'bg-[#7440ff]' : 'bg-gray-400 dark:bg-gray-600'
                  } relative focus:outline-none`}
                >
                  <span className={`absolute top-[2px] w-3 h-3 rounded-full transition-transform ${
                    settings.notifications.push ? 'bg-white right-1' : 'bg-white left-1'
                  }`} />
                </button>
              </div>
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-800 dark:text-gray-200 text-sm">Email Notifications</span>
                </div>
                <button
                  onClick={() => toggleSetting('notifications', 'email')}
                  className={`w-11 h-5 rounded-full transition-colors ${
                    settings.notifications.email ? 'bg-[#7440ff]' : 'bg-gray-400 dark:bg-gray-600'
                  } relative focus:outline-none`}
                >
                  <span className={`absolute top-[2px] w-3 h-3 rounded-full transition-transform ${
                    settings.notifications.email ? 'bg-white right-1' : 'bg-white left-1'
                  }`} />
                </button>
              </div>
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  <Volume2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-800 dark:text-gray-200 text-sm">Sound Effects</span>
                </div>
                <button
                  onClick={() => toggleSetting('notifications', 'sound')}
                  className={`w-11 h-5 rounded-full transition-colors ${
                    settings.notifications.sound ? 'bg-[#7440ff]' : 'bg-gray-400 dark:bg-gray-600'
                  } relative focus:outline-none`}
                >
                  <span className={`absolute top-[2px] w-3 h-3 rounded-full transition-transform ${
                    settings.notifications.sound ? 'bg-white right-1' : 'bg-white left-1'
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
                  onClick={() => toggleSetting('appearance', 'darkMode')}
                  className={`w-11 h-5 rounded-full transition-colors ${
                    settings.appearance.darkMode ? 'bg-[#7440ff]' : 'bg-gray-400 dark:bg-gray-600'
                  } relative focus:outline-none`}
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
                  onClick={() => toggleSetting('appearance', 'reducedMotion')}
                  className={`w-11 h-5 rounded-full transition-colors ${
                    settings.appearance.reducedMotion ? 'bg-[#7440ff]' : 'bg-gray-400 dark:bg-gray-600'
                  } relative focus:outline-none`}
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
                  onClick={() => toggleSetting('privacy', 'showOnlineStatus')}
                  className={`w-11 h-5 rounded-full transition-colors ${
                    settings.privacy.showOnlineStatus ? 'bg-[#7440ff]' : 'bg-gray-400 dark:bg-gray-600'
                  } relative focus:outline-none`}
                >
                  <span className={`absolute top-[2px] w-3 h-3 rounded-full transition-transform ${
                    settings.privacy.showOnlineStatus ? 'bg-white right-1' : 'bg-white left-1'
                  }`} />
                </button>
              </div>
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  <Activity className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-800 dark:text-gray-200 text-sm">Show Activity Status</span>
                </div>
                <button
                  onClick={() => toggleSetting('privacy', 'showActivity')}
                  className={`w-11 h-5 rounded-full transition-colors ${
                    settings.privacy.showActivity ? 'bg-[#7440ff]' : 'bg-gray-400 dark:bg-gray-600'
                  } relative focus:outline-none`}
                >
                  <span className={`absolute top-[2px] w-3 h-3 rounded-full transition-transform ${
                    settings.privacy.showActivity ? 'bg-white right-1' : 'bg-white left-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Language Section (Styled Select) */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <h2 className="text-gray-900 dark:text-gray-100 font-semibold mb-3 flex items-center gap-2 text-sm">
              <Globe className="w-4 h-4 text-[#CCFF00]" />
              Language
            </h2>
            <select
              value={settings.language}
              onChange={(e) => updateSettings({ language: e.target.value as Settings['language'] })}
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#CCFF00] text-sm"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
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
          App ver 2.0.1
        </div>
      </div>
    </div>
  );
};

export default Settings;