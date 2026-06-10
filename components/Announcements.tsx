"use client";

import { useEffect, useState } from "react";
import { mergeAnnouncements, staticAnnouncements, type Announcement } from "@/lib/announcements";
import { Card, CardBody } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { useConfirm } from "./ui/ConfirmDialog";

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
  const [isAdmin, setIsAdmin] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const { confirm } = useConfirm();

  function refresh() {
    fetch("/api/announcements", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.announcements && setItems(d.announcements as Announcement[]))
      .catch(() => {});
  }

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

    // Detect admin (owner) via the server — this honors OWNER_EMAIL promotion,
    // which a client-side profiles read cannot see.
    fetch("/api/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d?.role === "admin") setIsAdmin(true);
      })
      .catch(() => {});
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

      {isAdmin && (
        <AdminComposer
          editing={editing}
          onCancelEdit={() => setEditing(null)}
          onChanged={() => {
            setEditing(null);
            refresh();
          }}
        />
      )}

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
                  <div className="flex items-center gap-2 shrink-0">
                    <time className="text-[11.5px] text-med-sub whitespace-nowrap">
                      {new Date(a.date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                    </time>
                    {isAdmin && (
                      <button
                        type="button"
                        className="text-[11px] text-med-brand hover:underline"
                        onClick={() => {
                          setEditing(a);
                          if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      >
                        Edit
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        type="button"
                        className="text-[11px] text-med-bad hover:underline"
                        onClick={async () => {
                          const yes = await confirm({
                            title: "Delete announcement",
                            message: `Delete announcement "${a.title}"?`,
                            confirmLabel: "Delete",
                            danger: true,
                          });
                          if (!yes) return;
                          await fetch(`/api/admin/announcements?id=${encodeURIComponent(a.id)}`, { method: "DELETE" });
                          refresh();
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
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

/** Owner/admin composer to post or edit an announcement without touching SQL. */
function AdminComposer({
  editing,
  onCancelEdit,
  onChanged,
}: {
  editing: Announcement | null;
  onCancelEdit: () => void;
  onChanged: () => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<Announcement["kind"]>("update");
  const [pinned, setPinned] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Load the post being edited into the form (id is kept so save = update).
  useEffect(() => {
    if (editing) {
      setTitle(editing.title);
      setBody(editing.body);
      setKind(editing.kind);
      setPinned(Boolean(editing.pinned));
      setMsg(null);
    }
  }, [editing]);

  async function post() {
    if (!title.trim() || !body.trim()) {
      setMsg("Title and body are required.");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: editing?.id,
          date: editing?.date,
          title: title.trim(),
          body: body.trim(),
          kind,
          pinned,
          ctaLabel: editing?.ctaLabel,
          ctaHref: editing?.ctaHref,
        }),
      });
      const d = (await r.json()) as { saved?: boolean; error?: string };
      if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
      setTitle("");
      setBody("");
      setPinned(false);
      setMsg(editing ? "Updated ✓" : "Posted ✓");
      onChanged();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardBody className="grid gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge kind="info">Admin</Badge>
          <h3 className="font-semibold text-med-ink text-[14px]">
            {editing ? `Editing: ${editing.title.slice(0, 48)}` : "Post an announcement"}
          </h3>
          {editing && (
            <button
              type="button"
              className="text-[11.5px] text-med-sub hover:underline"
              onClick={() => {
                onCancelEdit();
                setTitle("");
                setBody("");
                setPinned(false);
                setMsg(null);
              }}
            >
              Cancel edit
            </button>
          )}
        </div>
        <input
          aria-label="Announcement title"
          className="input"
          placeholder="Title (e.g. New journals added to the finder)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          aria-label="Announcement body"
          className="textarea min-h-[90px]"
          placeholder="Write your update to users…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <div className="flex flex-wrap items-center gap-3">
          <select
            aria-label="Announcement type"
            className="input max-w-[160px]"
            value={kind}
            onChange={(e) => setKind(e.target.value as Announcement["kind"])}
          >
            <option value="release">Release</option>
            <option value="update">Update</option>
            <option value="tip">Tip</option>
            <option value="notice">Notice</option>
          </select>
          <label className="flex items-center gap-1.5 text-[13px] text-med-ink">
            <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
            Pin to top
          </label>
          <button type="button" className="btn-primary" onClick={post} disabled={busy}>
            {busy ? "Saving…" : editing ? "Save changes" : "Post announcement"}
          </button>
          {msg && <span role="alert" className="text-[12px] text-med-sub">{msg}</span>}
        </div>
        <p className="text-[11px] text-med-sub">
          Posts save to your Supabase <code className="font-mono">announcements</code> table and appear to all users instantly. Only you (admin) see this composer.
        </p>
      </CardBody>
    </Card>
  );
}
