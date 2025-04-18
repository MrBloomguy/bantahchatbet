import React from 'react';
import { Star, Trophy, Crown, Medal } from 'lucide-react';

interface UserLevelBadgeProps {
  points: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const UserLevelBadge: React.FC<UserLevelBadgeProps> = ({ points, size = 'sm', showLabel = true }) => {
  const getLevel = (points: number) => {
    if (points >= 10000) return { level: 'Master', icon: Crown, color: 'bg-yellow-500', textColor: 'text-yellow-500' };
    if (points >= 5000) return { level: 'Expert', icon: Trophy, color: 'bg-purple-500', textColor: 'text-purple-500' };
    if (points >= 2000) return { level: 'Advanced', icon: Medal, color: 'bg-blue-500', textColor: 'text-blue-500' };
    if (points >= 500) return { level: 'Intermediate', icon: Star, color: 'bg-green-500', textColor: 'text-green-500' };
    return { level: 'Beginner', icon: Star, color: 'bg-gray-500', textColor: 'text-gray-500' };
  };

  const sizeClasses = {
    sm: 'text-xs h-5',
    md: 'text-sm h-6',
    lg: 'text-base h-8'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const levelInfo = getLevel(points);
  const Icon = levelInfo.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 ${sizeClasses[size]} ${levelInfo.color}/10 ${levelInfo.textColor} rounded-full font-medium`}>
      <Icon className={iconSizes[size]} />
      {showLabel && <span>{levelInfo.level}</span>}
    </div>
  );
};

export default UserLevelBadge;