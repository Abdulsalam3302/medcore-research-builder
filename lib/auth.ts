import { createClient, createServiceClient, isSupabaseConfigured } from "@/lib/supabase/server";

export type AppUser = {
  id: string;
  email: string;
  role: "user" | "admin";
};

export async function getAppUser(): Promise<AppUser | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("id", user.id)
    .maybeSingle();

  const owner = (process.env.OWNER_EMAIL || "").toLowerCase();
  const email = user.email.toLowerCase();
  let role: "user" | "admin" = profile?.role === "admin" ? "admin" : "user";
  if (owner && email === owner) role = "admin";

  return { id: user.id, email: user.email, role };
}

export async function promoteOwnerIfNeeded(userId: string, email: string) {
  const owner = (process.env.OWNER_EMAIL || "").toLowerCase();
  if (!owner || email.toLowerCase() !== owner) return;
  // Service role bypasses RLS — clients cannot self-promote (role column is locked).
  const admin = createServiceClient();
  if (!admin) return;
  await admin.from("profiles").upsert({
    id: userId,
    email,
    role: "admin",
  });
}
