"use client";
import {useRef,useState} from 'react';
import type {Language} from '@/lib/i18n';
type Selection={left:number;top:number;width:number;height:number};
const full:Selection={left:0,top:0,width:100,height:100};
export default function RecipeImageCrop({src,language,disabled,onCrop}:{src:string;language:Language;disabled:boolean;onCrop:(file:File)=>Promise<void>}){
 const t=(en:string,zh:string)=>language==='en'?en:zh;
 const [open,setOpen]=useState(false);const [area,setArea]=useState(full);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 const img=useRef<HTMLImageElement>(null);const start=useRef<{x:number;y:number}|null>(null);const lock=useRef(false);
 const point=(event:React.PointerEvent<HTMLDivElement>)=>{const bounds=event.currentTarget.getBoundingClientRect();return {x:Math.max(0,Math.min(100,(event.clientX-bounds.left)/bounds.width*100)),y:Math.max(0,Math.min(100,(event.clientY-bounds.top)/bounds.height*100))};};
 const update=(key:keyof Selection,value:number)=>setArea(current=>{const next={...current,[key]:Number.isFinite(value)?Math.max(0,Math.min(100,value)):0};next.width=Math.min(next.width,100-next.left);next.height=Math.min(next.height,100-next.top);return next;});
 async function crop(){
  if(lock.current||disabled||area.width<1||area.height<1||!img.current?.naturalWidth)return;
  lock.current=true;setBusy(true);setError('');
  try{
   const source=img.current;const x=Math.floor(source.naturalWidth*area.left/100),y=Math.floor(source.naturalHeight*area.top/100);
   const width=Math.max(1,Math.floor(source.naturalWidth*area.width/100)),height=Math.max(1,Math.floor(source.naturalHeight*area.height/100));
   const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');if(!ctx)throw Error();
   ctx.drawImage(source,x,y,width,height,0,0,width,height);
   const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(Error()),'image/png'));
   await onCrop(new File([blob],'recipe-region.png',{type:'image/png'}));
  }catch{setError(t('Could not crop this image. Try choosing the image again.','无法裁剪，请重新选择图片。'));}finally{lock.current=false;setBusy(false);}
 }
 return <div className="recipe-crop"><button type="button" className="secondary-button" disabled={disabled||busy} aria-expanded={open} onClick={()=>setOpen(value=>!value)}>{t('Select ingredient area & retry','框选食材区域，重新识别')}</button>{open&&<>
  <p className="image-help">{t('Drag around the ingredient list, including amounts. Keep one column at a time. Re-reading replaces the current draft.','框住食材和用量，尽量一次只选一栏；重新识别会替换当前未保存的草稿。')}</p>
  <div className="crop-surface" onPointerDown={event=>{if(disabled||busy)return;event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);start.current=point(event);setArea({left:start.current.x,top:start.current.y,width:0,height:0});}} onPointerMove={event=>{if(!start.current)return;const end=point(event);setArea({left:Math.min(start.current.x,end.x),top:Math.min(start.current.y,end.y),width:Math.abs(start.current.x-end.x),height:Math.abs(start.current.y-end.y)});}} onPointerUp={()=>{start.current=null;}} onPointerCancel={()=>{start.current=null;}}>
   <img ref={img} src={src} alt={t('Select the ingredient text to recognize','选择要识别的食材文字区域')} draggable={false}/><div className="crop-selection" style={{left:`${area.left}%`,top:`${area.top}%`,width:`${area.width}%`,height:`${area.height}%`}}/>
  </div>
  <details><summary>{t('Adjust selection with numbers','用数值调整选区')}</summary><div className="crop-values">{(['left','top','width','height'] as const).map((key,index)=><label key={key}>{t(['Left (%)','Top (%)','Width (%)','Height (%)'][index],['左侧 (%)','顶部 (%)','宽度 (%)','高度 (%)'][index])}<input type="number" min="0" max="100" step="1" value={Math.round(area[key])} disabled={busy||disabled} onChange={event=>update(key,Number(event.target.value))}/></label>)}</div></details>
  {error&&<p className="form-error" role="alert">{error}</p>}
  <button type="button" className="primary-button" disabled={busy||disabled||area.width<1||area.height<1} onClick={()=>void crop()}>{busy?t('Reading selection…','正在识别选区…'):t('Read selected area','识别选中区域')}</button>
 </>}</div>;
}
