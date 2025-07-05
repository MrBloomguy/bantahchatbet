import React from 'react';

const SkeletonEventCard: React.FC = () => (
  <div className="flex items-center bg-white rounded-2xl shadow-sm px-4 py-3 border border-transparent animate-pulse mb-2">
    {/* Banner skeleton */}
    <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gray-200 mr-4" />
    {/* Content skeleton */}
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <div className="h-4 w-32 bg-gray-200 rounded" />
        <div className="h-4 w-12 bg-gray-200 rounded" />
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2">
        <div className="h-3 w-20 bg-gray-200 rounded" />
        <div className="h-3 w-16 bg-gray-200 rounded" />
        <div className="h-3 w-10 bg-gray-200 rounded" />
      </div>
      <div className="flex items-center gap-3">
        <div className="h-3 w-16 bg-gray-200 rounded" />
        <div className="h-3 w-12 bg-gray-200 rounded" />
      </div>
    </div>
    {/* Actions skeleton */}
    <div className="flex flex-col gap-2 ml-4">
      <div className="h-7 w-14 bg-gray-200 rounded-full" />
      <div className="h-7 w-14 bg-gray-200 rounded-full" />
    </div>
  </div>
);

export default SkeletonEventCard;
