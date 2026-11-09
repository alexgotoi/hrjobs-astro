/**
 * src/lib/landing.mjs — the programmatic SEO engine.
 *
 * From the flat list of open jobs it computes every landing page the site should
 * generate, and the company pages. Both the page route ([landing].astro) and the
 * sitemap import these builders, so the set of URLs can never drift between them.
 *
 * Page families produced (see buildLandingPages):
 *   1. Category         /remote-{category}-jobs            (all 16, even empty — they rank)
 *   2. Role × Region    /remote-{category}-jobs-in-{region}
 *   3. Role × Level     /{level}-remote-{category}-jobs
 *   4. Region × HR      /remote-hr-jobs-in-{region}
 *   5. Level × HR       /{level}-remote-hr-jobs
 *
 * Combo pages (2–5) are gated by MIN_JOBS so we never ship thin/doorway pages,
 * which are an SEO liability. Category pages (1) are exempt because those exact
 * URLs already rank and must not 404 on launch.
 */
import { catSlug, catBase, regionSlug, levelSlug, regionPhrase, companySlug, sortJobs, ALL_CATEGORIES } from "./util.mjs";

const MIN_JOBS = 3;            // minimum open jobs for a programmatic combo page
const distinct = (arr) => [...new Set(arr.filter(Boolean))];
const today = () => new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
const lvlDisp = (l) => (l === "Entry" ? "Entry-level" : l);

/** Most recent datePosted among a set of jobs → used as the page's sitemap <lastmod>. */
const newestDate = (jobs) =>
  jobs.reduce((max, j) => (j.datePosted && j.datePosted > max ? j.datePosted : max), "");

/**
 * Build every landing page from the open jobs.
 * @param {import("./airtable.mjs").Job[]} open  Open (non-closed) jobs.
 * @returns {Array<Object>} Page configs, each with: slug, kind, cat/region/level,
 *   h1, eyebrow, title, intro, itemListName, jobs, lastmod, and (category) empty.
 */
