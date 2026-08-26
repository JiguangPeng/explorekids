/* ==========================================================================
   主控制器 · app.js
   渲染、表单、增删改查、类别管理、推荐交互与动画、视图切换
   依赖：storage.js、recommend.js（均挂载在 window.GamePicker）
   ========================================================================== */
(function () {
  'use strict';
  var S = window.GamePicker.storage;
  var R = window.GamePicker.recommend;

  var ENERGY = [ { v: '安静', e: '😌' }, { v: '适中', e: '🙂' }, { v: '活跃', e: '🤸' } ];
  var PLAYERS = [ { v: '独自', e: '🙋' }, { v: '亲子', e: '💞' }, { v: '多人', e: '👪' } ];
  var INDOOR = [ { v: '室内', e: '🏠' }, { v: '户外', e: '🌳' }, { v: '皆可', e: '🌈' } ];
  var EMOJIS = ['🧸','🎲','📚','✂️','🎯','🌳','🎈','🧩','🪵','🫧','🎭','🗺️','🏃','🕵️','📖','🖍️','🎨','🧱','🚗','🪁','🎪','🎵','🍪','🐣','🦄','⚽','🧁','🌟'];

  var state = null;
  var inMemory = false;
  var corrupt = false;
  var selectedFilterCategories = {}; // {id: true}
  var selectedLibCategory = null;
  var confirmCallback = null;
  var picking = false;
  var editingId = null;
  var toastTimer = null;
  var emojiAutoFollow = true;
  var selectedEmoji = '🧸';

  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function categoryById(id) {
    for (var i = 0; i < state.settings.categories.length; i++) {
      if (state.settings.categories[i].id === id) return state.settings.categories[i];
    }
    return state.settings.categories[0];
  }
  function activityById(id) {
    for (var i = 0; i < state.activities.length; i++) {
      if (state.activities[i].id === id) return state.activities[i];
    }
    return null;
  }
  function energyEmoji(v) { return emojiOf(ENERGY, v); }
  function playersEmoji(v) { return emojiOf(PLAYERS, v); }
  function indoorEmoji(v) { return emojiOf(INDOOR, v); }
  function emojiOf(list, v) {
    for (var i = 0; i < list.length; i++) if (list[i].v === v) return list[i].e;
    return '';
  }
  function durationText(a) {
    return (a.durationMinutes == null) ? '时长不限' : (a.durationMinutes + ' 分钟');
  }
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  function save() {
    var ok = S.saveState(state);
    inMemory = !ok;
    renderBanner();
    return ok;
  }

  /* ================= 初始化 ================= */
  function init() {
    var res = S.loadState();
    state = res.state;
    inMemory = res.inMemory;
    corrupt = res.corrupt;

    renderBanner();
    renderGreeting();
    renderFilterCategories();
    renderLibCategories();
    renderCategorySelect();
    renderEmojiPop();
    renderSegmented();
    renderLibrary();
    bindEvents();
    showView('recommend');
  }

  /* ================= 提示条 / 提示 ================= */
  function renderBanner() {
    var b = $('banner');
    if (inMemory) {
      b.hidden = false; b.className = 'banner warn';
      b.textContent = '⚠️ 浏览器存储不可用，数据仅在本次页面内保留，关闭后会丢失。';
    } else if (corrupt) {
      b.hidden = false; b.className = 'banner warn';
      b.textContent = '⚠️ 检测到本地数据损坏，已用示例数据恢复（原数据已备份到本地存储）。';
    } else {
      b.hidden = true;
    }
  }

  function toast(msg) {
    var t = $('toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 2400);
  }

  /* ================= 视图切换 ================= */
  function showView(name) {
    document.querySelectorAll('.view').forEach(function (v) { v.classList.remove('active'); });
    $('view-' + name).classList.add('active');
    document.querySelectorAll('.tab').forEach(function (t) {
      t.classList.toggle('active', t.getAttribute('data-view') === name);
    });
  }

  /* ================= 推荐视图 ================= */
  function renderGreeting() {
    $('greeting-text').textContent = '今天玩什么呀，' + (state.settings.userName || '派派') + '？';
  }

  function renderFilterCategories() {
    var box = $('filter-categories');
    box.innerHTML = '';
    state.settings.categories.forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'clay-chip' + (selectedFilterCategories[c.id] ? ' active' : '');
      b.innerHTML = '<span class="dot" style="background:' + esc(c.color) + '"></span>' + esc(c.emoji) + ' ' + esc(c.name);
      b.onclick = function () {
        if (selectedFilterCategories[c.id]) delete selectedFilterCategories[c.id];
        else selectedFilterCategories[c.id] = true;
        b.classList.toggle('active');
      };
      box.appendChild(b);
    });
  }

  function readFilterOptions() {
    return {
      categoryIds: Object.keys(selectedFilterCategories),
      duration: $('f-duration').value || null,
      energy: $('f-energy').value || null,
      players: $('f-players').value || null,
      indoorOutdoor: $('f-indoor').value || null
    };
  }

  function buildPool() {
    if ($('pure-random').checked) return state.activities.slice();
    return R.filter(state.activities, readFilterOptions());
  }

  function clearFilters() {
    selectedFilterCategories = {};
    $('f-duration').value = '';
    $('f-energy').value = '';
    $('f-players').value = '';
    $('f-indoor').value = '';
    renderFilterCategories();
    $('empty-pool').hidden = true;
  }

  function showEmptyPool(show, msg) {
    $('empty-pool').hidden = !show;
    if (show && msg) $('empty-pool').querySelector('p').textContent = msg;
    if (show) $('result-area').hidden = true;
  }

  function startPick() {
    if (picking) return;
    var pool = buildPool();
    if (!pool.length) {
      if (!state.activities.length) {
        showEmptyPool(true, '还没有活动，点右上角「添加活动」录入一件吧～');
      } else {
        showEmptyPool(true, '没有符合条件的活动，试试放宽筛选～');
      }
      return;
    }
    var result = R.pick(pool, Number(state.settings.avoidRecentCount) || 0);
    if (!result) { showEmptyPool(true, '暂时抽不出来，请稍后再试～'); return; }

    result.lastPickedAt = S.now();
    result.pickCount = (result.pickCount || 0) + 1;
    result.updatedAt = S.now();
    save();

    picking = true;
    $('pick-btn').disabled = true;
    $('reroll-btn').disabled = true;
    showEmptyPool(false);
    $('result-area').hidden = false;

    var card = $('result-card');
    var cat = categoryById(result.categoryId);
    card.style.setProperty('--card-color', cat.color);
    card.classList.remove('jelly');

    var displayPool = shuffle(pool.slice());
    var i = 0;
    var timer = setInterval(function () {
      var a = displayPool[i % displayPool.length];
      $('result-emoji').textContent = a.emoji || '🎉';
      $('result-name').textContent = a.name;
      i++;
    }, 60);

    setTimeout(function () {
      clearInterval(timer);
      showResult(result, cat);
      card.classList.add('jelly');
      confetti();
      picking = false;
      $('pick-btn').disabled = false;
      $('reroll-btn').disabled = false;
    }, 1500);
  }

  function showResult(a, cat) {
    $('result-emoji').textContent = a.emoji || '🎉';
    $('result-name').textContent = a.name;
    $('result-meta').innerHTML =
      '<span class="badge" style="background:' + esc(cat.color) + '">' + esc(cat.emoji) + ' ' + esc(cat.name) + '</span>' +
      '<span class="meta-chip">⏱️ ' + durationText(a) + '</span>' +
      '<span class="meta-chip">' + energyEmoji(a.energyLevel) + ' ' + a.energyLevel + '</span>' +
      '<span class="meta-chip">' + playersEmoji(a.players) + ' ' + a.players + '</span>' +
      '<span class="meta-chip">' + indoorEmoji(a.indoorOutdoor) + ' ' + a.indoorOutdoor + '</span>';
    var desc = $('result-desc');
    desc.textContent = a.description || '';
    desc.hidden = !a.description;
    var mat = $('result-materials');
    mat.textContent = a.materials ? '🧰 材料：' + a.materials : '';
    mat.hidden = !a.materials;
  }

  function confetti() {
    var colors = ['#FFB6A3', '#FFD98E', '#A8E6CF', '#C3B1E1', '#A0D8EF', '#FF8FA3'];
    var layer = $('confetti-layer');
    for (var i = 0; i < 50; i++) {
      var c = document.createElement('div');
      c.className = 'confetti';
      c.style.left = (Math.random() * 100) + 'vw';
      c.style.background = colors[Math.floor(Math.random() * colors.length)];
      c.style.animationDelay = (Math.random() * 0.4) + 's';
      c.style.width = (6 + Math.random() * 8) + 'px';
      c.style.height = (10 + Math.random() * 8) + 'px';
      layer.appendChild(c);
      (function (el) { setTimeout(function () { el.remove(); }, 3000); })(c);
    }
  }

  /* ================= 活动库视图 ================= */
  function renderLibCategories() {
    var box = $('lib-categories');
    box.innerHTML = '';
    var all = document.createElement('button');
    all.type = 'button';
    all.className = 'clay-chip' + (selectedLibCategory === null ? ' active' : '');
    all.textContent = '全部';
    all.onclick = function () { selectedLibCategory = null; renderLibCategories(); renderLibrary(); };
    box.appendChild(all);
    state.settings.categories.forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'clay-chip' + (selectedLibCategory === c.id ? ' active' : '');
      b.innerHTML = esc(c.emoji) + ' ' + esc(c.name);
      b.onclick = function () { selectedLibCategory = c.id; renderLibCategories(); renderLibrary(); };
      box.appendChild(b);
    });
  }

  function renderStats() {
    var box = $('stats');
    var html = '<span class="stat">🎉 共 <b>' + state.activities.length + '</b> 件</span>';
    state.settings.categories.forEach(function (c) {
      var n = state.activities.filter(function (a) { return a.categoryId === c.id; }).length;
      if (n > 0) html += '<span class="stat">' + esc(c.emoji) + ' ' + esc(c.name) + ' <b>' + n + '</b></span>';
    });
    box.innerHTML = html;
  }

  function renderLibrary() {
    var q = $('search').value.trim().toLowerCase();
    var sortBy = $('sort').value;
    var list = state.activities.slice();

    if (selectedLibCategory) list = list.filter(function (a) { return a.categoryId === selectedLibCategory; });
    if (q) {
      list = list.filter(function (a) {
        return (a.name || '').toLowerCase().indexOf(q) !== -1 ||
               (a.description || '').toLowerCase().indexOf(q) !== -1 ||
               (a.materials || '').toLowerCase().indexOf(q) !== -1 ||
               (a.tags || []).some(function (t) { return t.toLowerCase().indexOf(q) !== -1; });
      });
    }

    if (sortBy === 'name') list.sort(function (a, b) { return (a.name || '').localeCompare(b.name || '', 'zh'); });
    else if (sortBy === 'duration') list.sort(function (a, b) { return (a.durationMinutes || 0) - (b.durationMinutes || 0); });
    else if (sortBy === 'favorite') list.sort(function (a, b) { return (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0); });
    else list.sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });

    renderStats();

    var grid = $('activity-grid');
    grid.innerHTML = '';
    list.forEach(function (a) { grid.appendChild(buildCard(a)); });

    var empty = $('lib-empty');
    if (!state.activities.length) {
      empty.hidden = false;
      empty.querySelector('p').textContent = '📭 还没有活动，点「添加活动」录入第一件吧～';
    } else if (!list.length) {
      empty.hidden = false;
      empty.querySelector('p').textContent = '🔍 没有找到匹配的活动，换个关键词或类别试试～';
    } else {
      empty.hidden = true;
    }
  }

  function buildCard(a) {
    var cat = categoryById(a.categoryId);
    var card = document.createElement('div');
    card.className = 'clay-card activity-card';
    card.style.setProperty('--card-color', cat.color);
    card.innerHTML =
      '<div class="card-emoji">' + esc(a.emoji) + '</div>' +
      '<div class="card-body">' +
        '<div class="card-title-row"><h3>' + esc(a.name) + '</h3>' + (a.favorite ? '<span class="fav-star">⭐</span>' : '') + '</div>' +
        '<span class="badge" style="background:' + esc(cat.color) + '">' + esc(cat.emoji) + ' ' + esc(cat.name) + '</span>' +
        '<div class="card-meta">' +
          '<span>⏱️ ' + durationText(a) + '</span>' +
          '<span>' + energyEmoji(a.energyLevel) + ' ' + a.energyLevel + '</span>' +
          '<span>' + playersEmoji(a.players) + ' ' + a.players + '</span>' +
          '<span>' + indoorEmoji(a.indoorOutdoor) + ' ' + a.indoorOutdoor + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="card-actions">' +
        '<button class="icon-btn" data-action="fav" title="收藏">' + (a.favorite ? '⭐' : '☆') + '</button>' +
        '<button class="icon-btn" data-action="edit" title="编辑">✏️</button>' +
        '<button class="icon-btn" data-action="del" title="删除">🗑️</button>' +
      '</div>';

    card.querySelector('[data-action="fav"]').onclick = function () {
      a.favorite = !a.favorite;
      a.updatedAt = S.now();
      save();
      renderLibrary();
    };
    card.querySelector('[data-action="edit"]').onclick = function () { openForm(a); };
    card.querySelector('[data-action="del"]').onclick = function () { confirmDelete(a); };
    return card;
  }

  /* ================= 表单（添加/编辑） ================= */
  function renderCategorySelect() {
    var sel = $('f-category');
    var prev = sel.value;
    sel.innerHTML = '';
    state.settings.categories.forEach(function (c) {
      var o = document.createElement('option');
      o.value = c.id;
      o.textContent = c.emoji + ' ' + c.name;
      sel.appendChild(o);
    });
    if (prev) sel.value = prev;
  }

  function renderEmojiPop() {
    var pop = $('emoji-pop');
    pop.innerHTML = '';
    EMOJIS.forEach(function (e) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = e;
      b.onclick = function () {
        setEmoji(e, false);
        closeEmojiPop();
      };
      pop.appendChild(b);
    });
  }

  function setEmoji(e, followCategory) {
    selectedEmoji = e || '🧸';
    emojiAutoFollow = !!followCategory;
    $('emoji-trigger').textContent = selectedEmoji;
    highlightSelectedEmoji();
  }

  function highlightSelectedEmoji() {
    var pop = $('emoji-pop');
    pop.querySelectorAll('button').forEach(function (b) {
      b.classList.toggle('selected', b.textContent === selectedEmoji);
    });
  }

  function toggleEmojiPop() {
    var pop = $('emoji-pop');
    if (pop.hidden) {
      highlightSelectedEmoji();
      pop.hidden = false;
    } else {
      pop.hidden = true;
    }
  }
  function closeEmojiPop() { $('emoji-pop').hidden = true; }

  function renderSegmented() {
    buildSegmented($('f-energy-seg'), 'seg-energy', ENERGY, '适中');
    buildSegmented($('f-players-seg'), 'seg-players', PLAYERS, '独自');
    buildSegmented($('f-indoor-seg'), 'seg-indoor', INDOOR, '室内');
  }

  function buildSegmented(box, name, items, def) {
    box.innerHTML = '';
    items.forEach(function (it) {
      var id = name + '-' + it.v;
      var input = document.createElement('input');
      input.type = 'radio';
      input.name = name;
      input.id = id;
      input.value = it.v;
      if (it.v === def) input.checked = true;
      var label = document.createElement('label');
      label.htmlFor = id;
      label.textContent = it.e + ' ' + it.v;
      box.appendChild(input);
      box.appendChild(label);
    });
  }

  function segValue(name) {
    var el = document.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : null;
  }
  function setSegValue(name, value) {
    var el = document.querySelector('input[name="' + name + '"][value="' + value + '"]');
    if (el) el.checked = true;
  }

  function openForm(a) {
    editingId = a ? a.id : null;
    $('form-title').textContent = a ? '✏️ 编辑活动' : '➕ 添加活动';
    $('f-id').value = a ? a.id : '';
    renderCategorySelect();
    $('f-category').value = a ? a.categoryId : (state.settings.categories[0] ? state.settings.categories[0].id : '');
    $('f-name').value = a ? a.name : '';
    $('f-duration-min').value = a && a.durationMinutes != null ? a.durationMinutes : '';
    var cat0 = categoryById($('f-category').value);
    setEmoji(a ? a.emoji : (cat0 ? cat0.emoji : EMOJIS[0]), !a);
    $('f-desc').value = a ? a.description : '';
    $('f-materials').value = a ? a.materials : '';
    $('f-tags').value = a ? (a.tags || []).join(', ') : '';
    $('f-favorite').checked = a ? !!a.favorite : false;
    setSegValue('seg-energy', a ? a.energyLevel : '适中');
    setSegValue('seg-players', a ? a.players : '独自');
    setSegValue('seg-indoor', a ? a.indoorOutdoor : '室内');
    clearShake();
    openModal('form-modal');
  }

  function validateForm() {
    if (!$('f-name').value.trim()) { fail($('f-name'), '请填写活动名称～'); return false; }
    var raw = $('f-duration-min').value.trim();
    if (raw !== '') {
      var d = Number(raw);
      if (!Number.isInteger(d) || d < 1 || d > 1000) { fail($('f-duration-min'), '请填写 1–1000 的分钟数～'); return false; }
    }
    return true;
  }

  function fail(input, msg) {
    input.classList.remove('shake');
    void input.offsetWidth;
    input.classList.add('shake');
    toast(msg);
    input.focus();
  }
  function clearShake() {
    document.querySelectorAll('.shake').forEach(function (el) { el.classList.remove('shake'); });
  }

  function submitForm(e) {
    e.preventDefault();
    if (!validateForm()) return;
    var cat = categoryById($('f-category').value);
    var data = {
      name: $('f-name').value.trim(),
      categoryId: $('f-category').value,
      emoji: selectedEmoji || (cat ? cat.emoji : '🎈'),
      durationMinutes: $('f-duration-min').value.trim() === '' ? null : parseInt($('f-duration-min').value, 10),
      energyLevel: segValue('seg-energy'),
      players: segValue('seg-players'),
      indoorOutdoor: segValue('seg-indoor'),
      description: $('f-desc').value.trim(),
      materials: $('f-materials').value.trim(),
      tags: $('f-tags').value.split(/[,，]/).map(function (t) { return t.trim(); }).filter(Boolean),
      favorite: $('f-favorite').checked
    };

    if (editingId) {
      var existing = activityById(editingId);
      if (existing) {
        for (var k in data) existing[k] = data[k];
        existing.updatedAt = S.now();
      }
    } else {
      var fresh = { id: S.genId(), lastPickedAt: null, pickCount: 0, createdAt: S.now(), updatedAt: S.now() };
      for (var k2 in data) fresh[k2] = data[k2];
      state.activities.unshift(fresh);
    }

    save();
    closeModal('form-modal');
    renderLibrary();
    toast(editingId ? '✏️ 已保存修改～' : '🎉 新增成功！');
    showView('library');
  }

  /* ================= 删除确认 ================= */
  function confirmDelete(a) {
    showConfirm('删除活动', '确定删除「' + a.name + '」吗？删掉后不可恢复。', function () {
      state.activities = state.activities.filter(function (x) { return x.id !== a.id; });
      save();
      renderLibrary();
      toast('🗑️ 已删除');
    });
  }

  /* ================= 通用确认弹窗 ================= */
  function showConfirm(title, message, cb) {
    $('confirm-title').textContent = title;
    $('confirm-message').textContent = message;
    confirmCallback = cb;
    openModal('confirm-modal');
  }

  /* ================= 设置 ================= */
  function openSettings() {
    $('s-name').value = state.settings.userName;
    $('s-avoid').value = state.settings.avoidRecentCount;
    renderCategoryList();
    openModal('settings-modal');
  }

  function renderCategoryList() {
    var box = $('category-list');
    box.innerHTML = '';
    state.settings.categories.forEach(function (c, i) {
      var row = document.createElement('div');
      row.className = 'category-row';
      row.innerHTML =
        '<input type="text" class="clay-input" data-i="' + i + '" data-k="emoji" value="' + esc(c.emoji) + '" maxlength="4" title="图标">' +
        '<input type="text" class="clay-input" data-i="' + i + '" data-k="name" value="' + esc(c.name) + '" maxlength="20" title="名称">' +
        '<input type="color" data-i="' + i + '" data-k="color" value="' + esc(c.color) + '" title="颜色">' +
        '<button type="button" class="icon-btn" data-delcat="' + i + '" title="删除类别">🗑️</button>';
      box.appendChild(row);
    });
    box.querySelectorAll('[data-delcat]').forEach(function (btn) {
      btn.onclick = function () { deleteCategory(parseInt(btn.getAttribute('data-delcat'), 10)); };
    });
  }

  function deleteCategory(i) {
    var c = state.settings.categories[i];
    if (!c) return;
    if (state.settings.categories.length <= 1) { toast('至少保留一个类别～'); return; }
    var fallback = state.settings.categories[i === 0 ? 1 : 0];
    var count = state.activities.filter(function (a) { return a.categoryId === c.id; }).length;
    var msg = '删除类别「' + c.name + '」？';
    if (count > 0) msg += ' 该类别下 ' + count + ' 个活动会移到「' + fallback.name + '」。';
    showConfirm('删除类别', msg, function () {
      state.settings.categories.splice(i, 1);
      state.activities.forEach(function (a) { if (a.categoryId === c.id) a.categoryId = fallback.id; });
      save();
      renderCategoryList();
      refreshAfterCategoryChange();
    });
  }

  function refreshAfterCategoryChange() {
    selectedFilterCategories = {};
    selectedLibCategory = null;
    renderFilterCategories();
    renderLibCategories();
    renderCategorySelect();
    renderLibrary();
  }

  function saveSettings() {
    var name = $('s-name').value.trim() || '派派';
    var avoid = parseInt($('s-avoid').value, 10);
    if (isNaN(avoid) || avoid < 1 || avoid > 10) avoid = 3;

    var cats = [];
    var ok = true;
    $('category-list').querySelectorAll('.category-row').forEach(function (row) {
      var emoji = row.querySelector('[data-k="emoji"]').value.trim();
      var cname = row.querySelector('[data-k="name"]').value.trim();
      var color = row.querySelector('[data-k="color"]').value;
      var i = parseInt(row.querySelector('[data-k="emoji"]').getAttribute('data-i'), 10);
      var old = state.settings.categories[i];
      if (!cname) { ok = false; toast('类别名称不能为空～'); return; }
      cats.push({
        id: old ? old.id : S.genId(),
        name: cname,
        emoji: emoji || '🎈',
        color: /^#[0-9a-fA-F]{6}$/.test(color) ? color : '#E8C4A0'
      });
    });
    if (!ok) return;

    state.settings.userName = name;
    state.settings.avoidRecentCount = avoid;
    state.settings.categories = cats;
    save();
    closeModal('settings-modal');
    refreshAfterCategoryChange();
    renderGreeting();
    toast('💾 设置已保存');
  }

  function importFile() {
    var input = $('import-file');
    var f = input.files && input.files[0];
    if (!f) return;
    var reader = new FileReader();
    reader.onload = function () {
      var res = S.importJSON(String(reader.result || ''));
      if (res.ok) {
        state = res.state;
        save();
        closeModal('settings-modal');
        refreshAfterCategoryChange();
        renderGreeting();
        toast('📥 导入成功，共 ' + state.activities.length + ' 个活动');
      } else {
        toast('❌ ' + res.error);
      }
    };
    reader.readAsText(f);
    input.value = '';
  }

  /* ================= 弹窗开关 ================= */
  function openModal(id) { $(id).hidden = false; }
  function closeModal(id) { $(id).hidden = true; }

  /* ================= 事件绑定 ================= */
  function bindEvents() {
    document.querySelectorAll('.tab').forEach(function (t) {
      t.onclick = function () { showView(t.getAttribute('data-view')); };
    });

    $('open-form').onclick = function () { openForm(null); };
    $('open-settings').onclick = openSettings;

    document.querySelectorAll('[data-close]').forEach(function (b) {
      b.onclick = function () { closeModal(b.getAttribute('data-close')); };
    });
    document.querySelectorAll('.modal-backdrop').forEach(function (bd) {
      bd.addEventListener('click', function (e) { if (e.target === bd) bd.hidden = true; });
    });

    $('activity-form').addEventListener('submit', submitForm);
    $('f-category').addEventListener('change', function () {
      var c = categoryById(this.value);
      if (c && emojiAutoFollow) setEmoji(c.emoji, true);
    });
    $('emoji-trigger').addEventListener('click', function (e) {
      e.stopPropagation();
      toggleEmojiPop();
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.emoji-pick')) closeEmojiPop();
    });

    $('pick-btn').onclick = startPick;
    $('reroll-btn').onclick = startPick;
    $('confirm-btn').onclick = function () { confetti(); toast('🎉 玩得开心～'); };

    $('toggle-filters').onclick = function () { $('filter-panel').hidden = !$('filter-panel').hidden; };
    $('clear-filters').onclick = clearFilters;
    $('clear-filters-2').onclick = clearFilters;
    $('pure-random').addEventListener('change', function () {
      $('pure-random').closest('.pure-random').classList.toggle('active', this.checked);
    });

    $('search').addEventListener('input', renderLibrary);
    $('sort').addEventListener('change', renderLibrary);

    $('add-category').onclick = function () {
      state.settings.categories.push({ id: S.genId(), name: '新类别', emoji: '🎈', color: '#E8C4A0' });
      renderCategoryList();
    };
    $('save-settings').onclick = saveSettings;
    $('export-btn').onclick = function () { S.exportJSON(state); toast('📤 已导出备份'); };
    $('import-btn').onclick = function () { $('import-file').click(); };
    $('import-file').addEventListener('change', importFile);
    $('reset-sample').onclick = function () {
      showConfirm('恢复示例数据', '将用示例数据覆盖当前所有数据，确定吗？（建议先导出备份）', function () {
        state = S.resetSample();
        save();
        closeModal('settings-modal');
        refreshAfterCategoryChange();
        renderGreeting();
        toast('🧪 已恢复示例数据');
      });
    };
    $('clear-all').onclick = function () {
      showConfirm('清空全部数据', '将删除全部活动（类别保留），此操作不可恢复。确定吗？', function () {
        state.activities = [];
        save();
        renderLibrary();
        closeModal('settings-modal');
        toast('🗑️ 已清空全部活动');
      });
    };

    $('confirm-ok').onclick = function () {
      closeModal('confirm-modal');
      if (confirmCallback) { var cb = confirmCallback; confirmCallback = null; cb(); }
    };
    $('confirm-cancel').onclick = function () { closeModal('confirm-modal'); confirmCallback = null; };
  }

  init();
})();
