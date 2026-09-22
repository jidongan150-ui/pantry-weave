# Hackathon log

- **Project:** 一起买菜 · Pantry Weave
- **Event:** Convex All Gas Hackathon
- **What it does:** Combines recipes into one shopping list, scales ingredient quantities by serving count, and tracks ingredients already on hand.
- **Live app:** https://pantry-weave-recipes.jidongan150.chatgpt.site
- **Repo:** https://github.com/jidongan150-ui/pantry-weave
- **Frontend:** Codex Sites
- **Convex deployment:** https://peaceful-butterfly-641.convex.cloud (development)
- **Components:** @convex-dev/rate-limiter
- **Convex features:** schema, tables, indexes, queries, realtime queries, mutations, actions
- **Auth:** Other (Sites ChatGPT sign-in with a Convex JWT bridge)
- **AI models:** gpt-4.1-mini (URL-import default; not invoked); gemini-2.5-flash-lite (Puter image route configured; real inference not yet verified)
- **Started:** 2026-09-18T12:43:34Z
- **Last updated:** 2026-09-22T10:27:29Z

## Log

### 2026-09-18 - 418552a

Built a Chinese recipe planner with manual recipe entry, two sample recipes, serving controls, conservative ingredient merging, pantry checkboxes, plain-text copy/download, and explicit unavailable-service states. Demo data lives only in page memory (`components/recipe-app.tsx`, `lib/recipes.ts`).

Implemented Convex plan storage, per-session indexed reads and writes, import progress, write/import/email rate limits, and email-request deduplication. Anonymous session tokens are capability identifiers; no authenticated account system or cross-device sharing is claimed (`convex/schema.ts`, `convex/plans.ts`, `convex/convex.config.ts`).

Implemented Firecrawl markdown scraping, OpenAI strict structured extraction, and AgentMail shopping-list delivery as Convex actions. Real keys are not configured and provider calls have not been tested. Mail is restricted to configured test recipients (`convex/services.ts`). No mail was sent.

Validation: four ingredient-calculation tests passed. TypeScript checking and the production frontend build passed. Functions and rate-limiter component were pushed to an anonymous local Convex backend. Integration checks passed for persistence, serving changes, idempotent checkboxes, independent sessions, invalid inputs, missing-provider errors, and recipe removal (`tests/recipes.test.mjs`, `tests/convex-smoke.mjs`). Local page and image returned HTTP 200. Browser access was unavailable, so responsive visual QA and optional WebMCP execution remain unverified.

Added an MIT license and a CC0 ingredient photo with attribution (`LICENSE`, `ASSETS.md`). Created a Sites project, but no successful online publication or cloud Convex deployment has been recorded yet. Public GitHub repository, live-provider testing, demo video, social post, and hackathon submission remain outstanding.

### 2026-09-18 - 2de64d6

Published Sites version 1 from commit `418552a26c37db6c7bc33dd5c50e1acb2d6a0f78`. The owner-private deployment succeeded at 2026-09-18T12:46:57Z: https://pantry-weave-recipes.jidongan150.chatgpt.site . Authenticated HTTP checks returned 200 for the app and ingredient image; the HTML includes the demo-mode notice and shopping-list interface. The public Live app field remains not deployed because access is owner-only. Cloud Convex and live provider connections are still pending. Browser visual and interaction checks remain unavailable.

### 2026-09-18 - 97ac360

Added English/Chinese switching, English as the default, remembered language preference, localized interface/sample ingredients/quantities/exports, and language-aware import/email payloads. Switching preserves current plan state; manual recipe text stays as entered. Adjusted wrapping, header controls, cards and dialogs for longer English text (`components/recipe-app.tsx`, `lib/i18n.ts`, `app/globals.css`).

Fixed inherited-property ingredient/unit crashes, small-quantity rounding, ambiguous numeric input, unsafe source URLs, stale import completion, incomplete mutation arguments and misleading email retry states. Added global write limits and strict session-token validation. The auth review explicitly records the anonymous-capability model and the need for authentication before public backend/provider activation (`SECURITY-REVIEW.md`).

Validation: 10 core/security tests and 5 Convex tests passed, as did TypeScript, the production build and an integration check against the local anonymous backend. Internal import bookkeeping was not publicly callable. Functions were pushed to local `anonymous-002`; no cloud backend or third-party provider was activated. Updated vulnerable dependencies and removed unused D1/Drizzle starter code; npm audit reports zero known vulnerabilities after 19 affected-package entries were resolved.

