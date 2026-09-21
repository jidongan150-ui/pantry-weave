# Security and regression review — 2026-09-18

## Pasted recognition results — 2026-09-19 UTC

Added a local-only parser for complete recipe replies, capped at 50,000 characters and 80 ingredients. Strict schemas reject extra metadata, invalid numbers, unsupported ranges, multiple objects and malformed rows as a whole. The parser uses JSON.parse, never evaluation or HTML rendering; no pasted identifier, source URL, account or executable field is accepted. Fractions are validated with the existing bounded amount parser. Imported data becomes a new recipe only after review and explicit Add, through the existing save path. Optional ingredients and alternatives start unselected. This does not validate the truth of model-generated food facts.

59 core tests, TypeScript and production build pass. Production-preview tests cover bad replies adding nothing, fractions, null servings, optional choices, back/close behavior, denied clipboard fallback, bilingual instructions, 320px layout and PNG download. An input-label instability and narrow-screen overflow found during these tests were fixed. No new API request, secret, dependency, authorization rule or backend schema was introduced. The external ChatGPT link opens only on user action with noopener/noreferrer; images and pasted content are not automatically sent there. No fresh dependency audit or hosted-login/cloud-save test was run in this follow-up.

## Local OCR follow-up — 2026-09-19 UTC

Reviewed the changed browser OCR path: automatic ingredient crops are capped at 8 megapixels and 5000 pixels per dimension, add at most two rereads and retain the existing cancellation/120-second timeout. Image bitmaps are closed. Ingredient regex processing skips lines over 500 characters, retains bounded omitted snippets and has a long-noise regression. Cross-read reconciliation limits rows to 80 and marks conflicting or damaged quantities unknown; approximate name matching is used only in OCR review, never to merge shopping identities or add quantities.

54 core tests, type checking and production build pass. Production-preview checks verify cancellation during delayed worker loading, invalid file/drop handling, source preservation, crop/manual recovery and shopping PNG behavior. Ten image runs produced no browser page errors. No endpoint, authorization, schema, provider or dependency change was made; image rereads remain local. This is a focused follow-up, not a fresh dependency-advisory audit or penetration test. Hosted interactive authentication and physical-phone performance were not retested. Quantity agreement is not proof of accuracy; omissions and translation limitations remain documented in OCR-CHECKS.md.

Scope: the recipe interface, ingredient calculations, public and internal Convex functions, external-service boundaries, and npm dependency tree. This is a focused code and regression review, not a penetration-test certification.

## Fixed

- **Input-triggered crash:** inherited properties such as `constructor` were treated as ingredient aliases or unit conversion tables. Own-property checks now prevent malformed inputs from crashing the list.
- **Unsafe recipe targets:** shared URL validation rejects local/reserved hostnames, literal and encoded IP addresses, credentials, nonstandard ports, and non-HTTP schemes. It protects imports and stored source links. Scraping goes only through the fixed Firecrawl API endpoint; the application does not fetch the user URL itself. Firecrawl remains responsible for DNS and redirect-level network protections.
- **Import race:** a slow, older request could finish after its replacement and modify the newer import. Progress updates now match a per-request token, and import expiry uses a dedicated start time.
- **Email retry correctness:** pending and failed attempts were previously presented as already handled. The server now preserves their actual state; the UI reuses the same request ID after uncertain results and prevents overlapping submissions. Ambiguous sends are not automatically retried. Real provider delivery has not been exercised.
- **Validation and abuse controls:** require UUIDv4 session/request tokens, validate required mutation fields and source links, sanitize UI errors, and add a global daily write cap alongside existing session write limits, plan-creation limits, and import/email quotas.
- **Quantity correctness:** tiny positive amounts no longer round to zero. Missing amounts now say “Amount not specified”; “to taste” is retained only when explicitly supplied as the unit. Manual numeric input rejects hex, exponent, fraction, blank and negative forms.
- **Dependencies:** upgraded the React server runtime, Vite, Vinext and Cloudflare toolchain; removed unused Drizzle/D1 starter code and its dependency chain. The npm audit on 2026-09-18 reports **0 known vulnerabilities** (previously 19 affected-package entries: 9 high, 9 moderate, 1 low). This does not prove the absence of unknown vulnerabilities.

## Authentication and remaining limits

Sites dispatch authenticates the ChatGPT user. The worker exchanges that trusted identity for a five-minute RS256 JWT with an exact issuer and app-specific audience. The endpoint only accepts same-origin POST requests, sends no-store responses, and never returns the private signing key. Convex pins the public JWKS, validates tokens, and maps the full tokenIdentifier to a user-owned plan scope.

