/**
 * @license
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 Efe Arabacı
 */

import React from 'react';

import { Header } from '@/components/Header';
import { TilesGrid } from '@/components/TilesGrid';
import { GeneratorPanel } from '@/components/GeneratorPanel';
import { Viewer } from '@/components/Viewer';
import { useAppController } from '@/hooks/useAppController';

const App: React.FC = () => {
  const {
    prompt,
    setPrompt,
    placeholderIndex,
    generationState,
    contentState,
    userContent,
    selectedTile,
    showGenerator,
    useOptimization,
    aspectRatio,
    isDragging,
    isViewerVisible,
    isLoading,
    examples,
    fileInputRef,
    getDisplayPrompt,
    handleImageGenerate,
    handleFileUpload,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleExampleClick,
    handleUserTileClick,
    handleVoxelize,
    handleDownload,
    handleToggleViewMode,
    setAspectRatio,
    setUseOptimization,
  } = useAppController();

  const generateButtonLabel =
    generationState.status === 'generating_image'
      ? 'Generating...'
      : 'Generate';

  return (
    <div className="container min-h-screen flex flex-col items-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8 font-sans bg-white">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-black focus:text-white font-bold"
      >
        Skip to main content
      </a>
      <div className="w-full max-w-2xl space-y-6 sm:space-y-8">
        <Header />

        <main id="main-content" tabIndex={-1}>
          <section aria-labelledby="examples-heading">
            <h2 id="examples-heading" className="sr-only">
              Example Scenes
            </h2>
            <TilesGrid
              examples={examples}
              isLoading={isLoading}
              selectedTile={selectedTile}
              userContent={userContent}
              showGenerator={showGenerator}
              onExampleClick={handleExampleClick}
              onUserTileClick={handleUserTileClick}
            />
          </section>

          <section aria-labelledby="generator-heading">
            <h2 id="generator-heading" className="sr-only">
              Image Generator
            </h2>
            <GeneratorPanel
              show={showGenerator}
              isLoading={isLoading}
              generateButtonLabel={generateButtonLabel}
              prompt={prompt}
              placeholderIndex={placeholderIndex}
              aspectRatio={aspectRatio}
              useOptimization={useOptimization}
              isDragging={isDragging}
              fileInputRef={fileInputRef}
              onPromptChange={setPrompt}
              onAspectRatioChange={setAspectRatio}
              onOptimizationChange={setUseOptimization}
              onGenerate={handleImageGenerate}
              onFileUpload={handleFileUpload}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onUploadClick={() => fileInputRef.current?.click()}
            />
          </section>

          {generationState.errorMsg && (
            <div
              className="p-4 border-2 border-red-500 bg-red-50 text-red-700 text-sm font-bold animate-in fade-in"
              role="alert"
            >
              ERROR: {generationState.errorMsg}
            </div>
          )}

          <section aria-labelledby="viewer-heading">
            <h2 id="viewer-heading" className="sr-only">
              Content Viewer
            </h2>
            <Viewer
              isVisible={isViewerVisible}
              isLoading={isLoading}
              status={generationState.status}
              thinkingText={generationState.thinkingText}
              displayPrompt={getDisplayPrompt()}
              imageData={contentState.imageData}
              voxelCode={contentState.voxelCode}
              voxelUrl={contentState.voxelUrl}
              viewMode={contentState.viewMode}
              onToggleView={handleToggleViewMode}
              onDownload={handleDownload}
              onVoxelize={handleVoxelize}
            />
          </section>
        </main>
      </div>
    </div>
  );
};

export default App;
