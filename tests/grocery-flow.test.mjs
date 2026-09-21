import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mergeRecipes,retainChecked,recipeSchema,shoppingText} from '../lib/recipes.ts';
import {extractImageRecipe} from '../lib/recipe-image.ts';
import {recipeFromDraft,draftFromRecipe} from '../lib/recipe-edit.ts';
import {selectIngredient} from '../lib/ingredient-choices.ts';
import {shoppingCard} from '../lib/shopping-card.ts';
const row=(name,quantity=1,unit='个',extra={})=>({name,quantity,unit,category:'其他',note:'',...extra});
const recipe=(ingredients,extra={})=>({id:'one',name:'Dinner',servings:2,source:null,sample:false,ingredients,...extra});
test('old OCR alternative notes become editable choices without mutating the saved source',()=>{
 const note='可选或替代，原文：加水或牛奶';const original=recipe([row('鸡蛋'),row('水',null,'',{note}),row('牛奶',null,'',{note})]);const before=JSON.stringify(original);const draft=draftFromRecipe(original);
 assert.equal(draft.ingredients[1].included,false);assert.equal(draft.ingredients[2].included,false);assert.equal(draft.ingredients[1].choiceGroup,draft.ingredients[2].choiceGroup);assert.equal(JSON.stringify(original),before);
 assert.equal(extractImageRecipe('Soup\nIngredients\n1 cup milk (not optional)').ingredients[0].included,undefined);
});
test('exact bilingual food names and count units merge; different foods and preparations stay distinct',()=>{
 const list=mergeRecipes([recipe([row('onions',2,'pieces'),row('洋葱',1),row('生抽',1,'汤匙'),row('light soy sauce',2,'tbsp'),row('soy sauce',1,'tbsp'),row('chopped onion'),row('milk',100,'milliliters'),row('牛奶',.2,'升')])],2);
 assert.equal(list.find(x=>x.name==='洋葱').quantity,3);assert.equal(list.find(x=>x.name==='生抽').quantity,3);assert.equal(list.find(x=>x.name==='酱油').quantity,1);assert.ok(list.some(x=>x.name==='chopped onion'));
 assert.equal(list.find(x=>x.name==='牛奶').quantity,300);assert.equal(list.find(x=>x.name==='洋葱').category,'蔬菜水果');assert.equal(list.find(x=>x.name==='牛奶').category,'肉蛋奶');assert.equal(list.find(x=>x.name==='生抽').category,'调味品');
});
test('checks survive renaming, equivalent units and unrelated edits, but changed requirements reopen',()=>{
 const source=recipe([row('onion',2),row('milk',100,'ml'),row('salt',null,'to taste')]);const before=mergeRecipes([source],2),checks=before.map(x=>x.key);
 const renamed=mergeRecipes([{...source,name:'New name'}],2);assert.deepEqual(retainChecked(before,renamed,checks),checks);
 const after=mergeRecipes([recipe([row('洋葱',2,'pieces'),row('牛奶',.2,'升'),row('salt',null,'to taste')])],2);
 const kept=retainChecked(before,after,checks);assert.equal(kept.length,2);assert.ok(!kept.includes(after.find(x=>x.name==='牛奶').key));
 const added=mergeRecipes([source,recipe([row('carrots')],{id:'two'})],2);assert.deepEqual(retainChecked(before,added,checks),checks);
 const removed=mergeRecipes([recipe([row('onion',2),row('salt',null,'to taste')])],2);assert.equal(retainChecked(before,removed,checks).length,2);
});
test('unknown or as-written requirements are handled conservatively when recipes or servings change',()=>{
 const source=recipe([row('salt',null,'to taste')]);const before=mergeRecipes([source],2);
 const added=mergeRecipes([source,recipe([row('盐',null,'to taste')],{id:'two',name:'Second meal'})],2);assert.deepEqual(retainChecked(before,added,before.map(x=>x.key)),[]);
 const unscaled=recipe([row('onion',2)],{servings:null});const same=mergeRecipes([unscaled],2);assert.deepEqual(retainChecked(same,mergeRecipes([unscaled],8),same.map(x=>x.key)),same.map(x=>x.key));
 assert.deepEqual(retainChecked(same,mergeRecipes([{...unscaled,servings:2}],2),same.map(x=>x.key)),[]);
});
test('step alternatives stay stored, default to skipped, select one and remain out of every shopping export',()=>{
 const draft=extractImageRecipe('番茄炒蛋\n步骤 1：准备食材\n说明：番茄、鸡蛋、葱。\n厨师秘技：鸡蛋中加少许水或牛奶，炒出来更滑嫩。');
 assert.equal(draft.ingredients.find(x=>x.name==='鸡蛋').included,undefined);
 const water=draft.ingredients.findIndex(x=>x.name==='水'),milk=draft.ingredients.findIndex(x=>x.name==='牛奶');
 assert.equal(draft.ingredients[water].included,false);assert.equal(draft.ingredients[milk].included,false);assert.equal(draft.ingredients[water].choiceGroup,draft.ingredients[milk].choiceGroup);
 const original=JSON.stringify(draft);let ingredients=selectIngredient(draft.ingredients,water,true);ingredients=selectIngredient(ingredients,milk,true);assert.equal(ingredients[water].included,false);
 const saved=recipeFromDraft({...draft,ingredients});const reopened=draftFromRecipe(saved);assert.equal(reopened.ingredients[milk].included,true);assert.equal(reopened.ingredients[water].included,false);
 const list=mergeRecipes([saved],4);assert.ok(list.some(x=>x.name==='牛奶'));assert.ok(!list.some(x=>x.name==='水'));assert.ok(!shoppingText(list,[],4,'en').includes('water'));
 assert.ok(!shoppingCard(list,[],4,[saved.name],'en').recipe.ingredients.some(x=>x.name==='water'));assert.equal(JSON.stringify(draft),original);
 const invalid={...saved,ingredients:saved.ingredients.map(x=>x.choiceGroup?{...x,included:true}:x)};assert.equal(recipeSchema.safeParse(invalid).success,false);
});
