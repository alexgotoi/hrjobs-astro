/**
 * src/lib/airtable.mjs — the site's single data source, read at build time.
 *
 * The site is a static build (SSG): this module is called during `astro build`,
 * pulls every Jobs/Blog record from Airtable once, normalizes the raw Airtable
 * field names into clean JS objects, and the pages render from those. There is no
 * runtime/database call when a visitor loads a page — everything is pre-rendered.
 *
 * If AIRTABLE_TOKEN / AIRTABLE_BASE_ID are not set, it falls back to the committed
 * mock data (src/data/*.json) so the project builds and previews with zero config.
 *
 * The two exported functions, getJobs() and getArticles(), are the ONLY way the
 * rest of the codebase reads data. The normalizeJob/normalizeArticle functions
 * below are the contract between Airtable's columns and the app's domain objects —
 * see the @typedef blocks for the full shape.
 *
 * @typedef {Object} Job
 * @property {string}  sourceId       Unique id from the feed (upsert key); "" for manual jobs.
 * @property {string}  status         "open" | "closed".
 * @property {boolean} closed         Convenience flag (status === "closed").
 * @property {string}  title          Job title.
 * @property {string}  slug           URL slug → /jobs/{slug} (must be unique).
 * @property {string}  description    Job description (HTML allowed).
 * @property {string}  applyUrl       External application link.
 * @property {string}  company        Employer name.
 * @property {string}  companyLogo    Logo URL ("" → the UI shows a colored monogram).
 * @property {string}  city           Optional physical location parts (mostly blank for remote).
 * @property {string}  state
 * @property {string}  country
 * @property {string}  hrCategory     One of the 16 canonical categories (see util.mjs ALL_CATEGORIES).
 * @property {string}  careerLevel    Executive | Director | Manager | Senior | Entry | Individual Contributor.
 * @property {string}  remoteType     Fully Remote | Hybrid | Partially Remote | Potentially Remote | On-site.
 * @property {string}  remoteRegion   Region label for applicantLocationRequirements (see regions.mjs).
 * @property {string}  employmentType FULL_TIME | PART_TIME.
 * @property {number}  cpc            Cost-per-click from the feed — hidden sort key (never displayed).
 * @property {boolean} featured       Manual pin: sorts above the CPC order (for sponsored placements).
 * @property {string}  datePosted     ISO date (YYYY-MM-DD).
 * @property {string}  closedDate     ISO date a job was closed (drives validThrough on closed pages).
 *
 * @typedef {Object} Article
 * @property {string} slug
 * @property {string} title
 * @property {string} summary        Answer-first TL;DR shown near the top.
 * @property {string} body           Markdown.
 * @property {string} author
 * @property {string} category
 * @property {string} image
 * @property {string} datePublished
 * @property {string} dateModified
 * @property {{q:string,a:string}[]} faq  Parsed from the Airtable FAQ text field.
 */
import mockJobs from "../data/mock-jobs.json";
import mockArticles from "../data/mock-articles.json";

// Credentials come from the environment (never commit them). Absent → mock mode.
const TOKEN = import.meta.env.AIRTABLE_TOKEN || process.env.AIRTABLE_TOKEN;
const BASE = import.meta.env.AIRTABLE_BASE_ID || process.env.AIRTABLE_BASE_ID;

async function fetchAll(table) {
  const records = [];
  let offset;
  do {
    const url = new URL(`https://api.airtable.com/v0/${BASE}/${encodeURIComponent(table)}`);
    url.searchParams.set("pageSize", "100");
    if (offset) url.searchParams.set("offset", offset);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
    if (!res.ok) throw new Error(`Airtable ${table} ${res.status}: ${await res.text()}`);
    const data = await res.json();
    records.push(...data.records.map((r) => ({ id: r.id, ...r.fields })));
    offset = data.offset;
  } while (offset);
  return records;
}

const live = Boolean(TOKEN && BASE);

/**
 * All jobs (open + closed). Closed jobs are kept because their pages stay indexable
 * with a "[Closed]" label and a past validThrough — losing them would drop earned
 * rankings. Callers filter to open jobs where needed.
 * @returns {Promise<Job[]>}
 */
export async function getJobs() {
  const rows = live ? await fetchAll("Jobs") : mockJobs;
  return rows
    .filter((j) => j.Status === "open" || j.Status === "closed")
    .map(normalizeJob);
}

/**
 * All published blog articles.
 * @returns {Promise<Article[]>}
 */
export async function getArticles() {
  const rows = live ? await fetchAll("Blog") : mockArticles;
  return rows.filter((a) => a.Published).map(normalizeArticle);
}

function normalizeJob(j) {
  return {
    sourceId: j["Source ID"],
    status: j.Status,
    closed: j.Status === "closed",
    title: j.Title || "",
    slug: j.Slug || "",
    description: j.Description || "",
    applyUrl: j["Apply URL"] || "",
    company: j.Company || "",
    companyLogo: j["Company Logo"] || "",
    city: j.City || "",
    state: j.State || "",
    country: j.Country || "",
    hrCategory: j["HR Category"] || "",
    careerLevel: j["Career Level"] || "",
    remoteType: j["Remote Type"] || (j.Remote ? "Fully Remote" : "On-site"),
    remoteRegion: j["Remote Region"] || "",
    employmentType: j["Employment Type"] || "FULL_TIME",
    cpc: Number(j["CPC"]) || 0,
    featured: j["Featured"] === true || j["Featured"] === "true",
    datePosted: j["Date Posted"] || "",
    closedDate: j["Closed Date"] || "",
  };
}

function normalizeArticle(a) {
  return {
    slug: a.Slug || "",
    title: a.Title || "",
    summary: a.Summary || "",      // answer capsule (BLUF) — 2-4 sentences
    body: a.Body || "",            // Markdown
    author: a.Author || "HRJobsRemote Editorial",
    authorBio: a["Author Bio"] || "",
    category: a.Category || "",
    image: a.Image || "",
    datePublished: a["Date Published"] || "",
    dateModified: a["Date Modified"] || a["Date Published"] || "",
    faq: parseFaq(a.FAQ),          // "Q: ...\nA: ..." pairs, one per block
  };
}

// FAQ stored in Airtable as plain text: lines alternating "Q: ..." and "A: ...".
function parseFaq(raw) {
  if (!raw) return [];
  const out = [];
  let q = null;
  for (const line of String(raw).split("\n")) {
    const t = line.trim();
    if (/^q\s*[:.\-]/i.test(t)) q = t.replace(/^[^:.\-]+[:.\-]\s*/, "");
    else if (/^a\s*[:.\-]/i.test(t) && q) {
      out.push({ q, a: t.replace(/^[^:.\-]+[:.\-]\s*/, "") });
      q = null;
    }
  }
  return out;
}
