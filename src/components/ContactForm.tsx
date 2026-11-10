import { useState, useRef, useEffect } from 'react';
import type { Locale } from '@/i18n';

interface Props {
  locale: Locale;
}

type FormStatus =
  | 'idle'
  | 'sending'
  | 'ok'
  | 'invalid_input'
  | 'captcha_failed'
  | 'rate_limited'
  | 'send_failed'
  | 'offline';

interface FieldErrors {
  name?: string;
  email?: string;
  message?: string;
}

const translations = {
  en: {
    name: 'name',
    email: 'email',
    message: "what's up?",
    submit: 'send it',
    sending: 'sending…',
    status: {
      ok: "got it, thank you. i'll get back to you soon.",
      invalid_input: 'a few fields need another look. check the ones in red.',
      captcha_failed: "couldn't verify you're human. try the check again.",
      rate_limited: "that's a lot of messages. give it a minute and try again.",
      send_failed: "couldn't send that. try again, or email me directly.",
      offline: "you're offline. reconnect and try again.",
    },
    fields: {
      name: 'add your name (up to 100 characters).',
      email: "that email doesn't look right.",
      messageTooShort: 'tell me a bit more (at least 10 characters).',
      messageTooLong: 'keep it under 5,000 characters.',
    },
  },
  th: {
    name: 'ชื่อ',
    email: 'อีเมล',
    message: 'อยากคุยเรื่องอะไร',
    submit: 'ส่งเลย',
    sending: 'กำลังส่ง…',
    status: {
      ok: 'ได้รับแล้ว ขอบคุณนะ เดี๋ยวโน้ตตอบกลับเร็วๆ นี้',
      invalid_input: 'มีบางช่องยังไม่ถูก ลองดูช่องสีแดงอีกที',
      captcha_failed: 'ยืนยันว่าเป็นคนไม่ผ่าน ลองอีกรอบนะ',
      rate_limited: 'ส่งถี่ไปนิด พักสักครู่แล้วค่อยลองใหม่',
      send_failed: 'ส่งไม่ออก ลองอีกครั้ง หรืออีเมลหาโน้ตตรงๆ ได้เลย',
      offline: 'เน็ตหลุดอยู่ ต่อเน็ตแล้วลองส่งใหม่นะ',
    },
    fields: {
      name: 'ใส่ชื่อด้วยนะ (ไม่เกิน 100 ตัวอักษร)',
      email: 'อีเมลดูแปลกๆ ลองเช็กอีกที',
      messageTooShort: 'เล่าเพิ่มอีกนิด อย่างน้อย 10 ตัวอักษร',
      messageTooLong: 'ยาวเกิน 5,000 ตัวอักษร ย่อลงหน่อยนะ',
    },
  },
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactForm({ locale }: Props) {
  const t = translations[locale];
  const [status, setStatus] = useState<FormStatus>('idle');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const turnstileRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const siteKey = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey || !turnstileRef.current) return;

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.turnstile && turnstileRef.current) {
        window.turnstile.render(turnstileRef.current, {
          sitekey: siteKey,
          callback: (token: string) => setTurnstileToken(token),
          'expired-callback': () => setTurnstileToken(''),
          theme: 'dark',
        });
      }
    };

    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const validate = (name: string, email: string, message: string): FieldErrors => {
    const errors: FieldErrors = {};

    if (!name.trim() || name.length > 100) {
      errors.name = t.fields.name;
    }

    if (!EMAIL_REGEX.test(email)) {
      errors.email = t.fields.email;
    }

    if (message.length < 10) {
      errors.message = t.fields.messageTooShort;
    } else if (message.length > 5000) {
      errors.message = t.fields.messageTooLong;
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!navigator.onLine) {
      setStatus('offline');
      return;
    }

    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = (formData.get('name') as string) || '';
    const email = (formData.get('email') as string) || '';
    const message = (formData.get('message') as string) || '';
    const website = (formData.get('website') as string) || '';

    const errors = validate(name, email, message);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setStatus('invalid_input');
      return;
    }

    if (!turnstileToken) {
      setStatus('captcha_failed');
      return;
    }

    setStatus('sending');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          message,
          turnstileToken,
          locale,
          website,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('ok');
        formRef.current?.reset();
        setTurnstileToken('');
        if (window.turnstile) {
          window.turnstile.reset();
        }
      } else {
        const code = data.code as FormStatus;
        if (['invalid_input', 'captcha_failed', 'rate_limited', 'send_failed'].includes(code)) {
          setStatus(code);
        } else {
          setStatus('send_failed');
        }
      }
    } catch {
      if (!navigator.onLine) {
        setStatus('offline');
      } else {
        setStatus('send_failed');
      }
    }
  };

  const isSubmitting = status === 'sending';
  const showStatus = status !== 'idle' && status !== 'sending';

  const inputBaseStyles = `
    w-full px-4 py-3 rounded-input
    bg-[var(--color-surface)] text-[var(--color-text)] 
    placeholder:text-[var(--color-muted)]
    focus:outline-none focus:ring-[var(--focus-ring-width)] 
    focus:ring-[var(--focus-ring-color)] focus:ring-offset-[var(--focus-ring-offset)]
    transition-colors duration-[var(--duration-fast)]
  `;

  const inputNormalBorder =
    'border border-[var(--color-line)] focus:border-[var(--color-accent-text)]';
  const inputErrorBorder = 'border border-[var(--color-error)]';

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div>
        <label htmlFor="contact-name" className="mb-2 block text-sm font-medium">
          {t.name}
        </label>
        <input
          type="text"
          id="contact-name"
          name="name"
          required
          maxLength={100}
          disabled={isSubmitting}
          aria-invalid={!!fieldErrors.name}
          aria-describedby={fieldErrors.name ? 'name-error' : undefined}
          className={`${inputBaseStyles} ${fieldErrors.name ? inputErrorBorder : inputNormalBorder}`}
        />
        {fieldErrors.name && (
          <p
            id="name-error"
            className="mt-2 text-sm"
            style={{ color: 'var(--color-error-light)' }}
            role="alert"
          >
            {fieldErrors.name}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="contact-email" className="mb-2 block text-sm font-medium">
          {t.email}
        </label>
        <input
          type="email"
          id="contact-email"
          name="email"
          required
          disabled={isSubmitting}
          aria-invalid={!!fieldErrors.email}
          aria-describedby={fieldErrors.email ? 'email-error' : undefined}
          className={`${inputBaseStyles} ${fieldErrors.email ? inputErrorBorder : inputNormalBorder}`}
        />
        {fieldErrors.email && (
          <p
            id="email-error"
            className="mt-2 text-sm"
            style={{ color: 'var(--color-error-light)' }}
            role="alert"
          >
            {fieldErrors.email}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="contact-message" className="mb-2 block text-sm font-medium">
          {t.message}
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={5}
          required
          minLength={10}
          maxLength={5000}
          disabled={isSubmitting}
          aria-invalid={!!fieldErrors.message}
          aria-describedby={fieldErrors.message ? 'message-error' : undefined}
          className={`${inputBaseStyles} resize-y ${fieldErrors.message ? inputErrorBorder : inputNormalBorder}`}
        />
        {fieldErrors.message && (
          <p
            id="message-error"
            className="mt-2 text-sm"
            style={{ color: 'var(--color-error-light)' }}
            role="alert"
          >
            {fieldErrors.message}
          </p>
        )}
      </div>

      {/* Honeypot field - visually hidden, must remain empty */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
        }}
      >
        <label htmlFor="contact-website">Website</label>
        <input type="text" id="contact-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div ref={turnstileRef} className="cf-turnstile" />

      {showStatus && (
        <div
          role="alert"
          className="p-4"
          style={{
            borderRadius: 'var(--radius-input)',
            backgroundColor:
              status === 'ok'
                ? 'color-mix(in srgb, var(--color-success-dark) 30%, transparent)'
                : 'color-mix(in srgb, var(--color-error-dark) 30%, transparent)',
            border: `1px solid ${
              status === 'ok'
                ? 'color-mix(in srgb, var(--color-success) 50%, transparent)'
                : 'color-mix(in srgb, var(--color-error) 50%, transparent)'
            }`,
            color: status === 'ok' ? 'var(--color-success-light)' : 'var(--color-error-light)',
          }}
        >
          {t.status[status as keyof typeof t.status]}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        {isSubmitting ? t.sending : t.submit}
      </button>
    </form>
  );
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback': () => void;
          theme?: 'light' | 'dark' | 'auto';
        }
      ) => string;
      reset: (widgetId?: string) => void;
    };
  }
}
