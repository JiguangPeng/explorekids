# 🧭 探索派 · 深圳亲子周末

GitHub 仓库：<https://github.com/JiguangPeng/explorekids>

探索派是一个纯前端、移动端优先的亲子周末助手，包含三个独立模块：玩一玩、聊聊天、去哪里。内容目录使用本地 JavaScript 文件维护，用户的新增、编辑、收藏和抽取统计保存在浏览器 localStorage 中。

## 快速开始

无需安装或构建，可直接双击 `index.html`，或启动静态服务器：

```bash
python3 -m http.server 8000
```

然后访问 <http://localhost:8000>。PWA 安装需要通过 `http://` 或 `https://` 打开，设置页提供 iPhone / Android 添加到桌面的步骤。

## 数据存储

当前版本只使用一个键：`explorekids.state.v1`。旧版 `gamepicker.*` 和 `explorekids.state.v3` 不再读取或迁移。

内置目录与用户增量状态分离：

- `js/play-data.js`：玩一玩目录
- `js/chat-data.js`：聊天卡片目录
- `js/outing-data.js`：深圳及周边地点目录
- `js/storage.js`：v1 状态、增量覆盖、收藏、删除标记和统计

存储状态按模块隔离，包含 `customItems`、`overrides`、`deletedBuiltinIds`、`favorites`、`stats` 和 `lastPickedId`。浏览器存储不可用时自动使用内存状态；JSON 损坏时回退到新的默认目录。

## 功能边界

- 玩一玩：按分类随机抽取家庭活动，支持收藏和独立活动库管理。
- 聊聊天：双语聊天卡、追问、小知识、思路提示和轻翻牌抽卡动效。
- 去哪里：深圳市内与深圳周边地点，支持区域、类型、室内外和时长筛选，随机推荐和手机默认地图搜索。
- 三个模块分别管理，管理面板支持搜索、新增、编辑、收藏和删除。
- 不包含导入 / 导出、最近推荐排除、预算字段和语音模块。

## 文件结构

```text
index.html          页面骨架、三个模块、管理抽屉和设置弹窗
styles.css          黏土质感设计系统、响应式布局和模块动效
js/storage.js       explorekids.state.v1 数据层
js/play-data.js     玩一玩内置目录
js/chat-data.js     聊聊天内置目录
js/outing-data.js   深圳及周边地点目录
js/app.js           推荐、筛选、管理、表单、语言和 PWA 交互
icons/              SVG 源文件与 PWA PNG 图标
assets/icons/       活动语义 SVG 图标
sw.js               PWA 离线缓存
```

## 手工维护目录

内置内容使用稳定的 `id`，编辑目录文件后刷新页面即可看到新内容。用户对内置内容的编辑会写入 `overrides`，删除会写入 `deletedBuiltinIds`，因此不会把整份内置目录重复写进 localStorage。
