import test from 'node:test';
import assert from 'node:assert/strict';
import {parseRecipePaste,recipeRecognitionPrompt} from '../lib/recipe-paste.ts';
import {recipeFromDraft} from '../lib/recipe-edit.ts';
import {mergeRecipes} from '../lib/recipes.ts';

const row=(name,quantity=null,unit='',extra={})=>({name,quantity,unit,...extra});
const data=ingredients=>({name:'Soup',servings:null,ingredients});
test('complete pasted data retains fractions and unknown amounts through grocery conversion',()=>{
 const input=data([row('salt','1/3','tsp'),row('water','1 1/2','cups'),row('carrots',null,'', {note:'1–2, unclear'})]);
 const draft=parseRecipePaste('```json\n'+JSON.stringify(input)+'\n```');
 assert.equal(draft.servings,'');assert.equal(draft.ingredients[0].quantity,'1/3');
 const recipe=recipeFromDraft(draft),list=mergeRecipes([recipe],4);
 assert.equal(recipe.ingredients[0].quantity,1/3);assert.equal(recipe.ingredients[1].quantity,1.5);
 assert.equal(list.find(r=>r.unit==='茶匙').quantity,1/3);assert.equal(recipe.ingredients[2].quantity,null);
});
test('optional foods and alternatives start unselected while required rows remain included',()=>{
 const draft=parseRecipePaste(JSON.stringify(data([row('carrots',2),row('cumin',1,'tsp',{optional:true,choiceGroup:'spice'}),row('curry powder',1,'tsp',{choiceGroup:'spice'}),row('parsley',null,'',{optional:true})])));
 assert.deepEqual(draft.ingredients.map(r=>r.included),[undefined,false,false,false]);
 assert.equal(mergeRecipes([recipeFromDraft(draft)],2).length,1);
});
test('invalid imports fail as a whole instead of dropping suspect ingredients',()=>{
 for(const quantity of [0,-1,100001,'1/0','2–3','NaN',true,'100001'])assert.throws(()=>parseRecipePaste(JSON.stringify(data([row('salt',1),row('onion',quantity)]))));
 for(const input of [data([]),data([row('')]),{...data([row('salt')]),servings:101},{...data([row('salt')]),servings:'2–3'},data(Array.from({length:81},()=>row('salt')))])assert.throws(()=>parseRecipePaste(JSON.stringify(input)));
});
test('pasted content cannot inject metadata, execute code or hide extra objects',()=>{
 const good=JSON.stringify(data([row('salt')]));
 for(const input of ['alert(1)',good+good,'```json\n'+good+'\n```\n```json\n'+good+'\n```',good.replace('"Soup"','"Soup","__proto__":{"polluted":true}'),JSON.stringify({...data([row('salt')]),source:'https://example.com',id:'existing-id'})])assert.throws(()=>parseRecipePaste(input));
 assert.equal({}.polluted,undefined);assert.throws(()=>parseRecipePaste(' '.repeat(50001)));
});
test('import instructions request source-grounded one-recipe output in the selected language',()=>{
 assert.match(recipeRecognitionPrompt('en'),/Use English/);assert.match(recipeRecognitionPrompt('zh'),/Simplified Chinese/);
 assert.match(recipeRecognitionPrompt('en'),/Do not infer ingredients/);assert.match(recipeRecognitionPrompt('en'),/otherwise null/);
});
