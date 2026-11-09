// src/lib/regions.mjs — Remote Region label → list of countries for
// applicantLocationRequirements. KEEP IN SYNC with REMOTE_REGIONS in feed-sync/config.mjs.
export const REMOTE_REGIONS = {
  "United States": ["United States"],
  "United Kingdom": ["United Kingdom"],
  "Canada": ["Canada"],
  "Europe": [
    "Austria", "Belgium", "Bulgaria", "Croatia", "Cyprus", "Czech Republic", "Denmark",
    "Estonia", "Finland", "France", "Germany", "Greece", "Hungary", "Ireland", "Italy",
    "Latvia", "Lithuania", "Luxembourg", "Malta", "Netherlands", "Poland", "Portugal",
    "Romania", "Slovakia", "Slovenia", "Spain", "Sweden", "United Kingdom", "Norway",
    "Switzerland", "Iceland",
  ],
  "EMEA": [
    "United Kingdom", "Germany", "France", "Netherlands", "Spain", "Italy", "Poland",
    "Romania", "Sweden", "Ireland", "Portugal", "United Arab Emirates", "Saudi Arabia",
    "Israel", "Turkey", "Qatar", "South Africa", "Egypt", "Nigeria", "Kenya", "Morocco",
  ],
  "LATAM": ["Mexico", "Brazil", "Argentina", "Chile", "Colombia", "Peru", "Uruguay", "Costa Rica"],
  "JAPAC": [
    "Japan", "Australia", "New Zealand", "Singapore", "India", "Hong Kong",
    "South Korea", "Philippines", "Indonesia", "Malaysia", "Vietnam", "Thailand", "China",
  ],
  "Worldwide": ["Worldwide"],
};

export function regionToCountries(label) {
  if (!label) return [];
  return REMOTE_REGIONS[label] || [label]; // a specific unlisted country is used as-is
}
