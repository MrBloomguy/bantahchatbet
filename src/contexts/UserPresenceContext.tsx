import React, { createContext, useContext, ReactNode } from 'react';
import { useUserPresence } from '../hooks/useUserPresence';

type OnlineStatus = 'online' | 'away' | 'offline';

interface UserPresenceContextType {
  getUserStatus: (userId: string) => Promise<OnlineStatus>;
  loading: boolean;
  setOnline: () => void;
  setAway: () => void;
  setOffline: () => void;
  refreshStatuses: () => Promise<void>;
}

const UserPresenceContext = createContext<UserPresenceContextType | undefined>(undefined);

export const UserPresenceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const {
    getUserStatus,
    loading,
    setOnline,
    setAway,
    setOffline,
    refreshStatuses
  } = useUserPresence();

  return (
    <UserPresenceContext.Provider
      value={{
        getUserStatus,
        loading,
        setOnline,
        setAway,
        setOffline,
        refreshStatuses
      }}
    >
      {children}
    </UserPresenceContext.Provider>
  );
};

export const useUserPresenceContext = (): UserPresenceContextType => {
  const context = useContext(UserPresenceContext);
  if (context === undefined) {
    throw new Error('useUserPresenceContext must be used within a UserPresenceProvider');
  }
  return context;
};
