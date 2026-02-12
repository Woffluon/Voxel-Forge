import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react';

import {
  EXAMPLES,
  SAMPLE_PROMPTS,
  ALLOWED_MIME_TYPES,
  CONFIG,
} from '@/constants';
import {
  generateImage,
  generateVoxelScene,
  IMAGE_SYSTEM_PROMPT,
  VOXEL_PROMPT,
} from '@/services/gemini';
import { hideBodyText, zoomCamera } from '@/utils/html';
import { compressImage } from '@/utils/compressImage';
import { validatePrompt } from '@/utils/validation';
import { Logger } from '@/utils/logger';
import {
  AppStatus,
  Example,
  SelectedTile,
  UserContent,
  ViewMode,
} from '@/types/app.types';

type GenerationState = {
  status: AppStatus;
  errorMsg: string;
  thinkingText: string | null;
};

type ContentState = {
  imageData: string | null;
  voxelCode: string | null;
  voxelUrl: string | null;
  viewMode: ViewMode;
};

export const useAppController = () => {
  const [prompt, setPrompt] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  const [generationState, setGenerationState] = useState<GenerationState>({
    status: 'idle',
    errorMsg: '',
    thinkingText: null,
  });

  const [contentState, setContentState] = useState<ContentState>({
    imageData: null,
    voxelCode: null,
    voxelUrl: null,
    viewMode: 'image',
  });

  const [userContent, setUserContent] = useState<UserContent | null>(null);

  const [selectedTile, setSelectedTile] = useState<SelectedTile>(null);
  const [showGenerator, setShowGenerator] = useState(false);

  const [useOptimization, setUseOptimization] = useState(true);
  const [aspectRatio, setAspectRatio] = useState('1:1');

  const [isDragging, setIsDragging] = useState(false);
  const [isViewerVisible, setIsViewerVisible] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev: number) => (prev + 1) % SAMPLE_PROMPTS.length);
    }, CONFIG.PLACEHOLDER_ROTATION_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const handleError = useCallback((err: unknown) => {
    const errorMsg =
      err instanceof Error ? err.message : 'An unexpected error occurred.';
    setGenerationState((prev: GenerationState) => ({
      ...prev,
      status: 'error',
      errorMsg,
    }));

    Logger.error('App error', err);
  }, []);

  const examples = useMemo(() => EXAMPLES, []);

  const isLoading =
    generationState.status !== 'idle' && generationState.status !== 'error';

  const getDisplayPrompt = useCallback(() => {
    if (generationState.status === 'generating_image') {
      return useOptimization
        ? `${IMAGE_SYSTEM_PROMPT}\n\nSubject: ${prompt}`
        : prompt;
    }
    if (generationState.status === 'generating_voxels') {
      return VOXEL_PROMPT;
    }
    return '';
  }, [generationState.status, prompt, useOptimization]);

  const handleImageGenerate = useCallback(async () => {
    const validation = validatePrompt(prompt);
    if (!validation.valid) {
      setGenerationState((prev: GenerationState) => ({
        ...prev,
        status: 'error',
        errorMsg: validation.error || 'An unexpected error occurred.',
      }));
      return;
    }

    const sanitizedPrompt = prompt.trim().replace(/[<>]/g, '');

    setGenerationState((prev: GenerationState) => ({
      ...prev,
      status: 'generating_image',
      errorMsg: '',
      thinkingText: null,
    }));
    setContentState((prev: ContentState) => ({
      ...prev,
      imageData: null,
      voxelCode: null,
      viewMode: 'image',
    }));

    setIsViewerVisible(true);

    try {
      const imageUrl = await generateImage(
        sanitizedPrompt,
        aspectRatio,
        useOptimization
      );
      const finalImageUrl = useOptimization
        ? await compressImage(imageUrl, 1024, 0.85)
        : imageUrl;

      const newUserContent: UserContent = {
        image: finalImageUrl,
        voxel: null,
        prompt: sanitizedPrompt,
      };
      setUserContent(newUserContent);

      setContentState((prev: ContentState) => ({
        ...prev,
        imageData: finalImageUrl,
        voxelCode: null,
      }));
      setSelectedTile('user');

      setGenerationState((prev: GenerationState) => ({
        ...prev,
        status: 'idle',
      }));
      setShowGenerator(false);
    } catch (err) {
      handleError(err);
    }
  }, [aspectRatio, handleError, prompt, useOptimization]);

  const processFile = useCallback(
    (file: File) => {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        handleError(
          new Error(
            'Invalid file type. Please upload PNG, JPEG, WEBP, HEIC, or HEIF.'
          )
        );
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = e.target?.result as string;
        const finalImage = useOptimization
          ? await compressImage(result, 1024, 0.85)
          : result;

        const newUserContent: UserContent = {
          image: finalImage,
          voxel: null,
          prompt: '',
        };
        setUserContent(newUserContent);

        setContentState((prev: ContentState) => ({
          ...prev,
          imageData: finalImage,
          voxelCode: null,
          viewMode: 'image',
        }));
        setGenerationState((prev: GenerationState) => ({
          ...prev,
          status: 'idle',
          errorMsg: '',
        }));
        setSelectedTile('user');
        setShowGenerator(false);

        setIsViewerVisible(true);
      };
      reader.onerror = () => handleError(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    },
    [handleError, useOptimization]
  );

  const handleFileUpload = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile]
  );

  const handleExampleClick = useCallback(
    async (example: Example, index: number) => {
      if (
        generationState.status !== 'idle' &&
        generationState.status !== 'error'
      )
        return;

      setSelectedTile(index);
      setShowGenerator(false);
      setGenerationState((prev: GenerationState) => ({
        ...prev,
        errorMsg: '',
        thinkingText: null,
      }));
      setIsViewerVisible(true);

      try {
        const imgResponse = await fetch(example.img);
        if (!imgResponse.ok)
          throw new Error(
            `Failed to load example image: ${imgResponse.statusText}`
          );
        const imgBlob = await imgResponse.blob();

        const base64Img = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(imgBlob);
        });

        const finalBase64Img = useOptimization
          ? await compressImage(base64Img, 1024, 0.85)
          : base64Img;

        setContentState((prev: ContentState) => ({
          ...prev,
          imageData: finalBase64Img,
          voxelCode: null,
          voxelUrl: example.html,
          viewMode: 'voxel',
        }));
        setGenerationState((prev: GenerationState) => ({
          ...prev,
          status: 'idle',
        }));
      } catch (err) {
        handleError(err);
      }
    },
    [generationState.status, handleError, useOptimization]
  );

  const handleUserTileClick = useCallback(() => {
    if (generationState.status !== 'idle' && generationState.status !== 'error')
      return;

    if (selectedTile === 'user') {
      const willShow = !showGenerator;
      setShowGenerator(willShow);

      if (willShow) {
        setIsViewerVisible(false);
      } else {
        setIsViewerVisible(true);

        if (!userContent) {
          setSelectedTile(null);
        }
      }
    } else {
      setSelectedTile('user');
      setShowGenerator(true);

      setIsViewerVisible(false);

      if (userContent) {
        setContentState((prev: ContentState) => ({
          ...prev,
          imageData: userContent.image,
          voxelCode: userContent.voxel,
        }));
        setPrompt(userContent.prompt);
        setContentState((prev: ContentState) => ({
          ...prev,
          viewMode: userContent.voxel ? 'voxel' : 'image',
        }));
      } else {
        setContentState((prev: ContentState) => ({
          ...prev,
          imageData: null,
          voxelCode: null,
          viewMode: 'image',
        }));
      }
    }
  }, [generationState.status, selectedTile, showGenerator, userContent]);

  const handleVoxelize = useCallback(async () => {
    if (!contentState.imageData) return;
    setGenerationState((prev: GenerationState) => ({
      ...prev,
      status: 'generating_voxels',
      errorMsg: '',
      thinkingText: null,
    }));
    setIsViewerVisible(true);

    let thoughtBuffer = '';

    try {
      const codeRaw = await generateVoxelScene(
        contentState.imageData,
        (thoughtFragment) => {
          thoughtBuffer += thoughtFragment;

          const matches = thoughtBuffer.match(/\*\*([^*]+)\*\*/g);

          if (matches && matches.length > 0) {
            const lastMatch = matches[matches.length - 1];
            if (!lastMatch) return;
            const header = lastMatch.replace(/\*\*/g, '').trim();
            setGenerationState((prev: GenerationState) => ({
              ...prev,
              thinkingText:
                prev.thinkingText === header ? prev.thinkingText : header,
            }));
          }
        }
      );

      const code = zoomCamera(hideBodyText(codeRaw));
      setContentState((prev: ContentState) => ({
        ...prev,
        voxelCode: code,
        voxelUrl: null,
      }));

      if (selectedTile === 'user') {
        setUserContent((prev: UserContent | null) =>
          prev ? { ...prev, voxel: code } : null
        );
      }

      setContentState((prev: ContentState) => ({ ...prev, viewMode: 'voxel' }));
      setGenerationState((prev: GenerationState) => ({
        ...prev,
        status: 'idle',
        thinkingText: null,
      }));
    } catch (err) {
      handleError(err);
    }
  }, [contentState.imageData, handleError, selectedTile]);

  const handleDownload = useCallback(() => {
    if (contentState.viewMode === 'image' && contentState.imageData) {
      const a = document.createElement('a');
      a.href = contentState.imageData;
      const ext = contentState.imageData.includes('image/jpeg') ? 'jpg' : 'png';
      a.download = `voxelize-image-${Date.now()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (contentState.viewMode === 'voxel') {
      if (contentState.voxelCode) {
        const a = document.createElement('a');
        a.href = `data:text/html;charset=utf-8,${encodeURIComponent(contentState.voxelCode)}`;
        a.download = `voxel-scene-${Date.now()}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }

      if (contentState.voxelUrl) {
        fetch(contentState.voxelUrl)
          .then((r) => {
            if (!r.ok) throw new Error('Failed to download HTML');
            return r.text();
          })
          .then((html) => {
            const a = document.createElement('a');
            a.href = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
            a.download = `voxel-scene-${Date.now()}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          })
          .catch((err) => {
            Logger.error('Download error', err);
          });
      }
    }
  }, [
    contentState.imageData,
    contentState.viewMode,
    contentState.voxelCode,
    contentState.voxelUrl,
  ]);

  const handleToggleViewMode = useCallback(() => {
    setContentState((prev: ContentState) => ({
      ...prev,
      viewMode: prev.viewMode === 'image' ? 'voxel' : 'image',
    }));
  }, []);

  return {
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
    setIsDragging,
    setIsViewerVisible,
  };
};
