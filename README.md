# Fire — Gold & Silver Rates

A single-purpose PWA that shows the **retail gold and silver rates in Hyderabad** and how
they have moved: the last 5 days, the last 5 months, and the last 5 years. Installable on a
phone. Gold is the default tab.

Gold is shown **per 10 g** for both 22K and 24K; silver is shown **per 1 kg**, which is how
each is actually quoted and bought here. Both are stored per gram, the unit the sources
publish, and converted only when rendered.

It does one thing. There is no portfolio, no purchase tracking, no login, no database.

## How it works

A GitHub Action runs once a day, reads both sources, and commits any new readings. Vercel
redeploys on the commit, so the installed app picks the new rates up.

**Gold** comes from [Kalyan Jewellers' Hyderabad page](https://store.kalyanjewellers.net/gold-rate/Hyderabad),
which publishes 22K and 24K per-gram retail prices in its server-rendered payload.

**Silver** comes from [GoodReturns' Hyderabad page](https://www.goodreturns.in/silver-rates/hyderabad.html).
Kalyan publishes no silver at all — its payload carries only gold karats, and its
`/silver-rate/…` path 404s — so silver needs its own source. Two things follow from it:

- The page publishes its own **last ten days**, so the silver job backfills gaps: a week of
  failed runs fully recovers on the next success. Recorded days are never rewritten.
- Silver is quoted in round **₹5,000/kg (₹5/g) steps**. BankBazaar is identically coarse, so
  that is how Indian retail silver is published, not a quirk of this source. Days with no
  change are common, and the UI says "No change today" rather than showing a green ₹0.

Because no free API serves Hyderabad *retail* rates historically, the app builds its own
series one day at a time. Monthly and yearly figures are averaged from those daily
readings — and until enough have accumulated, they fall back to researched estimates in
`data/gold-seed.json` / `data/silver-seed.json`, which the UI labels `est.`

The gold series starts with 10 days backfilled from GoodReturns' Hyderabad table (it agrees
with Kalyan to the rupee on the overlapping days). No source publishes Hyderabad daily
history beyond about 10 days, so everything before that is monthly/yearly estimates.

```
data/gold-daily.json     measured readings, one per day, written by the daily job
data/silver-daily.json   same, for silver
data/gold-seed.json      researched monthly/yearly averages, hand-curated, never automated
data/silver-seed.json    same, for silver
lib/metals/              shared types, period averaging, formatting; gold.ts + silver.ts per metal
components/              SegmentedControl (metal + karat + period), RateHistory (the whole UI)
app/page.tsx             Server Component — computes every row, ships no history to the client
scripts/                 the two daily updaters
```

The period math is shared: `lib/metals/aggregate.ts` takes a price *selector* rather than a
karat, so gold and silver run through one code path and the averaging rule lives in one
place.

### Averaging

A month or year uses its own daily readings when they cover at least half the days elapsed
in that period; otherwise it uses the seeded estimate. Measured and estimated values are
never blended, and every row says which it is.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Press **`D`** to toggle dark mode.

```bash
npm run build       # production build
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm run format      # Prettier
```

### Updating the rates by hand

```bash
npm run update-gold
npm run update-silver
```

Add `--dry-run` to parse and validate without writing. Both scripts are idempotent — running
one twice in a day changes nothing — and both refuse to write anything that fails their
sanity checks, so a broken upstream page fails loudly rather than corrupting the series.
The checks differ per metal: gold's plausible band and 24K > 22K purity ratio make no sense
for silver, which instead cross-checks the page's own per-gram and per-kilogram figures
against each other.

```bash
node scripts/update-silver-rate.mjs --dry-run
```

Set `GOLD_RATE_URL` / `SILVER_RATE_URL` to point a script elsewhere and exercise its failure
paths.

## Disclaimer

Rates shown are the metal rate only. They exclude making charges, GST and hallmarking, and
are not investment advice.
