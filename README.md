# 🧭 探索派 · 深圳亲子周末

GitHub 仓库：<https://github.com/JiguangPeng/explorekids>

给 6 岁小朋友做的「家里无聊时，帮我选一件好玩的事」网页应用。默认称呼为“小朋友”。家长把家里已有的玩具、桌游、绘本、手工、游戏玩法录入进去，小朋友（或家长）点一个巨大的黏土按钮，配合洗牌 + 果冻弹跳 + 彩带动画，随机或按条件推荐一件可以做的事。

界面全程采用 **黏土质感（Claymorphism）** 风格：马卡龙色、超大圆角、哑光表面、外部投影 + 内部高光/阴影、按压时「被按扁」的果冻回弹、凹槽式输入框。

## 快速开始

无需安装、无需构建、无网络依赖，两种方式任选其一：

1. **双击 `index.html`** 用浏览器直接打开（推荐，最省事）。
2. 或在本目录启动一个静态服务器：

   ```bash
   python3 -m http.server 8000
   # 浏览器访问 http://localhost:8000
   ```

首次打开会自动载入 30 条中英双语示例活动，覆盖学习、玩具、桌游、绘本、手工、角色游戏和运动七类。可在设置中切换中文 / English。

## 功能

| 区域 | 说明 |
|---|---|
| 🎲 推荐 | 巨大「开始」按钮随机抽取；可按类别筛选或「纯随机」；结果卡片展示双语玩法与材料，可「换一个」或「就玩这个」 |
| 💬 聊聊天 | 面向 5–7 岁儿童的双语亲子聊天卡；9 类主题筛选、随机抽题、追问与轻量科普；逻辑题支持隐藏答案 |
| 📦 活动库 | 搜索、类别筛选、排序、收藏；统计各类别数量；编辑 / 删除（带确认） |
| ➕ 添加活动 | 中文名称、English name、双语玩法与材料、类别、图标和收藏 |
| ⚙️ 设置 | 昵称、语言、语音开关、试听、手机端添加到桌面说明、导出/导入 JSON 备份、更新内置活动、清空 |

## 数据存储与维护

- 内置目录与用户状态分离：`js/play-data.js`、`js/chat-data.js`、`js/outing-data.js` 负责可人工维护的内容；浏览器继续使用原有 `localStorage` 的 `gamepicker.v2` 键保存 v3 用户增量状态。
- v3 状态只保存自定义内容、内置内容覆盖、删除标记、收藏和抽取统计，不重复保存完整内置目录，减少存储体积并避免内容漂移。
- 旧版 `gamepicker.v2` / `gamepicker.v1` 会在首次加载时自动迁移到 v3；迁移后不会重复拼接旧活动。
- `localStorage` 按来源隔离：`file://`、localhost 和 GitHub Pages 的数据不会自动共享。
- 隐私模式或存储被禁用时会自动降级为内存态，并显示黄色提示条。
- 数据损坏时会自动备份到 `gamepicker.v1.corrupt` 并回退到示例数据。
- 若要安装为独立 App，请通过 `http://` 或 `https://` 网址访问，再按设置页中的 iPhone / Android 步骤添加到桌面；直接双击 `file://` 文件不能完整安装 PWA。

## 双语界面

- 默认使用中文，可在「设置 → 语言 / Language」切换 English。
- 活动名称、玩法说明、材料、类别和界面提示均提供中英文版本。

## 文件结构

```
index.html          页面骨架与弹窗
styles.css          黏土质感设计系统 + 全部动画
  js/storage.js       数据层（v3 增量状态、旧版迁移、归一化）
  js/play-data.js     玩一玩内置目录（可人工维护）
  js/recommend.js     推荐引擎（纯函数：过滤 + 加权随机 + 避免近期重复）
  js/chat-data.js     聊天话题目录（约 72 条中英双语卡片，含逻辑思维题）
  js/chat.js          聊天抽题逻辑（筛选 + 避免连续重复）
  js/app.js           主控制器（渲染、表单、增删改查、动画、视图切换）
assets/icons/       内置活动 SVG 图标（纸飞机、蹦床等特殊场景）
README.md           本文件
```

