import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { supabase } from '../lib/supabase';
import { sendPointsNotification } from '../utils/pointNotifications';

interface Level {
  name: string;
  threshold: number;
  color: string;
  shadowColor: string;
  icon: React.ReactNode;
  benefits: string[];
}

interface PointsContextType {
  awardPoints: (points: number, action: string) => Promise<void>;
  currentPoints: number;
  currentLevel: Level;
  showLevelUp: boolean;
  hideLevelUp: () => void;
  showPointsNotification: boolean;
  hidePointsNotification: () => void;
  lastPointsEarned: {
    points: number;
    action: string;
  };
  lastBadgeEarned: string | null;
}

const LEVELS: Level[] = [
  {
    name: "Rookie",
    threshold: 0,
    color: "bg-gray-500",
    shadowColor: "shadow-gray-500/50",
    icon: "🌟",
    benefits: ["Basic chat access", "Join public events"]
  },
  {
    name: "Challenger",
    threshold: 100,
    color: "bg-blue-500",
    shadowColor: "shadow-blue-500/50",
    icon: "⚔️",
    benefits: ["Create challenges", "Custom profile badge"]
  },
  {
    name: "Veteran",
    threshold: 500,
    color: "bg-purple-500",
    shadowColor: "shadow-purple-500/50",
    icon: "🏆",
    benefits: ["Create private events", "Extended chat features"]
  },
  {
    name: "Champion",
    threshold: 1000,
    color: "bg-yellow-500",
    shadowColor: "shadow-yellow-500/50",
    icon: "👑",
    benefits: ["VIP status", "Special event access"]
  },
  {
    name: "Legend",
    threshold: 5000,
    color: "bg-gradient-to-r from-[#CCFF00] to-[#7C3AED]",
    shadowColor: "shadow-purple-500/50",
    icon: "🌟",
    benefits: ["Create tournaments", "Exclusive rewards"]
  }
];

const PointsContext = createContext<PointsContextType | null>(null);

export const usePoints = () => {
  const context = useContext(PointsContext);
  if (!context) {
    throw new Error('usePoints must be used within a PointsProvider');
  }
  return context;
};

export const PointsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const [currentPoints, setCurrentPoints] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showPointsNotification, setShowPointsNotification] = useState(false);
  const [lastPointsEarned, setLastPointsEarned] = useState({ points: 0, action: '' });
  const [lastBadgeEarned, setLastBadgeEarned] = useState<string | null>(null);

  const getCurrentLevel = useCallback((points: number) => {
    return LEVELS.reduce((current, level) => {
      if (points >= level.threshold) return level;
      return current;
    }, LEVELS[0]);
  }, []);

  const awardPoints = useCallback(async (points: number, action: string) => {
    if (!currentUser) return;

    try {
      const newTotal = currentPoints + points;
      const previousLevel = getCurrentLevel(currentPoints);
      const newLevel = getCurrentLevel(newTotal);

      // Update points in database
      const { error } = await supabase
        .from('user_points')
        .upsert({
          user_id: currentUser.id,
          points: newTotal,
          last_action: action,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Update local state
      setCurrentPoints(newTotal);
      setLastPointsEarned({ points, action });
      setShowPointsNotification(true);

      // Send points earned notification
      await sendPointsNotification('points_earned', {
        userId: currentUser.id,
        points,
        action
      });

      // Check for level up
      if (newLevel.threshold > previousLevel.threshold) {
        setShowLevelUp(true);
        
        // Send level up notification
        await sendPointsNotification('level_up', {
          userId: currentUser.id,
          points: newTotal,
          action: 'Level up!',
          level: {
            name: newLevel.name,
            benefits: newLevel.benefits
          }
        });
      }

    } catch (error) {
      console.error('Error awarding points:', error);
      toast.showError('Failed to award points');
    }
  }, [currentUser, currentPoints, getCurrentLevel, toast]);

  const hideLevelUp = useCallback(() => {
    setShowLevelUp(false);
  }, []);

  const hidePointsNotification = useCallback(() => {
    setShowPointsNotification(false);
  }, []);

  return (
    <PointsContext.Provider
      value={{
        awardPoints,
        currentPoints,
        currentLevel: getCurrentLevel(currentPoints),
        showLevelUp,
        hideLevelUp,
        showPointsNotification,
        hidePointsNotification,
        lastPointsEarned,
        lastBadgeEarned
      }}
    >
      {children}
    </PointsContext.Provider>
  );
};