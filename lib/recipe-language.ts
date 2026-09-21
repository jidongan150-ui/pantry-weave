import {translate, type Language} from './i18n.ts';
import type { ImageRecipeDraft } from './recipe-image';

// Local glossary. Unknown text is preserved and reported, never silently invented.
const pairs = [
 ['小扁豆','lentils'],['红扁豆','red lentils','red split lentils','dried red split lentils'],['孜然籽','cumin seeds'],['孜然粉','ground cumin'],['咖喱粉','curry powder'],['蔬菜高汤块','vegetable stock cube'],['蔬菜高汤','vegetable stock'],['希腊酸奶','Greek yogurt'],['沸水','boiling water'],['中等大小','medium'],['芹菜茎','celery stalk'],['红辣椒','red chilli'],['切片','sliced'],['干燥','dried'],['升','litre','litres'],
 ['番茄炒蛋','Tomato scrambled eggs'],['番茄鸡蛋汤','Tomato and egg soup'],['宫保鸡丁','Kung pao chicken'],['土豆泥','Mashed potatoes'],['经典土豆泥','Classic mashed potatoes'],['煎饼','Pancakes'],['番茄意面','Tomato pasta'],
 ['番茄','tomatoes','tomato','西红柿'],['鸡蛋','eggs','egg'],['葱','scallions','scallion','green onions','spring onions','葱花','小葱'],['蒜','garlic','大蒜'],['姜','ginger','生姜'],
 ['土豆','potatoes','potato','马铃薯'],['洋葱','onion','onions'],['胡萝卜','carrots','carrot'],['黄瓜','cucumber','cucumbers'],['白菜','Chinese cabbage'],['菠菜','spinach'],['西兰花','broccoli'],['芹菜','celery'],['香菜','cilantro','coriander leaves'],['生菜','lettuce'],['南瓜','pumpkin'],['青椒','green pepper'],['红椒','red pepper'],['辣椒','chili','chillies'],['干辣椒','dried chilies'],['蘑菇','mushrooms','mushroom'],['香菇','shiitake mushrooms'],['玉米','corn'],['豌豆','peas'],['豆角','green beans'],
 ['鸡肉','chicken'],['鸡腿肉','chicken thigh'],['鸡胸肉','chicken breast'],['猪肉','pork'],['牛肉','beef'],['羊肉','lamb'],['虾','shrimp','prawns'],['鱼肉','fish'],['豆腐','tofu'],['牛奶','milk'],['水','water','清水'],['奶油','cream'],['淡奶油','heavy cream'],['黄油','butter'],['融化的黄油','melted butter','butter, melted'],['奶酪','cheese'],['酸奶','yogurt'],['酪乳','buttermilk'],['蛋清','egg white','鸡蛋清'],
 ['食用油','cooking oil','oil','油'],['植物油','vegetable oil'],['橄榄油','olive oil'],['芝麻油','sesame oil','香油'],['盐','salt','食盐'],['粗盐','kosher salt'],['糖','sugar','白糖','白砂糖'],['红糖','brown sugar'],['冰糖','rock sugar'],['生抽','light soy sauce'],['老抽','dark soy sauce'],['酱油','soy sauce'],['蚝油','oyster sauce'],['料酒','cooking wine'],['米醋','rice vinegar'],['醋','vinegar'],['胡椒粉','ground pepper'],['黑胡椒','black pepper'],['白胡椒','white pepper'],['花椒','Sichuan peppercorns'],['八角','star anise'],['番茄酱','ketchup'],['豆瓣酱','chili bean paste'],
 ['面粉','flour'],['中筋面粉','all-purpose flour','plain flour'],['泡打粉','baking powder'],['小苏打','baking soda'],['香草精','vanilla extract'],['大米','rice'],['米饭','cooked rice'],['面条','noodles'],['意大利面','pasta'],['淀粉','starch'],['玉米淀粉','cornstarch','corn starch'],['燕麦','oats'],['花生','peanuts'],['芝麻','sesame seeds'],['柠檬','lemon'],['香蕉','banana'],['草莓','strawberries'],['蜂蜜','honey'],['枫糖浆','maple syrup'],
 ['克','g','gram','grams'],['千克','kg','kilogram','kilograms','公斤'],['毫升','ml','milliliters'],['升','L','liters'],['杯','cup','cups'],['汤匙','tbsp','tablespoon','tablespoons'],['茶匙','tsp','teaspoon','teaspoons'],['磅','lb','lbs','pound','pounds'],['盎司','oz','ounce','ounces'],['瓣','clove','cloves'],['个','piece','pieces'],['片','slice','slices'],['根','stalk','stalks'],
 ['适量','to taste','as needed'],['少许','a pinch'],['切碎','chopped'],['切丁','diced'],['切末','minced'],['融化','melted'],['可选','optional'],['去皮','peeled'],['新鲜','fresh'],['大号','large'],['小号','small'],
 ] as const;
