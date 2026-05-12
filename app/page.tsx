"use client"

import { startTransition, useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = "fire-gold-portfolio"
const KARATS = [18, 20, 22, 24] as const
type Karat = (typeof KARATS)[number]

// ─── Types ────────────────────────────────────────────────────────────────────

type GoldPurchase = {
  id: string
  date: string
  grams: number
  pricePerGram: number
  karat: Karat
  note: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`
}

async function fetchGoldPriceInr(): Promise<{ pricePerGram: number; usdToInr: number }> {
  const response = await fetch("/api/gold-price")
  const data = (await response.json()) as
    | { pricePerGram: number; usdToInr: number }
    | { error: string }
  if (!response.ok || "error" in data) {
    throw new Error("error" in data ? data.error : `HTTP ${response.status}`)
  }
  return data
}

// price24kPerGram is the live 24k price from the API.
// Current value for each purchase is adjusted by karat purity (e.g. 22k = 22/24 of 24k price).
function calcPortfolioSummary(purchases: GoldPurchase[], price24kPerGram: number) {
  const totalGrams = purchases.reduce((s, p) => s + p.grams, 0)
  const totalPaid = purchases.reduce((s, p) => s + p.grams * p.pricePerGram, 0)
  const currentValue = purchases.reduce(
    (s, p) => s + p.grams * price24kPerGram * (p.karat / 24),
    0,
  )
  const avgPurchasePrice = totalGrams > 0 ? totalPaid / totalGrams : 0
  const profitLoss = currentValue - totalPaid
  const profitLossPct = totalPaid > 0 ? (profitLoss / totalPaid) * 100 : 0
  return { totalGrams, totalPaid, currentValue, avgPurchasePrice, profitLoss, profitLossPct }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Page() {
  const [isReady, setIsReady] = useState(false)
  const [purchases, setPurchases] = useState<GoldPurchase[]>([])

  const [pricePerGram, setPricePerGram] = useState<number | null>(null)
  const [usdToInr, setUsdToInr] = useState<number | null>(null)
  const [priceLastUpdated, setPriceLastUpdated] = useState<string | null>(null)
  const [priceError, setPriceError] = useState<string | null>(null)
  const [priceLoading, setPriceLoading] = useState(false)
  const [manualPrice, setManualPrice] = useState("")
  const [useManualPrice, setUseManualPrice] = useState(false)

  const [formDate, setFormDate] = useState(() => new Date().toISOString().split("T")[0])
  const [formGrams, setFormGrams] = useState("")
  const [formPrice, setFormPrice] = useState("")
  const [formKarat, setFormKarat] = useState<Karat>(22)
  const [formNote, setFormNote] = useState("")

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as { purchases?: GoldPurchase[] }
        if (Array.isArray(parsed.purchases)) {
          startTransition(() => setPurchases(parsed.purchases!))
        }
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY)
    }
    startTransition(() => setIsReady(true))
  }, [])

  // Persist to localStorage
  useEffect(() => {
    if (!isReady) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ purchases }))
  }, [purchases, isReady])

  // Fetch live gold price
  const loadGoldPrice = useCallback(async () => {
    setPriceLoading(true)
    setPriceError(null)
    try {
      const { pricePerGram: price, usdToInr: rate } = await fetchGoldPriceInr()
      setPricePerGram(price)
      setUsdToInr(rate)
      setPriceLastUpdated(new Date().toLocaleTimeString())
      setUseManualPrice(false)
    } catch (err) {
      setPriceError(err instanceof Error ? err.message : "Failed to fetch price")
      setUseManualPrice(true)
    } finally {
      setPriceLoading(false)
    }
  }, [])

  useEffect(() => {
    loadGoldPrice()
  }, [loadGoldPrice])

  const effectivePrice: number | null = useManualPrice
    ? Number(manualPrice) > 0
      ? Number(manualPrice)
      : null
    : pricePerGram

  const summary =
    effectivePrice !== null && purchases.length > 0
      ? calcPortfolioSummary(purchases, effectivePrice)
      : null

  const addPurchase = () => {
    const g = Number(formGrams)
    const p = Number(formPrice)
    if (!formDate || !Number.isFinite(g) || g <= 0 || !Number.isFinite(p) || p <= 0) return
    setPurchases((prev) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        date: formDate,
        grams: g,
        pricePerGram: p,
        karat: formKarat,
        note: formNote.trim(),
      },
      ...prev,
    ])
    setFormGrams("")
    setFormPrice("")
    setFormNote("")
  }

  const removePurchase = (id: string) =>
    setPurchases((prev) => prev.filter((p) => p.id !== id))

  return (
    <main className="min-h-svh bg-[radial-gradient(circle_at_top,_rgba(234,179,8,0.15),_transparent_40%),linear-gradient(180deg,_rgba(254,252,232,1)_0%,_rgba(255,255,255,1)_100%)] px-4 py-6 sm:px-6">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 text-sm">

        {/* Header + price + summary */}
        <section className="rounded-3xl border border-yellow-100/80 bg-white/90 p-5 shadow-[0_24px_70px_-40px_rgba(161,117,10,0.4)] backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-yellow-700/70">
                Fire
              </p>
              <h1 className="mt-0.5 text-xl font-semibold text-yellow-950 dark:text-yellow-100">
                Gold Portfolio
              </h1>
            </div>

            <div className="text-right">
              {effectivePrice !== null ? (
                <>
                  <div className="text-xs text-muted-foreground">
                    {useManualPrice ? "Manual price" : "Live price"}
                  </div>
                  <div className="font-semibold text-yellow-800 dark:text-yellow-300">
                    24k — {formatMoney(effectivePrice * 1000)}/kg
                  </div>
                  <div className="text-xs text-yellow-700/80 dark:text-yellow-400/80">
                    22k — {formatMoney(effectivePrice * (22 / 24) * 1000)}/kg
                  </div>
                  {priceLastUpdated && !useManualPrice && (
                    <div className="text-xs text-muted-foreground">
                      Updated {priceLastUpdated}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-xs text-muted-foreground">
                  {priceLoading ? "Fetching price…" : "Price unavailable"}
                </div>
              )}
            </div>
          </div>

          {/* API error banner */}
          {priceError && (
            <div className="mt-4 rounded-2xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              Could not fetch live price: {priceError}
            </div>
          )}

          {/* Manual price fallback */}
          {(priceError || useManualPrice) && (
            <div className="mt-3 flex gap-2">
              <Input
                type="number"
                inputMode="decimal"
                placeholder="Enter current price per gram (INR)"
                value={manualPrice}
                onChange={(e) => {
                  setManualPrice(e.target.value)
                  setUseManualPrice(true)
                }}
              />
              <Button variant="outline" onClick={loadGoldPrice} disabled={priceLoading}>
                {priceLoading ? "…" : "Retry API"}
              </Button>
            </div>
          )}

          {/* Refresh button when price is live */}
          {!priceError && !useManualPrice && (
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={loadGoldPrice}
                disabled={priceLoading}
              >
                {priceLoading ? "Refreshing…" : "Refresh price"}
              </Button>
            </div>
          )}

          {/* Summary cards */}
          {summary && (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <StatCard label="Total Grams" value={`${summary.totalGrams.toFixed(3)} g`} />
              <StatCard label="Current Value" value={formatMoney(summary.currentValue)} />
              <StatCard label="Total Paid" value={formatMoney(summary.totalPaid)} />
              <StatCard
                label="Avg Buy Price"
                value={`${formatMoney(summary.avgPurchasePrice)}/g`}
              />
              <StatCard
                label="Profit / Loss"
                value={formatMoney(summary.profitLoss)}
                highlight={summary.profitLoss >= 0 ? "profit" : "loss"}
              />
              <StatCard
                label="Return"
                value={formatPercent(summary.profitLossPct)}
                highlight={summary.profitLossPct >= 0 ? "profit" : "loss"}
              />
            </div>
          )}
        </section>

        {/* Add purchase form */}
        <section className="rounded-3xl border bg-card p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-medium">Add purchase</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Date</label>
              <Input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Grams</label>
              <Input
                type="number"
                inputMode="decimal"
                placeholder="e.g. 5"
                value={formGrams}
                onChange={(e) => setFormGrams(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Karat</label>
              <div className="flex gap-1">
                {KARATS.map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setFormKarat(k)}
                    className={cn(
                      "h-8 flex-1 rounded-lg border text-xs font-medium transition-colors",
                      formKarat === k
                        ? "border-yellow-500 bg-yellow-100 text-yellow-800 dark:border-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-300"
                        : "border-input bg-transparent text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {k}k
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Price / gram (INR)</label>
              <Input
                type="number"
                inputMode="decimal"
                placeholder="e.g. 8500"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1 col-span-2 sm:col-span-4">
              <label className="text-xs text-muted-foreground">Note (optional)</label>
              <Input
                placeholder="e.g. Local jeweller"
                value={formNote}
                onChange={(e) => setFormNote(e.target.value)}
              />
            </div>
          </div>
          <Button className="mt-3 w-full sm:w-auto" onClick={addPurchase}>
            Add purchase
          </Button>
        </section>

        {/* Purchases list */}
        <section className="rounded-3xl border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium">Purchases</h2>
            <span className="text-xs text-muted-foreground">{purchases.length} entries</span>
          </div>

          {purchases.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-4 text-xs text-muted-foreground">
              No purchases yet. Add your first gold purchase above.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {purchases.map((purchase) => {
                const cost = purchase.grams * purchase.pricePerGram
                const karat = purchase.karat ?? 22
                const currentVal =
                  effectivePrice !== null
                    ? purchase.grams * effectivePrice * (karat / 24)
                    : null
                const pl = currentVal !== null ? currentVal - cost : null
                const plPct = pl !== null && cost > 0 ? (pl / cost) * 100 : null

                return (
                  <div key={purchase.id} className="rounded-2xl border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 font-medium">
                          {purchase.grams.toFixed(3)} g
                          <span className="rounded-md bg-yellow-100 px-1.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300">
                            {purchase.karat ?? 22}k
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(purchase.date + "T00:00:00").toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                        {purchase.note && (
                          <div className="mt-0.5 truncate text-xs text-muted-foreground">
                            {purchase.note}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="destructive"
                        size="xs"
                        onClick={() => removePurchase(purchase.id)}
                      >
                        Remove
                      </Button>
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-4">
                      <div>
                        <span className="text-muted-foreground">Bought </span>
                        <span className="font-medium">
                          {formatMoney(purchase.pricePerGram)}/g
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Cost </span>
                        <span className="font-medium">{formatMoney(cost)}</span>
                      </div>
                      {currentVal !== null && (
                        <div>
                          <span className="text-muted-foreground">Value </span>
                          <span className="font-medium">{formatMoney(currentVal)}</span>
                        </div>
                      )}
                      {pl !== null && plPct !== null && (
                        <div>
                          <span className="text-muted-foreground">P/L </span>
                          <span
                            className={
                              pl >= 0
                                ? "font-medium text-emerald-600 dark:text-emerald-400"
                                : "font-medium text-destructive"
                            }
                          >
                            {formatMoney(pl)} ({formatPercent(plPct)})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: "profit" | "loss"
}) {
  return (
    <div className="rounded-2xl bg-yellow-50/80 p-3 dark:bg-yellow-900/10">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={cn("mt-1 font-semibold", {
          "text-emerald-600 dark:text-emerald-400": highlight === "profit",
          "text-destructive": highlight === "loss",
        })}
      >
        {value}
      </div>
    </div>
  )
}
