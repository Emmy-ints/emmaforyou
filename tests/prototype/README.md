# Prototype builder tests

- `logic.spec.ts`: fallback app plans for any request, AI-plan normalisation, request/share validation, generation prompts, preview CSP + logo injection, plan suggestions from `pricing-data`, service "starting from" prices, and the QR encoder. Node:
  `esbuild tests/prototype/logic.spec.ts --bundle --platform=node --alias:@=./src | node`
- The QR encoder was also checked by decoding its output with OpenCV (`cv2.QRCodeDetector`), including a version-9 code and the QR rendered in the save dialog.
- Browser workflow tests (website/app switch, plan → edit → build in the phone frame, real taps inside the scaled phone, save → link + QR, Make it real, /p/<slug> on desktop and phone, /book?prototype, service prices) run in the session harness (`prototests.mjs`, 42 checks).
