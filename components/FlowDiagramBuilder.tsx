"use client";

import { useMemo, useState } from "react";
import { Card, CardBody, CardHeader } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { CopyButton } from "./ui/CopyButton";
import { downloadAsFile } from "@/lib/store";

type FlowNode = {
  id: string;
  label: string;     // free text
  kind: "main" | "exclusion";
};

type FlowTemplate = {
  id: string;
  name: string;
  acronym: string;
  description: string;
  nodes: FlowNode[];
};

const TEMPLATES: FlowTemplate[] = [
  {
    id: "prisma-2020",
    name: "PRISMA 2020 — systematic review",
    acronym: "PRISMA",
    description:
      "Identification → Screening → Eligibility → Included, with side-branch exclusions.",
    nodes: [
      { id: "id-db", kind: "main", label: "Records identified from databases (n = ?)" },
      { id: "id-other", kind: "main", label: "Records identified from other sources (n = ?)" },
      { id: "dedup", kind: "exclusion", label: "Duplicates removed before screening (n = ?)" },
      { id: "screen", kind: "main", label: "Records screened (n = ?)" },
      { id: "screen-ex", kind: "exclusion", label: "Records excluded after title/abstract screen (n = ?)" },
      { id: "ft", kind: "main", label: "Reports sought for retrieval (n = ?)" },
      { id: "ft-not", kind: "exclusion", label: "Reports not retrieved (n = ?)" },
      { id: "elig", kind: "main", label: "Reports assessed for eligibility (n = ?)" },
      { id: "elig-ex", kind: "exclusion", label: "Reports excluded with reasons (n = ?): reason 1 (n = ?), reason 2 (n = ?)" },
      { id: "incl", kind: "main", label: "Studies included in review (n = ?)" },
      { id: "synth", kind: "main", label: "Studies in synthesis / meta-analysis (n = ?)" },
    ],
  },
  {
    id: "consort-2025",
    name: "CONSORT 2025 — parallel-group RCT",
    acronym: "CONSORT",
    description:
      "Enrollment → Allocation → Follow-up → Analysis with two arms.",
    nodes: [
      { id: "assess", kind: "main", label: "Assessed for eligibility (n = ?)" },
      { id: "exc", kind: "exclusion", label: "Excluded (n = ?): not meeting criteria (n = ?), declined (n = ?), other (n = ?)" },
      { id: "rand", kind: "main", label: "Randomised (n = ?)" },
      { id: "alloc-a", kind: "main", label: "Allocated to intervention A (n = ?) — received intervention (n = ?)" },
      { id: "alloc-b", kind: "main", label: "Allocated to intervention B (n = ?) — received intervention (n = ?)" },
      { id: "lost-a", kind: "exclusion", label: "Lost to follow-up — A (n = ?), discontinued (n = ?)" },
      { id: "lost-b", kind: "exclusion", label: "Lost to follow-up — B (n = ?), discontinued (n = ?)" },
      { id: "an-a", kind: "main", label: "Analysed — A (n = ?)" },
      { id: "an-b", kind: "main", label: "Analysed — B (n = ?)" },
    ],
  },
  {
    id: "strobe-cohort",
    name: "STROBE — cohort study",
    acronym: "STROBE",
    description:
      "Source population → eligible → enrolled → analysed.",
    nodes: [
      { id: "source", kind: "main", label: "Source population (n = ?)" },
      { id: "elig", kind: "main", label: "Eligible (n = ?)" },
      { id: "exc", kind: "exclusion", label: "Excluded (n = ?) with reasons" },
      { id: "enrol", kind: "main", label: "Enrolled / cohort entry (n = ?)" },
      { id: "lost", kind: "exclusion", label: "Lost to follow-up (n = ?)" },
      { id: "analysed", kind: "main", label: "Included in analysis (n = ?)" },
    ],
  },
];

function defaultTemplateId(acronym?: string): string {
  if (!acronym) return TEMPLATES[0].id;
  const upper = acronym.toUpperCase();
  const hit = TEMPLATES.find((t) => upper.includes(t.acronym));
  return hit?.id || TEMPLATES[0].id;
}

