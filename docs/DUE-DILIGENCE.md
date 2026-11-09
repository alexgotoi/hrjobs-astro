# Due-diligence overview

A one-page orientation for a technical reviewer assessing this asset.

## What it is
HRJobsRemote.com — a curated remote-jobs board for HR professionals, online since 2019,
with an email list of 16,000+ subscribers. This repo is the **2026 rebuild**: a static
Astro site backed by Airtable, replacing the previous Softr site. The rebuild's purpose
is SEO and AI-search visibility (see `SEO-AND-GEO.md`).

## Tech stack at a glance
- **Frontend/site:** Astro 5 (static generation), one CSS file, minimal vanilla JS. No
  framework runtime, no server.
- **Data:** Airtable (two tables). Read at build time only.
- **Automation:** `feed-sync` (Node, separate repo) — daily GitHub Action that fills
  Airtable from job feeds and triggers a rebuild.
- **Hosting:** any static host (Vercel/Netlify/Cloudflare). No database, no backend
  servers → near-zero infra cost and attack surface.
- **Dependencies:** `astro` and `marked` (Markdown) only. No heavy dependency tree.

## Why this is low-risk to operate
- Static output: nothing to exploit at runtime, trivially scalable on a CDN.
- Two small, readable dependencies.
- The site builds and previews with **no credentials** (mock-data fallback), so a
  reviewer can run it immediately.
- All URLs are generated from one module, so the sitemap and the routes can't drift.
- Rankings are protected: the 16 category URLs reproduce the exact ranking slugs, closed
  jobs stay indexable, and old URLs 301-redirect.

## How to evaluate it in 15 minutes
```bash
cd hrjobs-astro && npm install && npm run build && npm run preview
```
Then open the built pages and check:
- `/sitemap.xml`, `/llms.txt`, `/robots.txt` are generated.
- Any job page: view source → one `JobPosting` JSON-LD block.
- A category page: view source → `ItemList` + `FAQPage` + `BreadcrumbList`.
- `src/lib/airtable.mjs` — the data model (typedefs) and the only data access.
- `src/lib/landing.mjs` — the programmatic SEO engine.

## Document index
- `ARCHITECTURE.md` — how the pieces fit, directory map, design decisions.
- `DATA-MODEL.md` — Airtable schema, the 16 categories, sort order.
- `SEO-AND-GEO.md` — the full SEO + AI-search strategy and what's implemented.
- `OPERATIONS.md` — running, deploying, env vars, troubleshooting.

## Known one-time setup (not yet done)
- Real `logo.png` / `og-default.png`, `ORG.sameAs` profiles, newsletter + "Add a job"
  form URLs. All are clearly marked `TODO` in the code and listed in `OPERATIONS.md`.

## Key person / bus-factor note
The one deliberate coupling to know: the 16 categories live in both `util.mjs`
(`ALL_CATEGORIES`) and `feed-sync/config.mjs` (`HR_CATEGORIES`). Everything else is
conventional Astro. A mid-level front-end developer can own this codebase.
