import type { IncomingMessage, ServerResponse } from 'http';
import { GoogleGenAI } from '@google/genai';

import { ALLOWED_MIME_TYPES, GEMINI_MODELS } from '../src/constants/config';

const safeJson = async (
  req: IncomingMessage
): Promise<{ ok: true; value: unknown } | { ok: false; raw: string }> => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString('utf-8') || '{}';
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch {
    return { ok: false, raw };
  }
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
  payload: unknown,
  requestId?: string
) => {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  if (requestId) res.setHeader('X-Request-Id', requestId);
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
  const requestId =
    (typeof req.headers['x-request-id'] === 'string' &&
      req.headers['x-request-id'].trim()) ||
    `vf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end('Method Not Allowed');
    return;
  }

  if (!process.env.GEMINI_API_KEY) {
    sendJson(
      res,
      500,
      { error: 'Missing GEMINI_API_KEY', requestId },
      requestId
    );
    return;
  }

  try {
    const ip = getClientIp(req);
    const rate = checkRateLimit(ip);
    if (!rate.ok) {
      sendJson(
        res,
        429,
        {
          error: `Rate limit exceeded. Please wait ${Math.ceil(rate.retryAfterMs / 1000)} seconds.`,
          requestId,
        },
        requestId
      );
      return;
    }

    const parsed = await safeJson(req);
    if (!parsed.ok) {
      sendJson(res, 400, { error: 'Invalid JSON', requestId }, requestId);
      return;
    }

    const body = parsed.value;
    const bodyObj =
      body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
    const imageBase64 =
      typeof bodyObj.imageBase64 === 'string' ? bodyObj.imageBase64 : '';
    const mimeType =
      typeof bodyObj.mimeType === 'string' ? bodyObj.mimeType : 'image/jpeg';
    const prompt = typeof bodyObj.prompt === 'string' ? bodyObj.prompt : '';

    const allowedMimeTypes = new Set(ALLOWED_MIME_TYPES);
    const safeMimeType = allowedMimeTypes.has(mimeType)
      ? mimeType
      : 'image/jpeg';

    if (!imageBase64 || !prompt.trim() || prompt.trim().length > 2000) {
      sendJson(res, 400, { error: 'Invalid request', requestId }, requestId);
      return;
    }

    if (imageBase64.length > 15_000_000) {
      sendJson(res, 413, { error: 'Payload too large', requestId }, requestId);
      return;
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const response = await ai.models.generateContent({
      model: GEMINI_MODELS.VOXEL,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: safeMimeType,
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

    if (!html.trim()) {
      sendJson(
        res,
        502,
        { error: 'Upstream response contained no HTML', requestId },
        requestId
      );
      return;
    }

    sendJson(res, 200, { html, requestId }, requestId);
  } catch (err) {
    const ip = getClientIp(req);
    console.error('[generate-voxel] failed', {
      requestId,
      ip,
      error:
        err instanceof Error
          ? { name: err.name, message: err.message, stack: err.stack }
          : err,
    });

    sendJson(
      res,
      500,
      { error: 'Internal Server Error', requestId },
      requestId
    );
  }
}
