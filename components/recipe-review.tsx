"use client";
import {useEffect,useState} from 'react';
import {Plus,PenLine,Trash2,ChevronDown} from 'lucide-react';
import type {Language} from '@/lib/i18n';
import {recipeText,recipeNote} from '@/lib/recipe-language';
import {imageQuantity,type ImageRecipeDraft} from '@/lib/recipe-image';
import {formatQuantity} from '@/lib/recipes';
import IngredientChoices from './ingredient-choices';
import {isChoice,isIncluded} from '@/lib/ingredient-choices';

function TranslatedInput({value,language,onChange,...props}:{value:string;language:Language;onChange:(value:string)=>void}&Omit<React.InputHTMLAttributes<HTMLInputElement>,'value'|'onChange'>){
 const [focused,setFocused]=useState(false);const [edit,setEdit]=useState('');
 return <input {...props} value={focused?edit:recipeText(value,language).text} onFocus={()=>{setEdit(recipeText(value,language).text);setFocused(true);}} onBlur={()=>setFocused(false)} onChange={event=>{setEdit(event.target.value);onChange(event.target.value);}}/>;
}
export default function RecipeReview({draft,onChange,language,disabled}:{draft:ImageRecipeDraft;onChange:(draft:ImageRecipeDraft)=>void;language:Language;disabled:boolean}){
 const [editing,setEditing]=useState<number|null>(null);
 useEffect(()=>{setEditing(null);},[language]);
 const t=(en:string,zh:string)=>language==='en'?en:zh;
 const rt=(value:string)=>recipeText(value,language).text;
 const update=(index:number,key:'name'|'quantity'|'unit'|'note',value:string)=>onChange({...draft,ingredients:draft.ingredients.map((row,i)=>i===index?{...row,[key]:value}:row)});
 return <div className="simple-recipe-review">
  <label className="review-dish">{t('Dish','菜名')}<TranslatedInput aria-label={t('Recipe name','菜名')} value={draft.name} language={language} maxLength={120} disabled={disabled} placeholder={t('My recipe','我的食谱')} onChange={name=>onChange({...draft,name})}/></label>
  <p className="image-help">{t('Tap an ingredient to change it.','点一下食材即可修改。')}</p>
  <ul className="review-ingredient-list">{draft.ingredients.map((row,index)=>{
   if(isChoice(row)&&!isIncluded(row))return null;
   const quantity=imageQuantity(row.quantity);const note=rt(row.note);
   return <li key={index}>
    <button className="ingredient-result" type="button" disabled={disabled} aria-expanded={editing===index} aria-label={t(`Edit ingredient ${index+1}: ${rt(row.name)}`,`修改食材 ${index+1}：${rt(row.name)}`)} onClick={()=>setEditing(editing===index?null:index)}><span><strong>{rt(row.name)||t('New ingredient','新食材')}</strong>{/(可选|替代|optional|alternative)/i.test(row.note)&&<small>{t('Optional / alternative','可选／替代')}</small>}</span><span className="result-amount">{quantity===null&&!row.unit?t('Not stated','未注明'):formatQuantity({quantity,unit:row.unit},language)}</span><PenLine size={15}/></button>
    {row.note.startsWith('用量待核对，原文：')&&<p className="image-help">{recipeNote(row.note,language).text}</p>}
    {editing===index&&<fieldset className="compact-ingredient-editor" disabled={disabled}>
     <label className="wide">{t('Ingredient','食材')}<TranslatedInput value={row.name} language={language} maxLength={80} required onChange={value=>update(index,'name',value)}/></label>
     <label>{t('Quantity','用量')}<input inputMode="decimal" maxLength={24} value={row.quantity} placeholder={t('Not stated','未注明')} onChange={event=>update(index,'quantity',event.target.value)}/></label>
     <label>{t('Unit','单位')}<TranslatedInput value={row.unit} language={language} maxLength={20} onChange={value=>update(index,'unit',value)}/></label>
     {!!row.quantity.trim()&&quantity===null&&<p className="form-error wide" role="alert">{t('Use a positive number or leave blank.','填写正数，未注明时留空。')}</p>}
     <details className="wide"><summary>{t('Notes & source text','备注与原文')}{note?' · '+t('View','查看'):''}</summary><label>{t('Note','备注')}<TranslatedInput value={row.note} language={language} maxLength={200} onChange={value=>update(index,'note',value)}/></label>{rt(row.name)!==row.name&&<p className="image-help">{t('Original: ','原文：')}{row.name}</p>}</details>
     <button type="button" className="text-button" onClick={()=>{onChange({...draft,ingredients:draft.ingredients.filter((_,i)=>i!==index)});setEditing(null);}}><Trash2 size={14}/>{t('Remove','删除')}</button><button type="button" className="secondary-button" onClick={()=>setEditing(null)}>{t('Done','完成')}</button>
    </fieldset>}
   </li>;
  })}</ul>
  <IngredientChoices ingredients={draft.ingredients} language={language} disabled={disabled} onChange={ingredients=>onChange({...draft,ingredients})}/>
  <button className="text-button add-missing" type="button" disabled={disabled||draft.ingredients.length>=80} onClick={()=>{setEditing(draft.ingredients.length);onChange({...draft,ingredients:[...draft.ingredients,{name:'',quantity:'',unit:'',note:''}]});}}><Plus size={15}/>{t('Add an ingredient','添加食材')}</button>
  <details className="serving-options"><summary><ChevronDown size={15}/>{draft.servings?t(`Original recipe: ${draft.servings} servings`,`原方 ${draft.servings} 人份`):t('Keep original quantities','保留原方用量')}</summary><p className="image-help">{t('Only needed to scale this recipe. Leave blank if the image does not say.','需要按人数换算时再填写；图片没写可留空。')}</p><label>{t('Original servings','原食谱人数')}<input type="number" min="1" max="100" step="any" value={draft.servings} disabled={disabled} onChange={event=>onChange({...draft,servings:event.target.value})}/></label></details>
  {draft.ingredients.some(row=>recipeText(row.name,language).original)&&<p className="image-help">{t('Some uncommon ingredient names remain in the original language.','个别食材暂无译名，保留原文。')}</p>}
 </div>;
}
