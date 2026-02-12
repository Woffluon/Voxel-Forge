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
      return `touch-manipulation ${buttonStyles.base} ${buttonStyles.tile} min-h-[44px] min-w-[44px] aspect-square relative overflow-hidden group cursor-pointer bg-gray-100
                        ${
                          isSelected
                            ? 'scale-[1.02] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] -translate-y-1'
                            : 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
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