Browser checks covered desktop 1440px, mobile 390px and narrow 320px layouts, long names, English input errors, retained plan state when switching, language preference after reload, and the production build without reported script errors. No horizontal overflow was detected. The English sample view has no Chinese text apart from the Chinese language button. WebMCP returned the expected English shopping list. The updated frontend is ready for publication to the existing owner-private site; publication is recorded separately when complete.

### 2026-09-18 - 8211514

Completed English singular labels, including “1 item to buy”, and published Sites version 3 from commit `821151404e3aad4fa767e85d8a530497eae1240b`. Deployment `appgdep_6aad414d80e481919043eb49f5e6d736` succeeded at 2026-09-18T13:53:31Z. The site remains owner-private at https://pantry-weave-recipes.jidongan150.chatgpt.site . Authenticated online HTTP verification returned 200 with an English document, English headline and both language controls. Browser visual checks were performed against the local production build; the final online browser attempt was unavailable. Cloud Convex, authentication and live provider testing remain pending; the hosted app continues to use the in-memory demo.

### 2026-09-18 - d4538e6

Added user-owned cloud persistence through Sites ChatGPT identity, short-lived signed tokens and Convex authentication. Returning accounts recover their plans; a known list identifier is insufficient to read or write another user's data. Anonymous legacy plans are not automatically migrated (`convex/accounts.ts`, `convex/model/auth.ts`, `app/api/convex-token/route.ts`).

Pushed the authenticated backend to the dedicated cloud development deployment. All 19 automated tests, TypeScript checking and the production frontend build pass. Real cloud tests verify authenticated saving, recovery with a fresh client, realtime updates, and denial of anonymous/cross-account access; isolated test recipes were removed (`tests/cloud-auth-smoke.mjs`). No model or email provider was called. Browser automation is currently unavailable; frontend publication and hosted token exchange verification are recorded when complete. GitHub remains pending account selection/connection.

### 2026-09-18 - publication of d4538e6

Published Sites version 4 from source commit `d4538e6272282e99d1758e018f7972f1fafb1883`. Deployment `appgdep_6aad50688ea08191b4e88d19b65528e6` succeeded at 2026-09-18T14:55:38Z with environment revision 1. Audience remains owner-private. The Windows packaging helper could not launch Bash, so publication used the supported remote source build.

Hosted HTTP verification returned 200 with English HTML, the sign-in link and the cloud deployment URL. The token endpoint correctly returned 401 when the Sites test-access credential supplied no signed-in identity, and 403 for a cross-origin request. Real browser sign-in and a Sites-issued token accepted by Convex are still pending; browser control remains unavailable. The separate real-cloud JWT persistence, realtime and account-isolation checks passed. Production dependency audit reports zero known vulnerabilities. No GitHub publication or external model/email provider calls occurred.

### 2026-09-18 - 01fe2d2
Added recipe-image import for English and simplified-Chinese screenshots/photos with local OCR, an image preview, editable ingredient rows and explicit review before adding to the shopping list. Images stay in the browser; confirmed recipes use the existing protected Convex mutation (`components/image-recipe-import.tsx`, `lib/image-ocr.ts`, `lib/recipe-image.ts`). No API key or backend changes were required.

Verified English and Chinese synthetic screenshots through the local production build, including name edits, servings and shopping-list updates. Checked desktop and 320/390-pixel layouts, invalid-format rejection, cancellation, no external browser requests and no page errors. Five new extraction/file tests plus the 12 existing core/security/token tests pass, as do TypeScript and production build; production dependency audit reports zero known vulnerabilities. Real-world photo accuracy remains dependent on legibility; no dish-photo ingredient inference is claimed. Frontend publication is recorded after completion.

### 2026-09-18 - image-import publication
Published Sites version 5 from commit `01fe2d2b2d6938c283036f3d493ded5ba2ccd4fa`. Deployment `appgdep_6aad5c688c2c81918e8292412658ea8c` succeeded at 2026-09-18T15:47:03Z. The site remains owner-private at https://pantry-weave-recipes.jidongan150.chatgpt.site . Windows packaging could not launch Bash, so the validated source used the supported remote build. English/Chinese image-import browser checks were performed against the local production build. No GitHub publication, backend deployment, image upload to an external provider or OpenAI API request was made.

