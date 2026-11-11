# HRJobsRemote — website

Curated **remote jobs for HR professionals**, online since 2019. This is the Astro +
Airtable rebuild, optimized for search (incl. Google for Jobs) and AI answer engines.

Static site, no backend: Airtable is read at build time and every page is pre-rendered.
A companion repo, `feed-sync`, fills Airtable from job feeds daily and triggers rebuilds. 

## Quick start
```bash
npm install
npm run dev        # http://localhost:4321 (builds from mock data if no Airtable keys)
npm run build      # production build → dist/
npm run preview    # serve the built site
```
No environment variables required to run — it falls back to `src/data/mock-*.json`.

## Going live (summary)
1. Set `AIRTABLE_TOKEN` and `AIRTABLE_BASE_ID` in your host.
2. Deploy (`npm run build`, output `dist/`) to Vercel / Netlify / Cloudflare Pages.
3. Create a deploy hook; put its URL in feed-sync's `DEPLOY_HOOK_URL`.
4. Set `EMAILOCTOPUS_API_KEY` + `EMAILOCTOPUS_LIST_ID` (newsletter signup). Fill the `TODO`s:
   `ORG.sameAs` (`src/lib/schema.mjs`), and `public/logo.png` + `public/og-default.png`.
5. Submit `/sitemap.xml` to Google Search Console and Bing Webmaster Tools.

Full details in **[`docs/`](docs/)**:
- [Architecture](docs/ARCHITECTURE.md) · [Data model](docs/DATA-MODEL.md) ·
  [SEO & GEO](docs/SEO-AND-GEO.md) · [Operations](docs/OPERATIONS.md) ·
  [Due-diligence overview](docs/DUE-DILIGENCE.md)

## Stack
Astro 5 (static) · Airtable (data) · `marked` (Markdown) · one CSS file · minimal vanilla JS.
