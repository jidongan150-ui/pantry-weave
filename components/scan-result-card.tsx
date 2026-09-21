"use client";
import {useEffect,useRef,useState} from 'react';
import {Download,Languages} from 'lucide-react';
import type {ImageRecipeDraft} from '@/lib/recipe-image';
import type {Language} from '@/lib/i18n';
import {localizeRecipe,translateRecipe,type DisplayRecipe} from '@/lib/recipe-language';
import {renderRecipeCard} from '@/lib/recipe-card';
import {isIncluded} from '@/lib/ingredient-choices';

export default function ScanResultCard({draft,language,onLanguageChange}:{draft:ImageRecipeDraft;language:Language;onLanguageChange:(language:Language)=>void}){
 const [translated,setTranslated]=useState<{signature:string;display:DisplayRecipe}|null>(null);
 const [image,setImage]=useState({signature:'',url:''});const [busy,setBusy]=useState(false);const [failed,setFailed]=useState(false);
 const job=useRef<AbortController|null>(null);const revision=useRef(0);const translateRequested=useRef(false);
 const t=(en:string,zh:string)=>language==='en'?en:zh;
 // Source quotations stay in the editable original; the shopping card shows their meaning/status.
 const cardDraft={...draft,ingredients:draft.ingredients.filter(isIncluded).map(row=>({...row,note:draft.fromSteps&&/原文：/.test(row.note)?
  (/可选或替代/.test(row.note)?t('Optional / alternative — choose as needed.','可选或替代，请按需选择。'):t('Found in cooking steps; check original.','来自步骤文字，请核对原图。')):row.note}))};
 const signature=JSON.stringify({cardDraft,language});
 const display=translated?.signature===signature?translated.display:localizeRecipe(cardDraft,language);
 const imageSignature=JSON.stringify({display,language});
 const url=image.signature===imageSignature?image.url:'';
 useEffect(()=>{job.current?.abort();revision.current++;setBusy(false);setTranslated(null);if(translateRequested.current){translateRequested.current=false;void fullTranslation();}},[signature,language]);
 useEffect(()=>()=>job.current?.abort(),[]);
 useEffect(()=>{
  let current=true;let objectUrl='';setFailed(false);
  const snapshot=JSON.parse(imageSignature) as {display:DisplayRecipe;language:Language};
  renderRecipeCard(snapshot.display,snapshot.language).then(blob=>{if(current){objectUrl=URL.createObjectURL(blob);setImage({signature:imageSignature,url:objectUrl});}}).catch(()=>{if(current)setFailed(true);});
  return()=>{current=false;if(objectUrl)URL.revokeObjectURL(objectUrl);setImage({signature:'',url:''});};
 },[imageSignature]);
 function switchLanguage(next:Language){if(next!==language){translateRequested.current=true;onLanguageChange(next);}else void fullTranslation();}
 async function fullTranslation(){
  job.current?.abort();const controller=new AbortController();job.current=controller;const current=++revision.current;setBusy(true);
  const timer=setTimeout(()=>controller.abort(),30000);
  try{
   const result=await Promise.race([translateRecipe(cardDraft,language,controller.signal),new Promise<null>(resolve=>controller.signal.addEventListener('abort',()=>resolve(null),{once:true}))]);
   if(current===revision.current)setTranslated({signature,display:result??{...display,translationUnavailable:true}});
  }finally{clearTimeout(timer);if(current===revision.current)setBusy(false);}
 }
 return <section className="scan-card-section" aria-label={t('Scan results card','扫描结果卡片')}>
  <div className="scan-card-toolbar"><strong><Languages size={20}/>{t('Results language','结果语言')}</strong><div className="language-switch scan-language" role="group" aria-label="Results language / 结果语言"><button type="button" aria-pressed={language==='zh'} onClick={()=>switchLanguage('zh')}>中文</button><button type="button" aria-pressed={language==='en'} onClick={()=>switchLanguage('en')}>English</button></div></div>
  <p className="image-help">{t('Dish names, ingredients and units switch together. Your original edits are preserved.','菜名、食材和单位一起切换，不会覆盖你的原文修改。')}</p>
  {display.untranslated>0&&<div className="scan-translation-note"><p role="status">{display.translationUnavailable?t('Full translation is unavailable in this browser right now. Untranslated text is kept in its original language.','当前浏览器暂时无法完成完整翻译，未翻译的内容已保留原文。'):t('Some text has no local translation and stays in its original language. You can try on-device translation if your browser supports it; a language download may be needed.','部分文字暂无本地译文，已保留原文。如果浏览器支持，可以尝试设备内翻译；首次可能需要下载语言包。')}</p>{!display.translationUnavailable&&<button type="button" className="text-button" disabled={busy} onClick={()=>void fullTranslation()}>{busy?t('Translating…','正在翻译…'):t('Try full translation','尝试完整翻译')}</button>}</div>}
  {url?<a className="scan-card-image-link" href={url} download={`pantry-weave-${language}.png`} aria-label={t('Save shopping card image','保存购物清单图片')}><img className="scan-card-image" src={url} alt={`${display.name}. ${display.ingredients.map(row=>`${row.name}: ${row.quantity||t('amount unknown','用量未知')} ${row.unit}. ${row.note}`).join('; ')}`} /></a>:<p role="status">{failed?t('Image could not be created. You can continue editing the recipe.','图片生成失败，可继续编辑食谱。'):t('Preparing your image…','正在生成图片…')}</p>}
  {url&&<a className="primary-button" href={url} download={`pantry-weave-${language}.png`}><Download size={18}/>{t('Save image · PNG','保存图片 · PNG')}</a>}
  <p className="image-help">{t('Tap to save, or long-press the image on your phone. Your edits update this preview.','点击保存，或在手机上长按图片保存。修改食谱后，预览会同步更新。')}</p>
 </section>;
}
