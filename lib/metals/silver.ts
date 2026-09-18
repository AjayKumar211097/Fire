import dailyJson from "@/data/silver-daily.json"
import seedJson from "@/data/silver-seed.json"
import type { DailyFile, SeedFile } from "@/lib/metals/types"

/**
 * Silver has no karat axis — the source publishes one purity — so a row carries a single
 * price. Stored per gram like gold, though the source quotes per kilogram and the UI
 * displays per kilogram; only the storage unit is shared.
 */
export type SilverPrices = { price: number }

export type SilverReading = SilverPrices & { date: string } // date is YYYY-MM-DD
export type SilverSeedMonth = SilverPrices & { month: string; source?: string } // YYYY-MM
export type SilverSeedYear = SilverPrices & { year: number; source?: string }

export const silverPrice = (row: SilverPrices): number => row.price

/** Derived from a per-kg figure, so averages keep 2 dp; rounding to the rupee per gram
 * would quantise them by ₹1,000/kg on a series whose real resolution is ₹5,000/kg. */
export const roundSilver = (value: number): number =>
  Math.round(value * 100) / 100

// Imported JSON widens to string/number, so assert rather than rely on inference.
const dailyFile = dailyJson as DailyFile<SilverReading>
const seedFile = seedJson as SeedFile<SilverSeedMonth, SilverSeedYear>

/** Readings, deduped by date (last wins), sorted oldest first, garbage dropped. */
export function getSilverDaily(): SilverReading[] {
  const byDate = new Map<string, SilverReading>()
  for (const r of dailyFile.readings) {
    if (!Number.isFinite(r.price)) continue
    byDate.set(r.date, r)
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date))
}

export function getSilverSeedMonthly(): SilverSeedMonth[] {
  return seedFile.monthly
}

export function getSilverSeedYearly(): SilverSeedYear[] {
  return seedFile.yearly
}

export function getLatestSilver(): SilverReading | null {
  return getSilverDaily().at(-1) ?? null
}

export function getPreviousSilver(): SilverReading | null {
  const daily = getSilverDaily()
  return daily.length > 1 ? daily[daily.length - 2] : null
}

export function getSilverSource(): string {
  return dailyFile.source
}
