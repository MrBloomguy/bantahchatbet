import React from 'react';
import ChallengeChatTab from '../components/ChallengeChatTab';

const Challenges: React.FC = () => {

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      <div className="flex-grow">
        <ChallengeChatTab />
      </div>
    </div>
  );
};

export default Challenges;
