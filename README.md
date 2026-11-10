# Note's Portfolio

Personal portfolio website for Supachalita Polnong (Note), a Software Engineer.

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

Create a `.env` file in the root directory (see `.env.example`):

```env
# Cloudflare Turnstile site key for contact form spam protection
PUBLIC_TURNSTILE_SITE_KEY=your_turnstile_site_key

# Site URL for canonical links and sitemaps (e.g. https://yourdomain.com)
PUBLIC_SITE_URL=https://example.com
```

| Variable | Required | Description |
| --- | --- | --- |
| `PUBLIC_TURNSTILE_SITE_KEY` | Production | Cloudflare Turnstile site key for spam protection |
| `PUBLIC_SITE_URL` | Production | Full site URL for canonical links and OG tags |

## Project Structure

```
src/
├── components/         # Astro and React components
├── content/
│   └── projects/       # Project case studies (MDX)
│       └── <slug>/
│           └── en.mdx
├── i18n/               # Translations
│   ├── en.json         # English strings
│   └── index.ts        # t() helper
├── layouts/            # Page layouts
├── pages/              # Route pages
│   ├── index.astro     # Home (/)
│   ├── about.astro     # About (/about)
│   └── work/
│       └── [slug].astro # Case study pages (/work/<slug>)
├── styles/
│   ├── tokens.css      # ALL design tokens (single source of truth)
│   └── global.css      # Global styles
└── public/
    └── cv/             # CV PDF
```

## Adding a New Project

1. Create a folder: `src/content/projects/<slug>/`

2. Add `en.mdx`:

```mdx
---
title: 'Project Title'
summary: 'Short summary'
role: 'Your role'
stack: []  # Optional: technologies used
order: 5   # Display order (lower = first)
size: large  # 'large' or 'small' card size
badges: []  # Optional: ['new', 'production']
---

## the problem
...

## my role
...

## how i did it
...

## what happened
...
```

### Content Schema

| Field     | Type                      | Required | Description           |
| --------- | ------------------------- | -------- | --------------------- |
| `title`   | string                    | ✓        | Project title         |
| `summary` | string                    | ✓        | Brief description     |
| `role`    | string                    | ✓        | Your role             |
| `stack`   | string[]                  |          | Technologies (hidden if empty) |
| `order`   | number                    | ✓        | Display order         |
| `size`    | `'large'` \| `'small'`    | ✓        | Card size in grid     |
| `badges`  | `('new'\|'production')[]` |          | Card badges (hidden if empty) |
| `metrics` | `{label, value}[]`        |          | Key metrics (hidden if empty) |
| `demoUrl` | url                       |          | Live demo URL         |
| `repoUrl` | url                       |          | Repository URL        |

## Design Tokens

All visual styling tokens are in `src/styles/tokens.css`. Edit only this file to restyle the site.

## Development

```bash
pnpm lint        # Lint
pnpm typecheck   # Type check
pnpm build       # Build
```

## CI/CD

GitHub Actions runs on PRs:
- Lint, Format check, Type check, Build
- Lighthouse CI (Performance >= 90%, LCP <= 2.5s)

## License

Private - All rights reserved.
