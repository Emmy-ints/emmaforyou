# Visitor language

English is the default. Everything else follows the visitor's browser (`navigator.languages`), unless they have
chosen a language themselves (the choice always wins).

| Layer | How it adapts | Code |
|---|---|---|
| Menus, buttons, tool labels | Switch automatically to French, Spanish or German when that's the browser's first supported language | `lib/i18n.tsx` → `detectUiLang` |
| Page content | One-time, one-tap offer to translate the whole site with AI when the browser's **first** language is one we translate (Yorùbá, Hausa, Igbo, Pidgin, Swahili, isiZulu, Portuguese, Arabic, French, Spanish, German). Not shown on the dashboard, portal or login. | `components/tools/LanguageOffer.tsx`, `PageTranslator.tsx` |
| AI tool answers | Every same-origin `/api/` call carries `X-EFY-Lang`; visitor-facing AI calls add a language instruction. Owner tools (`translate`, `site-repair`, `intern`, status) and the makeover (keeps the language of the visitor's own site) are excluded. | `lib/visitor-language.ts` (`installLanguageHeader`, `withVisitorLanguage`), `lib/ai/responses.ts` |
| Voice | Speech recognition and read-aloud use the same language and pick a matching installed voice | `lib/use-voice.ts` → `speechLang` |

Tests: `tests/language/logic.spec.ts`.
