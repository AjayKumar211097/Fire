"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Entry = {
    name: string
    amount: number
}

export default function Page() {
    const [totalBudget, setTotalBudget] = useState<number>(1000)
    const [entries, setEntries] = useState<Entry[]>([])
    const [name, setName] = useState<string>("")
    const [amount, setAmount] = useState<string>("")

    const addEntry = () => {
        if (!name || !amount) return

        const newEntries: Entry[] = [
            ...entries,
            { name, amount: Number(amount) }
        ]

        setEntries(newEntries)
        setName("")
        setAmount("")
    }

    const removeEntry = (index: number) => {
        const newEntries = entries.filter((_, i) => i !== index)
        setEntries(newEntries)
    }

    const spent = entries.reduce((sum, e) => sum + e.amount, 0)
    const left = totalBudget - spent

    return (
        <div className="flex min-h-svh p-6">
            <div className="flex max-w-md w-full flex-col gap-6 text-sm">

                {/* Header */}
                <div>
                    <h1 className="text-lg font-medium">Budget Tracker</h1>
                    <p className="text-muted-foreground">
                        Add activities and track spending
                    </p>
                </div>

                {/* Total Budget */}
                <div>
                    <Input
                        type="number"
                        placeholder="Total Budget"
                        value={totalBudget}
                        onChange={(e) => setTotalBudget(Number(e.target.value))}
                    />
                </div>

                {/* Add Entry */}
                <div className="flex gap-2">
                    <Input
                        placeholder="Activity (e.g. Food)"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <Input
                        type="number"
                        placeholder="Amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                    <Button onClick={addEntry}>Add</Button>
                </div>

                {/* Activities List */}
                <div className="flex flex-col gap-2">
                    <h2 className="text-sm font-medium">Activities</h2>

                    {entries.length === 0 ? (
                        <div className="text-xs text-muted-foreground border rounded-md p-3">
                            No activities added yet
                        </div>
                    ) : (
                        entries.map((e, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between border rounded-md p-3"
                            >
                                <div className="flex flex-col">
                                    <span className="font-medium">{e.name}</span>
                                    <span className="text-xs text-muted-foreground">
                    {e.amount.toLocaleString()} ₹
                  </span>
                                </div>

                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => removeEntry(i)}
                                >
                                    Remove
                                </Button>
                            </div>
                        ))
                    )}
                </div>

                {/* Summary */}
                <div className="border rounded-md p-3 space-y-1">
                    <div>Total: {totalBudget.toLocaleString()} ₹</div>
                    <div>Spent: {spent.toLocaleString()} ₹</div>
                    <div>Left: {left.toLocaleString()} ₹</div>
                </div>

                {/* Footer */}
                <div className="font-mono text-xs text-muted-foreground">
                    (Press <kbd>d</kbd> to toggle dark mode)
                </div>

            </div>
        </div>
    )
}