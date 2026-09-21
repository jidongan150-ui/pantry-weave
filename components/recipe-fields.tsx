"use client";
import {Plus,Trash2} from 'lucide-react';
import {emptyRow,type RecipeDraft} from '@/lib/recipe-edit';
import {imageQuantity} from '@/lib/recipe-image';
import type {Language} from '@/lib/i18n';
import IngredientChoices from './ingredient-choices';

export default function RecipeFields<D extends RecipeDraft>({draft,onChange,language,disabled=false}:{draft:D;onChange:(draft:D)=>void;language:Language;disabled?:boolean}){
 const t=(en:string,zh:string)=>language==='en'?en:zh;
 const missing=draft.ingredients.filter(row=>!row.quantity.trim()&&!['适量','to taste','as needed'].includes(row.unit.trim().toLowerCase())).length;
 const servingsMissing=!draft.servings.trim()||Number(draft.servings)<1||Number(draft.servings)>100;
 return <>
  <div className="review-summary" role="status">{servingsMissing&&<p>{t('Servings are optional. Leave blank to keep original quantities.','人数可留空，保留原方用量。')}</p>}{missing>0&&<p>{t(`${missing} ingredient(s) have no amount. Check the source; leave blank if it is not stated.`,`${missing} 项食材用量未注明。请核对原文；原文没有写明时可留空。`)}</p>}<p>{t('Edit the original text below. Blank amounts stay unknown; use “to taste” in the unit only when the recipe says so.','下方编辑的是原文。用量留空表示未知；只有原食谱明确写明时，才在单位中填“适量”。')}</p></div>
  <label>{t('Recipe name','菜名')}<input required maxLength={120} value={draft.name} disabled={disabled} onChange={event=>onChange({...draft,name:event.target.value})}/></label>
  <IngredientChoices ingredients={draft.ingredients} language={language} disabled={disabled} onChange={ingredients=>onChange({...draft,ingredients})}/>
  <label>{t('Original servings','原食谱人数')}<input type="number" min="1" max="100" step="any" value={draft.servings} aria-invalid={!!draft.servings.trim()&&servingsMissing} disabled={disabled} placeholder={t('Enter the number in the original recipe','填写原食谱的人数')} onChange={event=>onChange({...draft,servings:event.target.value})}/></label>
  <div className="image-ingredient-rows">{draft.ingredients.map((row,index)=>{
   const uncertain=!row.quantity.trim()&&!['适量','to taste','as needed'].includes(row.unit.trim().toLowerCase());
   const invalid=!!row.quantity.trim()&&imageQuantity(row.quantity)===null;
   const update=(field:'name'|'quantity'|'unit'|'note',value:string)=>onChange({...draft,ingredients:draft.ingredients.map((r,i)=>i===index?{...r,[field]:value}:r)});
   return <fieldset className={`image-ingredient-row${uncertain?' needs-review':''}`} key={index} disabled={disabled}>
    <legend>{t(`Ingredient ${index+1}`,`食材 ${index+1}`)}{uncertain&&<span className="review-badge">{t('Amount unknown','用量未知')}</span>}</legend>
    <label className="image-ingredient-name">{t('Ingredient','食材')}<input required maxLength={80} value={row.name} onChange={event=>update('name',event.target.value)}/></label>
    <label>{t('Quantity','用量')}<input inputMode="decimal" maxLength={24} aria-invalid={invalid} placeholder={t('Unknown','未知')} value={row.quantity} onChange={event=>update('quantity',event.target.value)}/>{invalid&&<small className="form-error">{t('Use a positive number or fraction.','请填正数或分数。')}</small>}</label>
    <label>{t('Unit','单位')}<input maxLength={20} value={row.unit} placeholder={t('g, cups, to taste…','克、杯、适量…')} onChange={event=>update('unit',event.target.value)}/></label>
    <label className="image-ingredient-note">{t('Note / uncertain text','备注／待核对文字')}<input maxLength={200} value={row.note} onChange={event=>update('note',event.target.value)}/></label>
    <button className="text-button" type="button" aria-label={t(`Remove ingredient ${index+1}`,`移除食材 ${index+1}`)} onClick={()=>onChange({...draft,ingredients:draft.ingredients.filter((_,i)=>i!==index)})}><Trash2 size={15}/>{t('Remove','移除')}</button>
   </fieldset>;
  })}</div>
  {!draft.ingredients.length&&<p role="status">{t('Add at least one ingredient.','请至少添加一项食材。')}</p>}
  <button type="button" className="secondary-button" disabled={disabled||draft.ingredients.length>=80} onClick={()=>onChange({...draft,ingredients:[...draft.ingredients,emptyRow()]})}><Plus size={16}/>{t('Add ingredient row','补充一行食材')}</button>
 </>;
}
