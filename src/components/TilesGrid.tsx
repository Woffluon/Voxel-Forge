import React from 'react';

import { Example, UserContent, SelectedTile } from '@/types/app.types';
import { ExampleTile } from '@/components/ExampleTile';
import { buttonStyles } from '@/styles/button.styles';

type TilesGridProps = {
  examples: Example[];
  isLoading: boolean;
  selectedTile: SelectedTile;
  userContent: UserContent | null;
  showGenerator: boolean;
  onExampleClick: (example: Example, index: number) => void;
  onUserTileClick: () => void;
};

export const TilesGrid: React.FC<TilesGridProps> = ({
  examples,
  isLoading,
  selectedTile,
  userContent,
  showGenerator,
  onExampleClick,
  onUserTileClick,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 w-full">
      {examples.map((ex, idx) => (
        <ExampleTile
          key={idx}
          example={ex}
          index={idx}
          isSelected={selectedTile === idx}
          isLoading={isLoading}
          onClick={() => onExampleClick(ex, idx)}
        />
      ))}

      <button
        type="button"
        onClick={onUserTileClick}
        disabled={isLoading}
        aria-label="Generate new scene"
        className={`touch-manipulation ${buttonStyles.base} ${buttonStyles.tile} min-h-[44px] min-w-[44px] aspect-square flex flex-col items-center justify-center group overflow-hidden relative
                    ${selectedTile === 'user' ? 'scale-[1.02] -translate-y-1' : ''}
                    ${!userContent && !showGenerator ? 'text-black hover:bg-gray-50' : ''}
                    ${
                      showGenerator && selectedTile === 'user'
                        ? 'bg-black text-white shadow-[4px_4px_0px_0px_#888]'
                        : selectedTile === 'user'
                          ? 'shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'
                          : 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                    }
                `}
        title={userContent ? 'View Generated Image' : 'Generate New Image'}
      >
        {userContent ? (
          <>
            <img
              src={userContent.image}
              alt="My Generation"
              className="w-full h-full object-cover"
            />

            {selectedTile !== 'user' && (
              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center group-hover:bg-opacity-50 transition-all">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={3}
                  stroke="currentColor"
                  className="w-12 h-12 text-white drop-shadow-md"
                >
                  <path
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
              </div>
            )}

            {selectedTile === 'user' && showGenerator && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <span className="text-white font-bold uppercase text-sm">
                  Editing
                </span>
              </div>
            )}
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className={`w-10 h-10 transition-transform duration-300 ${showGenerator ? 'rotate-45' : 'group-hover:scale-110'}`}
            >
              <path
                strokeLinecap="square"
                strokeLinejoin="miter"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            <span className="text-xs sm:text-sm font-bold uppercase mt-2 min-h-[44px] px-4 py-2">
              {showGenerator ? 'Close' : 'Generate'}
            </span>
          </>
        )}
      </button>
    </div>
  );
};
