export type ImageIngredient = { name: string; quantity: string; unit: string; note: string;included?:boolean;choiceGroup?:string };
export type ImageRecipeDraft = { name: string; servings: string; ingredients: ImageIngredient[]; omitted: string[]; fromSteps?: boolean };

function readableName(value: string) {
  const letters = value.match(/[a-z]/gi)?.length ?? 0;
  const cjk = value.match(/[\u3400-\u9fff]/g)?.length ?? 0;
  return (cjk >= 2 || foodAliases.has(value.trim()) || (letters >= 3 && /[a-z]{3}/i.test(value))) && !/[@®©<>{}=\\]/.test(value);
}

export function filterRecognizedLines(lines: { text: string; confidence: number }[]) {
  return lines.filter(line => Number.isFinite(line.confidence) && line.confidence >= 65 && readableName(line.text))
    .map(line => line.text.trim()).join('\n');
}

// Common ingredient words are matched only where they occur in instruction text.
// This is a candidate list for review, not inference from the dish or its illustration.
const foodGroups = [
  ['番茄','西红柿'], ['鸡蛋','蛋液'], ['葱','小葱','香葱','葱花','葱头','大葱'], ['蒜','大蒜','蒜末'], ['姜','生姜','姜末'],
  ['土豆','马铃薯'], ['洋葱'], ['胡萝卜'], ['白萝卜'], ['黄瓜'], ['茄子'], ['白菜'], ['青菜'], ['菠菜'], ['西兰花'], ['芹菜'], ['韭菜'], ['香菜'], ['生菜'], ['冬瓜'], ['南瓜'], ['丝瓜'], ['豆角'], ['青椒'], ['红椒'], ['辣椒'], ['香菇'], ['蘑菇'], ['木耳'], ['玉米'],
  ['猪肉'], ['牛肉'], ['鸡肉'], ['鸭肉'], ['羊肉'], ['排骨'], ['五花肉'], ['虾仁'], ['虾'], ['鱼肉'], ['豆腐'], ['牛奶'], ['奶油'], ['黄油'], ['奶酪'], ['酸奶'],
  ['大米'], ['米饭'], ['面粉'], ['面条'], ['意大利面'], ['淀粉'], ['土豆淀粉'], ['玉米淀粉'], ['燕麦'], ['红豆'], ['绿豆'], ['花生'], ['芝麻'],
  ['橄榄油'], ['芝麻油','香油'], ['食用油','油','植物油'], ['盐','食盐'], ['糖','白糖','白砂糖','砂糖'], ['冰糖'], ['红糖'], ['生抽'], ['老抽'], ['酱油'], ['蚝油'], ['料酒'], ['白醋'], ['米醋'], ['醋'], ['胡椒粉'], ['黑胡椒'], ['白胡椒'], ['孜然'], ['花椒'], ['八角'], ['桂皮'], ['味精'], ['鸡精'], ['番茄酱'], ['豆瓣酱'], ['水','清水'],
];
const foodAliases = new Map(foodGroups.flatMap(group => group.map(word => [word, group[0]] as const)));
const foodPattern = new RegExp([...foodAliases.keys()].sort((a, b) => b.length - a.length).join('|'), 'g');

