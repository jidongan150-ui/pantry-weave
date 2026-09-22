# Pantry Weave：提交准备包

核对日期：2026-09-22。此文件为准备材料，**不是已提交记录**。

## 发布方式

本次交付手机和电脑浏览器可用的网站。沿用
https://pantry-weave-recipes.jidongan150.chatgpt.site ，不迁移托管、不制作原生安装包。
2026-09-21 已按用户授权公开。全新无登录浏览器已验证无需邀请访问、食谱链接导入、保存与刷新。
PWA 可以后续增加主屏幕安装体验，但没有实现或验收，不能在材料中称已有 App。
ChatGPT 识图与云端保存需要联网；下载好的清单 PNG 可以离线查看。

## 官方要求与当前状态

来源：https://www.convex.dev/hackathons/all-gas
以及 https://luma.com/convex-allgas-hackathon 。

| 要求 | 已核实状态 | 提交前动作 |
| --- | --- | --- |
| 8 月 25 日后开始的新项目 | Git 构建日志记录为 9 月 18 日 | 保留真实历史 |
| Convex 数据库、函数和实时更新 | 已实现并有测试记录 | 录制真实同步过程 |
| 合作方集成 | 用 Codex 构建；OpenAI/Firecrawl/AgentMail 产品调用尚未实测 | 不能以 Gemini/Puter 代替赞助方实用集成的证据；完成实际接入或明确确认资格 |
| convex.site / chatgpt.site 网址 | 已公开，未登录新会话验证通过 | 保留现有网址 |
| 公开 GitHub 仓库 | https://github.com/jidongan150-ui/pantry-weave；源代码已上传 | 已包含 MIT 许可证、第三方许可及构建日志 |
| 根目录 hackathon.md | 已存在 | 加上最终仓库、演示链接与实测结论 |
| 不到 3 分钟的演示 | 1:55.04 英文配音字幕成片，见仓库 demo 目录 | 免登录正式站点实录；未展示现场识图、云端登录及同步 |
| X 或 LinkedIn 分享 | 文案草稿已准备，未发布 | 使用实际成品和最终链接，标注四家赞助方 |
| 提交表单 | 未提交 | 使用下方官方准确入口 |

官方提交入口：
https://vibeapps.dev/judging/convex-all-gas-hackathon-openai/submit?utm_source=luma

截止为 2026-09-22 12:00 PM PT，即北京时间 2026-09-23 03:00。
不要把截止时间当作开始上传视频的时间，材料齐备后尽早提交。

## 最小真实验收

使用已有 ChatGPT 对话上传图片，并使用网站提供的识别说明；不要求新注册 Puter。
当前已通过助手整理结果 → 链接导入 → 核对 → 合并 → PNG 的生产预览验证。
真实 ChatGPT 客户端中点击所生成链接、首次登录返回和真人手机体验仍需确认。
不记录密码、令牌、付款资料或包含敏感信息的截图。

| 样本 | 预先核对的内容 | 当前验证状态 |
| --- | --- | --- |
| 原番茄炒蛋图 | 菜名、食材、步骤中的水/牛奶替代；未知份数和用量不猜 | 助手整理 7 项主食材＋2 项替代；链接导入与 PNG 通过 |
| 公开英文胡萝卜汤图 | 食材完整性、汤块/汤底不重复、可选香料 | 完整 JSON 备用入口回归通过；非盲测 |
| Apple Coleslaw 英文图 | 12 份、蛋黄酱和红糖均 1/3 杯、卷心菜替代 | 本次重新看图后导入；分数、替代选择、两道菜合并通过 |
| 公开英文燕麦食谱 | 小分数、替代材料、可选项、产量不冒充人数 | 待测 |
| 一张未参与调试的新食谱 | 测试前先独立列出原图事实 | 待选、待测 |

每张记录：选用模型、识别耗时、遗漏、错误数量、是否猜测、是否需要修改，
以及账户能提供的额度变化。不能使用模型自己对自己的评分代替核对。
若清晰食谱仍有严重数量错误或多处漏项，不将其宣传成可靠的一键识别。

还要用两个独立用户完成：上传/识别 → 加入 → 添加第二道菜 → 合并 → 改人数
→ 勾选家中已有 → 导出 PNG → 刷新/重新登录。确认没有串读他人清单。
真实手机至少验证 ChatGPT 图片附件、链接返回以及导出图片保存。

## 英文项目说明草稿

