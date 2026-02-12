import type { IncomingMessage, ServerResponse } from 'http';
import { GoogleGenAI } from '@google/genai';

import { GEMINI_MODELS, ASPECT_RATIOS } from '../src/constants/config';

const json = async (req: IncomingMessage): Promise<unknown> => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString('utf-8') || '{}';
  return JSON.parse(raw);
};

type InlineDataPart = {
  inlineData?: {
    data: string;
    mimeType?: string;
  };
};

const hasInlineData = (part: unknown): part is InlineDataPart => {
  if (!part || typeof part !== 'object') return false;
  return 'inlineData' in part;
};

const sendJson = (
  res: ServerResponse,
  statusCode: number,
  payload: unknown
) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
};

const getClientIp = (req: IncomingMessage): string => {
  const xf = req.headers['x-forwarded-for'];
  if (typeof xf === 'string' && xf.trim()) {
    return xf.split(',')[0]?.trim() || 'unknown';
  }
  return req.socket.remoteAddress || 'unknown';
};

const suspiciousPatterns = [/<script/i, /javascript:/i, /on\w+=/i, /eval\(/i];

const isPromptSafe = (prompt: string): boolean => {
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(prompt)) return false;
  }
  return true;
};

const requestLog = new Map<string, number[]>();
const MAX_REQUESTS = 5;
const WINDOW_MS = 60000;

const checkRateLimit = (key: string): { ok: boolean; retryAfterMs: number } => {
  const now = Date.now();
  const existing = requestLog.get(key) || [];
  const filtered = existing.filter((t) => now - t < WINDOW_MS);

  if (filtered.length >= MAX_REQUESTS) {
    const oldest = filtered[0];
    const retryAfterMs =
      typeof oldest === 'number'
        ? Math.max(0, WINDOW_MS - (now - oldest))
        : WINDOW_MS;
    requestLog.set(key, filtered);
    return { ok: false, retryAfterMs };
  }

  filtered.push(now);
  requestLog.set(key, filtered);
  return { ok: true, retryAfterMs: 0 };
};

export default async function handler(
  req: IncomingMessage & { method?: string },
  res: ServerResponse
) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end('Method Not Allowed');
    return;
  }

  if (!process.env.GEMINI_API_KEY) {
    sendJson(res, 500, { error: 'Missing GEMINI_API_KEY' });
    return;
  }

  try {
    const ip = getClientIp(req);
    const rate = checkRateLimit(ip);
    if (!rate.ok) {
      sendJson(res, 429, {
        error: `Rate limit exceeded. Please wait ${Math.ceil(rate.retryAfterMs / 1000)} seconds.`,
      });
      return;
    }

    const body = await json(req);
    const bodyObj =
      body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
    const prompt = typeof bodyObj.prompt === 'string' ? bodyObj.prompt : '';
    const aspectRatio =
      typeof bodyObj.aspectRatio === 'string' ? bodyObj.aspectRatio : '1:1';

    const trimmedPrompt = prompt.trim();
    if (
      !trimmedPrompt ||
      trimmedPrompt.length < 3 ||
      trimmedPrompt.length > 500 ||
      !isPromptSafe(trimmedPrompt)
    ) {
      sendJson(res, 400, { error: 'Invalid prompt' });
      return;
    }

    const allowedAspectRatios = new Set(ASPECT_RATIOS);
    const safeAspectRatio = allowedAspectRatios.has(aspectRatio)
      ? aspectRatio
      : '1:1';

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const response = await ai.models.generateContent({
      model: GEMINI_MODELS.IMAGE,
      contents: {
        parts: [{ text: trimmedPrompt.replace(/[<>]/g, '') }],
      },
      config: {
        responseModalities: ['IMAGE'],
        imageConfig: {
          aspectRatio: safeAspectRatio,
        },
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (hasInlineData(part) && part.inlineData) {
      const inlineData = part.inlineData;
      sendJson(res, 200, {
        data: inlineData.data,
        mimeType: inlineData.mimeType || 'image/png',
      });
      return;
    }

    sendJson(res, 500, { error: 'No image generated' });
  } catch {
    sendJson(res, 500, { error: 'Internal Server Error' });
  }
}
