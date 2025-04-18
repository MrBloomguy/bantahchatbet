import React from 'react';
import { Star, Trophy, Crown, Medal, ShieldCheck, Award, Target } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from '../components/PageHeader';
import MobileFooterNav from '../components/MobileFooterNav';

interface Level {
  name: string;
  icon: JSX.Element;
  requiredPoints: number;
  color: string;
  benefits: string[];
  description: string;
}

const levels: Level[] = [
  {
    name: 'Beginner',
    icon: <Star className="w-12 h-12" />,
    requiredPoints: 0,
    color: 'from-gray-400 to-gray-500',
    benefits: ['Access to basic events', 'Participate in public groups'],
    description: 'Start your journey in Bantah'
  },
  {
    name: 'Intermediate',
    icon: <Medal className="w-12 h-12" />,
    requiredPoints: 500,
    color: 'from-green-400 to-green-500',
    benefits: ['5% bonus on winnings', 'Create public events'],
    description: 'Building your reputation'
  },
  {
    name: 'Advanced',
    icon: <Award className="w-12 h-12" />,
    requiredPoints: 2000,
    color: 'from-blue-400 to-blue-500',
    benefits: ['10% bonus on winnings', 'Create private events', 'Special badge in chat'],
    description: 'Experienced member of the community'
  },
  {
    name: 'Expert',
    icon: <Trophy className="w-12 h-12" />,
    requiredPoints: 5000,
    color: 'from-purple-400 to-purple-500',
    benefits: ['15% bonus on winnings', 'VIP support', 'Create premium events'],
    description: 'Elite status with exclusive benefits'
  },
  {
    name: 'Master',
    icon: <Crown className="w-12 h-12" />,
    requiredPoints: 10000,
    color: 'from-yellow-400 to-yellow-500',
    benefits: ['20% bonus on winnings', 'All platform features', 'Special profile effects'],
    description: 'Highest level of achievement'
  }
];

interface CurrentUser {
  id: string;
  points?: number;
  username?: string;
  name?: string;
  avatar_url?: string;
}

const Levels: React.FC = () => {
  const { currentUser: user } = useAuth();
  const currentUser = user as CurrentUser;
  const currentPoints = currentUser?.points || 0;

  const getCurrentLevel = () => {
    return levels.reduce((prev, curr) => {
      if (currentPoints >= curr.requiredPoints) {
        return curr;
      }
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
    <div className="min-h-screen bg-gradient-to-b from-[#F6F7FB] to-[#e9eafc]">
      <PageHeader title="Levels & Badges" />
      
      {/* Current Status */}
      <div className="max-w-xl mx-auto px-4 py-6">
        <div className="bg-white rounded-3xl p-6 mb-6 border border-[#f0f1fa]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Current Level</h2>
              <p className="text-gray-500">Keep earning points to level up!</p>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span className="text-lg font-bold">{currentPoints} Points</span>
            </div>
          </div>

          <div className="relative mb-6">
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#CCFF00] to-[#7C3AED] transition-all duration-500"
                style={{ width: `${progressToNext}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-500">
              <span>{currentLevel.name}</span>
              <span>{nextLevel.name}</span>
            </div>
          </div>

          <div className={`p-4 rounded-2xl bg-gradient-to-r ${currentLevel.color} text-white`}>
            <div className="flex items-center gap-4">
              {currentLevel.icon}
              <div>
                <h3 className="text-xl font-bold">{currentLevel.name}</h3>
                <p className="opacity-90">{currentLevel.description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* All Levels */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Level Progression</h2>
          {levels.map((level, index) => (
            <div 
              key={level.name}
              className={`bg-white rounded-2xl p-4 border ${
                currentPoints >= level.requiredPoints 
                  ? 'border-[#CCFF00]' 
                  : 'border-[#f0f1fa]'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${level.color} text-white`}>
                  {level.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{level.name}</h3>
                    <span className="text-sm text-gray-500">{level.requiredPoints} points</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{level.description}</p>
                  <div className="space-y-1">
                    {level.benefits.map((benefit, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-500">
                        <ShieldCheck className="w-4 h-4 text-[#CCFF00]" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <MobileFooterNav />
    </div>
  );
};

export default Levels;