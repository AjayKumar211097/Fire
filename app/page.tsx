"use client"

import { startTransition, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Entry = {
  name: string
  amount: number
}

const STORAGE_KEY = "fire-budget-tracker"

export default function Page() {
  const [isReady, setIsReady] = useState(false)
  const [totalBudget, setTotalBudget] = useState<number>(1000)
  const [entries, setEntries] = useState<Entry[]>([])
  const [name, setName] = useState<string>("")
  const [amount, setAmount] = useState<string>("")

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (!saved) {
      startTransition(() => {
        setIsReady(true)
      })
      return
    }

    try {
      const parsed = JSON.parse(saved) as {
        totalBudget?: number
        entries?: Entry[]
      }

      if (typeof parsed.totalBudget === "number") {
        const budget = parsed.totalBudget
        startTransition(() => {
          setTotalBudget(budget)
        })
      }

      if (Array.isArray(parsed.entries)) {
        const savedEntries = parsed.entries
        startTransition(() => {
          setEntries(savedEntries)
        })
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY)
    }

    startTransition(() => {
      setIsReady(true)
    })
  }, [])

  useEffect(() => {
    if (!isReady) {
      return
    }

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ totalBudget, entries }),
    )
  }, [entries, isReady, totalBudget])

  const addEntry = () => {
    const numericAmount = Number(amount)
    if (!name.trim() || Number.isNaN(numericAmount) || numericAmount <= 0) {
      return
    }

    const newEntries: Entry[] = [...entries, { name: name.trim(), amount: numericAmount }]
    setEntries(newEntries)
    setName("")
    setAmount("")
  }

  const removeEntry = (index: number) => {
    const newEntries = entries.filter((_, i) => i !== index)
    setEntries(newEntries)
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value)

  const spent = entries.reduce((sum, entry) => sum + entry.amount, 0)
  const left = totalBudget - spent

  return (
    <main className="min-h-svh bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.18),_transparent_40%),linear-gradient(180deg,_rgba(244,251,249,1)_0%,_rgba(255,255,255,1)_100%)] px-4 py-6 sm:px-6">
      <div className="mx-auto flex w-full max-w-md flex-col gap-5 text-sm">
        <section className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-[0_24px_70px_-40px_rgba(15,118,110,0.65)] backdrop-blur">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-primary/70">
                Fire Budget
              </p>

            </div> 
          </div>



          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-primary/8 p-3">
              <div className="text-xs text-muted-foreground">Budget</div>
              <div className="mt-1 font-semibold">{formatCurrency(totalBudget)}</div>
            </div>
            <div className="rounded-2xl bg-primary/8 p-3">
              <div className="text-xs text-muted-foreground">Spent</div>
              <div className="mt-1 font-semibold">{formatCurrency(spent)}</div>
            </div>
            <div className="rounded-2xl bg-primary/8 p-3">
              <div className="text-xs text-muted-foreground">Left</div>
              <div className="mt-1 font-semibold">{formatCurrency(left)}</div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border bg-card p-4 shadow-sm">
          <label className="mb-2 block text-sm font-medium">Total budget</label>
          <Input
            type="number"
            inputMode="numeric"
            placeholder="Total Budget"
            value={totalBudget}
            onChange={(event) => setTotalBudget(Number(event.target.value) || 0)}
          />
        </section>

        <section className="rounded-3xl border bg-card p-4 shadow-sm">
          <h2 className="text-sm font-medium">Add activity</h2>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <Input
              placeholder="Activity (Food, Travel, Bills)"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <Input
              type="number"
              inputMode="numeric"
              placeholder="Amount"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
            <Button onClick={addEntry}>Add</Button>
          </div>
        </section>

        <section className="rounded-3xl border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium">Activities</h2>
            <span className="text-xs text-muted-foreground">{entries.length} items</span>
          </div>

          {entries.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-4 text-xs text-muted-foreground">
              No activities added yet.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {entries.map((entry, index) => (
                <div
                  key={`${entry.name}-${index}`}
                  className="flex items-center justify-between rounded-2xl border p-3"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{entry.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatCurrency(entry.amount)}
                    </div>
                  </div>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeEntry(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
