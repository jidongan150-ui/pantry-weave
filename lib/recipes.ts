import { z } from "zod";
import { translate, type Language } from "./i18n.ts";
import { publicRecipeUrl } from "./safety.ts";
import { recipeText, recipeNote } from "./recipe-language.ts";
import {ingredientIdentity,ingredientCategory} from './ingredient-identity.ts';
import {isIncluded} from './ingredient-choices.ts';

export const categories = ["蔬菜水果", "肉蛋奶", "主食干货", "调味品", "其他"] as const;
export const ingredientSchema = z.object({
 name:z.string().trim().min(1).max(80), quantity:z.number().finite().positive().max(100000).nullable(),
 unit:z.string().trim().max(20), category:z.enum(categories), note:z.string().max(200),
 included:z.boolean().optional(),choiceGroup:z.string().min(1).max(200).optional(),
});
export const recipeSchema=z.object({id:z.string().min(1).max(100),name:z.string().trim().min(1).max(120),servings:z.number().finite().min(1).max(100).nullable(),source:z.string().max(2048).refine(value=>{try{publicRecipeUrl(value);return true;}catch{return false;}}).nullable(),sample:z.boolean(),ingredients:z.array(ingredientSchema).min(1).max(80)}).superRefine((recipe,ctx)=>{
 const selected=new Set<string>();for(const [index,row] of recipe.ingredients.entries())if(row.choiceGroup&&isIncluded(row)){if(selected.has(row.choiceGroup))ctx.addIssue({code:z.ZodIssueCode.custom,path:['ingredients',index,'included'],message:'Select at most one ingredient per alternative group'});selected.add(row.choiceGroup);}
});
export type Recipe=z.infer<typeof recipeSchema>;
export type Ingredient=z.infer<typeof ingredientSchema>;
export type ShoppingItem={key:string;name:string;quantity:number|null;unit:string;category:Ingredient["category"];sources:string[];notes:string[];asWritten?:boolean};
// Group for display only. Each requirement keeps its own amount and check key.
export function groupShoppingItems(items:ShoppingItem[]){
 const groups=new Map<string,{name:string;category:Ingredient['category'];items:ShoppingItem[]}>();
 for(const item of items){
  const name=ingredientIdentity(item.name),group=groups.get(name);
  if(group){group.items.push(item);if(group.category==='其他')group.category=item.category;}
  else groups.set(name,{name,category:item.category,items:[item]});
 }
 return [...groups.values()];
}
export function servingsSummary(recipes:Pick<Recipe,'servings'>[],people:number,language:Language){
 const original=recipes.filter(recipe=>recipe.servings===null).length;
 if(!recipes.length)return language==='en'?'Add a recipe to calculate amounts':'添加食谱后计算用量';
 if(original===recipes.length)return language==='en'?'Original amounts · serving counts unknown':'全部保留原方用量 · 原食谱人数未知';
 if(original){const scaled=recipes.length-original;return language==='en'?`${scaled} ${scaled===1?'recipe':'recipes'} scaled to ${people} people · ${original} ${original===1?'keeps':'keep'} original amounts`:`${scaled} 道按 ${people} 人份换算 · ${original} 道保留原方用量`;}
 return language==='en'?`Scaled to ${people} people`:`按 ${people} 人份换算`;
}
const units:Record<string,[string,number]>={"g":["克",1],"克":["克",1],"gram":["克",1],"grams":["克",1],"kg":["克",1000],"千克":["克",1000],"公斤":["克",1000],"ml":["毫升",1],"毫升":["毫升",1],"l":["毫升",1000],"升":["毫升",1000],"tbsp":["汤匙",1],"tablespoon":["汤匙",1],"tablespoons":["汤匙",1],"tsp":["茶匙",1],"teaspoon":["茶匙",1],"teaspoons":["茶匙",1],"clove":["瓣",1],"cloves":["瓣",1]};
Object.assign(units,{kilogram:['克',1000],kilograms:['克',1000],milliliter:['毫升',1],milliliters:['毫升',1],millilitre:['毫升',1],millilitres:['毫升',1],liter:['毫升',1000],liters:['毫升',1000],litre:['毫升',1000],litres:['毫升',1000],piece:['个',1],pieces:['个',1],cup:['杯',1],cups:['杯',1],stalk:['根',1],stalks:['根',1],slice:['片',1],slices:['片',1]});
export function mergeRecipes(recipes:Recipe[],people:number):ShoppingItem[]{
 if(!Number.isInteger(people)||people<1||people>20)throw new Error("人数应为 1–20 的整数");
 const merged=new Map<string,ShoppingItem>();
 for(const recipe of recipes){recipeSchema.parse(recipe);for(const ingredient of recipe.ingredients){
  if(!isIncluded(ingredient))continue;
  const name=ingredientIdentity(ingredient.name);
  const unitKey=ingredient.unit.trim().toLowerCase();
  const [unit,factor]=Object.hasOwn(units,unitKey)?units[unitKey]:[ingredient.unit.trim(),1];
  const asWritten=recipe.servings===null;
  const key=JSON.stringify([name,unit,ingredient.quantity===null?"unspecified":asWritten?"as-written":"numeric"]);
  const quantity=ingredient.quantity===null?null:ingredient.quantity*factor*(recipe.servings===null?1:people/recipe.servings);
  const current=merged.get(key);
  if(current){if(asWritten)current.asWritten=true;if(quantity!==null&&current.quantity!==null)current.quantity+=quantity;if(!current.sources.includes(recipe.name))current.sources.push(recipe.name);if(ingredient.note&&!current.notes.includes(ingredient.note))current.notes.push(ingredient.note);}
  else merged.set(key,{key,name,quantity,unit,category:ingredient.category==='其他'?ingredientCategory(name):ingredient.category,sources:[recipe.name],notes:ingredient.note?[ingredient.note]:[],...(asWritten?{asWritten:true}:{})});
 }}
 return [...merged.values()].sort((a,b)=>categories.indexOf(a.category)-categories.indexOf(b.category));
}
// Keep a check only when the requirement it represented is unchanged.
export function retainChecked(before:ShoppingItem[],after:ShoppingItem[],checked:string[]):string[]{
 const previous=new Map(before.map(item=>[item.key,item]));const selected=new Set(checked);
 const requirement=(item:ShoppingItem)=>JSON.stringify([item.quantity===null?null:Number(item.quantity.toPrecision(12)),!!item.asWritten,[...item.notes].sort(),item.quantity===null?item.sources.length:0]);
 return after.filter(item=>selected.has(item.key)&&previous.has(item.key)&&requirement(previous.get(item.key)!)===requirement(item)).map(item=>item.key);
}
// Version-0 plans used a smaller alias/unit table. A newly combined row must
// never inherit a partial check from just one of its former contributions.
export function legacyChecked(recipes:Recipe[],people:number,checked:string[]):string[]{
 const aliases:Record<string,string>={'西红柿':'番茄',tomato:'番茄',tomatoes:'番茄','大蒜':'蒜',garlic:'蒜','橄榄油':'橄榄油','olive oil':'橄榄油',pasta:'意大利面',salt:'盐',cucumber:'黄瓜',cucumbers:'黄瓜',egg:'鸡蛋',eggs:'鸡蛋'};
 const oldUnits=new Set('g 克 gram grams kg 千克 公斤 ml 毫升 l 升 tbsp tablespoon tablespoons tsp teaspoon teaspoons clove cloves'.split(' '));
 const changed=new Set<string>();
 for(const recipe of recipes)for(const row of recipe.ingredients){
  if(!isIncluded(row))continue;
  const raw=row.name.trim().toLowerCase().replace(/\s+/g,' '),unitKey=row.unit.trim().toLowerCase();
  const oldName=Object.hasOwn(aliases,raw)?aliases[raw]:raw,oldUnit=oldUnits.has(unitKey)?units[unitKey][0]:row.unit.trim();
  const name=ingredientIdentity(row.name),unit=Object.hasOwn(units,unitKey)?units[unitKey][0]:row.unit.trim();
  if(name!==oldName||unit!==oldUnit)changed.add(JSON.stringify([name,unit,row.quantity===null?'unspecified':recipe.servings===null?'as-written':'numeric']));
 }
 const current=new Set(mergeRecipes(recipes,people).map(row=>row.key));return checked.filter(key=>current.has(key)&&!changed.has(key));
}
export function formatQuantity(item:Pick<ShoppingItem,"quantity"|"unit">,language:Language="zh"){
 const unit=recipeText(item.unit,language).text;
 if(item.quantity===null){const taste=["适量","to taste","as needed"].includes(item.unit.trim().toLowerCase());return translate(taste?"适量":"用量未注明",language)+(item.unit&&!taste?` (${unit})`:"");}
 const value=new Intl.NumberFormat(language==="en"?"en-US":"zh-CN",item.quantity<.01?{maximumSignificantDigits:3}:{maximumFractionDigits:2}).format(item.quantity);
 return `${value} ${unit}`.trim();
}
export function shoppingText(items:ShoppingItem[],checked:string[],people:number,language:Language="zh"){
 return (items.some(item=>item.asWritten)?(language==='en'?'Pantry Weave · Shopping list':'一起买菜 · 购物清单'):translate("一起买菜 · {count} 人份购物清单",language,{count:people}))+"\n\n"+
 groupShoppingItems(items.filter(x=>!checked.includes(x.key))).map(group=>{
  const lines=group.items.map(x=>{const notes=x.notes.map(n=>recipeNote(n,language).text).filter(Boolean);return `${formatQuantity(x,language)}${x.asWritten&&x.quantity!==null?translate(" · 原方用量，未按人数换算",language):""}${notes.length?` (${notes.join("; ")})`:""}${group.items.length>1?` — ${x.sources.map(name=>recipeText(name,language).text).join(', ')}`:''}`;});
  return `□ ${recipeText(group.name,language).text}${lines.length===1?'  '+lines[0]:'\n'+lines.map(line=>'  • '+line).join('\n')}`;
 }).join("\n")+
 "\n\n"+translate("仅合并明确可换算的单位，请核对原食谱。",language);
}
export const sampleRecipes:Recipe[]=[
 {id:"sample-pasta",name:"蒜香番茄意面",servings:2,source:null,sample:true,ingredients:[{name:"意大利面",quantity:200,unit:"克",category:"主食干货",note:"干面重量"},{name:"番茄",quantity:300,unit:"克",category:"蔬菜水果",note:""},{name:"大蒜",quantity:3,unit:"瓣",category:"蔬菜水果",note:""},{name:"橄榄油",quantity:20,unit:"毫升",category:"调味品",note:""},{name:"盐",quantity:null,unit:"适量",category:"调味品",note:"按口味添加"}]},
 {id:"sample-salad",name:"番茄黄瓜沙拉",servings:2,source:null,sample:true,ingredients:[{name:"西红柿",quantity:.2,unit:"千克",category:"蔬菜水果",note:""},{name:"黄瓜",quantity:1,unit:"根",category:"蔬菜水果",note:""},{name:"橄榄油",quantity:10,unit:"毫升",category:"调味品",note:""},{name:"盐",quantity:null,unit:"适量",category:"调味品",note:"按口味添加"}]}
];
export function parseManualIngredients(text:string,language:Language="zh"):Ingredient[]{
 const fail=(line:number)=>new Error(language==="en"?`Line ${line}: use ingredient | positive decimal quantity | unit, or ingredient | to taste.`:`第 ${line} 行请填写“食材 | 正数用量 | 单位”，未知数量写“适量”。`);
 const lines=text.split(/\r?\n/).filter(x=>x.trim());if(!lines.length||lines.length>80)throw fail(1);
 return lines.map((line,index)=>{const parts=line.split(/[|｜]/).map(x=>x.trim());if(parts.length<2||parts.length>3)throw fail(index+1);const unknown=["适量","to taste","as needed"].includes(parts[1].toLowerCase());if(!unknown&&!/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(parts[1]))throw fail(index+1);const quantity=unknown?null:Number(parts[1]);const ingredient=ingredientSchema.safeParse({name:parts[0],quantity,unit:unknown?"适量":parts[2]??"",category:"其他",note:""});if(!ingredient.success)throw fail(index+1);return ingredient.data;});
}
