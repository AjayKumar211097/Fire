#!/usr/bin/env node
/**
 * Appends today's Hyderabad silver rate to data/silver-daily.json.
 *
 * Kalyan Jewellers — the gold source — publishes no silver at all, so this reads
 * GoodReturns instead. That page is fully server-rendered, so a plain fetch with a
 * browser User-Agent is enough. Unlike the gold job, it can backfill up to ten days from
 * the source's own table, so a week of failed runs self-heals. Run with --dry-run to
 * parse and validate without writing.
 */

import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { istDate } from "./lib/dates.mjs"
import { fetchPage } from "./lib/http.mjs"
import { readDataFile, upsert, writeIfChanged } from "./lib/json-file.mjs"

// Overridable so the failure path can be exercised without editing the script.
const RATE_URL =
  process.env.SILVER_RATE_URL ?? "https://www.goodreturns.in/silver-rates/hyderabad.html"
const DATA_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "data",
  "silver-daily.json",
)

const dryRun = process.argv.includes("--dry-run")

const MONTHS = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
}

/**
 * "Sep 17, 2026" -> "2026-09-17". Never `new Date(label)`: that is locale-dependent, and
 * a bare date parses as UTC midnight, landing a day early west of UTC.
 */
function toIso(label) {
  const m = label.match(/^([A-Z][a-z]{2}) (\d{1,2}), (\d{4})$/)
  const mm = m && MONTHS[m[1]]
  if (!mm) throw new Error(`unparseable date "${label}" — page structure changed`)
  return `${m[3]}-${String(mm).padStart(2, "0")}-${m[2].padStart(2, "0")}`
}

/** Indian digit grouping is plain commas, so stripping them is enough. */
const toNumber = (s) => Number(s.replace(/,/g, ""))

/** Per-kg is canonical: dividing preserves precision the 1 g card has already rounded off. */
const perGramFromKg = (kg) => Math.round((kg / 1000) * 100) / 100

const RUPEE = "&#x20b9;"

function parseRates(html) {
  // The markup separates every tag with newlines and tabs; flattening first is what makes
  // the patterns below readable and whitespace-proof.
  const flat = html.replace(/\s+/g, " ")

  // Both ids appear twice — once inside a <script> that rewrites the card client-side,
  // once as the real element. Requiring the rupee entity selects only the element.
  const card = (id) =>
    flat.match(new RegExp(`id="${id}"[^>]*> ?${RUPEE}([\\d,]+(?:\\.\\d+)?) ?<`))

  const kgCard = card("silver-1kg-price")
  const gCard = card("silver-1g-price")
  if (!kgCard || !gCard) {
    throw new Error(
      "silver price cards not found — page structure changed, or this is not a silver page",
    )
  }

  const perGram = perGramFromKg(toNumber(kgCard[1]))
  const oneGramCard = toNumber(gCard[1])

  // Select tables by header text, never by position, so an inserted table cannot silently
  // shift the parse onto the wrong data.
  const tables = [
    ...flat.matchAll(/<table class="gr-table table-conatiner">(.*?)<\/table>/g),
  ].map((m) => m[1])
  const dayTable = tables.find((t) => t.includes("<th>Date</th>"))
  if (!dayTable) throw new Error("10-day table not found — page structure changed")

  // Group 2 is the 1 Kg column; the <span class="non-span">(delta)</span> that follows it
  // is deliberately left uncaptured.
  const rowPattern = new RegExp(
    `<td> ?([A-Z][a-z]{2} \\d{1,2}, \\d{4}) ?</td> ?<td>[^<]*</td> ?<td>[^<]*</td> ?<td> ?${RUPEE}([\\d,]+)`,
    "g",
  )
  const history = [...dayTable.matchAll(rowPattern)].map((m) => ({
    date: toIso(m[1]),
    price: perGramFromKg(toNumber(m[2])),
  }))
  if (history.length === 0) throw new Error("10-day table had no parseable rows")

  return { perGram, oneGramCard, history }
}

/**
 * Silver needs its own thresholds throughout: gold's band (> 1000) would reject every
 * valid silver reading, and there is no karat pair to cross-check against.
 */
function validate(price, label, previous) {
  if (!Number.isFinite(price) || Math.round(price * 100) !== price * 100) {
    throw new Error(`${label}: ${price} is not a finite 2-decimal per-gram value`)
  }
  // Hyderabad silver has spanned roughly ₹60–₹400/g over a decade. This band never fires
  // on a real move but catches every unit error: a per-kg value (250000) and a per-10g
  // value (2500) both land outside it.
  if (price < 20 || price > 5000) {
    throw new Error(`${label}: ₹${price}/g is out of the plausible per-gram range`)
  }
  if (previous) {
    const drift = Math.abs(price / previous - 1)
    // Looser than gold's 10%: this guard catches parse errors, not market moves, and every
    // failure mode it must catch (×10, ×100, ×1000) is at least 900% off. A tight band
    // would instead create false failures that silently stall the series.
    if (drift > 0.15) {
      throw new Error(
        `${label}: moved ${(drift * 100).toFixed(1)}% vs ₹${previous}/g — refusing to write`,
      )
    }
  }
}

async function main() {
  const file = readDataFile(DATA_PATH)
  const previous = file.readings.at(-1)?.price ?? null

  const html = await fetchPage(RATE_URL)
  const { perGram, oneGramCard, history } = parseRates(html)

  // The page's own 1 g and 1 kg cards must agree. A real intra-source invariant that any
  // mis-parse breaks, standing in for gold's 24K/22K purity-ratio check.
  if (Math.abs(perGram - oneGramCard) > 0.5) {
    throw new Error(
      `per-kg card implies ₹${perGram}/g but the per-gram card says ₹${oneGramCard}/g — mis-parse`,
    )
  }

  validate(perGram, "today", previous)

  // Drift is checked between consecutive rows *within* the table: comparing an
  // out-of-order insert against "the last reading" would be meaningless.
  const ascending = [...history].sort((a, b) => a.date.localeCompare(b.date))
  for (let i = 0; i < ascending.length; i++) {
    validate(ascending[i].price, `table row ${ascending[i].date}`, ascending[i - 1]?.price ?? null)
  }

  const todayDate = istDate(0)
  let readings = file.readings

  // Backfill: unlike the gold source, this page publishes its own last ten days, so a run
  // that failed for a week fully recovers on the next success. Only genuine gaps are
  // filled — a recorded day is never rewritten, and today stays the single upsert path.
  const known = new Set(readings.map((r) => r.date))
  const gaps = ascending.filter(
    (r) => !known.has(r.date) && r.date !== todayDate && r.date <= todayDate,
  )

  for (const row of gaps) readings = upsert(readings, row.date, { price: row.price })
  if (gaps.length > 0) {
    const span = gaps.length > 1 ? `${gaps[0].date} … ${gaps.at(-1).date}` : gaps[0].date
    console.log(`backfilled ${gaps.length} day(s): ${span}`)
  }

  readings = upsert(readings, todayDate, { price: perGram })

  console.log(
    `${todayDate}: ₹${perGram}/g (₹${(perGram * 1000).toLocaleString("en-IN")}/kg)`,
  )

  if (dryRun) {
    console.log(`--dry-run: nothing written (${readings.length} readings would be stored)`)
    return
  }

  writeIfChanged(DATA_PATH, file, readings, ["price"])
}

main().catch((err) => {
  console.error(`update-silver-rate failed: ${err.message}`)
  // exitCode rather than exit(), so in-flight sockets unwind cleanly.
  process.exitCode = 1
})
