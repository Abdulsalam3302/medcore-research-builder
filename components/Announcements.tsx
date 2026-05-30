"use client";

import { useEffect, useState } from "react";
import { mergeAnnouncements, staticAnnouncements, type Announcement } from "@/lib/announcements";
import { Card, CardBody } from "./ui/Card";
import { Badge } from "./ui/Badge";

function kindBadge(kind: Announcement["kind"]): { kind: "good" | "info" | "warn" | "neutral"; label: string } {
  switch (kind) {
    case "release":
      return { kind: "good", label: "Release" };
    case "update":
      return { kind: "info", label: "Update" };
    case "tip":
      return { kind: "warn", label: "Tip" };
    default:
      return { kind: "neutral", label: "Notice" };
  }
}

export function Announcements() {
  // Start from the version-controlled set so content shows instantly, then
  // merge any live (Supabase-backed) posts when the API responds.
  const [items, setItems] = useState<Announcement[]>(() => mergeAnnouncements());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/announcements", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d?.announcements) return;
        setItems(d.announcements as Announcement[]);
      })
      .catch(() => {
        /* keep static */
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="grid gap-4">
      <Card>
        <CardBody>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="eyebrow">News</div>
              <h2 className="section-title text-[17px]">Announcements & Updates</h2>
            </div>
            {loading && <span className="text-[11px] text-med-sub">syncing…</span>}
          </div>
          <p className="muted mt-1.5">
            Product releases, improvements, and tips from the MedCore team.
          </p>
        </CardBody>
      </Card>

      <div className="grid gap-3">
        {items.map((a) => {
          const b = kindBadge(a.kind);
          return (
            <Card key={a.id}>
              <CardBody>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {a.pinned && <Badge kind="info">📌 Pinned</Badge>}
                    <Badge kind={b.kind}>{b.label}</Badge>
                    <h3 className="font-semibold text-med-ink text-[14.5px]">{a.title}</h3>
                  </div>
                  <time className="text-[11.5px] text-med-sub whitespace-nowrap">
                    {new Date(a.date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                  </time>
                </div>
                <p className="text-[13.5px] text-med-inkSoft leading-relaxed mt-2">{a.body}</p>
                {a.ctaLabel && a.ctaHref && (
                  <a
                    href={a.ctaHref}
                    className="inline-flex items-center gap-1 mt-3 text-[13px] font-medium text-med-brand hover:underline"
                  >
                    {a.ctaLabel} →
                  </a>
                )}
              </CardBody>
            </Card>
          );
        })}
        {items.length === 0 && (
          <Card>
            <CardBody>
              <div className="muted">No announcements yet. Check back soon.</div>
            </CardBody>
          </Card>
        )}
      </div>

      <p className="text-[11px] text-med-sub px-1">
        {staticAnnouncements.length} built-in post(s) ship with the app; live posts appear when cloud is configured.
      </p>
    </div>
  );
}
