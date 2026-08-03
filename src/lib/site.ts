/**
 * Canonical public origin for SEO metadata (canonical URLs, OG tags, sitemap).
 * Override per-environment with VITE_SITE_URL (must include the scheme, no
 * trailing slash) — e.g. VITE_SITE_URL=https://unicomass.online
 */
const FALLBACK = "https://unicomass.online";

const raw =
  (typeof import.meta !== "undefined" ? import.meta.env?.VITE_SITE_URL : undefined) ??
  (typeof process !== "undefined" ? process.env?.VITE_SITE_URL : undefined) ??
  FALLBACK;

export const SITE_URL = String(raw).replace(/\/+$/, "");

export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
