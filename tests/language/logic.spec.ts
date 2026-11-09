/** Unit checks for visitor language detection and the AI language instruction.
 *  Run: esbuild tests/language/logic.spec.ts --bundle --platform=node --alias:@=./src | node */
import { detectUiLang, languageForAi, languageInstruction, suggestAiLang, withVisitorLanguage } from "@/lib/visitor-language";


const R: [string, boolean, unknown?][] = [];
const t = (n: string, ok: boolean, info?: unknown) => R.push([n, ok, info]);

t("UI: English default", detectUiLang([]) === "en" && detectUiLang(undefined) === "en");
t("UI: French browser", detectUiLang(["fr-FR", "en"]) === "fr");
t("UI: first supported wins", detectUiLang(["pt-BR", "es-MX", "en"]) === "es");
t("UI: unsupported only → English", detectUiLang(["yo", "ha"]) === "en");
t("UI: Nigerian English", detectUiLang(["en-NG"]) === "en");
t("Offer: none for English first", suggestAiLang(["en-GB", "fr"]) === null);
t("Offer: Portuguese", suggestAiLang(["pt-BR", "en"]) === "pt");
t("Offer: Yoruba", suggestAiLang(["yo-NG"]) === "yo");
t("Offer: French (content translation)", suggestAiLang(["fr-CA"]) === "fr");
t("Offer: unknown language", suggestAiLang(["ja-JP", "en"]) === null);
t("AI name", languageForAi("pt") === "Portuguese" && languageForAi("en") === null && languageForAi("xx") === null && languageForAi("de-DE") === "German");
t("Instruction empty for English", languageInstruction("en") === "" && languageInstruction(null) === "");
t("Instruction keeps code/keys", /JSON keys/.test(languageInstruction("es")) && /Spanish/.test(languageInstruction("es")));

const req = (path: string, lang?: string) => new Request(`https://x.app${path}`, { headers: lang ? { "x-efy-lang": lang } : {} });
t("Server: visitor tool gets language", /German/.test(withVisitorLanguage(req("/api/assistant", "de"), "Be kind.") ?? ""));
t("Server: no header → unchanged", withVisitorLanguage(req("/api/assistant"), "Be kind.") === "Be kind.");
t("Server: English → unchanged", withVisitorLanguage(req("/api/goal-plan", "en"), "X") === "X");
for (const p of ["/api/translate", "/api/site-repair", "/api/intern-profile", "/api/makeover", "/api/ai-status"]) t(`Server: ${p} keeps its language`, withVisitorLanguage(req(p, "fr"), "X") === "X");

for (const [name, ok, info] of R) if (!ok) console.log("FAIL", name, info === undefined ? "" : JSON.stringify(info));
console.log(`${R.filter((r) => r[1]).length}/${R.length} passed`);
if (R.some((r) => !r[1])) process.exit(1);
