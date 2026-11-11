// src/lib/util.mjs — small shared helpers.

// Some existing category URLs don't follow the `remote-{slug}-jobs` pattern.
// Override them here so the new build reproduces the exact URLs that already rank.
export const CATEGORY_SLUG = {
  "HR Internship": "remote-hr-internships",
};
export const catSlug = (c) =>
  CATEGORY_SLUG[c] ||
  `remote-${String(c || "").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-jobs`;

// --- remote type ---
export const isFullyRemote = (t) => t === "Fully Remote";
export const isHybrid = (t) => t === "Hybrid" || t === "Partially Remote";
export const isRemoteish = (t) =>
  ["Fully Remote", "Hybrid", "Partially Remote", "Potentially Remote"].includes(t);

// Short label used in listings.
export function shortRemoteLabel(j) {
  if (j.remoteType === "Fully Remote") return `Remote${j.remoteRegion ? ` · ${j.remoteRegion}` : ""}`;
  if (j.remoteType === "Hybrid" || j.remoteType === "Partially Remote")
    return `${j.remoteType}${(j.city || j.state) ? ` · ${[j.city, j.state].filter(Boolean).join(", ")}` : ""}`;
  if (j.remoteType === "Potentially Remote") return "Potentially remote";
  return [j.city, j.state].filter(Boolean).join(", ") || "On-site";
}

// --- programmatic landing + company slugs ---
export const REGION_SLUG = {
  "United States": "us", "United Kingdom": "uk", "Canada": "canada",
  "Europe": "europe", "EMEA": "emea", "LATAM": "latam", "JAPAC": "apac", "Worldwide": "worldwide",
};
export const REGION_PHRASE = {
  "United States": "the US", "United Kingdom": "the UK", "JAPAC": "APAC",
};
export const LEVEL_SLUG = {
  "Senior": "senior", "Manager": "manager", "Director": "director",
  "Executive": "executive", "Entry": "entry-level",
};
export const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const catBase = (c) => slugify(c);                       // "HRBP" -> "hrbp"
export const regionSlug = (r) => REGION_SLUG[r] || slugify(r);
export const levelSlug = (l) => LEVEL_SLUG[l] || slugify(l);
export const regionPhrase = (r) => REGION_PHRASE[r] || r;       // for prose ("in the US")
export const companySlug = (c) => slugify(c);

// Example "featured" cards shown ONLY while there is not a single real featured job
// (e.g. at launch). They are clearly labelled as examples and are NOT real listings:
// JobBoard renders them above the board, links them to the "feature your job" form, and
// excludes them from the job count and filters. The moment a real job is marked Featured
// in Airtable, these disappear automatically (see index.astro).
export const FEATURED_PLACEHOLDERS = [
  {
    placeholder: true,
    featured: true,
    title: "Your featured HR role could be here",
    company: "Your company",
    hrCategory: "HR Business Partner",
    employmentType: "FULL_TIME",
    careerLevel: "",
    remoteType: "Fully Remote",
    remoteRegion: "Worldwide",
  },
  {
    placeholder: true,
    featured: true,
    title: "Get seen by 16,000+ HR professionals",
    company: "Your company",
    hrCategory: "Recruiter",
    employmentType: "FULL_TIME",
    careerLevel: "",
    remoteType: "Fully Remote",
    remoteRegion: "",
  },
];

// Listing sort: Featured pins first, then highest CPC, then newest.
export const sortJobs = (jobs) =>
  [...jobs].sort((a, b) =>
    (b.featured === true) - (a.featured === true) ||
    (Number(b.cpc) || 0) - (Number(a.cpc) || 0) ||
    new Date(b.datePosted || 0) - new Date(a.datePosted || 0)
  );

// The 16 canonical HR categories — MUST match feed-sync/config.mjs HR_CATEGORIES.
// Drives the footer + generates a landing page for every category (even empty ones),
// so the existing ranking URLs never 404. Order = footer display order.
export const ALL_CATEGORIES = [
  "Recruiter",
  "HR Business Partner",
  "HR Manager",
  "HR Generalist",
  "HR Admin",
  "HR Operations",
  "Sourcer",
  "Learning and Development",
  "Organizational Development",
  "Compensation and Benefits",
  "Payroll",
  "People Analytics",
  "HR Tech",
  "Employer Branding",
  "Diversity and Inclusion",
  "HR Internship",
];

// --- UTM tracking on outbound links -------------------------------------------------
// Tagged: links to our own excelforhr.com, and Apply links on manual / careers-sourced /
// featured jobs (so employers and our own analytics see the traffic came from here).
// NEVER tagged: jobs from the XML feeds (WhatJobs / JobLookup) — they are paid per click
// and their URLs must stay exactly as the feed delivered them.
export const FEED_SOURCES = ["joblookup", "whatjobs"];
const FEED_HOSTS = /(^|\.)(whatjobs|joblookup)\./i;

/** Adds utm_* params to an http(s) URL. Leaves the URL untouched if it isn't http(s)
 *  or already carries utm_source (an employer's own tracking always wins). */
export function withUtm(url, params) {
  let u;
  try { u = new URL(url); } catch { return url; }
  if (!/^https?:$/.test(u.protocol) || u.searchParams.has("utm_source")) return url;
  for (const [k, v] of Object.entries(params)) if (v) u.searchParams.set(k, v);
  return u.toString();
}

/** True for jobs that came from the XML feeds — by Source, or by the link's domain. */
export function isFeedJob(job) {
  if (FEED_SOURCES.includes(String(job.source || "").toLowerCase())) return true;
  try { return FEED_HOSTS.test(new URL(job.applyUrl).hostname); } catch { return false; }
}

/** The Apply link to render for a job. `placement` says where on the site it was clicked. */
export function applyHref(job, placement) {
  if (!job.applyUrl || isFeedJob(job)) return job.applyUrl;
  return withUtm(job.applyUrl, {
    utm_source: "hrjobsremote",
    utm_medium: "job_board",
    utm_campaign: job.featured ? "featured_job" : "job_listing",
    utm_content: placement,
  });
}

/** Link to excelforhr.com, tagged with where on the site it sits. */
export const excelLink = (placement) =>
  withUtm("https://excelforhr.com/", {
    utm_source: "hrjobsremote",
    utm_medium: "referral",
    utm_campaign: "hrjobsremote_site",
    utm_content: placement,
  });
