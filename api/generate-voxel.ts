import type { IncomingMessage, ServerResponse } from 'http';
import { GoogleGenAI } from '@google/genai';

import { GEMINI_MODELS } from '../src/constants/config';

const json = async (req: IncomingMessage): Promise<unknown> => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString('utf-8') || '{}';
  return JSON.parse(raw);
};

type TextPart = {
  text?: string;
};

const isTextPart = (part: unknown): part is TextPart => {
  if (!part || typeof part !== 'object') return false;
  return 'text' in part;
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

const requestLog = new Map<string, number[]>();
const MAX_REQUESTS = 3;
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
    const imageBase64 =
      typeof bodyObj.imageBase64 === 'string' ? bodyObj.imageBase64 : '';
    const mimeType =
      typeof bodyObj.mimeType === 'string' ? bodyObj.mimeType : 'image/jpeg';
    const prompt = typeof bodyObj.prompt === 'string' ? bodyObj.prompt : '';

    if (!imageBase64 || !prompt.trim() || prompt.trim().length > 2000) {
      sendJson(res, 400, { error: 'Invalid request' });
      return;
    }

    if (imageBase64.length > 15_000_000) {
      sendJson(res, 413, { error: 'Payload too large' });
      return;
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const response = await ai.models.generateContent({
      model: GEMINI_MODELS.VOXEL,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: imageBase64,
            },
          },
          { text: prompt },
        ],
      },
    });

    const parts = response.candidates?.[0]?.content?.parts;
    const html = (parts || [])
      .map((p) => (isTextPart(p) ? p.text : undefined))
      .filter((t): t is string => Boolean(t))
      .join('');

    sendJson(res, 200, { html });
  } catch {
    sendJson(res, 500, { error: 'Internal Server Error' });
  }
}
