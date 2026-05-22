import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans, Newsreader, IBM_Plex_Mono } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600", "700"],
});

const serif = Newsreader({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  weight: ["400", "500", "600"],
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "MedCore — Research Builder",
  description:
    "A reporting-guideline-driven medical manuscript workspace with PubMed, Crossref, and OpenAlex verification.",
  applicationName: "MedCore Research Builder",
  authors: [{ name: "MedCore" }],
  keywords: [
    "medical research",
    "manuscript",
    "EQUATOR",
    "CONSORT",
    "PRISMA",
    "STROBE",
    "PubMed",
    "Crossref",
  ],
  openGraph: {
    title: "MedCore — Research Builder",
    description:
      "Reporting-guideline-driven medical manuscript builder with PubMed, Crossref, and OpenAlex verification.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0E6BA8",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${display.variable} ${serif.variable} ${mono.variable}`}
    >
      <body className="antialiased">{children}</body>
    </html>
  );
}
