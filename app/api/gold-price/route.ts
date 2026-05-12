import { NextResponse } from "next/server"

const TROY_OZ_TO_GRAMS = 31.1034768

function normalizeGoldApiResponse(data: unknown): number | null {
  if (!data || typeof data !== "object") return null
  const d = data as Record<string, unknown>

  for (const field of ["price_gram_24k", "price_gram_24K", "price_gram", "gram_price"]) {
    const v = Number(d[field])
    if (Number.isFinite(v) && v > 0) return v
  }

  for (const field of ["price", "ask", "bid", "rate"]) {
    const v = Number(d[field])
    if (Number.isFinite(v) && v > 0) return v / TROY_OZ_TO_GRAMS
  }

  return null
}

export async function GET() {
  try {
    const [goldRes, fxRes] = await Promise.all([
      fetch("https://api.gold-api.com/price/XAU", { cache: "no-store" }),
      fetch("https://api.frankfurter.app/latest?from=USD&to=INR", { cache: "no-store" }),
    ])

    if (!goldRes.ok) {
      return NextResponse.json(
        { error: `Gold API error: HTTP ${goldRes.status}` },
        { status: 502 },
      )
    }
    if (!fxRes.ok) {
      return NextResponse.json(
        { error: `FX API error: HTTP ${fxRes.status}` },
        { status: 502 },
      )
    }

    const goldData: unknown = await goldRes.json()
    const fxData = (await fxRes.json()) as { rates?: { INR?: number } }

    const usdPerGram = normalizeGoldApiResponse(goldData)
    if (usdPerGram === null) {
      return NextResponse.json(
        { error: "Unrecognised gold API response format" },
        { status: 502 },
      )
    }

    const usdToInr = fxData?.rates?.INR
    if (!usdToInr || !Number.isFinite(usdToInr) || usdToInr <= 0) {
      return NextResponse.json({ error: "Could not parse INR rate" }, { status: 502 })
    }

    return NextResponse.json({
      pricePerGram: usdPerGram * usdToInr,
      usdToInr,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    )
  }
}