const lookup = new Map<string, {en:string;zh:string}>();
for(const [zh,en,...aliases] of pairs) for(const key of [zh,en,...aliases]) lookup.set(key.toLowerCase(),{en,zh});
// Exact terms only. Preparation words and similar-looking foods are not stripped.
export function exactRecipeTerm(value:string):string|undefined{return lookup.get(value.trim().toLowerCase().replace(/\s+/g,' '))?.zh;}
export function localRecipeText(text:string, language:Language): {text:string; original:boolean} {
 const value=text.trim();
 if(!value) return {text:value,original:false};
 const exact=lookup.get(value.toLowerCase());
 if(exact) return {text:exact[language],original:false};
 const hasChinese=/[\u3400-\u9fff]/.test(value);
 if(language==='en'&&!hasChinese || language==='zh'&&hasChinese&&!/[a-z]{3}/i.test(value)) return {text:value,original:false};
 // Translate a combination only when every word is in the glossary. Unrecognized
 // qualifiers stay intact rather than getting dropped from shopping instructions.
 const keys=[...lookup.keys()].filter(key=>language==='en'?/[\u3400-\u9fff]/.test(key):/^[a-z -]+$/.test(key)).sort((a,b)=>b.length-a.length);
 const escaped=keys.map(key=>key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
 const pattern=new RegExp(language==='en'?escaped.join('|'):`\\b(?:${escaped.join('|')})\\b`,'gi');
 let remainder=value;const matches=[...value.matchAll(pattern)];
 for(const match of matches)remainder=remainder.replace(match[0],'');
 if(matches.length&&!/[a-z\u3400-\u9fff]/i.test(remainder)){
  return {text:value.replace(pattern,word=>lookup.get(word.toLowerCase())![language]+(language==='en'?' ':'')).replace(/\s+/g,' ').trim(),original:false};
 }
 return {text:value,original:true};
}
export type DisplayRecipe = ImageRecipeDraft & { untranslated:number; translationUnavailable?:boolean };
// One display path for scan previews, saved recipes and every shopping export.
// Source fields stay untouched, including words without a reliable local translation.
export function recipeText(value:string,language:Language):{text:string;original:boolean}{
 const known=translate(value,language);
 if(language==='en'&&!/[\u3400-\u9fff]/.test(known))return {text:known.trim(),original:false};
 return known!==value?{text:known,original:false}:localRecipeText(value,language);
}
// OCR step excerpts remain stored for editing, but are not shopping instructions.
export function recipeNote(value:string,language:Language):{text:string;original:boolean}{
 if(value.startsWith('用量待核对，原文：'))return {text:language==='en'?'Amount needs checking against the original image':'用量待核对，请对照原图',original:false};
 if(value.startsWith('可选或替代，原文：'))return {text:language==='en'?'Optional / alternative':'可选／替代',original:false};
 if(value.startsWith('原文：'))return {text:'',original:false};
 return recipeText(value,language);
}
export function localizeRecipe(draft:ImageRecipeDraft,language:Language):DisplayRecipe {
 let untranslated=0;
 const field=(s:string)=>{const result=recipeText(s,language);if(result.original)untranslated++;return result.text;};
 return {...draft,name:field(draft.name),ingredients:draft.ingredients.map(row=>{const note=recipeNote(row.note,language);if(note.original)untranslated++;return {...row,name:field(row.name),unit:field(row.unit),note:note.text};}),untranslated};
}

type LocalTranslator={translate:(text:string)=>Promise<string>;destroy:()=>void};
type TranslatorFactory={availability:(options:{sourceLanguage:string;targetLanguage:string})=>Promise<string>;create:(options:{sourceLanguage:string;targetLanguage:string;signal:AbortSignal})=>Promise<LocalTranslator>};
// Optional on-device browser translation. No recipe text is sent to a server.
export async function translateRecipe(draft:ImageRecipeDraft,language:Language,signal:AbortSignal):Promise<DisplayRecipe>{
 const result=localizeRecipe(draft,language);
 const factory=(globalThis as typeof globalThis & {Translator?:TranslatorFactory}).Translator;
 if(!result.untranslated)return result;
 if(!factory)return {...result,translationUnavailable:true};
 const options={sourceLanguage:language==='en'?'zh':'en',targetLanguage:language==='en'?'en':'zh'};
 let translator:LocalTranslator|undefined;
 const cancel=()=>translator?.destroy();
 try{
  if(signal.aborted||await factory.availability(options)==='unavailable')return {...result,translationUnavailable:true};
  translator=await factory.create({...options,signal});
  if(signal.aborted)throw new Error('cancelled');
  signal.addEventListener('abort',cancel,{once:true});
  const convert=async(s:string)=>{
   const local=recipeText(s,language);if(!local.original)return local.text;
   if(signal.aborted)throw new Error('cancelled');
   const translated=await translator!.translate(s);
   if(!translated.trim()||translated.length>1000)return s;
   if(!localRecipeText(translated,language).original)result.untranslated--;
   return translated.trim();
  };
  result.name=await convert(draft.name);
  for(let i=0;i<draft.ingredients.length;i++){
   const row=draft.ingredients[i];const note=recipeNote(row.note,language);result.ingredients[i]={...row,name:await convert(row.name),unit:await convert(row.unit),note:note.original?await convert(row.note):note.text};
  }
 }catch{result.translationUnavailable=true;/* Keep original text when the model is unavailable. */}
 finally{signal.removeEventListener('abort',cancel);translator?.destroy();}
 return result;
}