### 2026-09-18 - f0c8a5e (image drag and drop)
Added a visible drag-and-drop target on the main recipe page and in the image review dialog. Dropping a single image starts existing local OCR; click-to-select remains available. Drag feedback is bilingual, multiple files and unsupported formats show errors, and off-target file drops cannot navigate away from the current list (`components/image-recipe-import.tsx`, `app/globals.css`).
Browser checks passed for direct drop, replacing an image in the dialog, confirming into the shopping list, multiple-file/format rejection, off-target navigation prevention, Chinese labels, 320-pixel layout and retained file selection, with no page errors. TypeScript passes; publication is recorded separately.

### 2026-09-18 - drag-and-drop publication
Published Sites version 6 from `f0c8a5e2e19a44d10d3ff621e7a50a4faed94a09`. Deployment `appgdep_6aad7c4a3d04819182f15e039653f9c3` succeeded at 2026-09-18T18:03:27Z; access remains owner-private. TypeScript and the production build passed, including an additional English 320-pixel drop-target layout check. Publication reused the established remote-build fallback because local packaging requires unavailable Bash. No backend deployment or GitHub push was performed.

### 2026-09-18 - 7cacb2d (illustrated-recipe correction)
Reproduced a user-reported failure with an actual illustrated recipe, rather than relying on clean synthetic text fixtures. Added small-image enlargement, sparse layout recognition, separate language passes, confidence filtering and rejection of unreliable results. Chinese instruction text can now produce candidate ingredients with source notes and marked alternatives; missing quantities and servings remain blank (`lib/image-ocr.ts`, `lib/recipe-image.ts`).
The actual-image browser check found seven main ingredients and two alternatives, preserved missing amounts, required a manually entered serving count and saved into the list. A dish-only crop was rejected. Existing English/Chinese drag-and-drop checks and 21 core/security/extraction tests pass. The stylized Chinese title is still unreliable, so this image uses its readable English title. No user images are committed or published; no model API or backend deployment was used.

### 2026-09-18 - illustrated-recipe correction publication
Published Sites version 7 from `7cacb2dbf6bc9694e11a589a55e52e1e3992bbb8`. Deployment `appgdep_6aad83bfba348191a01308b6be545723` succeeded at 2026-09-18T18:37:07Z; access remains owner-private. Actual-image import, required servings, shopping-list confirmation and dish-only rejection were verified against the local production build. TypeScript, the production build and 21 tests passed. Publication used the established remote source build because local packaging requires unavailable Bash. User images were not published; no backend deployment, model API call or GitHub push occurred.

### 2026-09-18 - 48da407 (bilingual scan cards and broader OCR checks)
Added a prominent result-language switch and a single downloadable PNG shopping card containing the dish, original servings, ingredient amounts and review/alternative notes. Original edits remain intact. Common terms translate locally; browser-native translation is attempted for other text, with explicit original-language fallback. No model API key or backend changes are required (`components/scan-result-card.tsx`, `lib/recipe-language.ts`, `lib/recipe-card.ts`).
Tested five additional web-sourced images through the upload UI. Fixed inline Chinese ingredient lists, tools mistaken for ingredients and step numbers mistaken for quantities. The sample still exposes decorative-title errors, multi-column/low-confidence omissions and failed handwriting; results and sources are in `OCR-CHECKS.md`. Test images are ignored and not published.
All 23 core/security/extraction/localization checks, TypeScript and the production build pass. Production browser checks verified the five samples, both PNG downloads, 320px layout, preserved source edits, stale-translation cancellation and confirm-to-list. The test browser reports native English/Chinese translation unavailable, so full free-text translation remains unverified. Publication is recorded separately after completion.

### 2026-09-18 - bilingual result-card publication
Published Sites version 8 from `48da407f3efa8ae377babd09c0b3804d4550c5e1`. Deployment `appgdep_6aad8c0b21b081918fa9a13cc445afd7` succeeded at 2026-09-18T19:10:30Z with environment revision 1; access remains owner-private. Browser checks used the local production build. The established remote build fallback was used because local packaging could not start Bash. No test images, GitHub push, backend deployment or external model service was involved.

