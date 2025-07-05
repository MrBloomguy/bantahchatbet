import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface LoadingOverlayProps {
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#000000] rounded-xl p-6 flex flex-col items-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-white">{message}</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;