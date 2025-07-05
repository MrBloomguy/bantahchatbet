import React from 'react';
import UserAvatar from './UserAvatar';

interface UserProfileCardProps {
  user: {
    id: string;
    name: string;
    username: string;
    avatar_url?: string;
    bio?: string;
    reputation_score?: number;
    status?: string;
  };
  onClose?: () => void;
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({ user, onClose }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
      <div className="flex flex-col items-center">
        <UserAvatar src={user.avatar_url} alt={user.name} size="xl" />
        <h2 className="mt-4 text-xl font-semibold">{user.name}</h2>
        <p className="text-gray-600">@{user.username}</p>
        {user.bio && <p className="mt-2 text-center text-gray-700">{user.bio}</p>}
        <div className="mt-4 flex items-center space-x-2">
          <span className={`w-3 h-3 rounded-full ${user.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span className="text-sm text-gray-600">{user.status || 'offline'}</span>
        </div>
        {user.reputation_score !== undefined && (
          <div className="mt-2 text-sm text-gray-600">
            Reputation: {user.reputation_score}
          </div>
        )}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="mt-4 w-full py-2 px-4 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
        >
          Close
        </button>
      )}
    </div>
  );
};

export default UserProfileCard;
