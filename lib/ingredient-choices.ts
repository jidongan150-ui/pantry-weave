export type IngredientChoice={included?:boolean;choiceGroup?:string};
export const isChoice=(row:IngredientChoice)=>row.included!==undefined||!!row.choiceGroup;
export const isIncluded=(row:IngredientChoice)=>row.included!==false;
export function selectIngredient<T extends IngredientChoice>(rows:T[],index:number,included:boolean):T[]{
 const selected=rows[index];if(!selected)return rows;
 return rows.map((row,i)=>i===index?{...row,included}:included&&selected.choiceGroup&&row.choiceGroup===selected.choiceGroup?{...row,included:false}:row);
}
