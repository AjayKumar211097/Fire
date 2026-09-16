# Fire — Gold Rate

A single-purpose PWA that shows the **retail gold rate in Hyderabad** and how it has moved:
the last 5 days, the last 5 months, and the last 5 years. Installable on a phone.

Prices are shown **per 10 g** for both 22K and 24K. (They're stored per gram, the unit the
source publishes, and converted only when rendered.)

It does one thing. There is no portfolio, no purchase tracking, no login, no database.

## How it works

Rates come from [Kalyan Jewellers' Hyderabad page](https://store.kalyanjewellers.net/gold-rate/Hyderabad),
which publishes 22K and 24K per-gram retail prices. A GitHub Action runs once a day, reads
that page, and commits one new reading to `data/gold-daily.json`. Vercel redeploys on the
commit, so the installed app picks the new rate up.

Because no free API serves Hyderabad *retail* rates historically, the app builds its own
series one day at a time. Monthly and yearly figures are averaged from those daily
readings — and until enough have accumulated, they fall back to researched estimates in
`data/gold-seed.json`, which the UI labels `est.`

The series starts with 10 days backfilled from GoodReturns' Hyderabad table, which quotes
the same city-wide rate (it agrees with Kalyan to the rupee on the overlapping days). No
source publishes Hyderabad daily history beyond about 10 days, so everything before that
is monthly/yearly estimates.

```
data/gold-daily.json   measured readings, one per day, written by the daily job
data/gold-seed.json    researched monthly/yearly averages, hand-curated, never automated
lib/gold/              types, data access, period averaging, formatting
components/            SegmentedControl (tabs + karat), GoldHistory (the whole UI)
app/page.tsx           Server Component — computes every row, ships no history to the client
scripts/               the daily updater
```

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

### Updating the rate by hand

```bash
npm run update-price
```

Add `--dry-run` to parse and validate without writing. The script is idempotent — running
it twice in a day changes nothing — and it refuses to write anything that fails its sanity
checks, so a broken upstream page fails loudly rather than corrupting the series.

```bash
node scripts/update-gold-rate.mjs --dry-run
```

## Disclaimer

Rates shown are the metal rate only. They exclude making charges, GST and hallmarking, and
are not investment advice.
