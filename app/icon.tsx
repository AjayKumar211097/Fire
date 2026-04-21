import { ImageResponse } from "next/og"

export const size = {
  width: 512,
  height: 512,
}

export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(160deg, rgb(15, 118, 110) 0%, rgb(20, 184, 166) 50%, rgb(240, 253, 250) 100%)",
          color: "white",
          fontSize: 180,
          fontWeight: 700,
          letterSpacing: -8,
        }}
      >
        FB
      </div>
    ),
    size,
  )
}
