import React from 'react';
import { Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface GroupCardProps {
  name: string;
  image: string;
  members: number;
  activeEvents: number;
  category: string;
  onJoin?: () => void;
}

const GroupCard: React.FC<GroupCardProps> = ({
  name,
  image,
  members,
  activeEvents,
  category,
  onJoin
}) => {
  const { currentUser, login } = useAuth();

  const handleJoin = () => {
    if (!currentUser) {
      login();
      return;
    }
    onJoin?.();
  };

  return (
    <div 
      onClick={handleJoin}
      className="bg-[#242538] rounded-xl overflow-hidden hover:scale-[1.02] transition-transform cursor-pointer"
    >
      <div className="relative h-40">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-white font-semibold text-lg line-clamp-1">{name}</h3>
          <span className="text-[#CCFF00] text-sm">{category}</span>
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between text-white/80 text-sm">
          <div className="flex items-center gap-1">
            <Users size={16} />
            <span>{members.toLocaleString()}</span>
          </div>
          <span>{activeEvents} active {activeEvents === 1 ? 'event' : 'events'}</span>
        </div>
      </div>
    </div>
  );
};

export default GroupCard;