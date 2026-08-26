/* ==========================================================================
   数据层 · storage.js
   localStorage 读写、默认状态、种子数据、导入导出、schema 归一化与容错
   挂载到 window.GamePicker.storage
   ========================================================================== */
(function () {
  'use strict';
  var NS = (window.GamePicker = window.GamePicker || {});

  var KEY = 'gamepicker.v1';

  var DEFAULT_CATEGORIES = [
    { id: 'toy', name: '玩具', emoji: '🧸', color: '#FFB6A3' },
    { id: 'board', name: '桌游', emoji: '🎲', color: '#FFD98E' },
    { id: 'book', name: '绘本', emoji: '📚', color: '#A8E6CF' },
    { id: 'craft', name: '手工', emoji: '✂️', color: '#C3B1E1' },
    { id: 'play', name: '游戏玩法', emoji: '🎯', color: '#A0D8EF' },
    { id: 'outdoor', name: '户外', emoji: '🌳', color: '#FF8FA3' },
    { id: 'other', name: '其他', emoji: '🎈', color: '#E8C4A0' }
  ];

  var ENERGY = ['安静', '适中', '活跃'];
  var PLAYERS = ['独自', '亲子', '多人'];
  var INDOOR = ['室内', '户外', '皆可'];

  function genId() {
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }
  function now() { return Date.now(); }

  function clampInt(v, min, max, fallback) {
    var n = parseInt(v, 10);
    if (isNaN(n)) return fallback;
    return Math.max(min, Math.min(max, n));
  }

  /* ------------------------------------------------------------------ 示例数据 */
  function act(o) {
    return {
      id: o.id || genId(),
      name: o.name,
      categoryId: o.categoryId,
      emoji: o.emoji,
      description: o.description || '',
      materials: o.materials || '',
      durationMinutes: o.durationMinutes,
      energyLevel: o.energyLevel,
      players: o.players,
      indoorOutdoor: o.indoorOutdoor,
      tags: o.tags || [],
      favorite: !!o.favorite,
      lastPickedAt: null,
      pickCount: 0,
      createdAt: o.createdAt || now(),
      updatedAt: o.updatedAt || now()
    };
  }

  function sampleActivities() {
    var t = now();
    return [
      act({ name: '磁力片搭城堡', categoryId: 'toy', emoji: '🧲', durationMinutes: 30, energyLevel: '安静', players: '独自', indoorOutdoor: '室内', description: '用磁力片搭一座高高的城堡，再搭一条小桥让玩具车开过去。', materials: '磁力片', tags: ['搭建', '创意'], createdAt: t }),
      act({ name: '飞行棋大战', categoryId: 'board', emoji: '🎲', durationMinutes: 25, energyLevel: '适中', players: '多人', indoorOutdoor: '室内', description: '全家轮流掷骰子，谁的棋子先全部到达终点谁就赢。', materials: '飞行棋', tags: ['桌游', '亲子'], createdAt: t }),
      act({ name: '读《小猪佩奇》绘本', categoryId: 'book', emoji: '📖', durationMinutes: 15, energyLevel: '安静', players: '亲子', indoorOutdoor: '室内', description: '一起读一集小猪佩奇，边读边猜下一页会发生什么。', materials: '绘本', tags: ['阅读', '亲子'], createdAt: t }),
      act({ name: '纸盘做面具', categoryId: 'craft', emoji: '🎭', durationMinutes: 20, energyLevel: '适中', players: '亲子', indoorOutdoor: '室内', description: '在纸盘上画一张脸、剪出眼睛，绑上橡皮筋变成一个面具。', materials: '纸盘、彩笔、剪刀、橡皮筋', tags: ['手工', '创意'], createdAt: t }),
      act({ name: '藏宝图寻宝', categoryId: 'play', emoji: '🗺️', durationMinutes: 30, energyLevel: '活跃', players: '亲子', indoorOutdoor: '皆可', description: '画一张藏宝图，把一个小玩具藏起来，再按图去找。', materials: '纸、彩笔、小玩具', tags: ['寻宝', '亲子'], createdAt: t }),
      act({ name: '客厅障碍赛', categoryId: 'play', emoji: '🏃', durationMinutes: 20, energyLevel: '活跃', players: '多人', indoorOutdoor: '室内', description: '用抱枕和胶带搭一条赛道，绕障碍、钻桌底，比谁更快。', materials: '抱枕、胶带', tags: ['运动', '游戏'], createdAt: t }),
      act({ name: '叠叠乐', categoryId: 'toy', emoji: '🪵', durationMinutes: 15, energyLevel: '适中', players: '多人', indoorOutdoor: '室内', description: '轮流小心地抽木条，看谁让塔先倒下来。', materials: '叠叠乐', tags: ['平衡', '桌游'], createdAt: t }),
      act({ name: '橡皮泥捏小动物', categoryId: 'craft', emoji: '🐣', durationMinutes: 20, energyLevel: '安静', players: '独自', indoorOutdoor: '室内', description: '用橡皮泥捏一只小鸡、小兔子，再给它们摆一个小家。', materials: '橡皮泥', tags: ['手工', '安静'], createdAt: t }),
      act({ name: '拼图闯关', categoryId: 'toy', emoji: '🧩', durationMinutes: 25, energyLevel: '安静', players: '独自', indoorOutdoor: '室内', description: '从边缘开始拼，争取比上一次更快地完成。', materials: '拼图', tags: ['专注', '耐心'], createdAt: t }),
      act({ name: '猜猜我是谁', categoryId: 'board', emoji: '🕵️', durationMinutes: 15, energyLevel: '适中', players: '多人', indoorOutdoor: '室内', description: '一个人比划或描述，其他人来猜是哪种动物或物品。', materials: '无', tags: ['语言', '互动'], createdAt: t }),
      act({ name: '阳台吹泡泡', categoryId: 'outdoor', emoji: '🫧', durationMinutes: 20, energyLevel: '活跃', players: '亲子', indoorOutdoor: '户外', description: '到阳台或楼下吹泡泡，试着接住最大的那个泡泡。', materials: '泡泡水、泡泡棒', tags: ['户外', '观察'], createdAt: t }),
      act({ name: '贴纸故事书', categoryId: 'book', emoji: '🌟', durationMinutes: 15, energyLevel: '安静', players: '独自', indoorOutdoor: '室内', description: '用贴纸在空白本上贴出一个小故事，再讲给爸爸妈妈听。', materials: '贴纸、空白本', tags: ['阅读', '表达'], createdAt: t })
    ];
  }

  /* ------------------------------------------------------------------ 默认状态 */
  function defaultCategories() {
    return DEFAULT_CATEGORIES.map(function (c) {
      return { id: c.id, name: c.name, emoji: c.emoji, color: c.color };
    });
  }

  function defaultState() {
    return {
      schemaVersion: 1,
      settings: {
        userName: '小朋友',
        avoidRecentCount: 3,
        categories: defaultCategories()
      },
      activities: sampleActivities()
    };
  }

  /* ------------------------------------------------------------------ 归一化（导入 / 旧数据迁移用） */
  function normalizeCategories(list) {
    if (Array.isArray(list) && list.length) {
      var cats = [];
      list.forEach(function (c) {
        if (!c || !c.name) return;
        cats.push({
          id: c.id ? String(c.id) : genId(),
          name: String(c.name).slice(0, 20),
          emoji: c.emoji ? String(c.emoji).slice(0, 4) : '🎈',
          color: /^#[0-9a-fA-F]{6}$/.test(c.color) ? c.color : '#E8C4A0'
        });
      });
      if (cats.length) return cats;
    }
    return defaultCategories();
  }

  function normalizeActivity(a, id, cats) {
    var cat = cats[0];
    cats.forEach(function (c) { if (c.id === a.categoryId) cat = c; });
    return {
      id: id,
      name: String(a.name || '未命名活动').slice(0, 60),
      categoryId: cat.id,
      emoji: a.emoji ? String(a.emoji).slice(0, 4) : cat.emoji,
      description: String(a.description || ''),
      materials: String(a.materials || ''),
      durationMinutes: clampInt(a.durationMinutes, 1, 1000, 20),
      energyLevel: ENERGY.indexOf(a.energyLevel) !== -1 ? a.energyLevel : '适中',
      players: PLAYERS.indexOf(a.players) !== -1 ? a.players : '独自',
      indoorOutdoor: INDOOR.indexOf(a.indoorOutdoor) !== -1 ? a.indoorOutdoor : '室内',
      tags: Array.isArray(a.tags) ? a.tags.map(function (t) { return String(t).slice(0, 20); }).filter(Boolean) : [],
      favorite: !!a.favorite,
      lastPickedAt: (typeof a.lastPickedAt === 'number') ? a.lastPickedAt : null,
      pickCount: clampInt(a.pickCount, 0, 1000000, 0),
      createdAt: (typeof a.createdAt === 'number') ? a.createdAt : now(),
      updatedAt: (typeof a.updatedAt === 'number') ? a.updatedAt : now()
    };
  }

  function normalizeState(data) {
    var base = defaultState();
    var cats = normalizeCategories(data.settings && data.settings.categories);
    var out = {
      schemaVersion: 1,
      settings: {
        userName: (data.settings && typeof data.settings.userName === 'string') ? data.settings.userName : base.settings.userName,
        avoidRecentCount: clampInt(data.settings && data.settings.avoidRecentCount, 1, 10, 3),
        categories: cats
      },
      activities: []
    };
    var seen = {};
    (Array.isArray(data.activities) ? data.activities : []).forEach(function (a) {
      if (!a || typeof a !== 'object') return;
      var id = a.id ? String(a.id) : genId();
      if (seen[id]) return;
      seen[id] = true;
      out.activities.push(normalizeActivity(a, id, cats));
    });
    return out;
  }

  /* ------------------------------------------------------------------ 存储可用性 */
  function storageAvailable() {
    try {
      var k = '__gp_test__';
      localStorage.setItem(k, '1');
      localStorage.removeItem(k);
      return true;
    } catch (e) { return false; }
  }

  /* ------------------------------------------------------------------ 读写 */
  function loadState() {
    if (!storageAvailable()) {
      return { state: defaultState(), inMemory: true, corrupt: false };
    }
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) {
      return { state: defaultState(), inMemory: true, corrupt: false };
    }
    if (!raw) {
      var fresh = defaultState();
      saveState(fresh);
      return { state: fresh, inMemory: false, corrupt: false };
    }
    try {
      return { state: normalizeState(JSON.parse(raw)), inMemory: false, corrupt: false };
    } catch (e) {
      try { localStorage.setItem(KEY + '.corrupt', raw || ''); } catch (e2) {}
      var s = defaultState();
      try { saveState(s); } catch (e3) {}
      return { state: s, inMemory: false, corrupt: true };
    }
  }

  function saveState(state) {
    if (!storageAvailable()) return false;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch (e) { return false; }
  }

  /* ------------------------------------------------------------------ 导入导出 */
  function exportJSON(state) {
    var json = JSON.stringify(state, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    var d = new Date();
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    a.href = url;
    a.download = '游戏决策机备份-' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function importJSON(text) {
    try {
      var data = JSON.parse(text);
      if (!data || typeof data !== 'object' || !Array.isArray(data.activities)) {
        return { ok: false, error: '文件格式不正确：缺少 activities 列表' };
      }
      return { ok: true, state: normalizeState(data) };
    } catch (e) {
      return { ok: false, error: '无法解析 JSON：' + e.message };
    }
  }

  NS.storage = {
    KEY: KEY,
    DEFAULT_CATEGORIES: DEFAULT_CATEGORIES,
    genId: genId,
    now: now,
    defaultState: defaultState,
    normalizeState: normalizeState,
    loadState: loadState,
    saveState: saveState,
    exportJSON: exportJSON,
    importJSON: importJSON,
    resetSample: defaultState,
    storageAvailable: storageAvailable
  };
})();
