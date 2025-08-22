import type React from "react"
import type { Metadata } from "next"
import { Cinzel, Cinzel_Decorative } from "next/font/google"
import "./globals.css"

const cinzel = Cinzel({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-cinzel",
})

const cinzelDecorative = Cinzel_Decorative({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-cinzel-decorative",
  weight: ["400", "700", "900"],
})

export const metadata: Metadata = {
  title: "Friend Party - D&D Adventure",
  description: "Embark on a magical quiz adventure with friends",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${cinzel.variable} ${cinzelDecorative.variable} antialiased`}>
      <body className="font-serif">{children}</body>
    </html>
  )
}
