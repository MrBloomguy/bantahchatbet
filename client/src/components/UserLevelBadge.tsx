import React from 'react';
import { Star, Trophy, Crown, Medal, Award } from 'lucide-react';

interface UserLevelBadgeProps {
  points: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const UserLevelBadge: React.FC<UserLevelBadgeProps> = ({
  points,
  size = 'md',
  showLabel = true
}) => {
  // Defensive: always use a valid size
  const safeSize = ['xs', 'sm', 'md', 'lg'].includes(size) ? size : 'md';
  const getLevelInfo = (points: number) => {
    if (typeof points !== 'number' || isNaN(points)) return {
      name: 'Beginner',
      iconPath: '/Beginner.svg',
      color: 'bg-black',
      textColor: 'text-gray-900'
    };
    if (points >= 10000) return {
      name: 'Master',
      iconPath: '/master.svg',
      color: 'bg-black',
      textColor: 'text-amber-700'
    };
    if (points >= 5000) return {
      name: 'Expert',
      iconPath: '/expert.svg',
      color: 'bg-black',
      textColor: 'text-purple-700'
    };
    if (points >= 2000) return {
      name: 'Advanced',
      iconPath: '/advanced.svg',
      color: 'bg-black',
      textColor: 'text-blue-700'
    };
    if (points >= 500) return {
      name: 'Amateur',
      iconPath: '/amateur.svg',
      color: 'bg-black',
      textColor: 'text-emerald-700'
    };
    return {
      name: 'Beginner',
      iconPath: '/Beginner.svg',
      color: 'bg-black',
      textColor: 'text-gray-900'
    };
  };

  const sizeClasses = {
xs: {
      badge: 'h-4 text-[10px]',
      icon: 'w-2 h-2'
    },
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

  // Defensive: fallback if sizeClasses[safeSize] is undefined
  const badgeClass = sizeClasses[safeSize]?.badge || 'h-8 text-sm';
  const iconClass = sizeClasses[safeSize]?.icon || 'w-4 h-4';

  return (
    <div className={`relative inline-flex items-center ${showLabel ? 'pr-3' : ''} ${sizeClasses[size].badge} rounded-full bg-gray-100`}>
      {/* Icon container with badge */}
      <div className={`relative flex items-center justify-center rounded-full aspect-square ${badgeClass} overflow-hidden`}>
        {level.iconPath && (
          <img src={level.iconPath} alt={`${level.name} Badge`} className="w-full h-full" />
        )}
      </div>
      {showLabel && (
        <span className={`ml-1 font-semibold ${level.textColor}`}>
          {level.name}
        </span>
      )}
    </div>
  );
};

export default UserLevelBadge;