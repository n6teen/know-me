import plugin from 'tailwindcss/plugin';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      bg: 'var(--color-bg)',
      surface: 'var(--color-surface)',
      line: 'var(--color-line)',
      text: 'var(--color-text)',
      muted: 'var(--color-muted)',
      accent: 'var(--color-accent)',
      'on-accent': 'var(--color-on-accent)',
      'accent-text': 'var(--color-accent-text)',
      glow: 'var(--color-glow)',
      red: {
        400: 'var(--color-error-light)',
        500: 'var(--color-error)',
        900: 'var(--color-error-dark)',
      },
      green: {
        300: 'var(--color-success-light)',
        500: 'var(--color-success)',
        900: 'var(--color-success-dark)',
      },
    },
    fontFamily: {
      display: 'var(--font-display)',
      body: 'var(--font-body)',
      mono: 'var(--font-mono)',
    },
    fontSize: {
      hero: ['var(--text-hero)', { lineHeight: 'var(--lh-display)' }],
      h2: ['var(--text-h2)', { lineHeight: 'var(--lh-display)' }],
      h3: ['var(--text-h3)', { lineHeight: 'var(--lh-display)' }],
      base: ['var(--text-base)', { lineHeight: 'var(--lh-body)' }],
      sm: ['var(--text-sm)', { lineHeight: 'var(--lh-relaxed)' }],
      xs: ['var(--text-xs)', { lineHeight: 'var(--lh-loose)' }],
    },
    spacing: {
      0: '0',
      1: 'var(--space-1)',
      2: 'var(--space-2)',
      3: 'var(--space-3)',
      4: 'var(--space-4)',
      6: 'var(--space-6)',
      8: 'var(--space-8)',
      12: 'var(--space-12)',
      16: 'var(--space-16)',
      24: 'var(--space-24)',
      32: 'var(--space-32)',
    },
    borderRadius: {
      none: '0',
      card: 'var(--radius-card)',
      button: 'var(--radius-button)',
      full: 'var(--radius-full)',
      input: 'var(--radius-input)',
    },
    transitionDuration: {
      fast: 'var(--duration-fast)',
      DEFAULT: 'var(--duration-default)',
      slow: 'var(--duration-slow)',
    },
    transitionTimingFunction: {
      smooth: 'var(--ease-smooth)',
    },
    extend: {
      maxWidth: {
        container: 'var(--container-max)',
      },
      gridTemplateColumns: {
        12: 'repeat(12, minmax(0, 1fr))',
      },
      gap: {
        gutter: 'var(--gutter)',
      },
    },
  },
  plugins: [
    plugin(({ addUtilities }) => {
      addUtilities({
        '.focus-ring': {
          outline: 'var(--focus-ring-width) solid var(--focus-ring-color)',
          'outline-offset': 'var(--focus-ring-offset)',
        },
        '.safe-area-inset': {
          'padding-top': 'env(safe-area-inset-top)',
          'padding-right': 'env(safe-area-inset-right)',
          'padding-bottom': 'env(safe-area-inset-bottom)',
          'padding-left': 'env(safe-area-inset-left)',
        },
      });
    }),
  ],
};
