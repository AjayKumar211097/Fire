"use client"

import { useRef } from "react"
import { cn } from "@/lib/utils"

export type SegmentedOption<T extends string | number> = {
  value: T
  label: string
}

/**
 * A 1-of-N segmented control. Used for both the period tabs and the karat selector, so
 * the two controls sitting next to each other share one visual language.
 */
export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  ariaLabel,
  size = "default",
  className,
}: {
  options: readonly SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel: string
  size?: "default" | "sm"
  className?: string
}) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([])

  const move = (from: number, delta: number) => {
    const next = (from + delta + options.length) % options.length
    onChange(options[next].value)
    buttons.current[next]?.focus()
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn("grid gap-1 rounded-xl bg-muted p-1", className)}
      // Column count is dynamic, so it can't be a Tailwind class (JIT never sees it).
      style={{
        gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
      }}
    >
      {options.map((option, i) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            ref={(el) => {
              buttons.current[i] = el
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") {
                e.preventDefault()
                move(i, 1)
              } else if (e.key === "ArrowLeft") {
                e.preventDefault()
                move(i, -1)
              }
            }}
            className={cn(
              "rounded-lg text-xs font-medium transition-colors",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              size === "sm" ? "h-9" : "h-10",
              selected
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
