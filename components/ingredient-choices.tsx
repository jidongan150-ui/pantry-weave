"use client";
import {useId} from 'react';
import {isChoice,isIncluded,selectIngredient,type IngredientChoice} from '@/lib/ingredient-choices';
import {recipeText} from '@/lib/recipe-language';
import type {Language} from '@/lib/i18n';
export default function IngredientChoices<T extends IngredientChoice&{name:string}>({ingredients,onChange,language,disabled=false}:{ingredients:T[];onChange:(rows:T[])=>void;language:Language;disabled?:boolean}){
 const id=useId();const t=(en:string,zh:string)=>language==='en'?en:zh;
 const groups=new Map<string,number[]>();
 ingredients.forEach((row,index)=>{if(isChoice(row)){const key=JSON.stringify(row.choiceGroup?['group',row.choiceGroup]:['item',index]);groups.set(key,[...(groups.get(key)??[]),index]);}});
 if(!groups.size)return null;
 const selected=ingredients.filter(row=>isChoice(row)&&isIncluded(row)).length;
 return <details className="ingredient-options"><summary>{t('Optional ingredients','可选食材')} · {t(`${selected} selected`,`${selected} 项已选`)}</summary><p>{t('Only selected items go on your shopping list.','只有选中的食材会加入购物清单。')}</p>
 {[...groups.entries()].map(([key,indexes],groupIndex)=>{
 const exclusive=!!ingredients[indexes[0]].choiceGroup;
 return <fieldset key={key} disabled={disabled}><legend>{exclusive?t('Choose one, or skip','选一种，也可以不选'):t('Add if needed','按需添加')}</legend>
 {exclusive&&<label><input type="radio" name={`${id}-${groupIndex}`} checked={indexes.every(index=>!isIncluded(ingredients[index]))} onChange={()=>onChange(ingredients.map((row,index)=>indexes.includes(index)?{...row,included:false}:row))}/>{t('Skip','不选')}</label>}
 {indexes.map(index=><label key={index}><input type={exclusive?'radio':'checkbox'} name={`${id}-${groupIndex}`} checked={isIncluded(ingredients[index])} onChange={event=>onChange(selectIngredient(ingredients,index,event.target.checked))}/>{recipeText(ingredients[index].name,language).text}</label>)}
 </fieldset>;
 })}</details>;
}
