/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { test, expect } from "vitest";
import rateLimiter from "@convex-dev/rate-limiter/test";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import type { SessionId } from "convex-helpers/server/sessions";
import { sampleRecipes,mergeRecipes } from "../lib/recipes";

const modules = import.meta.glob(["./**/*.ts", "!./**/*.test.ts"]);
const session = () => crypto.randomUUID() as SessionId;
test('legacy partial checks cannot hide newly merged groceries and current checks remain usable',async()=>{
 const {t,sessionId}=await actor();const recipe={...sampleRecipes[0],ingredients:[{name:'洋葱',quantity:1,unit:'个',category:'其他' as const,note:''},{name:'onion',quantity:1,unit:'个',category:'其他' as const,note:''},sampleRecipes[0].ingredients[1]]};
 const onionKey=JSON.stringify(['洋葱','个','numeric']),tomatoKey=JSON.stringify(['番茄','克','numeric']);
 await t.run(async ctx=>{await ctx.db.insert('plans',{sessionId,recipes:[recipe],people:2,checked:[onionKey,tomatoKey],status:'',importing:false,updatedAt:Date.now()});});
 expect((await t.query(api.plans.get,{sessionId})).checked).toEqual([tomatoKey]);
 await t.mutation(api.plans.change,{sessionId,operation:'check',key:onionKey,checked:true});
 expect((await t.query(api.plans.get,{sessionId})).checked).toContain(onionKey);
});
test('editing and adding retain unrelated pantry checks; alternative choices persist and reject two selections',async()=>{
 const {t,sessionId}=await actor();await t.mutation(api.plans.change,{sessionId,operation:'samples'});
 let plan=await t.query(api.plans.get,{sessionId});const items=mergeRecipes(plan.recipes,plan.people);
 for(const item of items)await t.mutation(api.plans.change,{sessionId,operation:'check',key:item.key,checked:true});
 const originalRecipe=plan.recipes[0];const edited={...originalRecipe,name:'Renamed dinner'};
 await t.mutation(api.plans.change,{sessionId,operation:'edit',recipe:edited,originalRecipe});expect((await t.query(api.plans.get,{sessionId})).checked).toHaveLength(items.length);
 const updated={...edited,ingredients:edited.ingredients.map((row,index)=>index===0?{...row,quantity:400}:row)};
 await t.mutation(api.plans.change,{sessionId,operation:'edit',recipe:updated,originalRecipe:edited});plan=await t.query(api.plans.get,{sessionId});expect(plan.checked).toHaveLength(items.length-1);expect(plan.checked).toContain(items.find(x=>x.name==='黄瓜')!.key);
 const recipe={...sampleRecipes[0],id:'choice',name:'Optional drink',ingredients:[{name:'water',quantity:100,unit:'ml',category:'其他' as const,note:'',choiceGroup:'drink',included:false},{name:'milk',quantity:100,unit:'ml',category:'其他' as const,note:'',choiceGroup:'drink',included:true}]};
 await t.mutation(api.plans.change,{sessionId,operation:'add',recipe});const saved=await t.query(api.plans.get,{sessionId});expect(saved.checked).toEqual(plan.checked);expect(saved.recipes[2].ingredients[0].included).toBe(false);expect(mergeRecipes(saved.recipes,2).some(x=>x.name==='水')).toBe(false);
 await expect(t.mutation(api.plans.change,{sessionId,operation:'add',recipe:{...recipe,id:'invalid-choice',ingredients:recipe.ingredients.map(row=>({...row,included:true}))}})).rejects.toThrow();
});

test('recipes with unknown servings save and remain unknown when read back',async()=>{
 const {t,sessionId}=await actor();const recipe={...sampleRecipes[0],servings:null};
 await t.mutation(api.plans.change,{sessionId,operation:'add',recipe});
 const plan=await t.query(api.plans.get,{sessionId});expect(plan.recipes[0].servings).toBeNull();
 await t.mutation(api.plans.change,{sessionId,operation:'people',people:8});
 expect((await t.query(api.plans.get,{sessionId})).recipes[0].ingredients[0].quantity).toBe(recipe.ingredients[0].quantity);
});
function backend() { const t = convexTest(schema, modules); rateLimiter.register(t); return t; }
async function actor(root = backend(), subject: string = crypto.randomUUID()) {
  const t = root.withIdentity({ subject, issuer: "https://pantry.example" });
  const sessionId = await t.mutation(api.accounts.ensure, {});
  return { t, sessionId };
}

