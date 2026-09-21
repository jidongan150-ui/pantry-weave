# Recognition dependencies and references

## Puter.js (used in the app)

`@heyputer/puter.js` 2.6.3, Copyright 2024-present Puter Technologies Inc.
Licensed under Apache License 2.0; copy at `public/licenses/puter-apache-2.0.txt`.
Source: https://github.com/HeyPuter/puter/tree/main/src/puter-js
The SDK is pinned in package.json/package-lock.json and bundled locally without modifications.
Pantry Weave uses its browser authentication and AI chat modules only. We do not
copy or deploy the full Puter server/desktop (which has a different license).
No endorsement by Puter or Google is implied.

## Projects reviewed (not copied)

- FridgeJam, Stephen Agyemang, MIT:
  https://github.com/Stephen-Agyemang/FridgeJam/tree/1012faa682db4cd630a2ca07a2d64ced715687e1
  Reviewed backend/main.py image scan and structured image analysis. Its direct
  vision request, bounded image input and review pattern support moving away
  from OCR-only extraction. No source, prompts, branding or assets were copied.
- Mealie, AGPL-3.0: https://github.com/mealie-recipes/mealie
  Reviewed documented recipe/image import capabilities as a product reference;
  did not import its backend or code. Its model integration also needs a provider.

Other existing dependencies retain their own licenses.
