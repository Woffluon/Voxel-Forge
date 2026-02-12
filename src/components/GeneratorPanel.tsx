import React, { type ChangeEvent, type DragEvent } from 'react';

import { ALLOWED_MIME_TYPES, ASPECT_RATIOS, SAMPLE_PROMPTS } from '@/constants';
import { IMAGE_SYSTEM_PROMPT } from '@/services/gemini';
import { buttonStyles } from '@/styles/button.styles';

type GeneratorPanelProps = {
  show: boolean;
  isLoading: boolean;
  generateButtonLabel: string;
  prompt: string;
  placeholderIndex: number;
  aspectRatio: string;
  useOptimization: boolean;
  isDragging: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onPromptChange: (value: string) => void;
  onAspectRatioChange: (value: string) => void;
  onOptimizationChange: (value: boolean) => void;
  onGenerate: () => void;
  onFileUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onDragOver: (e: DragEvent) => void;
  onDragLeave: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
  onUploadClick: () => void;
};

export const GeneratorPanel: React.FC<GeneratorPanelProps> = ({
  show,
  isLoading,
  generateButtonLabel,
  prompt,
  placeholderIndex,
  aspectRatio,
  useOptimization,
  isDragging,
  fileInputRef,
  onPromptChange,
  onAspectRatioChange,
  onOptimizationChange,
  onGenerate,
  onFileUpload,
  onDragOver,
  onDragLeave,
  onDrop,
  onUploadClick,
}) => {
  if (!show) return null;

  return (
    <div className="space-y-6 animate-in slide-in-from-top-4 fade-in duration-300 border-2 border-black p-6 bg-gray-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative z-10">
      <div className="w-full">
        <label className="block text-sm font-bold mb-2 uppercase">
          Upload Image
        </label>
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload image by dragging and dropping or clicking"
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={onUploadClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onUploadClick();
            }
          }}
          className={`
                        touch-manipulation w-full h-64 border-2 border-dashed border-black flex flex-col items-center justify-center cursor-pointer transition-colors
                        focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2
                        ${isDragging ? 'bg-gray-200' : 'bg-white hover:bg-gray-50'}
                    `}
        >
          <input
            type="file"
            accept={ALLOWED_MIME_TYPES.join(',')}
            ref={fileInputRef as React.RefObject<HTMLInputElement>}
            onChange={onFileUpload}
            className="hidden"
          />
          <p className="font-bold uppercase text-sm text-gray-600">
            Drag and drop or click to upload image
          </p>
        </div>
      </div>

      <div className="relative flex items-center justify-center w-full">
        <div className="border-t-2 border-gray-200 w-full absolute"></div>
        <span className="bg-gray-50 px-3 text-xs font-bold text-gray-400 uppercase relative z-10">
          OR
        </span>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-grow w-full">
          <label
            htmlFor="prompt"
            className="block text-sm font-bold mb-2 uppercase"
          >
            Generate with Gemini 2.5 Flash Image
          </label>
          <input
            id="prompt"
            type="text"
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder={SAMPLE_PROMPTS[placeholderIndex]}
            aria-label="Image prompt description"
            className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-0 rounded-none text-base sm:text-lg placeholder-gray-400 bg-white h-12 sm:h-14"
            disabled={isLoading}
          />
        </div>
        <div className="w-full sm:w-40 flex-shrink-0">
          <label
            htmlFor="aspect"
            className="block text-sm font-bold mb-2 uppercase"
          >
            Aspect ratio
          </label>
          <select
            id="aspect"
            value={aspectRatio}
            onChange={(e) => onAspectRatioChange(e.target.value)}
            disabled={isLoading}
            aria-label="Select aspect ratio"
            className="w-full px-4 py-3 border-2 border-black focus:outline-none rounded-none bg-white h-12 sm:h-14"
          >
            {ASPECT_RATIOS.map((ratio) => (
              <option key={ratio} value={ratio}>
                {ratio}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-end items-center gap-6 mt-2">
        <label
          htmlFor="optimize-checkbox"
          className="touch-manipulation flex items-center cursor-pointer select-none min-h-[44px] py-2"
          title={`Add instruction: ${IMAGE_SYSTEM_PROMPT}`}
        >
          <div className="relative">
            <input
              id="optimize-checkbox"
              type="checkbox"
              className="sr-only"
              checked={useOptimization}
              onChange={(e) => onOptimizationChange(e.target.checked)}
              disabled={isLoading}
              aria-label="Toggle scene prompt optimization"
              aria-describedby="optimize-description"
            />
            <div
              className={`block w-10 h-6 border-2 border-black ${useOptimization ? 'bg-black' : 'bg-gray-500'}`}
            ></div>
            <div
              className={`dot absolute left-1 top-1 bg-white w-4 h-4 transition-transform ${useOptimization ? 'translate-x-4' : ''}`}
            ></div>
          </div>
          <div className="ml-3 text-sm font-bold uppercase">Optimise Scene</div>
        </label>
        <span id="optimize-description" className="sr-only">
          Adds instruction: {IMAGE_SYSTEM_PROMPT}
        </span>

        <button
          type="button"
          onClick={onGenerate}
          disabled={isLoading || !prompt.trim()}
          title="Generate a new image based on your prompt"
          aria-label={isLoading ? 'Generating, please wait' : 'Generate image'}
          aria-busy={isLoading}
          className={`touch-manipulation ${buttonStyles.base} ${buttonStyles.primary} w-full sm:w-40 h-12 min-h-[44px] text-sm whitespace-nowrap`}
        >
          {generateButtonLabel}
        </button>
      </div>
    </div>
  );
};
