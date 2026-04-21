import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fire Budget Tracker",
    short_name: "Fire Budget",
    description: "Installable budget tracker for quick spending updates on your phone.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f4fbf9",
    theme_color: "#0f766e",
    orientation: "portrait",
    icons: [
      {
        src: "/icon?size=192",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon?size=512",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon?size=512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
