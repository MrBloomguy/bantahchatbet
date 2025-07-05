import React from 'react';

const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-light-bg dark:bg-[#1a1b2e] flex items-center justify-center z-50">
      <div className="flex flex-col items-center">
        <div>
          <img src="/bantahblue.svg" alt="App Logo" className="w-32 h-32" />
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
