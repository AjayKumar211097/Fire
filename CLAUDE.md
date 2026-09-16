# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev           # Start dev server with Turbopack (http://localhost:3000)
npm run build         # Production build
npm run lint          # ESLint
npm run format        # Prettier (formats .ts/.tsx files)
npm run typecheck     # TypeScript type check (no emit)
npm run update-price  # Fetch today's Hyderabad rate into data/gold-daily.json
```

## Architecture

**Next.js 16 App Router**, React 19, TypeScript. A PWA targeting mobile installation whose
sole feature is showing the Hyderabad retail gold rate and its 5-day / 5-month / 5-year history.

### App structure

- `app/`
  - `layout.tsx` — Root layout: fonts (Figtree + Geist Mono), metadata, wraps app in `ThemeProvider` and `PwaProvider`
  - `page.tsx` — Sole page. A **Server Component**: imports the JSON, computes every row, renders `<GoldHistory>`
  - `manifest.ts` — PWA manifest (standalone display, teal theme color `#0f766e`)
  - `globals.css` — Tailwind v4 imports + OKLCH CSS variable theme system
- `components/gold-history.tsx` — the only client component; holds tab + karat state
- `components/segmented-control.tsx` — generic 1-of-N control, used for *both* the period tabs and the karat selector
- `components/ui/` — shadcn/ui components (Button with CVA variants, Input)
- `components/theme-provider.tsx` — wraps `next-themes`; pressing **D** toggles dark/light mode
- `components/pwa-provider.tsx` — registers `/public/sw.js`
- `lib/gold/` — `types.ts`, `data.ts` (JSON access), `aggregate.ts` (period math), `format.ts`
- `lib/utils.ts` — `cn()` helper (clsx + tailwind-merge)
- `scripts/update-gold-rate.mjs` — the daily updater (plain Node, zero deps)
- `.github/workflows/update-gold-rate.yml` — daily cron that runs the updater and commits

### Data flow

There is **no localStorage, no backend and no runtime fetch**. Data lives in two committed JSON files:

- `data/gold-daily.json` — measured readings, one per IST day, **written only by the daily job**
- `data/gold-seed.json` — researched monthly/yearly averages, **hand-curated, never automated**

`app/page.tsx` imports both at build time (`resolveJsonModule` is on) and computes all six
row sets (3 periods × 2 karats) server-side, so the readings array never reaches the client.
A commit from the daily job triggers a Vercel redeploy, which is how the phone gets new data.

**Averaging rule** (`lib/gold/aggregate.ts`): a month or year uses its own daily readings
when they cover ≥ `COVERAGE_THRESHOLD` (0.5) of the days elapsed in that period; otherwise
it falls back to the seeded estimate. Measured and seeded values are never blended, and each
row carries `basis` + `sampleCount` so the UI can mark estimates as `est.`

**Units**: rates are stored **per gram**, the unit the source publishes, and displayed
**per 10 g**, which is how gold is quoted and bought here. The conversion happens only at
the display boundary — `formatInrPer10g` / `formatSignedInrPer10g` in `lib/gold/format.ts`.
Never multiply before the formatter, or percentages and averages drift.

Two things to watch when touching aggregation:
- Period lists are built with `count + 1` entries so the oldest *visible* row still has a
  change to show, then the extra is dropped (`trimAndReverse`).
- Never build a `Date` from a bare ISO date string — it parses as UTC midnight and renders
  as the previous day west of UTC. Use the string parts, and `istToday()` for "now".

### Source of rates

`scripts/update-gold-rate.mjs` reads Kalyan Jewellers' Hyderabad page, whose rates are
embedded in its server-rendered `__NEXT_DATA__` payload — a browser `user-agent` header is
required. It validates hard (plausible range, 24K > 22K, purity ratio, ≤10% drift vs the
last reading) and exits non-zero rather than writing anything suspect. It is idempotent
(upsert by date) and self-heals a one-day gap using the payload's own `yesterday` values.
Override the URL with `GOLD_RATE_URL` to test failure paths.

### Styling

- **Tailwind CSS v4** via PostCSS — no `tailwind.config.js`; configuration is in CSS
- Use semantic tokens (`bg-card`, `text-muted-foreground`, `border`) so dark mode works
- All numerals get `font-mono tabular-nums` — the rupee column jitters otherwise
- `cn()` is the standard utility for conditional/merged class names
- shadcn components use **radix-nova** style (set in `components.json`)

### Path aliases

`@/*` maps to the repo root (e.g. `@/components/ui/button`, `@/lib/gold/aggregate`).

### Adding shadcn components

```bash
npx shadcn add <component>
```

Components land in `components/ui/`.
