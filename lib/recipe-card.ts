import type { Language } from './i18n';
import type { DisplayRecipe } from './recipe-language';

export type RecipeCardOptions = { kind:'shopping'; recipeNames:string[]; unscaled?:boolean; itemDetails?:{quantity:string;note:string}[][] };
export async function renderRecipeCard(recipe:DisplayRecipe, language:Language, options?:RecipeCardOptions):Promise<Blob>{
 await document.fonts.ready;
 const canvas=document.createElement('canvas');canvas.width=1000;
 const ctx=canvas.getContext('2d');if(!ctx)throw new Error('canvas');
 const t=(en:string,zh:string)=>language==='en'?en:zh;
 const family='Arial, "Microsoft YaHei", "PingFang SC", sans-serif';
 const wrap=(text:string,width:number,font:string)=>{
  ctx.font=font;const lines:string[]=[];let line='';
  for(const token of text.split(/(\s+|(?=[\u3400-\u9fff])|(?<=[\u3400-\u9fff]))/u)){
   if(ctx.measureText(line+token).width<=width){line+=token;continue;}
   if(line.trim())lines.push(line.trim());line='';
   for(const char of token){if(ctx.measureText(line+char).width>width){lines.push(line.trim());line='';}line+=char;}
  }
  if(line.trim())lines.push(line.trim());return lines;
 };
 const ops:(()=>void)[]=[];let y=62;
 const text=(value:string,size=28,color='#213e31',bold=false,x=62,width=876)=>{
  const font=`${bold?'700':'400'} ${size}px ${family}`;
  for(const line of wrap(value,width,font)){const top=y;ops.push(()=>{ctx.font=font;ctx.fillStyle=color;ctx.fillText(line,x,top);});y+=size*1.4;}
 };
 const rule=()=>{const top=y;ops.push(()=>{ctx.strokeStyle='#d3dfd6';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(62,top);ctx.lineTo(938,top);ctx.stroke();});y+=28;};
 text('PANTRY WEAVE',22,'#597062',true);y+=18;
 text(recipe.name||t('Recipe to review','待核对食谱'),44,'#173f2e',true);y+=10;
 text(options?options.unscaled?t('SHOPPING LIST · INCLUDES ORIGINAL AMOUNTS','购物清单 · 含未换算的原方用量'):t('MERGED & SCALED · ITEMS TO BUY','已合并并换算 · 待购食材'):t('SHOPPING CARD · SCAN RESULTS','购物清单卡 · 扫描结果'),22,'#597062',true);
 const itemCount=t(`${recipe.ingredients.length} ${recipe.ingredients.length===1?'ingredient':'ingredients'}`,`${recipe.ingredients.length} 种食材`);
 text(options?options.unscaled?itemCount:t(`For ${recipe.servings} people · ${itemCount}`,`供 ${recipe.servings} 人食用 · ${itemCount}`):recipe.servings?t(`Original recipe: ${recipe.servings} servings`,`原食谱：${recipe.servings} 人份`):t('Servings: not specified — add before scaling','原食谱人数：未注明，换算前请补充'),25);
 if(options)text(t('Recipes: ','菜谱：')+options.recipeNames.join(' · '),23,'#597062');
 y+=18;rule();
 recipe.ingredients.forEach((row,index)=>{
  const top=y;ops.push(()=>{ctx.strokeStyle='#759180';ctx.lineWidth=2;ctx.strokeRect(62,top+6,25,25);});
  text(`${index+1}. ${row.name}`,32,'#213e31',true,108,820);
  const details=options?.itemDetails?.[index];
  if(details&&details.length>1){
   for(const detail of details){text(`• ${detail.quantity}`,27,'#42634e',false,108,820);if(detail.note)text(detail.note,23,'#665837',false,132,796);y+=8;}
  }else{
   text(row.quantity?`${row.quantity} ${row.unit}`.trim():t('Amount not specified','用量未注明'),27,'#42634e',false,108,820);
   if(row.note)text(row.note,23,'#665837',false,108,820);
  }
  y+=20;rule();
 });
 text(options?t('Checked items are excluded. Verify any unclear amounts against your recipes.','已排除勾选的食材；不明确的用量请对照食谱核对。'):t('Check ingredients and amounts against the original image.','请对照原图核对食材和用量。'),24,'#665837');
 if(recipe.untranslated)text(t('Some text remains in its original language; translation needs review.','部分内容保留原文，翻译待核对。'),24,'#665837');
 text(t('Unknown amounts are not “to taste”. Optional alternatives are not all required.','未注明用量不等于“适量”；可选或替代材料不必全部购买。'),24,'#665837');
 y+=30;
 // Bound memory on long recipes while keeping every row in one PNG.
 const scale=Math.min(1,16000/y,Math.sqrt(16000000/(1000*y)));
 canvas.width=Math.round(1000*scale);canvas.height=Math.ceil(y*scale);
 ctx.scale(scale,scale);ctx.fillStyle='#fffdf7';ctx.fillRect(0,0,1000,y);ctx.textBaseline='top';
 ctx.fillStyle='#214e3a';ctx.fillRect(0,0,1000,12);for(const draw of ops)draw();
 return await new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('canvas')),'image/png'));
}
