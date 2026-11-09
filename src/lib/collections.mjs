/**
 * src/lib/collections.mjs — curated "job collections" (like NoDesk's collections).
 *
 * Unlike the programmatic taxonomy pages (category / region / level / type), a
 * collection is an EDITORIAL grouping that combines several axes under a theme —
 * e.g. "Entry-level & internship" spans a level and a category. That keeps each
 * collection distinct from the single-axis pages (no duplicate content) and gives
 * link-worthy, shareable landing pages.
 *
 * Each collection is defined once here with a `match(job)` predicate; the jobs are
 * filled from live data at build. Only collections with at least MIN_COLLECTION_JOBS
 * get a page (so we never ship thin/empty collections).
 *
 * To add a collection: append one entry below. No other file needs changing —
 * the index, the pages, the sitemap and llms.txt all read from buildCollections().
 */
import { sortJobs } from "./util.mjs";

const MIN_COLLECTION_JOBS = 3;
const newestDate = (jobs) => jobs.reduce((m, j) => (j.datePosted && j.datePosted > m ? j.datePosted : m), "");
const withinDays = (d, n) => d && Date.now() - new Date(d) <= n * 86400000;

/** @typedef {{slug:string,title:string,blurb:string,match:(j:any)=>boolean}} CollectionDef */

/** @type {CollectionDef[]} */
export const COLLECTIONS = [
  {
    slug: "entry-level-remote-hr-jobs",
    title: "Entry-Level & Internship Remote HR Jobs",
    blurb: "Remote HR roles for people starting out — entry-level positions, coordinator roles and HR internships you can do from home.",
    match: (j) => j.careerLevel === "Entry" || j.hrCategory === "HR Internship",
  },
  {
    slug: "remote-hr-leadership-jobs",
    title: "Remote HR Leadership Jobs",
    blurb: "Senior remote HR leadership — director, VP and head-of-people roles for experienced HR professionals.",
    match: (j) => ["Director", "Executive"].includes(j.careerLevel),
  },
  {
    slug: "work-from-anywhere-hr-jobs",
    title: "Work-From-Anywhere Remote HR Jobs",
    blurb: "Fully remote HR roles open to candidates worldwide — no country restriction, work from wherever you are.",
    match: (j) => j.remoteRegion === "Worldwide",
  },
  {
    slug: "remote-recruiting-talent-jobs",
    title: "Remote Recruiting & Talent Acquisition Jobs",
    blurb: "Remote recruiting roles — recruiters, talent acquisition partners and sourcers hiring from home.",
    match: (j) => ["Recruiter", "Sourcer"].includes(j.hrCategory),
  },
  {
    slug: "remote-people-ops-generalist-jobs",
    title: "Remote People Ops & HR Generalist Jobs",
    blurb: "Broad, hands-on remote HR roles — people operations and HR generalist positions covering the full employee lifecycle.",
    match: (j) => ["HR Operations", "HR Generalist"].includes(j.hrCategory),
  },
  {
    slug: "remote-hr-tech-analytics-jobs",
    title: "Remote HR Tech & People Analytics Jobs",
    blurb: "Data- and systems-focused remote HR roles — HRIS, HR technology and people-analytics positions.",
    match: (j) => ["HR Tech", "People Analytics"].includes(j.hrCategory),
  },
  {
    slug: "remote-comp-benefits-payroll-jobs",
    title: "Remote Compensation, Benefits & Payroll Jobs",
    blurb: "Remote total-rewards roles — compensation, benefits and payroll positions for HR professionals.",
    match: (j) => ["Compensation and Benefits", "Payroll"].includes(j.hrCategory),
  },
  {
    slug: "newest-remote-hr-jobs",
    title: "Newest Remote HR Jobs This Week",
    blurb: "The freshest remote HR roles — every job here was posted in the last seven days.",
    match: (j) => withinDays(j.datePosted, 7),
  },
];

/**
 * Fill each collection with its matching open jobs; keep only the ones that clear
 * the minimum. Sorted busiest-first for the index.
 * @param {import("./airtable.mjs").Job[]} open
 * @returns {Array<{slug,title,blurb,jobs,count,lastmod}>}
 */
export function buildCollections(open) {
  return COLLECTIONS
    .map((c) => {
      const jobs = sortJobs(open.filter(c.match));
      return { slug: c.slug, title: c.title, blurb: c.blurb, jobs, count: jobs.length, lastmod: newestDate(jobs) };
    })
    .filter((c) => c.count >= MIN_COLLECTION_JOBS)
    .sort((a, b) => b.count - a.count);
}
