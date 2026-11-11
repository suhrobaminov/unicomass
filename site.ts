// Canonical production URL, used for SEO metadata (og:url, canonical link,
// JSON-LD) and the generated sitemap. Set VITE_SITE_URL (client) / SITE_URL
// (server) to your real domain once it's known — see .env.example.
const RAW =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SITE_URL) ||
  (typeof process !== "undefined" && process.env?.SITE_URL) ||
  "https://www.unicomass.online";

export const SITE_URL = RAW.replace(/\/+$/, "");
