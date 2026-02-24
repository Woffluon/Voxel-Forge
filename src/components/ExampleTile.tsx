import React, { useMemo } from 'react';

import { Example } from '@/types/app.types';
import { buttonStyles } from '@/styles/button.styles';

type ExampleTileProps = {
  example: Example;
  index: number;
  isSelected: boolean;
  isLoading: boolean;
  onClick: () => void;
};

export const ExampleTile = React.memo(
  ({ example, index, isSelected, isLoading, onClick }: ExampleTileProps) => {
    const className = useMemo(() => {
      return `touch-manipulation ${buttonStyles.base} ${buttonStyles.tile} min-h-[44px] min-w-[44px] aspect-square relative overflow-hidden group cursor-pointer bg-stark-white border-[3px] border-pitch-black
                        ${
                          isSelected
                            ? 'scale-[1.02] shadow-brutal-xl -translate-y-1 -translate-x-1 outline outline-[3px] outline-acid-green z-10'
                            : 'shadow-brutal-md z-0'
                        }`;
    }, [isSelected]);

    return (
      <button
        key={index}
        type="button"
        onClick={onClick}
        disabled={isLoading}
        aria-label={`Load Example ${index + 1}`}
        className={className}
        title="Click to view example scene"
      >
        <img
          src={example.img}
          loading="lazy"
          decoding="async"
          alt={example.alt}
          className="w-full h-full object-cover"
        />
        {!isSelected && (
          <div className="absolute inset-0 bg-white bg-opacity-40 group-hover:bg-opacity-0 transition-all duration-200"></div>
        )}
      </button>
    );
  }
);

ExampleTile.displayName = 'ExampleTile';
