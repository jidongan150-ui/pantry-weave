"use client";
import {useRef,useState} from 'react';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import RecipeFields from '@/components/recipe-fields';
import {draftFromRecipe,recipeFromDraft} from '@/lib/recipe-edit';
import {errorMessage,type Language} from '@/lib/i18n';
import type {Recipe} from '@/lib/recipes';

export default function RecipeEditor({original,language,onClose,onSave}:{original?:Recipe;language:Language;onClose:()=>void;onSave:(recipe:Recipe)=>Promise<unknown>}){
 const [draft,setDraft]=useState(()=>draftFromRecipe(original));const [saving,setSaving]=useState(false);const [error,setError]=useState('');const lock=useRef(false);
 const t=(en:string,zh:string)=>language==='en'?en:zh;
 async function save(event:React.FormEvent){
  event.preventDefault();if(lock.current)return;setError('');
  let recipe:Recipe;
  try{recipe=recipeFromDraft(draft,original);}catch{setError(t('Check the name, servings and quantities. Use positive numbers or fractions; leave unknown amounts blank.','请核对菜名、人数和用量；用量填写正数或分数，未知时留空。'));return;}
  lock.current=true;setSaving(true);
  try{await onSave(recipe);onClose();}catch(cause){setError(errorMessage(cause,language));}finally{lock.current=false;setSaving(false);}
 }
 return <Dialog open onOpenChange={open=>{if(!open&&!lock.current)onClose();}}><DialogContent className="app-dialog image-dialog" closeLabel={t('Close','关闭')}><DialogTitle>{original?t('Edit recipe','编辑食谱'):t('Add a recipe','添加食谱')}</DialogTitle><DialogDescription>{original?t('Save to update your list. Checks for unchanged ingredients are kept.','保存后更新清单，未变化食材的勾选会保留。'):t('Enter the original recipe. We will scale it to your meal.','填写原食谱，系统会按这顿饭的人数换算。')}</DialogDescription>
  <form className="manual-form" onSubmit={event=>void save(event)}><RecipeFields draft={draft} onChange={setDraft} language={language} disabled={saving}/>{error&&<p className="form-error" role="alert">{error}</p>}<div className="review-actions"><button type="button" className="secondary-button" disabled={saving} onClick={onClose}>{t('Cancel','取消')}</button><button type="submit" className="primary-button" disabled={saving||!draft.ingredients.length}>{saving?t('Saving…','正在保存…'):original?t('Save changes','保存修改'):t('Add recipe','添加食谱')}</button></div></form>
 </DialogContent></Dialog>;
}
