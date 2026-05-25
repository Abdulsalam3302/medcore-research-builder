# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| 2.0.x   | Yes       |

## Reporting a vulnerability

Please **do not** open public GitHub issues for security problems.

Email **kubee3302@gmail.com** with:

- Description of the issue
- Steps to reproduce
- Impact assessment (data exposure, API abuse, etc.)

We aim to respond within 7 days.

## Scope

In scope:

- Server-side API routes (`/api/*`) — injection, SSRF, rate-limit bypass, secret leakage
- Client-side XSS in manuscript fields or export flows
- Insecure defaults that expose user drafts or API keys

Out of scope:

- Missing CSP on third-party CDNs (Plotly) unless exploitable
- Social engineering
- Denial of service against upstream scholarly APIs (PubMed, Crossref, etc.)

## Architecture notes

- Drafts are stored in **browser localStorage only** — not on MedCore servers
- API keys live in **server environment variables** only
- Rate limits apply per IP on LLM and verification routes (self-hosted; use Redis/Upstash at scale)

## Safe disclosure

We appreciate responsible disclosure. Credit will be given in release notes if you wish.
