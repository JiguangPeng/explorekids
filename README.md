# 🎲 游戏决策机 · 今天玩什么

给 5 岁小女孩做的「家里无聊时，帮我选一件好玩的事」网页应用。家长把家里已有的玩具、桌游、绘本、手工、游戏玩法录入进去，小朋友（或家长）点一个巨大的黏土按钮，配合洗牌 + 果冻弹跳 + 彩带动画，随机或按条件推荐一件可以做的事。

界面全程采用 **黏土质感（Claymorphism）** 风格：马卡龙色、超大圆角、哑光表面、外部投影 + 内部高光/阴影、按压时「被按扁」的果冻回弹、凹槽式输入框。

## 快速开始

无需安装、无需构建、无网络依赖，两种方式任选其一：

1. **双击 `index.html`** 用浏览器直接打开（推荐，最省事）。
2. 或在本目录启动一个静态服务器：

   ```bash
   python3 -m http.server 8000
   # 浏览器访问 http://localhost:8000
   ```

首次打开会自动载入 12 条示例活动，立刻就能点「开始」体验。

## 功能

| 区域 | 说明 |
|---|---|
| 🎲 推荐 | 巨大「开始」按钮随机抽取；可选筛选（类别/时长/精力/人数/室内外）或「纯随机」；结果卡片展示玩法与材料，可「换一个」或「就玩这个」 |
| 📦 活动库 | 搜索、类别筛选、排序、收藏；统计各类别数量；编辑 / 删除（带确认） |
| ➕ 添加活动 | 名称、类别、图标（emoji 点选或输入）、时长、精力、人数、室内外、玩法说明、材料、标签、收藏 |
| ⚙️ 设置 | 昵称、避免连续重复数、类别管理（增删改、颜色）、导出/导入 JSON 备份、恢复示例数据、清空 |

## 数据存储与备份

- 所有数据保存在浏览器 `localStorage` 的 `gamepicker.v1` 键下，刷新/关闭后仍在（同一浏览器）。
- 隐私模式或存储被禁用时会自动降级为内存态，并显示黄色提示条。
- 数据损坏时会自动备份到 `gamepicker.v1.corrupt` 并回退到示例数据。
- **建议定期「⚙️ → 导出备份」** 生成 JSON 文件，换设备或浏览器时用「导入备份」还原。

## 文件结构

```
index.html          页面骨架与弹窗
styles.css          黏土质感设计系统 + 全部动画
js/storage.js       数据层（localStorage、种子数据、导入导出、归一化）
js/recommend.js     推荐引擎（纯函数：过滤 + 加权随机 + 避免近期重复）
js/app.js           主控制器（渲染、表单、增删改查、动画、视图切换）
README.md           本文件
```

JS 通过普通 `<script>` 顺序加载（非 ES Module，因此 `file://` 双击也能用），统一挂载到全局命名空间 `window.GamePicker`。

## 如何扩展

### 1. 新增类别
直接在「⚙️ 设置 → 类别管理」里新增即可，无需改代码。可自定义名称、图标（emoji）、颜色。

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
// 期望：3

// 2. 过滤：时长「短」且精力「安静」
GamePicker.recommend.filter(GamePicker.storage.defaultState().activities, { duration: 'short', energy: '安静' }).length
// 期望：>= 1

// 3. 抽取：连续抽 5 次，避免最近 3 个（候选池 12 个）
(function () {
  var S = GamePicker.storage, R = GamePicker.recommend;
  var pool = S.defaultState().activities.slice();
  var ids = [];
  for (var i = 0; i < 5; i++) {
    var p = R.pick(pool, 3);
    p.lastPickedAt = S.now();
    ids.push(p.name);
  }
  console.log(ids);
})();
// 期望：前 4 次不应出现重复名称（第 5 次可能开始重复）
```

## 验收清单

- [ ] 双击 `index.html` 能打开并显示示例数据
- [ ] 增删改活动后刷新仍保留
- [ ] 纯随机抽取有效、有洗牌 + 果冻 + 彩带动画、不连续重复
- [ ] 各类别/时长/精力/人数/室内外筛选只出匹配项；无结果时优雅提示
- [ ] 删除全部活动后提示「还没有活动」；清空 localStorage 后重新种子
- [ ] 导入 → 导出 → 再导入数据完整；导入非法文件有报错且不覆盖
- [ ] 手机窄屏 / 平板 / 桌面三档布局正常，触控点足够大
