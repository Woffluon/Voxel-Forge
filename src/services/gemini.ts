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

class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

const parseErrorResponse = async (response: Response): Promise<string> => {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      const payload = (await response.json()) as {
        error?: string;
        message?: string;
      };
      return (
        payload?.error ||
        payload?.message ||
        response.statusText ||
        'Request failed'
      );
    } catch {
      return response.statusText || 'Request failed';
    }
  }

  try {
    const text = await response.text();
    return text || response.statusText || 'Request failed';
  } catch {
    return response.statusText || 'Request failed';
  }
};

const fetchJson = async <T>(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<T> => {
  const { timeoutMs = 120000, ...requestInit } = init;
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...requestInit,
      signal: controller.signal,
    });
    if (!response.ok) {
      const message = await parseErrorResponse(response);
      throw new ApiError(message, response.status);
    }
    return (await response.json()) as T;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError('Request timed out. Please try again.', 408);
    }
    throw err;
  } finally {
    window.clearTimeout(timeoutId);
  }
};

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

    const data = await fetchJson<{ data: string; mimeType?: string }>(
      '/api/generate-image',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: finalPrompt,
          aspectRatio,
        }),
        timeoutMs: 120000,
      }
    );
    if (!data?.data) {
      throw new Error('No image generated.');
    }

    const mimeType = data.mimeType || 'image/png';
    return `data:${mimeType};base64,${data.data}`;
  } catch (error) {
    Logger.error('Image generation failed', error, { aspectRatio, optimize });
    if (error instanceof ApiError) {
      throw new Error(`Image generation failed: ${error.message}`);
    }
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

    const data = await fetchJson<{
      html: string;
      thoughts?: string[];
    }>('/api/generate-voxel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64: base64Data,
        mimeType,
        prompt: VOXEL_PROMPT,
      }),
      timeoutMs: 180000,
    });

    if (onThoughtUpdate && data?.thoughts?.length) {
      for (const thought of data.thoughts) {
        onThoughtUpdate(thought);
      }
    }

    return extractHtmlFromText(data?.html || '');
  } catch (error) {
    Logger.error('Voxel scene generation failed', error, { mimeType });
    if (error instanceof ApiError) {
      throw new Error(`Voxel scene generation failed: ${error.message}`);
    }
    throw new Error('Failed to generate voxel scene. Please try again.');
  }
};
