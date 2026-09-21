import {filterRecognizedLines} from './recipe-image.ts';
import {ingredientIdentity,ingredientCategory} from './ingredient-identity.ts';
type Box={x0:number;y0:number;x1:number;y1:number};
export type OcrLine={text:string;confidence:number;bbox:Box;words?:{text:string;confidence:number;bbox:Box}[]};
const ingredientHeading=/^(?:ingredients?|what you.?ll need|食材(?:准备)?|用料|材料|配料|主料|辅料)\s*[:：]?$/i;
const otherHeading=/^(?:method|preparation|directions?|instructions?|steps?|nutrition|equipment|tools|做法|步骤|制作方法|烹[饪飪調调]方法|[训高]调方法|营养|小贴士)(?:\s|[:：]|$)/i;
const clean=(text:string)=>text.trim().replace(/^[•●·*。]+\s*/,'').replace(/([\u3400-\u9fff])\s+(?=[\u3400-\u9fff])/g,'$1');
const isHeading=(text:string)=>ingredientHeading.test(clean(text))||/^ingredients?$/i.test(text.replace(/\s/g,''));
const amountOnly=/^[\d\s./⁄½¼¾]+(?:\s*(?:tsp|tbsp|cups?|grams?|g|ml|cloves?|pieces?|克|杯|个|汤匙|茶匙))?\.?$/i;
const completeRow=(text:string)=>!amountOnly.test(text.trim())&&(/[\d½¼¾]/.test(text)||/small amount|to taste|as needed|少量|适量/i.test(text));
function splitSubcolumns(line:OcrLine):OcrLine[]{
 const words=line.words;if(!words||words.length<4)return [line];
 for(let i=1;i<words.length;i++){
  const gap=words[i].bbox.x0-words[i-1].bbox.x1;
  if(gap<(line.bbox.y1-line.bbox.y0)*1.5)continue;
  const left=words.slice(0,i),right=words.slice(i);
  if(!completeRow(left.map(word=>word.text).join(' '))||!completeRow(right.map(word=>word.text).join(' ')))continue;
  return [left,right].flatMap(part=>splitSubcolumns({...line,text:part.map(word=>word.text).join(' '),words:part,confidence:part.reduce((sum,word)=>sum+word.confidence,0)/part.length,bbox:{...line.bbox,x0:part[0].bbox.x0,x1:part.at(-1)!.bbox.x1}}));
 }
 return [line];
}
// A fuzzy number must not hide a confidently read food (for example salt).
// Recover only known food words, never a lone preparation word such as chopped.
export function recoverIngredientLines(lines:OcrLine[]):OcrLine[]{
 return lines.map(line=>{
  if(line.confidence>=65||!line.words?.length)return line;
  const words=line.words.filter(word=>word.confidence>=85);
  const name=words.map(word=>word.text).join(' ').replace(/^[•●·*。]+\s*/,'').trim();
  const known=ingredientCategory(name)!=='其他'||ingredientIdentity(name)!==name.toLowerCase()||words.some(word=>{const value=word.text.replace(/[().,]/g,'');return ingredientCategory(value)!=='其他'||ingredientIdentity(value)!==value.toLowerCase();});
  return known&&name?{...line,text:name,words:undefined,confidence:85}:line;
 });
}

