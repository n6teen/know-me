import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/turnstile', () => ({
  verifyTurnstile: vi.fn(),
}));

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(),
  resetRateLimiter: vi.fn(),
}));

vi.mock('@/lib/email', () => ({
  sendContactEmail: vi.fn(),
  escapeHtml: (text: string) => text,
  stripControlChars: (text: string) => {
    let result = '';
    for (const char of text) {
      const code = char.charCodeAt(0);
      if (code >= 32 && code !== 127) {
        result += char;
      }
    }
    return result;
  },
}));

import { POST } from '../contact';
import { verifyTurnstile } from '@/lib/turnstile';
import { checkRateLimit } from '@/lib/rate-limit';
import { sendContactEmail } from '@/lib/email';

const mockVerifyTurnstile = vi.mocked(verifyTurnstile);
const mockCheckRateLimit = vi.mocked(checkRateLimit);
const mockSendContactEmail = vi.mocked(sendContactEmail);

const mockEnv: Record<string, string> = {
  TURNSTILE_SECRET_KEY: 'test-turnstile-secret',
  RESEND_API_KEY: 'test-resend-key',
  CONTACT_TO_EMAIL: 'test@example.com',
  UPSTASH_REDIS_REST_URL: 'https://test.upstash.io',
  UPSTASH_REDIS_REST_TOKEN: 'test-token',
  CONTACT_FROM_EMAIL: 'from@example.com',
};

function createRequest(
  body: unknown,
  options: { contentType?: string; oversized?: boolean } = {}
): Request {
  const { contentType = 'application/json', oversized = false } = options;
  const bodyStr = oversized ? 'x'.repeat(60 * 1024) : JSON.stringify(body);

  return new Request('https://example.com/api/contact', {
    method: 'POST',
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(bodyStr.length),
      'X-Forwarded-For': '192.168.1.1',
    },
    body: bodyStr,
  });
}

function createContext(request: Request) {
  return { request } as Parameters<typeof POST>[0];
}

const validBody = {
  name: 'John Doe',
  email: 'john@example.com',
  message: 'Hello, this is a test message that is long enough.',
  locale: 'en',
  turnstileToken: 'test-token',
  website: '',
};

