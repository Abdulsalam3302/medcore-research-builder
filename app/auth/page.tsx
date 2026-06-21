"use client";

import { useEffect, useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { LogoWordmark } from "@/components/ui/Logo";
import Link from "next/link";

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) {
    return "/";
  }
  return raw;
}

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const configured = isSupabaseConfigured();
  const [nextPath, setNextPath] = useState("/");

  useEffect(() => {
    setNextPath(safeNextPath(new URLSearchParams(window.location.search).get("next")));
  }, []);

  useEffect(() => {
    if (!configured) return;
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) window.location.href = nextPath;
    });
  }, [configured]);

  async function trackAuth(eventType: "signup" | "login" | "auth_failed") {
    try {
      await fetch("/api/analytics/collect", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ eventType, mode }),
      });
    } catch {
      /* non-blocking */
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!configured) return;
    setBusy(true);
    setMsg(null);
    const supabase = createClient();
    try {
      if (mode === "sign-in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          void trackAuth("auth_failed");
          throw error;
        }
        void trackAuth("login");
        window.location.href = nextPath;
        return;
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        void trackAuth("auth_failed");
        throw error;
      }
      // When email confirmation is disabled (recommended for this app), sign-up
      // returns an active session immediately — go straight into the workspace.
      if (data.session) {
        void trackAuth("signup");
        window.location.href = nextPath;
        return;
      }
      // Otherwise try an immediate sign-in (works when confirmation is off but
      // no session was returned). Fall back to a friendly message if it isn't.
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (!signInErr) {
        void trackAuth("signup");
        window.location.href = nextPath;
        return;
      }
      setMsg("Account created. You can sign in now — no email confirmation needed.");
      setMode("sign-in");
    } catch (err) {
      if (mode === "sign-in") void trackAuth("auth_failed");
      setMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--mc-canvas)] p-6">
      <div className="card-elevated w-full max-w-md p-8">
        <LogoWordmark className="mb-6" />
        <h1 className="display-title text-xl mb-1">
          {mode === "sign-in" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="muted text-sm mb-4">
          {mode === "sign-in"
            ? "Sign in to sync your manuscripts across devices."
            : "One step — email and password, and you're in. No email confirmation."}
        </p>

        {/* Mode toggle */}
        <div className="grid grid-cols-2 gap-1 p-1 mb-5 rounded-lg bg-slate-100">
          {(["sign-in", "sign-up"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setMsg(null); }}
              className={`rounded-md py-1.5 text-[13px] font-medium transition ${
                mode === m ? "bg-white text-med-ink shadow-soft" : "text-med-sub hover:text-med-ink"
              }`}
            >
              {m === "sign-in" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        {!configured ? (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
            Supabase is not configured on this deployment. Contact the administrator.
          </p>
        ) : (
          <form onSubmit={submit} className="grid gap-4">
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                required
                minLength={8}
                autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {msg && (
              <p className="text-sm text-med-inkSoft bg-slate-50 border border-med-line rounded-lg p-3">
                {msg}
              </p>
            )}
            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy ? "Please wait…" : mode === "sign-in" ? "Sign in" : "Create account"}
            </button>
            {mode === "sign-up" && (
              <p className="text-[11.5px] text-med-sub text-center">
                Password must be at least 8 characters. No email confirmation needed.
              </p>
            )}
          </form>
        )}

        <div className="mt-6 flex items-center justify-center gap-3 text-sm">
          <Link href="/" className="text-med-brand font-medium hover:underline">
            Continue as guest →
          </Link>
          <span className="text-med-line" aria-hidden>|</span>
          <Link href="/about" className="text-med-sub hover:text-med-ink hover:underline">
            About MedCore
          </Link>
        </div>
      </div>
    </div>
  );
}
