import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mergeRecipes,sampleRecipes,parseManualIngredients,shoppingText} from '../lib/recipes.ts';

test('unknown servings keep original amounts and stay separate from scaled amounts',()=>{
 const source={...sampleRecipes[0],servings:null};
 const list=mergeRecipes([source,sampleRecipes[1]],4);
 const tomatoes=list.filter(item=>item.name==='番茄');
 assert.deepEqual(tomatoes.map(item=>item.quantity),[300,400]);assert.equal(tomatoes[0].asWritten,true);
 assert.ok(shoppingText(list,[],4,'en').includes('Original amount; not scaled'));
 assert.equal(source.servings,null);
});
test('merges aliases and compatible metric units, scaling each recipe by its own servings',()=>{
 const list=mergeRecipes(sampleRecipes,4);
 assert.equal(list.find(x=>x.name==='番茄').quantity,1000);
 assert.equal(list.find(x=>x.name==='橄榄油').quantity,60);
 assert.equal(list.find(x=>x.name==='蒜').quantity,6);
 assert.equal(list.find(x=>x.name==='盐').quantity,null);
 assert.equal(list.length,6);
});
test('does not convert counts or volume into weight',()=>{
 const recipe={...sampleRecipes[0],ingredients:[{name:'面粉',quantity:1,unit:'杯',category:'主食干货',note:''},{name:'面粉',quantity:100,unit:'克',category:'主食干货',note:''}]};
 assert.equal(mergeRecipes([recipe],2).length,2);
});
test('handles different original servings and excludes checked items from export',()=>{
 const recipe={...sampleRecipes[1],servings:4};const list=mergeRecipes([recipe],2);
 assert.equal(list.find(x=>x.name==='番茄').quantity,100);
 const tomato=list.find(x=>x.name==='番茄');assert.ok(!shoppingText(list,[tomato.key],2).includes('番茄'));
});
test('manual input rejects ambiguous numeric syntax and negative quantities',()=>{
 assert.equal(parseManualIngredients('番茄 | 300 | 克\n盐 | 适量').length,2);
 for(const text of ['盐 | -1 | 克','面粉 | 1/2 | 杯','糖 | NaN | 克','水 | Infinity | 升'])assert.throws(()=>parseManualIngredients(text));
 for(const people of [0,21,NaN,1.5])assert.throws(()=>mergeRecipes(sampleRecipes,people));
});
