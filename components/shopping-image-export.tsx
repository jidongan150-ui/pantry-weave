"use client";
import {useEffect,useState} from 'react';
import {Download,ImageDown} from 'lucide-react';
import {Dialog,DialogTrigger,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {renderRecipeCard} from '@/lib/recipe-card';
import {shoppingCard} from '@/lib/shopping-card';
import type {ShoppingItem} from '@/lib/recipes';
import type {Language} from '@/lib/i18n';

export default function ShoppingImageExport({items,checked,people,recipeNames,language,setLanguage,disabled}:{items:ShoppingItem[];checked:string[];people:number;recipeNames:string[];language:Language;setLanguage:(language:Language)=>void;disabled:boolean}){
 const [open,setOpen]=useState(false);
 const [image,setImage]=useState({signature:'',url:''});
 const [failure,setFailure]=useState('');
 const [retry,setRetry]=useState(0);
 const t=(en:string,zh:string)=>language==='en'?en:zh;
 const model=shoppingCard(items,checked,people,recipeNames,language);
 const empty=!model.recipe.ingredients.length;
 const signature=JSON.stringify({model,language,retry});
 useEffect(()=>{
  if(!open||disabled||empty)return;
  let current=true;let url='';
  setFailure('');
  const snapshot=JSON.parse(signature) as {model:ReturnType<typeof shoppingCard>;language:Language};
  renderRecipeCard(snapshot.model.recipe,snapshot.language,snapshot.model.options).then(blob=>{
   if(current){url=URL.createObjectURL(blob);setImage({signature,url});}
  }).catch(()=>{if(current)setFailure(signature);});
  return()=>{current=false;if(url)URL.revokeObjectURL(url);setImage({signature:'',url:''});};
 },[open,disabled,empty,signature]);
 const ready=open&&!disabled&&!empty&&image.signature===signature;
 const fileName=`pantry-weave-shopping-list-${language}.png`;
 const description=`${model.options.unscaled?t('Original quantities included','含原方用量'):model.recipe.servings+' '+t('people','人')} — ${model.recipe.ingredients.map(row=>`${row.name}: ${row.quantity}${row.note?`; ${row.note}`:''}`).join(' · ')}`;
 return <Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild><button className="primary-button shopping-image-button" disabled={disabled||empty}><ImageDown size={18}/>{t('Save shopping list image','保存购物清单图片')}</button></DialogTrigger>
  <DialogContent className="app-dialog image-dialog shopping-image-dialog" closeLabel={t('Close','关闭')}>
   <DialogTitle>{t('Your shopping list image','你的购物清单图片')}</DialogTitle>
   <DialogDescription>{model.options.unscaled?t('Recipes without a serving count keep their original amounts. Checked items are excluded.','未注明人数的食谱保留原方用量，已排除勾选的食材。'):t('Uses your selected serving count. Checked items are excluded.','按当前用餐人数换算，已排除勾选的食材。')}</DialogDescription>
   <div className="language-switch" role="group" aria-label="Image language / 图片语言"><button type="button" aria-pressed={language==='zh'} onClick={()=>setLanguage('zh')}>中文</button><button type="button" aria-pressed={language==='en'} onClick={()=>setLanguage('en')}>English</button></div>
   {ready?<>
    <a className="primary-button" href={image.url} download={fileName}><Download size={18}/>{t('Save image · PNG','保存图片 · PNG')}</a>
    <a href={image.url} download={fileName} aria-label={t('Save shopping list image','保存购物清单图片')}><img className="scan-card-image" src={image.url} alt={description}/></a>
    <p className="image-help">{t('On your phone, you can also long-press the image to save it.','手机上也可以长按图片保存。')}</p>
   </>:failure===signature?<div role="alert"><p>{t('Could not create the image. Please try again.','图片生成失败，请重试。')}</p><button className="secondary-button" onClick={()=>setRetry(value=>value+1)}>{t('Try again','重试')}</button></div>:<p role="status">{empty?t('Nothing left to buy.','没有待购食材。'):disabled?t('Updating your list…','正在更新清单…'):t('Preparing your image…','正在生成图片…')}</p>}
  </DialogContent>
 </Dialog>;
}
