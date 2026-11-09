# Architecture

HRJobsRemote is a **statically generated site (Astro) backed by Airtable**, rebuilt
daily. There is no application server and no database query at request time: every
page is pre-rendered HTML served from a CDN, which makes the site fast, cheap to run,
and fully crawlable by search engines and AI answer engines.

## The two codebases

| Repo | Role | Runs |
|------|------|------|
| `hrjobs-astro` | The website (this repo). Reads Airtable at build and renders all pages. | On each deploy / daily rebuild |
| `feed-sync` | The data pipeline. Pulls job feeds, filters to remote HR roles, writes to Airtable, triggers a rebuild. | Daily via GitHub Actions |

## Data flow

```
 Job XML feeds ──► feed-sync ──► Airtable ──► astro build ──► static HTML ──► CDN ──► visitors
 (JobLookup,       (filter,      (Jobs,       (this repo)     (dist/)                 + Googlebot
  WhatJobs)         enrich,       Blog)                                                + AI crawlers
                    dedupe)
```

1. **feed-sync** (separate repo) runs daily: fetches the XML feeds, keeps only genuine
   remote HR roles, enriches each (category, level, remote type, region), de-duplicates,
   and upserts into Airtable. It then calls the site's deploy hook.
2. The **deploy hook** triggers `astro build` on the host (Vercel/Netlify/Cloudflare).
3. **astro build** calls `src/lib/airtable.mjs`, which reads all Jobs + Blog records
   once, and renders every page (jobs, categories, companies, blog, sitemap, llms.txt).
4. The resulting `dist/` is served as static files.

Manual jobs added through the Airtable "Add a job" form appear in the same build and
are protected from the feed pipeline's auto-close/delete.

## Rendering model

- **SSG (static site generation)** via Astro, `output: static`, `build.format: "file"`,
  `trailingSlash: "never"` → clean URLs like `/remote-recruiter-jobs`.
- No JavaScript framework ships to the browser. The only client JS is a few lines of
  vanilla script: the job board's filter/search and a header-height measurement.
- This matters for SEO/GEO: all content is in the initial HTML, so crawlers that don't
  run JavaScript still see everything.

## Directory map (`hrjobs-astro/`)

```
astro.config.mjs        Site URL, trailing-slash + output config
public/
  robots.txt            Crawler rules (search + AI engines) + sitemap pointer
  _redirects            301 map from old Softr URLs → new URLs (rank preservation)
  logo.png,             (to be added) brand + social-share images
  og-default.png
src/
  layouts/Base.astro    The shell: <head> SEO + schema, header, newsletter band, footer
  components/
    JobBoard.astro      The listing UI (cards, client-side search + filters)
    Faq.astro           Visible FAQ accordion (paired with FAQPage schema)
    SearchBar.astro     (legacy) search form — no longer used on job pages
  pages/
    index.astro         Homepage (the board) + FAQ
    [landing].astro     ALL programmatic landing pages (category/region/level)
    jobs/[slug].astro   Job detail page
    companies/
      index.astro       Company directory
      [slug].astro      One page per company
    blog/
      index.astro       Blog index
      [slug].astro      Article page
    404.astro           Not-found page
    sitemap.xml.ts      Sitemap (endpoint)
    llms.txt.ts         AI-engine site map (endpoint)
  lib/
    airtable.mjs        Data source + domain-object typedefs (Job, Article)
    landing.mjs         Programmatic page + company page builders
    schema.mjs          All JSON-LD (structured data) builders
    faq.mjs             FAQ content (category + homepage)
    regions.mjs         Region label → country list (for job schema)
    util.mjs            Slugs, sorting, the 16 canonical categories
  data/
    mock-jobs.json      Fallback data so the site builds with no Airtable keys
    mock-articles.json
  styles/global.css     The whole design system (one file)
docs/                   This documentation
```

## Key design decisions

- **Airtable, not a custom DB.** At ~500–600 live jobs the volume is tiny; Airtable is
  the owner's editing UI, the feed's write target, and the "Add a job" form backend in
  one. No infra to run.
- **One source of truth for URLs.** `lib/landing.mjs` generates the page set used by
  both the routes and the sitemap, so they cannot drift.
- **16 categories are duplicated in two places on purpose** — `feed-sync/config.mjs`
  (the classifier) and `src/lib/util.mjs` `ALL_CATEGORIES` (the site). If you add or
  rename a category, update both. This is the one deliberate coupling to remember.
- **Closed jobs are retained, not deleted,** so earned rankings aren't lost; they're
  excluded from the sitemap and marked with a past `validThrough`.
