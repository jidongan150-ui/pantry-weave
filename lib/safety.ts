export const isSessionToken = (value: string) => /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value);

export function publicRecipeUrl(value: string): string {
  if (value.length > 2048) throw new Error("请使用公开食谱网页的 http 或 https 链接");
  let url: URL;
  try { url = new URL(value); } catch { throw new Error("请输入完整的食谱网址"); }
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  const local = ["localhost", "local", "internal", "test", "invalid", "example", "home", "lan"];
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.port ||
      !host.includes('.') || host.startsWith('[') || /^\d+\.\d+\.\d+\.\d+$/.test(host) ||
      local.some(suffix => host === suffix || host.endsWith(`.${suffix}`))) {
    throw new Error("请使用公开食谱网页的 http 或 https 链接");
  }
  url.hash = "";
  return url.href;
}
