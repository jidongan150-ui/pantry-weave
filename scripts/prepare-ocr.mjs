import { mkdirSync, copyFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const target = path.join(root, 'public', 'ocr');
mkdirSync(target, { recursive: true });
copyFileSync(path.join(root, 'node_modules/tesseract.js/dist/worker.min.js'), path.join(target, 'worker.min.js'));
const core = path.join(root, 'node_modules/tesseract.js-core');
for (const name of readdirSync(core)) {
  if (/^tesseract-core.*\.wasm(?:\.js)?$/.test(name)) copyFileSync(path.join(core, name), path.join(target, name));
}
for (const lang of ['eng', 'chi_sim']) copyFileSync(path.join(root, `node_modules/@tesseract.js-data/${lang}/4.0.0_best_int/${lang}.traineddata.gz`), path.join(target, `${lang}.traineddata.gz`));
copyFileSync(path.join(root, 'node_modules/tesseract.js/LICENSE.md'), path.join(target, 'LICENSE-tesseract.txt'));
copyFileSync(path.join(core, 'LICENSE'), path.join(target, 'LICENSE-core.txt'));