export function ingredientRegion(input:OcrLine[]){
 const lines=input.filter(line=>line.confidence>=45&&line.text.trim()).map(line=>({...line,text:clean(line.text)}));
 const headings=lines.filter(line=>isHeading(line.text)&&line.confidence>=65);
 // A bilingual page contains the same recipe twice. Read one complete column.
 const heading=headings.find(line=>/^ingredients?$/i.test(line.text.replace(/\s/g,'')))??headings[0];
 if(!heading)return null;
 const pad=Math.max(8,(heading.bbox.y1-heading.bbox.y0)*.4);
 const nextColumn=lines.filter(line=>(otherHeading.test(line.text)||isHeading(line.text))&&line!==heading&&line.bbox.x0>heading.bbox.x1+pad).sort((a,b)=>a.bbox.x0-b.bbox.x0)[0];
 const right=nextColumn?nextColumn.bbox.x0-pad:Math.max(...lines.map(line=>line.bbox.x1));
 const left=Math.max(0,heading.bbox.x0-pad);
 const end=lines.filter(line=>otherHeading.test(line.text)&&line.bbox.y0>heading.bbox.y1&&line.bbox.x0>=left&&line.bbox.x0<right).sort((a,b)=>a.bbox.y0-b.bbox.y0)[0]?.bbox.y0;
 const english=/^ingredients?$/i.test(heading.text.replace(/\s/g,''));
 const above=lines.filter(line=>line.bbox.y1<heading.bbox.y0&&line.text.length<=120).sort((a,b)=>a.bbox.y0-b.bbox.y0);
 const title=above.find(line=>!/[\d]/.test(line.text)&&(!english||/^[a-z][a-z &'’(),-]{3,}$/i.test(line.text))&&line.bbox.y1-line.bbox.y0>=(heading.bbox.y1-heading.bbox.y0)*.8);
 const servings=above.filter(line=>/\bserv(?:es|ings?)\b|\d+\s*人/.test(line.text.toLowerCase()));
 const titleLines=title?[title]:[];
 if(title&&english)for(const line of above.filter(line=>line.bbox.y0>title.bbox.y0)){
  const previous=titleLines.at(-1)!;
  if(line.bbox.y0-previous.bbox.y1<20&&Math.abs(line.bbox.x0-title.bbox.x0)<40&&line.bbox.y1-line.bbox.y0>=(title.bbox.y1-title.bbox.y0)*.8&&/^[a-z][a-z &'’(),-]{3,}$/i.test(line.text))titleLines.push(line);else break;
 }
 return {left,right,top:heading.bbox.y1,bottom:end??Math.max(...lines.map(line=>line.bbox.y1))+1,header:[...(titleLines.length?[titleLines.map(line=>line.text).join(' ')]:[]),...servings.map(line=>line.text)].join('\n'),english};
}

// Recover layout before filtering: a standalone amount may be beside its name,
// while a method heading in another column must not end the ingredient list.
export function recipeLayoutText(input:OcrLine[]):string{
 const lines=input.filter(line=>line.text.trim()).map(line=>({...line,text:clean(line.text)}));
 const region=ingredientRegion(lines);
 if(!region)return filterRecognizedLines(lines);
 const {left,right,top,bottom}=region;
 const selected=lines.flatMap(line=>{
  if(line.bbox.y0<=top||line.bbox.y0>=bottom)return [];
  if(line.words?.length){const words=line.words.filter(word=>word.bbox.x0>=left&&word.bbox.x1<=right+2);if(!words.length)return [];return [{...line,words,text:clean(words.map(word=>word.text).join(' ')),confidence:words.reduce((sum,word)=>sum+word.confidence,0)/words.length,bbox:{...line.bbox,x0:words[0].bbox.x0,x1:words.at(-1)!.bbox.x1}}];}
  return line.bbox.x0>=left&&line.bbox.x1<=right+2?[line]:[];
 }).flatMap(splitSubcolumns).sort((a,b)=>a.bbox.y0-b.bbox.y0||a.bbox.x0-b.bbox.x0);
 const rows:OcrLine[]=[];
 for(const line of recoverIngredientLines(selected).filter(line=>line.confidence>=65)){
  const previous=rows.at(-1);
  const overlap=previous?Math.min(previous.bbox.y1,line.bbox.y1)-Math.max(previous.bbox.y0,line.bbox.y0):0;
  if(previous&&!(completeRow(previous.text)&&completeRow(line.text))&&overlap>=Math.min(previous.bbox.y1-previous.bbox.y0,line.bbox.y1-line.bbox.y0)*.5&&Math.abs(line.bbox.x0-previous.bbox.x1)<Math.max(line.bbox.y1-line.bbox.y0,previous.bbox.y1-previous.bbox.y0)*8){
   const parts=[previous,line].sort((a,b)=>a.bbox.x0-b.bbox.x0);previous.text=parts.map(part=>part.text).join(' ');previous.bbox={x0:Math.min(previous.bbox.x0,line.bbox.x0),x1:Math.max(previous.bbox.x1,line.bbox.x1),y0:Math.min(previous.bbox.y0,line.bbox.y0),y1:Math.max(previous.bbox.y1,line.bbox.y1)};
  }else rows.push({...line,bbox:{...line.bbox}});
 }
 // Detached digits may be a misread fraction from the preceding ingredient.
 // Only reunite amounts on the same baseline; never attach them to a later row.
 return [region.header,'Ingredients',filterRecognizedLines(recoverIngredientLines(rows))].join('\n');
}
