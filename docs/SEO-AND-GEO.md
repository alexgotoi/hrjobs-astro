# SEO & GEO

The site is built to win two kinds of traffic: traditional search (Google, incl.
Google for Jobs) and **generative engines** (ChatGPT, Perplexity, Claude, Gemini) —
so that when someone asks an assistant for remote HR jobs, HRJobsRemote is recommended.

## Traditional SEO

- **Server-rendered HTML.** All content is in the initial HTML (no JS required), unlike
  the previous Softr site. This is the core reason for the rebuild.
- **Clean, stable URLs.** `/remote-{category}-jobs`, `/jobs/{slug}`, `/companies/{slug}`.
  The 16 category URLs reproduce the exact slugs that already ranked, so rankings carry
  over. `public/_redirects` 301-maps the old blog/region/utility URLs.
- **One H1 per page**, unique `<title>` and meta description per page, canonical URL on
  every page, OpenGraph + Twitter cards for link previews.
- **Programmatic landing pages** (`lib/landing.mjs`) for role×region and role×level
  combinations, each gated by a minimum job count so no thin pages are published.
- **Internal linking**: footer lists all 16 categories; landing pages cross-link via
  "Related searches"; job pages link to company + category; company names link through.
- **XML sitemap** (`/sitemap.xml`) with `lastmod` freshness dates; **robots.txt** opens
  the site to all major search + AI crawlers.
- **Google for Jobs**: every job page emits `JobPosting` JSON-LD (see below).

## Structured data (JSON-LD) — `src/lib/schema.mjs`

| Schema | Where | Purpose |
|--------|-------|---------|
| `Organization` | every page | Brand entity; `sameAs` ties it to official profiles |
| `WebSite` + `SearchAction` | every page | Enables a Google sitelinks search box |
| `JobPosting` | job pages | **Google for Jobs eligibility.** Includes title, description, datePosted, employmentType, industry, occupationalCategory, hiringOrganization, and remote-aware location (see below) |
| `BreadcrumbList` | job, landing, company | Breadcrumb trails in results |
| `ItemList` | landing, company | Marks the page as a list of jobs |
| `BlogPosting` | articles | Article rich results |
| `FAQPage` | homepage, category pages | **High GEO value** — AI engines cite Q&A heavily |

### JobPosting location logic
- **Fully Remote** → `jobLocationType: TELECOMMUTE` + `applicantLocationRequirements`
  (the eligible countries from `regions.mjs`), no physical `jobLocation`.
- **Hybrid / Partially Remote** → physical `jobLocation` + TELECOMMUTE + requirements
  (Google reads the combination as hybrid).
- **Potentially Remote / On-site** → physical `jobLocation` only. We never claim remote
  we can't verify, which avoids a Google manual action.

## GEO (getting cited by AI answer engines)

The tactics below follow current (2026) generative-engine-optimization guidance.

1. **`/llms.txt`** (`src/pages/llms.txt.ts`) — a Markdown summary of the site for LLMs,
   generated from live data (what the site is, categories with live counts, key pages,
   companies, articles). This is the AI-era equivalent of a sitemap and a top-cited
   quick win.
2. **Answer-first FAQ content** (`src/lib/faq.mjs`, rendered by `Faq.astro`) on the
   homepage and every populated category page — visible Q&A **and** matching `FAQPage`
   schema. Self-contained Q&A is the format AI engines extract and cite most.
3. **Open to AI crawlers** (`public/robots.txt`): GPTBot, OAI-SearchBot, ChatGPT-User,
   ClaudeBot, anthropic-ai, PerplexityBot, Google-Extended, Applebot-Extended, Amazonbot,
   Meta-ExternalAgent, cohere-ai and more are explicitly allowed.
4. **Concrete numbers + freshness**: pages state real open-job counts and "updated daily";
   the sitemap carries `lastmod` dates. AI engines weight specific facts and recency.
5. **`max-image-preview:large` robots meta** so Google/AI can use large image previews.
6. **Entity consistency**: `Organization.sameAs` in `schema.mjs` should list the real
   LinkedIn/X/etc. profiles — AI engines cross-check these to trust the brand.

## What the owner still needs to do (one-time)

- Fill `ORG.sameAs` in `src/lib/schema.mjs` with real social profiles.
- Add real `public/logo.png` and `public/og-default.png`.
- After launch, submit `/sitemap.xml` to **Google Search Console** and **Bing Webmaster
  Tools** (ChatGPT uses the Bing index).
- Validate a few job pages with Google's Rich Results Test.

## Measuring GEO
Track **citation rate**, not rank: periodically ask ChatGPT/Perplexity/Claude questions
like "best remote HR job boards" or "where can I find remote recruiter jobs" and see
whether HRJobsRemote is named. Re-check monthly.
