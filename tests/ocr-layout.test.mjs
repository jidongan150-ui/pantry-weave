import {test} from 'node:test';
import assert from 'node:assert/strict';
import {recipeLayoutText} from '../lib/ocr-layout.ts';
import {extractImageRecipe} from '../lib/recipe-image.ts';
const line=(text,x,y,width=90,confidence=95)=>({text,confidence,bbox:{x0:x,y0:y,x1:x+width,y1:y+20}});
test('detached digits never replace the amount on the following ingredient',()=>{
 const result=extractImageRecipe(recipeLayoutText([line('Ingredients',20,0),line('12',20,40),line('30g dried Red Split Lentils',20,70,240)]));
 assert.equal(result.ingredients.length,1);assert.equal(result.ingredients[0].quantity,'30');assert.equal(result.ingredients[0].unit,'g');
});
test('ingredient columns are read without an adjacent method heading ending extraction',()=>{
 const input=[line('Soup',20,0),line('Ingredients',20,40),line('Method',400,40),line('1 tbsp oil',20,80,190),line('Chop vegetables',400,80,230),line('2 cloves garlic',20,120,180),line('Boil 20 minutes',400,120,250)];
 const result=extractImageRecipe(recipeLayoutText(input));
 assert.equal(result.ingredients.length,2);assert.deepEqual(result.ingredients.map(row=>row.quantity),['1','2']);assert.ok(!result.ingredients.some(row=>/Chop|Boil/.test(row.name)));
});
test('amount and name on the same baseline are reunited; low-confidence digits are not guessed',()=>{
 const input=[line('Ingredients',20,0),line('1/2',20,40,35),line('cup flour',80,40,140),line('2',20,80,25,20),line('eggs',80,80),line('Directions',20,140),line('400 g sugar',20,180,160)];
 const before=JSON.stringify(input);const result=extractImageRecipe(recipeLayoutText(input));
 assert.equal(result.ingredients[0].quantity,'0.5');assert.equal(result.ingredients[0].unit,'cup');assert.equal(result.ingredients[1].quantity,'');assert.equal(result.ingredients.length,2);assert.equal(JSON.stringify(input),before);
});
