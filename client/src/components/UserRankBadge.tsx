import React from 'react';
import { Trophy } from 'lucide-react';

interface UserRankBadgeProps {
  rank: number;
  size?: 'sm' | 'md' | 'lg';
}

const UserRankBadge: React.FC<UserRankBadgeProps> = ({ rank, size = 'sm' }) => {
  const getColor = () => {
    if (rank === 1) return 'bg-yellow-500';
    if (rank === 2) return 'bg-gray-400';
    if (rank === 3) return 'bg-amber-700';
    return 'bg-[#7C3AED]';
  };

  const sizeClasses = {
    sm: 'h-4 text-xs px-1.5',
    md: 'h-5 text-xs',
    lg: 'h-6 text-sm'
  };

  const iconSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <div className={`inline-flex items-center gap-0.5 ${size === 'sm' ? 'px-1.5' : 'px-2'} ${sizeClasses[size]} ${getColor()} text-white rounded-full font-medium`}>
      <Trophy className={iconSizes[size]} />
      <span>#{rank}</span>
    </div>
  );
};

export default UserRankBadge;