# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev            # Start dev server with Turbopack (http://localhost:3000)
npm run build          # Production build
npm run lint           # ESLint
npm run format         # Prettier (formats .ts/.tsx files)
npm run typecheck      # TypeScript type check (no emit)
npm run update-gold    # Fetch today's Hyderabad gold rate into data/gold-daily.json
npm run update-silver  # Fetch today's Hyderabad silver rate into data/silver-daily.json
```

## Architecture

**Next.js 16 App Router**, React 19, TypeScript. A PWA targeting mobile installation whose
sole feature is showing the Hyderabad retail **gold and silver** rates and their
5-day / 5-month / 5-year history.

### App structure

- `app/`
  - `layout.tsx` — Root layout: fonts (Figtree + Geist Mono), metadata, wraps app in `ThemeProvider` and `PwaProvider`
  - `page.tsx` — Sole page. A **Server Component**: imports the JSON, computes every row, renders `<RateHistory>`
  - `manifest.ts` — PWA manifest (standalone display, teal theme color `#0f766e`)
  - `globals.css` — Tailwind v4 imports + OKLCH CSS variable theme system
- `components/rate-history.tsx` — the only client component; holds metal + karat + tab state
- `components/segmented-control.tsx` — generic 1-of-N control, used for *all three* controls (metal, karat, period)
- `components/ui/` — shadcn/ui components (Button with CVA variants, Input)
- `components/theme-provider.tsx` — wraps `next-themes`; pressing **D** toggles dark/light mode
- `components/pwa-provider.tsx` — registers `/public/sw.js`
- `lib/metals/` — `types.ts` (shared vocabulary), `aggregate.ts` (period math), `format.ts`,
  and one module per metal: `gold.ts`, `silver.ts` (row types, JSON access, price selector)
- `lib/utils.ts` — `cn()` helper (clsx + tailwind-merge)
- `scripts/update-gold-rate.mjs`, `scripts/update-silver-rate.mjs` — the daily updaters (plain Node, zero deps)
- `.github/workflows/update-metal-rates.yml` — daily cron that runs both updaters and commits

### Data flow

There is **no localStorage, no backend and no runtime fetch**. Data lives in four committed JSON files:

- `data/gold-daily.json`, `data/silver-daily.json` — measured readings, one per IST day,
  **written only by the daily job**
- `data/gold-seed.json`, `data/silver-seed.json` — researched monthly/yearly averages,
  **hand-curated, never automated**

`app/page.tsx` imports them at build time (`resolveJsonModule` is on) and computes all nine
row sets — 3 periods × (2 karats + 1 silver) — server-side, so the readings array never
reaches the client. A commit from the daily job triggers a Vercel redeploy, which is how the
phone gets new data.

**Averaging rule** (`lib/metals/aggregate.ts`): a month or year uses its own daily readings
when they cover ≥ `COVERAGE_THRESHOLD` (0.5) of the days elapsed in that period; otherwise
it falls back to the seeded estimate. Measured and seeded values are never blended, and each
row carries `basis` + `sampleCount` so the UI can mark estimates as `est.`

**Aggregation is metal-agnostic.** The period functions take a price **selector**
(`(row) => number`), not a karat — `goldPrice(karat)` in `lib/metals/gold.ts`, `silverPrice`
in `silver.ts`. This only works because daily and seed rows name their price field the same
way, which the `(row: R | S) => number` parameter type makes TypeScript enforce. The
`round` option exists because silver keeps 2 dp; gold's default `Math.round` is unchanged.

**Units**: rates are stored **per gram** for every metal, the unit the sources publish. The
display unit is a `DisplayUnit` — `PER_10_G` for gold (how gold is quoted and bought here),
`PER_KG` for silver — applied exactly once, inside `lib/metals/format.ts`
(`formatInrPerUnit` / `formatSignedInrPerUnit`). **Never multiply before the formatter**, or
percentages and averages drift. Note `formatInrPerGram` uses a separate `Intl` instance
allowing 2 dp, so a fractional silver per-gram value doesn't contradict the per-kg headline
beside it; gold's integers render identically either way.

Two things to watch when touching aggregation:
- Period lists are built with `count + 1` entries so the oldest *visible* row still has a
  change to show, then the extra is dropped (`trimAndReverse`).
- Never build a `Date` from a bare ISO date string — it parses as UTC midnight and renders
  as the previous day west of UTC. Use the string parts, and `istToday()` for "now".

### Sources of rates

**Gold** — `scripts/update-gold-rate.mjs` reads Kalyan Jewellers' Hyderabad page, whose
rates are embedded in its server-rendered `__NEXT_DATA__` payload; a browser `user-agent`
header is required. It validates hard (plausible range, 24K > 22K, purity ratio, ≤10% drift
vs the last reading) and exits non-zero rather than writing anything suspect. It is
idempotent (upsert by date) and self-heals a one-day gap using the payload's own `yesterday`
values. Override the URL with `GOLD_RATE_URL` to test failure paths.

**Silver** — Kalyan publishes **no silver at all** (its `pageProps` has only `stores` and
`goldRate`, and `/silver-rate/…` 404s), so `scripts/update-silver-rate.mjs` reads
GoodReturns' Hyderabad silver page instead. Fully server-rendered, so a plain fetch works.
Override with `SILVER_RATE_URL`.

Silver differs from gold in ways that are deliberate, not oversights:

- **No purity selector.** The source publishes one purity, so the karat control renders for
  gold only and a silver row carries a single `price` field.
- **Coarse source granularity.** GoodReturns quotes silver in round ₹5,000/kg (₹5/g) steps —
  BankBazaar is identical, so this is how Indian retail silver is published. Zero-change days
  are normal and common, which is why a zero delta renders muted as "No change today"
  (for both metals) rather than as a green `+₹0`.
- **Per-kg is canonical.** The per-gram value is derived by dividing the per-kg card by 1000,
  which keeps precision the page's own 1 g card has already rounded off. The two cards must
  agree within ₹0.5/g or the run fails — an intra-page invariant standing in for gold's
  purity-ratio check.
- **Different validation bands.** Gold's `> 1000` range would reject every valid silver
  reading (~₹250/g); silver uses ₹20–₹5000/g, and 15% drift rather than 10%. The guards exist
  to catch parse errors, not market moves.
- **Ten-day backfill.** The source publishes its own last ten days, so a week of failed runs
  fully recovers on the next success. Only genuine gaps are filled; a recorded day is never
  rewritten.
- GoodReturns also has an undocumented `?gr_db_dynamic_content=metal_past_price&date=…`
  endpoint (gated on a `Referer` header) returning any past date, but it **rate-limits to 403
  after ~10 rapid requests**. It is not used anywhere, and should not be wired into CI.

### Styling

- **Tailwind CSS v4** via PostCSS — no `tailwind.config.js`; configuration is in CSS
- Use semantic tokens (`bg-card`, `text-muted-foreground`, `border`) so dark mode works
- All numerals get `font-mono tabular-nums` — the rupee column jitters otherwise
- `cn()` is the standard utility for conditional/merged class names
- shadcn components use **radix-nova** style (set in `components.json`)

### Path aliases

`@/*` maps to the repo root (e.g. `@/components/ui/button`, `@/lib/metals/aggregate`).

### Adding shadcn components

```bash
npx shadcn add <component>
```

Components land in `components/ui/`.
