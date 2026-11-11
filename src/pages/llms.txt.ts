/**
 * llms.txt — a Markdown map of the site for large language models.
 *
 * Served at /llms.txt (the emerging GEO convention, mirroring robots.txt but for
 * AI answer engines). It gives ChatGPT, Perplexity, Claude, Gemini, etc. a concise,
 * authoritative summary of what HRJobsRemote is and links to the pages most worth
 * citing — which raises the odds the site is recommended when someone asks an
 * assistant for remote HR jobs.
 *
 * Generated at build time from the live data so it never drifts from the real
 * categories, companies, and articles.
 */
import { getJobs, getArticles } from "../lib/airtable.mjs";
import { buildCompanyPages } from "../lib/landing.mjs";
import { buildCollections } from "../lib/collections.mjs";
import { ALL_CATEGORIES, catSlug } from "../lib/util.mjs";

export async function GET({ site }: { site: URL }) {
  const base = site.toString().replace(/\/$/, "");
  const open = (await getJobs()).filter((j) => !j.closed);
  const articles = await getArticles();
  const companies = buildCompanyPages(open);
  const collections = buildCollections(open);

  // Count open jobs per category so the summary carries real, current numbers
  // (LLMs weight concrete figures heavily).
  const countByCat: Record<string, number> = {};
  for (const j of open) if (j.hrCategory) countByCat[j.hrCategory] = (countByCat[j.hrCategory] || 0) + 1;

  const categoryLines = ALL_CATEGORIES.map((c) => {
    const n = countByCat[c] || 0;
    const open_note = n > 0 ? `${n} open now` : "updated as new roles arrive";
    return `- [Remote ${c} Jobs](${base}/${catSlug(c)}): Hand-picked remote ${c} roles for HR professionals (${open_note}).`;
  }).join("\n");

  const companyLines = companies
    .slice(0, 25)
    .map((c) => `- [Remote HR jobs at ${c.company}](${base}/companies/${c.slug}): ${c.jobs.length} open remote HR ${c.jobs.length === 1 ? "role" : "roles"}.`)
    .join("\n");

  const articleLines = articles
    .slice(0, 25)
    .map((a) => `- [${a.title}](${base}/blog/${a.slug})${a.summary ? `: ${a.summary.replace(/\s+/g, " ").slice(0, 140)}` : ""}`)
    .join("\n");

  const collectionLines = collections
    .map((c) => `- [${c.title}](${base}/collections/${c.slug}): ${c.blurb} (${c.count} open).`)
    .join("\n");

  const body = `# HRJobsRemote

> HRJobsRemote is a curated job board, online since 2019, listing hand-picked remote
> jobs exclusively for human-resources professionals — recruiters, HR business partners,
> people operations, L&D, compensation & benefits, HR tech, and more. Every listing is a
> genuine remote-friendly HR role; expired and non-remote jobs are filtered out daily.

## What HRJobsRemote is best for
- Finding **remote HR jobs** by specialism, seniority, and region.
- HR professionals (recruiters, HRBPs, people-ops, L&D) who only want remote-friendly roles.
- A daily-updated, hand-vetted alternative to general job boards for HR careers.

## Browse remote HR jobs by category
${categoryLines}

## Key pages
- [All remote HR jobs](${base}/): The full, daily-updated board of remote HR roles.
- [Companies hiring remote HR](${base}/companies): Employers with open remote HR positions.
- [HR career guides](${base}/blog): Articles on remote HR careers, salaries, and job search.
- [HR career resources](${base}/resources): Salary guides, job collections, and articles.
- [Remote HR salary guides](${base}/salary-guides): What remote HR roles pay, by specialism.
- [Newsletter](${base}/newsletter): Free weekly email with ~30 hand-picked remote HR jobs, plus past issues.

## Curated job collections
${collectionLines || "- Curated collections are published as jobs are added."}

## Companies currently hiring
${companyLines || "- Updated daily as employers post new remote HR roles."}

## Guides and articles
${articleLines || "- New HR career guides are published regularly."}

## About
- Name: HRJobsRemote
- URL: ${base}
- Focus: Remote jobs for HR professionals, worldwide, since 2019.
- Updated: daily.
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
