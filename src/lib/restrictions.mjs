// src/lib/restrictions.mjs — spots remote jobs that are limited to specific US states.
//
// Rule (Nov 2026): HRJobsRemote does not list state-specific remote jobs. Feed and
// careers-sourced jobs that match are left out of the build (see getJobs). Manual and
// featured jobs are reviewed by hand and are never filtered here.
//
// Tuned on all 779 open jobs (Nov 2026): 23 caught, no legitimate job caught. Note the
// Airtable "State" field is NOT used: feeds fill it with the employer's location for
// almost every job, so it says nothing about where you may work from.
export const STATES = ["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"];
export const CODES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"];

const NAME = `(?:${STATES.join("|")})`;
const CODE = `(?:${CODES.join("|")})`;
// Title signals (state names are matched case-insensitively, codes only in CAPITALS):
const T_NAME = new RegExp(`\\b${NAME}\\b`, "i");                                   // "Remote - Texas", "California Benefits Lead"
const T_CODE_LIST = new RegExp(`\\(\\s*${CODE}(?:\\s*[,/&]\\s*(?:and\\s+)?${CODE})+\\s*\\)`); // "(OH, IL, PA, MO)"
const T_CODE_SEP = new RegExp(`(?:^|[-–—|,(/:]\\s*|\\bin\\s+)${CODE}(?=\\s*(?:$|[-–—|,)/:]|\\s+(?:Compliance|Only|Based|Residents?|Focus|Travel)\\b))`); // "- CA Compliance", "Remote, TX", "in NY", "(CA Travel"
const T_LEAD_CODE = new RegExp(`^${CODE}\\s+[A-Z]`);                                  // "CA HR Generalist"
const T_CITY_CODE = new RegExp(`\\b[A-Z][a-z]+(?:\\s[A-Z][a-z]+)*,?\\s+${CODE}\\b`);        // "Renton, WA", "Charlottesville VA"
const T_LOCAL = /\blocal to\b|\bon-?site\b|\bhybrid\b/i;                                  // "remote or local to …"
const T_REMOTE_CODE = new RegExp(`\\bRemote\\s*[-–—,(:]?\\s*${CODE}\\b`);              // "Remote TX", "Remote (CA)"

// Description signals: an explicit "you must live in <state>" or a list of states.
const D_PHRASES = new RegExp(
  `(?:must|required to|need to|should)\\s+(?:currently\\s+)?(?:reside|live|be (?:located|based))\\s+in\\s+(?:the\\s+(?:state|states)\\s+of\\s+)?${NAME}` +
  `|(?:open|available|limited|restricted)\\s+(?:only\\s+)?to\\s+(?:candidates|applicants|residents)\\s+(?:in|of|located in|residing in)\\s+(?:the\\s+(?:state|states)\\s+of\\s+)?${NAME}` +
  `|(?:only|currently)\\s+(?:hiring|considering)\\s+(?:candidates\\s+)?(?:in|from)\\s+(?:the\\s+following\\s+states|${NAME})` +
  `|residents?\\s+of\\s+(?:the\\s+state\\s+of\\s+)?${NAME}\\s+only` +
  `|following\\s+states\\s*:`,
  "i");
// "…does NOT hire in the following states: AK, CA, HI" means open to all the others: keep.
const D_EXCLUSION = /\b(?:not|except|excluding|unable to)\b[^.]{0,80}$/i;

/** Why a job looks state-restricted, or "" if it doesn't. */
export function stateRestriction(title = "", description = "") {
  const t = String(title);
  let m;
  if ((m = t.match(T_CODE_LIST))) return `title lists states: ${m[0]}`;
  if ((m = t.match(T_NAME)) && !/washington,?\s*d\.?c\.?/i.test(t)) return `title names a state: ${m[0]}`;
  if ((m = t.match(T_REMOTE_CODE))) return `title: ${m[0]}`;
  if ((m = t.match(T_CODE_SEP))) return `title has state code: ${m[0].trim()}`;
  if ((m = t.match(T_LEAD_CODE))) return `title starts with state code: ${m[0]}`;
  if ((m = t.match(T_CITY_CODE))) return `title has city + state: ${m[0]}`;
  if ((m = t.match(T_LOCAL))) return `title asks for local/office presence: ${m[0]}`;
  const d = String(description).replace(/<[^>]+>/g, " ");
  if ((m = d.match(D_PHRASES))) {
    const before = d.slice(Math.max(0, m.index - 120), m.index);
    if (/following\s+states/i.test(m[0]) && D_EXCLUSION.test(before)) return "";
    return `description: "${m[0].slice(0, 80)}"`;
  }
  return "";
}
