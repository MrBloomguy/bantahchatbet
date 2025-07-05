import React from 'react';

interface CategoryButtonProps {
  icon: React.ReactNode | string;
  label: string;
  primary?: boolean;
  onClick?: () => void;
}

const CategoryButton: React.FC<CategoryButtonProps> = ({ 
  icon, 
  label, 
  primary,
  onClick 
}) => {
  return (
    <button 
      type="button"
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center p-2 relative cursor-pointer
        min-w-[72px] sm:min-w-[80px] font-sans transition-colors
        ${primary ? 'bg-primary text-white hover:bg-primary/90' : 'hover:bg-white/5'}
      `}
    >
      <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full flex items-center justify-center relative">
        {typeof icon === 'string' ? (
          <span className="text-3xl">{icon}</span>
        ) : (
          <div>{icon}</div>
        )}
      </div>
      <span className="text-sm mt-1">{label}</span>
    </button>
  );
}

export default CategoryButton;