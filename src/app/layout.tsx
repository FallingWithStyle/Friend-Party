import type { Metadata } from "next";
import "@/app/globals.css";

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
      <body className="bg-parchment font-body text-text-primary p-8 md:p-16">
        <div className="max-w-5xl mx-auto p-1.5 bg-border-primary">
          <div className="bg-bg-primary p-8 md:p-12">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
