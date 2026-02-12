/**
 * @license
 * SPDX-License-Identifier: MIT
 * Copyright (c) 2026 Efe Arabacı
 */

export const validatePrompt = (
  prompt: string
): { valid: boolean; error?: string } => {
  const trimmed = prompt.trim();

  if (!trimmed) {
    return { valid: false, error: 'Prompt cannot be empty' };
  }

  if (trimmed.length < 3) {
    return { valid: false, error: 'Prompt must be at least 3 characters' };
  }

  if (trimmed.length > 500) {
    return { valid: false, error: 'Prompt must be less than 500 characters' };
  }

  const suspiciousPatterns = [/<script/i, /javascript:/i, /on\w+=/i, /eval\(/i];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(trimmed)) {
      return { valid: false, error: 'Invalid characters detected' };
    }
  }

  return { valid: true };
};