### 2026-09-18 - 46b7818 (follow-up review and corrections)
Reviewed account ownership, function boundaries, input/rendering safety, dependency advisories and the shopping flow. Fixed missing amounts labeled as “to taste”, ambiguous OCR quantities and invalid-drop cancellation. Unavailable browser translation now gives explicit feedback and releases its translator on cancellation; the export action no longer advertises disabled email delivery. Recommendations for simplifying the flow are in `APP-REVIEW.zh-CN.md`.
Validated 24 core/security/extraction/localization tests, 7 Convex tests, TypeScript and the production build. Browser checks cover cancellation, unknown amounts in UI/downloads, translation fallback, PNGs and mobile layout. Synced the existing Convex development deployment and reran real save/recovery/realtime/anonymous/cross-account tests with isolated identities; fixture recipes were removed. Production dependency audit found zero known issues. No new external service was activated; full hosted interactive sign-in remains outside this test coverage.

### 2026-09-18 - review-fix publication
Published Sites version 9 from `46b78184905c56659a0886ea52ac97067daeaa43`. Deployment `appgdep_6aad91945fd88191a8c3d9a2bec7b10f` succeeded at 2026-09-18T19:34:13Z with environment revision 1. Audience remains owner-private. Publication used the established remote source build fallback; no GitHub push or provider activation occurred.


### 2026-09-18 - final merged shopping PNG
Added a prominent final-list image action with a bilingual preview and downloadable PNG. It consumes the already merged/scaled list, excludes checked ingredients, preserves unknown amounts and notes, and keeps source recipes unchanged. Language, servings and checked-item changes invalidate stale previews; object URLs are released. Existing scan-result PNGs retain their original-serving meaning. No new dependency, API, provider or backend change.
Validation: 27 core/security/extraction/localization/export tests pass; TypeScript and production build pass. Headless Edge checked both downloaded PNGs, checked-row exclusion, four-to-five-person recalculation, reopened previews, empty-list disabling and 320px layout against the local production build. Both rendered languages were visually reviewed; scan-result PNG regression checks also pass. Complex free text can remain untranslated, with an explicit note. Publication is recorded after completion.

### 2026-09-18 - final shopping-image publication
Published Sites version 10 from `004d075209da3a9cb4343578ff90720e8bf68e52`. Deployment `appgdep_6aad97f814388191acdf07a408d1ac93` succeeded at 2026-09-18T20:03:15Z with environment revision 1. Access remains owner-private. Publication used the established remote source build fallback because local packaging could not start its shell. No GitHub push, backend deployment or provider activation occurred.

### 2026-09-18 - review-first workflow, saved-recipe editing and crop recovery
Made image upload the main entry, with an upload/check/add progression, desktop source comparison and highlighted missing servings/amounts. Single-recipe PNG preview is optional after editing. Added local ingredient-area cropping with drag/numeric selection and full-source preservation; failed recognition can continue into manual entry. Manual addition and saved-recipe edits share structured fields instead of a separator-based text format. Unconnected link import is secondary and unconnected email no longer occupies a main action.
Saved edits are validated atomically by the existing owner-authenticated, rate-limited Convex mutation. Source metadata is retained; stale snapshots and deleted recipes are rejected; checkmarks reset after recalculation. Local language display now shares one function across scan previews, stored-recipe display, shopping lists, text exports and PNGs, without rewriting source text. Stale scan-image downloads are hidden when content/language changes.
Validation: 29 core tests and 9 backend tests pass, together with TypeScript and the production build. Pushed to the existing Convex development deployment and ran fresh cloud save/edit/recovery/realtime/authz tests, including stale and other-account edit rejection; fixture recipes were removed. Browser checks cover editing/cancellation/reopening, language, original text, missing servings, unknown amounts, full-source preservation after cropping, pointer/numeric crop selection, fallback entry, final PNG and 320px layout on the local production build.
Three additional available web images were chosen before inspecting OCR results. Two full-image imports failed; one yielded incomplete rows. Cropping recovered six rows in the multi-column soup card, but omissions remain; the captioned photo still needed manual entry. The full findings and failed retrieval attempts are in OCR-CHECKS.md. No model API, paid service or new dependency was added. Independent first-time human usability testing and full hosted interactive login remain unverified; this work does not establish an objective score of 80. Publication recorded separately.

