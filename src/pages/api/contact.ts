import type { APIRoute } from 'astro';
import { parseContactInput } from '@/lib/contact-schema';
import { verifyTurnstile } from '@/lib/turnstile';
import { checkRateLimit } from '@/lib/rate-limit';
import { sendContactEmail } from '@/lib/email';

export const prerender = false;

const MAX_BODY_SIZE = 50 * 1024;

function getEnvVar(name: string): string | undefined {
  return import.meta.env[name] ?? process.env[name];
}

function jsonResponse(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function getClientIp(request: Request): string {
  const vercelIp = request.headers.get('x-vercel-forwarded-for');
  if (vercelIp) {
    const first = vercelIp.split(',')[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;

  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }

  return '127.0.0.1';
}

export const POST: APIRoute = async ({ request }) => {
  const turnstileSecretKey = getEnvVar('TURNSTILE_SECRET_KEY');
  const resendApiKey = getEnvVar('RESEND_API_KEY');
  const contactToEmail = getEnvVar('CONTACT_TO_EMAIL');
  const upstashRedisUrl = getEnvVar('UPSTASH_REDIS_REST_URL');
  const upstashRedisToken = getEnvVar('UPSTASH_REDIS_REST_TOKEN');
  const contactFromEmail = getEnvVar('CONTACT_FROM_EMAIL') || 'onboarding@resend.dev';

  if (
    !turnstileSecretKey ||
    !resendApiKey ||
    !contactToEmail ||
    !upstashRedisUrl ||
    !upstashRedisToken
  ) {
    return jsonResponse({ code: 'send_failed' }, 500);
  }

  const contentType = request.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    return jsonResponse({ code: 'invalid_input', fields: {} }, 400);
  }

  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
    return jsonResponse({ code: 'invalid_input', fields: {} }, 400);
  }

  let body: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_SIZE) {
      return jsonResponse({ code: 'invalid_input', fields: {} }, 400);
    }
    body = JSON.parse(text);
  } catch {
    return jsonResponse({ code: 'invalid_input', fields: {} }, 400);
  }

  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return jsonResponse({ code: 'invalid_input', fields: {} }, 400);
  }

  const bodyObj = body as Record<string, unknown>;

  if (typeof bodyObj.website === 'string' && bodyObj.website.length > 0) {
    return jsonResponse({ code: 'ok' }, 200);
  }

  const parsed = parseContactInput(bodyObj);
  if (!parsed.success) {
    return jsonResponse({ code: 'invalid_input', fields: parsed.fields }, 400);
  }

  const { name, email, message, locale, turnstileToken } = parsed.data;

  const clientIp = getClientIp(request);

  try {
    const rateLimitResult = await checkRateLimit(clientIp, upstashRedisUrl, upstashRedisToken);
    if (!rateLimitResult.allowed) {
      return jsonResponse({ code: 'rate_limited' }, 429);
    }
  } catch {
    return jsonResponse({ code: 'send_failed' }, 500);
  }

  try {
    const turnstileValid = await verifyTurnstile(turnstileToken, clientIp, turnstileSecretKey);
    if (!turnstileValid) {
      return jsonResponse({ code: 'captcha_failed' }, 403);
    }
  } catch {
    return jsonResponse({ code: 'send_failed' }, 500);
  }

  const toEmails = contactToEmail
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);

  try {
    const emailResult = await sendContactEmail({
      name,
      email,
      message,
      locale,
      toEmails,
      fromEmail: contactFromEmail,
      apiKey: resendApiKey,
    });

    if (!emailResult.success) {
      return jsonResponse({ code: 'send_failed' }, 500);
    }
  } catch {
    return jsonResponse({ code: 'send_failed' }, 500);
  }

  return jsonResponse({ code: 'ok' }, 200);
};
