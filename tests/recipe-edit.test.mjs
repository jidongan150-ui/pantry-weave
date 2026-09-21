import {test} from 'node:test';
import assert from 'node:assert/strict';
import {draftFromRecipe,recipeFromDraft} from '../lib/recipe-edit.ts';
import {sampleRecipes,shoppingText,mergeRecipes,formatQuantity} from '../lib/recipes.ts';
import {recipeText,localizeRecipe} from '../lib/recipe-language.ts';
import {shoppingCard} from '../lib/shopping-card.ts';

test('editing preserves original source/category/unknown amounts without mutating original',()=>{
 const original=structuredClone(sampleRecipes[0]);original.source='https://example.com/recipe';
 const draft=draftFromRecipe(original);draft.name='My pasta';draft.servings='4';draft.ingredients[0].quantity='1/2';
 const result=recipeFromDraft(draft,original);
 assert.equal(result.id,original.id);assert.equal(result.source,original.source);assert.equal(result.ingredients[0].quantity,.5);assert.equal(result.ingredients[0].category,'主食干货');assert.equal(result.ingredients.at(-1).quantity,null);
 assert.equal(original.name,sampleRecipes[0].name);assert.equal(original.ingredients[0].quantity,200);
 for(const quantity of ['-2','0','1+2','2 to 3','NaN'])assert.throws(()=>recipeFromDraft({...draft,ingredients:[{...draft.ingredients[0],quantity}]},original));
 assert.equal(recipeFromDraft({...draft,servings:''},original).servings,null);
});

test('scan, saved recipe, quantity, text and PNG share both-language display conventions',()=>{
 const recipe={...sampleRecipes[0],name:'Tomato scrambled eggs',ingredients:[{name:'eggs',quantity:3,unit:'pieces',category:'肉蛋奶',note:'optional'}]};
 const list=mergeRecipes([recipe],2);
 for(const language of ['en','zh']){
  const scan=localizeRecipe({...draftFromRecipe(recipe),omitted:[]},language);
  const png=shoppingCard(list,[],2,[recipe.name],language);
  assert.equal(scan.name,recipeText(recipe.name,language).text);assert.equal(png.options.recipeNames[0],scan.name);
  assert.equal(png.recipe.ingredients[0].name,recipeText(list[0].name,language).text);
  assert.equal(png.recipe.ingredients[0].quantity,formatQuantity(list[0],language));
  assert.ok(shoppingText(list,[],2,language).includes(png.recipe.ingredients[0].name));
  assert.ok(shoppingText(list,[],2,language).includes(png.recipe.ingredients[0].note));
 }
});
