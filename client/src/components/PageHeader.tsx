import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import HeaderActions from './HeaderActions';

interface PageHeaderProps {
  title: string;
  showBackButton?: boolean;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, showBackButton = true }) => {
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            {showBackButton && (
              <button 
                onClick={() => navigate(-1)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h1 className="ml-2 text-base font-semibold sm:text-lg">{title}</h1>
          </div>
          
          <HeaderActions />
        </div>
      </div>
    </header>
  );
};

export default PageHeader;
