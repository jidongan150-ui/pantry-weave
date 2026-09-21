import test from 'node:test';
import assert from 'node:assert/strict';
import {recognizeWithVision,visionResponseText,visionErrorCode,VISION_MODEL} from '../lib/recipe-vision.ts';

const recipe={name:'Eggs',servings:null,ingredients:[{name:'egg',quantity:2,unit:'',optional:false,choiceGroup:null}]};
const blob=new Blob(['image'],{type:'image/png'});
test('one fixed-model request yields validated editable ingredients',async()=>{
 const calls=[];
 const client={auth:{isSignedIn:()=>true},ai:{chat:async(...args)=>{calls.push(args);return {message:{content:JSON.stringify(recipe)}};}}};
 const result=await recognizeWithVision(client,blob,'en',new AbortController().signal);
 assert.equal(calls.length,1);assert.equal(calls[0][2].model,VISION_MODEL);assert.equal(calls[0][2].max_tokens,5000);
 assert.match(calls[0][0],/Use English/);assert.equal(calls[0][1].name,'recipe.png');
 assert.equal(result.draft.ingredients[0].quantity,'2');assert.equal(result.draft.servings,'');
});
test('missing login and invalid image do not call provider',async()=>{
 let calls=0;const client={auth:{isSignedIn:()=>false},ai:{chat:async()=>{calls++;}}};
 await assert.rejects(recognizeWithVision(client,blob,'zh',new AbortController().signal));
 client.auth.isSignedIn=()=>true;
 await assert.rejects(recognizeWithVision(client,new Blob(['not image']), 'zh',new AbortController().signal));assert.equal(calls,0);
});
test('invalid model output fails closed; quota errors are not retried',async()=>{
 let calls=0;const client={auth:{isSignedIn:()=>true},ai:{chat:async()=>{calls++;return {message:{content:'not JSON'}};}}};
 await assert.rejects(recognizeWithVision(client,blob,'zh',new AbortController().signal),/vision-response/);assert.equal(calls,1);
 client.ai.chat=async()=>{calls++;throw {error:{code:'insufficient_funds',message:'private provider detail'}};};
 await assert.rejects(recognizeWithVision(client,blob,'zh',new AbortController().signal));assert.equal(calls,2);
 assert.equal(visionErrorCode({error:{code:'insufficient_funds'}}),'vision-quota');
 assert.throws(()=>visionResponseText({finish_reason:'length',message:{content:JSON.stringify(recipe)}}));
});
test('cancel ignores late result and sends no second request',async()=>{
 const controller=new AbortController();let resolve,calls=0;
 const client={auth:{isSignedIn:()=>true},ai:{chat:()=>{calls++;return new Promise(r=>{resolve=r;});}}};
 const pending=recognizeWithVision(client,blob,'en',controller.signal);controller.abort();
 await assert.rejects(pending,{name:'AbortError'});resolve({message:{content:JSON.stringify(recipe)}});assert.equal(calls,1);
 await assert.rejects(recognizeWithVision(client,blob,'en',controller.signal));assert.equal(calls,1);
});
