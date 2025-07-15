import type { Metadata } from "next";
import "@/app/globals.css";
import "./layout.css";

export const metadata: Metadata = {
  title: "Friend Party",
  description: "Discover your friends' inner adventurers",
};

import Link from 'next/link';
import HamburgerMenu from '@/components/HamburgerMenu'; // Import the new component

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="layout-body">
        <HamburgerMenu /> {/* Integrate the HamburgerMenu component */}
        <div className="layout-container">
          <div className="layout-content">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
