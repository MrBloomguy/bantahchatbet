import React, { useState } from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useWalletOperations } from '../hooks/useWalletOperations';
import UserAvatar from '../components/UserAvatar';

interface TransferScreenProps {
  amount: number;
}

const TransferScreen: React.FC<TransferScreenProps> = ({ amount }) => {
  const { currentUser } = useAuth();
  const { transfer } = useWalletOperations();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="flex items-center p-4">
          <button onClick={() => window.history.back()} className="p-2">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold flex-1 text-center">Tip</h1>
        </div>
      </div>

      <div className="p-4">
        {/* Current User Card */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-4">
            <UserAvatar
              url={currentUser?.avatar_url}
              size="lg"
              username={currentUser?.username}
            />
            <div>
              <h3 className="font-semibold">{currentUser?.name}</h3>
              <p className="text-gray-500">@{currentUser?.username}</p>
            </div>
          </div>
        </div>

        <h2 className="text-purple-700 font-medium mb-4">Choose Recipient</h2>

        {/* Search Input */}
        <div className="relative mb-6">
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border rounded-xl"
          />
          <Search className="w-5 h-5 absolute left-3 top-3.5 text-gray-400" />
        </div>

        {/* Recent Users Horizontal Scroll */}
        <div className="flex gap-4 overflow-x-auto pb-4 mb-6">
          {recentUsers.map((user) => (
            <div
              key={user.id}
              onClick={() => setSelectedUser(user)}
              className="flex flex-col items-center gap-2 cursor-pointer"
            >
              <UserAvatar
                url={user.avatar_url}
                size="lg"
                username={user.username}
                isSelected={selectedUser?.id === user.id}
              />
              <p className="text-sm font-medium">{user.username}</p>
            </div>
          ))}
        </div>

        {selectedUser && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
            <button
              onClick={() => transfer({ amount, recipientId: selectedUser.id })}
              className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium"
            >
              Tip ₦{amount.toLocaleString()} to @{selectedUser.username}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransferScreen;