import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAppUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { LogoWordmark } from "@/components/ui/Logo";
import { ObservabilityDashboard } from "@/components/admin/ObservabilityDashboard";

export const metadata: Metadata = {
  title: "Observability — MedCore Admin",
  description: "Admin observability dashboard for visits, usage, abuse signals, and alerts.",
  robots: { index: false, follow: false },
};

export default async function AdminObservabilityPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen bg-[var(--mc-canvas)] flex items-center justify-center p-6">
        <div className="card-elevated max-w-md p-8 text-center">
          <p className="text-med-ink font-medium">Supabase not configured</p>
          <p className="text-sm text-med-sub mt-2">Admin observability requires Supabase auth.</p>
          <Link href="/" className="btn-primary inline-block mt-4">
            Home
          </Link>
        </div>
      </div>
    );
  }

  const user = await getAppUser();
  if (!user || user.role !== "admin") {
    redirect("/auth?next=/admin/observability");
  }

  return (
    <div className="min-h-screen bg-[var(--mc-canvas)]">
      <header className="sticky top-0 z-20 bg-white/85 backdrop-blur-md border-b border-med-line">
        <div className="max-w-[1100px] mx-auto px-5 py-3 flex items-center justify-between gap-4">
          <Link href="/">
            <LogoWordmark />
          </Link>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wide text-med-sub font-medium">Admin</p>
            <p className="text-sm text-med-ink truncate max-w-[200px]">{user.email}</p>
          </div>
        </div>
      </header>
      <main className="max-w-[1100px] mx-auto px-5 py-8">
        <div className="mb-6">
          <h1 className="display-title text-2xl">Observability</h1>
          <p className="muted text-sm mt-1 max-w-2xl">
            Visits, auth activity, feature usage, abuse signals, and alerts for open-beta safety and
            marketing insights. No raw IPs or user emails are shown in aggregates.
          </p>
        </div>
        <ObservabilityDashboard />
      </main>
    </div>
  );
}
