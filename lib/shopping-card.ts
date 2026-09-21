import {formatQuantity, groupShoppingItems, type ShoppingItem} from './recipes.ts';
import type {Language} from './i18n.ts';
import {recipeText, recipeNote, type DisplayRecipe} from './recipe-language.ts';
import type {RecipeCardOptions} from './recipe-card';

// Consume the final list: quantities have already been merged and scaled.
export function shoppingCard(items:ShoppingItem[], checked:string[], people:number, recipeNames:string[], language:Language):{recipe:DisplayRecipe;options:RecipeCardOptions} {
 let untranslated=0;
 const field=(value:string)=>{
  const result=recipeText(value,language);
  if(result.original)untranslated++;
  return result.text;
 };
 const names=recipeNames.map(field);
 const groups=groupShoppingItems(items.filter(item=>!checked.includes(item.key)));
 const itemDetails=groups.map(group=>group.items.map(item=>({
  quantity:formatQuantity({...item,unit:field(item.unit)},language),
  note:[...item.notes.map(value=>{const note=recipeNote(value,language);if(note.original)untranslated++;return note.text;}),...(item.asWritten&&item.quantity!==null?[language==='en'?'Original amount; not scaled to servings':'原方用量，未按人数换算']:[]),...(group.items.length>1?[item.sources.map(field).join(' / ')]:[])].filter(Boolean).join(' · '),
 })));
 const ingredients=groups.map((group,index)=>({
  name:field(group.name),quantity:itemDetails[index].map(row=>row.quantity).join(' + '),unit:'',
  note:itemDetails[index].map(row=>itemDetails[index].length>1?`${row.quantity}: ${row.note}`:row.note).filter(Boolean).join(' · '),
 }));
 return {recipe:{name:language==='en'?'My shopping list':'我的购物清单',servings:String(people),ingredients,omitted:[],untranslated},options:{kind:'shopping',recipeNames:names,unscaled:items.some(item=>item.asWritten),itemDetails}};
}
