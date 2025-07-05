import React from 'react';

const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg', color?: string }> = ({ 
  size = 'md', 
  color = '#000000' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-t-transparent ${sizeClasses[size]}`} 
         style={{ borderColor: `${color}40`, borderTopColor: color }} 
    />
  );
};

export default LoadingSpinner;
