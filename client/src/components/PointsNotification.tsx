import React, { useEffect } from 'react';
import { usePoints } from '../contexts/PointsContext';
import { Star } from 'lucide-react';

const PointsNotification: React.FC = () => {
  const { showPointsNotification, hidePointsNotification, lastPointsEarned } = usePoints();

  useEffect(() => {
    if (showPointsNotification) {
      const timer = setTimeout(hidePointsNotification, 3000);
      return () => clearTimeout(timer);
    }
  }, [showPointsNotification, hidePointsNotification]);

  if (!showPointsNotification) return null;

  return (
    <div className="fixed top-4 right-4 z-50 transform transition-all duration-300 animate-slide-in">
      <div className="bg-white rounded-xl shadow-lg p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-r from-[#CCFF00] to-[#7C3AED] rounded-full flex items-center justify-center">
          <Star className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="font-semibold text-gray-900">+{lastPointsEarned.points} Points</p>
          <p className="text-sm text-gray-500">{lastPointsEarned.action}</p>
        </div>
      </div>
    </div>
  );
};

export default PointsNotification;