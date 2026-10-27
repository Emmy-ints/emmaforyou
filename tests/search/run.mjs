// Runs tests/search/search.spec.ts in Chromium (it needs DOMParser).
//   npx esbuild tests/search/entry.ts --bundle --format=iife --outfile=tests/search/.bundle.js "--define:import.meta.env={}"
//   node tests/search/run.mjs
import { chromium } from "playwright";
import fs from "node:fs";
const b = await chromium.launch();
const p = await b.newPage(); await p.setContent("<html><body></body></html>");
await p.addScriptTag({ content: fs.readFileSync(new URL("./.bundle.js", import.meta.url), "utf8") });
const r = await p.evaluate(() => window.runTests());
for (const x of r) if (!x.ok) console.log("FAIL", x.name, x.info || "");
console.log(`${r.filter((x) => x.ok).length}/${r.length} passed`);
await b.close(); process.exit(r.every((x) => x.ok) ? 0 : 1);
