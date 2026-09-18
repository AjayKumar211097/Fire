import dailyJson from "@/data/gold-daily.json"
import seedJson from "@/data/gold-seed.json"
import type { DailyFile, SeedFile } from "@/lib/metals/types"

export const KARATS = [22, 24] as const
export type Karat = (typeof KARATS)[number]

/** Whole INR per gram, per purity. */
export type GoldPrices = { k22: number; k24: number }

export type GoldReading = GoldPrices & { date: string } // date is YYYY-MM-DD
export type GoldSeedMonth = GoldPrices & { month: string; source?: string } // YYYY-MM
export type GoldSeedYear = GoldPrices & { year: number; source?: string }

/** The one place the karat -> field mapping lives. */
export const goldPrice =
  (karat: Karat) =>
  (row: GoldPrices): number =>
    karat === 22 ? row.k22 : row.k24

// Imported JSON widens to string/number, so assert rather than rely on inference.
const dailyFile = dailyJson as DailyFile<GoldReading>
const seedFile = seedJson as SeedFile<GoldSeedMonth, GoldSeedYear>

/** Readings, deduped by date (last wins), sorted oldest first, garbage dropped. */
export function getGoldDaily(): GoldReading[] {
  const byDate = new Map<string, GoldReading>()
  for (const r of dailyFile.readings) {
    if (!Number.isFinite(r.k22) || !Number.isFinite(r.k24)) continue
    byDate.set(r.date, r)
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date))
}

export function getGoldSeedMonthly(): GoldSeedMonth[] {
  return seedFile.monthly
}

export function getGoldSeedYearly(): GoldSeedYear[] {
  return seedFile.yearly
}

export function getLatestGold(): GoldReading | null {
  return getGoldDaily().at(-1) ?? null
}

export function getPreviousGold(): GoldReading | null {
  const daily = getGoldDaily()
  return daily.length > 1 ? daily[daily.length - 2] : null
}

export function getGoldSource(): string {
  return dailyFile.source
}
