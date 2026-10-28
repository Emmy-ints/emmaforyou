/** Unit checks for the book tools' pure logic. Run: esbuild tests/books/logic.spec.ts --bundle --platform=node --alias:@=./src | node */
import { calc, blankScenario, presetValues } from "@/lib/books/royalty";
import { buildPlan, toIcs, toCsv } from "@/lib/books/launch";
import { lintDescription, lintKeyword } from "@/lib/books/listing";
import { analyze, syllables } from "@/lib/books/analyze";
import { wrapDims } from "@/lib/books/specs";
import { minGutter } from "@/lib/books/layout";
import { runChecks } from "@/lib/books/readiness";
import { parseText, bookWords, validIsbn } from "@/lib/books/manuscript";

const R: [string, boolean, unknown?][] = [];
const t = (n: string, ok: boolean, info?: unknown) => R.push([n, ok, info]);

// royalty (KDP formulas)
const e = calc({ ...blankScenario("e"), ...presetValues("kdp-ebook-70"), price: 4.99, sizeMb: 2 });
t("eBook 70%: 0.7 × (4.99 − 0.30) = 3.28", e.perCopy === 3.28, e);
const e35 = calc({ ...blankScenario("e"), ...presetValues("kdp-ebook-35"), price: 2.99 });
t("eBook 35%: 0.35 × 2.99 = 1.05", e35.perCopy === 1.05, e35.perCopy);
const pb = calc({ ...blankScenario("p"), ...presetValues("kdp-paperback-60"), price: 12.99, pages: 300 });
t("Paperback: printing 1 + 300 × 0.012 = 4.60 (KDP example)", pb.printing === 4.6, pb.printing);
t("Paperback: 0.6 × 12.99 − 4.60 = 3.19", pb.perCopy === 3.19, pb.perCopy);
t("Paperback: minimum price = printing ÷ 0.6 = 7.67", pb.minPrice === 7.67, pb.minPrice);
const low = calc({ ...blankScenario("p"), ...presetValues("kdp-paperback-60"), price: 5, pages: 300 });
t("Paperback below min price warns", low.warnings.some((w) => /at least 7\.67/.test(w)), low.warnings);
const vat = calc({ ...blankScenario("e"), ...presetValues("kdp-ebook-35"), price: 3.6, vatPct: 20 });
t("VAT removed before royalty: 0.35 × 3.00 = 1.05", vat.perCopy === 1.05, vat.perCopy);
const be = calc({ ...blankScenario("e"), ...presetValues("kdp-ebook-70"), price: 4.99, sizeMb: 2, oneOffCosts: 500, monthlySales: 50, monthlyCosts: 20 });
t("Break-even copies = ceil(500 / 3.28) = 153", be.breakEvenCopies === 153, be.breakEvenCopies);
t("Break-even months = ceil(500 / (164 − 20)) = 4", be.breakEvenMonths === 4, be.breakEvenMonths);
const zero = calc({ ...blankScenario("d"), ...presetValues("direct"), price: 0 });
t("Zero price: no break-even, warning", zero.breakEvenCopies === null && zero.warnings.length > 0);

// print cover dimensions (KDP)
const w = wrapDims({ trimW: 6, trimH: 9, pages: 300, paper: "white" });
t("Wrap 6×9, 300 white pages: spine 0.6756, width 12.926, height 9.25", Math.abs(w.spine - 0.6756) < 1e-4 && Math.abs(w.width - 12.9256) < 1e-4 && w.height === 9.25, w);
t("Spine text only from 79 pages", !wrapDims({ trimW: 6, trimH: 9, pages: 78, paper: "white" }).spineText && wrapDims({ trimW: 6, trimH: 9, pages: 79, paper: "white" }).spineText);
t("Cream paper thicker (0.0025/page)", Math.abs(wrapDims({ trimW: 5, trimH: 8, pages: 200, paper: "cream" }).spine - 0.5) < 1e-9);
t("Gutter by page count (0.375 / 0.5 / 0.625 / 0.75 / 0.875 in)", [100, 200, 400, 600, 800].map(minGutter).join() === [27, 36, 45, 54, 63].join(), [100, 200, 400, 600, 800].map(minGutter));

