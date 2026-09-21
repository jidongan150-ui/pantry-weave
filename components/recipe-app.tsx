"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ConvexProviderWithAuth, ConvexReactClient, useAction, useMutation, useQuery, useConvexAuth } from "convex/react";
import type { SessionId } from "convex-helpers/server/sessions";
import { ShoppingBasket, Plus, Minus, Link2, ArrowUpRight, Mail, Trash2, Check, Copy, Download, Leaf, LoaderCircle, PenLine, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { api } from "@/convex/_generated/api";
import { categories, mergeRecipes, formatQuantity, shoppingText, sampleRecipes, recipeSchema, retainChecked, groupShoppingItems, servingsSummary, type Recipe } from "@/lib/recipes";
import {isIncluded} from '@/lib/ingredient-choices';
import { translate, errorMessage, type Language } from "@/lib/i18n";

import ImageRecipeImport from './image-recipe-import';
import ShoppingImageExport from './shopping-image-export';
import RecipeEditor from './recipe-editor';
import RecipePasteImport from './recipe-paste-import';
import {recipeText,recipeNote} from '@/lib/recipe-language';
import {LOCAL_PLAN_KEY,parseLocalPlan} from '@/lib/local-plan';

type Plan = { recipes: Recipe[]; people: number; checked: string[]; status: string };
type Change = { operation: "add" | "edit" | "remove" | "people" | "check" | "samples"; recipe?: Recipe; originalRecipe?:Recipe; recipeId?: string; people?: number; key?: string; checked?: boolean };
type Engine = { plan: Plan; online: boolean; loading: boolean; deviceStorage?:boolean; importReady: boolean; emailReady: boolean; change: (args: Change) => Promise<unknown>; importRecipe: (url: string, language: Language) => Promise<unknown>; sendList: (email: string, requestId: string, language: Language) => Promise<string> };
type LocaleProps = { language: Language; setLanguage: (value: Language) => void; signOutPath?: string };
const initial: Plan = { recipes: [], people: 2, checked: [], status: "" };

export default function RecipeApp({ convexUrl, signedIn, signInPath, signOutPath }: { convexUrl: string; signedIn: boolean; signInPath: string; signOutPath: string }) {
  const [language, setLanguage] = useState<Language>("en");
  useEffect(() => {
    try { if (localStorage.getItem("pantry-weave-language") === "zh") setLanguage("zh"); } catch { /* Private browsing may block storage. */ }
  }, []);
  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
    document.title = language === "zh" ? "一起买菜 · Pantry Weave" : "Pantry Weave · Recipe shopping list";
  }, [language]);
  const chooseLanguage = (value: Language) => {
    setLanguage(value);
    try { localStorage.setItem("pantry-weave-language", value); } catch { /* Switching still works without persistence. */ }
  };
  const props = { language, setLanguage: chooseLanguage, signOutPath };
  if (convexUrl && !signedIn) return <><div className="account-banner"><span>{language==='en'?'Sign in to sync your list across devices.':'登录后可跨设备同步清单。'}</span><a href={signInPath} target="_top">{translate("使用 ChatGPT 登录", language)}</a></div><Demo {...props} /></>;
  return convexUrl ? <CloudApp convexUrl={convexUrl} {...props} /> : <Demo {...props} />;
}

function CloudApp({ convexUrl, ...locale }: { convexUrl: string } & LocaleProps) {
  const [client, setClient] = useState<ConvexReactClient | null>(null);
  const [authError, setAuthError] = useState(false);
  const fetchAccessToken = useCallback(async () => {
    try {
      const response = await fetch('/api/convex-token', { method: 'POST', credentials: 'same-origin', cache: 'no-store' });
      if (!response.ok) throw new Error('Authentication unavailable');
      const result: unknown = await response.json();
      if (!result || typeof result !== 'object' || !('token' in result) || typeof result.token !== 'string') throw new Error('Invalid token response');
      setAuthError(false);
      return result.token;
    } catch { setAuthError(true); return null; }
  }, []);
  const useSiteAuth = useCallback(() => ({ isLoading: false, isAuthenticated: true, fetchAccessToken }), [fetchAccessToken]);
  useEffect(() => {
    const connection = new ConvexReactClient(convexUrl);
    setClient(connection);
    return () => { void connection.close(); };
  }, [convexUrl]);
  if (!client) return <p className="workspace" role="status">{translate("正在读取你的清单…", locale.language)}</p>;
  return <ConvexProviderWithAuth client={client} useAuth={useSiteAuth}><AccountGate {...locale} authError={authError} /></ConvexProviderWithAuth>;
}

