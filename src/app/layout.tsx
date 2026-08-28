import type { Metadata, Viewport } from "next";
import { Figtree, Fraunces } from "next/font/google";
import { Header } from "@/components/Header";
import { Nav } from "@/components/Nav";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ovenboard — Cassandra's bakery",
  description: "Orders, schedule, and customers for Cassandra's bakery.",
};

export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#b8460e",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${fraunces.variable} ${figtree.variable}`}>
        <div className="shell">
          <Header />
          {children}
        </div>
        <Nav />
      </body>
    </html>
  );
}
