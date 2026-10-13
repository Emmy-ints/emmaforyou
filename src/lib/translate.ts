import { z } from "zod";

/** Languages offered by AI page translation (the UI itself is hand-translated into EN/FR/ES/DE). */
export const AI_LANGUAGES = [
  { code: "yo", name: "Yorùbá", flag: "🇳🇬" },
  { code: "ha", name: "Hausa", flag: "🇳🇬" },
  { code: "ig", name: "Igbo", flag: "🇳🇬" },
  { code: "pcm", name: "Naijá (Pidgin)", flag: "🇳🇬" },
  { code: "sw", name: "Kiswahili", flag: "🇰🇪" },
  { code: "zu", name: "isiZulu", flag: "🇿🇦" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
] as const;

export type AiLang = (typeof AI_LANGUAGES)[number]["code"];

export const LANG_FULL: Record<AiLang, string> = {
  yo: "Yoruba (with correct tone marks)", ha: "Hausa", ig: "Igbo", pcm: "Nigerian Pidgin English (Naijá)", sw: "Swahili", zu: "isiZulu",
  pt: "Portuguese", ar: "Modern Standard Arabic", fr: "French", es: "Spanish", de: "German",
};

export const translateRequestSchema = z.object({
  lang: z.enum(AI_LANGUAGES.map((l) => l.code) as [AiLang, ...AiLang[]]),
  texts: z.array(z.string().min(1).max(1500)).min(1).max(80),
});
