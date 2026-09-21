import { extractImageRecipe, validateRecipeImage } from './recipe-image';
import {recipeLayoutText,ingredientRegion} from './ocr-layout';
import {extractionScore,reconcileOcrDraft} from './ocr-review';

async function focusIngredients(blob:Blob,region:NonNullable<ReturnType<typeof ingredientRegion>>,magnification:number):Promise<Blob>{
 const bitmap=await createImageBitmap(blob);
 try{
  const left=Math.max(0,Math.floor(region.left)),top=Math.max(0,Math.floor(region.top));
  const width=Math.min(bitmap.width-left,Math.ceil(region.right-left)),height=Math.min(bitmap.height-top,Math.ceil(region.bottom-top));
  if(width<20||height<20)throw new Error('region');
  const scale=Math.min(magnification,5000/Math.max(width,height),Math.sqrt(8000000/(width*height)));
  const canvas=document.createElement('canvas');canvas.width=Math.round(width*scale);canvas.height=Math.round(height*scale);
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('decode');
  ctx.fillStyle='white';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,left,top,width,height,0,0,canvas.width,canvas.height);
  return await new Promise<Blob>((resolve,reject)=>canvas.toBlob(result=>result?resolve(result):reject(new Error('decode')),'image/png'));
 }finally{bitmap.close();}
}

export async function prepareRecipeImage(file: File): Promise<Blob> {
  validateRecipeImage(file);
  let bitmap: ImageBitmap;
  try { bitmap = await createImageBitmap(file); } catch { throw new Error('decode'); }
  try {
    if (!bitmap.width || !bitmap.height || bitmap.width * bitmap.height > 40000000) throw new Error('dimensions');
    // Small poster captions need enlargement, not just a cap for large photos.
    const scale = Math.min(3, 3600 / Math.max(bitmap.width, bitmap.height), Math.sqrt(8000000 / (bitmap.width * bitmap.height)), bitmap.width < 1000 ? 2000 / bitmap.width : 1);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('decode');
    context.imageSmoothingEnabled = true; context.imageSmoothingQuality = 'high';
    context.fillStyle = 'white'; context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('decode')), 'image/png'));
  } finally { bitmap.close(); }
}

export async function recognizeRecipeImage(blob: Blob, onProgress: (progress: number) => void, signal: AbortSignal) {
  const { createWorker, PSM } = await import('tesseract.js');
  type Worker = Awaited<ReturnType<typeof createWorker>>;
  let worker: Worker | undefined;
  let stopped = false;
  let rejectJob: (reason: Error) => void = () => {};
  const stoppedPromise = new Promise<never>((_, reject) => { rejectJob = reject; });
  const cancel = () => { stopped = true; void worker?.terminate(); rejectJob(new Error('cancelled')); };
  signal.addEventListener('abort', cancel, { once: true });
  const timeout = setTimeout(() => { stopped = true; void worker?.terminate(); rejectJob(new Error('timeout')); }, 120000);
  const base = new URL('/ocr/', location.origin).href;
  const job = (async () => {
    if (signal.aborted) throw new Error('cancelled');
    worker = await createWorker('chi_sim', 1, {
      workerPath: base + 'worker.min.js', corePath: base, langPath: base.replace(/\/$/, ''), workerBlobURL: false,
      logger: message => { if (!stopped && message.status === 'recognizing text') onProgress(message.progress); },
      errorHandler: () => rejectJob(new Error('recognition')),
    });
    if (stopped || signal.aborted) { await worker.terminate(); throw new Error('cancelled'); }
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT });
    const read = async (source=blob) => {
      if(stopped||signal.aborted)throw new Error('cancelled');
      const { data } = await worker!.recognize(source, {}, { text: true, blocks: true });
      const lines = (data.blocks ?? []).flatMap(block => block.paragraphs.flatMap(paragraph => paragraph.lines));
      return { text: data.text, readableText: recipeLayoutText(lines),lines };
    };
    let first = await read();
    // A combined model can reinterpret small Chinese captions as Latin gibberish.
    // Use the English model separately when the readable result is mainly Latin.
    if ((/ingredient\s*s?\b/i.test(first.text)||(first.readableText.match(/[\u3400-\u9fff]/g)?.length ?? 0) < 8) && !signal.aborted) {
      await worker.reinitialize('eng', 1);
      await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT });
      const english = await read();
      if (ingredientRegion(english.lines)?.english||extractionScore(extractImageRecipe(english.readableText))>extractionScore(extractImageRecipe(first.readableText))) first=english;
      else await worker.reinitialize('chi_sim',1);
    }
    const region=ingredientRegion(first.lines);
    if(region&&!signal.aborted){
      await worker.setParameters({tessedit_pageseg_mode:PSM.SPARSE_TEXT});
      const focused=[];
      for(const scale of [2,3]){
        const result=await read(await focusIngredients(blob,region,scale));
        // The crop already excludes surrounding columns and cooking directions.
        const heading={text:'Ingredients',confidence:100,bbox:{x0:0,y0:-20,x1:120,y1:-1}};
        focused.push(extractImageRecipe(`${region.header}\n${recipeLayoutText([heading,...result.lines])}`));
      }
      const original=extractImageRecipe(first.readableText);
      const candidates=[original,...focused];
      const primary=[...candidates].sort((a,b)=>extractionScore(b)-extractionScore(a))[0];
      const draft=reconcileOcrDraft(primary,candidates.filter(candidate=>candidate!==primary));
      return {text:first.text,readableText:first.readableText,draft};
    }
    const score=(value:typeof first)=>extractionScore(extractImageRecipe(value.readableText));
    const draft=extractImageRecipe(first.readableText);
    if(!signal.aborted&&(draft.ingredients.length<2||draft.ingredients.filter(row=>!row.quantity).length>draft.ingredients.length*.5&&!draft.fromSteps)){
      await worker.setParameters({tessedit_pageseg_mode:PSM.AUTO});
      const alternative=await read();if(score(alternative)>score(first))first=alternative;
    }
    return {...first,draft:extractImageRecipe(first.readableText)};
  })();
  try { return await Promise.race([job, stoppedPromise]); }
  finally { stopped = true; clearTimeout(timeout); signal.removeEventListener('abort', cancel); await worker?.terminate(); }
}
