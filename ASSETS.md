# Image credit

`public/ingredients.jpg`: Healthy Living, StockSnap, CC0.
Source: https://stocksnap.io/photo/pasta-ingredients-WDQKXVP2S5
Image is illustrative, not a photograph of the sample recipes' completed dishes.

## Local OCR resources

Tesseract.js and Tesseract.js-core are installed as pinned dependencies and copied into the public build by `scripts/prepare-ocr.mjs`; their license notices are distributed with those assets. English and simplified-Chinese recognition data come from `@tesseract.js-data/eng` and `@tesseract.js-data/chi_sim` (4.0.0_best_int). User-selected images are never included in the build. Local OCR keeps images on the device; the optional AI route sends a re-encoded image to Puter and Google only after the user chooses that route. See `THIRD_PARTY_NOTICES.md` for the Puter SDK license.

Documentation: https://github.com/naptha/tesseract.js/blob/master/docs/api.md
Language data: https://github.com/naptha/tessdata