Every plan read/write and import/email bookkeeping entry checks ownership against that verified identity. Knowledge of a plan's UUID alone no longer grants access. Returning identities reuse their scope; old anonymous plans are not claimed automatically. The signing key exists only in an ignored local setup file and a Sites secret. Never place it in client variables or on a publicly reachable local development server. This design trusts Sites to sanitize and supply authenticated-user headers; direct Worker exposure would require revisiting that trust boundary.

The cloud backend currently uses the dedicated development deployment `peaceful-butterfly-641`. The frontend remains owner-private. Third-party provider keys are absent. Global quotas can still be exhausted by sufficiently many authenticated accounts; email remains restricted to configured test recipients. Browser sign-out cannot revoke an already-issued bearer token instantly; its remaining lifetime is at most five minutes.

## Verification

- All 19 automated checks pass: 12 ingredient/export/input/token-security tests and 7 Convex tests. TypeScript and the production build pass.
- Convex tests for isolated sessions, recipe limits, write rate limits, invalid mutations, stale import completion and email deduplication.
- Previous local testing verified internal import functions were not publicly callable. The current cloud test verifies real JWT authentication, persistent save/recovery, realtime subscriptions, and rejection of anonymous and cross-account access.
- Previous browser checks cover English and Chinese switching, retained in-page state, English manual-entry errors, long recipe names, and 1440/390/320-pixel responsive layouts.
- In the previous browser-tested release, both language preferences survive reload after hydration. The production build runs in the browser without reported script errors. Clipboard success feedback was exercised; export contents were verified by automated tests.
- Third-party calls remain untested and are not enabled. Current authentication UI browser testing is unavailable because the browser control connection fails; cloud protocol checks pass. Published version 4 returns HTTP 200 with English HTML, a sign-in link and the correct cloud URL. The hosted token endpoint rejects an unauthenticated Sites test-access request with 401 and a cross-origin request with 403. The test-access credential does not supply a signed-in user, so a real browser sign-in and the full hosted identity-to-token exchange remain unverified. Production dependency audit reports zero known vulnerabilities.

## Recipe-image import (2026-09-18)

OCR runs locally in a Web Worker using self-hosted scripts, WASM and English/simplified-Chinese models. No provider credential, model API or image storage is added. Files are restricted to JPEG/PNG/WebP, 10 MB and 40 megapixels, decoded and re-rasterized onto a white canvas, and capped at a 3600-pixel longest side and eight megapixels after resizing. SVG/HTML/PDF are rejected. Recognition has a two-minute timeout, cancellation, worker termination and preview URL cleanup. Text is rendered as plain React text, never as HTML.

Extraction is conservative and requires an editable review before saving; missing servings cannot be silently invented. The existing recipe schema, account ownership and write limits apply to confirmed recipes. Ambiguous quantities retain source text, and the full OCR text remains available for checking missed lines. No quantities can be zero, negative, infinite or over the existing maximum.

Local browser tests imported English and Chinese synthetic recipe screenshots into the shopping list, edited the extracted name, checked 320/390-pixel layouts, rejected an SVG and cancelled recognition without adding a recipe. Browser requests stayed on the local origin and no page errors were reported. Five new text-extraction/file-validation checks pass alongside the 12 prior core/security/token checks. No Convex backend changes are required. Real-world photo accuracy depends on legibility and layout; handwriting and dish-only photos are not supported claims.

## Illustrated-recipe correction (2026-09-19 local date)

The earlier clean synthetic fixtures did not establish reliability for illustrated recipe cards. The reported real card reproduced the failure. OCR now enlarges small inputs, uses sparse page segmentation, avoids mixed-language competition, and filters low-confidence lines and obvious symbol noise before extraction. A Chinese instruction-text fallback lists only explicitly matched common ingredient words, with source notes; it is finite-vocabulary candidate extraction, not general semantic understanding. Alternatives are labeled in notes. Step numbers are never used as ingredient amounts and missing servings must be supplied by the user.

A local browser test on the actual provided image extracted seven main ingredients and two explicitly mentioned alternatives, left all quantities and servings blank, accepted a manually supplied serving count and updated the shopping list. A dish-only crop was rejected without presenting ingredient rows. The legible English title was used because the stylized Chinese title remains unreliable. The image and derived test files stay in an ignored local test directory and are not part of the published source or assets. Twenty-one core/security/extraction tests pass.

## Bilingual result cards and broader image checks

