# Book tools tests

- `logic.spec.ts` — royalty formulas (KDP presets), print-cover dimensions, launch plan/ICS/CSV, listing rules, readability, readiness checks, manuscript parsing. Node:
  `esbuild tests/books/logic.spec.ts --bundle --platform=node --alias:@=./src | node`
- `generators.browser.ts` + `run-generators.mjs` — builds PDF, EPUB and DOCX from `sample.md` in Chromium (real fonts from `public/fonts/book`), re-imports the DOCX and checks every word survives. Then `validate_outputs.py <out dir>` opens the files with pypdf, python-docx, zipfile + lxml (EPUB container, manifest, spine, nav, metadata, well-formed XHTML, all words present) and `qpdf --check`.
- Browser workflow tests for every tool page (desktop + 390 px) run in the session harness (`pubtests.mjs`, 120 checks); see `docs/publishing.md`.