function AccountGate({ authError, ...locale }: LocaleProps & { authError: boolean }) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  if (authError || (!isLoading && !isAuthenticated)) return <ConnectionMessage {...locale} failed />;
  if (isLoading) return <ConnectionMessage {...locale} />;
  return <AccountPlan {...locale} />;
}

function ConnectionMessage({ language, failed = false }: LocaleProps & { failed?: boolean }) {
  return <main className="workspace connection-state" role={failed ? 'alert' : 'status'}><ShoppingBasket /><h1>Pantry Weave</h1><p>{translate(failed ? "暂时无法连接你的账户，请重试" : "正在安全连接…", language)}</p>{failed && <button className="text-button" onClick={() => location.reload()}>{translate("重试", language)}</button>}</main>;
}

function AccountPlan(locale: LocaleProps) {
  const ensure = useMutation(api.accounts.ensure);
  const [sessionId, setSessionId] = useState<SessionId | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    void ensure({}).then(id => { if (active) setSessionId(id); }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [ensure]);
  if (!sessionId) return <ConnectionMessage {...locale} failed={failed} />;
  return <Connected {...locale} sessionId={sessionId} />;
}

function Connected({ sessionId, ...locale }: LocaleProps & { sessionId: SessionId }) {
  const plan = useQuery(api.plans.get, { sessionId });
  const change = useMutation(api.plans.change);
  const importAction = useAction(api.services.importRecipe);
  const mailAction = useAction(api.services.sendList);
  const availability = useAction(api.services.availability);
  const [ready, setReady] = useState({ importReady: false, emailReady: false });
  useEffect(() => { void availability({}).then(setReady).catch(() => setReady({ importReady: false, emailReady: false })); }, [availability]);
  return <Surface {...locale} engine={{ plan: plan ?? initial, online: true, loading: plan === undefined, ...ready, change: args => change({ ...args, sessionId }), importRecipe: (url, language) => importAction({ sessionId, url, language }), sendList: (email, requestId, language) => mailAction({ sessionId, email, requestId, language }) }} />;
}

