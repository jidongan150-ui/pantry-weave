import {test} from 'node:test';
import assert from 'node:assert/strict';
import {shoppingCard} from '../lib/shopping-card.ts';
import {mergeRecipes,sampleRecipes} from '../lib/recipes.ts';
test('shopping cards omit OCR step excerpts but retain alternatives and source data',()=>{
 const recipe={...sampleRecipes[0],servings:null,ingredients:[{name:'水',quantity:null,unit:'',category:'其他',note:'可选或替代，原文：鸡蛋中加少许水或牛奶'},{name:'盐',quantity:null,unit:'',category:'调味品',note:'原文：加入盐'}]};
 const before=JSON.stringify(recipe);const result=shoppingCard(mergeRecipes([recipe],4),[],4,[],'en');
 assert.equal(result.recipe.ingredients.find(row=>row.name==='water').note,'Optional / alternative');assert.equal(result.recipe.ingredients.find(row=>row.name==='Salt').note,'');assert.equal(result.options.unscaled,true);assert.equal(result.recipe.untranslated,0);assert.equal(JSON.stringify(recipe),before);
});

test('final image uses merged amounts exactly once and excludes checked groceries',()=>{
 const list=mergeRecipes(sampleRecipes,4);const before=JSON.stringify(list);
 const tomato=list.find(item=>item.name==='番茄');
 const result=shoppingCard(list,[],4,sampleRecipes.map(recipe=>recipe.name),'en');
 assert.equal(result.recipe.ingredients.find(row=>row.name.toLowerCase()==='tomatoes').quantity,'1,000 g');
 assert.equal(result.recipe.ingredients.find(row=>row.name.toLowerCase()==='olive oil').quantity,'60 ml');
 assert.equal(result.recipe.servings,'4');assert.equal(result.recipe.untranslated,0);
 const filtered=shoppingCard(list,[tomato.key],4,[],'en');
 assert.equal(filtered.recipe.ingredients.length,5);
 assert.ok(!filtered.recipe.ingredients.some(row=>row.name.toLowerCase()==='tomatoes'));
 assert.equal(JSON.stringify(list),before);
 assert.equal(shoppingCard(list,list.map(item=>item.key),4,[],'en').recipe.ingredients.length,0);
});

test('unknown amounts, alternatives and untranslated notes survive export in both languages',()=>{
 const list=mergeRecipes([{...sampleRecipes[0],ingredients:[
  {name:'鸡蛋',quantity:2,unit:'个',category:'肉蛋奶',note:''},
  {name:'鸡蛋',quantity:null,unit:'个',category:'肉蛋奶',note:'也可用鸭蛋；请核对原图'},
  {name:'盐',quantity:null,unit:'适量',category:'调味品',note:''},
 ]}],4);
 for(const language of ['en','zh']){
  const result=shoppingCard(list,[],4,['番茄炒蛋'],language);
  assert.equal(result.recipe.ingredients.length,2);
  assert.equal(result.options.itemDetails[0][0].quantity,language==='en'?'4 pieces':'4 个');
  assert.equal(result.options.itemDetails[0][1].quantity,language==='en'?'Amount not specified (pieces)':'用量未注明 (个)');
  assert.ok(result.options.itemDetails[0][1].note.includes('也可用鸭蛋；请核对原图'));
  assert.equal(result.recipe.ingredients[1].quantity,language==='en'?'to taste':'适量');
  assert.equal(result.recipe.untranslated,language==='en'?1:0);
  assert.equal(result.options.recipeNames[0],language==='en'?'Tomato scrambled eggs':'番茄炒蛋');
 }
});

test('English names and units convert to Chinese without altering original values',()=>{
 const item={key:'x',name:'eggs',quantity:3,unit:'pieces',category:'肉蛋奶',sources:['Tomato scrambled eggs'],notes:['optional']};
 const result=shoppingCard([item],[],2,item.sources,'zh');
 assert.deepEqual(result.recipe.ingredients,[{name:'鸡蛋',quantity:'3 个',unit:'',note:'可选'}]);
 assert.equal(item.name,'eggs');assert.equal(item.unit,'pieces');
});
