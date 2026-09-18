/**
 * Shared read/write plumbing for the per-metal daily data files. The files have identical
 * envelopes and differ only in which price fields a reading carries, so `fields` is the
 * one thing each caller supplies.
 */

import { readFileSync, writeFileSync } from "node:fs"

/**
 * JSON.stringify(_, 2) spreads each reading over several lines, which after a few years
 * makes the file thousands of lines long and every daily diff noisy. Readings are one
 * line each instead.
 */
export function serializeCompact(file, fields) {
  const { readings, ...head } = file
  const headJson = JSON.stringify(head, null, 2).slice(0, -2).trimEnd()
  const rows = readings.map(
    (r) =>
      `    { "date": ${JSON.stringify(r.date)}, ` +
      fields.map((f) => `"${f}": ${r[f]}`).join(", ") +
      " }"
  )
  return `${headJson},\n  "readings": [\n${rows.join(",\n")}\n  ]\n}\n`
}

/** Idempotent by date: re-running on a day already recorded replaces that row in place. */
export function upsert(readings, date, values) {
  const next = readings.filter((r) => r.date !== date)
  next.push({ date, ...values })
  next.sort((a, b) => a.date.localeCompare(b.date))
  return next
}

export function readDataFile(path) {
  return JSON.parse(readFileSync(path, "utf8"))
}

/**
 * Only touches updatedAt when a reading actually changed, so re-running a job on the same
 * day is a genuine no-op and the workflow's "commit if changed" guard means something.
 * Returns whether anything was written.
 */
export function writeIfChanged(path, file, readings, fields) {
  if (JSON.stringify(readings) === JSON.stringify(file.readings)) {
    console.log("no reading changed — file left untouched")
    return false
  }
  writeFileSync(
    path,
    serializeCompact({ ...file, updatedAt: new Date().toISOString(), readings }, fields)
  )
  console.log(`wrote ${path} (${readings.length} readings)`)
  return true
}
