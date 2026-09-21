import { test } from 'node:test';
import assert from 'node:assert/strict';
import { publicRecipeUrl, isSessionToken } from '../lib/safety.ts';
import { translate } from '../lib/i18n.ts';
import { mergeRecipes, sampleRecipes, formatQuantity, shoppingText, parseManualIngredients } from '../lib/recipes.ts';

test('prototype-property ingredient names and units cannot crash merging', () => {
  for (const value of ['constructor', '__proto__', 'toString']) {
    const r = {...sampleRecipes[0], ingredients:[{name:value,quantity:1,unit:value,category:'其他',note:''}]};
    const item = mergeRecipes([r],2)[0];
    assert.equal(typeof item.name,'string'); assert.equal(item.unit,value); assert.equal(item.quantity,1);
  }
});
test('tiny and unknown amounts are never silently displayed as zero or just a unit', () => {
  assert.equal(formatQuantity({quantity:0.001,unit:'克'},'en'),'0.001 g');
  assert.equal(formatQuantity({quantity:null,unit:'克'},'en'),'Amount not specified (g)');
  assert.equal(formatQuantity({quantity:null,unit:''},'zh'),'用量未注明');
  assert.equal(formatQuantity({quantity:null,unit:'适量'},'en'),'to taste');
});
test('English exports are localized and exclude checked ingredients', () => {
  const list=mergeRecipes(sampleRecipes,4), tomato=list.find(x=>x.name==='番茄');
  const output=shoppingText(list,[tomato.key],4,'en');
  assert.ok(output.includes('60 ml')); assert.ok(output.includes('Olive oil'));
  assert.ok(!output.includes('Tomatoes')); assert.ok(!/[\u3400-\u9fff]/.test(output));
  assert.equal(translate('清单自动保存','en'),'Autosaved');
  assert.equal(translate('constructor','en'),'constructor');
  assert.equal(translate('项待购买','en',{count:1}),'item to buy');
  assert.equal(translate('已选 {count} 道菜','en',{count:1}),'1 recipe selected');
});
test('manual entry accepts English unknown amounts but rejects ambiguous numbers', () => {
  assert.equal(parseManualIngredients('Salt | to taste','en')[0].quantity,null);
  for(const n of ['0x10','0b11','1e3','1/2','-1','']) assert.throws(()=>parseManualIngredients(`Salt | ${n} | g`,'en'));
});
test('recipe URLs reject private/local targets, credentials, encoded IPs and unsafe protocols', () => {
  for (const url of ['http://localhost/a','http://a.localhost/a','http://a.localhost./a','http://a.internal/a','http://a.local/a','http://127.0.0.1/a','http://2130706433/a','http://0x7f000001/a','http://[::1]/a','http://user:pass@example.com/a','file:///a','javascript:alert(1)','https://example.com:8443/a']) assert.throws(()=>publicRecipeUrl(url));
  assert.equal(publicRecipeUrl('https://example.com/recipe#ingredients'),'https://example.com/recipe');
});
test('session capability identifiers must be actual UUIDv4 tokens', () => {
  assert.ok(isSessionToken(crypto.randomUUID()));
  assert.ok(!isSessionToken('-'.repeat(36))); assert.ok(!isSessionToken('0'.repeat(36)));
});
