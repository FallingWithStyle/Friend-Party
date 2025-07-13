import type { Metadata } from "next";
import "@/app/main.css";
import Auth from "@/components/Auth";
import Header from "@/components/Header";

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
      <body className="bg-background text-foreground font-body">
        <Header />
        <main className="container mx-auto p-4">
          <Auth />
          {children}
        </main>
      </body>
    </html>
  );
}
