import { getAppUser } from "@/lib/auth";
import { bad } from "@/app/api/_utils";

export async function requireAdmin() {
  const user = await getAppUser();
  if (!user || user.role !== "admin") {
    return { user: null as null, error: bad("Admin access required", 403) };
  }
  return { user, error: null as null };
}

export function parseDaysParam(url: string, fallback = 30): number {
  return Math.min(90, Math.max(7, Number(new URL(url).searchParams.get("days") || fallback)));
}
