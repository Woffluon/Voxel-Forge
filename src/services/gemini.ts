/**
 * @license
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 Efe Arabacı
 */

import { extractHtmlFromText } from '@/utils/html';
import { RateLimiter } from '@/utils/rateLimiter';
import { Logger } from '@/utils/logger';

export const IMAGE_SYSTEM_PROMPT =
  'Generate an isolated object/scene on a simple background.';
export const VOXEL_PROMPT =
  'I have provided an image. Code a beautiful voxel art scene inspired by this image. Write threejs code as a single-page.';

const imageLimiter = new RateLimiter(5, 60000);
const voxelLimiter = new RateLimiter(3, 60000);

export const generateImage = async (
  prompt: string,
  aspectRatio: string = '1:1',
  optimize: boolean = true
): Promise<string> => {
  try {
    if (!imageLimiter.canMakeRequest()) {
      const waitTime = Math.ceil(imageLimiter.getTimeUntilNextRequest() / 1000);
      throw new Error(`Rate limit exceeded. Please wait ${waitTime} seconds.`);
    }

    let finalPrompt = prompt;

    // Apply the shortened optimization prompt if enabled
    if (optimize) {
      finalPrompt = `${IMAGE_SYSTEM_PROMPT}\n\nSubject: ${prompt}`;
    }

    const response = await fetch('/api/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: finalPrompt,
        aspectRatio,
      }),
    });

    if (!response.ok) {
      throw new Error(`Image generation failed: ${response.statusText}`);
    }

    const data = (await response.json()) as { data: string; mimeType?: string };
    if (!data?.data) {
      throw new Error('No image generated.');
    }

    const mimeType = data.mimeType || 'image/png';
    return `data:${mimeType};base64,${data.data}`;
  } catch (error) {
    Logger.error('Image generation failed', error, { aspectRatio, optimize });
    throw new Error('Failed to generate image. Please try again.');
  }
};

export const generateVoxelScene = async (
  imageBase64: string,
  onThoughtUpdate?: (thought: string) => void
): Promise<string> => {
  // Extract the base64 data part if it includes the prefix
  const base64Data = imageBase64.split(',')[1] || imageBase64;

  // Extract MIME type from the data URL if present, otherwise default to jpeg
  const mimeMatch = imageBase64.match(/^data:(.*?);base64,/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

  try {
    if (!voxelLimiter.canMakeRequest()) {
      const waitTime = Math.ceil(voxelLimiter.getTimeUntilNextRequest() / 1000);
      throw new Error(`Rate limit exceeded. Please wait ${waitTime} seconds.`);
    }

    const response = await fetch('/api/generate-voxel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64: base64Data,
        mimeType,
        prompt: VOXEL_PROMPT,
      }),
    });

    if (!response.ok) {
      throw new Error(`Voxel scene generation failed: ${response.statusText}`);
    }

    const data = (await response.json()) as {
      html: string;
      thoughts?: string[];
    };

    if (onThoughtUpdate && data?.thoughts?.length) {
      for (const thought of data.thoughts) {
        onThoughtUpdate(thought);
      }
    }

    return extractHtmlFromText(data?.html || '');
  } catch (error) {
    Logger.error('Voxel scene generation failed', error, { mimeType });
    throw new Error('Failed to generate voxel scene. Please try again.');
  }
};
