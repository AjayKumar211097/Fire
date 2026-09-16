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

export function formatInrPerGram(value: number): string {
  return `${inr.format(value)}/g`
}

export function formatSignedInr(value: number): string {
  return `${value >= 0 ? "+" : "−"}${inr.format(Math.abs(value))}`
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
