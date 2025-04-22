import React from 'react';
import { Star, Trophy, Crown, Medal, Award } from 'lucide-react';

type OnlineStatus = 'online' | 'away' | 'offline' | null;

interface UserAvatarProps {
  src?: string | null;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isSelected?: boolean;
  status?: OnlineStatus;
  className?: string;
  points?: number;
  showLevelBadge?: boolean;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  alt,
  size = 'md',
  isSelected = false,
  status = null,
  className = '',
  points = 0,
  showLevelBadge = false
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const statusSizeClasses = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
    xl: 'w-4 h-4'
  };

  const statusColorClasses = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    offline: 'bg-gray-400'
  };

  // Get level info based on points
  const getLevelInfo = (points: number) => {
    if (typeof points !== 'number' || isNaN(points)) return {
      name: 'Beginner',
      iconPath: '/Beginner.svg',
      color: 'bg-black',
      shadowColor: 'shadow-slate-200'
    };
    if (points >= 10000) return {
      name: 'Master',
      iconPath: '/master.svg',
      color: 'bg-black',
      shadowColor: 'shadow-amber-200'
    };
    if (points >= 5000) return {
      name: 'Expert',
      iconPath: '/expert.svg',
      color: 'bg-black',
      shadowColor: 'shadow-violet-200'
    };
    if (points >= 2000) return {
      name: 'Advanced',
      iconPath: '/advanced.svg',
      color: 'bg-black',
      shadowColor: 'shadow-blue-200'
    };
    if (points >= 500) return {
      name: 'Amateur',
      iconPath: '/amateur.svg',
      color: 'bg-black',
      shadowColor: 'shadow-emerald-200'
    };
    return {
      name: 'Beginner',
      iconPath: '/Beginner.svg',
      color: 'bg-black',
      shadowColor: 'shadow-slate-200'
    };
  };

  // Badge size classes based on avatar size
  const badgeSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7'
  };

  const level = getLevelInfo(points);

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <div className={`rounded-full overflow-hidden ${sizeClasses[size]}`}>
        {isSelected && (
          <div className="absolute inset-0 border-2 border-purple-500 rounded-full z-10" />
        )}
        <img
          src={src || `https://api.dicebear.com/7.x/avataaars/svg?seed=${alt}`}
          alt={alt}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Online status indicator */}
      {status && (
        <div
          className={`absolute bottom-0 right-0 ${statusSizeClasses[size]} ${statusColorClasses[status]} rounded-full border-2 border-white dark:border-gray-900 ${showLevelBadge ? 'bottom-0 right-6' : ''}`}
          aria-label={`Status: ${status}`}
        />
      )}

      {/* Level badge */}
      {showLevelBadge && (
        <div className={`absolute bottom-0 right-0 ${badgeSizeClasses[size]} rounded-full overflow-hidden border-2 border-white dark:border-gray-900`}>
          <div className={`w-full h-full flex items-center justify-center ${level.color} ${level.shadowColor}`}>
            {level.iconPath && (
              <img src={level.iconPath} alt={`${level.name} Badge`} className="w-full h-full p-0.5" />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAvatar;