function ingredientsFromSteps(lines: string[]): ImageIngredient[] {
  const found = new Map<string, ImageIngredient>();
  for (const line of lines) {
    // Ignore decorative labels, headings, attribution, and standalone image noise.
    if (!/^(?:说明|.*秘技|心得|做法|步骤)\s*[:：;；\d]|(?:加入|放入|倒入|撒入|加少|加一|加糖|加盐|热锅|切末|切花)/.test(line)) continue;
    for (const match of line.matchAll(foodPattern)) {
      const before = line.slice(Math.max(0, match.index! - 5), match.index);
      if (/(?:不加|不放|不要|无需|不需要|去掉)$/.test(before)) continue;
      const name = foodAliases.get(match[0])!;
      const clause = line.split(/[。；;]/).find(part => part.includes(match[0])) || line;
      const alternatives=[...clause.matchAll(new RegExp(`(${foodPattern.source})\\s*或\\s*(${foodPattern.source})`,'g'))].flatMap(pair=>[foodAliases.get(pair[1]),foodAliases.get(pair[2])]);
      const alternative=alternatives.includes(name);const optional=alternative||/可选/.test(clause);
      const note = (optional ? '可选或替代，原文：' : '原文：') + clause;
      if (!found.has(name)) found.set(name, { name, quantity: '', unit: '', note: note.slice(0, 200),...(optional?{included:false}:{}),...(alternative?{choiceGroup:clause.slice(0,200)}:{}) });
    }
  }
  return [...found.values()];
}

