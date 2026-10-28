import { chromium } from "/opt/npm-tools/node_modules/playwright/index.mjs";
import fs from "node:fs";
const D = new URL(".", import.meta.url).pathname;
const F = "/home/claude/emmaforyou/public/fonts/book/";
const fonts = { r: "BookSerif-Regular", b: "BookSerif-Bold", i: "BookSerif-Italic", bi: "BookSerif-BoldItalic" };
const fb = Object.fromEntries(Object.entries(fonts).map(([k, v]) => [k, fs.readFileSync(F + v + ".ttf").toString("base64")]));
const b = await chromium.launch();
const p = await b.newPage(); await p.setContent("<html><body></body></html>");
p.on("console", (m) => { if (m.type() === "error") console.log("console:", m.text()); });
await p.addScriptTag({ content: fs.readFileSync(D + "gen.bundle.js", "utf8") });
const r = await p.evaluate(([f, s1, s2]) => window.runGen(f, s1, s2), [fb, fs.readFileSync(D + "sample.md", "utf8"), fs.readFileSync(D + "sample2.txt", "utf8")]);
fs.mkdirSync(D + "out", { recursive: true });
for (const [k, v] of Object.entries(r.out)) fs.writeFileSync(D + "out/book." + k.replace(/^pdf_(.*)/, "$1.pdf").replace(/^(epub|docx|pdf)$/, "$1"), Buffer.from(v, "base64"));
fs.writeFileSync(D + "out/words.json", JSON.stringify(r.words));
for (const x of r.R) if (!x.ok) console.log("FAIL", x.name, x.info || "");
console.log(`${r.R.filter((x) => x.ok).length}/${r.R.length} passed`);
// optional: import a docx produced by LibreOffice
if (process.argv[2]) { const s = fs.readFileSync(process.argv[2]).toString("base64"); console.log(JSON.stringify(await p.evaluate((x) => window.importDocxB64(x), s)).slice(0, 1500)); }
await b.close();
