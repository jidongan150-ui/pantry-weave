import {parseRecipePaste, recipeRecognitionPrompt} from './recipe-paste.ts';
import type {Language} from './i18n.ts';

export const RECIPE_LINK_PREFIX = '#recipe=';
export const MAX_RECIPE_LINK_LENGTH = 24000;

// A fragment is handled by the browser, not sent in the HTTP request. It is
// untrusted input: validate the whole recipe before showing the review form.
export function parseRecipeLink(hash: string) {
  if (!hash.startsWith(RECIPE_LINK_PREFIX)) return null;
  if (hash.length > MAX_RECIPE_LINK_LENGTH) throw Error('long');
  return parseRecipePaste(decodeURIComponent(hash.slice(RECIPE_LINK_PREFIX.length)));
}

export function createRecipeLink(recipe: unknown, origin: string) {
  const text = JSON.stringify(recipe);
  parseRecipePaste(text);
  const hash = RECIPE_LINK_PREFIX + encodeURIComponent(text);
  if (hash.length > MAX_RECIPE_LINK_LENGTH) throw Error('long');
  const base = new URL('/', origin);
  if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password) throw Error('origin');
  return base.href + hash;
}

export function recipeLinkPrompt(language: Language, origin: string) {
  const base = new URL('/', origin);
  if (!['http:', 'https:'].includes(base.protocol)) throw Error('origin');
  return recipeRecognitionPrompt(language).replace('Return ONLY one JSON object with exactly this structure (no introduction):', 'First prepare one JSON object with exactly this structure:') +
    `\n\nAfter reading the image, make a clickable Pantry Weave import link. Encode the compact JSON as a URL fragment using encodeURIComponent(JSON.stringify(recipe)) in JavaScript, or urllib.parse.quote(json.dumps(recipe, ensure_ascii=False, separators=(',', ':')), safe='') in Python. Use a code tool to encode it if available; do not use base64. The exact link prefix is ${base.href}#recipe=. Return a short readable ingredient summary and one Markdown link [${language === 'en' ? 'Review ingredients in Pantry Weave' : '核对并加入购物清单'}](FULL_LINK). The website only previews it; I will confirm before saving. Do not call any website or send the recipe elsewhere. The encoded fragment must be under 24,000 characters. If you cannot produce the link reliably, return the complete JSON in a single code block instead. If I send another recipe image later, follow the same instructions again. Do not include any credentials or personal information. A link contains the recipe, so anyone I share it with can read it.`;
}
