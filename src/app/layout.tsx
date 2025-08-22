import type { Metadata } from "next";
import { Cinzel, Cinzel_Decorative } from "next/font/google";
import "@/app/globals.css";
import "./layout.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-cinzel",
});

const cinzelDecorative = Cinzel_Decorative({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-cinzel-decorative",
  weight: ["400", "700", "900"],
});

export const metadata: Metadata = {
  title: "Friend Party",
  description: "Discover your friends' inner adventurers",
};

import HamburgerMenu from '@/components/HamburgerMenu'; // Import the new component
import { DebugToolbar } from '@/components/DebugToolbar'; // Import DebugToolbar

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cinzel.variable} ${cinzelDecorative.variable} antialiased`}>
      <body className="layout-body font-serif">
        <HamburgerMenu /> {/* Integrate the HamburgerMenu component */}
        <div className="layout-container">
          <div className="layout-content">
            {children}
          </div>
        </div>
        <DebugToolbar /> {/* Add DebugToolbar here */}
      </body>
    </html>
  );
}