### 2026-09-18 - review/edit/crop publication
Published Sites version 11 from `6cc06ea61b5e47f6f13576972366618484662bad`. Deployment `appgdep_6aadb2c2eecc8191a6421cb6b3438ea2` succeeded at 2026-09-18T21:55:34Z with environment revision 1. Audience remains owner-private. Used the established remote source build because local packaging could not start its shell. The existing development backend was updated and verified separately. No GitHub push or external provider activation occurred.

### 2026-09-19 - simpler photo-to-shopping flow

Responded to another user trial by replacing the scan form with compact ingredient rows, opening fields only on demand, and moving original-image/crop tools to the bottom. Upload opens the picker directly; a separate camera entry requests rear-camera capture. A sticky add action keeps the next step accessible on narrow screens. Review names and fields now use the chosen display language without changing source data just by toggling/focusing. Shopping output hides repeated OCR step excerpts while keeping them available in editing and preserving alternative notes.

Original servings may be unknown: shared frontend/backend validation accepts null, preserves as-written quantities and separates them from scaled numeric entries. Added tests for saving/reloading unknown servings and unchanged amounts. OCR uses line geometry to avoid adjacent method-column interference and join same-baseline names/amounts. A discovered detached-digit joining error was fixed before shipping; inaccurate aggressive retry changes were not retained.

Validation: 34 core tests, 10 Convex tests, TypeScript and production build pass. Pushed the existing development deployment and verified real null-servings save/recovery, edit/stale checks, realtime updates and anonymous/cross-account rejection, removing fixture recipes afterward. Local production-browser shopping simulation covers a real poster with no manual fields, both-language names, a second recipe, checked-item exclusion and PNG export, 320px layout, direct picker, drag/drop, invalid inputs, crop and manual recovery, with no page errors.

Retested the user's poster and the three previous web fixtures. The multi-column soup now yields an incomplete list automatically; small-print fractions and missing foods remain; captions over food still fail. These are tuned regression samples, not an independent accuracy benchmark. Sources and exact limitations are recorded in OCR-CHECKS.md. No model API, new dependency, physical camera trial, independent human usability test or GitHub push occurred. Publication is recorded separately after completion.

### 2026-09-19 - simplified-flow publication

Published Sites version 12 from `6810814d874b377f37cc24fcb172e966fb0d0e38`. Deployment `appgdep_6aae3ddd5ca881919737ee921355eba1` succeeded at 2026-09-19T07:48:53Z with environment revision 1. The URL remains https://pantry-weave-recipes.jidongan150.chatgpt.site and audience remains owner-private. Used the established remote source build because the local packaging helper could not start its shell; the local direct production build and browser checks passed. The final development backend push and a fresh real-cloud save/recovery/realtime/authz check also passed. No GitHub publication or provider activation occurred.

### 2026-09-19 - working tree: bilingual groceries, optional choices and retained checks

Unified exact food identity with the local display glossary and expanded equivalent unit spellings, including onion/洋葱 and pieces/个. Known imported foods receive shopping categories; differing foods or preparation labels are not fuzzily merged. Added persisted optional ingredient choices, with skip or one selection for explicit alternatives. Source rows are retained while all shopping outputs exclude unselected entries. Older OCR optional notes become editable choices without changing saved records until Save.

Plan mutations now preserve checks whose merged requirements did not change, covering add/edit/remove/servings and completed imports. A versioned legacy-key adapter avoids inheriting a partial old check when previously separate bilingual ingredients combine. Optional schema fields preserve existing data compatibility; all writes continue through existing owner checks, rate limits, argument validation and stale-edit rejection. Server-side validation forbids selecting two ingredients from one choice group.

Validation: 39 core tests and 12 backend tests pass with TypeScript and production build. Real development-cloud tests verify retained/cleared checks, choices saved and read back, double-choice rejection, realtime and account isolation; fixture recipes are removed. Production-browser grocery simulation covers manual English/Chinese recipes, actual-image alternatives, save/reopen/change, both languages, 320px layout, pantry exclusion and PNG download. Drag/drop, crop and failure recovery remain tested. No new dependencies, API service, GitHub publication, independent photo-accuracy sample or human/physical-camera usability trial was added. Publication is recorded separately after completion.

### 2026-09-19 - grocery-choice publication

