import type { Metadata } from "next";
import Link from "next/link";
import { About } from "@/components/About";
import { LogoWordmark } from "@/components/ui/Logo";

export const metadata: Metadata = {
  title: "About — MedCore Research Platform",
  description:
    "MedCore's mission, vision, principles, and a letter from the founder. A guideline-driven, integrity-first medical research workspace.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--mc-canvas)]">
      <header className="sticky top-0 z-20 bg-white/85 backdrop-blur-md border-b border-med-line">
        <div className="max-w-[920px] mx-auto px-5 py-3 flex items-center justify-between">
          <Link href="/">
            <LogoWordmark />
          </Link>
          <Link href="/" className="btn-primary text-sm">
            Open the workspace →
          </Link>
        </div>
      </header>
      <main className="max-w-[920px] mx-auto px-5 py-8">
        <About />
        <footer className="mt-10 text-center text-[12px] text-med-sub">
          <Link href="/" className="text-med-brand hover:underline">Home</Link>
          <span className="mx-2" aria-hidden>·</span>
          <Link href="/auth" className="text-med-brand hover:underline">Sign in</Link>
          <span className="mx-2" aria-hidden>·</span>
          <span>MedCore Research Platform · v3</span>
        </footer>
      </main>
    </div>
  );
}
