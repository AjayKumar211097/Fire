"use client"

import { useEffect, useState } from "react"
import { SegmentedControl } from "@/components/segmented-control"
import {
  formatFullDate,
  formatInrPer10g,
  formatInrPerGram,
  formatPercent,
  formatSignedInrPer10g,
} from "@/lib/gold/format"
import type { Karat, PricePoint, TabKey } from "@/lib/gold/types"
import { cn } from "@/lib/utils"

export type HistoryRows = Record<TabKey, PricePoint[]>

const KARAT_OPTIONS = [
  { value: 22 as Karat, label: "22K" },
  { value: 24 as Karat, label: "24K" },
] as const

const TAB_OPTIONS = [
  { value: "days" as TabKey, label: "5 Days" },
  { value: "months" as TabKey, label: "5 Months" },
  { value: "years" as TabKey, label: "5 Years" },
] as const

export function GoldHistory({
  rows,
  today,
  previous,
  source,
}: {
  rows: Record<Karat, HistoryRows>
  today: { k22: number; k24: number; date: string } | null
  previous: { k22: number; k24: number } | null
  source: string
}) {
  const [karat, setKarat] = useState<Karat>(22)
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

  const price = today ? (karat === 22 ? today.k22 : today.k24) : null
  const prevPrice = previous
    ? karat === 22
      ? previous.k22
      : previous.k24
    : null
  const delta = price !== null && prevPrice !== null ? price - prevPrice : null
  const deltaPct =
    delta !== null && prevPrice ? (delta / prevPrice) * 100 : null

  const visible = rows[karat][tab]

  return (
    <div className="flex flex-col gap-4">
      <header className="rounded-2xl border bg-card p-5 text-card-foreground shadow-sm">
        <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
          Gold Rate · Hyderabad
        </p>

        {price === null ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No rate recorded yet.
          </p>
        ) : (
          <>
            <p className="mt-1.5 font-mono text-3xl font-semibold tracking-tight tabular-nums">
              {formatInrPer10g(price)}
            </p>

            {delta !== null && deltaPct !== null && (
              <p
                className={cn(
                  "mt-1 font-mono text-sm tabular-nums",
                  delta >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-destructive"
                )}
              >
                {formatSignedInrPer10g(delta)} ({formatPercent(deltaPct)}) today
              </p>
            )}

            <p className="mt-2.5 text-xs text-muted-foreground">
              {karat}K · per 10 g ·{" "}
              <span className="tabular-nums">{formatInrPerGram(price)}</span>
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {source} · {today && formatFullDate(today.date)}
            </p>
          </>
        )}
      </header>

      <SegmentedControl
        options={KARAT_OPTIONS}
        value={karat}
        onChange={setKarat}
        ariaLabel="Gold purity"
        size="sm"
      />

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
            {karat}K · per 10 g
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
                    {formatInrPer10g(row.value)}
                  </div>
                  {row.changeAbs !== null && row.changePct !== null && (
                    <div
                      className={cn(
                        "font-mono text-xs tabular-nums",
                        row.changeAbs >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-destructive"
                      )}
                    >
                      {formatSignedInrPer10g(row.changeAbs)}{" "}
                      {formatPercent(row.changePct)}
                    </div>
                  )}
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
