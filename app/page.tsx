import {
  RateHistory,
  type GoldPanel,
  type HistoryRows,
  type SilverPanel,
} from "@/components/rate-history"
import {
  last5Days,
  monthlyAverages,
  yearlyAverages,
} from "@/lib/metals/aggregate"
import {
  getGoldDaily,
  getGoldSeedMonthly,
  getGoldSeedYearly,
  getGoldSource,
  getLatestGold,
  getPreviousGold,
  goldPrice,
  KARATS,
  type Karat,
} from "@/lib/metals/gold"
import {
  getLatestSilver,
  getPreviousSilver,
  getSilverDaily,
  getSilverSeedMonthly,
  getSilverSeedYearly,
  getSilverSource,
  roundSilver,
  silverPrice,
} from "@/lib/metals/silver"

// Inert with a static JSON import, but this is the switch to flip if the data ever moves
// off-repo.
export const revalidate = 3600

function goldPanel(): GoldPanel {
  const daily = getGoldDaily()
  const seedMonthly = getGoldSeedMonthly()
  const seedYearly = getGoldSeedYearly()
  const latest = getLatestGold()
  const previous = getPreviousGold()

  // Both karats are computed here so switching is instant and no history reaches the
  // client — only these rows cross the RSC boundary, never the full readings array.
  const rows = Object.fromEntries(
    KARATS.map((karat) => {
      const price = goldPrice(karat)
      return [
        karat,
        {
          days: last5Days(daily, price),
          months: monthlyAverages(daily, seedMonthly, price),
          years: yearlyAverages(daily, seedYearly, price),
        } satisfies HistoryRows,
      ]
    })
  ) as Record<Karat, HistoryRows>

  const pick = (r: typeof latest) =>
    r === null
      ? null
      : (Object.fromEntries(
          KARATS.map((karat) => [karat, goldPrice(karat)(r)])
        ) as Record<Karat, number>)

  return {
    rows,
    today: pick(latest),
    previous: pick(previous),
    date: latest?.date ?? null,
    source: getGoldSource(),
  }
}

function silverPanel(): SilverPanel {
  const daily = getSilverDaily()
  const latest = getLatestSilver()
  const previous = getPreviousSilver()

  // Silver keeps 2 dp: it is derived from a per-kg figure, and rounding to the rupee per
  // gram would quantise averages by ₹1,000/kg.
  const options = { round: roundSilver }

  return {
    rows: {
      days: last5Days(daily, silverPrice),
      months: monthlyAverages(
        daily,
        getSilverSeedMonthly(),
        silverPrice,
        options
      ),
      years: yearlyAverages(daily, getSilverSeedYearly(), silverPrice, options),
    },
    today: latest ? silverPrice(latest) : null,
    previous: previous ? silverPrice(previous) : null,
    date: latest?.date ?? null,
    source: getSilverSource(),
  }
}

export default function Page() {
  return (
    <main className="min-h-svh bg-background px-4 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto w-full max-w-md sm:max-w-lg">
        <RateHistory gold={goldPanel()} silver={silverPanel()} />
      </div>
    </main>
  )
}
