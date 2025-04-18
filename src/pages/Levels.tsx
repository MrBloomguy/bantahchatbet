import React from 'react';
import { Star, Trophy, Crown, Medal, ShieldCheck, Award, Target } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from '../components/PageHeader';
import MobileFooterNav from '../components/MobileFooterNav';

const levels = [
  {
    name: 'Beginner',
    icon: <Star className="w-full h-full transform -rotate-12" />,
    requiredPoints: 0,
    color: 'from-slate-400 to-slate-500',
    benefits: ['Access to basic events', 'Participate in public groups'],
    description: 'Start your journey in Bantah',
    shadowColor: 'shadow-slate-200'
  },
  {
    name: 'Intermediate',
    icon: <Medal className="w-full h-full transform rotate-12" />,
    requiredPoints: 500,
    color: 'from-emerald-400 to-teal-500',
    benefits: ['5% bonus on winnings', 'Create public events'],
    description: 'Building your reputation',
    shadowColor: 'shadow-emerald-200'
  },
  {
    name: 'Advanced',
    icon: <Award className="w-full h-full transform -rotate-6" />,
    requiredPoints: 2000,
    color: 'from-blue-400 to-indigo-500',
    benefits: ['10% bonus', 'Create private events', 'Special badge in chat'],
    description: 'Experienced member',
    shadowColor: 'shadow-blue-200'
  },
  {
    name: 'Expert',
    icon: <Trophy className="w-full h-full transform rotate-6" />,
    requiredPoints: 5000,
    color: 'from-violet-400 to-purple-500',
    benefits: ['15% bonus', 'VIP support', 'Create premium events'],
    description: 'Elite status',
    shadowColor: 'shadow-violet-200'
  },
  {
    name: 'Master',
    icon: <Crown className="w-full h-full transform -rotate-12" />,
    requiredPoints: 10000,
    color: 'from-amber-400 to-yellow-500',
    benefits: ['20% bonus', 'All features', 'Special effects'],
    description: 'Ultimate achievement',
    shadowColor: 'shadow-amber-200'
  }
];

const Levels = () => {
  const { currentUser: user } = useAuth();
  const currentPoints = user?.points || 0;

  const getCurrentLevel = () => {
    return levels.reduce((prev, curr) => {
      if (currentPoints >= curr.requiredPoints) return curr;
      return prev;
    });
  };

  const getNextLevel = () => {
    const nextLevel = levels.find(level => level.requiredPoints > currentPoints);
    return nextLevel || levels[levels.length - 1];
  };

  const currentLevel = getCurrentLevel();
  const nextLevel = getNextLevel();
  const progressToNext = nextLevel.requiredPoints > currentPoints
    ? ((currentPoints - currentLevel.requiredPoints) / (nextLevel.requiredPoints - currentLevel.requiredPoints)) * 100
    : 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <PageHeader title="Level Progress" />
      
      <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
        {/* Current Status Card */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{currentLevel.name}</h2>
              <p className="text-gray-500">{currentLevel.description}</p>
            </div>
            <div className="flex items-center gap-2 bg-[#f8f8f8] px-3 py-1.5 rounded-full border border-gray-100">
              <Star className="w-5 h-5 text-[#CCFF00]" />
              <span className="text-gray-900 font-bold">{currentPoints}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#CCFF00] to-[#7C3AED] transition-all duration-500"
                style={{ width: `${progressToNext}%` }}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium text-[#7C3AED]">{currentLevel.name}</span>
              <span className="text-gray-500">{nextLevel.requiredPoints - currentPoints} points to {nextLevel.name}</span>
            </div>
          </div>

          {/* Current Benefits */}
          <div className="mt-6">
            <h3 className="text-gray-900 font-semibold mb-3">Active Benefits</h3>
            <div className="grid grid-cols-2 gap-3">
              {currentLevel.benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <ShieldCheck className="w-4 h-4 text-[#CCFF00]" />
                  <span className="text-gray-600">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Level Progress Cards */}
        <div className="space-y-4">
          {levels.map((level, index) => {
            const isUnlocked = currentPoints >= level.requiredPoints;
            const progress = Math.min(100, (currentPoints / level.requiredPoints) * 100);
            
            return (
              <div 
                key={level.name}
                className={`bg-white rounded-xl overflow-hidden transition-all duration-300 shadow-lg border ${
                  isUnlocked ? 'border-[#CCFF00]' : 'border-gray-100'
                }`}
              >
                <div className="p-4">
                  <div className="flex items-center gap-4">
                    <div 
                      className={`w-14 h-14 rounded-xl bg-gradient-to-br ${level.color} 
                        flex items-center justify-center p-2.5 transform hover:scale-110 
                        transition-all duration-300 shadow-lg ${level.shadowColor} ${
                        isUnlocked ? 'opacity-100' : 'opacity-40'
                      }`}
                      style={{
                        transform: 'perspective(1000px) rotateX(10deg) rotateY(-10deg)',
                      }}
                    >
                      {level.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className={`font-bold ${isUnlocked ? 'text-gray-900' : 'text-gray-400'}`}>
                          {level.name}
                        </h3>
                        <span className="text-sm text-gray-500">{level.requiredPoints} points</span>
                      </div>
                      
                      {/* Level Meter */}
                      <div className="space-y-1">
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              isUnlocked ? 'bg-gradient-to-r from-[#CCFF00] to-[#7C3AED]' : 'bg-gray-300'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className={`${isUnlocked ? 'text-[#7C3AED]' : 'text-gray-400'}`}>
                            {Math.floor(progress)}%
                          </span>
                          {!isUnlocked && (
                            <span className="text-gray-400">
                              {level.requiredPoints - currentPoints} points needed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <MobileFooterNav />
    </div>
  );
};

export default Levels;