import test from 'node:test';
import assert from 'node:assert/strict';
import { extractImageRecipe, filterRecognizedLines, imageQuantity, validateRecipeImage } from '../lib/recipe-image.ts';
import {localizeRecipe,localRecipeText} from '../lib/recipe-language.ts';

test('handles inline Chinese lists and excludes numbered cooking instructions and tools',()=>{
 const r=extractImageRecipe('番茄炒蛋\n材料：番茄2个，鸡蛋2个，盐适量，油适量。\n做法：热锅炒制');
 assert.equal(r.ingredients.length,4);assert.deepEqual(r.ingredients.slice(0,2).map(x=>x.quantity),['2','2']);
 const other=extractImageRecipe('Potatoes\nIngredients\n2 Ibs Yukon gold\npotatoes\n3 Tbsp\nbutter\nTools\nknife\n1、锅中下油');
 assert.ok(other.ingredients.every(x=>!x.name.includes('knife')&&!x.name.includes('锅')));
 assert.equal(other.ingredients[0].quantity,'');assert.equal(other.ingredients.length,3);
});

test('switches recipe content in both directions without mutating source or inventing unknown terms',()=>{
 const source={name:'Tomato Scrambled Eggs',servings:'',ingredients:[{name:'鸡蛋',quantity:'3',unit:'个',note:''},{name:'盐',quantity:'',unit:'',note:'盐适量'},{name:'mystery powder',quantity:'',unit:'',note:'do not substitute'}],omitted:[]};
 const en=localizeRecipe(source,'en');const zh=localizeRecipe(source,'zh');
 assert.equal(en.ingredients[0].name,'Eggs');assert.equal(en.ingredients[0].unit,'pieces');assert.equal(en.ingredients[1].note,'salt to taste');
 assert.equal(zh.name,'番茄炒蛋');assert.equal(zh.ingredients[2].name,'mystery powder');assert.equal(zh.untranslated,2);
 assert.equal(source.ingredients[0].name,'鸡蛋');assert.equal(en.servings,'');assert.equal(en.ingredients[1].quantity,'');
 assert.equal(localRecipeText('Classic Mashed Potatoes','zh').text,'经典土豆泥');
});

test('extracts explicit English amounts including fractions, and stops at directions', () => {
  const r = extractImageRecipe('Tomato pasta\nServes 2\nIngredients\n200 g pasta\n1½ cups tomatoes\n1/2 tsp salt\n2 eggs\nDirections:\nBake 20 minutes');
  assert.equal(r.name, 'Tomato pasta'); assert.equal(r.servings, '2');
  assert.deepEqual(r.ingredients.map(x => [x.name, x.quantity, x.unit]), [['pasta','200','g'],['tomatoes','1.5','cups'],['salt','0.5','tsp'],['eggs','2','']]);
});
test('extracts Chinese amounts and leaves unspecified seasoning unknown', () => {
  const r = extractImageRecipe('番茄炒蛋\n2 人份\n食材\n番 茄 300 克\n鸡蛋 3 个\n盐 适量\n做 法 ：\n翻炒 5 分钟');
  assert.equal(r.servings, '2'); assert.equal(r.ingredients.length, 3);
  assert.deepEqual(r.ingredients.map(x => [x.name, x.quantity]), [['番茄','300'],['鸡蛋','3'],['盐','']]);
});
test('does not invent servings or collapse ranges, negative amounts and multipacks', () => {
  const r = extractImageRecipe('Salad\nServes 2-4\nIngredients\n1-2 cucumbers\n2 x 400 g beans\n-1 g salt\nPepper to taste');
  assert.equal(r.servings, ''); assert.ok(r.ingredients.every(x => x.quantity === ''));
  assert.equal(r.ingredients[2].note, '-1 g salt');
  assert.equal(extractImageRecipe('Salad\nServes 2.5\nIngredients\n1 cucumber').servings, '');
});
test('handles missing headings and empty/dish-only input without fabricating ingredients', () => {
  const r = extractImageRecipe('Tomato salad\n200 g tomatoes\n1 cucumber');
  assert.equal(r.name, 'Tomato salad'); assert.equal(r.ingredients.length, 2); assert.equal(r.servings, '');
  assert.equal(extractImageRecipe('').ingredients.length, 0);
  assert.equal(extractImageRecipe('A nice photograph').ingredients.length, 0);
});
test('validates quantities and caps file formats, size and ingredient count', () => {
  assert.equal(imageQuantity('1 1/2'), 1.5);
  for (const s of ['0','-1','1/0','1e3','0xff','1-2','NaN','100001']) assert.equal(imageQuantity(s), null);
  for (const type of ['image/svg+xml','text/html','application/pdf']) assert.throws(() => validateRecipeImage({type,size:100}));
  assert.throws(() => validateRecipeImage({type:'image/png',size:10485761}));
  validateRecipeImage({type:'image/png',size:100});
  const r = extractImageRecipe('Ingredients\n' + Array(90).fill('1 g salt').join('\n'));
  assert.equal(r.ingredients.length, 80); assert.equal(r.omitted.length, 10);
});

