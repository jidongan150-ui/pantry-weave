import {test} from 'node:test';
import assert from 'node:assert/strict';
import {recipeLayoutText,recoverIngredientLines} from '../lib/ocr-layout.ts';
import {extractImageRecipe} from '../lib/recipe-image.ts';
import {reconcileOcrDraft,extractionScore} from '../lib/ocr-review.ts';
const line=(text,x,y,width=150,confidence=95)=>({text,confidence,bbox:{x0:x,y0:y,x1:x+width,y1:y+20}});
const draft=text=>extractImageRecipe('Soup\nIngredients\n'+text);

test('a bilingual page uses one ingredient column and stops before its cooking method',()=>{
 const lines=[line('Soup',20,0),line('材料',20,50),line('西兰花 200 克',20,90),line('Ingredients',400,80),line('Broccoli — 200 grams',400,120,220),line('调味料',20,140),line('Seasoning',400,150),line('Salt — small amount',400,190,210),line('烹調方法',20,220),line('Preparation Method',400,230,210),line('Cook for 10 minutes',400,270)];
 const result=extractImageRecipe(recipeLayoutText(lines));assert.deepEqual(result.ingredients.map(row=>row.name),['Broccoli','Salt']);assert.equal(result.ingredients[0].quantity,'200');
});
test('rows spanning both columns are clipped to the selected ingredient column',()=>{
 const chinese=line('材料',10,20),english=line('Ingredients',300,40);
 const span={...line('鸡蛋 2 个 Eggs — 2 pieces',20,80,550),words:[line('鸡蛋',20,80),line('2',180,80,20),line('Eggs',320,80,45),line('—',380,80,10),line('2',410,80,10),line('pieces',435,80,65)]};
 const result=extractImageRecipe(recipeLayoutText([chinese,english,span,line('Preparation Method',300,130)]));assert.equal(result.ingredients.length,1);assert.equal(result.ingredients[0].name,'Eggs');assert.equal(result.ingredients[0].quantity,'2');
});
test('a confident food survives an unclear quantity, but preparation words are not foods',()=>{
 const unclear={...line('1 Tsp. Salt',0,10,160,40),words:[line('1',0,10,10,20),line('Tsp.',20,10,35,20),line('Salt',70,10,40,96)]};
 const noise={...line('e 0nion (Chopped)',0,50,160,40),words:[line('e',0,50,10,10),line('0nion',20,50,40,25),line('(Chopped)',80,50,70,96)]};
 assert.equal(recoverIngredientLines([unclear])[0].text,'Salt');assert.equal(recoverIngredientLines([noise])[0].confidence,40);
});
test('ingredient separators and subsections preserve facts without importing cooking text',()=>{
 const result=draft('Broccoli — 230 grams\nSeasoning\nSalt — small amount\nSauce\nCorn starch — 3 tablespoons\nTuna - 2 cans\n(Remark: 1 cup = 240 ml)\nPreparation Method\nMix everything');
 assert.deepEqual(result.ingredients.map(row=>[row.name,row.quantity]),[['Broccoli','230'],['Salt',''],['Corn starch','3'],['Tuna','2']]);
 const spices=draft('2 Bay Leaves, 1/2 Tsp. Thyme, Basil, Pepper\n1 onion, finely chopped');assert.equal(spices.ingredients.length,5);assert.equal(spices.ingredients[1].quantity,'0.5');assert.equal(spices.ingredients[4].name,'onion, finely chopped');
});
test('garbled and joined fractions never become a different confident quantity',()=>{
 const result=draft('Sweet corn — /2 cup\nYogurt — ¥5 cup\n11/2 cup green beans\n1 1/2 cups flour');
 assert.deepEqual(result.ingredients.map(row=>row.quantity),['','','','1.5']);assert.deepEqual(result.ingredients.slice(0,2).map(row=>row.name),['Sweet corn','Yogurt']);
});
test('amount disagreement across near OCR spellings withholds certainty without changing names',()=>{
 const primary=draft('Sweet con — 2 cup\nStock — 2 cups'),other=draft('Sweet corn — /2 cup\nStock — 2 cup');const before=JSON.stringify(primary);
 const result=reconcileOcrDraft(primary,[other]);assert.equal(result.ingredients[0].name,'Sweet con');assert.equal(result.ingredients[0].quantity,'');assert.match(result.ingredients[0].note,/用量待核对/);assert.equal(result.ingredients[1].quantity,'2');assert.equal(JSON.stringify(primary),before);
});
test('new ingredients require two rereads while one unconfirmed quantity is flagged',()=>{
 const original=draft('100 g flour'),two=draft('100 g flour\n2 eggs'),three=draft('100 g flour\n2 eggs\n5 g sugar');
 const result=reconcileOcrDraft(original,[two,three]);assert.deepEqual(result.ingredients.map(row=>row.name),['flour','eggs']);assert.equal(result.ingredients[1].quantity,'2');
 assert.equal(reconcileOcrDraft(draft('5 g sugar'),[draft('2 eggs')]).ingredients[0].quantity,'');
 assert.ok(extractionScore(draft('100 g flour\n2 eggs'))>extractionScore(draft('flour\neggs\nPreparation Method extra\n10 minutes')));
});

test('two agreeing amounts survive a missing read, but explicit fractional uncertainty does not',()=>{
 const original=draft('30 g lentils');
 assert.equal(reconcileOcrDraft(original,[draft('30 g lentils'),draft('lentils')]).ingredients[0].quantity,'30');
 assert.equal(reconcileOcrDraft(draft('Water — 2 cup'),[draft('Water — 2 cup'),draft('Water — /2 cup')]).ingredients[0].quantity,'');
 const oil=reconcileOcrDraft(draft('2 tbsp Olive Qll'),[draft('2 tbsp Olive Oil')]);assert.equal(oil.ingredients[0].name,'Olive Oil');
 const qualified=reconcileOcrDraft(draft('100 g chicken (raw)'),[draft('100 g chicken')]);assert.equal(qualified.ingredients[0].name,'chicken (raw)');
});

test('adjacent complete ingredients stay separate even on the same baseline',()=>{
 const result=extractImageRecipe(recipeLayoutText([line('Ingredients',0,0),line('Cucumbers — 450 grams',0,40,220),line('Shrimps — 300 grams',250,40,210),line('Salt — small amount',0,80,220),line('Corn starch — 1 teaspoon',250,80,240)]));
 assert.deepEqual(result.ingredients.map(row=>row.name),['Cucumbers','Shrimps','Salt','Corn starch']);assert.equal(result.ingredients[0].quantity,'450');assert.equal(result.ingredients[1].quantity,'300');
});
test('very long noise lines are bounded before ingredient regex parsing',()=>{
 const result=draft('a'.repeat(19000)+'\n2 eggs');assert.equal(result.ingredients.length,1);assert.equal(result.ingredients[0].quantity,'2');assert.ok(result.omitted[0].length<=200);
});
