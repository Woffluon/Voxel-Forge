export const ASPECT_RATIOS = ['1:1', '3:4', '4:3', '16:9', '9:16'];

export const CONFIG = {
  PLACEHOLDER_ROTATION_INTERVAL: 3000,
} as const;

export const GEMINI_MODELS = {
  IMAGE: 'gemini-2.5-flash-image',
  VOXEL: 'gemini-3-flash-preview',
} as const;

export const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/heic',
  'image/heif',
];