JS 通过普通 `<script>` 顺序加载（非 ES Module，因此 `file://` 双击也能用），统一挂载到全局命名空间 `window.GamePicker`。

## 聊天话题设计思路

聊天页定位为“以聊代教”的亲子沟通工具，不是知识考核清单。问题面向 5–7 岁儿童，优先使用短句、具体场景和容易朗读的表达；一次建议只聊 1–2 张卡，孩子可以回答“不知道”“不想说”，也可以暂时沉默。

### 逻辑思维题怎么聊

- “你是怎么想到的”比答案重要 100 倍，先听思路，再讨论答案。
- 多追问一句“还有别的可能吗”，帮助孩子发现多种解释。
- 猜谜题一次只给一个线索，避免变成记忆题。
- 家长可以故意答错，让孩子来解释和纠正。
- 5–6 岁以分类、简单因果、规律和生活推理为主；6–7 岁再加入数量守恒、传递关系和镜像问题。
- 不用“对 / 错”收尾，普通题可说“原来你是这么想的”。
- 孩子开始乱猜、明显疲倦或不想继续时，立即停下，不把聊天变成测验。
- 有标准答案的问题要诚实说明；没有唯一答案的问题要明确“可以有很多种可能”。

逻辑卡片会先隐藏答案，优先展示“先说思路”和思路提示；家长点击“查看答案”后才显示一种可能的解释。开放推理题不会伪装成唯一答案。

### 其他内容的编排原则

- 睡前题强调安全感、感谢、想象和轻松收尾。
- 情绪题帮助孩子给感受命名，先接住情绪，再聊发生了什么。
- 科普题只提供一条简短事实，并鼓励一起观察、实验或查绘本，不“装傻”。
- 想象题允许拟人化和天马行空，不急于纠正孩子的世界观。
- 亲子、社交、生活和复盘题关注真实场景中的选择、表达和下一步。

内容参考 UNICEF Parenting、Kids Mental Health Foundation、NASA Space Place，以及项目内的《亲子聊天话题清单_5-7岁.md》；页面中的具体问题均经过儿童化改写。

## 活动图标规范与本地资源

- 图标优先级：语义明确的 Unicode / Noto Color Emoji → 项目内置 SVG → 本地 iconfont（仅在确有必要时）。本项目当前不使用外链 iconfont 或网络字体。
- 本地 SVG 位于 `assets/icons/`，运行时必须登记在 `js/app.js` 的白名单中，并提供 Emoji 回退。
- 文件名使用英文 kebab-case，表达对象或动作；新增图标时同步记录匹配活动、选择理由和回退图标。

当前 SVG 映射：

| 文件 | 活动 | Emoji 回退 |
|---|---|---|
| `literacy.svg` | 洪恩识字 | ✍️ |
| `english-learning.svg` | 学习英语 | 🗣️ |
| `lego-animal-park.svg` | 乐高搭动物乐园 | 🧱 |
| `building-blocks.svg` | 积木搭小房子 | 🧱 |
| `three-little-pigs.svg` | 三只小猪 | 🐷 |
| `paper-airplane.svg` | 折纸飞机比赛 | 📄 |
| `trampoline.svg` | 蹦床 | 🤸 |
| `pull-up-bar.svg` | 吊单杠 | 🧗 |
| `sit-ups.svg` | 仰卧起坐 | 💪 |

“手工创作”使用剪刀 `✂️`；LEGO 没有标准 Emoji，因此使用积木砖近似表达。内置活动带有 `source: "builtin"` 和稳定 `catalogId`，自定义活动带有 `source: "custom"`。

## 如何扩展

