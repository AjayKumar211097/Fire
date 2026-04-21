import type { Metadata, Viewport } from "next"
import { Geist_Mono, Figtree } from "next/font/google"

import "./globals.css"
import { PwaProvider } from "@/components/pwa-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

const figtree = Figtree({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "Fire Budget Tracker",
  description: "Track budgets and spending with an installable mobile-friendly app.",
  applicationName: "Fire Budget Tracker",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Fire Budget",
  },
  icons: {
    apple: "/apple-icon",
  },
}

export const viewport: Viewport = {
  themeColor: "#0f766e",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", figtree.variable)}
    >
      <body>
        <ThemeProvider>
          <PwaProvider />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
