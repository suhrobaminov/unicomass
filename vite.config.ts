import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

// Previously this project used @lovable.dev/vite-tanstack-config, a wrapper
// that transparently added: tanstackStart, viteReact, tailwindcss,
// tsConfigPaths, and a Nitro build targeting Cloudflare by default. That
// wrapper (and Lovable Cloud's dev-time sandbox/devtools/error-logger
// plugins, which only apply inside Lovable's own editor) has been removed.
// The plugins below reproduce the same behavior with the Nitro "vercel"
// preset so the app builds correctly for a standard Vercel deployment.
export default defineConfig({
  plugins: [
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    tanstackStart({
      // Redirect TanStack Start's bundled server entry to src/server.ts
      // (our SSR error-recovery wrapper around the generated handler).
      server: { entry: "server" },
    }),
    nitro({ preset: "vercel", prerender: { routes: ["/"], crawlLinks: false } }),
    // React's Vite plugin must come after TanStack Start's.
    viteReact(),
  ],
});
