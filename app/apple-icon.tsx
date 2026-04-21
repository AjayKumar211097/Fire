import { ImageResponse } from "next/og"

export const size = {
  width: 180,
  height: 180,
}

export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 36,
          background:
            "linear-gradient(160deg, rgb(15, 118, 110) 0%, rgb(20, 184, 166) 55%, rgb(204, 251, 241) 100%)",
          color: "white",
          fontSize: 76,
          fontWeight: 700,
          letterSpacing: -4,
        }}
      >
        FB
      </div>
    ),
    size,
  )
}
