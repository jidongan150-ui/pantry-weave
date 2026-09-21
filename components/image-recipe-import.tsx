"use client";
import { useEffect, useRef, useState, type DragEvent as ReactDragEvent } from 'react';
import { ImagePlus, LoaderCircle, Camera } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { imageQuantity, type ImageRecipeDraft } from '@/lib/recipe-image';
import { prepareRecipeImage, recognizeRecipeImage } from '@/lib/image-ocr';
import { recipeSchema, type Recipe } from '@/lib/recipes';
import { errorMessage, type Language } from '@/lib/i18n';
import ScanResultCard from '@/components/scan-result-card';
import RecipeReview from '@/components/recipe-review';
import RecipeImageCrop from '@/components/recipe-image-crop';
import {isIncluded} from '@/lib/ingredient-choices';
import {loadVisionClient, prepareVisionImage, recognizeWithVision, visionErrorCode, type VisionClient} from '@/lib/recipe-vision';

export default function ImageRecipeImport({ language, setLanguage, disabled, onAdd }: { language: Language; setLanguage:(language:Language)=>void; disabled: boolean; onAdd: (recipe: Recipe) => Promise<unknown> }) {
  const t = (en: string, zh: string) => language === 'en' ? en : zh;
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'reading' | 'review' | 'saving'>('idle');
  const [preview, setPreview] = useState('');
  const [originalPreview,setOriginalPreview]=useState('');
  const [text, setText] = useState('');
  const [draft, setDraft] = useState<ImageRecipeDraft>({ name: '', servings: '', ingredients: [], omitted: [] });
  const [progress, setProgress] = useState(0);
  const [cardOpen,setCardOpen]=useState(false);
  const [error, setError] = useState('');
  const [saveError, setSaveError] = useState<unknown>(null);
  const job = useRef<AbortController | null>(null);
  const imageBlob = useRef<Blob | null>(null);
  const [vision, setVision] = useState<VisionClient | null>(null);
  const [visionLoadFailed,setVisionLoadFailed]=useState(false);
  const [puterOpen,setPuterOpen]=useState(false);
  const [readingCloud,setReadingCloud]=useState(false);
  const saving = useRef(false);
  const uploadInput=useRef<HTMLInputElement>(null);const cameraInput=useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState<'entry' | 'dialog' | null>(null);
  const dragDepth = useRef(0);
  useEffect(()=>{
    if(!open || !puterOpen || vision)return;
    let active=true;
    loadVisionClient().then(client=>{if(active)setVision(client);}).catch(()=>{if(active)setVisionLoadFailed(true);});
    return ()=>{active=false;};
  },[open,puterOpen,vision]);
  useEffect(() => {
    // A missed drop must not navigate away and lose the current shopping list.
    const preventFileNavigation = (event: DragEvent) => {
      if (!event.dataTransfer?.types.includes('Files')) return;
      if (!event.defaultPrevented && event.type === 'dragover') event.dataTransfer.dropEffect = 'none';
      event.preventDefault();
      if (event.type === 'drop') { dragDepth.current = 0; setDragging(null); }
    };
    const clearDrag = () => { dragDepth.current = 0; setDragging(null); };
    document.addEventListener('dragover', preventFileNavigation);
    document.addEventListener('drop', preventFileNavigation);
    document.addEventListener('dragend', clearDrag);
    window.addEventListener('blur', clearDrag);
    return () => {
      document.removeEventListener('dragover', preventFileNavigation);
      document.removeEventListener('drop', preventFileNavigation);
      document.removeEventListener('dragend', clearDrag);
      window.removeEventListener('blur', clearDrag);
    };
  }, []);
  function dropHandlers(zone: 'entry' | 'dialog') {
    return {
      onDragEnter(event: ReactDragEvent<HTMLElement>) {
        if (!event.dataTransfer.types.includes('Files') || disabled || saving.current) return;
        event.preventDefault(); dragDepth.current += 1; setDragging(zone);
      },
      onDragOver(event: ReactDragEvent<HTMLElement>) {
        event.preventDefault(); event.dataTransfer.dropEffect = disabled || saving.current ? 'none' : 'copy';
      },
      onDragLeave(event: ReactDragEvent<HTMLElement>) {
        if (!event.dataTransfer.types.includes('Files')) return;
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (!dragDepth.current) setDragging(null);
      },
      onDrop(event: ReactDragEvent<HTMLElement>) {
        event.preventDefault(); event.stopPropagation(); dragDepth.current = 0; setDragging(null);
        if (disabled || saving.current) return;
        setOpen(true); setSaveError(null);
        const files = Array.from(event.dataTransfer.files);
        if (files.length !== 1) { job.current?.abort();job.current=null;imageBlob.current=null;setPhase('idle');setPreview('');setOriginalPreview('');setText('');setError(files.length > 1 ? 'multiple' : 'format'); return; }
        void selectImage(files[0]);
      },
    };
  }
  useEffect(() => () => { job.current?.abort(); }, []);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  useEffect(()=>()=>{if(originalPreview)URL.revokeObjectURL(originalPreview);},[originalPreview]);
  function close(value: boolean) {
    if (saving.current) return;
    dragDepth.current = 0; setDragging(null);
    if (!value) { job.current?.abort(); job.current = null; imageBlob.current=null;setPhase('idle'); setPreview(''); setOriginalPreview(''); setText(''); setError(''); setSaveError(null); }
    setOpen(value);
  }
  async function selectImage(file: File,fromCrop=false) {
    if(!fromCrop)setOriginalPreview('');
    job.current?.abort();
    const controller = new AbortController(); job.current = controller;
    imageBlob.current=null;setReadingCloud(false);
    setError(''); setSaveError(null); setText(''); setPreview(''); setProgress(0); setCardOpen(false); setPhase('reading');
    try {
      const blob = await prepareRecipeImage(file);
      if (controller.signal.aborted) return;
      setPreview(URL.createObjectURL(blob));
      if(!fromCrop)setOriginalPreview(URL.createObjectURL(blob));
      imageBlob.current=blob;setPhase('idle');
    } catch(cause) {
      if(controller.signal.aborted)return;
      setError(cause instanceof Error ? cause.message : 'recognition');setPhase('idle');
    }
  }
  async function readImage(cloud:boolean) {
    const blob=imageBlob.current;
    if(!blob||phase==='reading'||phase==='saving')return;
    job.current?.abort();
    const controller=new AbortController();job.current=controller;
    setError('');setSaveError(null);setProgress(0);setReadingCloud(cloud);setPhase('reading');
    try {
      if(cloud) {
        if(!vision)throw Error('vision-unavailable');
        // Start authentication directly from this click, before any awaited work.
        if(!vision.auth.isSignedIn())await vision.auth.signIn();
        if(controller.signal.aborted)return;
        const upload=await prepareVisionImage(blob);
        const result=await recognizeWithVision(vision,upload,language,controller.signal);
        if(controller.signal.aborted)return;
        setText(result.text);setDraft(result.draft);setPhase('review');return;
      }
      const result = await recognizeRecipeImage(blob, setProgress, controller.signal);
      if (controller.signal.aborted) return;
      if (!result.text.trim()) throw new Error('empty');
      if (result.text.length > 20000) throw new Error('long');
      setText(result.text);
      const extracted = result.draft;
      if (!result.readableText.trim() || !extracted.ingredients.length) throw new Error('uncertain');
      setText(result.text); setDraft(extracted); setPhase('review');
    } catch (cause) {
      if (controller.signal.aborted) return;
      setError(cloud?visionErrorCode(cause):cause instanceof Error ? cause.message : 'recognition'); setPhase('idle');
    }
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (saving.current || disabled) return;
    setError(''); setSaveError(null);
    if (draft.ingredients.some(row => row.quantity.trim() && imageQuantity(row.quantity) === null)) { setError('quantity'); return; }
    const result = recipeSchema.safeParse({ id: crypto.randomUUID(), name: draft.name.trim()||t('My recipe','我的食谱'), servings: draft.servings.trim()?Number(draft.servings):null, source: null, sample: false,
      ingredients: draft.ingredients.map(row => ({ ...row, quantity: row.quantity.trim() ? imageQuantity(row.quantity) : null, category: '其他' })),
    });
    if (!result.success) { setError('fields'); return; }
    saving.current = true; setPhase('saving');
    try { await onAdd(result.data); saving.current = false; close(false); }
    catch (cause) { setSaveError(cause); setPhase('review'); }
    finally { saving.current = false; }
  }
  const errors: Record<string, string> = {
    'vision-popup':t('Allow the Puter sign-in popup, then try again.','请允许弹出的 Puter 登录窗口，然后重试。'),
    'vision-cancelled':t('The Puter request was cancelled. Nothing was added.','已取消 Puter 请求，未添加任何内容。'),
    'vision-quota':t('Your Puter allowance is unavailable or exhausted. Use local reading, or check your Puter account.','你的 Puter 额度不足或暂不可用。可以改用本地识别，或查看 Puter 账户。'),
    'vision-response':t('AI could not return a complete recipe. Nothing was added. Try a clearer image or local reading.','AI 未能返回完整食谱，未添加任何内容。可换清晰图片或用本地识别。'),
    'vision-timeout':t('AI took too long. No automatic retry was made. The sent request may still use your allowance.','AI 识别超时，未自动重试。已发送的请求仍可能消耗额度。'),
    'vision-unavailable':t('AI is currently unavailable. Try local reading, or sign in to Puter and try again.','AI 通道暂不可用。可用本地识别，或登录 Puter 后重试。'),
    multiple: t('Drop one recipe image at a time.', '一次请只拖入一张食谱图片。'),
    uncertain: t('The text could not be read reliably enough to identify ingredients. Try a clearer image or crop to the ingredient text.', '无法可靠识别出食材，已停止自动填写。请换清晰原图，或裁剪到食材文字区域后重试。'),
    format: t('Choose a JPG, PNG or WebP image.', '请选择 JPG、PNG 或 WebP 图片。'),
    size: t('Choose a non-empty image smaller than 10 MB.', '请选择不超过 10 MB 的有效图片。'),
    dimensions: t('Crop this image to the recipe (up to 40 megapixels).', '图片尺寸过大，请裁剪至食谱区域（最多 4000 万像素）。'),
    decode: t('This image could not be opened. Try a JPG or PNG screenshot.', '无法打开这张图片，请尝试 JPG 或 PNG 截图。'),
    empty: t('No text found. Use a clear ingredient-list screenshot, not just a dish photo.', '未找到文字，请使用清晰的食材表截图，而不是只有菜品的照片。'),
    long: t('Too much text. Crop to one recipe and try again.', '文字过多，请裁剪到一道食谱后重试。'),
    timeout: t('Reading took too long. Try a smaller, clearer image.', '识别超时，请换一张更小、更清晰的图片。'),
    quantity: t('Enter positive quantities, or leave them blank if unknown.', '请输入正数用量，未知数量请留空。'),
    fields: t('Check the recipe name, servings (1–100) and ingredient rows.', '请核对菜名、原食谱份数（1–100）和食材。'),
  };
  const currentError = error ? errors[error] || t('Could not read the image. Check your connection and try again.', '图片识别失败，请检查网络后重试。') : saveError ? errorMessage(saveError, language) : '';
  const beginFile=(event:React.ChangeEvent<HTMLInputElement>)=>{const file=event.target.files?.[0];event.target.value='';if(file){setOpen(true);void selectImage(file);}};
  return <>
    <input ref={uploadInput} className="entry-image-input" aria-label={t('Upload recipe photo','上传食谱图片')} type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={disabled} onChange={beginFile}/>
    <input ref={cameraInput} className="camera-image-input" aria-label={t('Take a recipe photo','拍摄食谱照片')} type="file" accept="image/*" capture="environment" hidden disabled={disabled} onChange={beginFile}/>

    <button type="button" className={`secondary-button image-import-button image-drop-target${dragging === 'entry' ? ' is-dragging' : ''}`} {...dropHandlers('entry')} disabled={disabled} onClick={()=>uploadInput.current?.click()}><ImagePlus size={18} /><span>{dragging === 'entry' ? t('Drop image to read recipe', '松开图片，开始识别食谱') : t('Upload a recipe image','上传食谱图片')}</span></button>
    <button type="button" className="text-button take-photo-button" disabled={disabled} onClick={()=>cameraInput.current?.click()}><Camera size={17}/>{t('Take a photo','拍照')}</button>
    <Dialog open={open} onOpenChange={close}><DialogContent className={`app-dialog image-dialog ${phase==='review'||phase==='saving'?'simple-review-dialog':''}`} closeLabel={t('Close', '关闭')}><DialogTitle>{phase==='review'||phase==='saving'?t('Your ingredients','这道菜要买什么'):t('Add a recipe photo','添加食谱图片')}</DialogTitle><DialogDescription>{phase==='review'||phase==='saving'?t('Add to your shopping list, or tap an item to change it.','加入购物清单，或点一下食材修改。'):t('Take a photo or choose a recipe image.','拍张照，或选择一张食谱图片。')}</DialogDescription>
      {phase!=='review'&&phase!=='saving'&&!preview&&<>
      <label className={`image-file-label image-drop-target${dragging === 'dialog' ? ' is-dragging' : ''}`} {...dropHandlers('dialog')}>{dragging === 'dialog' ? t('Drop image to read recipe', '松开图片，开始识别食谱') : preview ? t('Drop another image here, or click to choose', '拖入另一张图片，或点击选择') : t('Drop image here, or click to choose', '拖入图片，或点击选择')}<input aria-label={t('Choose recipe image', '选择食谱图片')} type="file" accept="image/jpeg,image/png,image/webp"  onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void selectImage(file); }} /></label>
      <p className="image-help">{t('JPG, PNG, WebP · up to 10 MB · Choose how to read your image below.','JPG、PNG、WebP · 最大 10 MB · 下方选择识别方式。')}</p>
      <label className="camera-entry">{t('Take a photo','拍照')}<input aria-label={t('Take a recipe photo','拍摄食谱照片')} type="file" accept="image/*" capture="environment"  onChange={event=>{const file=event.target.files?.[0];event.target.value='';if(file)void selectImage(file);}}/></label>
      </>}
      {phase==='idle'&&preview&&<div className="vision-choice">
        <img className="vision-thumbnail" src={preview} alt={t('Selected recipe','已选择的食谱')}/>
        <button type="button" className="primary-button" onClick={()=>void readImage(false)}>{t('Read on this device · no account','本地识别 · 无需账户')}</button>
        <p className="image-help">{t('Local reading keeps the image on your device. Best for clear ingredient lists; illustrated recipes may be inaccurate.','本地识别不上传图片，适合清晰食材表；插画食谱可能识别不准。')}</p>
        <details className="puter-option" onToggle={event=>setPuterOpen(event.currentTarget.open)}><summary>{t('Already have a Puter account? · experimental','已有 Puter 账户？· 实验选项')}</summary><p className="image-help">{t('Account creation and live image reading have not passed our acceptance test. This option sends the image to Puter and Google Gemini and uses your personal Puter allowance. Paid upgrades may be offered.','注册和真实图片识别尚未通过我们的验收。此选项将图片发送至 Puter 和 Google Gemini，使用个人 Puter 额度，可能提示付费升级。')}</p><button type="button" className="secondary-button" disabled={!vision} onClick={()=>void readImage(true)}>{vision?t('Read with my Puter account','使用我的 Puter 账户识别'):visionLoadFailed?t('AI connection unavailable','AI 通道暂不可用'):t('Loading AI connection…','正在加载 AI 通道…')}</button></details>
      </div>}
      {phase === 'reading' && <div className="image-reading" role="status"><LoaderCircle className="spin" size={18}/><span>{readingCloud?t('Sign in to Puter if prompted. AI is reading your recipe…','如弹出窗口，请登录 Puter。AI 正在读取食谱…'):progress>0?t(`Reading text… ${Math.round(progress*100)}%`,`正在识别文字… ${Math.round(progress*100)}%`):t('Preparing image or loading local recognition…','正在准备图片或加载本地识别…')}</span><button type="button" className="text-button" onClick={()=>{job.current?.abort();setPhase('idle');}}>{t('Cancel','取消')}</button>{readingCloud&&<small>{t('Stopping ignores the result; a sent request may still use your allowance.','停止后不接收结果；已发送的请求仍可能消耗额度。')}</small>}</div>}
      {(phase==='review'||phase==='saving')&&<form className="manual-form image-review" onSubmit={event=>void save(event)}>
       <div className="simple-review-toolbar"><span>{t(`${draft.ingredients.filter(isIncluded).length} ingredients`,`${draft.ingredients.filter(isIncluded).length} 项食材`)}</span><div className="language-switch" role="group" aria-label="Review language / 核对语言"><button type="button" aria-pressed={language==='zh'} disabled={phase==='saving'} onClick={()=>setLanguage('zh')}>中文</button><button type="button" aria-pressed={language==='en'} disabled={phase==='saving'} onClick={()=>setLanguage('en')}>English</button></div></div>
       <RecipeReview draft={draft} onChange={setDraft} language={language} disabled={phase==='saving'}/>
       <div className="review-submit"><button type="submit" className="primary-button" disabled={phase==='saving'||disabled||!draft.ingredients.length}>{phase==='saving'?t('Adding…','正在添加…'):t('Add to shopping list','加入购物清单')}</button></div>
       <details className="scan-preview-details" onToggle={event=>setCardOpen(event.currentTarget.open)}><summary>{t('Save this recipe as an image','保存这道菜的图片')}</summary>{cardOpen&&<ScanResultCard draft={draft} language={language} onLanguageChange={setLanguage}/>}</details>
      </form>}
      {phase==='idle'&&preview&&<button type="button" className="secondary-button" onClick={()=>{setError('');setDraft({name:'',servings:'',ingredients:[{name:'',quantity:'',unit:'',note:''}],omitted:[]});setPhase('review');}}>{t('Add ingredients yourself','自行添加食材')}</button>}
      {preview&&<details className="advanced-recognition"><summary>{t('Image & recognition tools','原图与识别工具')}</summary><img className="recipe-image-preview" src={originalPreview||preview} alt={t('Original recipe image','食谱原图')}/><a className="text-button" href={originalPreview||preview} target="_blank" rel="noopener noreferrer">{t('Open full-size image','打开完整大图')}</a><details className="image-raw-text"><summary>{t('Recognized text','识别原文')}</summary><pre>{text}</pre></details><label className="camera-entry">{t('Choose another image','换一张图片')}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={phase==='saving'} onChange={event=>{const file=event.target.files?.[0];event.target.value='';if(file)void selectImage(file);}}/></label><RecipeImageCrop key={preview} src={originalPreview||preview} language={language} disabled={phase==='saving'||phase==='reading'} onCrop={file=>selectImage(file,true)}/></details>}
      {currentError && <p className="form-error" role="alert">{currentError}</p>}
    </DialogContent></Dialog>
  </>;
}