test('word ranges, additive amounts and decimal commas stay uncertain',()=>{
 const r=extractImageRecipe('Pancakes\nIngredients\n2 to 3 eggs\n1 + ½ cups flour\n1,5 cups milk');
 assert.equal(r.ingredients.length,3);assert.ok(r.ingredients.every(x=>x.quantity===''&&x.note));
});

test('rejects the reported junk text and low-confidence OCR rather than filling food rows', () => {
  assert.equal(filterRecognizedLines([{text:'nk)',confidence:90},{text:'5 Se a ®',confidence:90},{text:'200 g flour',confidence:20},{text:'SS',confidence:95}]),'');
  assert.equal(extractImageRecipe('nk)\n5 Se a ®').ingredients.length,0);
  assert.equal(filterRecognizedLines([{text:'200 g flour',confidence:95}]),'200 g flour');
});

test('finds explicitly mentioned foods in illustrated steps without inventing amounts or servings', () => {
  const text='Tomato Scrambled Eggs\n步骤1:准备食材\n说明:番茄、鸡蛋、葱、基础调料。\n秘技:鸡蛋液中加少许水或牛奶。\n步骤2:前置处理\n说明:蒜切末，葱切花。\n步骤3:炒制\n说明:热锅冷油，加入番茄和鸡蛋。\n秘技:加一点盐。\n说明:加糖调味。';
  const r=extractImageRecipe(text);
  assert.equal(r.name,'Tomato Scrambled Eggs');assert.equal(r.fromSteps,true);assert.equal(r.servings,'');
  assert.deepEqual(r.ingredients.map(x=>x.name),['番茄','鸡蛋','葱','水','牛奶','蒜','食用油','盐','糖']);
  assert.ok(r.ingredients.every(x=>x.quantity===''&&x.unit===''));
  assert.ok(r.ingredients.filter(x=>['水','牛奶'].includes(x.name)).every(x=>x.note.includes('可选或替代')));
});

test('step extraction works beyond the reported dish and skips explicitly excluded foods', () => {
  const r=extractImageRecipe('豆腐汤\nServes 3\n步骤1:准备\n说明:豆腐、香菇、青菜。\n步骤2:煮汤\n说明:加入清水和盐，不加糖。');
  assert.equal(r.servings,'3');assert.equal(r.fromSteps,true);
  assert.deepEqual(r.ingredients.map(x=>x.name),['豆腐','香菇','青菜','水','盐']);
});

test('a measured ingredient list keeps its quantities even when followed by illustrated steps', () => {
  const r=extractImageRecipe('番茄汤\n2人份\n食材\n番茄 300 克\n盐 2 克\n步骤1:煮汤\n说明:加入水。');
  assert.equal(r.fromSteps,undefined);assert.equal(r.servings,'2');assert.deepEqual(r.ingredients.map(x=>x.quantity),['300','2']);
});