Published Sites version 13 from `f860e474aa5a4a71a213c393c8e8a852cd63d6bb`. Deployment `appgdep_6aae5819f0d48191a1a61ab5698bb83a` succeeded at 2026-09-19T09:40:39Z with environment revision 1. The existing URL and owner-private audience are unchanged. Publication used the established remote source build because local packaging could not start its shell. Final development-backend push and fresh cloud save/recovery/check/choice/authz tests passed, as did the final local production build. No GitHub push or external provider activation occurred.

### 2026-09-19 - working tree: clear serving status and grouped shopping requirements

Made headers distinguish scaled recipes from original quantities. Grouped the same food visually in the checklist, text and PNG while retaining separate quantities, source notes and check keys. Existing Convex state, ownership and schema remain unchanged; shared export code pushed successfully to the existing development deployment.

44 core and 12 backend tests, type checking and production build passed. Browser checks cover mixed/all-original serving counts, partial checks, source-linked grouped amounts, English/Chinese at 320/390/1440px, downloaded PNGs and export after going offline on an already-loaded page. Delayed OCR-worker loading can be cancelled and manual entry remains usable.

Three previously unused public PDF recipe pages were rendered and uploaded. All failed the no-edit shopping-list criterion: omitted ingredients, misread fractions and instruction text entering ingredient rows. Added conservative OCR-only review guards for suspicious cup/spoon amounts and fraction residue, and kept English serving ranges unknown. Final reruns verify those guards, not general accuracy; complex bilingual columns remain unreliable. No physical-camera or first-time human trial, new dependency, provider activation or GitHub publication. Publication evidence follows separately.

### 2026-09-19 - grouped-shopping publication

Published Sites version 14 from `92d9bc6a32385f7630bd914d09b749e03a634d06`. Deployment `appgdep_6aaec084a06c8191b432ce62d37d2dd6` succeeded at 2026-09-19T17:06:42Z with environment revision 1. The existing URL and owner-private audience are unchanged. Used the established remote source build after the local packaging helper could not start its shell; the final local production build and focused browser checks passed. Shared Convex code was pushed to the existing development backend. No GitHub push or provider activation occurred.

### 2026-09-19 - ingredient-column OCR and cautious quantity reconciliation

Added automatic bounded ingredient-column rereads, word-level column clipping, same-baseline subcolumn separation, multiline title reconstruction and cross-read uncertainty handling. Common list separators, unit punctuation, optional continuations and damaged fractions are handled without turning cooking instructions into confident ingredient quantities. Numeric amounts need a second agreeing reading; conflicting readings keep a review warning. Approximate matching is confined to OCR review and does not change grocery identity/summing. Long OCR lines are bounded before regex extraction; source remains available.

54 core tests, TypeScript and production build pass. Ten full-image production-preview runs (seven regression fixtures plus three related pages from an existing public booklet) had no page errors. One new page exposed adjacent ingredient joining and was used in the fix; it is no longer independent evidence. Several printed lists now retain all food names, but fraction quantities, decorative names, stock-cube/coriander omissions and caption-photo failure remain. Exact findings are in OCR-CHECKS.md; no general accuracy score is claimed.

Browser grocery regression covers both languages, 320px layout, retained checks, alternatives saved/reopened, PNG exclusion/download, drag/drop, invalid inputs, crop/manual recovery and slow-worker cancellation. The final English shopping PNG was visually reviewed. No model API, new dependency, backend/schema deployment, GitHub push, physical-camera trial or human usability test occurred. Publication recorded separately after completion.

### 2026-09-19 - ingredient-column publication

Published Sites version 15 from `651d3be3c326ab9ffcef781447e49b340f54492e`. Deployment `appgdep_6aaed35e27b0819193a7f1405f3b1d71` succeeded at 2026-09-19T18:28:36Z with environment revision 1. The existing URL and owner-private audience remain unchanged. Used the established remote source build after local packaging could not start its shell; the exact source had passed the local production build and browser checks. No backend deployment, GitHub push or provider activation occurred.

### 2026-09-19 - assisted recognition comparison and whole-reply import

Stopped tuning OCR rules. Added a secondary entry to copy recipe-reading instructions, paste a complete ChatGPT reply, review ingredients and add one recipe through the existing save path. The page does not call ChatGPT or use a subscription as an API credential. Strict bounded data parsing preserves fractions and unknown amounts, rejects bad replies without partial saves, and leaves optional/alternative foods unselected. No backend/schema change or new dependency.

