/** Today in Asia/Kolkata as YYYY-MM-DD — never the runner's UTC date. */
export function istDate(offsetDays = 0) {
  const now = new Date(Date.now() + offsetDays * 86_400_000)
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(now)
}
