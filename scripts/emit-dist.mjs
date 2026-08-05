// The Nitro "vercel" preset writes its artifacts to .vercel/output (Build
// Output API v3), which is exactly what Vercel deploys. Some hosts / CI
// checks (including the Lovable preview pipeline) expect the built static
// client under ./dist instead. This step mirrors the generated static assets
// into dist/ so both targets are satisfied from a single `npm run build`.
import { cp, rm, mkdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";

const SOURCE = ".vercel/output/static";
const TARGET = "dist";

const source = existsSync(SOURCE) ? SOURCE : null;
if (!source) {
  console.error(`[emit-dist] Nothing to copy: ${SOURCE} does not exist.`);
  process.exit(1);
}

await rm(TARGET, { recursive: true, force: true });
await mkdir(TARGET, { recursive: true });
await cp(source, TARGET, { recursive: true });

const info = await stat(TARGET);
if (!info.isDirectory()) {
  console.error("[emit-dist] Failed to create dist/.");
  process.exit(1);
}
console.log(`[emit-dist] Copied ${SOURCE} -> ${TARGET}`);
