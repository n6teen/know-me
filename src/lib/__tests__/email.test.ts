import { describe, it, expect } from 'vitest';
import { escapeHtml } from '../email';

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
