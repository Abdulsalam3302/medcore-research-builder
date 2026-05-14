import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MedCore Research Builder",
  description:
    "Reporting-guideline-driven medical manuscript builder with PubMed, Crossref, and OpenAlex verification.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
