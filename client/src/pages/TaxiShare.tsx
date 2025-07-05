import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TaxiShare: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#1a1b2e]">
      <div className="sticky top-0 bg-[#1a1b2e] border-b border-white/10 z-50">
        <div className="flex items-center px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="ml-2 text-lg font-semibold text-white">Taxi Share Map</h1>
        </div>
      </div>
      
      <div className="p-4">
        {/* Add your map implementation here */}
        <div className="bg-[#242538] rounded-xl p-4 text-white/60 text-center">
          Map implementation coming soon...
        </div>
      </div>
    </div>
  );
};

export default TaxiShare;