export function FlowDiagramBuilder({ defaultAcronym }: { defaultAcronym?: string } = {}) {
  const initialId = defaultTemplateId(defaultAcronym);
  const [tplId, setTplId] = useState<string>(initialId);
  const tpl = TEMPLATES.find((t) => t.id === tplId)!;
  const [nodes, setNodes] = useState<FlowNode[]>(() => clone(tpl.nodes));

  function chooseTpl(id: string) {
    setTplId(id);
    const next = TEMPLATES.find((t) => t.id === id)!;
    setNodes(clone(next.nodes));
  }

  function updateNode(id: string, patch: Partial<FlowNode>) {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  }
  function removeNode(id: string) {
    setNodes((prev) => prev.filter((n) => n.id !== id));
  }
  function addNode(kind: FlowNode["kind"]) {
    setNodes((prev) => [
      ...prev,
      { id: `n-${Date.now()}`, kind, label: kind === "main" ? "New step (n = ?)" : "Excluded (n = ?)" },
    ]);
  }
  function move(id: string, dir: -1 | 1) {
    setNodes((prev) => {
      const idx = prev.findIndex((n) => n.id === id);
      if (idx < 0) return prev;
      const next = [...prev];
      const swapIdx = idx + dir;
      if (swapIdx < 0 || swapIdx >= next.length) return prev;
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next;
    });
  }

  const svg = useMemo(() => renderSvg(nodes, tpl.acronym), [nodes, tpl.acronym]);

  return (
    <div className="grid lg:grid-cols-[420px_1fr] gap-5">
      <div className="grid gap-4">
        <Card>
          <CardHeader title="Template" />
          <CardBody className="grid gap-2">
            {TEMPLATES.map((t) => {
              const active = t.id === tplId;
              return (
                <button
                  key={t.id}
                  onClick={() => chooseTpl(t.id)}
                  className={`text-left rounded-lg border p-3 transition ${
                    active
                      ? "border-med-brand bg-sky-50/40"
                      : "border-med-line hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Badge kind="info">{t.acronym}</Badge>
                    <div className="font-semibold text-[13px] text-med-ink">{t.name}</div>
                  </div>
                  <p className="text-[12px] text-med-sub mt-1 leading-relaxed">{t.description}</p>
                </button>
              );
            })}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Steps"
            right={
              <div className="flex gap-1">
                <button className="btn-ghost text-[11.5px]" onClick={() => addNode("main")}>
                  + Main
                </button>
                <button className="btn-ghost text-[11.5px]" onClick={() => addNode("exclusion")}>
                  + Exclusion
                </button>
              </div>
            }
          />
          <CardBody>
            <ul className="grid gap-2">
              {nodes.map((n, i) => (
                <li
                  key={n.id}
                  className={`rounded-lg border p-2 ${
                    n.kind === "exclusion"
                      ? "border-amber-200 bg-amber-50/40"
                      : "border-med-line bg-white"
                  }`}
                >
                  <textarea
                    className="textarea text-[12.5px] min-h-[44px]"
                    value={n.label}
                    onChange={(e) => updateNode(n.id, { label: e.target.value })}
                  />
                  <div className="flex items-center justify-between mt-1">
                    <Badge kind={n.kind === "exclusion" ? "warn" : "info"}>{n.kind}</Badge>
                    <div className="flex gap-1">
                      <button className="btn-ghost text-[11px]" onClick={() => move(n.id, -1)}>
                        ↑
                      </button>
                      <button className="btn-ghost text-[11px]" onClick={() => move(n.id, 1)}>
                        ↓
                      </button>
                      <button
                        className="btn-ghost text-[11px] text-rose-700"
                        onClick={() => removeNode(n.id)}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Preview"
          subtitle={`${tpl.acronym} flow diagram — fill in the (n = ?) values from your study.`}
          right={
            <div className="flex items-center gap-2">
              <CopyButton text={svg} label="Copy SVG" />
              <button
                className="btn-secondary text-[12px]"
                onClick={() => downloadAsFile(`${tpl.acronym.toLowerCase()}-flow.svg`, svg, "image/svg+xml")}
              >
                Download SVG
              </button>
            </div>
          }
        />
        <CardBody>
          <div
            className="rounded-lg border border-med-line bg-white overflow-x-auto p-2"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
          <p className="text-[11.5px] text-med-sub mt-2 leading-relaxed">
            Built for paste-into-Word/Google-Docs. SVG is editable in Inkscape /
            Illustrator if your journal needs a different style.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x));
}

function renderSvg(nodes: FlowNode[], title: string): string {
  // Simple vertical layout. Main nodes on the centre column, exclusion nodes branch right.
  const colMain = 180;
  const colExc = 460;
  const boxW = 260;
  const boxWExc = 260;
  const rowH = 90;
  const padTop = 50;
  const padBottom = 30;
  const titleH = 30;

  const mainNodes = nodes.filter((n) => n.kind === "main");
  // Each exclusion node is anchored next to the most recent preceding main node.
  type Placed = {
    node: FlowNode;
    x: number;
    y: number;
    w: number;
    centre: number; // anchor row index for arrows
  };
  const placed: Placed[] = [];
  let mainIndex = -1;
  let exclusionsForCurrentMain = 0;

  nodes.forEach((n) => {
    if (n.kind === "main") {
      mainIndex += 1;
      exclusionsForCurrentMain = 0;
      placed.push({
        node: n,
        x: colMain,
        y: padTop + titleH + mainIndex * rowH,
        w: boxW,
        centre: mainIndex,
      });
    } else {
      // attach to the just-added main row
      const yOffset = exclusionsForCurrentMain * 32;
      exclusionsForCurrentMain += 1;
      placed.push({
        node: n,
        x: colExc,
        y: padTop + titleH + Math.max(mainIndex, 0) * rowH + yOffset + 10,
        w: boxWExc,
        centre: mainIndex,
      });
    }
  });

  const totalRows = mainNodes.length;
  const height = padTop + titleH + Math.max(totalRows, 1) * rowH + padBottom;
  const width = colExc + boxWExc + 40;

  const escape = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const wrap = (text: string, maxChars: number): string[] => {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      if ((cur + " " + w).trim().length > maxChars) {
        if (cur) lines.push(cur);
        cur = w;
      } else {
        cur = (cur + " " + w).trim();
      }
    }
    if (cur) lines.push(cur);
    return lines.slice(0, 6);
  };

  const renderBox = (p: Placed): string => {
    const lines = wrap(p.node.label, 36);
    const lineH = 14;
    const boxH = Math.max(58, lines.length * lineH + 20);
    const fill = p.node.kind === "exclusion" ? "#fffbeb" : "#ffffff";
    const stroke = p.node.kind === "exclusion" ? "#f59e0b" : "#0e6ba8";
    const text = lines
      .map(
        (l, i) =>
          `<tspan x="${p.x + p.w / 2}" dy="${i === 0 ? 0 : lineH}">${escape(l)}</tspan>`,
      )
      .join("");
    return `
      <g>
        <rect x="${p.x}" y="${p.y}" width="${p.w}" height="${boxH}" rx="8" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
        <text x="${p.x + p.w / 2}" y="${p.y + 22}" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="12" fill="#0b1220">${text}</text>
      </g>
    `;
  };

  // Arrows: vertical between main nodes, horizontal from main to exclusions
  const mainPlaced = placed.filter((p) => p.node.kind === "main");
  const arrows: string[] = [];
  for (let i = 0; i < mainPlaced.length - 1; i++) {
    const a = mainPlaced[i];
    const b = mainPlaced[i + 1];
    const ax = a.x + a.w / 2;
    const ay = a.y + 60;
    const by = b.y;
    arrows.push(
      `<line x1="${ax}" y1="${ay}" x2="${ax}" y2="${by - 6}" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#arrow)"/>`,
    );
  }
  // exclusion arrows
  placed
    .filter((p) => p.node.kind === "exclusion")
    .forEach((p) => {
      const main = mainPlaced[p.centre] || mainPlaced[mainPlaced.length - 1];
      if (!main) return;
      const sx = main.x + main.w;
      const sy = main.y + 30;
      const tx = p.x;
      const ty = p.y + 24;
      arrows.push(
        `<path d="M ${sx} ${sy} C ${(sx + tx) / 2} ${sy}, ${(sx + tx) / 2} ${ty}, ${tx - 6} ${ty}" fill="none" stroke="#94a3b8" stroke-width="1.5" marker-end="url(#arrow)"/>`,
      );
    });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" style="max-width:${width}px">
    <defs>
      <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8"/>
      </marker>
    </defs>
    <text x="20" y="28" font-family="Inter, system-ui, sans-serif" font-size="14" font-weight="700" fill="#0b1220">${escape(title)} flow diagram</text>
    ${arrows.join("\n")}
    ${placed.map(renderBox).join("\n")}
  </svg>`;
}
