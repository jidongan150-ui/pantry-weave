import {recipeSchema,type Recipe,type Ingredient} from './recipes.ts';
import {imageQuantity,type ImageIngredient} from './recipe-image.ts';
export type RecipeDraft={name:string;servings:string;ingredients:(ImageIngredient&{category?:Ingredient['category']})[]};
export const emptyRow=()=>({name:'',quantity:'',unit:'',note:''});
export function draftFromRecipe(recipe?:Recipe):RecipeDraft{
 if(!recipe)return {name:'',servings:'',ingredients:[emptyRow()]};
 const ingredients=recipe.ingredients.map(row=>{
  // Older scans stored the optional marker only in their source note. Expose it
  // as an explicit choice in the edit draft; the saved recipe changes only on Save.
  const legacy=row.included===undefined&&!row.choiceGroup&&row.note.startsWith('可选或替代，原文：');
  const group=legacy&&row.note.includes('或')&&recipe.ingredients.filter(other=>other.note===row.note).length>1;
  return {...row,quantity:row.quantity===null?'':String(row.quantity),...(legacy?{included:false}:{}),...(group?{choiceGroup:row.note.slice(0,200)}:{})};
 });
 return {name:recipe.name,servings:recipe.servings===null?'':String(recipe.servings),ingredients};
}
export function recipeFromDraft(draft:RecipeDraft,original?:Recipe):Recipe{
 if(draft.ingredients.some(row=>row.quantity.trim()&&imageQuantity(row.quantity)===null))throw Error('Invalid quantity');
 return recipeSchema.parse({id:original?.id??crypto.randomUUID(),source:original?.source??null,sample:original?.sample??false,name:draft.name,servings:draft.servings.trim()?Number(draft.servings):null,ingredients:draft.ingredients.map(row=>({...row,quantity:row.quantity.trim()?imageQuantity(row.quantity):null,category:row.category??'其他'}))});
}
