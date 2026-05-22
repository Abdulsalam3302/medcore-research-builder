# Contributing to MedCore Research Builder

Thank you for helping make medical research writing more accessible. MedCore is a non-profit, open tool — contributions are welcome.

## Quick start

```bash
git clone https://github.com/Abdulsalam3302/medcore-research-builder.git
cd medcore-research-builder
npm install
cp .env.example .env.local
npm run dev
```

## Before opening a PR

1. `npm run typecheck`
2. `npm run build`
3. `npm run test:smoke` (with dev server running)

## What we need most

- **Reporting guidelines** — new EQUATOR checklists or journal templates
- **Reference parsing** — edge cases in Vancouver/AMA/APA formats
- **Accessibility** — keyboard nav, screen reader labels, contrast fixes
- **Translations** — Arabic and other languages for UI copy
- **Bug reports** — mis-parsed references, export issues, API failures

## Research integrity

Do not add features that fabricate PMIDs, DOIs, statistics, or citations. LLM outputs must remain clearly labeled and auditable.

## Design

UI reference prototypes live in `design/v2/`. Integrate tokens and patterns into Tailwind/components — do not import the JSX prototypes directly.

## Questions

Open a GitHub issue or contact the founder via the in-app links.
