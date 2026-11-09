# Operations runbook

Day-to-day running, deploys, and troubleshooting.

## How the site stays current
1. **feed-sync** (separate repo) runs daily on GitHub Actions: fetches the job feeds,
   filters to remote HR roles, writes to Airtable, then calls the site **deploy hook**.
2. The deploy hook rebuilds and redeploys the site. New/changed jobs go live within one
   build (a minute or two).
3. **Manual jobs** are added via the Airtable "Add a job" form. They appear on the next
   build and are never auto-closed by the feed.

## Local development
```bash
cd hrjobs-astro
npm install
npm run dev        # http://localhost:4321 — builds from mock data if no Airtable keys
npm run build      # production build → dist/
npm run preview    # serve the built dist/ locally
```
With no `AIRTABLE_TOKEN` / `AIRTABLE_BASE_ID` set, the site builds from
`src/data/mock-*.json` so it always runs.

## Environment variables
| Variable | Used by | Purpose |
|----------|---------|---------|
| `AIRTABLE_TOKEN` | site build + feed-sync | Airtable personal access token (read for site; read+write for feed-sync) |
| `AIRTABLE_BASE_ID` | site build + feed-sync | The Airtable base id (`app…`) |
| `DEPLOY_HOOK_URL` | feed-sync | The host's build-hook URL the feed calls after writing |

Set site vars in the host dashboard (Vercel/Netlify); set feed-sync vars as GitHub
Actions secrets. Never commit them.

## Deploy
- Host: Vercel, Netlify, or Cloudflare Pages. Build command `npm run build`, output `dist`.
- Add `AIRTABLE_TOKEN` + `AIRTABLE_BASE_ID` as environment variables.
- Create a **deploy hook** and put its URL in feed-sync's `DEPLOY_HOOK_URL` secret.
- Point the domain at the host. `public/_redirects` handles the old URL → new URL 301s.

## Config you edit by hand
| What | Where |
|------|-------|
| Newsletter form endpoint | `NEWSLETTER_ACTION` in `src/layouts/Base.astro` |
| "Add a job" form URL | `ADD_JOB_FORM` in `src/layouts/Base.astro` |
| Social profiles (sameAs) | `ORG.sameAs` in `src/lib/schema.mjs` |
| Add/rename a category | `ALL_CATEGORIES` in `src/lib/util.mjs` **and** `HR_CATEGORIES` in `feed-sync/config.mjs` |
| Feed URLs / filters | `feed-sync/config.mjs` |

## Troubleshooting
| Symptom | Likely cause / fix |
|---------|--------------------|
| A category page 404s | It's not in `ALL_CATEGORIES`, or the slug override is missing in `CATEGORY_SLUG`. |
| New jobs not appearing | feed-sync didn't run or the deploy hook didn't fire; check the GitHub Actions run and that the job's `Status` is `open`. |
| A job page has no "Apply" button | The job has no `Apply URL`, or it's closed. |
| Newsletter form does nothing | `NEWSLETTER_ACTION` is still the placeholder — set your provider's endpoint. |
| Build fails on Airtable | Token/base id wrong or lacking scope; the build falls back to mock data only when BOTH are unset. |
| Social preview image missing | Add `public/og-default.png`. |

## Backups
The data lives in Airtable — use Airtable's own revision history / snapshots. The code
lives in git. Together they fully reconstitute the site.