test("recipe editing is atomic, preserves source, resets checks and rejects stale/deleted recipes",async()=>{
 const {t,sessionId}=await actor();
 await t.mutation(api.plans.change,{sessionId,operation:'samples'});
 const originalRecipe=(await t.query(api.plans.get,{sessionId})).recipes[0];
 const recipe={...originalRecipe,name:'Updated meal',servings:4,source:'https://example.com/changed'};
 await t.run(async ctx=>{const plan=await ctx.db.query('plans').withIndex('by_sessionId',q=>q.eq('sessionId',sessionId)).unique();await ctx.db.patch(plan!._id,{checked:['old-check']});});
 await t.mutation(api.plans.change,{sessionId,operation:'edit',recipe,originalRecipe});
 const result=await t.query(api.plans.get,{sessionId});
 expect(result.recipes).toHaveLength(2);expect(result.recipes[0].name).toBe('Updated meal');expect(result.recipes[0].source).toBe(originalRecipe.source);expect(result.checked).toEqual([]);
 await expect(t.mutation(api.plans.change,{sessionId,operation:'edit',recipe:{...recipe,name:'stale overwrite'},originalRecipe})).rejects.toThrow('其他窗口');
 await t.mutation(api.plans.change,{sessionId,operation:'remove',recipeId:recipe.id});
 await expect(t.mutation(api.plans.change,{sessionId,operation:'edit',recipe,originalRecipe:result.recipes[0]})).rejects.toThrow('已被移除');
 expect((await t.query(api.plans.get,{sessionId})).recipes).toHaveLength(1);
});

test("editing enforces ownership, validation and original recipe identity",async()=>{
 const root=backend();const {t,sessionId}=await actor(root);await t.mutation(api.plans.change,{sessionId,operation:'samples'});
 const originalRecipe=(await t.query(api.plans.get,{sessionId})).recipes[0];
 for(const caller of [root,root.withIdentity({subject:'stranger',issuer:'https://pantry.example'})])await expect(caller.mutation(api.plans.change,{sessionId,operation:'edit',originalRecipe,recipe:originalRecipe})).rejects.toThrow();
 for(const recipe of [{...originalRecipe,servings:0},{...originalRecipe,ingredients:[]},{...originalRecipe,id:'different'}])await expect(t.mutation(api.plans.change,{sessionId,operation:'edit',originalRecipe,recipe})).rejects.toThrow();
 expect((await t.query(api.plans.get,{sessionId})).recipes[0]).toEqual(originalRecipe);
});

test("write rate limits are enforced by the backend", async () => {
  const { t, sessionId } = await actor();
  for (let i = 0; i < 60; i++) await t.mutation(api.plans.change, { sessionId, operation: "people", people: 2 });
  await expect(t.mutation(api.plans.change, { sessionId, operation: "people", people: 3 })).rejects.toThrow();
});

test("authenticated users isolate plans; invalid input is rejected", async () => {
  const root = backend(); const { t, sessionId: a } = await actor(root); const { t: other, sessionId: b } = await actor(root);
  await t.mutation(api.plans.change, { sessionId: a, operation: "samples" });
  expect((await other.query(api.plans.get, { sessionId: b })).recipes).toHaveLength(0);
  await other.mutation(api.plans.change, { sessionId: b, operation: "remove", recipeId: "sample-pasta" });
  expect((await t.query(api.plans.get, { sessionId: a })).recipes).toHaveLength(2);
  await expect(t.query(api.plans.get, { sessionId: "-".repeat(36) as SessionId })).rejects.toThrow();
  for (const people of [-1, 0, 21, 1.5, Infinity]) await expect(t.mutation(api.plans.change, { sessionId: a, operation: "people", people })).rejects.toThrow();
  await expect(t.mutation(api.plans.change, { sessionId: a, operation: "remove" })).rejects.toThrow();
  await expect(t.mutation(api.plans.change, { sessionId: a, operation: "check", key: "unknown" })).rejects.toThrow();
  await expect(t.mutation(api.plans.change, { sessionId: a, operation: "add", recipe: { ...sampleRecipes[0], id: "unsafe", source: "javascript:alert(1)" } })).rejects.toThrow();
});

