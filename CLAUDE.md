# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server with Turbopack (http://localhost:3000)
npm run build      # Production build
npm run lint       # ESLint
npm run format     # Prettier (formats .ts/.tsx files)
npm run typecheck  # TypeScript type check (no emit)
```

## Architecture

This is a **Next.js 16 App Router** project using React 19 and TypeScript. It is a PWA budget tracker targeting mobile installation.

### App structure

- `app/` — Next.js App Router pages and layouts
  - `layout.tsx` — Root layout: fonts (Figtree + Geist Mono), metadata, wraps app in `ThemeProvider` and `PwaProvider`
  - `page.tsx` — Sole page; a `"use client"` component managing all state
  - `manifest.ts` — PWA manifest (standalone display, teal theme color `#0f766e`)
  - `globals.css` — Tailwind v4 imports + full OKLCH-based CSS variable theme system
- `components/ui/` — shadcn/ui components (Button with CVA variants, Input)
- `components/theme-provider.tsx` — Wraps `next-themes`; pressing **D** toggles dark/light mode
- `components/pwa-provider.tsx` — Registers `/public/sw.js` service worker
- `lib/utils.ts` — `cn()` helper (clsx + tailwind-merge)
- `public/sw.js` — Minimal service worker (skip-wait + claim clients; no caching strategy yet)

### State & data flow

All state lives in `app/page.tsx` (no global store, no backend). Two `useEffect` hooks handle persistence:
1. Load from `localStorage['fire-budget-tracker']` on mount
2. Save to localStorage on every state change (totalBudget + entries array)

### Styling

- **Tailwind CSS v4** via PostCSS — no `tailwind.config.js`; configuration is in CSS
- Color tokens are OKLCH CSS variables defined in `globals.css` under `@layer base` for both light and dark modes
- `cn()` is the standard utility for conditional/merged class names
- shadcn components use **radix-nova** style (set in `components.json`)

### Path aliases

`@/*` maps to the repo root (e.g. `@/components/ui/button`, `@/lib/utils`).

### Adding shadcn components

```bash
npx shadcn add <component>
```

Components land in `components/ui/`.
