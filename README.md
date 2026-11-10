# Note's Portfolio

A bilingual (Thai/English) personal portfolio website for Supachalita Polnong (Note), a Software Engineer.

## Tech Stack

- **Framework:** [Astro](https://astro.build) with TypeScript (strict mode)
- **Styling:** [Tailwind CSS](https://tailwindcss.com) with CSS custom properties
- **Interactive Components:** React islands via `@astrojs/react`
- **Animations:** GSAP + Lenis (smooth scroll)
- **Content:** MDX with content collections
- **Deployment:** Vercel via `@astrojs/vercel` adapter

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Environment Variables

Create a `.env` file in the root directory (see `.env.example` for a template):

```env
# Cloudflare Turnstile - spam protection for contact form
# Get keys at: https://dash.cloudflare.com/?to=/:account/turnstile
PUBLIC_TURNSTILE_SITE_KEY=your_turnstile_site_key
TURNSTILE_SECRET_KEY=your_turnstile_secret_key

# Upstash Redis - rate limiting for contact form (5 requests/hour/IP)
# Create a database at: https://console.upstash.com/
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_rest_token

# Resend - email delivery for contact form
# Get API key at: https://resend.com/api-keys
RESEND_API_KEY=re_your_api_key

# Contact form email configuration
CONTACT_TO_EMAIL=you@example.com
CONTACT_FROM_EMAIL=onboarding@resend.dev  # Optional, defaults to onboarding@resend.dev
```

| Variable                    | Required | Description                                                |
| --------------------------- | -------- | ---------------------------------------------------------- |
| `PUBLIC_TURNSTILE_SITE_KEY` | Yes      | Cloudflare Turnstile site key (public, used by frontend)   |
| `TURNSTILE_SECRET_KEY`      | Yes      | Cloudflare Turnstile secret key (server-side verification) |
| `UPSTASH_REDIS_REST_URL`    | Yes      | Upstash Redis REST API URL                                 |
| `UPSTASH_REDIS_REST_TOKEN`  | Yes      | Upstash Redis REST API token                               |
| `RESEND_API_KEY`            | Yes      | Resend API key for email delivery                          |
| `CONTACT_TO_EMAIL`          | Yes      | Recipient email(s), comma-separated for multiple           |
| `CONTACT_FROM_EMAIL`        | No       | Sender email address (defaults to `onboarding@resend.dev`) |

## Project Structure

```
src/
├── components/         # Astro and React components
├── content/
│   └── projects/       # Project case studies (MDX)
│       └── <slug>/
│           ├── en.mdx
│           └── th.mdx
├── i18n/               # Internationalization
│   ├── en.json         # English translations
│   ├── th.json         # Thai translations
│   └── index.ts        # i18n utilities and types
├── layouts/            # Page layouts
├── pages/              # Route pages
│   ├── en/             # English pages
│   └── th/             # Thai pages
├── styles/
│   ├── tokens.css      # ALL design tokens (single source of truth)
│   └── global.css      # Global styles, imports tokens.css
└── public/
    └── cv/             # CV PDF files
```

## Design Tokens Architecture

**All visual styling tokens are centralized in `src/styles/tokens.css`.**

To restyle the site, edit ONLY this file. No hardcoded colors, font names, spacing values, or easing functions exist in components or other CSS files.

### Token Categories

| Category      | CSS Variables              | Example                                    |
| ------------- | -------------------------- | ------------------------------------------ |
| Colors        | `--color-*`                | `--color-bg`, `--color-accent`             |
| Fonts         | `--font-*`                 | `--font-display`, `--font-body`            |
| Type Scale    | `--text-*`                 | `--text-hero`, `--text-h2`                 |
| Line Heights  | `--lh-*`                   | `--lh-display`, `--lh-body`                |
| Spacing       | `--space-*`                | `--space-4`, `--space-8`                   |
| Border Radius | `--radius-*`               | `--radius-card`, `--radius-button`         |
| Motion        | `--duration-*`, `--ease-*` | `--duration-fast`, `--ease-smooth`         |
| Focus Ring    | `--focus-ring-*`           | `--focus-ring-width`, `--focus-ring-color` |

### How Tailwind Uses Tokens

The Tailwind config (`tailwind.config.mjs`) references these CSS variables:

```js
// tailwind.config.mjs
colors: {
  bg: 'var(--color-bg)',
  accent: 'var(--color-accent)',
  // ...
},
fontFamily: {
  display: 'var(--font-display)',
  // ...
},
```

### Restyling Example

To change the accent color site-wide:

```css
/* src/styles/tokens.css */
:root {
  --color-accent: #ff6b6b; /* Changed from #C6FF3D */
}
```

All Tailwind classes (`text-accent`, `bg-accent`, `border-accent`) and component styles automatically update.

## Adding a New Project

1. Create a new folder in `src/content/projects/<slug>/`

2. Add MDX files for each language:

**`src/content/projects/<slug>/en.mdx`**

```mdx
---
title: 'Project Title'
summary: 'Short summary of the project'
role: 'Your role and contributions'
stack:
  - React
  - TypeScript
  - Node.js
order: 5 # Display order (lower = first)
size: large # 'large' or 'small' card size
cover: ./cover.png # Optional: cover image
badges: # Optional: card badges
  - new
  - production
metrics: # Optional: key metrics
  - label: 'Users'
    value: '10K+'
demoUrl: https://... # Optional: live demo link
repoUrl: https://... # Optional: GitHub repo link
---

## The problem

Description of the problem you solved.

## How I approached it

Your approach and methodology.

## The outcome

Results and impact.
```

3. Create the Thai version (`th.mdx`) with the same structure

4. Optional: Add a cover image in the same folder

### Content Schema

| Field     | Type                      | Required | Description                     |
| --------- | ------------------------- | -------- | ------------------------------- |
| `title`   | string                    | ✓        | Project title                   |
| `summary` | string                    | ✓        | Brief description               |
| `role`    | string                    | ✓        | Your role/contributions         |
| `stack`   | string[]                  | ✓        | Technologies used               |
| `order`   | number                    | ✓        | Display order                   |
| `size`    | `'large'` \| `'small'`    | ✓        | Card size in grid               |
| `cover`   | image                     |          | Cover image                     |
| `badges`  | `('new'\|'production')[]` |          | Card badges (rendered on cards) |
| `metrics` | `{label, value}[]`        |          | Key metrics                     |
| `demoUrl` | url                       |          | Live demo URL                   |
| `repoUrl` | url                       |          | Repository URL                  |

## Editing i18n Strings

All UI text is stored in JSON files:

- **English:** `src/i18n/en.json`
- **Thai:** `src/i18n/th.json`

The translation keys must match exactly between files. The `t()` helper function provides type-safe access:

```typescript
import { createTranslator } from '@/i18n';

const t = createTranslator('en');
t('hero.headline'); // Type-safe key access
```

### Adding New Strings

1. Add the key to both `en.json` and `th.json`
2. TypeScript will automatically infer the new key type

## Contact Form API Contract

The contact form POSTs to `/api/contact` with the following JSON body:

```typescript
{
  name: string; // User's name (1-100 chars)
  email: string; // User's email (valid email format)
  message: string; // Message (10-5000 chars)
  turnstileToken: string; // Cloudflare Turnstile token
  locale: 'th' | 'en'; // Current page locale
  website: string; // Honeypot field (must be empty string)
}
```

**Response format:**

All responses are JSON with a `code` field:

| Status | Code             | Description                                  |
| ------ | ---------------- | -------------------------------------------- |
| 200    | `ok`             | Message sent successfully                    |
| 400    | `invalid_input`  | Validation failed (includes `fields` object) |
| 403    | `captcha_failed` | Turnstile verification failed                |
| 429    | `rate_limited`   | Too many requests (5 per hour per IP)        |
| 500    | `send_failed`    | Server error                                 |

**Validation error response (400):**

```json
{
  "code": "invalid_input",
  "fields": {
    "name": "required" | "too_long",
    "email": "invalid",
    "message": "too_short" | "too_long"
  }
}
```

**Security features:**

- Honeypot field: If `website` is non-empty, returns 200 `{ code: 'ok' }` but does NOT send email
- Rate limiting: 5 requests per hour per IP (sliding window via Upstash Redis)
- Captcha: Server-side Cloudflare Turnstile verification
- Input validation: Server-side validation with zod
- HTML escaping: All user input is escaped in email HTML to prevent XSS

## Accessibility

- Semantic HTML landmarks
- Skip link for keyboard navigation
- Visible focus states with accent color ring
- Color contrast meeting WCAG AA
- Alt text for images
- Keyboard-navigable navigation and cards
- `prefers-reduced-motion` support (disables Lenis/animations)

## Performance

- Initial JS budget: ~150KB gzipped
- Images optimized via `astro:assets`
- Fonts loaded with `font-display: swap`
- Display font preloaded
- View Transitions enabled

## Development

```bash
# Lint
pnpm lint
pnpm lint:fix

# Format
pnpm format
pnpm format:check

# Type check
pnpm typecheck

# Build
pnpm build
```

## CI/CD

GitHub Actions workflow runs on PRs:

- Lint (ESLint)
- Format check (Prettier)
- Type check (`astro check`)
- Build
- Lighthouse CI (Performance >= 90, LCP <= 2.5s)

## License

Private - All rights reserved.