Read three old images and two new public PDF-page fixtures directly in this conversation. Current-assistant transcriptions recover several omitted foods and fractions but are context-assisted, not blind model scores. The two new images still reveal OCR failures. Five transcribed drafts pass import/schema checks. VISION-COMPARISON.zh-CN.md documents sources, method and remaining work; no API model was called and low-cost model evaluation remains pending access.

59 core tests, TypeScript and production build pass. Production-preview tests cover bilingual instructions, denied clipboard fallback, malformed replies, fractional/null amounts, optional selection, back/close state, two recipes, PNG download and 320px layout. Fixed changing textarea accessible names and narrow-screen overflow found in the new path. Existing household grocery regression passes. English review and downloaded shopping PNG were visually inspected. No physical-camera/human trial, new provider, GitHub push or cloud-backend deployment occurred. Publication recorded separately after completion.

### 2026-09-19 - whole-reply import publication

Published Sites version 16 from `3b925825e2309ab82d0806b11d947f91d8a55368`. Deployment `appgdep_6aaedb549a8c81919919c06d3f9adb62` succeeded at 2026-09-19T19:02:39Z with environment revision 1. The existing URL and owner-private audience remain unchanged. Used the established remote source build because local packaging could not start its shell. No backend deployment, GitHub push or provider activation occurred; automated low-cost vision-model evaluation remains pending API access.

### 2026-09-19 - working tree: user-account vision route

Integrated pinned Apache-2.0 Puter.js 2.6.3 for explicit user-authorized image recognition through Gemini 2.5 Flash-Lite. Public model metadata confirms image input; the SDK loads in the local production browser and opens the expected sign-in popup. Each user's own Puter allowance covers their AI requests; no shared developer key is added. Local OCR and whole-reply import remain available. Source/credit and cost limitations are recorded in THIRD_PARTY_NOTICES.md and VISION-SERVICE.zh-CN.md.

Images are shown before cloud consent, re-encoded without original names/metadata and capped to 2400px/4MP before sending. Fixed model, output cap, bounded wait, strict response validation, no app-level inference retries or expensive fallbacks. Cancelling ignores late results but does not promise provider cancellation/refunds. New page sessions reconfirm the Puter account instead of silently retaining a previous app user's AI token. Convex schema/functions and auth save path are unchanged.

63 core tests, TypeScript and production build pass. Browser checks use the actual SDK for loading/popup creation/cancel; mocked responses verify recipe review and quota errors. English/Chinese 320px layout has no horizontal overflow; local reading starts and cancels back to choice. Previous paste/grocery workflow regression passes. Found and fixed oversized PNG rejection using bounded JPEG upload. A follow-up check waiting for popup rendering confirmed the real Create Free Account form and Log In entry; no account was registered or signed in. Real inference, accuracy, latency and allowance cost remain explicitly unverified. Production npm dependency audit reports no known advisories. No GitHub push, account purchase, backend deployment or submission occurred. Publication recorded separately after success.

### 2026-09-19 - user-account vision publication

Published Sites version 17 from `d801c8cf69b9d4197697e4d1753b32587f4f66e3`. Deployment `appgdep_6aaeee5e5994819194822fa96936799e` succeeded at 2026-09-19T20:23:54Z with environment revision 1. Existing URL and owner-private audience are unchanged. The local production build passed; publication used remote source build because the configured packaging helper was no longer present on disk. No backend deploy or GitHub push. This publishes the integration for account testing, not a claim that real model recognition has passed acceptance.

### 2026-09-20 - working tree: website submission preparation

Prepared SUBMISSION.zh-CN.md with verified event links, a readiness checklist, a 2:40 demo script and a real-image acceptance worksheet. Chose the existing Sites website for submission; no native package, PWA, hosting migration or public release was made. Corrected README/ASSETS privacy wording to distinguish local OCR from explicitly authorized Puter/Google uploads, and updated the documented test scope.

Read-only checks confirmed owner-private site access and the intended GitHub account connection. A common-credential-format scan of 174 tracked files and 32 existing commits found no matches; only the blank .env.example appears among environment/key filenames. This is a bounded scan, not a comprehensive security guarantee. No runtime changes or new test claims. Real Puter account recognition, sponsor integration evidence, public access, repository publication and final submission remain pending.

### 2026-09-21 - working tree: no-new-account recipe handoff

