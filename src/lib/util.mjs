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
