import { mutation,query,internalMutation,internalQuery } from "./_generated/server";
import { components } from "./_generated/api";
import { v,ConvexError } from "convex/values";
import { SessionIdArg } from "convex-helpers/server/sessions";
import { RateLimiter,MINUTE,HOUR,DAY } from "@convex-dev/rate-limiter";
import { planView,recipe } from "./validators";
import { recipeSchema,mergeRecipes,sampleRecipes,retainChecked,legacyChecked,type Recipe } from "../lib/recipes";
import { isSessionToken } from "../lib/safety";
import { requireOwner } from "./model/auth";
const limits=new RateLimiter(components.rateLimiter,{writes:{kind:"token bucket",rate:60,period:MINUTE,capacity:60},allWrites:{kind:"fixed window",rate:2000,period:DAY},newPlans:{kind:"fixed window",rate:200,period:DAY},imports:{kind:"fixed window",rate:6,period:HOUR},allImports:{kind:"fixed window",rate:60,period:DAY},emails:{kind:"fixed window",rate:3,period:HOUR},allEmails:{kind:"fixed window",rate:20,period:DAY}});
const assertSession=(id:string)=>{if(!isSessionToken(id))throw new ConvexError("会话无效，请刷新页面");};
const savedChecks=(p:{recipes:Recipe[];people:number;checked:string[];checkKeyVersion?:1})=>p.checkKeyVersion===1?p.checked:legacyChecked(p.recipes,p.people,p.checked);
export const get=query({args:{...SessionIdArg},returns:planView,handler:async(ctx,{sessionId})=>{assertSession(sessionId);await requireOwner(ctx,sessionId);const p=await ctx.db.query("plans").withIndex("by_sessionId",q=>q.eq("sessionId",sessionId)).unique();return p?{recipes:p.recipes,people:p.people,checked:savedChecks(p),status:p.status}:{recipes:[],people:2,checked:[],status:""};}});
export const change=mutation({args:{...SessionIdArg,operation:v.union(v.literal("add"),v.literal("edit"),v.literal("remove"),v.literal("people"),v.literal("check"),v.literal("samples")),recipe:v.optional(recipe),originalRecipe:v.optional(recipe),recipeId:v.optional(v.string()),people:v.optional(v.number()),key:v.optional(v.string()),checked:v.optional(v.boolean())},returns:v.null(),handler:async(ctx,args)=>{
 assertSession(args.sessionId);await requireOwner(ctx,args.sessionId);await limits.limit(ctx,"writes",{key:args.sessionId,throws:true});await limits.limit(ctx,"allWrites",{throws:true});
 let p=await ctx.db.query("plans").withIndex("by_sessionId",q=>q.eq("sessionId",args.sessionId)).unique();
 if(!p){await limits.limit(ctx,"newPlans",{throws:true});const id=await ctx.db.insert("plans",{sessionId:args.sessionId,recipes:[],people:2,checked:[],status:"",importing:false,updatedAt:Date.now()});p=await ctx.db.get(id);}if(!p)throw new ConvexError("清单创建失败");
 let recipes=p.recipes,people=p.people,checked=savedChecks(p);
 if(args.operation==="add"){const parsed=recipeSchema.safeParse(args.recipe);if(!parsed.success)throw new ConvexError("请检查菜名、份数和食材格式");const r=parsed.data;if(!recipes.some(x=>x.id===r.id)){if(recipes.length>=5)throw new ConvexError("每份清单最多 5 道菜");recipes=[...recipes,r];checked=[];}}
 if(args.operation==="edit"){
  const parsed=recipeSchema.safeParse(args.recipe),original=recipeSchema.safeParse(args.originalRecipe);
  if(!parsed.success||!original.success||parsed.data.id!==original.data.id)throw new ConvexError("请检查菜名、份数和食材格式");
  const current=recipes.find(r=>r.id===original.data.id);
  if(!current)throw new ConvexError("这道菜已被移除，请关闭编辑窗口后重试");
  if(JSON.stringify(recipeSchema.parse(current))!==JSON.stringify(original.data))throw new ConvexError("这道菜已在其他窗口修改，请关闭后重新编辑");
  const updated={...parsed.data,source:current.source,sample:current.sample};
  recipes=recipes.map(r=>r.id===updated.id?updated:r);checked=[];
 }
 if(args.operation==="remove"){if(!args.recipeId||args.recipeId.length>100)throw new ConvexError("请检查菜名、份数和食材格式");recipes=recipes.filter(x=>x.id!==args.recipeId);checked=[];}
 if(args.operation==="samples"){const missing=sampleRecipes.filter(r=>!recipes.some(x=>x.id===r.id));if(recipes.length+missing.length>5)throw new ConvexError("添加示例后会超过 5 道菜，请先移除一些食谱");recipes=[...recipes,...missing];checked=[];}
 if(args.operation==="people"){if(!Number.isInteger(args.people)||args.people!<1||args.people!>20)throw new ConvexError("人数应为 1–20");people=args.people!;checked=[];}
 if(args.operation==="check"){if(typeof args.checked!=="boolean"||!args.key||!mergeRecipes(recipes,people).some(x=>x.key===args.key))throw new ConvexError("食材不存在");checked=args.checked?[...new Set([...checked,args.key])]:checked.filter(x=>x!==args.key);}
 if(args.operation!=='check')checked=retainChecked(mergeRecipes(p.recipes,p.people),mergeRecipes(recipes,people),savedChecks(p));
 await ctx.db.patch(p._id,{recipes,people,checked,checkKeyVersion:1,updatedAt:Date.now()});return null;
}});
export const beginImport=internalMutation({args:{...SessionIdArg,requestId:v.string()},returns:v.null(),handler:async(ctx,{sessionId,requestId})=>{
 assertSession(sessionId);await requireOwner(ctx,sessionId);await limits.limit(ctx,"imports",{key:sessionId,throws:true});await limits.limit(ctx,"allImports",{throws:true});
 let p=await ctx.db.query("plans").withIndex("by_sessionId",q=>q.eq("sessionId",sessionId)).unique();
 if(p?.importing&&Date.now()-(p.importStartedAt??p.updatedAt)<150000)throw new ConvexError("上一道食谱仍在处理中");if(p&&p.recipes.length>=5)throw new ConvexError("最多 5 道菜");
 if(!p){await limits.limit(ctx,"newPlans",{throws:true});const id=await ctx.db.insert("plans",{sessionId,recipes:[],people:2,checked:[],status:"",importing:false,updatedAt:Date.now()});p=await ctx.db.get(id);}if(p)await ctx.db.patch(p._id,{importing:true,importId:requestId,importStartedAt:Date.now(),status:"正在读取食谱网页…",updatedAt:Date.now()});return null;
}});
export const importProgress=internalMutation({args:{...SessionIdArg,requestId:v.string(),status:v.string(),done:v.boolean(),recipe:v.optional(recipe)},returns:v.null(),handler:async(ctx,args)=>{
 await requireOwner(ctx,args.sessionId);const p=await ctx.db.query("plans").withIndex("by_sessionId",q=>q.eq("sessionId",args.sessionId)).unique();if(!p||p.importId!==args.requestId||!p.importing)return null;
 let recipes=p.recipes;if(args.recipe){const r=recipeSchema.parse(args.recipe);if(recipes.length>=5)throw new ConvexError("最多 5 道菜");if(!recipes.some(x=>x.source&&x.source===r.source))recipes=[...recipes,r];}
 await ctx.db.patch(p._id,{recipes,status:args.status,importing:!args.done,checked:args.recipe?retainChecked(mergeRecipes(p.recipes,p.people),mergeRecipes(recipes,p.people),savedChecks(p)):savedChecks(p),checkKeyVersion:1,updatedAt:Date.now()});return null;
}});
export const emailPlan=internalQuery({args:{...SessionIdArg},returns:planView,handler:async(ctx,{sessionId})=>{assertSession(sessionId);await requireOwner(ctx,sessionId);const p=await ctx.db.query("plans").withIndex("by_sessionId",q=>q.eq("sessionId",sessionId)).unique();if(!p)throw new ConvexError("请先添加食谱");return {recipes:p.recipes,people:p.people,checked:savedChecks(p),status:p.status};}});
export const beginEmail=internalMutation({args:{...SessionIdArg,requestId:v.string()},returns:v.object({id:v.union(v.id("mailRequests"),v.null()),status:v.union(v.literal("new"),v.literal("pending"),v.literal("sent"),v.literal("failed"))}),handler:async(ctx,{sessionId,requestId})=>{assertSession(sessionId);await requireOwner(ctx,sessionId);if(!isSessionToken(requestId))throw new ConvexError("发送标识无效");const old=await ctx.db.query("mailRequests").withIndex("by_sessionId_and_requestId",q=>q.eq("sessionId",sessionId).eq("requestId",requestId)).unique();if(old)return {id:null,status:old.status};await limits.limit(ctx,"emails",{key:sessionId,throws:true});await limits.limit(ctx,"allEmails",{throws:true});const id=await ctx.db.insert("mailRequests",{sessionId,requestId,status:"pending",createdAt:Date.now()});return {id,status:"new" as const};}});
export const finishEmail=internalMutation({args:{id:v.id("mailRequests"),success:v.boolean()},returns:v.null(),handler:async(ctx,{id,success})=>{await ctx.db.patch(id,{status:success?"sent":"failed"});return null;}});
