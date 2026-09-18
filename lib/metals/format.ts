const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
})

export function formatInr(value: number): string {
  return inr.format(value)
}

// Silver is stored per gram but derived from a per-kg figure, so it can be fractional.
// `inr` would round 252.5 to "₹253/g" beside a headline of ₹2,52,500/kg — visibly
// inconsistent arithmetic on one line. A zero minimum keeps gold's integers unchanged.
const inrPrecise = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

export function formatInrPerGram(value: number): string {
  return `${inrPrecise.format(value)}/g`
}

// Rates are stored per gram for every metal, the unit the sources publish. The display
// unit is applied exactly once, here — never multiply before the formatter, or
// percentages and averages drift.
export type DisplayUnit = { grams: number; label: string }

/** Gold is quoted and bought per 10 g here. */
export const PER_10_G: DisplayUnit = { grams: 10, label: "per 10 g" }

/** Silver is quoted per kilogram. */
export const PER_KG: DisplayUnit = { grams: 1000, label: "per 1 kg" }

/** Takes a per-gram value, renders the price in `unit`. */
export function formatInrPerUnit(perGram: number, unit: DisplayUnit): string {
  return inr.format(perGram * unit.grams)
}

export function formatSignedInr(value: number): string {
  return `${value >= 0 ? "+" : "−"}${inr.format(Math.abs(value))}`
}

/** Takes a per-gram delta, renders the signed change in `unit`. */
export function formatSignedInrPerUnit(
  perGramDelta: number,
  unit: DisplayUnit
): string {
  return formatSignedInr(perGramDelta * unit.grams)
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : "−"}${Math.abs(value).toFixed(2)}%`
}

// Labels are derived from the date string's own parts. Constructing a Date from a bare
// ISO date parses as UTC midnight, which renders as the previous day west of UTC — so we
// only ever use Date.UTC, and only to get the weekday.

/** "2026-09-16" -> "Tue, 16 Sep" */
export function formatDayLabel(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number)
  const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]
  return `${weekday}, ${d} ${MONTHS[m - 1]}`
}

/** "2026-09-16" -> "16 Sep 2026" */
export function formatFullDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number)
  return `${d} ${MONTHS[m - 1]} ${y}`
}

/** "2026-09" -> "Sep 2026" */
export function formatMonthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number)
  return `${MONTHS[m - 1]} ${y}`
}

/** "2026" -> "2026" */
export function formatYearLabel(key: string): string {
  return key
}

/** Today's date in Asia/Kolkata as YYYY-MM-DD. en-CA conveniently formats as ISO. */
export function istToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(
    now
  )
}