Moved the main entry to instructions for reading a photo in an existing ChatGPT conversation and returning with a percent-encoded recipe link. Links stage strictly validated data for review, clear the address fragment, never save automatically and retain whole-JSON paste as recovery. Puter account creation failed in the user's trial; kept that integration only as an explicit experimental option, loaded on demand. This is a link handoff, not an API-backed image endpoint or published ChatGPT plugin.

Added bounded browser-local plans for signed-out use, reload recovery, storage-failure messaging, storage-event updates and rereading the latest list before mutations. Signed-in Convex plans remain separate; no backend/schema change or new dependencies.

68 core tests, TypeScript and production build passed; 12 backend authorization tests and 8 existing token/safety tests were independently rerun successfully. Browser production-preview checks passed link review, English/Chinese at 320px, fractions/unknown quantities, two-tab updates, refresh without duplicate import, invalid-link rejection, clipboard-denied recovery, no default provider calls, storage-denied fallback and PNG export. Whole-JSON fallback regression passed. Current-assistant image transcriptions are contextual, not blind model accuracy tests. Real ChatGPT-client link rendering, physical-phone use and hosted first-login remain unverified. Publication, public access, GitHub and submission recorded separately only after completion.

### 2026-09-21 - recipe-link publication and demo preparation

Published Sites version 18 from `5d7f5844d545e0b869e8ca5b00858966e19e2b72`.
Deployment `appgdep_6ab11dd82a948191af0768d2c174f403` succeeded at
2026-09-21T12:11:20Z, environment revision 1. Used remote source build after the
configured local packaging helper was absent; local production build and browser
checks passed. Existing URL and owner-private audience are unchanged.

Recorded a 75.92-second local UI demo draft with English subtitles. It shows recipe
link review, bilingual display, alternatives, merging, servings, checks, image
export and reload; explicitly discloses that assistant image reading happened
before recording and cloud authentication/sync are not demonstrated. Prepared an
updated submission description and social draft, neither submitted nor posted.
GitHub repository creation and explicit public-site access decision are pending.

### 2026-09-21 - public website access

After the user's explicit authorization, changed the existing Sites audience from
owner-private to public at 2026-09-21T12:33:43Z. An unauthenticated request returned
HTTP 200. A fresh browser without credentials or invitation showed an empty local
list and optional sign-in, accepted a recipe link, saved it locally and retained it
after refresh without page errors. No change to Convex owner checks or cloud data.
GitHub repository publication is awaiting the separate official Git authentication;
the existing connector does not expose a create-repository operation.

### 2026-09-21 - public source release

The user created the public GitHub repository. Published all 178 tracked files
through the existing GitHub connector; no additional Git authentication was needed.
Release commit `89c7e5f` has tree `e6b02aac2cf3cb029599564fce59bf6fba2dafef`,
identical to local snapshot `2462c47`. The release includes tests, the MIT license,
third-party notices and this log. Common credential-pattern checks covered 178
tracked files and 35 local commits with no matches; this is a bounded scan.
Updated the README and submission notes with the repository URL. The GitHub
release uses a source snapshot; the earlier local commit history was not imported.

### 2026-09-22 - narrated public-site demo

Recorded the public site's signed-out workflow, then the user supplied an edited
English narrated and captioned version. Full audio/video decoding completed at
115.04 seconds; the 31 subtitle entries preserve the demo's limitations. Published
the MP4 and SRT in `demo/`, with a linked README. No live AI inference, cloud login,
or cloud synchronization is claimed by the recording. X publication and the final
contest submission remain outstanding.

Demo: https://raw.githubusercontent.com/jidongan150-ui/pantry-weave/main/demo/pantry-weave-demo.mp4

### 2026-09-22 - user-provided X publication link

The user supplied https://x.com/EastgoCC/status/2102333720254619765 as the social
post for this entry. Added the URL to the submission materials. X returned HTTP
403 to the reading tool, so the post text, sponsor mentions and attached video
have not been independently verified. The final contest submission is still pending.

### 2026-09-22 - submission form success reported

The user completed the VibeApps submission form and supplied a screenshot showing
its green "Thanks for sharing!" success message. Recorded this as form submission
acknowledgement. The resulting app URL and association with the All Gas judging
event have not yet been independently verified; eligibility acceptance is not claimed.
