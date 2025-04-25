import React, { createContext, useContext, useState, useEffect } from 'react';
import SplashScreen from '../components/SplashScreen';

interface SplashScreenContextType {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const SplashScreenContext = createContext<SplashScreenContextType | undefined>(undefined);

export const SplashScreenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial app loading logic
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SplashScreenContext.Provider value={{ isLoading, setIsLoading }}>
      {isLoading ? <SplashScreen /> : children}
    </SplashScreenContext.Provider>
  );
};

export const useSplashScreen = () => {
  const context = useContext(SplashScreenContext);
  if (context === undefined) {
    throw new Error('useSplashScreen must be used within a SplashScreenProvider');
  }
  return context;
};