### 1. 调整固定类别
当前目录固定为七类。如需调整，请修改 `js/storage.js` 中的默认类别和示例活动，并提高目录版本号以触发迁移。

### 2. 新增活动字段（例如「需要大人陪同」）
- `js/storage.js`：在 `act()` / `normalizeActivity()` 中补充字段默认值与校验。
- `js/app.js`：表单加输入控件、`submitForm()` 读取、`buildCard()` / `showResult()` 展示。
- `index.html`：表单区加对应输入元素。

### 3. 新增推荐维度（例如「按天气」）
- `js/recommend.js` 的 `filter()` 里加一个 `if (options.xxx ...) return false;` 分支。
- `index.html` 加筛选控件，`app.js` 的 `readFilterOptions()` 读出来即可。

### 4. 换抽取动画
- 洗牌 + 果冻在 `app.js` 的 `startPick()`；彩带在 `confetti()`；关键帧都在 `styles.css` 末尾。
- 想加「转盘」，只需把结果卡片换成 CSS 旋转的转盘，复用 `R.pick()` 的结果即可。

### 5. 换配色
直接改 `styles.css` 顶部 `:root` 里的马卡龙色变量与阴影变量即可全局生效。

## 自动化部署（GitHub Actions → GitHub Pages）

仓库已内置 `.github/workflows/deploy.yml`：每次推送 `main` 分支，GitHub Actions 自动把站点发布到 GitHub Pages，全程免费、无需手动上传。

### 一次性开通步骤
1. 在 [github.com](https://github.com) 新建一个空仓库（**不要**勾选初始化 README）。
2. 回到本目录，关联远程并推送：
   ```bash
   git remote add origin https://github.com/<你的用户名>/<仓库名>.git
   git branch -M main
   git push -u origin main
   ```
3. 打开仓库 **Settings → Pages**，把 **Source** 设为 **GitHub Actions**。
4. 首次推送会触发自动部署；在 **Actions** 页能看到运行记录，成功后站点地址为 `https://<你的用户名>.github.io/<仓库名>/`。

之后每次改动只需三行命令，页面自动更新：

```bash
git add -A
git commit -m "描述这次改了什么"
git push
```

### Gitee 说明
Gitee Pages 已停服、无法用于托管；但可把 Gitee 作为国内代码镜像仓库（国内拉取/推送更快）：

```bash
git remote add gitee https://gitee.com/<用户名>/<仓库名>.git
git push gitee main
```

真正的托管与自动化部署仍走 GitHub Actions → GitHub Pages（或 Cloudflare Pages）。

## 控制台自测

打开页面后按 F12，在控制台粘贴运行：

```js
// 1. 过滤：类别为「玩具」的活动数量
GamePicker.recommend.filter(GamePicker.storage.defaultState().activities, { categoryIds: ['toy'] }).length
// 期望：7

// 2. 抽取：连续抽 5 次，避免最近 3 个
(function () {
  var S = GamePicker.storage, R = GamePicker.recommend;
  var pool = S.defaultState().activities.slice();
  var ids = [];
  for (var i = 0; i < 5; i++) {
    var p = R.pick(pool, 3);
    p.lastPickedAt = S.now();
    ids.push(p.nameZh || p.nameEn);
  }
  console.log(ids);
})();
// 期望：前 4 次不应出现重复名称（第 5 次可能开始重复）
```

## 验收清单

- [ ] 双击 `index.html` 能打开并显示示例数据
- [ ] 增删改活动后刷新仍保留
- [ ] 纯随机抽取有效、有洗牌 + 果冻 + 彩带动画、不连续重复
- [ ] 各类别筛选只出匹配项；无结果时优雅提示
- [ ] 删除全部活动后提示「还没有活动」；清空 localStorage 后重新种子
- [ ] 导入 → 导出 → 再导入数据完整；导入非法文件有报错且不覆盖
- [ ] 手机窄屏 / 平板 / 桌面三档布局正常，触控点足够大
