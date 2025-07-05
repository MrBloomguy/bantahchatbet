import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative ${className}`}>
      <img
        src="/bantahblue.svg" // the URL where your SVG is hosted
        alt="Logo"
        className="w-full h-full"
      />
    </div>
  );
};

export default Logo;