function Demo(locale: LocaleProps) {
  const [plan, setPlan] = useState<Plan>(initial);
  const [loaded,setLoaded]=useState(false),[deviceStorage,setDeviceStorage]=useState(true);
  const planRef=useRef(plan);
  useEffect(()=>{
    try{const saved=localStorage.getItem(LOCAL_PLAN_KEY);if(saved){try{planRef.current=parseLocalPlan(saved);setPlan(planRef.current);}catch{localStorage.removeItem(LOCAL_PLAN_KEY);}}}catch{setDeviceStorage(false);}
    setLoaded(true);
    const sync=(event:StorageEvent)=>{if(event.key!==LOCAL_PLAN_KEY)return;try{const next=event.newValue?parseLocalPlan(event.newValue):initial;planRef.current=next;setPlan(next);}catch{/* Ignore invalid data from another tab. */}};
    window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);
  },[]);
  const revised=(p:Plan,recipes:Recipe[],people=p.people)=>({...p,recipes,people,checked:retainChecked(mergeRecipes(p.recipes,p.people),mergeRecipes(recipes,people),p.checked)});
  const change = useCallback(async (args: Change) => {
    let current=planRef.current;
    try{const saved=localStorage.getItem(LOCAL_PLAN_KEY);if(saved)current=parseLocalPlan(saved);}catch{/* Use the visible list when storage is unavailable. */}
    const next=((p:Plan) => {
      if(args.operation==='add'&&p.recipes.length>=5)throw Error('每份清单最多 5 道菜');
      if (args.operation === "add" && args.recipe && p.recipes.length < 5) return revised(p,[...p.recipes,recipeSchema.parse(args.recipe)]);
      if(args.operation === "edit" && args.recipe && args.originalRecipe){
        const previous=p.recipes.find(recipe=>recipe.id===args.originalRecipe!.id);
        if(!previous)throw Error('这道菜已被移除，请关闭编辑窗口后重试');
        if(JSON.stringify(previous)!==JSON.stringify(args.originalRecipe))throw Error('这道菜已在其他窗口修改，请关闭后重新编辑');
        const next=recipeSchema.parse(args.recipe);return revised(p,p.recipes.map(recipe=>recipe.id===next.id?{...next,source:recipe.source,sample:recipe.sample}:recipe));
      }
      if (args.operation === "samples") {
        const missing = sampleRecipes.filter(r => !p.recipes.some(x => x.id === r.id));
        return p.recipes.length + missing.length > 5 ? p : revised(p,[...p.recipes,...missing]);
      }
      if (args.operation === "remove") return revised(p,p.recipes.filter(x=>x.id!==args.recipeId));
      if (args.operation === "people" && Number.isInteger(args.people) && args.people! >= 1 && args.people! <= 20) return revised(p,p.recipes,args.people!);
      if (args.operation === "check" && args.key) return { ...p, checked: args.checked ? [...new Set([...p.checked, args.key])] : p.checked.filter(x => x !== args.key) };
      return p;
    })(current);
    try{localStorage.setItem(LOCAL_PLAN_KEY,JSON.stringify(next));setDeviceStorage(true);}catch{setDeviceStorage(false);}
    planRef.current=next;setPlan(next);
  }, []);
  return <Surface {...locale} engine={{ plan, online: false, loading: !loaded, deviceStorage, importReady: false, emailReady: false, change, importRecipe: async () => { throw Error("网页导入尚未配置。现在可以使用示例，或手动添加食材。"); }, sendList: async () => { throw Error("邮件服务尚未配置，可以先复制或下载清单"); } }} />;
}

