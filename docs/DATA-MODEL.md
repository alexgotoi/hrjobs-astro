# Data model

All content lives in one **Airtable base** with two tables: **Jobs** and **Blog**.
`src/lib/airtable.mjs` reads them at build and normalizes the column names into the
`Job` and `Article` objects the app uses (see the `@typedef` blocks in that file).

## Jobs table

| Airtable column | App field | Notes |
|-----------------|-----------|-------|
| Title | title | Primary field. |
| Slug | slug | URL → `/jobs/{slug}`. Unique. |
| Source ID | sourceId | Feed upsert key. Blank for manual jobs. |
| Source | — | `manual` / `joblookup` / `whatjobs`. **`manual` is protected** from auto-close. |
| Status | status, closed | `open` / `closed` (optionally `review`). |
| Description | description | HTML allowed. |
| Apply URL | applyUrl | External application link. |
| Company | company | |
| Company Logo | companyLogo | Blank → colored monogram in the UI. |
| City / State / Country | city/state/country | Optional; mostly blank for fully-remote. |
| HR Category | hrCategory | One of the 16 canonical categories (see below). |
| Career Level | careerLevel | Executive/Director/Manager/Senior/Entry/Individual Contributor. |
| Remote Type | remoteType | Fully Remote/Hybrid/Partially Remote/Potentially Remote/On-site. |
| Remote Region | remoteRegion | US/UK/Canada/Europe/EMEA/LATAM/JAPAC/Worldwide. |
| Employment Type | employmentType | FULL_TIME / PART_TIME. |
| CPC | cpc | Cost-per-click from feed. **Hidden sort key, never displayed.** |
| Featured | featured | Manual pin: sorts above CPC order. |
| Date Posted | datePosted | ISO date. |
| Valid Through / Last Seen / Closed Date | closedDate etc. | Lifecycle fields managed by feed-sync. |

## Blog table

| Airtable column | App field | Notes |
|-----------------|-----------|-------|
| Title | title | Primary field. |
| Slug | slug | URL → `/blog/{slug}`. |
| Summary | summary | Answer-first TL;DR. |
| Body | body | **Markdown.** |
| Category | category | |
| Image | image | Optional cover / OG image. |
| Date Published / Date Modified | datePublished/dateModified | Shown as Published/Updated. |
| FAQ | faq | Plain text, alternating `Q:` / `A:` lines → parsed to Q&A + FAQPage schema. |
| Author | author | Not shown on page; defaults to "HRJobsRemote Editorial". |
| Published | — | Only checked rows are built. |

## The 16 canonical HR categories

Defined in **two** places that must stay in sync:
- `src/lib/util.mjs` → `ALL_CATEGORIES` (drives the site: footer, category pages, URLs)
- `feed-sync/config.mjs` → `HR_CATEGORIES` (the classifier that assigns the category)

```
Recruiter · HR Business Partner · HR Manager · HR Generalist · HR Admin ·
HR Operations · Sourcer · Learning and Development · Organizational Development ·
Compensation and Benefits · Payroll · People Analytics · HR Tech ·
Employer Branding · Diversity and Inclusion · HR Internship
```

Category → URL slug is `remote-{slug}-jobs`, except `HR Internship` → `remote-hr-internships`
(an override in `util.mjs CATEGORY_SLUG`, to match the existing ranking URL).

## Sort order (all listings)
`Featured` first → highest `CPC` → newest `datePosted`. See `sortJobs` in `util.mjs`.
CPC is never shown to visitors; it only orders the list.

## Sales/currency
Salary and currency are intentionally **not** collected or displayed (owner decision).
