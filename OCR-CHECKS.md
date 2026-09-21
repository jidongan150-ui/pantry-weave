# Real-world recipe-image checks — 2026-09-18 UTC

Latest follow-up: [VISION-COMPARISON.zh-CN.md](VISION-COMPARISON.zh-CN.md) records three old fixtures and two new public-page samples. No OCR rules were tuned in that follow-up. Current-assistant, context-assisted transcriptions can be imported via the new paste flow; no low-cost API model was tested and those transcriptions are not blind accuracy evidence.

Five additional images were selected from web image search before observing results. This is a small convenience sample across layouts, not a statistical accuracy benchmark. The original image files were downloaded only into ignored local test storage; they are not redistributed in the app or source. Browser checks use the actual upload, OCR, extraction and review flow.

| Source | Layout | Observed result after fixes |
| --- | --- | --- |
| [Canva pancake template](https://www.canva.com/templates/s/recipe/) ([image](https://marketplace.canva.com/EAF_asJtgSY/2/0/566w/canva-white-minimalist-food-recipe-magazine-a4-Cln80zeGmm0.jpg)) | English printed ingredient list | Eight ingredient rows and explicit amounts extracted; decorative title misread as `PANC AKI`, requiring correction. |
| [39 Health recipe card](https://m.39.net/news/a_v4w18pb.html) ([image](https://pimg.39.net/PictureLib/A/f76/20251105/org_1985967037838655499.png)) | Chinese ingredients in one sentence | Four ingredients extracted; tomato and egg counts preserved, salt/oil unspecified. Title has an extra OCR character. Source selected only as an OCR sample, not medical guidance. |
| [Weee Kung Pao seasoning](https://www.sayweee.com/zh/product/Haidilao-Kung-pao-chicken-seasoning/2259417) ([image](https://img06.weeecdn.com/description/image/396/457/2A973E2D118E82D8.jpeg)) | Chinese ingredients and illustrated numbered instructions | Four reliable measured rows extracted. Lower-confidence ingredients are missing and need manual addition. Numbered cooking steps are no longer treated as quantities. |
| [Raddish Kids mashed potatoes](https://www.raddishkids.com/blogs/bonus-bites/classic-mashed-potatoes) ([image](https://cdn.shopify.com/s/files/1/0300/1545/files/BONUS_GermanMashedPotatoes_FNL_Page1.jpg?v=1659553230)) | English multi-column ingredients and tools | Title and six servings read. Ingredient fragments are incomplete; column quantities need manual matching. Tools are excluded; suspicious `Ibs` OCR does not become a confident quantity. |
| [CBS / Rosa Parks handwritten recipe](https://www.cbsnews.com/detroit/news/library-of-congress-posts-rosa-parks-pancake-recipe-written-on-detroit-bank-envelope/) ([image](https://assets2.cbsnewsstatic.com/hub/i/r/2024/02/22/2648e0cf-2bc1-49b2-a904-90510c87e2af/thumbnail/1240x2200/cf74fb834e9afec42fa9601ef98e88bb/rosa-parks-pancake-recipe.jpg)) | Handwriting on an envelope | Rejected as unreliable, with no automatic ingredient form. |

These results do not establish complete automatic recipe recognition. Review all ingredients against the source, especially multi-column lists, small captions, missing lines and decorative titles. Browser filtering deliberately sacrifices recall for fewer garbage rows.

The user-supplied illustrated recipe remains a separate regression: seven main foods and two alternatives, no invented servings or amounts. English/Chinese result-card switching, original-text preservation, actual PNG downloads, 320px layout and confirm-to-shopping-list were exercised in the browser. The card is drawn from editable data; images and names are never sent to a model service. Browser-native translation is optional and may need a model download or be unavailable. Local glossary fallback leaves unknown text explicitly marked as original.

All five samples and the card flow were rerun on the local production build. Native Translator was exposed by the test browser but reported the English/Chinese pair as unavailable; full free-text translation therefore remains unverified. The fallback was verified, as was cancellation when switching languages and editing during translation. The local glossary does not provide universal translation.


## Additional unseen-image checks — 2026-09-18 UTC

Selected three additional available images before inspecting their OCR output. Retrieval of an initially selected MercyOne card failed, Nestlé returned 403 and a Wix-hosted card failed to download; these are not OCR failures and were not tested. The following are convenience samples, not an accuracy benchmark. They were kept only in ignored local storage.

| Source | Full-image result | Recovery tested |
| --- | --- | --- |
| [Inverclyde Community Food Network, Carrot and Lentil Soup](https://icfn.org.uk/soup-recipes) | Multiple columns: no reliable ingredient draft. | The in-app crop selected the ingredient column and produced six rows, including oil 1 tbsp, onion 1, garlic 2 cloves, carrots 3, lentils 150 g and stock cube 1. Carrot text contains an extra OCR letter; water and optional spice remain missing. Manual review is required. |
| [Know Diabetes, Carrot & Lentil Soup card](https://www.knowdiabetes.org.uk/know-more/type-2-diabetes/type-2-remission/very-low-calorie-diet-vlcd/) | Ten rows, four with explicit amounts; six quantities remain unknown. Coriander was omitted and the subtitle was used as the name. No serving count was inferred. | The same editable form exposes unknown quantities and full recognized text for correction. Source is used solely as an OCR fixture, not as dietary guidance. |
| [Douguo, tomato and fried-egg noodles](https://www.douguo.com/cookbook/3218472.html) | White/orange captions over food photos: rejected as unreliable. | Cropping the sauce-caption area still failed. The new manual fallback kept the image and allowed entry, confirmation and addition to the shopping list. |

No extraction rules were tuned to these three images. The existing user poster remains a separate regression. The local production build was used to verify the new review/edit flow, crop recovery, manual fallback, shared language, final PNG and 320px layout. Cropping is an aid, not a guarantee; it can also exclude needed ingredients, so the user must review the selection and source. First-time human usability tests have not been run; automated browser checks do not substitute for them.

## Simplified-flow regression checks — 2026-09-19

The three images above are now regression fixtures: layout handling has been adjusted after observing them, so they are no longer independent unseen-image evidence. No new image retrieval was needed this round. The final local production build used each complete image through the normal upload entry, without cropping or manually entering servings.

| Fixture | Final observed result |
| --- | --- |
| User's illustrated tomato-and-eggs poster | Nine rows: seven main ingredients and two marked alternatives. No amounts or servings invented. The complete add-to-list flow succeeds without filling any fields. Both-language ingredient display and PNG were checked. |
| ICFN multi-column soup | Seven rows automatically, including five explicit quantities. Onion and stock cube are missing; the optional spice phrase remains split and unquantified. This improves on the previous full-image rejection but is incomplete. |
| Know Diabetes small-type soup | Ten rows, six with explicit quantities. Lentils and yogurt correctly retain 30 g; fraction amounts remain unknown. Coriander is missing, stock-cube text is garbled and the decorative title remains unreliable. |
| Douguo captions over food photo | Rejected as unreliable. Crop retry still failed; manual fallback and preserving the full source image were verified. |

Typical measured recognition time was approximately 3.6–5.2 seconds on this test machine after local resources were available; this is not a phone or cold-download performance guarantee. All four final runs had no browser page errors. A discovered cross-line digit-joining defect was fixed and covered by a regression test: detached digits cannot replace the following ingredient's amount. A more aggressive second OCR pass produced incorrect fraction quantities during experimentation and was not retained. Geometry reconstruction joins same-baseline fragments only; it does not reconstruct illegible numbers.

Automated household-shopping simulation covered choosing a file directly, image-language switching, editing without source mutation, adding without servings, a second recipe, pantry checkmarks, both-language final PNGs, drag/drop, invalid inputs, crop/manual recovery, and 320px layout. The camera input requests the rear camera; physical phone-camera capture and independent human usability remain untested. OCR step excerpts remain saved and editable but no longer clutter shopping output; optional/alternative warnings remain visible. Free-text translation and complete automatic extraction are still not guaranteed.

## Grocery-choice follow-up — 2026-09-19

Retested the actual user poster through upload, selection, saving, reopening and PNG export. Its seven main foods appear immediately; the two explicit alternatives (water/milk) start unselected in a collapsed choice group. Choosing one replaces the other; switching languages and saving/reopening preserve the selection. Neither the selected count nor exported list includes the skipped option. This is a behavior regression, not new recognition-accuracy evidence. The existing caption-photo failure/crop/manual recovery path also remains usable. Prior image-quality limitations still apply.

## New public-document image checks — 2026-09-19 UTC (September 20 local)

Selected three previously unused recipe pages before their first upload. Original PDFs were rendered at a maximum dimension of 1800 pixels and uploaded as complete page images through the production-browser UI. These are convenience samples of printed recipes, not physical photographs or a randomized accuracy benchmark. Chester returned HTML instead of its PDF; Panasonic and Food Pantry returned 403. Those retrieval failures were excluded rather than counted as recognition failures. Files remain ignored local fixtures.

| Source / page | First observed result | Final result after safety guards |
| --- | --- | --- |
| [North Dakota Department of Agriculture, Vegetable Soup](https://www.ndda.nd.gov/sites/www/files/documents/files/Vegetable%20Soup%20Recipe%20Card.pdf), page 2 | Eleven rows. Onion and the last seasoning line were missing; salt was garbled. The green-bean fraction became **112 cups**, and the tomato fraction became a confident 3 with the remaining fraction in the name. | Both suspect quantities now stay unknown with a visible amount-review warning; no intended fraction is guessed. The missing foods and imperfect names remain. |
| [Hong Kong Centre for Health Protection, Healthy Vegetable Recipes](https://www.chp.gov.hk/files/her/exn_nutp_043b.pdf), page 10, Tomato Cups with Tuna | Twenty-two rows, all amounts unknown. Several cooking instructions/headings became ingredient candidates and columns were mixed. Ten servings was read correctly. | Still unreliable; no claim that this layout is supported. |
| Same booklet, page 2, Broccoli Chowder | Seven rows, only one amount. Broccoli and several other ingredients were absent; instruction fragments appeared as foods. The stated 2–3 servings became 2. | The serving range now stays unknown. Ingredient extraction remains unreliable. |

All three failed the practical criterion of a complete, correctly quantified list without edits. After inspection, two generic safety guards were added: English `to` serving ranges remain unknown; suspect fraction residue and very large OCR cup/spoon quantities retain source text without a confident amount. Thresholds (over 20 cups or 60 tablespoons/teaspoons) are review heuristics, not universal recipe limits; legitimate large batches may also need confirmation. Manual quantities are not restricted by these OCR thresholds. They do not detect every misread fraction. Subsequent reruns are regression evidence, not an independent accuracy improvement measurement.

Final runs took approximately 2.5–4.1 seconds on the desktop test machine with local OCR resources available, with no page errors. Physical phone capture, cold mobile download performance and first-time human usability are still untested. These findings support prioritizing extraction reliability over adding more features.

## Ingredient-column rereading — 2026-09-19 UTC (September 20 local)

The scanner now locates the ingredient column, excludes neighboring method text and automatically rereads a bounded crop twice. English ingredient columns are preferred on bilingual pages; words crossing a column boundary are clipped, and complete ingredients in side-by-side subcolumns remain separate. Only agreeing readings retain numerical amounts; disagreement and damaged fraction text produce a review warning. This is a conservative heuristic, not a guarantee that agreeing OCR results are correct.

Ten full images were uploaded through the final local production UI at 390px. Seven were existing regression fixtures. Three additional pages (4, 6, 8) came from the already downloaded CHP booklet above, so they are related printed layouts rather than random photographs. The shrimp page initially exposed joined adjacent ingredients; it was used to fix that rule and is now a tuned regression fixture. All ten final runs had no browser page errors, taking about 3–6 seconds with local OCR resources available.

| Fixture | Final result and remaining correction |
| --- | --- |
| NDDA vegetable soup | All 16 food names represented; salt and green-bean amounts require checking. The tomato amount is 3.5 cups. No method rows. |
| CHP tomato cups, p10 | Nine foods represented and 10 servings read. Three half-cup amounts remain unknown; Sweet con is still misspelled. No method rows. |
| CHP broccoli chowder, p2 | Eight foods represented. Water's fraction and the 2–3 serving range remain unknown. No method rows. |
| User's illustrated poster | Seven main foods and two initially unselected alternatives; no invented amounts/servings. Save/reopen, exclusive choice, both languages and PNG pass. |
| ICFN carrot soup | Six main foods including onion; stock cube still missing. Onion quantity and decorative title need correction. Optional spice wording is now kept together and initially unselected. |
| Know Diabetes carrot soup | Ten rows; coriander still missing and title/stock-cube wording imperfect. Four numerical amounts confirmed; cumin/oil changed from numerical output to review warnings because rereads disagree. This increases manual review for those quantities. |
| Douguo caption photo | Still rejected as unreliable; crop/manual recovery works. |
| CHP shrimp, p4 | Twelve rows; adjacent cucumber/shrimp rows stay separate and the full title is read. Shallot/ginger amounts remain embedded in names, and sugar's fraction needs review. Repeated cornstarch requirements remain distinct. |
| CHP rice, p6 | Five foods and full title read. Complex rice-cup wording and ginger slices remain unstructured; serving range unknown. |
| CHP pancakes, p8 | Eight foods and full title read; five numerical amounts retained, lemon fraction needs review. |

54 core tests, TypeScript and production build pass. Browser regression additionally covers 320px English/Chinese review, known bilingual-food merging, retained checkmarks, alternatives saved/reopened, PNG download/exclusion of checked or skipped foods, drag/drop, invalid files, crop/manual fallback and cancellation during slow worker loading. The English final shopping PNG was visually reviewed. These checks do not establish complete automatic extraction, universal translation, an objective score, physical-camera performance or first-time human usability. No new provider, dependency or external image retrieval was added this round.