const fractionValues: Record<string, string> = { '½': '1/2', '¼': '1/4', '¾': '3/4', '⅓': '1/3', '⅔': '2/3', '⅛': '1/8', '⅜': '3/8', '⅝': '5/8', '⅞': '7/8' };
const units = 'tablespoons?|teaspoons?|kilograms?|milliliters?|millilitres?|liters?|litres?|grams?|cups?|tbsp|tsp|ounces?|pounds?|cloves?|pieces?|cans?|kg|ml|oz|lb|g|l|千克|公斤|毫升|汤匙|茶匙|大匙|小匙|克|斤|两|升|杯|个|根|瓣|片|颗|只|枚|把|罐';
const number = '(?:\\d+\\s+\\d+\\s*[/⁄]\\s*\\d+|\\d+\\s*[/⁄]\\s*\\d+|\\d*\\.\\d+|\\d+)';
const prefix = new RegExp(`^(${number})\\s*(?:(${units})(?=\\s|[^a-zA-Z]|$)\\.?\\s*)?(.+)$`, 'i');
const suffix = new RegExp(`^(.+?)\\s*[：:]?\\s*(${number})\\s*(${units})?$`, 'i');
const ingredientHeading = /^(?:ingredients?|what you(?:'|’)ll need|食材(?:准备)?|用料|材料|配料|主料|辅料)[：:]?$/i;
const endHeading = /^(?:instructions?|directions?|method|preparation|steps?|nutrition|tools|equipment|做法|步骤|制作方法|烹[饪飪調调](?:步骤|方法)|喜饪步骤|食材处理|营养|小贴士|温馨提示)(?:[：:]|\s|\d|$)/i;
const servingLine = /(?:serv(?:es|ings?)\s*[:：]?\s*\d|\d+\s*servings?|\d+\s*人份?|份量\s*[:：])/i;

export function imageQuantity(value: string): number | null {
  const s = value.trim();
  let n: number;
  const mixed = s.match(/^(?:(\d+)\s+)?(\d+)\s*[/⁄]\s*(\d+)$/);
  if (mixed) n = Number(mixed[1] || 0) + Number(mixed[2]) / Number(mixed[3]);
  else if (/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(s)) n = Number(s);
  else return null;
  return Number.isFinite(n) && n > 0 && n <= 100000 ? n : null;
}

// Conservative text extraction, not a model: retain uncertain lines for the review step.
export function extractImageRecipe(text: string): ImageRecipeDraft {
  const draft: ImageRecipeDraft = { name: '', servings: '', ingredients: [], omitted: [] };
  const lines = text.slice(0, 20000).split(/\r?\n/).map(s => s.trim().replace(/^(?:[•●·*。]+\s*|[-–]\s+)/, '').replace(/\s+/g, ' ').replace(/([\u3400-\u9fff])\s+(?=[\u3400-\u9fff])/g, '$1')).filter(Boolean)
    .filter(line=>{if(line.length<=500)return true;draft.omitted.push(line.slice(0,200));return false;})
    .reduce<string[]>((rows,line)=>{if(rows.length&&/\bor$/i.test(rows.at(-1)!))rows[rows.length-1]+=' '+line;else rows.push(line);return rows;},[])
    .flatMap(line => {
      const inline = line.match(/^(食材|材料|配料|用料)\s*[:：]\s*(.+)$/);
      if(inline)return [inline[1], ...inline[2].split(/[、，,。]/).map(s => s.trim()).filter(Boolean)];
      if(/[\u3400-\u9fff].*\d\s*(?:克|个|毫升).*、/.test(line))return line.split('、').map(s => s.trim()).filter(Boolean);
      // Split compact ingredient lists only when the first two clauses each
      // contain explicit amounts. A preparation comma remains with its food.
      const parts=line.split(/,\s+/);if(parts.length>1&&parts.slice(0,2).every(part=>prefix.test(part)))return parts;
      return [line];
    });
  const headingIndex = lines.findIndex(s => ingredientHeading.test(s));
  const isStepRecipe = lines.some(line => /步骤\s*\d/.test(line)) && lines.some(line => /^说明\s*[:：]/.test(line));
  const servingCandidates = lines.filter(s => servingLine.test(s) && !/\d\s*(?:[-–~到至./]|to)\s*\d/i.test(s));
  for (const line of servingCandidates) {
    const match = line.match(/(?:serv(?:es|ings?)\s*[:：]?\s*)(\d+)|(?:^|\s)(\d+)\s*servings?|(?:^|\s)(\d+)\s*人份?|份量\s*[:：]\s*(\d+)/i);
    const value = match?.slice(1).find(Boolean);
    if (value && Number(value) >= 1 && Number(value) <= 100) { draft.servings = value; break; }
  }
  const hasMeasuredList = headingIndex >= 0 && lines.slice(headingIndex + 1).some(line => line.match(prefix)?.[2] || line.match(suffix)?.[3]);
  if (isStepRecipe && !hasMeasuredList) {
    const candidates = ingredientsFromSteps(lines);
    if (candidates.length >= 2) {
      const title = lines.find(line => readableName(line) && line.length <= 120 && !/^(?:步骤|说明|.*秘技|心得)/.test(line) && !ingredientHeading.test(line));
      draft.name = (title ?? '').replace(/^[《〈「\s]+|[》〉」\s]+$/g, '');
      draft.ingredients = candidates; draft.fromSteps = true;
      // The complete recognized text is retained by the caller for reviewing omissions.
      return draft;
    }
  }
  let inIngredients = headingIndex < 0;
  for (const [index, original] of lines.entries()) {
    if (ingredientHeading.test(original)) { inIngredients = true; continue; }
    if (endHeading.test(original)) break;
    if (servingLine.test(original)) continue;
    if (/^(?:seasonings?|sauce|marinade|调味料|調味料|芡汁|醃料|腌料)[:：]?$/i.test(original)||/^\(?(?:remark|note|注|註)\s*[:：]/i.test(original)) {draft.omitted.push(original);continue;}
    if (/^(?:drain|wash|add|mix|put|cook|bring|stir|heat|serve|rinse|beat|thicken|chop|bake)\s/i.test(original)) {draft.omitted.push(original);continue;}
    if (/^[\d|ⅠIlV/½¼¾\s.+]+\s*(?:tbsp|tsp|cups?|g|ml)\s*$/i.test(original)) { draft.omitted.push(original); continue; }
    // Numbered instructions are not quantities; poster titles may start with a list number.
    if (/^\d+\s*[、.．]\s*\S/.test(original)) { draft.omitted.push(original); continue; }
    if (!inIngredients) { if (!draft.name && index < headingIndex) draft.name = original.slice(0, 120); else draft.omitted.push(original); continue; }
    let line = original.replace(/[½¼¾⅓⅔⅛⅜⅝⅞]/g, (f, offset: number) => (offset > 0 && /\d/.test(original[offset - 1]) ? ' ' : '') + fractionValues[f]);
    line=line.replace(/\s+(?:[—–]|-\s|一\s)\s*(?=\d|[/?½¼¾%¥]|small amount|to taste|as needed)/gi,' ');
    line = line.replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
    // OCR can add spaces between CJK characters. Do not join English words.
    line = line.replace(/([\u3400-\u9fff])\s+(?=[\u3400-\u9fff])/g, '$1');
    let row: ImageIngredient | undefined;
    const unknown = line.match(/^(.*?)\s*(?:to taste|as needed|small amount|适量|少许|少量)\s*$/i);
    if (unknown?.[1]) row = { name: unknown[1].trim(), quantity: '', unit: '', note: original };
    // Ranges, multipacks, approximate values and alternatives require manual review.
    const ambiguous = /[-−]\s*\d|\d\s*[–~至到×x+,]\s*\d|\d\s+to\s+\d|\d.*\([^)]*\d|\b(?:about|approx|or)\b|约|半|一|二|三|四|五|六|七|八|九|十|[<>≤≥]/i.test(line);
    const uncertainSuffix=line.match(new RegExp(`^(.+?)\\s+([/?%¥IlV][\\d/a-z]*|\\d*[/⁄])\\s+(${units})$`,'i'));
    if(!row&&uncertainSuffix)row={name:uncertainSuffix[1].trim(),quantity:'',unit:uncertainSuffix[3],note:'用量待核对，原文：'+original};
    if (!row && !ambiguous) {
      const first = line.match(prefix);
      const last = line.match(suffix);
      if (first) row = { name: first[3].trim(), quantity: String(imageQuantity(first[1]) ?? ''), unit: first[2] || '', note: '' };
      else if (last) row = { name: last[1].trim(), quantity: String(imageQuantity(last[2]) ?? ''), unit: last[3] || '', note: '' };
      const amount=first?.[1]??last?.[2];
      if(row&&amount&&/^\d{2,}\s*[/⁄]\s*\d+$/.test(amount)){row.quantity='';row.note='用量待核对，原文：'+original;}
    }
    // Keep names clean when a trailing fraction is visibly incomplete/garbled.
    if (!row && headingIndex >= 0 && inIngredients && line.length <= 80) row = { name: original, quantity: '', unit: '', note: original };
    if (!row && !draft.name && index === 0 && !/\d/.test(line)) { draft.name = original.slice(0, 120); continue; }
    if (!row || !readableName(row.name) || row.name.length > 80 || draft.ingredients.length >= 80) { draft.omitted.push(original); continue; }
    // A unit misread as part of a name must not become a confident quantity.
    if (row.quantity && !row.unit && /^(?:Ibs|lbs|Tbsp|tsp|[IlV]\s*\/?\s*\d+\s+cups?)\b/i.test(row.name)) { row.name=original;row.quantity='';row.note='用量待核对，原文：'+original; }
    // A missing fraction slash can turn 1 1/2 cups into 112 cups. These are
    // review thresholds for OCR only, not a claim that larger batches are impossible.
    // Keep the source; never guess the intended fraction. Manual edits are unrestricted.
    if(row.quantity&&((/^(?:cups?|杯)$/i.test(row.unit)&&Number(row.quantity)>20)||(/^(?:tbsp|tsp|tablespoons?|teaspoons?|汤匙|茶匙)$/i.test(row.unit)&&Number(row.quantity)>60))){
      row.quantity='';row.note='用量待核对，原文：'+original;
    }
    if (!row.quantity && !row.note) row.note = original;
    if(/\boptional\b|可选/i.test(original)&&!/\bnot\s+optional\b|不可选/i.test(original))row.included=false;
    draft.ingredients.push(row);
  }
  return draft;
}

export function validateRecipeImage(file: Pick<File, 'size' | 'type'>) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('format');
  if (file.size <= 0 || file.size > 10 * 1024 * 1024) throw new Error('size');
}
