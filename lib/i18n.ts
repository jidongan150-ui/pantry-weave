export type Language = "en" | "zh";

// Source recipe text stays intact; built-in content and interface copy are localized.
const english: Record<string, string> = {
  "用量未注明": "Amount not specified", "导出购物清单": "Export shopping list",
  "一起买菜": "Pantry Weave", "好好吃饭，轻松备菜。": "Good meals. Less planning.",
  "清单自动保存": "Autosaved", "体验版": "Demo",
  "今晚做什么，": "More recipes.", "一次买齐。": "One shopping list.",
  "把想做的菜放在一起，重复的食材交给我们整理。": "Bring your recipes together. We'll take care of the duplicate ingredients.",
  "食谱已更新，购物清单已重新计算": "Recipe updated. Your shopping list has been recalculated.",
  "食谱已加入，可在下方修改": "Recipe added. You can edit it below.",
  "这道菜已被移除，请关闭编辑窗口后重试": "This recipe was removed. Close the editor and try again.",
  "这道菜已在其他窗口修改，请关闭后重新编辑": "This recipe changed in another window. Close and reopen the editor to use the latest version.",
  " · 原方用量，未按人数换算": " · Original amount; not scaled to servings",
  "计划这顿饭": "Plan your meal", "用餐人数": "Servings", "减少人数": "Fewer servings", "增加人数": "More servings",
  "添加食谱链接": "Add a recipe link", "粘贴你收藏的食谱网址": "Paste a recipe URL", "导入食谱": "Import recipe",
  "网页导入待连接": "Recipe import is not connected", "公开网页 · 最多 5 道菜": "Public recipe pages · Up to 5 recipes",
  "网页导入待连接，可先试用示例或手动添加": "Import isn't connected yet. Try the samples or add a recipe manually.",
  "手动添加": "Add manually", "先试一顿简单的晚餐": "TRY A SIMPLE DINNER",
  "番茄意面，": "Tomato pasta,", "加一份清爽沙拉。": "with a fresh salad.", "载入示例食谱": "Load sample recipes",
  "番茄、罗勒、大蒜和意面食材": "Tomatoes, basil, garlic and pasta",
  "正在读取你的清单…": "Loading your list…", "你的食谱会出现在这里": "Your recipes will appear here",
  "添加后自动计算所需食材": "Add a recipe to calculate what you need.", "已选 {count} 道菜": "{count} recipes selected",
  "按 {count} 人份换算": "Scaled to {count} servings", "原食谱 {count} 人份": "Originally serves {count}",
  "{count} 种食材": "{count} ingredients", "示例": "Sample", "移除 {name}": "Remove {name}",
  "查看原食材": "View original ingredients", "查看原食材与来源": "View ingredients and source", "查看原食谱": "Open original recipe",
  "体验模式：清单仅保留在当前页面，刷新会清空。可以下载后带去买菜。": "Demo mode: your list stays on this page and clears on refresh. Download it before you go shopping.",
  "正在更新…": "Updating…", "一张清单，刚刚好。": "Everything you need.",
  "{count} 人份": "{count} servings", "{count} 道菜": "{count} recipes", "等待添加食谱": "No recipes yet",
  "先添加一道想做的菜": "Start with something delicious",
  "相同食材会自动合并，家里已有的，轻轻勾掉就好。": "We'll combine matching ingredients. Tick off anything you already have.",
  "项待购买": "items to buy", "合并了 {count} 项重复食材": "{count} duplicate entries combined",
  "只合并明确可换算的单位；“适量”和不同单位分别保留。更改人数会重置勾选。": "Only compatible units are combined. Unknown amounts stay separate. Changing servings or recipes resets your checks.",
  "少买一点重复，多留一点新鲜。": "Less waste. More freshness.", "发送购物清单": "Email shopping list",
  "复制清单": "Copy list", "下载清单": "Download list", "把时间留给做饭的人。": "More time for the joy of cooking.",
  "手动添加一道菜": "Add a recipe", "填写原食谱的份数，购物清单会按用餐人数换算。": "Enter the original serving count. We'll scale the ingredients for your meal.",
  "菜名": "Recipe name", "例如：番茄炒蛋": "e.g. Tomato scrambled eggs", "原食谱适合几人？": "Original number of servings",
  "食材": "Ingredients", "番茄 | 300 | 克\n鸡蛋 | 3 | 个\n盐 | 适量": "Tomatoes | 300 | g\nEggs | 3 | pieces\nSalt | to taste",
  "每行：食材 | 数量 | 单位。小数请写 0.5，未知数量写“适量”。": "One per line: ingredient | quantity | unit. Use decimals like 0.5, or “to taste” for an unknown amount.",
  "加入这顿饭": "Add to meal", "把清单带上": "Take your list with you", "关闭": "Close",
  "仅发送未勾选的食材。试用版发送至已配置的测试邮箱。": "Only unchecked items are included. This trial sends to configured test recipients.",
  "邮件服务尚未连接。你可以先复制或下载购物清单。": "Email isn't connected yet. You can copy or download your list instead.",
  "收件邮箱": "Recipient email", "填写你的测试邮箱": "Your configured test email", "正在发送…": "Sending…", "发送到邮箱": "Send email",
  "已复制待购买的食材": "Copied the items you still need to buy.", "浏览器未允许复制，请使用下载按钮": "Clipboard access is unavailable. Please download the list instead.",
  "操作未完成，请稍后重试": "Something went wrong. Please try again.", "请检查菜名、份数和食材格式": "Check the recipe name, servings and ingredient format.",
  "请先移除一些食谱，示例包含两道菜": "Remove a recipe first. The sample meal includes two recipes.",
  "每份清单最多 5 道菜": "A shopping list can contain up to 5 recipes.", "最多 5 道菜": "You can add up to 5 recipes.",
  "添加示例后会超过 5 道菜，请先移除一些食谱": "Adding the samples would exceed 5 recipes. Remove some first.",
  "人数应为 1–20": "Choose 1–20 servings.", "人数应为 1–20 的整数": "Choose a whole number from 1 to 20.",
  "食材不存在": "That ingredient is no longer on this list.", "会话无效，请刷新页面": "This session is invalid. Refresh the page.",
  "清单创建失败": "Couldn't create the list. Please try again.", "发送标识无效": "Invalid email request. Reopen the dialog and try again.",
  "上一道食谱仍在处理中": "Another recipe is still being imported.", "请先添加食谱": "Add a recipe first.",
  "正在读取食谱网页…": "Reading the recipe page…", "正在识别食材和原食谱份数…": "Finding ingredients and original servings…",
  "食谱已导入，请核对食材和份数": "Recipe imported. Please check the ingredients and servings.",
  "网页导入尚未配置。现在可以使用示例，或手动添加食材。": "Recipe import isn't connected yet. Try the samples or add ingredients manually.",
  "请输入完整的食谱网址": "Enter a complete recipe URL.", "请使用公开食谱网页的 http 或 https 链接": "Use a public recipe page with an HTTP or HTTPS URL.",
  "网页读取失败。请换一个公开链接，或手动填写食材。": "Couldn't read this page. Try another public URL or add ingredients manually.",
  "网页内容不足，未能找到食谱": "Not enough recipe content was found on this page.",
  "食材识别暂时失败，请稍后再试，或手动添加": "Couldn't extract the ingredients. Try again or add them manually.",
  "识别未完成，请换一份较短的食谱或手动添加": "Extraction was incomplete. Try a shorter recipe or enter it manually.",
  "原网页未明确注明人数，无法可靠换算。请改用手动添加，并填写原食谱人数。": "The original serving count is missing. Add this recipe manually with its original number of servings.",
  "未找到完整且有效的食材信息，请手动添加": "No complete, valid ingredient list was found. Please add it manually.",
  "导入失败，请稍后重试或手动添加": "Import failed. Try again or add the recipe manually.",
  "邮件服务尚未配置，可以先复制或下载清单": "Email isn't connected yet. Copy or download the list instead.",
  "请填写有效的邮箱地址": "Enter a valid email address.", "当前试用版仅向已配置的测试邮箱发送。你仍可复制或下载清单。": "This trial only sends to configured test recipients. You can still copy or download your list.",
  "没有待购买的食材": "There are no items left to buy.", "本次发送请求正在处理，请稍后检查邮箱": "This request is still processing. Check your inbox shortly.",
  "邮件已交给发送服务，请检查收件箱或垃圾邮件": "The email service accepted your list. Check your inbox or spam folder.",
  "暂时无法确认发送结果，请先检查收件箱，避免重复发送": "Delivery couldn't be confirmed. Check your inbox before trying again to avoid duplicates.",
  "请求过于频繁，请稍后再试": "Too many requests. Please try again later.",
  "请先登录，再保存你的清单": "Sign in to save your shopping list.",
  "无权访问这份清单": "You don't have access to this list.",
  "使用 ChatGPT 登录": "Sign in with ChatGPT",
  "正在安全连接…": "Connecting securely…",
  "暂时无法连接你的账户，请重试": "Couldn't connect to your account. Please try again.",
  "重试": "Try again",
  "退出登录": "Sign out",
  "登录后，食谱与购物清单会自动保存。": "Sign in to save your recipes and shopping list automatically.",
  "蔬菜水果": "Fruit & vegetables", "肉蛋奶": "Meat, eggs & dairy", "主食干货": "Grains & pantry", "调味品": "Oils & seasonings", "其他": "Other",
  "蒜香番茄意面": "Garlic & tomato pasta", "番茄黄瓜沙拉": "Tomato & cucumber salad",
  "意大利面": "Pasta", "番茄": "Tomatoes", "西红柿": "Tomatoes", "蒜": "Garlic", "大蒜": "Garlic", "橄榄油": "Olive oil", "盐": "Salt", "黄瓜": "Cucumber", "鸡蛋": "Eggs",
  "干面重量": "Dry weight", "按口味添加": "Adjust to taste", "克": "g", "千克": "kg", "毫升": "ml", "升": "L", "瓣": "cloves", "根": "whole", "个": "pieces", "汤匙": "tbsp", "茶匙": "tsp", "适量": "to taste",
  "一起买菜 · {count} 人份购物清单": "Pantry Weave · Shopping list for {count} servings",
  "仅合并明确可换算的单位，请核对原食谱。": "Only compatible units are combined. Please check the original recipes.",
};

export function translate(text: string, language: Language, values: Record<string, string | number> = {}) {
  const result = language === "en" && Object.hasOwn(english, text) ? english[text] : text;
  const interpolated = result.replace(/\{(\w+)\}/g, (match, key: string) => Object.hasOwn(values, key) ? String(values[key]) : match);
  return language === "en" && values.count === 1 ? interpolated.replace(/\b(recipes|ingredients|servings|items)\b/g, word => word.slice(0, -1)).replace(/\bentries\b/g, "entry") : interpolated;
}

export function errorMessage(error: unknown, language: Language) {
  const fallback = translate("操作未完成，请稍后重试", language);
  if (!error || typeof error !== "object") return fallback;
  const data = "data" in error ? error.data : undefined;
  if (data && typeof data === "object" && "kind" in data && data.kind === "RateLimited") return translate("请求过于频繁，请稍后再试", language);
  const message = typeof data === "string" ? data : error instanceof Error ? error.message : "";
  // Never expose arbitrary provider, validation, or stack-trace payloads to users.
  if (Object.hasOwn(english, message)) return translate(message, language);
  if (/^Line \d+:/.test(message) || /^第 \d+ 行/.test(message)) return message;
  return fallback;
}
