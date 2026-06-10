"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { InfoHint } from "@/components/ui/InfoHint";

type ClubKind = "opportunity" | "project" | "meet";

type ClubPost = {
  id: string;
  author_name: string;
  kind: ClubKind;
  title: string;
  description: string;
  specialty?: string | null;
  share_url?: string | null;
  contact?: string | null;
  status: "open" | "closed";
  created_at: string;
  joined?: boolean;
};

const KIND_META: Record<ClubKind, { label: string; badge: "info" | "good" | "warn"; blurb: string }> = {
  opportunity: {
    label: "Research opportunity",
    badge: "good",
    blurb: "An open call to join a study team — data collection, analysis, writing, or review.",
  },
  project: {
    label: "Shared project",
    badge: "info",
    blurb: "A MedCore project shared for collaborators or structured feedback — initiated and finished on the platform.",
  },
  meet: {
    label: "Meet researchers",
    badge: "warn",
    blurb: "Find peers, mentors, or co-authors in your specialty.",
  },
};

export function PublicationClub() {
  const [posts, setPosts] = useState<ClubPost[]>([]);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [filter, setFilter] = useState<ClubKind | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // New-post form
  const [showForm, setShowForm] = useState(false);
  const [kind, setKind] = useState<ClubKind>("opportunity");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [contact, setContact] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [posting, setPosting] = useState(false);

  const load = useCallback(async (kindFilter: ClubKind | "all") => {
    setLoading(true);
    setError(null);
    try {
      const qs = kindFilter === "all" ? "" : `?kind=${kindFilter}`;
      const r = await fetch(`/api/club/posts${qs}`, { cache: "no-store" });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      setConfigured(Boolean(data.configured));
      setSignedIn(Boolean(data.signedIn));
      setPosts(Array.isArray(data.posts) ? data.posts : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load the club board.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(filter);
  }, [filter, load]);

  async function submitPost() {
    setPosting(true);
    setError(null);
    try {
      const r = await fetch("/api/club/posts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, title, description, specialty, contact, shareUrl }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      setNotice("Posted to the club board.");
      setShowForm(false);
      setTitle("");
      setDescription("");
      setSpecialty("");
      setContact("");
      setShareUrl("");
      await load(filter);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't create the post.");
    } finally {
      setPosting(false);
    }
  }

  async function join(post: ClubPost) {
    setError(null);
    try {
      const r = await fetch(`/api/club/posts/${post.id}/join`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      setNotice(`Join request sent for “${post.title}”. The author can see your interest.`);
      setPosts((ps) => ps.map((p) => (p.id === post.id ? { ...p, joined: true } : p)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send the join request.");
    }
  }

  return (
    <div className="space-y-5">
      <div className="card-elevated p-4 md:p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="font-display font-semibold text-med-ink text-[15px] inline-flex items-center gap-1.5">
              Publication Club
              <InfoHint
                title="What is the Publication Club?"
                text="A community board inside MedCore: post research opportunities, share a project (via its tokenized share link) to find collaborators, or simply meet researchers in your specialty. The goal — projects are initiated, built, and finished on the platform, together."
              />
            </h3>
            <p className="muted text-[12.5px] mt-0.5">
              Meet researchers, ask for opportunities, join teams, and share MedCore projects —
              so research starts <em>and</em> finishes here.
            </p>
          </div>
          {configured && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => setShowForm((v) => !v)}
            >
              {showForm ? "Cancel" : "+ New post"}
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div className="mt-4 flex gap-1.5 flex-wrap" role="tablist" aria-label="Post type filter">
          {(["all", "opportunity", "project", "meet"] as const).map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={filter === k}
              className={`pill-tab ${filter === k ? "pill-tab-active" : ""}`}
              onClick={() => setFilter(k)}
            >
              {k === "all" ? "All posts" : KIND_META[k].label}
            </button>
          ))}
        </div>

        {notice && (
          <p role="status" className="mt-3 text-[12.5px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            {notice}
          </p>
        )}
        {error && (
          <p role="alert" className="mt-3 text-[12.5px] text-med-bad bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
      </div>

      {/* New post form */}
      {showForm && configured && (
        <div className="card-elevated p-4 md:p-5 space-y-3">
          {!signedIn && (
            <p className="text-[12.5px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Posting requires a free account —{" "}
              <a href="/auth" className="underline font-medium">sign in</a> first (browsing stays open to everyone).
            </p>
          )}
          <div className="flex gap-1.5 flex-wrap">
            {(Object.keys(KIND_META) as ClubKind[]).map((k) => (
              <button
                key={k}
                type="button"
                className={`pill-tab ${kind === k ? "pill-tab-active" : ""}`}
                onClick={() => setKind(k)}
              >
                {KIND_META[k].label}
              </button>
            ))}
          </div>
          <p className="text-[12px] text-med-sub">{KIND_META[kind].blurb}</p>
          <label className="block">
            <span className="text-[11.5px] font-semibold text-med-sub uppercase tracking-wide">Title</span>
            <input
              type="text"
              className="input mt-1 w-full"
              value={title}
              maxLength={160}
              placeholder="e.g. Co-investigators wanted: STROBE cohort on diabetic foot outcomes"
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-[11.5px] font-semibold text-med-sub uppercase tracking-wide">Description</span>
            <textarea
              className="input mt-1 w-full min-h-[110px]"
              value={description}
              maxLength={2000}
              placeholder="What's the study, what roles are open, expected workload, authorship plan… (plain text, min 20 characters)"
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <div className="grid md:grid-cols-3 gap-3">
            <label className="block">
              <span className="text-[11.5px] font-semibold text-med-sub uppercase tracking-wide">Specialty</span>
              <input type="text" className="input mt-1 w-full" value={specialty} maxLength={80}
                placeholder="e.g. cardiology" onChange={(e) => setSpecialty(e.target.value)} />
            </label>
            <label className="block">
              <span className="text-[11.5px] font-semibold text-med-sub uppercase tracking-wide">Contact</span>
              <input type="text" className="input mt-1 w-full" value={contact} maxLength={200}
                placeholder="email or ORCID" onChange={(e) => setContact(e.target.value)} />
            </label>
            <label className="block">
              <span className="text-[11.5px] font-semibold text-med-sub uppercase tracking-wide">
                MedCore share link (optional)
              </span>
              <input type="text" className="input mt-1 w-full" value={shareUrl} maxLength={300}
                placeholder="…?share=TOKEN from Export Center" onChange={(e) => setShareUrl(e.target.value)} />
            </label>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              className="btn-primary"
              disabled={posting || title.trim().length < 8 || description.trim().length < 20 || !signedIn}
              onClick={submitPost}
            >
              {posting ? "Posting…" : "Post to the board"}
            </button>
          </div>
        </div>
      )}

      {/* Board */}
      {configured === false ? (
        <div className="rounded-lg border border-dashed border-med-line bg-slate-50/40 p-6 text-[13px] text-med-sub space-y-2">
          <p className="font-medium text-med-ink">The community board isn't enabled on this deployment yet.</p>
          <p>
            Publication Club runs on Supabase (same setup as cloud sync). A maintainer can enable it by running{" "}
            <code className="mc-mono text-[12px]">docs/CLUB_TABLES.sql</code> in the Supabase SQL editor.
            Everything else on the platform works without it.
          </p>
        </div>
      ) : loading ? (
        <div className="muted text-[13px]">Loading the board…</div>
      ) : posts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-med-line bg-slate-50/40 p-6 text-center text-[13px] text-med-sub">
          No posts yet{filter !== "all" ? " in this category" : ""} — be the first to open an opportunity.
        </div>
      ) : (
        <ul className="space-y-3">
          {posts.map((p) => (
            <li key={p.id} className="card-elevated p-4 md:p-5">
              <div className="flex items-start gap-3 flex-wrap">
                <div className="flex-1 min-w-[220px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge kind={KIND_META[p.kind].badge}>{KIND_META[p.kind].label}</Badge>
                    {p.specialty && <span className="text-[11.5px] text-med-sub">{p.specialty}</span>}
                    {p.status === "closed" && <Badge kind="neutral">Closed</Badge>}
                  </div>
                  <h4 className="mt-1.5 font-semibold text-med-ink text-[14px]">{p.title}</h4>
                  <p className="mt-1 text-[12.5px] text-med-sub whitespace-pre-line">{p.description}</p>
                  <p className="mt-2 text-[11.5px] text-med-subtle">
                    {p.author_name} · {p.created_at.slice(0, 10)}
                    {p.contact ? <> · contact: <span className="text-med-sub">{p.contact}</span></> : null}
                  </p>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  {p.share_url && (
                    <a href={p.share_url} className="btn-secondary text-xs" rel="noopener">
                      Open shared project
                    </a>
                  )}
                  {p.status === "open" && (
                    p.joined ? (
                      <Badge kind="good">Join request sent</Badge>
                    ) : signedIn ? (
                      <button type="button" className="btn-primary text-xs" onClick={() => join(p)}>
                        Ask to join
                      </button>
                    ) : (
                      <a href="/auth" className="btn-secondary text-xs">Sign in to join</a>
                    )
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="text-[11.5px] text-med-subtle leading-relaxed">
        Community etiquette: posts are plain text, moderated by the platform's no-fabrication and
        respectful-conduct rules. Never share patient-identifiable data here. Authorship for joined
        projects should follow ICMJE criteria, agreed in writing before work starts.
      </p>
    </div>
  );
}
