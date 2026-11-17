import React from 'react';

export const SkeletonCards: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white rounded-xl border border-[#70452F]/12 overflow-hidden animate-pulse"
        >
          <div className="aspect-[4/3] bg-[#EFE8DA]" />
          <div className="p-5 space-y-3">
            <div className="h-3 w-24 bg-[#EFE8DA] rounded" />
            <div className="h-5 w-3/4 bg-[#E6DDD0] rounded" />
            <div className="h-3.5 w-full bg-[#EFE8DA] rounded" />
            <div className="h-3.5 w-2/3 bg-[#EFE8DA] rounded" />
          </div>
        </div>
      ))}
    </div>
  );
};
