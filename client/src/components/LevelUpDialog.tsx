import React from 'react';
import { usePoints } from '../contexts/PointsContext';
import { Star, Crown, Trophy, Medal, Award } from 'lucide-react';

const LevelUpDialog: React.FC = () => {
  const { currentLevel, hideLevelUp, showLevelUp } = usePoints();

  if (!showLevelUp) return null;

  const getLevelIcon = () => {
    switch (currentLevel.name) {
      case 'Master':
        return <Crown className="w-12 h-12 text-yellow-500" />;
      case 'Expert':
        return <Trophy className="w-12 h-12 text-purple-500" />;
      case 'Advanced':
        return <Award className="w-12 h-12 text-blue-500" />;
      case 'Intermediate':
        return <Medal className="w-12 h-12 text-green-500" />;
      default:
        return <Star className="w-12 h-12 text-gray-500" />;
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 transform animate-bounce-in">
        <div className="text-center">
          <div className="mx-auto w-24 h-24 bg-gradient-to-r from-[#CCFF00] to-[#7C3AED] rounded-full flex items-center justify-center mb-4">
            {getLevelIcon()}
          </div>
          <h2 className="text-2xl font-bold mb-2">Level Up!</h2>
          <p className="text-lg text-gray-600 mb-4">
            Congratulations! You've reached {currentLevel.name} level!
          </p>
          
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h3 className="font-semibold mb-3">New Benefits Unlocked:</h3>
            <ul className="space-y-2">
              {currentLevel.benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                  <Star className="w-4 h-4 text-[#CCFF00]" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={hideLevelUp}
            className="w-full py-3 px-4 bg-gradient-to-r from-[#CCFF00] to-[#7C3AED] text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default LevelUpDialog;