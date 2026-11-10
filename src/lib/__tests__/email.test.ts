import { describe, it, expect } from 'vitest';
import { escapeHtml, stripControlChars } from '../email';

describe('escapeHtml', () => {
  it('escapes & character', () => {
    expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
  });

  it('escapes < character', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });

  it('escapes > character', () => {
    expect(escapeHtml('a > b')).toBe('a &gt; b');
  });

  it('escapes " character', () => {
    expect(escapeHtml('He said "hello"')).toBe('He said &quot;hello&quot;');
  });

  it("escapes ' character", () => {
    expect(escapeHtml("It's fine")).toBe('It&#039;s fine');
  });

  it('escapes multiple special characters', () => {
    expect(escapeHtml('<div class="test">Hello & goodbye</div>')).toBe(
      '&lt;div class=&quot;test&quot;&gt;Hello &amp; goodbye&lt;/div&gt;'
    );
  });

  it('returns empty string for empty input', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('returns same string if no special characters', () => {
    expect(escapeHtml('Hello World 123')).toBe('Hello World 123');
  });

  it('handles unicode characters', () => {
    expect(escapeHtml('สวัสดี <hello> 你好')).toBe('สวัสดี &lt;hello&gt; 你好');
  });
});

describe('stripControlChars', () => {
  it('strips newline characters', () => {
    expect(stripControlChars('Hello\nWorld')).toBe('HelloWorld');
  });

  it('strips carriage return characters', () => {
    expect(stripControlChars('Hello\rWorld')).toBe('HelloWorld');
  });

  it('strips CRLF', () => {
    expect(stripControlChars('Hello\r\nWorld')).toBe('HelloWorld');
  });

  it('strips tab characters', () => {
    expect(stripControlChars('Hello\tWorld')).toBe('HelloWorld');
  });

  it('strips null characters', () => {
    expect(stripControlChars('Hello\x00World')).toBe('HelloWorld');
  });

  it('strips DEL character (0x7F)', () => {
    expect(stripControlChars('Hello\x7FWorld')).toBe('HelloWorld');
  });

  it('strips multiple control characters', () => {
    expect(stripControlChars('A\r\nB\tC\x00D')).toBe('ABCD');
  });

  it('preserves normal text', () => {
    expect(stripControlChars('Hello World 123')).toBe('Hello World 123');
  });

  it('preserves unicode characters', () => {
    expect(stripControlChars('สวัสดี 你好')).toBe('สวัสดี 你好');
  });

  it('returns empty string for empty input', () => {
    expect(stripControlChars('')).toBe('');
  });

  it('prevents email header injection via newlines in name', () => {
    const maliciousName = 'John\r\nBcc: attacker@evil.com\r\nSubject: Hacked';
    expect(stripControlChars(maliciousName)).toBe('JohnBcc: attacker@evil.comSubject: Hacked');
  });
});