Five web-sourced image checks exposed inline-list and tools/step-number parsing defects, now corrected; multi-column quantities, decorative titles and handwriting remain limited (see `OCR-CHECKS.md`). Twenty-three core/security/extraction/localization checks pass. The bilingual card is rendered using Canvas text, never untrusted HTML/SVG. PNG object URLs are revoked and canvas memory is bounded. Changing language or editing a draft cancels stale translation results. Original editable data remains the save source, so display translation cannot silently alter database records. Optional browser-native translation uses on-device language packs; unavailable models fall back to the local glossary and explicit original-language text, with a 30-second UI timeout. No cloud translation endpoint, provider secret or backend change is introduced.

## Follow-up audit — 2026-09-18 19:28 UTC

Fixed three confirmed correctness defects: unknown OCR amounts were displayed as “to taste” after import; textual ranges/additive/decimal-comma quantities could become misleading exact amounts; invalid multi-file drops during OCR could leave the previous job running and later present its result. Browser-native translators are now destroyed on cancellation, and unavailable translation is explained rather than leaving a repeatedly ineffective action. The main export action no longer advertises unavailable email delivery.

Authorization scan: the provider and subject-keyed users table exist. No public identity-from-argument, document-ID ownership bypass, ID-scoped sensitive query, or unchecked parent-ID insertion was found. Public plan functions resolve ownership through `requireOwner`; internal mail completion is an intentional internal-only exception. Public availability returns configuration booleans, not user data or credentials. No unbounded database collect/filter or query-time clock was found in app functions. No unsafe HTML/eval sink was found in the inspected app surface; tracked-source credential-pattern scan had no hits (not a comprehensive secret-history audit).

Validation: 24 core/security/extraction/localization tests and 7 Convex tests pass. The development backend was synchronized, then fresh real-cloud tests verified authenticated save/recovery, realtime updates, and rejection of anonymous/other-account access; test recipes were removed. Production dependency audit reports zero known issues. Local browser regression checks cover invalid drops during recognition, unknown quantities in the UI and downloaded text, unavailable translation, working export action, both PNG languages and a 320px viewport. Hosted interactive sign-in/token exchange is still not covered by these tests; cloud tests use independently signed fixture tokens.

Remaining: OCR/translation limitations in `OCR-CHECKS.md`; direct Worker exposure must not bypass Sites authentication; logout leaves a token valid for up to five minutes; external provider integrations remain disabled and untested, and Firecrawl must enforce DNS/redirect restrictions. Recommendations and priorities are in `APP-REVIEW.zh-CN.md`.


## Final shopping image export (2026-09-19)
The final merged/scaled list can now be exported as one PNG, excluding checked rows. Notes and unknown amounts survive export. Local display translation never modifies source recipes. Canvas rendering uses plain text and bounded memory, with no new upload, API, dependency or backend surface. Preview signatures hide stale downloads after data/language changes; cleanup revokes object URLs. Targeted tests cover scaling, exclusion, unknown amounts, translation and source preservation. Long lists may produce smaller text to stay within canvas memory limits.


## Review-first import and saved-recipe editing (2026-09-19)
The new edit operation runs inside the existing owner-authenticated, indexed and rate-limited mutation. It validates both the new recipe and the original snapshot, rejects mismatched IDs, deleted recipes and stale snapshots, and preserves stored source/sample metadata. The update is atomic and clears pantry checkmarks. No new schema, public function or provider credential is introduced. Original text remains the save source; all local display surfaces reuse `recipeText`.

Cropping only draws the already decoded, bounded local image onto Canvas; pointer and numeric selections are clamped to the image. It adds no upload or URL-fetch endpoint. Manual recovery preserves the source preview. Crop retry explicitly replaces the current unsaved draft. Scan-image downloads are keyed to current data/language to avoid stale previews; URLs are revoked.

Validation: 29 core and 9 backend tests, TypeScript and production build pass. Fresh cloud checks prove saved edits, recovery and stale/cross-account rejection. Browser checks cover edit/reopen/cancel, missing servings, unknown amounts, shared language, image and manual import, crop recovery and fallback, 320px layout and final PNG. Full hosted interactive sign-in and independent first-time human usability tests remain unverified. OCR and free-text translation limitations remain; see the additional unseen-image results in `OCR-CHECKS.md`.

## Simplified photo flow (2026-09-19)

Recipe servings now accept `null` in shared schema and Convex validators. Existing numeric records remain compatible; no migration or ownership change is needed. Unknown-servings recipes keep original amounts and are marked separately from scaled numeric rows. Save/edit continue through the same authenticated, rate-limited mutation with bounded ingredients, validated amounts and stale-edit checks. Actual development-cloud tests confirm null-servings saving/recovery and anonymous/cross-account rejection.

