import test from 'node:test';
import assert from 'node:assert/strict';
import {createRecipeLink,parseRecipeLink,recipeLinkPrompt} from '../lib/recipe-link.ts';
import {parseLocalPlan} from '../lib/local-plan.ts';
import {recipeFromDraft} from '../lib/recipe-edit.ts';

const recipe={name:'番茄 & eggs / "mum’s" 100%',servings:null,ingredients:[{name:'鸡蛋',quantity:2,unit:'个'},{name:'salt',quantity:'1/3',unit:'tsp'},{name:'milk',quantity:null,unit:'',choiceGroup:'liquid'},{name:'water',quantity:null,unit:'',choiceGroup:'liquid'}]};
test('recipe links preserve multilingual names, fractions, nulls and alternatives',()=>{
 const link=createRecipeLink(recipe,'https://example.com/');
 const url=new URL(link);assert.equal(url.search,'');
 const draft=parseRecipeLink(url.hash);assert.equal(draft.name,recipe.name);assert.equal(draft.ingredients[1].quantity,'1/3');assert.equal(draft.ingredients[2].included,false);
 assert.equal(draft.servings,'');assert.equal(parseRecipeLink('#other'),null);
});
test('malformed, oversized or unknown fields never become partial imports',()=>{
 for(const hash of ['#recipe=%E0%A4%A','#recipe='+encodeURIComponent('{"name":"Soup"}'),'#recipe='+encodeURIComponent(JSON.stringify({...recipe,source:'javascript:alert(1)'})),'#recipe='+encodeURIComponent(JSON.stringify({...recipe,ingredients:[]})),'#recipe='+'a'.repeat(24001)])assert.throws(()=>parseRecipeLink(hash));
 assert.throws(()=>createRecipeLink(recipe,'javascript:alert(1)'));
});
test('HTML-like recipe names remain inert data, not markup or instructions',()=>{
 const draft=parseRecipeLink(new URL(createRecipeLink({...recipe,name:'<img src=x onerror=alert(1)>'},'https://example.com')).hash);
 assert.equal(draft.name,'<img src=x onerror=alert(1)>');
});
test('the handoff prompt uses the current site and deterministic encoding, not an API',()=>{
 const prompt=recipeLinkPrompt('zh','https://example.com');
 assert.match(prompt,/https:\/\/example.com\/#recipe=/);assert.match(prompt,/encodeURIComponent/);assert.match(prompt,/Simplified Chinese/);assert.match(prompt,/not call any website/);
});
test('device storage validates complete bounded plans and rejects corruption',()=>{
 const good={recipes:[recipeFromDraft(parseRecipeLink(new URL(createRecipeLink(recipe,'https://example.com')).hash))],people:2,checked:[],status:''};
 assert.deepEqual(parseLocalPlan(JSON.stringify(good)),good);
 for(const bad of ['broken',JSON.stringify({...good,people:0}),JSON.stringify({...good,recipes:Array(6).fill(good.recipes[0])}),JSON.stringify({...good,status:'<script>'}),' '.repeat(200001)])assert.throws(()=>parseLocalPlan(bad));
});
