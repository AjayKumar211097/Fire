"use client"

import { useEffect, useState } from "react"
import { SegmentedControl } from "@/components/segmented-control"
import {
  formatFullDate,
  formatInrPerGram,
  formatInrPerUnit,
  formatPercent,
  formatSignedInrPerUnit,
  PER_10_G,
  PER_KG,
} from "@/lib/metals/format"
import type { Karat } from "@/lib/metals/gold"
import type { Metal, PricePoint, TabKey } from "@/lib/metals/types"
import { cn } from "@/lib/utils"

export type HistoryRows = Record<TabKey, PricePoint[]>

/** Prices are per gram; the display unit is applied in the formatter, never before. */
export type GoldPanel = {
  rows: Record<Karat, HistoryRows>
  today: Record<Karat, number> | null
  previous: Record<Karat, number> | null
  date: string | null
  source: string
}

export type SilverPanel = {
  rows: HistoryRows
  today: number | null
  previous: number | null
  date: string | null
  source: string
}

const METAL_OPTIONS = [
  { value: "gold" as Metal, label: "Gold" },
  { value: "silver" as Metal, label: "Silver" },
] as const

const KARAT_OPTIONS = [
  { value: 22 as Karat, label: "22K" },
  { value: 24 as Karat, label: "24K" },
] as const

const TAB_OPTIONS = [
  { value: "days" as TabKey, label: "5 Days" },
  { value: "months" as TabKey, label: "5 Months" },
  { value: "years" as TabKey, label: "5 Years" },
] as const

export function RateHistory({
  gold,
  silver,
}: {
  gold: GoldPanel
  silver: SilverPanel
}) {
  const [metal, setMetal] = useState<Metal>("gold")
  const [karat, setKarat] = useState<Karat>(24)
  const [tab, setTab] = useState<TabKey>("days")

  // The portfolio feature this app used to have is gone; clear its leftover key so it
  // doesn't linger forever in the installed PWA's storage.
  useEffect(() => {
    try {
      window.localStorage.removeItem("fire-gold-portfolio")
    } catch {
      // Private mode or blocked storage — nothing to clean up.
    }
  }, [])

  const isGold = metal === "gold"
  const unit = isGold ? PER_10_G : PER_KG

  const price = isGold ? (gold.today?.[karat] ?? null) : silver.today
  const prevPrice = isGold ? (gold.previous?.[karat] ?? null) : silver.previous
  const date = isGold ? gold.date : silver.date
  const source = isGold ? gold.source : silver.source
  const visible = isGold ? gold.rows[karat][tab] : silver.rows[tab]

  const delta = price !== null && prevPrice !== null ? price - prevPrice : null
  const deltaPct =
    delta !== null && prevPrice ? (delta / prevPrice) * 100 : null

  // "24K · per 10 g" for gold, just "per 1 kg" for silver, which has no purity axis.
  const caption = [isGold ? `${karat}K` : null, unit.label]
    .filter(Boolean)
    .join(" · ")

  return (
    <div className="flex flex-col gap-4">
      <SegmentedControl
        options={METAL_OPTIONS}
        value={metal}
        onChange={setMetal}
        ariaLabel="Metal"
      />

      <header className="rounded-2xl border bg-card p-5 text-card-foreground shadow-sm">
        <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
          {isGold ? "Gold" : "Silver"} Rate · Hyderabad
        </p>

        {price === null ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No rate recorded yet.
          </p>
        ) : (
          <>
            <p className="mt-1.5 font-mono text-3xl font-semibold tracking-tight tabular-nums">
              {formatInrPerUnit(price, unit)}
            </p>

            {/* Silver moves in ₹5,000/kg steps, so most days genuinely don't move.
                Rendering that as a green "+₹0 (+0.00%)" reads as a rise when nothing
                happened. Gold's occasional flat days get the same treatment. */}
            {delta !== null &&
              deltaPct !== null &&
              (delta === 0 ? (
                <p className="mt-1 font-mono text-sm text-muted-foreground tabular-nums">
                  No change today
                </p>
              ) : (
                <p
                  className={cn(
                    "mt-1 font-mono text-sm tabular-nums",
                    delta > 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-destructive"
                  )}
                >
                  {formatSignedInrPerUnit(delta, unit)} (
                  {formatPercent(deltaPct)}) today
                </p>
              ))}

            <p className="mt-2.5 text-xs text-muted-foreground">
              {caption} ·{" "}
              <span className="tabular-nums">{formatInrPerGram(price)}</span>
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {source} · {date && formatFullDate(date)}
            </p>
          </>
        )}
      </header>

      {/* Silver has no karat axis — the source publishes a single purity. */}
      {isGold && (
        <SegmentedControl
          options={KARAT_OPTIONS}
          value={karat}
          onChange={setKarat}
          ariaLabel="Gold purity"
          size="sm"
        />
      )}

      <SegmentedControl
        options={TAB_OPTIONS}
        value={tab}
        onChange={setTab}
        ariaLabel="Time period"
      />

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          No readings yet — the daily job publishes the first rate tomorrow
          morning.
        </p>
      ) : (
        <>
          <p className="-mb-2 px-1 text-right text-xs text-muted-foreground">
            {caption}
          </p>
          <ul
            role="tabpanel"
            aria-label={TAB_OPTIONS.find((t) => t.value === tab)?.label}
            className="divide-y overflow-hidden rounded-2xl border bg-card"
          >
            {visible.map((row) => (
              <li
                key={row.key}
                className="flex items-center justify-between gap-3 px-3.5 py-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">
                    {row.label}
                  </div>
                  {row.sublabel && (
                    <div className="truncate text-xs text-muted-foreground">
                      {row.basis === "seed" ? (
                        <span className="rounded bg-muted px-1.5 py-0.5">
                          est.
                        </span>
                      ) : (
                        row.sublabel
                      )}
                    </div>
                  )}
                </div>

                <div className="shrink-0 text-right">
                  <div className="font-mono text-sm font-semibold tabular-nums">
                    {formatInrPerUnit(row.value, unit)}
                  </div>
                  {row.changeAbs !== null &&
                    row.changePct !== null &&
                    (row.changeAbs === 0 ? (
                      <div className="font-mono text-xs text-muted-foreground">
                        no change
                      </div>
                    ) : (
                      <div
                        className={cn(
                          "font-mono text-xs tabular-nums",
                          row.changeAbs > 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-destructive"
                        )}
                      >
                        {formatSignedInrPerUnit(row.changeAbs, unit)}{" "}
                        {formatPercent(row.changePct)}
                      </div>
                    ))}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="px-1 text-xs leading-relaxed text-muted-foreground">
        Metal rate only — excludes making charges, GST and hallmarking.
      </p>
    </div>
  )
}