Translated review inputs are display-only until the user types. Source OCR excerpts remain stored for editing while shopping displays suppress those excerpts and retain optional/alternative warnings. All rendering remains React/Canvas text. Geometry-based OCR remains local; same-line reconstruction preserves the confidence cutoff and does not attach detached digits to later ingredients. No new dependencies, secrets, upload endpoints or provider services were added.

34 core tests and 10 backend tests pass; TypeScript and production build pass. Production-browser checks cover direct file choice, two-language ingredient names, original data, optional servings, multiple recipes, scaled/unscaled PNG exports, checked-item exclusion, mobile layout, drag/drop rejection and crop/manual recovery. Existing hosted-login and physical-camera test gaps remain. Earlier dependency-audit results are historical; this round added no dependency and does not claim a fresh advisory audit.

## Grocery identity, choices and retained checks (2026-09-19)

Exact ingredient identities reuse the display glossary, with explicit food membership and conservative unit aliases. No fuzzy matching or removal of preparation terms is used. Unknown amounts and incompatible units remain separate. Optional `included` and `choiceGroup` fields extend existing ingredient validators without a required-field migration. Shared recipe validation rejects selecting multiple ingredients in one alternative group; the existing owner-authenticated mutation enforces this server-side. Unselected source rows remain stored but do not reach shopping exports.

Check preservation compares requirements before and after an atomic change. Unknown-quantity source counts and notes are included so changed requirements reopen. An optional internal check-key version prevents a legacy partial check from hiding a newly combined bilingual row: legacy reads clear affected keys, and the next write records the new key semantics. Unaffected old keys are preserved; no public ownership or auth surface changes.

39 core tests and 12 backend tests pass, including legacy-key collisions, retained/cleared checks, alternative selection, stale snapshots and cross-account denial. Real development-cloud tests verify saved choices, rejection of double selections, unrelated check preservation, fresh-client recovery, realtime updates and account isolation. Production-browser tests exercise bilingual merging, choices, editing/removal, exports and 320px layout. No new dependencies or providers were activated. Existing OCR, free-text translation and hosted interactive-login coverage limits remain.

## Presentation and OCR uncertainty follow-up (2026-09-19 UTC)

Display grouping retains existing per-requirement keys and uses a Map; it neither changes ownership nor merges incompatible quantities. React/Canvas continue to treat names and notes as text. Shared text export uses the same grouping while leaving persisted data and validators unchanged. The existing development backend accepted the shared-code push; 12 backend tests and 44 core tests pass. No new service, dependency, secret, public endpoint or data migration was introduced. No fresh dependency-advisory audit or hosted interactive-login roundtrip was performed in this follow-up.

New OCR fixtures exposed fraction/servings interpretation errors. Review guards reduce specific wrong-number outcomes but are not a complete semantic validator. Complex bilingual pages still produce omissions and instruction fragments as ingredient candidates. Those unresolved quality defects are documented rather than presented as verified recognition success.
# 2026-09-20: optional Puter vision route

Pinned Apache-2.0 browser SDK; no shared secret or public backend inference endpoint.
Explicit per-image upload action identifies Puter and Google as recipients. Prepared
image metadata/filename are not forwarded; bounded JPEG, model and response limits.
Unknown responses fail closed. Abort ignores stale results. New page sessions reset
this app's Puter token before reauthorization, avoiding silent reuse across app sign-outs.
SDK auth still stores its scoped token in the browser; this adds third-party SDK trust
and the usual browser-token/XSS risk. React renders response text without HTML injection.
No claim of an independent SDK security audit or live authentication/inference test.

## Recipe links and browser-local plans (2026-09-21)

Incoming fragments are length-bounded, percent-decoded once and validated as one
complete recipe before review. They cannot set record IDs, source URLs or extra
metadata. Names render as text, never HTML; following a link never saves a recipe.
Fragments are removed with replaceState and are not included in HTTP requests.
The link itself is readable by anyone with a copy, as explained in the UI.

Signed-out recipes use validated browser-local storage, not account credentials.
They are visible to other users of that browser and are separate from the Convex
cloud list. Storage-denied behavior is explicit. Changes from other tabs refresh
the visible list; mutations reread the latest stored plan. Stale recipe edits
are rejected. Browser storage is not a database transaction across simultaneous tabs.

68 core tests, 12 backend tests, TypeScript and production build passed. Browser
checks exercised malformed links without writes, Unicode/fractions, two-tab
updates, reload, denied storage/clipboard, bilingual narrow layout and PNG export.
Puter SDK loading is now behind the explicit experimental section; default
navigation and the ChatGPT link workflow make no Puter or Gemini calls. This is
a bounded review, not a penetration test or a guarantee of no vulnerabilities.
