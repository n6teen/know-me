import { describe, it, expect } from 'vitest';
import { parseContactInput } from '../contact-schema';

describe('parseContactInput', () => {
  const validInput = {
    name: 'John Doe',
    email: 'john@example.com',
    message: 'Hello, this is a test message.',
    locale: 'en',
    turnstileToken: 'test-token',
    website: '',
  };

  describe('valid input', () => {
    it('accepts valid input', () => {
      const result = parseContactInput(validInput);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('John Doe');
        expect(result.data.email).toBe('john@example.com');
      }
    });

    it('accepts Thai locale', () => {
      const result = parseContactInput({ ...validInput, locale: 'th' });
      expect(result.success).toBe(true);
    });

    it('accepts maximum length name (100 chars)', () => {
      const result = parseContactInput({
        ...validInput,
        name: 'A'.repeat(100),
      });
      expect(result.success).toBe(true);
    });

    it('accepts minimum length message (10 chars)', () => {
      const result = parseContactInput({
        ...validInput,
        message: 'A'.repeat(10),
      });
      expect(result.success).toBe(true);
    });

    it('accepts maximum length message (5000 chars)', () => {
      const result = parseContactInput({
        ...validInput,
        message: 'A'.repeat(5000),
      });
      expect(result.success).toBe(true);
    });

    it('accepts honeypot field with value', () => {
      const result = parseContactInput({
        ...validInput,
        website: 'spam-bot-filled-this',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('name validation', () => {
    it('rejects empty name', () => {
      const result = parseContactInput({ ...validInput, name: '' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.fields.name).toBe('required');
      }
    });

    it('rejects name exceeding 100 characters', () => {
      const result = parseContactInput({
        ...validInput,
        name: 'A'.repeat(101),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.fields.name).toBe('too_long');
      }
    });

    it('rejects missing name field', () => {
      const { name: _, ...input } = validInput;
      const result = parseContactInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe('email validation', () => {
    it('rejects invalid email format', () => {
      const result = parseContactInput({
        ...validInput,
        email: 'not-an-email',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.fields.email).toBe('invalid');
      }
    });

    it('rejects email without @', () => {
      const result = parseContactInput({
        ...validInput,
        email: 'userexample.com',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.fields.email).toBe('invalid');
      }
    });

    it('rejects email without domain', () => {
      const result = parseContactInput({
        ...validInput,
        email: 'user@',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.fields.email).toBe('invalid');
      }
    });

    it('rejects empty email', () => {
      const result = parseContactInput({ ...validInput, email: '' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.fields.email).toBe('invalid');
      }
    });
  });

  describe('message validation', () => {
    it('rejects message shorter than 10 characters', () => {
      const result = parseContactInput({
        ...validInput,
        message: 'Short',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.fields.message).toBe('too_short');
      }
    });

    it('rejects message exceeding 5000 characters', () => {
      const result = parseContactInput({
        ...validInput,
        message: 'A'.repeat(5001),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.fields.message).toBe('too_long');
      }
    });

    it('rejects empty message', () => {
      const result = parseContactInput({ ...validInput, message: '' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.fields.message).toBe('too_short');
      }
    });
  });

  describe('locale validation', () => {
    it('rejects invalid locale', () => {
      const result = parseContactInput({
        ...validInput,
        locale: 'fr',
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing locale', () => {
      const { locale: _, ...input } = validInput;
      const result = parseContactInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe('turnstileToken validation', () => {
    it('rejects empty turnstile token', () => {
      const result = parseContactInput({
        ...validInput,
        turnstileToken: '',
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing turnstile token', () => {
      const { turnstileToken: _, ...input } = validInput;
      const result = parseContactInput(input);
      expect(result.success).toBe(false);
    });
  });

  describe('multiple validation errors', () => {
    it('returns multiple field errors', () => {
      const result = parseContactInput({
        ...validInput,
        name: '',
        email: 'invalid',
        message: 'short',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.fields.name).toBe('required');
        expect(result.fields.email).toBe('invalid');
        expect(result.fields.message).toBe('too_short');
      }
    });
  });

  describe('non-object input', () => {
    it('rejects null', () => {
      const result = parseContactInput(null);
      expect(result.success).toBe(false);
    });

    it('rejects string', () => {
      const result = parseContactInput('not an object');
      expect(result.success).toBe(false);
    });

    it('rejects array', () => {
      const result = parseContactInput([]);
      expect(result.success).toBe(false);
    });
  });
});
