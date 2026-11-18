// src/pages/sitemap.xml.ts — full sitemap. Active jobs only; includes all
// programmatic landing pages and company pages. Closed jobs are excluded.
import { getJobs, getArticles } from "../lib/airtable.mjs";
import { buildLandingPages, buildCompanyPages } from "../lib/landing.mjs";
import { buildCollections } from "../lib/collections.mjs";
import { primaryByKey } from "../lib/util.mjs";

export async function GET({ site }) {
  const base = site.toString().replace(/\/$/, "");
  const jobs = await getJobs();
  const open = jobs.filter((j) => !j.closed);
  const articles = await getArticles();

  const landing = buildLandingPages(open);
  const companies = buildCompanyPages(open);
  const collections = buildCollections(open);

  const urls: { loc: string; lastmod?: string }[] = [
    { loc: `${base}/` },
    { loc: `${base}/blog` },
    { loc: `${base}/companies` },
    { loc: `${base}/resources` },
    { loc: `${base}/post-a-job` },
    { loc: `${base}/newsletter` },
    { loc: `${base}/about` },
    { loc: `${base}/terms` },
    { loc: `${base}/salary-guides` },
    { loc: `${base}/collections` },
    ...landing.filter((p) => !p.empty).map((p) => ({ loc: `${base}/${p.slug}`, lastmod: p.lastmod || undefined })),
    ...companies.map((c) => ({ loc: `${base}/companies/${c.slug}`, lastmod: c.lastmod || undefined })),
    ...collections.map((c) => ({ loc: `${base}/collections/${c.slug}`, lastmod: c.lastmod || undefined })),
    // One URL per duplicate group (the canonical copy); empty categories are noindex.
    ...[...primaryByKey(open).values()].map((j) => ({ loc: `${base}/jobs/${j.slug}`, lastmod: String(j.datePosted || "").slice(0, 10) || undefined })),
    ...articles.map((a) => ({ loc: `${base}/blog/${a.slug}`, lastmod: a.dateModified })),
  ];

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map((u) => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}</url>`)
      .join("\n") +
    `\n</urlset>\n`;

  return new Response(body, { headers: { "Content-Type": "application/xml" } });
}
