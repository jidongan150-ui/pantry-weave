import {test} from 'node:test';
import assert from 'node:assert/strict';
import {extractImageRecipe} from '../lib/recipe-image.ts';

test('OCR serving ranges in either language never silently use the lower bound',()=>{
 for(const servings of ['Serves 2 to 3 persons','Serves 2–3','2 至 3 人份']){
  assert.equal(extractImageRecipe(`Soup\n${servings}\nIngredients\n2 cups peas`).servings,'');
 }
 assert.equal(extractImageRecipe('Soup\nServes 3 persons\nIngredients\n2 cups peas').servings,'3');
});
test('suspicious cup and spoon amounts retain source but do not become confident totals',()=>{
 const draft=extractImageRecipe('Soup\nIngredients\n112 cup green beans\n114 tsp salt\n3 V2 Cups tomatoes\n125 ml broth\n1 1/2 cups peas');
 assert.equal(draft.ingredients.length,5);
 for(const row of draft.ingredients.slice(0,3)){assert.equal(row.quantity,'');assert.ok(row.note);}
 assert.equal(draft.ingredients[3].quantity,'125');assert.equal(draft.ingredients[4].quantity,'1.5');
});
