import React, { createContext, useContext, useState, useEffect, ReactNode, Dispatch, SetStateAction } from 'react';

interface Settings {
  notifications: {
    push: boolean;
    inApp: boolean;
  };
  appearance: {
    darkMode: boolean;
    reducedMotion: boolean;
  };
  privacy: {
    showOnlineStatus: boolean;
  };
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: Dispatch<SetStateAction<Settings>>;
  toggleSetting: (category: keyof Settings, setting: string) => void;
}

const defaultSettings: Settings = {
  notifications: {
    push: true,
    inApp: true,
  },
  appearance: {
    darkMode: false,
    reducedMotion: false,
  },
  privacy: {
    showOnlineStatus: true,
  },
};

const SettingsContext = createContext<SettingsContextType | null>(null);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const savedSettings = localStorage.getItem('app_settings');
      return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
    } catch (error) {
      console.error('Error loading settings:', error);
      return defaultSettings;
    }
  });

  // Apply settings effects
  useEffect(() => {
    try {
      // Save settings to localStorage
      localStorage.setItem('app_settings', JSON.stringify(settings));

      // Apply dark mode
      if (settings.appearance.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      // Apply reduced motion
      if (settings.appearance.reducedMotion) {
        document.documentElement.classList.add('reduce-motion');
      } else {
        document.documentElement.classList.remove('reduce-motion');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }, [settings]);

  // Initialize dark mode based on system preference
  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark && !localStorage.getItem('app_settings')) {
      setSettings(prev => ({
        ...prev,
        appearance: {
          ...prev.appearance,
          darkMode: true
        }
      }));
    }
  }, []);

  const updateSettings: Dispatch<SetStateAction<Settings>> = (newSettings) => {
    setSettings(newSettings);
  }

  const toggleSetting = (category: keyof Settings, setting: string) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: !prev[category][setting],
      },
    }) as Settings);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, toggleSetting }}>
      {children}
    </SettingsContext.Provider>
  );
};