Pantry Weave turns several recipes into one practical grocery list. Add recipes,
combine compatible ingredients, adjust servings when the source gives a serving
count, and check off what you already have. Download the remaining items as a
single shopping-list image to take to the store. English and Chinese interfaces
help users review and edit the list; unfamiliar terms may retain the original text.

Convex stores each signed-in user's recipes and shopping state and keeps changes
in sync. Users read recipe photos in their existing ChatGPT conversation and open
a recipe link to review the result here. This is a link handoff, not an in-site
model API or a published ChatGPT plugin. Local OCR and manual entry remain
available. Unknown amounts stay unknown; users confirm image-derived ingredients
before saving. Signed-out lists are stored in the current browser.

发布这段说明时同时披露真实验收状态。没有测试通过，不得加入准确率、
“instant”“perfect”“unlimited free”或“no review needed”等承诺。

## 2 分 40 秒演示脚本

录制前：关闭密码、账户额度明细、管理页面；只展示普通食谱和演示清单。
录制中保持英文界面为主，展示一次中文切换。明确区分 ChatGPT 识图和网站导入，不伪装成网站内部一键识图。
本地验收录像只能展示链接导入后的功能，不能作为真实云端同步或完整 ChatGPT 客户端交接已通过的证据。

| 时间 | 画面操作 | 简短讲解 |
| --- | --- | --- |
| 0:00–0:15 | 展示两张食谱和空清单 | “Planning dinner should not mean rewriting every ingredient.” |
| 0:15–0:55 | 展示在 ChatGPT 识别的结果链接，打开后核对并加入 | “Read the photo in ChatGPT, open its recipe link, and review the ingredients here.” |
| 0:55–1:20 | 加入第二道已有明确份数的食谱 | “Shared ingredients are combined when their units are compatible.” |
| 1:20–1:45 | 调整人数；勾掉已有食材 | “Scale stated servings and remove what is already in your pantry.” |
| 1:45–2:05 | 两个属于本人同一账户的窗口同步 | “Convex keeps the shopping list in sync.” |
| 2:05–2:25 | 切换中文再切回英文，导出清单图片 | “Save one clear list for the grocery store.” |
| 2:25–2:40 | 显示最终网址与限制 | “Image reading happens in your ChatGPT conversation. Review results before shopping.” |

慢请求可剪辑等待，但标注加速/剪辑，不把模拟响应当真实识别。
若识别未通过，改录已验证的手动/本地流程并说明限制，不能沿用上面的自动识别承诺。
赞助方功能只有真实联测成功后才纳入录制，不显示不可用按钮冒充已接入。

## 待准备的最终链接

- 可由评委访问的应用：沿用现有网址，已公开并通过无登录访问检查。
- 公开仓库：https://github.com/jidongan150-ui/pantry-weave
- 演示视频：https://raw.githubusercontent.com/jidongan150-ui/pantry-weave/main/demo/pantry-weave-demo.mp4
- 视频说明：https://github.com/jidongan150-ui/pantry-weave/tree/main/demo 。此为公开 MP4；若提交表单限定视频平台，需按实际字段要求另行上传。
- 社交帖子：文案已准备，最终链接和发布待完成。

这些链接齐备前不点击最终提交，不编造占位链接。

## 已制作的演示草稿

`outputs/pantry-weave-demo-draft.mp4`：约 76 秒，1440×1000，英文字幕。
展示真实本地界面里的食谱链接导入、核对、中英文切换、替代选择、合并、
人数调整、勾选和图片导出。使用当前助手在录制前从图片整理的结果。
字幕明确说明本地演示、识图发生在对话中，不宣称演示了自动 API 或云端同步。
此文件在本机，尚未上传为公开视频；最终比赛演示还需补充真实云端流程。

## 社交文案草稿（未发布）

I built Pantry Weave for the Convex All Gas Hackathon: several recipes, one grocery
list. Read a recipe photo in ChatGPT, follow its import link, review the ingredients,
and combine what you need. Adjust stated servings, tick off pantry items, and save
one shopping-list image. English and Chinese interfaces are included.

Built with Convex and Codex. Image reading happens in your ChatGPT conversation;
the website does not automatically use your ChatGPT subscription as an API.

Try it: https://pantry-weave-recipes.jidongan150.chatgpt.site

@convex @OpenAI @firecrawl @agentmail #ConvexHackathon

公开站点、仓库和最终演示就绪后，再加入仓库/视频链接并由用户确认发布。
标签为赛事要求，不代表 Firecrawl 或 AgentMail 已完成产品联测。