describe('POST /api/contact', () => {
  beforeEach(() => {
    vi.resetAllMocks();

    vi.stubGlobal('import', { meta: { env: mockEnv } });
    Object.assign(process.env, mockEnv);

    mockCheckRateLimit.mockResolvedValue({ allowed: true });
    mockVerifyTurnstile.mockResolvedValue(true);
    mockSendContactEmail.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    Object.keys(mockEnv).forEach((key) => {
      delete process.env[key];
    });
  });

  describe('environment variable validation', () => {
    it('returns 500 when required env vars are missing', async () => {
      delete process.env.TURNSTILE_SECRET_KEY;

      const request = createRequest(validBody);
      const response = await POST(createContext(request));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.code).toBe('send_failed');
    });

    it('does not leak which env var is missing', async () => {
      delete process.env.RESEND_API_KEY;

      const request = createRequest(validBody);
      const response = await POST(createContext(request));
      const data = await response.json();

      expect(data.code).toBe('send_failed');
      expect(JSON.stringify(data)).not.toContain('RESEND');
    });
  });

  describe('request validation', () => {
    it('rejects non-JSON content type', async () => {
      const request = createRequest(validBody, { contentType: 'text/plain' });
      const response = await POST(createContext(request));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('invalid_input');
    });

    it('rejects oversized body via Content-Length header', async () => {
      const request = createRequest(validBody, { oversized: true });
      const response = await POST(createContext(request));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('invalid_input');
    });

    it('rejects invalid JSON', async () => {
      const request = new Request('https://example.com/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not valid json',
      });
      const response = await POST(createContext(request));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('invalid_input');
    });

    it('rejects null body', async () => {
      const request = createRequest(null);
      const response = await POST(createContext(request));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('invalid_input');
      expect(data.fields).toEqual({});
    });

    it('rejects array body', async () => {
      const request = createRequest([1, 2, 3]);
      const response = await POST(createContext(request));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('invalid_input');
      expect(data.fields).toEqual({});
    });

    it('rejects string body', async () => {
      const request = createRequest('just a string');
      const response = await POST(createContext(request));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('invalid_input');
      expect(data.fields).toEqual({});
    });

    it('rejects number body', async () => {
      const request = createRequest(12345);
      const response = await POST(createContext(request));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('invalid_input');
      expect(data.fields).toEqual({});
    });
  });

  describe('input validation', () => {
    it('returns 400 with field errors for invalid name', async () => {
      const request = createRequest({ ...validBody, name: '' });
      const response = await POST(createContext(request));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('invalid_input');
      expect(data.fields.name).toBe('required');
    });

    it('returns 400 with field errors for name too long', async () => {
      const request = createRequest({ ...validBody, name: 'A'.repeat(101) });
      const response = await POST(createContext(request));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('invalid_input');
      expect(data.fields.name).toBe('too_long');
    });

    it('returns 400 with field errors for invalid email', async () => {
      const request = createRequest({ ...validBody, email: 'not-an-email' });
      const response = await POST(createContext(request));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('invalid_input');
      expect(data.fields.email).toBe('invalid');
    });

    it('returns 400 with field errors for message too short', async () => {
      const request = createRequest({ ...validBody, message: 'Hi' });
      const response = await POST(createContext(request));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('invalid_input');
      expect(data.fields.message).toBe('too_short');
    });

    it('returns 400 with field errors for message too long', async () => {
      const request = createRequest({ ...validBody, message: 'A'.repeat(5001) });
      const response = await POST(createContext(request));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('invalid_input');
      expect(data.fields.message).toBe('too_long');
    });

    it('returns multiple field errors when multiple fields are invalid', async () => {
      const request = createRequest({
        ...validBody,
        name: '',
        email: 'bad',
        message: 'short',
      });
      const response = await POST(createContext(request));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('invalid_input');
      expect(data.fields.name).toBe('required');
      expect(data.fields.email).toBe('invalid');
      expect(data.fields.message).toBe('too_short');
    });

    it('returns 400 for invalid locale', async () => {
      const request = createRequest({ ...validBody, locale: 'fr' });
      const response = await POST(createContext(request));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('invalid_input');
    });
  });

  describe('honeypot detection', () => {
    it('returns 200 ok when honeypot is filled but does not send email', async () => {
      const request = createRequest({ ...validBody, website: 'spam-bot-value' });
      const response = await POST(createContext(request));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.code).toBe('ok');
      expect(mockSendContactEmail).not.toHaveBeenCalled();
      expect(mockVerifyTurnstile).not.toHaveBeenCalled();
      expect(mockCheckRateLimit).not.toHaveBeenCalled();
    });

    it('returns 200 ok when honeypot is filled even with invalid fields', async () => {
      const request = createRequest({
        name: '',
        email: 'invalid-email',
        message: 'short',
        locale: 'invalid',
        turnstileToken: '',
        website: 'spam-bot-value',
      });
      const response = await POST(createContext(request));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.code).toBe('ok');
      expect(mockSendContactEmail).not.toHaveBeenCalled();
    });
  });

  describe('rate limiting', () => {
    it('returns 429 when rate limit is exceeded', async () => {
      mockCheckRateLimit.mockResolvedValue({ allowed: false });

      const request = createRequest(validBody);
      const response = await POST(createContext(request));
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.code).toBe('rate_limited');
      expect(mockSendContactEmail).not.toHaveBeenCalled();
    });

    it('returns 500 when rate limit check fails', async () => {
      mockCheckRateLimit.mockRejectedValue(new Error('Redis connection failed'));

      const request = createRequest(validBody);
      const response = await POST(createContext(request));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.code).toBe('send_failed');
    });
  });

  describe('captcha verification', () => {
    it('returns 403 when captcha verification fails', async () => {
      mockVerifyTurnstile.mockResolvedValue(false);

      const request = createRequest(validBody);
      const response = await POST(createContext(request));
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.code).toBe('captcha_failed');
      expect(mockSendContactEmail).not.toHaveBeenCalled();
    });

    it('returns 500 when captcha verification throws', async () => {
      mockVerifyTurnstile.mockRejectedValue(new Error('Network error'));

      const request = createRequest(validBody);
      const response = await POST(createContext(request));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.code).toBe('send_failed');
    });

    it('passes client IP to turnstile verification', async () => {
      const request = createRequest(validBody);
      await POST(createContext(request));

      expect(mockVerifyTurnstile).toHaveBeenCalledWith(
        'test-token',
        '192.168.1.1',
        'test-turnstile-secret'
      );
    });
  });

  describe('email sending', () => {
    it('returns 500 when email sending fails', async () => {
      mockSendContactEmail.mockResolvedValue({ success: false });

      const request = createRequest(validBody);
      const response = await POST(createContext(request));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.code).toBe('send_failed');
    });

    it('returns 500 when email sending throws', async () => {
      mockSendContactEmail.mockRejectedValue(new Error('SMTP error'));

      const request = createRequest(validBody);
      const response = await POST(createContext(request));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.code).toBe('send_failed');
    });

    it('splits comma-separated recipient emails', async () => {
      process.env.CONTACT_TO_EMAIL = 'one@example.com, two@example.com, three@example.com';

      const request = createRequest(validBody);
      await POST(createContext(request));

      expect(mockSendContactEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          toEmails: ['one@example.com', 'two@example.com', 'three@example.com'],
        })
      );
    });

    it('passes correct email parameters', async () => {
      const request = createRequest(validBody);
      await POST(createContext(request));

      expect(mockSendContactEmail).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Hello, this is a test message that is long enough.',
        locale: 'en',
        toEmails: ['test@example.com'],
        fromEmail: 'from@example.com',
        apiKey: 'test-resend-key',
      });
    });
  });

  describe('success path', () => {
    it('returns 200 ok on successful submission', async () => {
      const request = createRequest(validBody);
      const response = await POST(createContext(request));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.code).toBe('ok');
    });

    it('accepts Thai locale', async () => {
      const request = createRequest({ ...validBody, locale: 'th' });
      const response = await POST(createContext(request));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.code).toBe('ok');
      expect(mockSendContactEmail).toHaveBeenCalledWith(expect.objectContaining({ locale: 'th' }));
    });
  });

  describe('client IP extraction', () => {
    it('uses x-vercel-forwarded-for header first', async () => {
      const request = new Request('https://example.com/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-vercel-forwarded-for': '10.0.0.1',
          'x-real-ip': '192.168.1.1',
          'x-forwarded-for': '172.16.0.1',
        },
        body: JSON.stringify(validBody),
      });

      await POST(createContext(request));

      expect(mockCheckRateLimit).toHaveBeenCalledWith(
        '10.0.0.1',
        expect.any(String),
        expect.any(String)
      );
    });

    it('ignores spoofed cf-connecting-ip header', async () => {
      const request = new Request('https://example.com/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cf-connecting-ip': '1.2.3.4',
          'x-vercel-forwarded-for': '10.0.0.1',
        },
        body: JSON.stringify(validBody),
      });

      await POST(createContext(request));

      expect(mockCheckRateLimit).toHaveBeenCalledWith(
        '10.0.0.1',
        expect.any(String),
        expect.any(String)
      );
    });

    it('uses x-real-ip when x-vercel-forwarded-for is absent', async () => {
      const request = new Request('https://example.com/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-real-ip': '172.16.0.1',
          'x-forwarded-for': '192.168.1.1',
        },
        body: JSON.stringify(validBody),
      });

      await POST(createContext(request));

      expect(mockCheckRateLimit).toHaveBeenCalledWith(
        '172.16.0.1',
        expect.any(String),
        expect.any(String)
      );
    });

    it('uses x-forwarded-for as last resort', async () => {
      const request = new Request('https://example.com/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '192.168.1.1, 10.0.0.2',
        },
        body: JSON.stringify(validBody),
      });

      await POST(createContext(request));

      expect(mockCheckRateLimit).toHaveBeenCalledWith(
        '192.168.1.1',
        expect.any(String),
        expect.any(String)
      );
    });
  });
});
