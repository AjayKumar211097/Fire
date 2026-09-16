import dailyJson from "@/data/gold-daily.json"
import seedJson from "@/data/gold-seed.json"
import type {
  DailyReading,
  GoldDailyFile,
  GoldSeedFile,
  Karat,
  SeedMonth,
  SeedYear,
} from "@/lib/gold/types"

// Imported JSON widens to string/number, so assert rather than rely on inference.
const dailyFile = dailyJson as GoldDailyFile
const seedFile = seedJson as GoldSeedFile

/** Readings, deduped by date (last wins), sorted oldest first, garbage dropped. */
export function getDaily(): DailyReading[] {
  const byDate = new Map<string, DailyReading>()
  for (const r of dailyFile.readings) {
    if (!Number.isFinite(r.k22) || !Number.isFinite(r.k24)) continue
    byDate.set(r.date, r)
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date))
}

export function getSeedMonthly(): SeedMonth[] {
  return seedFile.monthly
}

export function getSeedYearly(): SeedYear[] {
  return seedFile.yearly
}

export function getLatestReading(): DailyReading | null {
  const daily = getDaily()
  return daily.at(-1) ?? null
}

export function getPreviousReading(): DailyReading | null {
  const daily = getDaily()
  return daily.length > 1 ? daily[daily.length - 2] : null
}

export function getSource(): string {
  return dailyFile.source
}

export function priceFor(
  r: Pick<DailyReading, "k22" | "k24">,
  karat: Karat
): number {
  return karat === 22 ? r.k22 : r.k24
}
