import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { SITE_URL } from "@/lib/site";

// Served dynamically so the sitemap URL always matches the deployed origin.
const BODY = [
  "User-agent: *",
  "Allow: /",
  "Disallow: /auth",
  "Disallow: /reset-password",
  "Disallow: /dashboard",
  "Disallow: /find-your-major",
  "Disallow: /reports/",
  "",
  `Sitemap: ${SITE_URL}/sitemap.xml`,
  "",
].join("\n");

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async () =>
        new Response(BODY, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        }),
    },
  },
});
