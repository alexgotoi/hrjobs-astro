/**
 * src/lib/faq.mjs — answer-first FAQ content for category pages and the homepage.
 *
 * Why this exists (GEO): AI answer engines disproportionately cite clear,
 * self-contained question-and-answer content, and Q&A blocks are extracted far more
 * often than prose. Each FAQ is rendered as visible text AND as matching FAQPage
 * JSON-LD (the two must always match, or Google flags it). Answers are evergreen and
 * factual — no invented statistics — so they stay accurate as listings change.
 *
 * Keep the visible <details> output and the faqSchema() input driven by the SAME
 * array so they never diverge.
 */

// One-line description of the typical roles in each category. This is what makes
// every category FAQ genuinely different (not thin/duplicate content).
const CATEGORY_ROLE_BLURB = {
  "Recruiter":
    "full-cycle recruiters, technical and non-technical recruiters, and talent acquisition partners",
  "HR Business Partner":
    "HR business partners and people partners who advise managers on performance, org design and employee relations",
  "HR Manager":
    "HR managers, people managers and heads of HR who own HR for a team, site or business unit",
  "HR Generalist":
    "HR generalists who cover the full employee lifecycle across hiring, onboarding, relations and compliance",
  "HR Admin":
    "HR administrators, coordinators and assistants who keep HR operations and records running",
  "HR Operations":
    "HR operations and people-ops specialists who run HR processes, systems and service delivery",
  "Sourcer":
    "talent sourcers and sourcing specialists who build candidate pipelines for recruiting teams",
  "Learning and Development":
    "L&D specialists, training managers and instructional designers who build learning programs",
  "Organizational Development":
    "OD consultants and specialists focused on org design, change and effectiveness",
  "Compensation and Benefits":
    "compensation, benefits and total-rewards specialists who design and run pay and benefits",
  "Payroll":
    "payroll specialists, administrators and managers who run accurate, compliant payroll",
  "People Analytics":
    "people-analytics and HR-data specialists who turn workforce data into decisions",
  "HR Tech":
    "HRIS, HR systems and HR technology specialists (Workday, SuccessFactors and similar)",
  "Employer Branding":
    "employer-branding and recruitment-marketing specialists who grow an employer's reputation",
  "Diversity and Inclusion":
    "diversity, equity and inclusion specialists who build inclusive, equitable workplaces",
  "HR Internship":
    "HR interns and entry-level trainees starting a career in human resources",
};

/**
 * FAQ for a category listing page.
 * @param {string} cat  Canonical category name (e.g. "Recruiter").
 * @returns {{q: string, a: string}[]}
 */
export function categoryFaq(cat) {
  const roles = CATEGORY_ROLE_BLURB[cat] || `remote ${cat} roles for HR professionals`;
  return [
    {
      q: `Are the remote ${cat} jobs on HRJobsRemote fully remote?`,
      a: `Most ${cat} roles listed are fully remote. Every listing is labelled as fully remote, hybrid, or region-restricted, and you can filter to fully-remote-only roles. HRJobsRemote focuses on remote-friendly positions, so on-site-only jobs are filtered out.`,
    },
    {
      q: `What kinds of remote ${cat} roles are listed?`,
      a: `Listings include ${roles}. Each role is hand-checked to be a genuine remote-friendly ${cat} position before it appears.`,
    },
    {
      q: `How often are new remote ${cat} jobs added?`,
      a: `The board is updated daily. New remote ${cat} roles are added as employers post them, and expired listings are removed automatically, so what you see is current.`,
    },
    {
      q: `Is it free to apply for these ${cat} jobs?`,
      a: `Yes. Browsing and applying are free for job seekers — each listing links directly to the employer's own application page.`,
    },
    {
      q: `Can I get new remote ${cat} jobs by email?`,
      a: `Yes. Subscribe to the HRJobsRemote newsletter and new remote HR roles are sent to more than 16,000 HR professionals every week.`,
    },
  ];
}

/**
 * FAQ for the homepage — broad questions about the board itself.
 * @returns {{q: string, a: string}[]}
 */
export function homeFaq() {
  return [
    {
      q: "What is HRJobsRemote?",
      a: "HRJobsRemote is a curated job board, online since 2019, that lists hand-picked remote jobs exclusively for HR professionals — recruiters, HR business partners, people operations, L&D, compensation and benefits, HR tech and more.",
    },
    {
      q: "Are all the jobs fully remote?",
      a: "The board focuses on remote-friendly HR roles. Most are fully remote; some are hybrid or restricted to a region. Every listing states which, and you can filter to fully-remote-only roles.",
    },
    {
      q: "What HR roles can I find here?",
      a: "Remote roles across 16 HR specialisms: recruiting and sourcing, HR business partnering, HR management, HR generalist, people operations, L&D, organizational development, compensation and benefits, payroll, people analytics, HR tech, employer branding, diversity and inclusion, and HR internships.",
    },
    {
      q: "Is HRJobsRemote free to use?",
      a: "Yes, it is free for job seekers to browse and apply. Each listing links directly to the employer's own application page.",
    },
    {
      q: "How often are jobs updated?",
      a: "Daily. New remote HR roles are added as employers post them, and expired listings are removed automatically.",
    },
    {
      q: "How do I get remote HR jobs by email?",
      a: "Subscribe to the newsletter. New remote HR roles are sent to more than 16,000 HR professionals every week.",
    },
  ];
}
