import { defineConfig } from "astro/config";

// CHANGE to your real domain before deploy.
export const SITE = "https://www.hrjobsremote.com";

export default defineConfig({
  site: SITE,
  // Consistent, no-trailing-slash URLs (matches our canonicals + internal links).
  trailingSlash: "never",
  build: { format: "file" },
});