// launch plan
const plan = buildPlan({ title: "Book", launchDate: "2027-01-20", today: "2026-10-28", format: "both", audience: "", channels: ["email", "arc", "instagram"], budget: "0", preorder: true });
t("Launch plan has dated tasks in order", plan.tasks.length >= 12 && plan.tasks.every((x, i, a) => i === 0 || a[i - 1].due <= x.due), plan.tasks.length);
t("Launch day task on the launch date", plan.tasks.some((x) => x.id === "launch" && x.due === "2027-01-20"));
t("No ad tasks without budget", !plan.tasks.some((x) => x.channel === "ads"));
t("Email outline when email chosen", plan.emails.length === 5);
const late = buildPlan({ title: "B", launchDate: "2026-11-05", today: "2026-10-28", format: "ebook", audience: "", channels: ["instagram"], budget: "0", preorder: false });
t("Short lead time warns and never schedules in the past", late.warnings.length > 0 && late.tasks.every((x) => x.due >= "2026-10-28"));
const ics = toIcs("Book", plan.tasks);
t("ICS: VCALENDAR with one VEVENT per task, CRLF, ≤75-octet lines", ics.startsWith("BEGIN:VCALENDAR\r\n") && (ics.match(/BEGIN:VEVENT/g) ?? []).length === plan.tasks.length && ics.split("\r\n").every((l) => new TextEncoder().encode(l).length <= 75));
t("CSV header and rows", toCsv(plan.tasks).split("\n").length === plan.tasks.length + 1);

// listing rules
t("Description lint: link, emoji, review, claim, price", lintDescription("Visit www.x.com 🙂 “Brilliant!” — A Reader. The #1 bestseller, only $2.99").length >= 4);
t("Clean description passes", lintDescription("Amara has one week to save her family's market. ".repeat(6)).length === 0);
t("Keyword lint: quality words, Amazon names, title repeat", !!lintKeyword("best thriller", "x") && !!lintKeyword("kindle unlimited romance", "x") && !!lintKeyword("river promise saga", "The River's Promise") && lintKeyword("lagos family saga", "The River's Promise") === null);

// analysis
t("Syllable estimate", syllables("readability") >= 4 && syllables("the") === 1);
const a = analyze("The cat sat on the mat. It was seen by the dog. ".repeat(20));
t("Flesch ease computed for English", a.fleschEase != null && a.fleschEase > 80 && a.passive.count === 20, a.fleschEase);
t("Non-English: no readability formula", analyze("Ọmọ náà lọ sí ọjà. ".repeat(40), "yo").fleschEase === null);

// readiness: honest separation
const checks = runChecks(null, { name: "c.jpg", type: "image/jpeg", bytes: 2e6, width: 1600, height: 2560 }, { title: "T", subtitle: "", author: "A", description: "", keywords: [], categories: 0, isbn: "978-0-306-40615-7", format: "ebook", pages: null });
t("Readiness: cover passes KDP size", checks.find((c) => c.id === "cv-size")?.status === "pass");
t("Readiness: missing description is a fix", checks.find((c) => c.id === "ls-desc")?.status === "fix");
t("Readiness: proofreading needs a person, previewer needs the platform", checks.some((c) => c.id === "hu-proof" && c.how === "person") && checks.some((c) => c.id === "pl-preview" && c.how === "platform"));
const small = runChecks(null, { name: "c.jpg", type: "image/png", bytes: 1e5, width: 500, height: 800 }, { title: "T", subtitle: "", author: "A", description: "x", keywords: [], categories: 0, isbn: "", format: "ebook", pages: null });
t("Readiness: small cover flagged", small.find((c) => c.id === "cv-size")?.status === "fix");

// manuscript
const p = parseText("Prologue\n\nIt began.\n\nChapter 1\n\nShe walked *slowly* home.\n\nChapter 2\n\n**Done.**");
t("Chapter lines detected; every word kept", p.chapters.length === 3 && bookWords(p.chapters).join(" ") === "Prologue It began Chapter 1 She walked slowly home Chapter 2 Done", bookWords(p.chapters).join(" "));
t("ISBN check digits", validIsbn("9780306406157") && !validIsbn("9780306406158") && validIsbn("0-306-40615-2"));

const fails = R.filter((r) => !r[1]);
for (const f of fails) console.log("FAIL", f[0], JSON.stringify(f[2] ?? "").slice(0, 200));
console.log(`${R.length - fails.length}/${R.length} passed`);
if (typeof process !== "undefined" && fails.length) process.exit(1);
