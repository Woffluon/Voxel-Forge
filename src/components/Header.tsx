import React from 'react';

export const Header: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center border-b-[6px] border-pitch-black pb-6 sm:pb-8 pt-2 sm:pt-4">
      <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-none tracking-tighter uppercase mb-3 sm:mb-4 px-2">
        VOXELFORGE
      </h1>
      <div className="inline-block bg-acid-green border-[3px] border-pitch-black shadow-brutal-sm px-4 sm:px-6 py-1.5 sm:py-2 rounded-full transform -rotate-2 hover:rotate-0 transition-transform duration-200">
        <p className="text-xs sm:text-sm md:text-base text-pitch-black font-bold uppercase tracking-wide">
          Transform images into stunning 3D voxel art with AI
        </p>
      </div>
    </div>
  );
};
