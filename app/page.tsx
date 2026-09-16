import { GoldHistory, type HistoryRows } from "@/components/gold-history"
import {
  last5Days,
  monthlyAverages,
  yearlyAverages,
} from "@/lib/gold/aggregate"
import {
  getDaily,
  getLatestReading,
  getPreviousReading,
  getSeedMonthly,
  getSeedYearly,
  getSource,
} from "@/lib/gold/data"
import { KARATS, type Karat } from "@/lib/gold/types"

// Inert with a static JSON import, but this is the switch to flip if the data ever moves
// off-repo.
export const revalidate = 3600

export default function Page() {
  const daily = getDaily()
  const seedMonthly = getSeedMonthly()
  const seedYearly = getSeedYearly()

  // Both karats are computed here so switching is instant and no history reaches the
  // client — only these rows cross the RSC boundary, never the full readings array.
  const rows = Object.fromEntries(
    KARATS.map((karat) => [
      karat,
      {
        days: last5Days(daily, karat),
        months: monthlyAverages(daily, seedMonthly, karat),
        years: yearlyAverages(daily, seedYearly, karat),
      } satisfies HistoryRows,
    ])
  ) as Record<Karat, HistoryRows>

  return (
    <main className="min-h-svh bg-background px-4 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto w-full max-w-md sm:max-w-lg">
        <GoldHistory
          rows={rows}
          today={getLatestReading()}
          previous={getPreviousReading()}
          source={getSource()}
        />
      </div>
    </main>
  )
}
