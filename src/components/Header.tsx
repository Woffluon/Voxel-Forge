import React from 'react';

export const Header: React.FC = () => {
  return (
    <div className="text-center border-b-2 border-black pb-6">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-black leading-tight tracking-tight">
        VOXELFORGE
      </h1>
      <p className="mt-2 text-base sm:text-lg text-gray-600 font-semibold">
        Transform images into stunning 3D voxel art with AI.
      </p>
    </div>
  );
};