export function buildLandingPages(open) {
  const t = today();
  const cats = distinct(open.map((j) => j.hrCategory));
  const regions = distinct(open.map((j) => j.remoteRegion));
  const levels = distinct(open.map((j) => j.careerLevel)).filter((l) => l && l !== "Individual Contributor");

  const pages = [];
  const seen = new Set();
  const push = (cfg, min) => {
    if (cfg.jobs.length < min || seen.has(cfg.slug)) return;
    seen.add(cfg.slug);
    cfg.lastmod = newestDate(cfg.jobs); // freshness signal for the sitemap
    pages.push(cfg);
  };

  // 1. Category — a page for ALL 16 canonical categories, even empty ones, so the
  //    existing ranking URLs never 404. Empty categories show a friendly "adding soon"
  //    message (see [landing].astro) instead of a job board.
  for (const cat of ALL_CATEGORIES) {
    const jobs = open.filter((j) => j.hrCategory === cat);
    const empty = jobs.length === 0;
    push({
      slug: catSlug(cat), kind: "category", cat, region: null, level: null, empty,
      h1: `Remote ${cat} Jobs`, eyebrow: "Remote HR jobs",
      title: empty
        ? `Remote ${cat} Jobs | HRJobsRemote`
        : `Remote ${cat} Jobs — ${jobs.length} open roles | HRJobsRemote`,
      intro: empty
        ? `We don't have any remote ${cat} jobs open right now — but we're actively adding new roles. Subscribe below to be the first to hear when a remote ${cat} position goes live, and browse our other open HR categories in the meantime.`
        : `There are ${jobs.length} remote ${cat} jobs open right now on HRJobsRemote, updated ${t}. Every role is a remote-friendly ${cat} position for HR professionals.`,
      itemListName: `Remote ${cat} jobs`, showCategoryFilter: false, jobs,
    }, 0);
  }

  // 2. Role × Region
  for (const cat of cats) for (const region of regions) {
    const jobs = open.filter((j) => j.hrCategory === cat && j.remoteRegion === region);
    push({
      slug: `remote-${catBase(cat)}-jobs-in-${regionSlug(region)}`, kind: "role-region", cat, region, level: null,
      h1: `Remote ${cat} Jobs in ${regionPhrase(region)}`, eyebrow: `${cat} · ${regionPhrase(region)}`,
      title: `Remote ${cat} Jobs in ${regionPhrase(region)} — ${jobs.length} open | HRJobsRemote`,
      intro: `There are ${jobs.length} remote ${cat} jobs open to applicants in ${regionPhrase(region)}, updated ${t}. All are remote ${cat} roles you can do from ${regionPhrase(region)}.`,
      itemListName: `Remote ${cat} jobs in ${regionPhrase(region)}`, showCategoryFilter: false, jobs,
    }, MIN_JOBS);
  }

  // 3. Role × Level
  for (const cat of cats) for (const level of levels) {
    const jobs = open.filter((j) => j.hrCategory === cat && j.careerLevel === level);
    const lvl = lvlDisp(level);
    push({
      slug: `${levelSlug(level)}-remote-${catBase(cat)}-jobs`, kind: "role-level", cat, region: null, level,
      h1: `${lvl} Remote ${cat} Jobs`, eyebrow: `${cat} · ${lvl}`,
      title: `${lvl} Remote ${cat} Jobs — ${jobs.length} open | HRJobsRemote`,
      intro: `There are ${jobs.length} ${lvl.toLowerCase()} remote ${cat} jobs open right now on HRJobsRemote, updated ${t}. All are remote ${cat} roles at ${lvl.toLowerCase()} level.`,
      itemListName: `${lvl} remote ${cat} jobs`, showCategoryFilter: false, jobs,
    }, MIN_JOBS);
  }

  // 4. Region × HR (broad — spans all categories)
  for (const region of regions) {
    const jobs = open.filter((j) => j.remoteRegion === region);
    push({
      slug: `remote-hr-jobs-in-${regionSlug(region)}`, kind: "region-hr", cat: null, region, level: null,
      h1: `Remote HR Jobs in ${regionPhrase(region)}`, eyebrow: `Remote HR jobs · ${regionPhrase(region)}`,
      title: `Remote HR Jobs in ${regionPhrase(region)} — ${jobs.length} open | HRJobsRemote`,
      intro: `There are ${jobs.length} remote HR jobs open to applicants in ${regionPhrase(region)}, updated ${t}. Roles span recruiting, HRBP, people-ops, L&D and more — all remote-friendly.`,
      itemListName: `Remote HR jobs in ${regionPhrase(region)}`, showCategoryFilter: true, jobs,
    }, MIN_JOBS);
  }

  // 5. Level × HR (broad)
  for (const level of levels) {
    const jobs = open.filter((j) => j.careerLevel === level);
    const lvl = lvlDisp(level);
    push({
      slug: `${levelSlug(level)}-remote-hr-jobs`, kind: "level-hr", cat: null, region: null, level,
      h1: `${lvl} Remote HR Jobs`, eyebrow: `Remote HR jobs · ${lvl}`,
      title: `${lvl} Remote HR Jobs — ${jobs.length} open | HRJobsRemote`,
      intro: `There are ${jobs.length} ${lvl.toLowerCase()} remote HR jobs open right now on HRJobsRemote, updated ${t}. Roles span recruiting, HRBP, people-ops, L&D and more.`,
      itemListName: `${lvl} remote HR jobs`, showCategoryFilter: true, jobs,
    }, MIN_JOBS);
  }

  // 6. Employment type × HR (Full-time / Part-time) — adds long-tail SEO surface.
  const EMP = { FULL_TIME: "Full-Time", PART_TIME: "Part-Time" };
  for (const [empKey, empLabel] of Object.entries(EMP)) {
    const jobs = open.filter((j) => j.employmentType === empKey);
    const slugLabel = empLabel.toLowerCase(); // "full-time" / "part-time"
    push({
      slug: `${slugLabel}-remote-hr-jobs`, kind: "type-hr", cat: null, region: null, level: null,
      h1: `${empLabel} Remote HR Jobs`, eyebrow: `Remote HR jobs · ${empLabel}`,
      title: `${empLabel} Remote HR Jobs — ${jobs.length} open | HRJobsRemote`,
      intro: `There are ${jobs.length} ${slugLabel} remote HR jobs open right now on HRJobsRemote, updated ${t}. All are ${slugLabel} remote-friendly HR roles across recruiting, HRBP, people-ops, L&D and more.`,
      itemListName: `${empLabel} remote HR jobs`, showCategoryFilter: true, jobs,
    }, MIN_JOBS);
  }

  return pages;
}

/**
 * Internal links to related landing pages (shared role, region, or level). This
 * cross-linking is what gets the programmatic pages discovered and crawled.
 * @returns {{label: string, href: string}[]}
 */
export function relatedLinks(page, allPages, limit = 8) {
  return allPages
    .filter((p) => p.slug !== page.slug &&
      ((page.cat && p.cat === page.cat) || (page.region && p.region === page.region) || (page.level && p.level === page.level)))
    .slice(0, limit)
    .map((p) => ({ label: p.h1, href: `/${p.slug}` }));
}

/**
 * Group open jobs by employer into company pages (/companies/{slug}), busiest first.
 * @param {import("./airtable.mjs").Job[]} open
 * @returns {Array<{slug,company,logo,jobs,lastmod}>}
 */
export function buildCompanyPages(open) {
  const byCompany = new Map();
  for (const j of open) {
    if (!j.company) continue;
    if (!byCompany.has(j.company)) byCompany.set(j.company, []);
    byCompany.get(j.company).push(j);
  }
  return [...byCompany.entries()]
    .map(([company, jobs]) => ({
      slug: companySlug(company),
      company,
      logo: jobs.find((j) => j.companyLogo)?.companyLogo || "",
      jobs: sortJobs(jobs),
      lastmod: newestDate(jobs), // freshness signal for the sitemap
    }))
    .sort((a, b) => b.jobs.length - a.jobs.length || a.company.localeCompare(b.company));
}
