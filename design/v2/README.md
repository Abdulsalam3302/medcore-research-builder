# MedCore v2 design reference

Source: Claude Design export (`step by step.zip`).

These files are **reference prototypes** (inline styles, mock data). The live app integrates the design via:

- `app/globals.css` — `--mc-*` tokens, `.mc-eyebrow`, `.mc-numeral`, `.mc-mono`
- `components/ui/ProgressRing.tsx`, `ProvenanceChip.tsx`, `Logo.tsx`
- `components/Sidebar.tsx`, `Overview.tsx`, `TopBar.tsx`

Do not import these JSX files directly into the Next.js app.

## Files

| File | Purpose |
|------|---------|
| `tokens.css` | Canonical color/type/spacing tokens |
| `ui-shell.jsx` | Sidebar + TopBar layout spec |
| `ui-primitives.jsx` | Badge, Card, Button, ProgressRing, ProvenanceChip |
| `screen-overview.jsx` | Dashboard hero + workflow grid |
| `screen-launch.jsx` | Research Launch layout |
| `screen-title-lab.jsx` | Title Lab layout |
| `screen-section-builder.jsx` | Section builder layout |
| `screen-reference-verifier.jsx` | Reference verifier layout |
| `screen-tokens.jsx` | Token swatch board |
