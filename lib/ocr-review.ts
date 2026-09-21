import type {ImageRecipeDraft} from './recipe-image.ts';
import {ingredientIdentity,ingredientCategory} from './ingredient-identity.ts';

const nameKey=(name:string)=>name.toLowerCase().replace(/\s+/g,' ').replace(/\s+\)/g,')').trim();
const unitKey=(unit:string)=>unit.toLowerCase().replace(/\.$/,'').replace(/s$/,'');
function sameCandidate(a:string,b:string){
 if((a.includes('(')||b.includes('('))&&nameKey(a.split('(')[0])===nameKey(b.split('(')[0]))return true;
 const left=nameKey(a).replace(/[^a-z0-9\u3400-\u9fff]/g,''),right=nameKey(b).replace(/[^a-z0-9\u3400-\u9fff]/g,'');
 if(left===right)return true;
 // Near spellings are used ONLY to withhold uncertain quantities, never to sum
 // foods or substitute a spelling. Tiny names must match exactly.
 if(Math.min(left.length,right.length)<5)return false;
 const limit=Math.min(left.length,right.length)>=8?2:1;
 if(Math.abs(left.length-right.length)>limit)return false;
 let previous=Array.from({length:right.length+1},(_,i)=>i);
 for(let i=1;i<=left.length;i++){const current=[i];for(let j=1;j<=right.length;j++)current[j]=Math.min(current[j-1]+1,previous[j]+1,previous[j-1]+(left[i-1]===right[j-1]?0:1));previous=current;}
 return previous[right.length]<=limit;
}

// Independent reads of the same area may disagree even at high OCR confidence.
// Disagreement can only remove certainty; it must never guess a replacement.
export function reconcileOcrDraft(primary:ImageRecipeDraft,others:ImageRecipeDraft[]):ImageRecipeDraft{
 const additions=others.flatMap(draft=>draft.ingredients).filter((row,index,all)=>!primary.ingredients.some(other=>sameCandidate(row.name,other.name))&&all.findIndex(other=>sameCandidate(row.name,other.name))===index&&others.filter(draft=>draft.ingredients.some(other=>nameKey(other.name)===nameKey(row.name))).length>=2);
 return {...primary,ingredients:[...primary.ingredients,...additions].slice(0,80).map(source=>{
  const row={...source};
  const matches=others.flatMap(draft=>draft.ingredients.filter(other=>sameCandidate(other.name,row.name)));
  // Correct a near spelling only to a known food actually present in another
  // read; no replacement is generated from a dish name or outside the image.
  const known=(name:string)=>ingredientCategory(name)!=='其他'||ingredientIdentity(name)!==name.toLowerCase();
  const alternatives=[...new Set(matches.filter(other=>known(other.name)).map(other=>other.name))];
  if(!known(row.name)&&alternatives.length===1&&!/[(),]/.test(row.name+alternatives[0]))row.name=alternatives[0];
  if(!row.quantity)return row;
  const agreed=matches.some(other=>other.quantity===row.quantity&&unitKey(other.unit)===unitKey(row.unit));
  const conflict=matches.some(other=>other.note.startsWith('用量待核对，原文：')||(other.quantity!==''&&(other.quantity!==row.quantity||unitKey(other.unit)!==unitKey(row.unit))));
  if(!agreed||conflict)return {...row,quantity:'',note:('用量待核对，原文：'+`${row.name} ${row.quantity} ${row.unit}; `+matches.map(other=>`${other.quantity||'?'} ${other.unit}`).join('; ')).slice(0,200)};
  return {...row};
 })};
}

export function extractionScore(draft:ImageRecipeDraft):number{
 return draft.ingredients.reduce((score,row)=>score+1+(row.quantity?2:0)-(/[。；;]|\b(?:method|instructions?|ingredients?|minutes?|seasoning)\b/i.test(row.name)?4:0),0);
}