test("recipe limit is enforced on server and duplicate submissions are idempotent", async () => {
  const { t, sessionId } = await actor();
  for (let i = 0; i < 5; i++) await t.mutation(api.plans.change, { sessionId, operation: "add", recipe: { ...sampleRecipes[0], id: String(i) } });
  await t.mutation(api.plans.change, { sessionId, operation: "add", recipe: { ...sampleRecipes[0], id: "0" } });
  await expect(t.mutation(api.plans.change, { sessionId, operation: "add", recipe: { ...sampleRecipes[0], id: "overflow" } })).rejects.toThrow();
  expect((await t.query(api.plans.get, { sessionId })).recipes).toHaveLength(5);
});

test("stale imports cannot overwrite the status or recipes of a newer import", async () => {
  const { t, sessionId } = await actor(); const first = crypto.randomUUID(), second = crypto.randomUUID();
  await t.mutation(internal.plans.beginImport, { sessionId, requestId: first });
  await expect(t.mutation(internal.plans.beginImport, { sessionId, requestId: second })).rejects.toThrow();
  await t.run(async ctx => {
    const plan = await ctx.db.query("plans").withIndex("by_sessionId", q => q.eq("sessionId", sessionId)).unique();
    await ctx.db.patch(plan!._id, { importStartedAt: Date.now() - 160000 });
  });
  await t.mutation(internal.plans.beginImport, { sessionId, requestId: second });
  await t.mutation(internal.plans.importProgress, { sessionId, requestId: first, status: "stale", done: true, recipe: sampleRecipes[0] });
  expect((await t.query(api.plans.get, { sessionId })).recipes).toHaveLength(0);
  await t.mutation(internal.plans.importProgress, { sessionId, requestId: second, status: "complete", done: true, recipe: sampleRecipes[1] });
  const result = await t.query(api.plans.get, { sessionId });
  expect(result.status).toBe("complete"); expect(result.recipes[0].id).toBe(sampleRecipes[1].id);
});

test("email retries preserve pending and failed status without authorizing another send", async () => {
  const { t, sessionId } = await actor(); const requestId = crypto.randomUUID();
  const first = await t.mutation(internal.plans.beginEmail, { sessionId, requestId });
  expect(first.status).toBe("new");
  expect(await t.mutation(internal.plans.beginEmail, { sessionId, requestId })).toEqual({ id: null, status: "pending" });
  await t.mutation(internal.plans.finishEmail, { id: first.id!, success: false });
  expect(await t.mutation(internal.plans.beginEmail, { sessionId, requestId })).toEqual({ id: null, status: "failed" });
});


test("anonymous users and another authenticated account cannot use a known plan token", async () => {
  const root = backend();
  const { t: alice, sessionId } = await actor(root, "alice");
  const bob = root.withIdentity({ subject: "bob", issuer: "https://pantry.example" });
  await alice.mutation(api.plans.change, { sessionId, operation: "samples" });
  for (const caller of [root, bob]) {
    await expect(caller.query(api.plans.get, { sessionId })).rejects.toThrow();
    await expect(caller.mutation(api.plans.change, { sessionId, operation: "people", people: 20 })).rejects.toThrow();
    await expect(caller.mutation(internal.plans.beginImport, { sessionId, requestId: crypto.randomUUID() })).rejects.toThrow();
    await expect(caller.query(internal.plans.emailPlan, { sessionId })).rejects.toThrow();
    await expect(caller.mutation(internal.plans.beginEmail, { sessionId, requestId: crypto.randomUUID() })).rejects.toThrow();
  }
  await expect(root.mutation(api.accounts.ensure, {})).rejects.toThrow();
  expect((await alice.query(api.plans.get, { sessionId })).people).toBe(2);
});

test("a returning identity recovers its plan; a different issuer cannot impersonate it", async () => {
  const root = backend();
  const { t, sessionId } = await actor(root, "returning-user");
  await t.mutation(api.plans.change, { sessionId, operation: "people", people: 4 });
  const returning = root.withIdentity({ subject: "returning-user", issuer: "https://pantry.example" });
  expect(await returning.mutation(api.accounts.ensure, {})).toBe(sessionId);
  expect((await returning.query(api.plans.get, { sessionId })).people).toBe(4);
  const otherIssuer = root.withIdentity({ subject: "returning-user", issuer: "https://other.example" });
  await expect(otherIssuer.query(api.plans.get, { sessionId })).rejects.toThrow();
});