function Surface({ engine: e, language, setLanguage, signOutPath }: { engine: Engine } & LocaleProps) {
  const t = (text: string, values?: Record<string, string | number>) => translate(text, language, values);
  const { recipes, people, checked, status } = e.plan;
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [notice, setNotice] = useState("");
  const [lastError, setLastError] = useState<unknown>(null);
  const [manual, setManual] = useState(false);
  const [editing,setEditing]=useState<Recipe|null>(null);
  const rt=(value:string)=>recipeText(value,language).text;
  const [emailOpen, setEmailOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [emailResult, setEmailResult] = useState("");
  const emailAttempt = useRef({ fingerprint: "", id: "" });
  const items = useMemo(() => mergeRecipes(recipes, people), [recipes, people]);
  const remaining = items.filter(x => !checked.includes(x.key));
  const foodGroups = groupShoppingItems(items);
  const servingLabel = servingsSummary(recipes, people, language);
  const duplicates = recipes.reduce((n, r) => n + r.ingredients.filter(isIncluded).length, 0) - items.length;
  const feedback = lastError ? errorMessage(lastError, language) : t(notice);

  const run = async (fn: () => Promise<unknown>) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true); setNotice(""); setLastError(null);
    try { await fn(); } catch (error) { setLastError(error); } finally { lock.current = false; setBusy(false); }
  };
  async function loadSamples() {
    const missing = sampleRecipes.filter(r => !recipes.some(x => x.id === r.id));
    if (recipes.length + missing.length > 5) throw Error("请先移除一些食谱，示例包含两道菜");
    await e.change({ operation: "samples" });
  }

  useEffect(() => {
    const context = (document as Document & { modelContext?: { registerTool: (tool: unknown, options: { signal: AbortSignal }) => unknown } }).modelContext;
    if (!context?.registerTool) return;
    const controller = new AbortController();
    try {
      void Promise.resolve(context.registerTool({
        name: "get_shopping_list", title: language === "en" ? "Read shopping list" : "读取当前购物清单",
        description: "Read the current visible shopping list. Does not send email or change data.",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: true, untrustedContentHint: true },
        execute: (input: unknown) => {
          if (!input || typeof input !== "object" || Array.isArray(input) || Object.keys(input).length) throw Error("Expected an empty object");
          return { language, people, items: items.map(x => ({ name: recipeText(x.name, language).text, quantity: formatQuantity(x, language), alreadyHave: checked.includes(x.key), sources: x.sources.map(n => recipeText(n, language).text) })) };
        },
      }, { signal: controller.signal })).catch(() => {});
    } catch { /* Optional browser capability. */ }
    return () => controller.abort();
  }, [items, people, checked, language]);

  async function saveRecipe(recipe:Recipe){
    if(lock.current)throw Error('操作未完成，请稍后重试');
    lock.current=true;setBusy(true);
    try{
      if(!editing&&recipes.length>=5)throw Error('每份清单最多 5 道菜');
      await e.change(editing?{operation:'edit',recipe,originalRecipe:editing}:{operation:'add',recipe});
      setNotice(editing?'食谱已更新，购物清单已重新计算':'食谱已加入，可在下方修改');
    }finally{lock.current=false;setBusy(false);}
  }
  async function copy() {
    setLastError(null);
    try { await navigator.clipboard.writeText(shoppingText(items, checked, people, language)); setNotice("已复制待购买的食材"); }
    catch { setNotice("浏览器未允许复制，请使用下载按钮"); }
  }
  function download() {
    const blob = new Blob([shoppingText(items, checked, people, language)], { type: "text/plain;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = href;
    a.download = language === "en" ? "pantry-weave-shopping-list.txt" : "一起买菜-购物清单.txt";
    a.click(); setTimeout(() => URL.revokeObjectURL(href), 1000);
  }
  async function sendEmail() {
    // Reuse a request ID after an uncertain result; never silently send twice.
    const fingerprint = JSON.stringify([email.trim().toLowerCase(), language, shoppingText(items, checked, people, language)]);
    if (emailAttempt.current.fingerprint !== fingerprint) emailAttempt.current = { fingerprint, id: crypto.randomUUID() };
    setEmailResult(await e.sendList(email.trim(), emailAttempt.current.id, language));
  }

  return <main>
    <header className="topbar">
      <a href="/" className="brand"><ShoppingBasket /><span>{t("一起买菜")}</span>{language === "zh" && <small>PANTRY WEAVE</small>}</a>
      <span className="tagline">{t("好好吃饭，轻松备菜。")}</span>
      <div className="header-controls"><span className="mode-tag">{e.online?t('清单自动保存'):e.deviceStorage?(language==='en'?'Saved on this device':'保存在本机'):t('体验版')}</span>
        {e.online && signOutPath && <a className="text-button account-signout" href={signOutPath} target="_top">{t("退出登录")}</a>}
        <div className="language-switch" role="group" aria-label="Language / 语言">
          <button type="button" lang="en" aria-pressed={language === "en"} onClick={() => setLanguage("en")}>English</button>
          <button type="button" lang="zh-CN" aria-pressed={language === "zh"} onClick={() => setLanguage("zh")}>中文</button>
        </div>
      </div>
    </header>
    <div className="workspace">
      <section className="intro"><span className="eyebrow">YOUR RECIPES. ONE LIST.</span><h1>{t("今晚做什么，")} <em>{t("一次买齐。")}</em></h1><p>{t("把想做的菜放在一起，重复的食材交给我们整理。")}</p></section>
      <div className="work-grid"><section>
        <div className="section-title"><h2><small>01</small> {t("计划这顿饭")}</h2><div className="stepper"><span>{t("用餐人数")}</span>
          <button aria-label={t("减少人数")} disabled={people <= 1 || busy || e.loading} onClick={() => void run(() => e.change({ operation: "people", people: people - 1 }))}><Minus size={15} /></button>
          <strong aria-live="polite">{people}</strong>
          <button aria-label={t("增加人数")} disabled={people >= 20 || busy || e.loading} onClick={() => void run(() => e.change({ operation: "people", people: people + 1 }))}><Plus size={15} /></button>
        </div></div>
        <div className="input-card recipe-entry"><h3>{language==='en'?'Add your recipe':'添加你的食谱'}</h3><p>{language==='en'?'Read your photo in ChatGPT, then open its recipe link here.':'在 ChatGPT 中识别图片，点击食谱链接即可在这里核对。'}</p>
        <RecipePasteImport language={language} setLanguage={setLanguage} disabled={recipes.length>=5||busy||e.loading} onAdd={async recipe=>{
          if(lock.current)throw Error('操作未完成，请稍后重试');
          lock.current=true;setBusy(true);
          try{await e.change({operation:'add',recipe});setNotice('食谱已加入，可在下方修改');}finally{lock.current=false;setBusy(false);}
        }}/>
        <details className="other-image-options"><summary>{language==='en'?'Other ways: upload, camera, local reading':'其他方式：上传、拍照、本地识别'}</summary>
        <ImageRecipeImport language={language} setLanguage={setLanguage} disabled={busy||e.loading||recipes.length>=5} onAdd={async recipe=>{
          if(lock.current)throw Error('操作未完成，请稍后重试');
          lock.current=true;setBusy(true);
          try{await e.change({operation:'add',recipe});setNotice('食谱已加入，可在下方修改');}finally{lock.current=false;setBusy(false);}
        }}/>
        </details>
        <button className="text-button manual-entry-button" disabled={recipes.length>=5||busy||e.loading} onClick={()=>setManual(true)}><PenLine size={16}/>{t('手动添加')}</button>
        {recipes.length>=5&&<p role="status">{t('每份清单最多 5 道菜')}</p>}
        <details className="recipe-link-option"><summary>{t('添加食谱链接')}{!e.importReady&&<span>{language==='en'?' · unavailable':' · 暂未开通'}</span>}</summary>
        {e.importReady?<form onSubmit={event=>{event.preventDefault();void run(async()=>{await e.importRecipe(url.trim(),language);setUrl('');});}}><label htmlFor="url">{t('添加食谱链接')}</label><div className="url-field"><Link2 size={19}/><input id="url" type="url" required maxLength={2048} value={url} onChange={event=>setUrl(event.target.value)} placeholder={t('粘贴你收藏的食谱网址')}/><button aria-label={t('导入食谱')} disabled={!url.trim()||busy||e.loading||recipes.length>=5}>{busy?<LoaderCircle size={20} className="spin"/>:<ArrowUpRight size={20}/>}</button></div></form>:<p className="image-help">{language==='en'?'Link import is not connected. Upload a screenshot or enter the recipe above.':'链接导入尚未连接，可在上方上传截图或手动填写。'}</p>}
        </details></div>
        <div className="sample-card"><div><span className="eyebrow">{t("先试一顿简单的晚餐")}</span><h3>{t("番茄意面，")}<br />{t("加一份清爽沙拉。")}</h3><button className="text-button" disabled={busy || e.loading || sampleRecipes.every(r => recipes.some(x => x.id === r.id))} onClick={() => void run(loadSamples)}>{t("载入示例食谱")} <ArrowUpRight size={17} /></button></div><div className="sample-art"><img src="/ingredients.jpg" alt={t("番茄、罗勒、大蒜和意面食材")} width="960" height="640" /></div></div>
        {!recipes.length ? <div className="empty-recipes"><Plus /><p>{t(e.loading ? "正在读取你的清单…" : "你的食谱会出现在这里")}</p><span>{t("添加后自动计算所需食材")}</span></div> : <div className="recipe-stack">
          <div className="recipe-count">{t("已选 {count} 道菜", { count: recipes.length })}<span>{servingLabel}</span></div>
          {recipes.map((r, index) => <article className="recipe-card" key={r.id}><div className="recipe-top"><span className="recipe-number">{String(index + 1).padStart(2, "0")}</span><div className="recipe-name"><h3>{rt(r.name)}</h3><p>{r.servings===null?(language==='en'?'Original quantities':'按原方用量'):t("原食谱 {count} 人份", { count: r.servings })} · {t("{count} 种食材", { count: r.ingredients.filter(isIncluded).length })} {r.sample && <span className="badge">{t("示例")}</span>}</p></div><button className="icon-button" disabled={busy||e.loading} aria-label={language==='en'?`Edit ${rt(r.name)}`:`编辑 ${rt(r.name)}`} onClick={()=>setEditing(r)}><PenLine size={17}/></button><button className="icon-button" disabled={busy} aria-label={t("移除 {name}", { name: rt(r.name) })} onClick={() => void run(() => e.change({ operation: "remove", recipeId: r.id }))}><Trash2 size={17} /></button></div>
            <details><summary>{t(r.source ? "查看原食材与来源" : "查看原食材")}</summary><div className="recipe-ingredients">{r.ingredients.map((x, i) => <div key={i} className={isIncluded(x)?undefined:"excluded-ingredient"}><span>{rt(x.name)}{!isIncluded(x)&&<small> · {language==="en"?"not selected":"未选"}</small>}{x.note && <small> · {rt(x.note)}</small>}</span><span>{formatQuantity(x, language)}</span></div>)}</div>{r.source && /^https?:\/\//.test(r.source) && <a className="source-link" href={r.source} target="_blank" rel="noopener noreferrer">{t("查看原食谱")} <ExternalLink size={13} /></a>}</details>
          </article>)}
        </div>}
        {!e.online && <p className="mode-note">{e.deviceStorage?(language==='en'?'Saved in this browser, including after refresh. Anyone using this browser can see this local list. Sign in for a separate cloud list; local recipes are not moved automatically.':'清单保存在本浏览器，刷新后仍保留。使用此浏览器的人也能看到本机清单。登录后使用独立的云端清单，本机食谱不会自动搬过去。'):t('体验模式：清单仅保留在当前页面，刷新会清空。可以下载后带去买菜。')}</p>}
        <div className="feedback" role="status" aria-live="polite">{busy && <LoaderCircle size={16} className="spin" />}{feedback || (busy ? t(status || "正在更新…") : "")}</div>
      </section>
      <aside className="shopping-panel"><div className="receipt-head"><span className="eyebrow">YOUR SHOPPING LIST</span><h2>{t("一张清单，刚刚好。")}</h2><p>{recipes.length ? `${t("{count} 道菜", { count: recipes.length })} · ${t("{count} 种食材", { count: foodGroups.length })}` : t("等待添加食谱")}</p>{recipes.length>0&&<p className="servings-summary">{servingLabel}</p>}</div>
        {!items.length ? <div className="receipt-empty"><ShoppingBasket size={42} /><p>{t("先添加一道想做的菜")}</p><span>{t("相同食材会自动合并，家里已有的，轻轻勾掉就好。")}</span></div> : <>
          <div className="list-summary"><span><strong>{remaining.length}</strong> {t("项待购买", { count: remaining.length })}</span>{duplicates > 0 && <span className="merge-tag">{t("合并了 {count} 项重复食材", { count: duplicates })}</span>}</div>
          <div className="progress-track"><div style={{ width: `${(items.length - remaining.length) / items.length * 100}%` }} /></div>
          <div className="shopping-groups">{categories.map(category => { const groups = foodGroups.filter(x => x.category === category); return groups.length > 0 && <section className="shopping-group" key={category}><h3>{t(category)}<span>{groups.length}</span></h3>{groups.map(group=><div className={`shopping-food ${group.items.length>1?'has-portions':''}`} key={group.name}>
            {group.items.length>1&&<h4>{rt(group.name)}</h4>}
            {group.items.map(item => <label className={`shopping-item ${checked.includes(item.key) ? "is-checked" : ""}`} key={item.key}><input type="checkbox" aria-label={group.items.length===1?rt(item.name):`${rt(group.name)} · ${formatQuantity(item,language)} · ${item.sources.map(rt).join(', ')}`} checked={checked.includes(item.key)} disabled={busy} onChange={event => void run(() => e.change({ operation: "check", key: item.key, checked: event.target.checked }))} /><span className="custom-check"><Check size={13} /></span><span className="item-name"><strong>{group.items.length===1?rt(item.name):formatQuantity(item,language)}</strong>{group.items.length>1&&item.asWritten&&item.quantity!==null&&<small className="as-written">{language==='en'?'Original amount; not scaled':'原方用量，未换算'}</small>}<small>{item.sources.map(rt).join(language === "en" ? ", " : "、")}</small>{item.notes.some(note=>recipeNote(note,language).text) && <small className="ingredient-note">{item.notes.map(note=>recipeNote(note,language).text).filter(Boolean).join(language === "en" ? "; " : "；")}</small>}</span>{group.items.length===1&&<span className="item-quantity">{formatQuantity(item, language)}{item.asWritten&&item.quantity!==null&&<small className="as-written">{language==='en'?'as written':'原方用量'}</small>}</span>}</label>)}
          </div>)}</section>; })}</div>
          <p className="calculation-note">{language==='en'?'Checks are kept for unchanged ingredients. Changed amounts or notes need checking again.':'未变化的食材保留勾选；用量或备注变化时，需要重新确认。'}</p>
        </>}
        {recipes.some(r=>[r.name,...r.ingredients.flatMap(i=>[i.name,i.unit,recipeNote(i.note,language).text])].some(value=>recipeText(value,language).original))&&<p className="image-help original-language-note">{language==='en'?'Some names or notes remain in their original language. You can edit the original recipe.':'部分菜名或备注保留原文，可通过编辑食谱修改。'}</p>}
        {recipes.some(r=>r.servings===null)&&<p className="image-help">{language==='en'?'Recipes with no serving count keep their original quantities. Add servings in Edit to scale them.':'未注明人数的食谱保留原方用量，需要换算时再编辑人数。'}</p>}
        <div className="receipt-bottom"><Leaf size={15} />{t("少买一点重复，多留一点新鲜。")}</div>
        <ShoppingImageExport items={items} checked={checked} people={people} recipeNames={recipes.map(recipe=>recipe.name)} language={language} setLanguage={setLanguage} disabled={busy||e.loading}/>
        {e.emailReady&&<button className="secondary-button shopping-text-export" disabled={!remaining.length || busy} onClick={() => { setEmailResult(""); setLastError(null); setNotice(""); setEmailOpen(true); }}>{e.emailReady?<Mail size={18}/>:<Download size={18}/>} {t("发送购物清单")}</button>}
        {items.length > 0 && <div className="list-actions"><button disabled={!remaining.length} onClick={() => void copy()}><Copy size={15} />{t("复制清单")}</button><button disabled={!remaining.length} onClick={download}><Download size={15} />{t("下载清单")}</button></div>}
      </aside></div>
      <footer><span>{t("一起买菜")}</span><span>{t("把时间留给做饭的人。")}</span></footer>
    </div>
    {(manual||editing)&&<RecipeEditor key={editing?.id??'new'} original={editing??undefined} language={language} onClose={()=>{setManual(false);setEditing(null);}} onSave={saveRecipe}/>}
    <Dialog open={emailOpen} onOpenChange={setEmailOpen}><DialogContent className="app-dialog" closeLabel={t("关闭")}><DialogTitle>{t("把清单带上")}</DialogTitle><DialogDescription>{t(e.emailReady ? "仅发送未勾选的食材。试用版发送至已配置的测试邮箱。" : "邮件服务尚未连接。你可以先复制或下载购物清单。")}</DialogDescription>
      {e.emailReady ? <form className="manual-form" onSubmit={event => { event.preventDefault(); void run(sendEmail); }}><label>{t("收件邮箱")}<input type="email" required maxLength={254} value={email} onChange={event => { setEmail(event.target.value); setEmailResult(""); }} placeholder={t("填写你的测试邮箱")} /></label><button className="primary-button" disabled={busy || !!emailResult} type="submit">{t(busy ? "正在发送…" : "发送到邮箱")}</button><p role="status">{t(emailResult) || feedback}</p></form> : <div className="export-options"><button className="primary-button" onClick={download}><Download size={17} />{t("下载清单")}</button><button className="secondary-button" onClick={() => void copy()}><Copy size={17} />{t("复制清单")}</button><p role="status">{feedback}</p></div>}
    </DialogContent></Dialog>
  </main>;
}
