#!/usr/bin/env node
/**
 * Appends today's Hyderabad gold rate to data/gold-daily.json.
 *
 * The source page embeds its rates in Next.js's __NEXT_DATA__ payload, so a plain fetch
 * with a browser User-Agent is enough — no headless browser needed. Run with --dry-run to
 * parse and validate without writing.
 */

import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { istDate } from "./lib/dates.mjs"
import { fetchPage } from "./lib/http.mjs"
import { readDataFile, upsert, writeIfChanged } from "./lib/json-file.mjs"

// Overridable so the failure path can be exercised without editing the script.
const RATE_URL =
  process.env.GOLD_RATE_URL ?? "https://store.kalyanjewellers.net/gold-rate/Hyderabad/en"
const DATA_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "data",
  "gold-daily.json",
)

const dryRun = process.argv.includes("--dry-run")

function parseRates(html) {
  // Next escapes "<" as < inside the payload, so "</script>" cannot appear in it and
  // the non-greedy match is safe.
  const match = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
  )
  if (!match) throw new Error("__NEXT_DATA__ script tag not found — page structure changed")

  const payload = JSON.parse(match[1])
  const entries = payload?.props?.pageProps?.goldRate
  if (!Array.isArray(entries)) throw new Error("props.pageProps.goldRate is not an array")

  const merged = Object.assign({}, ...entries)
  const k24 = merged["karat_24(999)"] ?? merged["karat_24(995)"]
  const k22 = merged["karat_22"]
  if (!k24 || !k22) throw new Error("22K or 24K entry missing from goldRate")

  return {
    today: { k22: k22.price_per_gram, k24: k24.price_per_gram },
    yesterday: { k22: k22.yesterday, k24: k24.yesterday },
  }
}

function validate(rate, label, previous) {
  const { k22, k24 } = rate
  for (const [name, v] of Object.entries({ k22, k24 })) {
    if (!Number.isInteger(v) || v <= 1000 || v >= 100_000) {
      throw new Error(`${label}: ${name}=${v} is out of the plausible per-gram range`)
    }
  }
  if (k24 <= k22) throw new Error(`${label}: 24K (${k24}) must exceed 22K (${k22})`)

  const purityRatio = k24 / k22
  if (Math.abs(purityRatio - 24 / 22) > 0.15) {
    throw new Error(`${label}: 24K/22K ratio ${purityRatio.toFixed(3)} looks mislabelled`)
  }

  if (previous) {
    const drift = Math.abs(k24 / previous.k24 - 1)
    if (drift > 0.1) {
      throw new Error(
        `${label}: 24K moved ${(drift * 100).toFixed(1)}% vs the last reading (${previous.k24}) — refusing to write`,
      )
    }
  }
}

async function main() {
  const file = readDataFile(DATA_PATH)
  const previous = file.readings.at(-1) ?? null

  const html = await fetchPage(RATE_URL)
  const { today, yesterday } = parseRates(html)

  validate(today, "today", previous)

  const todayDate = istDate(0)
  const yesterdayDate = istDate(-1)

  let readings = file.readings

  // Gap-heal: if a run was skipped or failed, the payload's own `yesterday` figures let
  // us backfill that day for free.
  const hasYesterday = readings.some((r) => r.date === yesterdayDate)
  if (!hasYesterday && yesterdayDate !== todayDate) {
    try {
      validate(yesterday, "yesterday", previous)
      readings = upsert(readings, yesterdayDate, yesterday)
      console.log(`gap-healed ${yesterdayDate}: 22K ₹${yesterday.k22} · 24K ₹${yesterday.k24}`)
    } catch (err) {
      console.warn(`skipping gap-heal for ${yesterdayDate}: ${err.message}`)
    }
  }

  readings = upsert(readings, todayDate, today)

  console.log(`${todayDate}: 22K ₹${today.k22}/g · 24K ₹${today.k24}/g`)

  if (dryRun) {
    console.log("--dry-run: nothing written")
    return
  }

  writeIfChanged(DATA_PATH, file, readings, ["k22", "k24"])
}

main().catch((err) => {
  console.error(`update-gold-rate failed: ${err.message}`)
  // exitCode rather than exit(), so in-flight sockets unwind cleanly.
  process.exitCode = 1
})
