"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export function AuthButton() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => subscription.unsubscribe();
  }, [configured]);

  if (!configured) return null;
  if (loading) return null;

  if (!email) {
    return (
      <Link href="/auth" className="btn-secondary text-sm">
        Sign in
      </Link>
    );
  }

  return (
    <div className="hidden sm:flex items-center gap-2">
      <span className="text-[11px] text-[var(--mc-ink-500)] max-w-[140px] truncate" title={email}>
        {email}
      </span>
      <button
        type="button"
        className="btn-ghost text-xs"
        onClick={async () => {
          const supabase = createClient();
          await supabase.auth.signOut();
          window.location.reload();
        }}
      >
        Sign out
      </button>
    </div>
  );
}
