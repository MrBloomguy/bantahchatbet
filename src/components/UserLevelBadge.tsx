import React from 'react';
import { Star, Trophy, Crown, Medal, Award } from 'lucide-react';

interface UserLevelBadgeProps {
  points: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const UserLevelBadge: React.FC<UserLevelBadgeProps> = ({ 
  points, 
  size = 'md',
  showLabel = true 
}) => {
  const getLevelInfo = (points: number) => {
    if (points >= 10000) return {
      name: 'Master',
      icon: <Crown />,
      color: 'from-yellow-400 to-yellow-500',
      borderColor: 'border-yellow-400'
    };
    if (points >= 5000) return {
      name: 'Expert',
      icon: <Trophy />,
      color: 'from-purple-400 to-purple-500',
      borderColor: 'border-purple-400'
    };
    if (points >= 2000) return {
      name: 'Advanced',
      icon: <Award />,
      color: 'from-blue-400 to-blue-500',
      borderColor: 'border-blue-400'
    };
    if (points >= 500) return {
      name: 'Intermediate',
      icon: <Medal />,
      color: 'from-green-400 to-green-500',
      borderColor: 'border-green-400'
    };
    return {
      name: 'Beginner',
      icon: <Star />,
      color: 'from-gray-400 to-gray-500',
      borderColor: 'border-gray-400'
    };
  };

  const sizeClasses = {
    sm: {
      badge: 'h-6 text-xs',
      icon: 'w-3 h-3'
    },
    md: {
      badge: 'h-8 text-sm',
      icon: 'w-4 h-4'
    },
    lg: {
      badge: 'h-10 text-base',
      icon: 'w-5 h-5'
    }
  };

  const level = getLevelInfo(points);

  return (
    <div className={`relative inline-flex items-center ${showLabel ? 'pr-3' : ''} ${sizeClasses[size].badge} rounded-full bg-gradient-to-r ${level.color}`}>
      {/* Icon container with border */}
      <div className={`relative flex items-center justify-center rounded-full aspect-square ${sizeClasses[size].badge} border-2 ${level.borderColor} bg-white/10`}>
        <div className={sizeClasses[size].icon}>
          {level.icon}
        </div>
      </div>

      {/* Level name */}
      {showLabel && (
        <span className="ml-1 font-semibold text-white">
          {level.name}
        </span>
      )}
    </div>
  );
};

export default UserLevelBadge;