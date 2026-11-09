// src/lib/schema.mjs — JSON-LD builders. The heart of SEO + Google for Jobs.
import { regionToCountries } from "./regions.mjs";
import { isFullyRemote, isHybrid } from "./util.mjs";

/**
 * Canonical identity for HRJobsRemote.
 *
 * `sameAs` is important for GEO: AI engines cross-reference a brand across its
 * official profiles to decide it's a real, trustworthy entity. Fill these in with
 * the real profile URLs (LinkedIn, X, etc.) — the more consistent the identity
 * across the web, the more likely the site is cited.
 */
export const ORG = {
  name: "HRJobsRemote",
  url: "https://www.hrjobsremote.com",
  logo: "https://www.hrjobsremote.com/logo.png", // TODO: set your real logo URL
  description:
    "Curated remote job board for HR professionals — recruiters, HR business partners, " +
    "people operations, L&D and more. Hand-picked remote-friendly HR roles, updated daily, since 2019.",
  foundingDate: "2019",
  sameAs: [
    // TODO: add your real profiles, e.g.
    // "https://www.linkedin.com/company/hrjobsremote",
    // "https://x.com/hrjobsremote",
  ],
};

/** Organization JSON-LD — emitted site-wide from Base.astro. */
export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: ORG.name,
    url: ORG.url,
    logo: ORG.logo,
    description: ORG.description,
    foundingDate: ORG.foundingDate,
    ...(ORG.sameAs.length ? { sameAs: ORG.sameAs } : {}),
  };
}

// WebSite + SearchAction — enables a Google sitelinks search box.
// The homepage board reads ?q=, so the search target is /?q={query}.
export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: ORG.name,
    url: ORG.url,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${ORG.url}/?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * JobPosting JSON-LD — the single most important schema on the site (it's what makes
 * a job eligible for Google for Jobs). Location handling branches by remote type:
 *   • Fully Remote → TELECOMMUTE + applicantLocationRequirements, no jobLocation
 *   • Hybrid/Partial → physical jobLocation + TELECOMMUTE + ALR (Google reads this combo as hybrid)
 *   • Potentially/On-site → jobLocation only (never claim unverified remote — avoids a manual action)
 * @param {import("./airtable.mjs").Job} job
 * @param {string} jobUrl  Absolute canonical URL of the job page.
 */
export function jobPostingSchema(job, jobUrl) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description, // HTML allowed
    datePosted: job.datePosted || undefined,
    employmentType: job.employmentType || "FULL_TIME",
    industry: "Human Resources",
    // occupationalCategory sharpens Google-for-Jobs matching and gives AI engines
    // an explicit role taxonomy (e.g. "Recruiter", "HR Business Partner").
    ...(job.hrCategory ? { occupationalCategory: job.hrCategory } : {}),
    identifier: {
      "@type": "PropertyValue",
      name: ORG.name,
      value: job.sourceId,
    },
    hiringOrganization: {
      "@type": "Organization",
      name: job.company || ORG.name,
      ...(job.companyLogo ? { logo: job.companyLogo } : {}),
    },
    directApply: false, // application happens on the source site
    url: jobUrl,
  };

  // validThrough: open → omitted (avoid accidental expiry); closed → close date (in the past).
  if (job.closed && job.closedDate) schema.validThrough = job.closedDate;

  // Location, by remote type:
  //  • Fully Remote      → TELECOMMUTE + applicantLocationRequirements (no jobLocation)
  //  • Hybrid / Partial  → physical jobLocation + TELECOMMUTE + ALR (the combination = hybrid for Google)
  //  • Potentially / On-site → jobLocation only (we don't claim unverified remote)
  const physicalLocation = (job.city || job.state || job.country)
    ? {
        "@type": "Place",
        address: {
          "@type": "PostalAddress",
          ...(job.city ? { addressLocality: job.city } : {}),
          ...(job.state ? { addressRegion: job.state } : {}),
          ...(job.country ? { addressCountry: job.country } : {}),
        },
      }
    : null;

  const countries = regionToCountries(job.remoteRegion);
  const alr = (countries.length ? countries : [job.country].filter(Boolean)).map((name) => ({
    "@type": "Country",
    name,
  }));
  const alrValue = alr.length ? (alr.length === 1 ? alr[0] : alr) : null;

  if (isFullyRemote(job.remoteType)) {
    schema.jobLocationType = "TELECOMMUTE";
    if (alrValue) schema.applicantLocationRequirements = alrValue;
  } else if (isHybrid(job.remoteType)) {
    if (physicalLocation) schema.jobLocation = physicalLocation;
    schema.jobLocationType = "TELECOMMUTE";
    if (alrValue) schema.applicantLocationRequirements = alrValue;
  } else {
    // Potentially Remote / On-site → physical location only
    if (physicalLocation) schema.jobLocation = physicalLocation;
  }

  return schema;
}

export function breadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

export function blogPostingSchema(article, articleUrl) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.summary,
    ...(article.image ? { image: article.image } : {}),
    datePublished: article.datePublished,
    dateModified: article.dateModified,
    author: {
      "@type": "Organization",
      name: ORG.name,
    },
    publisher: {
      "@type": "Organization",
      name: ORG.name,
      logo: { "@type": "ImageObject", url: ORG.logo },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
  };
}

export function faqSchema(faq) {
  if (!faq || !faq.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export const jsonLd = (obj) => JSON.stringify(obj);
