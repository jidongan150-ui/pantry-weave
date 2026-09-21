import {parseRecipePaste, recipeRecognitionPrompt} from './recipe-paste.ts';
import type {Language} from './i18n.ts';

// One fixed vision model; never escalate to another model or retry a billed call.
export const VISION_MODEL = 'gemini-2.5-flash-lite';
export const VISION_OPTIONS = {model: VISION_MODEL, provider: 'gemini', temperature: 0, max_tokens: 5000, stream: false, normalize: true} as const;
export type VisionClient = {
  auth: {isSignedIn: () => boolean; signIn: () => Promise<unknown>; signOut:()=>void};
  ai: {chat: (prompt: string, image: File, options: typeof VISION_OPTIONS) => Promise<unknown>};
};

let clientPromise:Promise<VisionClient>|undefined;
export async function loadVisionClient(): Promise<VisionClient> {
  // Browser-only and lazy: never send an image or authenticate during loading.
  clientPromise??=import('@heyputer/puter.js').then(({puter})=>{
    // Reconfirm the AI account on a new page session, including after the app's
    // ChatGPT sign-out. A previous visitor's stored AI token must not be reused.
    puter.auth.signOut();
    return puter as unknown as VisionClient;
  }).catch(cause=>{clientPromise=undefined;throw cause;});
  return clientPromise;
}

export async function prepareVisionImage(blob: Blob): Promise<Blob> {
  const bitmap=await createImageBitmap(blob);
  try {
    const scale=Math.min(1,2400/Math.max(bitmap.width,bitmap.height),Math.sqrt(4000000/(bitmap.width*bitmap.height)));
    const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
    const context=canvas.getContext('2d');if(!context)throw Error('vision-response');
    context.fillStyle='white';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(bitmap,0,0,canvas.width,canvas.height);
    return await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(Error('vision-response')),'image/jpeg',0.92));
  } finally {bitmap.close();}
}

export function visionResponseText(response: unknown): string {
  if (!response || typeof response !== 'object') throw Error('vision-response');
  const value = response as {finish_reason?: string; message?: {content?: unknown}};
  if (value.finish_reason === 'length') throw Error('vision-response');
  const content = value.message?.content;
  const text = typeof content === 'string' ? content : Array.isArray(content)
    ? content.filter(part => part?.type === 'text' && typeof part.text === 'string').map(part => part.text).join('\n') : '';
  if (!text || text.length > 50000) throw Error('vision-response');
  return text;
}

export function visionErrorCode(cause: unknown): string {
  // Provider errors can contain request data. Show only our own fixed messages.
  const value = cause as {message?: unknown; error?: unknown; code?: unknown};
  const nested = value?.error as {code?: unknown; message?: unknown} | undefined;
  const code = [value?.message, typeof value?.error === 'string' ? value.error : '', value?.code, nested?.code, nested?.message].filter(item=>typeof item==='string').join(' ');
  if (/popup_blocked/.test(code)) return 'vision-popup';
  if (/auth_window_closed|denied|cancelled|canceled/.test(code)) return 'vision-cancelled';
  if (/quota|allowance|insufficient|limit|funds|balance/i.test(code)) return 'vision-quota';
  if (/vision-response|format|fields|long/.test(code)) return 'vision-response';
  if (/timeout/.test(code)) return 'vision-timeout';
  return 'vision-unavailable';
}

export async function recognizeWithVision(client: VisionClient, blob: Blob, language: Language, signal: AbortSignal) {
  signal.throwIfAborted();
  if (!client.auth.isSignedIn()) throw Error('vision-unavailable');
  if (!blob.size || blob.size > 10 * 1024 * 1024 || !['image/jpeg','image/png','image/webp'].includes(blob.type)) throw Error('vision-response');
  const image = new File([blob], 'recipe.' + (blob.type === 'image/jpeg' ? 'jpg' : blob.type.split('/')[1]), {type: blob.type});
  let timer: ReturnType<typeof setTimeout> | undefined;
  let onAbort: (()=>void) | undefined;
  try {
    const stopped = new Promise<never>((_,reject)=>{
      onAbort=()=>reject(new DOMException('Aborted','AbortError'));
      signal.addEventListener('abort',onAbort,{once:true});
      timer=setTimeout(()=>reject(Error('vision-timeout')),90000);
    });
    // The SDK cannot revoke a dispatched inference. Cancel ignores its eventual
    // result; it does not promise to refund the user's consumed allowance.
    const response = await Promise.race([client.ai.chat(recipeRecognitionPrompt(language),image,VISION_OPTIONS),stopped]);
    signal.throwIfAborted();
    const text = visionResponseText(response);
    try { return {text, draft: parseRecipePaste(text)}; }
    catch { throw Error('vision-response'); }
  } finally {
    clearTimeout(timer);
    if(onAbort)signal.removeEventListener('abort',onAbort);
  }
}
