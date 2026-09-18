import {
  formatDayLabel,
  formatMonthLabel,
  formatYearLabel,
  istToday,
} from "@/lib/metals/format"
import type { PeriodBasis, PricePoint } from "@/lib/metals/types"

/**
 * A period uses its own daily readings when they cover at least this fraction of the
 * days elapsed in that period; otherwise it falls back to the seeded estimate. Measured
 * and seeded values are never blended.
 */
export const COVERAGE_THRESHOLD = 0.5

/**
 * The period math is metal-agnostic: callers pass a selector that pulls the price out of
 * a row, rather than a karat. Daily and seed rows must therefore name their price field
 * the same way, which is what lets one selector serve both — `(row: R | S) => number`
 * makes TypeScript enforce that at the call site.
 */
export type Reading = { date: string }
export type MonthSeed = { month: string }
export type YearSeed = { year: number }

export type PeriodOptions = {
  count?: number
  today?: string
  /** Gold is whole rupees per gram; silver keeps 2 dp, since it is derived from a per-kg
   * figure and rounding to the rupee would quantise averages by ₹1,000/kg. */
  round?: (value: number) => number
}

function utcDays(isoDate: string): number {
  const [y, m, d] = isoDate.split("-").map(Number)
  return Date.UTC(y, m - 1, d) / 86_400_000
}

function mean(values: number[], round: (value: number) => number): number {
  return round(values.reduce((sum, v) => sum + v, 0) / values.length)
}

function plural(n: number): string {
  return `avg of ${n} reading${n === 1 ? "" : "s"}`
}

/**
 * Changes are computed from the already-rounded values so the arithmetic on screen is
 * self-consistent. Input must be oldest-first.
 */
function attachChanges(ascending: PricePoint[]): PricePoint[] {
  return ascending.map((point, i) => {
    if (i === 0) return point
    const prev = ascending[i - 1].value
    const changeAbs = point.value - prev
    return {
      ...point,
      changeAbs,
      changePct: prev === 0 ? null : (changeAbs / prev) * 100,
    }
  })
}

/**
 * We build one extra period so the oldest *visible* row still has a change to show, then
 * drop it. With less data than that, every period we have is shown.
 */
function trimAndReverse(ascending: PricePoint[], count: number): PricePoint[] {
  const withChanges = attachChanges(ascending)
  const visible =
    withChanges.length > count ? withChanges.slice(1) : withChanges
  return visible.reverse()
}

export function last5Days<R extends Reading>(
  daily: readonly R[],
  priceOf: (row: R) => number,
  count = 5
): PricePoint[] {
  const window = daily.slice(-(count + 1))
  const points: PricePoint[] = window.map((reading) => ({
    key: reading.date,
    label: formatDayLabel(reading.date),
    sublabel: null,
    value: priceOf(reading),
    basis: "daily" as PeriodBasis,
    sampleCount: 1,
    changeAbs: null,
    changePct: null,
  }))
  return trimAndReverse(points, count)
}

/** Month keys ("YYYY-MM"), oldest first, ending with the month `today` falls in. */
function monthKeys(today: string, total: number): string[] {
  const [y, m] = today.split("-").map(Number)
  const keys: string[] = []
  for (let i = total - 1; i >= 0; i--) {
    const monthIndex = m - 1 - i
    const year = y + Math.floor(monthIndex / 12)
    const month = ((monthIndex % 12) + 12) % 12
    keys.push(`${year}-${String(month + 1).padStart(2, "0")}`)
  }
  return keys
}

/** Year keys ("YYYY"), oldest first, ending with the year `today` falls in. */
function yearKeys(today: string, total: number): string[] {
  const y = Number(today.split("-")[0])
  return Array.from({ length: total }, (_, i) => String(y - (total - 1 - i)))
}

/** Days elapsed in a period, capped at today so an in-progress period isn't penalised. */
function elapsedDays(
  key: string,
  kind: "month" | "year",
  today: string
): number {
  let first: string
  let last: string
  if (kind === "month") {
    const [y, m] = key.split("-").map(Number)
    first = `${key}-01`
    const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate()
    last = `${key}-${String(lastDay).padStart(2, "0")}`
  } else {
    first = `${key}-01-01`
    last = `${key}-12-31`
  }
  const end = last < today ? last : today
  return utcDays(end) - utcDays(first) + 1
}

type SeedLookup = (key: string) => number | null

function buildPeriodPoints<R extends Reading>(
  keys: string[],
  kind: "month" | "year",
  daily: readonly R[],
  seedFor: SeedLookup,
  priceOf: (row: R) => number,
  round: (value: number) => number,
  today: string,
  label: (key: string) => string
): PricePoint[] {
  const points: PricePoint[] = []

  for (const key of keys) {
    const inPeriod = daily.filter((r) => r.date.startsWith(`${key}-`))
    const n = inPeriod.length
    const elapsed = elapsedDays(key, kind, today)
    const coverage = elapsed > 0 ? n / elapsed : n > 0 ? 1 : 0
    const seeded = seedFor(key)

    const useDaily =
      n > 0 && (coverage >= COVERAGE_THRESHOLD || seeded === null)
    if (!useDaily && seeded === null) continue

    points.push({
      key,
      label: label(key),
      sublabel: useDaily ? plural(n) : "estimated",
      value: useDaily
        ? mean(
            inPeriod.map((r) => priceOf(r)),
            round
          )
        : (seeded as number),
      basis: useDaily ? "daily" : "seed",
      sampleCount: useDaily ? n : 0,
      changeAbs: null,
      changePct: null,
    })
  }

  return points
}

export function monthlyAverages<R extends Reading, S extends MonthSeed>(
  daily: readonly R[],
  seed: readonly S[],
  priceOf: (row: R | S) => number,
  { count = 5, today = istToday(), round = Math.round }: PeriodOptions = {}
): PricePoint[] {
  const byMonth = new Map(seed.map((s) => [s.month, s]))
  const points = buildPeriodPoints(
    monthKeys(today, count + 1),
    "month",
    daily,
    (key) => {
      const hit = byMonth.get(key)
      return hit ? priceOf(hit) : null
    },
    priceOf,
    round,
    today,
    formatMonthLabel
  )
  return trimAndReverse(points, count)
}

export function yearlyAverages<R extends Reading, S extends YearSeed>(
  daily: readonly R[],
  seed: readonly S[],
  priceOf: (row: R | S) => number,
  { count = 5, today = istToday(), round = Math.round }: PeriodOptions = {}
): PricePoint[] {
  const byYear = new Map(seed.map((s) => [String(s.year), s]))
  const points = buildPeriodPoints(
    yearKeys(today, count + 1),
    "year",
    daily,
    (key) => {
      const hit = byYear.get(key)
      return hit ? priceOf(hit) : null
    },
    priceOf,
    round,
    today,
    formatYearLabel
  )
  return trimAndReverse(points, count)
}
