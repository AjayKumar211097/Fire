export const KARATS = [22, 24] as const
export type Karat = (typeof KARATS)[number]

/** A measured rate for one IST calendar day. Values are whole INR per gram. */
export type DailyReading = {
  date: string // YYYY-MM-DD
  k22: number
  k24: number
}

export type SeedMonth = {
  month: string // YYYY-MM
  k22: number
  k24: number
  source?: string
}

export type SeedYear = {
  year: number
  k22: number
  k24: number
  source?: string
}

export type GoldDailyFile = {
  version: number
  source: string
  sourceUrl: string
  currency: string
  unit: string
  timezone: string
  updatedAt: string
  readings: DailyReading[]
}

export type GoldSeedFile = {
  version: number
  note?: string
  monthly: SeedMonth[]
  yearly: SeedYear[]
}

/** Where a period's value came from. Seeded values are researched approximations. */
export type PeriodBasis = "daily" | "seed"

export type PricePoint = {
  key: string // "2026-09-16" | "2026-09" | "2026"
  label: string // "Tue, 16 Sep" | "Sep 2026" | "2026"
  sublabel: string | null // "avg of 30 readings" | "estimated"
  value: number // whole INR per gram, for the selected karat
  basis: PeriodBasis
  sampleCount: number // daily readings behind `value`; 0 when seeded
  changeAbs: number | null // vs the next-older period; null on the oldest row
  changePct: number | null
}

export type TabKey = "days" | "months" | "years"
