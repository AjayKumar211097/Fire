/** Vocabulary shared by every metal. Anything karat- or price-field-specific lives in
 * the per-metal modules (`gold.ts`, `silver.ts`) instead. */

export const METALS = ["gold", "silver"] as const
export type Metal = (typeof METALS)[number]

/** Where a period's value came from. Seeded values are researched approximations. */
export type PeriodBasis = "daily" | "seed"

export type PricePoint = {
  key: string // "2026-09-16" | "2026-09" | "2026"
  label: string // "Tue, 16 Sep" | "Sep 2026" | "2026"
  sublabel: string | null // "avg of 30 readings" | "estimated"
  value: number // INR per gram, for the selected metal and purity
  basis: PeriodBasis
  sampleCount: number // daily readings behind `value`; 0 when seeded
  changeAbs: number | null // vs the next-older period; null on the oldest row
  changePct: number | null
}

export type TabKey = "days" | "months" | "years"

/** The JSON envelopes are identical across metals, so only the row type varies. */
export type DailyFile<R> = {
  version: number
  source: string
  sourceUrl: string
  currency: string
  unit: string
  timezone: string
  note?: string
  updatedAt: string
  readings: R[]
}

export type SeedFile<M, Y> = {
  version: number
  note?: string
  monthly: M[]
  yearly: Y[]
}
