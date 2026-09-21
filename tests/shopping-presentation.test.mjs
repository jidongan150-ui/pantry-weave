import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mergeRecipes,groupShoppingItems,servingsSummary,shoppingText,retainChecked} from '../lib/recipes.ts';
import {shoppingCard} from '../lib/shopping-card.ts';

const recipe=(id,servings,quantity,unit)=>({id,name:id,servings,source:null,sample:false,ingredients:[{name:id==='A'?'tomatoes':'西红柿',quantity,unit,category:'蔬菜水果',note:''}]});
test('mixed units and missing serving counts stay distinct under one food in both exports',()=>{
 const recipes=[recipe('A',2,200,'g'),recipe('B',null,100,'g'),recipe('C',2,null,''),recipe('D',2,2,'pieces')];
 const items=mergeRecipes(recipes,4),before=JSON.stringify(items);
 assert.equal(items.length,4);
 const groups=groupShoppingItems(items);assert.equal(groups.length,1);assert.equal(groups[0].items.length,4);
 assert.deepEqual(groups[0].items.map(item=>item.quantity),[400,100,null,4]);
 for(const language of ['en','zh']){
  const image=shoppingCard(items,[],4,[],language),text=shoppingText(items,[],4,language);
  assert.equal(image.recipe.ingredients.length,1);assert.equal(image.options.itemDetails[0].length,4);assert.equal(image.options.unscaled,true);
  assert.match(image.options.itemDetails[0][1].note,language==='en'?/Original amount/:/原方用量/);
  assert.match(image.options.itemDetails[0][2].quantity,language==='en'?/not specified/:/未注明/);
  assert.equal(text.split('□').length,2);assert.ok(text.includes('400'));assert.ok(text.includes('100'));
  const partial=shoppingCard(items,[items[0].key],4,[],language);assert.equal(partial.options.itemDetails[0].length,3);assert.ok(!partial.recipe.ingredients[0].quantity.includes('400'));
  assert.equal(shoppingCard(items,items.map(item=>item.key),4,[],language).recipe.ingredients.length,0);
 }
 assert.equal(JSON.stringify(items),before);
 assert.deepEqual(retainChecked(items,items,[items[0].key]),[items[0].key]);
});
test('serving labels cover empty, scaled, original and mixed plans without false scaling claims',()=>{
 for(const language of ['en','zh']){
  assert.match(servingsSummary([],4,language),language==='en'?/Add a recipe/:/添加食谱/);
  assert.match(servingsSummary([{servings:2}],4,language),language==='en'?/Scaled to 4/:/按 4 人份/);
  assert.match(servingsSummary([{servings:null}],4,language),language==='en'?/Original amounts/:/全部保留原方用量/);
  assert.doesNotMatch(servingsSummary([{servings:null}],4,language),/4/);
  assert.match(servingsSummary([{servings:2},{servings:null}],4,language),language==='en'?/1 recipe scaled to 4 people · 1 keeps original amounts/:/1 道按 4 人份换算 · 1 道保留原方用量/);
 }
});
test('display grouping never joins distinct preparations or mutates check keys',()=>{
 const base=recipe('A',2,200,'g');base.ingredients.push({...base.ingredients[0],name:'sun-dried tomatoes'});
 const items=mergeRecipes([base],2),keys=items.map(item=>item.key);
 assert.equal(groupShoppingItems(items).length,2);assert.deepEqual(items.map(item=>item.key),keys);
});
