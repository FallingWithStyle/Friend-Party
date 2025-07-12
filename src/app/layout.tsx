import type { Metadata } from "next";
import "./globals.css";
import Auth from "@/components/Auth";

export const metadata: Metadata = {
  title: "Friend Party",
  description: "Discover your friends' inner adventurers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Auth />
        {children}
      </body>
    </html>
  );
}
