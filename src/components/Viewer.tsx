import React from 'react';

import { AppStatus, ViewMode } from '@/types/app.types';
import { buttonStyles } from '@/styles/button.styles';

type ViewerProps = {
  isVisible: boolean;
  isLoading: boolean;
  status: AppStatus;
  thinkingText: string | null;
  displayPrompt: string;
  imageData: string | null;
  voxelCode: string | null;
  voxelUrl: string | null;
  viewMode: ViewMode;
  onToggleView: () => void;
  onDownload: () => void;
  onVoxelize: () => void;
};

export const Viewer: React.FC<ViewerProps> = ({
  isVisible,
  isLoading,
  status,
  thinkingText,
  displayPrompt,
  imageData,
  voxelCode,
  voxelUrl,
  viewMode,
  onToggleView,
  onDownload,
  onVoxelize,
}) => {
  if (!isVisible) return null;

  return (
    <div className="space-y-2">
      <div
        className="w-full h-[60vh] sm:h-auto sm:aspect-square border-2 border-black relative bg-gray-50 flex items-center justify-center overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        role="region"
        aria-label="Content Viewer"
      >
        {isLoading && (
          <div
            className="absolute inset-0 bg-white z-20 flex flex-col items-start justify-center p-8 sm:p-12 overflow-hidden"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <div className="sr-only">
              {status === 'generating_image'
                ? 'Generating image, please wait'
                : 'Generating voxel scene, please wait'}
            </div>
            <div aria-hidden="true">
              <div className="w-full max-w-3xl mb-12 text-xl font-bold tracking-tight">
                {status === 'generating_image'
                  ? 'Generating three.js scene with Gemini 2.5 Flash Image'
                  : 'Generating three.js scene with Gemini 3 Pro'}
              </div>

              <div className="prompt-display w-full max-w-3xl mb-8 text-gray-600 font-mono text-xs sm:text-sm break-words overflow-hidden leading-relaxed border-l-2 border-gray-300 pl-4">
                <div className="max-h-[30vh] overflow-y-auto overflow-x-hidden">
                  <div className="overflow-wrap-anywhere">
                    {status === 'generating_voxels' && imageData && (
                      <img
                        src={imageData}
                        alt="Source"
                        className="inline-block h-[1.5em] w-auto mr-2 align-middle border border-gray-300"
                      />
                    )}
                    <span className="align-middle">{displayPrompt}</span>
                  </div>
                </div>
              </div>

              <div className="w-full max-w-3xl text-gray-600 font-mono text-xs sm:text-sm whitespace-pre-wrap break-words max-h-[40%] overflow-y-auto">
                {thinkingText ? (
                  <span>
                    {thinkingText}
                    <span className="loading-dots"></span>
                  </span>
                ) : (
                  <span className="loading-dots">Thinking</span>
                )}
              </div>
            </div>
          </div>
        )}

        {!imageData && !isLoading && status !== 'error' && (
          <div className="text-gray-400 text-center px-6 pointer-events-none">
            <p className="text-lg">Select an example, or generate your own!</p>
          </div>
        )}

        {imageData && viewMode === 'image' && (
          <img
            src={imageData}
            alt={
              displayPrompt
                ? `Generated image: ${displayPrompt}`
                : 'Uploaded image for voxel conversion'
            }
            className="w-full h-full object-contain"
          />
        )}

        {viewMode === 'voxel' && voxelCode && (
          <iframe
            title="Voxel Scene"
            srcDoc={voxelCode}
            className="w-full h-full border-0"
            sandbox="allow-scripts"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        )}

        {viewMode === 'voxel' && !voxelCode && voxelUrl && (
          <iframe
            title="Voxel Scene"
            src={voxelUrl}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        )}
      </div>

      <div className="flex flex-wrap gap-4 pt-4">
        {imageData && (voxelCode || voxelUrl) && (
          <button
            type="button"
            onClick={onToggleView}
            disabled={isLoading}
            title={
              viewMode === 'image'
                ? 'Switch to voxel scene view'
                : 'Switch to source image view'
            }
            aria-label={
              viewMode === 'image'
                ? 'Switch to voxel view'
                : 'Switch to image view'
            }
            className={`touch-manipulation ${buttonStyles.base} ${buttonStyles.secondary} flex-1 min-w-[140px] min-h-[44px] py-4`}
          >
            {viewMode === 'image' ? 'View Scene' : 'View Image'}
          </button>
        )}

        {((viewMode === 'image' && imageData) ||
          (viewMode === 'voxel' && (voxelCode || voxelUrl))) && (
          <button
            type="button"
            onClick={onDownload}
            disabled={isLoading}
            title={
              viewMode === 'image'
                ? 'Download the generated image'
                : 'Download the voxel HTML file'
            }
            aria-label={
              viewMode === 'image' ? 'Download image' : 'Download HTML'
            }
            className={`touch-manipulation ${buttonStyles.base} ${buttonStyles.secondary} flex-1 min-w-[140px] min-h-[44px] py-4`}
          >
            {viewMode === 'image' ? 'Download Image' : 'Download HTML'}
          </button>
        )}

        {imageData && (
          <button
            type="button"
            onClick={onVoxelize}
            disabled={isLoading}
            title="Generate 3D voxel art from this image using Gemini 3 Pro"
            aria-label="Generate voxel art"
            className={`touch-manipulation ${buttonStyles.base} ${buttonStyles.primary} flex-1 min-w-[160px] min-h-[44px] py-4`}
          >
            {voxelCode ? 'Regenerate voxels' : 'Generate voxels'}
          </button>
        )}
      </div>
    </div>
  );
};
