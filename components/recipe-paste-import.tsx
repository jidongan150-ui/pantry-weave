"use client";
import {useEffect,useRef,useState} from 'react';
import {ClipboardPaste,Copy,ExternalLink,MessageCircle} from 'lucide-react';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import RecipeReview from './recipe-review';
import ScanResultCard from './scan-result-card';
import {parseRecipePaste} from '@/lib/recipe-paste';
import {parseRecipeLink,recipeLinkPrompt,RECIPE_LINK_PREFIX} from '@/lib/recipe-link';
import {recipeFromDraft} from '@/lib/recipe-edit';
import {errorMessage,type Language} from '@/lib/i18n';
import type {ImageRecipeDraft} from '@/lib/recipe-image';
import type {Recipe} from '@/lib/recipes';
import {isIncluded} from '@/lib/ingredient-choices';

export default function RecipePasteImport({language,setLanguage,disabled,onAdd}:{language:Language;setLanguage:(language:Language)=>void;disabled:boolean;onAdd:(recipe:Recipe)=>Promise<unknown>}){
 const [open,setOpen]=useState(false),[text,setText]=useState(''),[draft,setDraft]=useState<ImageRecipeDraft|null>(null),[error,setError]=useState(''),[copied,setCopied]=useState(false),[showPrompt,setShowPrompt]=useState(false),[saving,setSaving]=useState(false),[origin,setOrigin]=useState(''),[pasteOpen,setPasteOpen]=useState(false),[fromLink,setFromLink]=useState(false),[cardOpen,setCardOpen]=useState(false);
 const lock=useRef(false),dialogOpen=useRef(false);
 const t=(en:string,zh:string)=>language==='en'?en:zh;
 const prompt=origin?recipeLinkPrompt(language,origin):'';
 function show(){dialogOpen.current=true;setOpen(true);}
 function close(){if(lock.current)return;dialogOpen.current=false;setOpen(false);setText('');setDraft(null);setError('');setCopied(false);setShowPrompt(false);setPasteOpen(false);setFromLink(false);setCardOpen(false);}
 useEffect(()=>{
  setOrigin(window.location.origin);
  const receive=()=>{
   const hash=window.location.hash;
   if(!hash.startsWith(RECIPE_LINK_PREFIX))return;
   // Clear recipe text from the address bar/history before showing or rejecting it.
   history.replaceState(history.state,'',window.location.pathname+window.location.search);
   if(lock.current||dialogOpen.current)return; // Never overwrite an in-progress review.
   dialogOpen.current=true;setOpen(true);setFromLink(true);setError('');
   try{setDraft(parseRecipeLink(hash));}catch{setError('invalid-link');setPasteOpen(true);}
  };
  receive();window.addEventListener('hashchange',receive);
  return()=>window.removeEventListener('hashchange',receive);
 },[]);
 async function copyPrompt(){try{await navigator.clipboard.writeText(prompt);setCopied(true);}catch{setShowPrompt(true);}}
 function preview(){setError('');try{setDraft(parseRecipePaste(text));setFromLink(false);}catch(cause){setError(cause instanceof Error&&cause.message==='long'?t('This result is too long. Ask for one recipe at a time.','结果过长，请一次识别一道食谱。'):t('Paste the complete recipe JSON, including its opening and closing braces. Nothing has been added.','请粘贴完整食谱结果，包含开头和结尾的大括号。尚未添加任何食材。'));}}
 async function save(){if(!draft||lock.current||disabled)return;setError('');let recipe:Recipe;
  try{recipe=recipeFromDraft(draft);}catch{setError(t('Check the dish name, servings and amounts before adding.','加入前请核对菜名、人数和用量。'));return;}
  lock.current=true;setSaving(true);try{await onAdd(recipe);lock.current=false;close();}catch(cause){setError(errorMessage(cause,language));}finally{lock.current=false;setSaving(false);}
 }
 return <><button type="button" className="primary-button paste-entry-button" disabled={disabled} onClick={show}><MessageCircle size={19}/>{t('Read a photo with ChatGPT','用 ChatGPT 识别食谱')}</button>
 <Dialog open={open} onOpenChange={value=>{if(!value)close();}}><DialogContent className="app-dialog image-dialog paste-dialog" closeLabel={t('Close','关闭')}><DialogTitle>{draft?t('Check your ingredients','核对食材'):t('Your photo → one shopping list','一张食谱，轻松加入清单')}</DialogTitle><DialogDescription>{draft?t('Review the recipe before adding it. Nothing is saved until you confirm.','核对食谱后再加入。确认前不会保存任何内容。'):t('Use your existing ChatGPT account. Upload the photo there, then return using its recipe link.','使用已有的 ChatGPT 账户。在 ChatGPT 上传图片，点回复中的食谱链接回到这里。')}</DialogDescription>
 <div className="language-switch" role="group" aria-label="Import language / 导入语言"><button type="button" disabled={saving} aria-pressed={language==='en'} onClick={()=>{setLanguage('en');setCopied(false);}}>English</button><button type="button" disabled={saving} aria-pressed={language==='zh'} onClick={()=>{setLanguage('zh');setCopied(false);}}>中文</button></div>
 {!draft?<>
  <ol className="chatgpt-steps"><li><strong>{t('Copy these instructions once','首次复制识别说明')}</strong><p>{t('Paste them in a ChatGPT conversation and attach your recipe photo.','在一个 ChatGPT 对话里粘贴说明，并上传食谱图片。')}</p><div className="paste-tools"><button type="button" className="secondary-button" disabled={!prompt} onClick={()=>void copyPrompt()}><Copy size={16}/>{copied?t('Copied','已复制'):t('Copy instructions','复制识别说明')}</button><a className="text-button" href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">{t('Open ChatGPT','打开 ChatGPT')}<ExternalLink size={14}/></a></div></li><li><strong>{t('Open the recipe link in its reply','点击回复中的食谱链接')}</strong><p>{t('Your ingredients will appear here, ready to review. For the next recipe, send another photo in the same conversation.','食材会在这里直接展开，核对后加入。下一道菜只需在同一对话继续发图。')}</p></li></ol>
  <p className="image-help">{t('ChatGPT usage limits apply. This website cannot read your chats or upload a photo to ChatGPT for you. A recipe link contains the recipe; share it only if you want to share that content.','受 ChatGPT 自身使用额度限制。本网站不能读取你的聊天，也不能替你上传图片到 ChatGPT。食谱链接包含食谱内容，分享链接也会分享该内容。')}</p>
  <details className="paste-guide" open={showPrompt} onToggle={event=>setShowPrompt(event.currentTarget.open)}><summary>{t('View or select instructions','查看或选中说明')}</summary><textarea aria-label={t('Recognition instructions','识别说明')} readOnly value={prompt} onFocus={event=>event.target.select()}/></details>
  <details className="paste-fallback" open={pasteOpen} onToggle={event=>setPasteOpen(event.currentTarget.open)}><summary><ClipboardPaste size={16}/>{t('Have a text result instead? Paste it here','回复没有链接？粘贴文字结果')}</summary><label className="paste-label">{t('Paste the complete reply here','在这里粘贴完整回复')}<textarea aria-label={t('Paste the complete reply here','在这里粘贴完整回复')} autoComplete="off" spellCheck={false} maxLength={50000} value={text} onChange={event=>{setText(event.target.value);setError('');}} placeholder={t('Paste recipe JSON…','粘贴食谱 JSON 结果…')}/></label><button className="primary-button" type="button" disabled={!text.trim()} onClick={preview}>{t('Preview ingredients','预览食材')}</button></details>
 </>:<><RecipeReview draft={draft} onChange={setDraft} language={language} disabled={saving}/><div className="review-actions"><button className="secondary-button" type="button" disabled={saving} onClick={()=>{if(fromLink)close();else{setDraft(null);setPasteOpen(true);setCardOpen(false);setError('');}}}>{fromLink?t('Cancel','取消'):t('Back','返回')}</button><button className="primary-button" type="button" disabled={disabled||saving||!draft.ingredients.some(isIncluded)} onClick={()=>void save()}>{saving?t('Adding…','正在加入…'):t('Add to shopping list','加入购物清单')}</button></div>{disabled&&!saving&&<p role="status">{t('Wait for the list to load, or close this review and remove a recipe if your list already has five. You can reopen the import link afterwards.','请等待清单载入；若已有五道菜，请关闭此窗口并先移除一道，再重新打开导入链接。')}</p>}<details className="scan-preview-details" onToggle={event=>setCardOpen(event.currentTarget.open)}><summary>{t('Save this recipe as an image','保存这道菜的图片')}</summary>{cardOpen&&<ScanResultCard draft={draft} language={language} onLanguageChange={setLanguage}/>}</details></>}
 {error&&<p className="form-error" role="alert">{error==='invalid-link'?t('This recipe link is incomplete or invalid. Ask ChatGPT for a new link or paste its recipe JSON below. Nothing has been added.','食谱链接不完整或无效。请让 ChatGPT 重新生成链接，或在下方粘贴完整食谱结果。尚未添加任何内容。'):error}</p>}
 </DialogContent></Dialog></>;
}
