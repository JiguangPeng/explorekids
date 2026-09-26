(function () {
  'use strict';
  var S = GamePicker.storage, state = null, moduleKey = 'play', installPrompt = null, currentChat = null, currentPlay = null, currentOuting = null;
  var selected = { play: [], chat: [], outing: [] }, favOnly = { play: false, chat: false, outing: false }, outingRegion = '全部', busy = false;
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]; }); }
  function save() { S.saveState(state); }
  function mod(k) { return state.modules[k]; }
  function cat(m, id) { return m.categories.find(function (c) { return c.id === id; }) || m.categories[0]; }
  function itemName(a) { return state.settings.language === 'en-US' ? (a.nameEn || a.nameZh) : (a.nameZh || a.nameEn); }
  function isEn(){ return state && state.settings.language === 'en-US'; }
  function tr(zh,en){ return isEn() ? en : zh; }
  function childName(){ var n = state && state.settings && String(state.settings.userName || '').trim(); return n || (isEn() ? 'friend' : '小朋友'); }
  function applyLanguage(){
    var en=isEn(); document.documentElement.lang=en?'en':'zh-CN'; document.title=en?'ExploreKids · Family Time':'探索派 · 亲子时光';
    var name=childName();
    var slogan=document.querySelector('.brand-slogan'); if(slogan)slogan.textContent=tr('一起玩，一起聊，一起探索','Play together, chat together, explore together');
    var nav=document.querySelectorAll('.tab'); if(nav.length){nav[0].textContent='🧸 '+tr('玩一玩','Play');nav[1].textContent='💭 '+tr('聊聊天','Chat');nav[2].textContent='🧭 '+tr('去哪里','Go out');}
    $('open-settings').title=tr('设置','Settings'); $('open-settings').setAttribute('aria-label',tr('设置','Settings'));
    document.querySelector('#view-play h1').textContent=en ? name + ', what shall we play?' : name + '，现在玩什么？';
    document.querySelector('#view-play .subtitle').textContent=tr('点一下，让探索派帮你挑一个亲子活动～','Tap once and let ExploreKids pick a family activity.');
    document.querySelector('#view-chat h1').textContent=en ? name + ', what shall we talk about?' : name + '，我们聊点什么呢？';
    document.querySelector('#view-chat .subtitle').textContent=tr('没有标准答案，认真听彼此说就很好～','There is no perfect answer—listening is what matters.'); document.querySelector('#view-chat .chat-mascot').textContent='💭';
    document.querySelector('#view-outing h1').textContent=en ? name + ', where shall we go?' : name + '，想去哪里？';
    document.querySelector('#view-outing .subtitle').textContent=tr('从深圳市内和周边，挑一个轻松去处～','Pick an easy family destination in Shenzhen or nearby.');
    document.querySelector('#play-pick .hero-btn-main').textContent=tr('开始','Start'); document.querySelector('#play-pick .hero-btn-sub').textContent=tr('点我抽一个','Pick one');
    document.querySelector('#outing-pick .hero-btn-main').textContent=tr('出发','Go'); document.querySelector('#outing-pick .hero-btn-sub').textContent=tr('帮我选个地方','Pick a place');
    $('chat-pick').innerHTML='<span class="chat-pick-emoji">🎴</span>'+tr('抽一张聊天卡','Draw a chat card'); $('chat-reroll').textContent='💫 '+tr('换一个','Another one'); $('chat-answer').textContent='💡 '+tr('查看答案','Show answer');
    if ($('chat-hint-btn')) $('chat-hint-btn').textContent='🧭 '+tr('看看思路','Show a hint');
    if ($('chat-fav') && (!currentChat || $('chat-card').hidden)) $('chat-fav').textContent='☆ '+tr('收藏','Save');
    else if ($('chat-fav') && currentChat) $('chat-fav').textContent=favLabel(currentChat);
    document.querySelectorAll('.manage-trigger').forEach(function(b){b.textContent='📦 '+tr('管理','Manage');});
    var pf=document.querySelector('[data-toggle="play-filter"]'), cf=$('chat-filter-toggle'), of=$('outing-filter-toggle'); if(pf)pf.innerHTML='🎯 <span>'+tr('筛选','Filter')+'</span><span class="filter-summary" id="play-summary"></span>'; if(cf)cf.innerHTML='🎯 <span>'+tr('选择话题','Topics')+'</span><span class="filter-summary" id="chat-selected"></span>'; if(of)of.innerHTML='🎯 <span>'+tr('筛选','Filter')+'</span><span class="filter-summary" id="outing-summary"></span>'; updateSummaries();
    $('drawer-close').setAttribute('aria-label',tr('关闭','Close')); document.querySelector('#settings-modal h2').textContent='⚙️ '+tr('设置','Settings'); document.querySelector('#settings-modal .field').firstChild.textContent=tr('我的名字','Your name'); document.querySelectorAll('#settings-modal .field')[1].firstChild.textContent=tr('语言','Language');
    var installNote=$('install-note');
    if (installNote) installNote.textContent = location.protocol === 'file:'
      ? tr('请通过 http:// 或 https:// 网址打开；直接打开本地文件无法安装。','Open ExploreKids over http:// or https://. A local file cannot be installed.')
      : tr('安装后可像普通 APP 一样从桌面打开探索派。','Install ExploreKids and open it from your home screen like a regular app.');
    document.querySelectorAll('#settings-modal details')[0].querySelector('summary').textContent='iPhone / iPad Safari'; document.querySelectorAll('#settings-modal details')[1].querySelector('summary').textContent='Android Chrome';
    var steps= document.querySelectorAll('#settings-modal details ol'); if(en){steps[0].innerHTML='<li>Open ExploreKids in Safari</li><li>Tap the Share button</li><li>Choose “Add to Home Screen”</li>';steps[1].innerHTML='<li>Open ExploreKids in Chrome</li><li>Tap the menu</li><li>Choose “Install app” or “Add to Home screen”</li>';}
    else {steps[0].innerHTML='<li>使用 Safari 打开探索派网址</li><li>点击底部“分享”按钮</li><li>选择“添加到主屏幕”并确认</li>';steps[1].innerHTML='<li>使用 Chrome 打开探索派网址</li><li>点击右上角菜单</li><li>选择“安装应用”或“添加到主屏幕”</li>';}
    var indoor=$('outing-indoor'), duration=$('outing-duration'); if(indoor){indoor.options[0].text=tr('室内/室外不限','Indoor / outdoor');indoor.options[0].value='';indoor.options[1].text=tr('室内','Indoor');indoor.options[1].value='室内';indoor.options[2].text=tr('室外','Outdoor');indoor.options[2].value='室外';} if(duration){duration.options[0].text=tr('时长不限','Any duration');duration.options[1].text=tr('2小时左右','About 2 hours');duration.options[2].text=tr('半天','Half day');duration.options[3].text=tr('一天','Full day');duration.options[4].text=tr('1–2天','1–2 days');}
    renderCategories('play','play-categories'); renderCategories('chat','chat-categories'); renderOutingFilters(); updateSummaries();
    if (currentPlay && $('play-result') && $('play-result').querySelector('.result-card')) renderPlayResult(currentPlay, false);
    if (currentOuting && $('outing-result') && $('outing-result').querySelector('.result-card')) renderOutingResult(currentOuting, false);
    if (currentChat && $('chat-card') && !$('chat-card').hidden) renderChat(currentChat, false);
  }
  function iconMarkup(a) { var icons=[['三只小猪','three-little-pigs.svg'],['乐高','lego-animal-park.svg'],['磁力片','building-blocks.svg'],['磁力块','building-blocks.svg'],['纸飞机','paper-airplane.svg'],['绘本','literacy.svg'],['英语','english-learning.svg'],['蹦床','trampoline.svg'],['单杠','pull-up-bar.svg'],['仰卧','sit-ups.svg']]; var name=a.nameZh||''; var hit=icons.find(function(pair){return name.indexOf(pair[0])>=0;}); return hit ? '<img class="activity-icon-svg" src="assets/icons/'+hit[1]+'" alt="">' : esc(a.emoji||'🎈'); }
  function burst(kind) { if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return; var layer=$('confetti-layer'); if(!layer)return; var icons=kind==='chat'?['✦','✧','💜']:kind==='outing'?['➜','✦','🧭']:['●','✦','★','🎈']; for(var i=0;i<14;i++){var s=document.createElement('span');s.className='fx-particle fx-'+kind;s.textContent=icons[i%icons.length];s.style.left=(35+Math.random()*30)+'%';s.style.top=(30+Math.random()*18)+'%';s.style.setProperty('--dx',((Math.random()-.5)*180)+'px');s.style.setProperty('--dy',((Math.random()-.5)*180)+'px');layer.appendChild(s);(function(node){setTimeout(function(){node.remove();},900);})(s);}}
  function showView(v) { document.querySelectorAll('.view').forEach(function (x) { x.classList.toggle('active', x.id === 'view-' + v); }); document.querySelectorAll('.tab').forEach(function (x) { x.classList.toggle('active', x.dataset.view === v); }); document.body.dataset.module=v; moduleKey = v; }
  function summaryText(k) { var parts = []; if (favOnly[k]) parts.push(tr('最爱','Favorites')); if (selected[k].length) parts.push(selected[k].length + ' ' + tr('个分类','categories')); return parts.join(' · '); }
  function renderCategories(k, id) { var m = mod(k), box = $(id); if (!box) return; box.innerHTML = ''; var fav = document.createElement('button'); fav.type = 'button'; fav.className = 'clay-chip' + (favOnly[k] ? ' active' : ''); fav.textContent = '⭐ ' + tr('最爱','Favorites'); fav.onclick = function () { favOnly[k] = !favOnly[k]; renderCategories(k, id); updateSummaries(); }; box.appendChild(fav); m.categories.forEach(function (c) { var b = document.createElement('button'); b.type = 'button'; b.className = 'clay-chip' + (selected[k].indexOf(c.id) >= 0 ? ' active' : ''); b.textContent = c.emoji + ' ' + (isEn() ? c.nameEn : c.nameZh); b.onclick = function () { var i = selected[k].indexOf(c.id); if (i >= 0) selected[k].splice(i, 1); else selected[k].push(c.id); renderCategories(k, id); updateSummaries(); }; box.appendChild(b); }); }
  function updateSummaries() { $('play-summary').textContent = summaryText('play') || tr('全部','All'); $('chat-selected').textContent = summaryText('chat') || tr('全部','All'); var regionLabel = outingRegion === '全部' ? '' : (isEn() ? ({深圳市内:'Shenzhen',深圳周边:'Nearby Shenzhen'}[outingRegion] || outingRegion) : outingRegion); var outingParts = []; if (regionLabel) outingParts.push(regionLabel); if (summaryText('outing')) outingParts.push(summaryText('outing')); $('outing-summary').textContent = outingParts.join(' · ') || tr('全部','All'); }
  function showEmpty(box) { box.hidden = false; box.innerHTML = '<div class="empty-pool"><p>' + esc(tr('这个条件下没有可抽的内容，换个筛选再试试。','Nothing matches these filters. Try a different combination.')) + '</p></div>'; }
  var toastTimer;
  function toast(msg) { var el = $('toast'); if (!el) return; el.textContent = msg; el.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(function () { el.hidden = true; }, 2400); }
  function pickOne(list, lastId) { var pool = list; if (lastId && list.length > 1) { var rest = list.filter(function (a) { return a.id !== lastId; }); if (rest.length) pool = rest; } return pool[Math.floor(Math.random() * pool.length)]; }
  function rememberPick(m, a) { a.lastPickedAt = S.now(); a.pickCount = (a.pickCount || 0) + 1; m.lastPickedId = a.id; save(); }
  function favLabel(a) { return a.favorite ? '⭐ ' + tr('已收藏','Saved') : '☆ ' + tr('收藏','Save'); }
  function bindResultFav(box, a, rerender) { var btn = box.querySelector('[data-fav-result]'); if (!btn) return; btn.onclick = function () { a.favorite = !a.favorite; save(); rerender(); }; }
  function poolOf(k) { return mod(k).items.filter(function (a) { if (favOnly[k] && !a.favorite) return false; if (selected[k].length && selected[k].indexOf(a.categoryId) < 0) return false; if (k === 'outing') { var io = $('outing-indoor').value, dur = $('outing-duration').value; if (outingRegion !== '全部' && a.region !== outingRegion) return false; if (io && String(a.indoorOutdoor || '').indexOf(io) < 0) return false; if (!S.durationMatches(a.duration, dur)) return false; } return true; }); }
  function renderPlayResult(a, animate) { currentPlay = a; var box = $('play-result'); box.hidden = false; box.innerHTML = '<div class="result-card play-result-card' + (animate ? ' result-jelly' : '') + '"><div class="result-emoji clay-orb">' + iconMarkup(a) + '</div><h2>' + esc(itemName(a)) + '</h2><p class="result-desc">' + esc(isEn() ? (a.descriptionEn || a.descriptionZh || '') : (a.descriptionZh || '')) + '</p><div class="result-actions"><button class="clay-btn" data-fav-result="1">' + favLabel(a) + '</button><button class="clay-btn primary" id="play-again">💫 ' + tr('换一个','Another one') + '</button></div></div>'; $('play-again').onclick = playPick; bindResultFav(box, a, function () { renderPlayResult(a, false); }); }
  function playPick() { if (busy) return; var m = mod('play'), pool = poolOf('play'); if (!pool.length) { showEmpty($('play-result')); return; } busy = true; var box = $('play-result'), i = 0; box.hidden = false; box.innerHTML = '<div class="result-card play-result-card"><div class="result-emoji clay-orb" id="play-result-emoji">🎲</div><h2 id="play-result-name">' + tr('正在选择…','Choosing…') + '</h2></div>'; var timer = setInterval(function () { var spinning = pool[i++ % pool.length]; var emoji = $('play-result-emoji'), name = $('play-result-name'); if (!emoji || !name) return; emoji.textContent = spinning.emoji || '🎈'; name.textContent = itemName(spinning); }, 70); setTimeout(function () { clearInterval(timer); var a = pickOne(pool, m.lastPickedId); rememberPick(m, a); renderPlayResult(a, true); burst('play'); busy = false; }, 700); }
  function renderChat(a, staged) {
    currentChat = a;
    var card = $('chat-card'), en = isEn(), c = cat(mod('chat'), a.categoryId);
    card.hidden = false;
    $('chat-emoji').textContent = a.emoji || '💬';
    $('chat-badge').textContent = c ? c.emoji + ' ' + (en ? c.nameEn : c.nameZh) : '';
    $('chat-prompt').textContent = en ? (a.promptEn || a.descriptionEn || a.nameEn) : (a.promptZh || a.descriptionZh || a.nameZh);
    $('chat-followups').innerHTML = '';
    ['chat-fact','chat-hint','chat-answer-box','chat-thinking'].forEach(function (id) { var el = $(id); if (!el) return; el.hidden = true; el.textContent = ''; });
    var follow = en ? (a.followUpsEn || a.followUpsZh || []) : (a.followUpsZh || []);
    var fact = en ? (a.factEn || '') : (a.factZh || '');
    var answer = en ? (a.answerEn || '') : (a.answerZh || '');
    var hint = en ? (a.hintEn || '') : (a.hintZh || '');
    var thinking = en ? (a.thinkingPromptEn || '') : (a.thinkingPromptZh || '');
    if (thinking && $('chat-thinking')) { $('chat-thinking').hidden = false; $('chat-thinking').textContent = thinking; }
    var hintBtn = $('chat-hint-btn');
    if (hintBtn) {
      hintBtn.hidden = !hint;
      hintBtn.textContent = '🧭 ' + tr('看看思路', 'Show a hint');
      hintBtn.onclick = hint ? function () {
        $('chat-hint').hidden = false;
        $('chat-hint').innerHTML = '<div class="chat-fact-title">' + esc(tr('思路提示', 'A way to think')) + '</div><p>' + esc(hint) + '</p>';
        hintBtn.hidden = true;
      } : null;
    }
    function showFollow() { $('chat-followups').innerHTML = follow.map(function (x) { return '<span class="chat-followup">' + esc(x) + '</span>'; }).join(''); if (staged) $('chat-followups').classList.add('chat-segment-in'); }
    function showFact() {
      if (fact) { $('chat-fact').hidden = false; $('chat-fact').innerHTML = '<div class="chat-fact-title">' + esc(tr('小知识', 'A little fact')) + '</div><p>' + esc(fact) + '</p>'; if (staged) $('chat-fact').classList.add('chat-segment-in'); }
      $('chat-answer').hidden = !answer;
      $('chat-answer').textContent = '💡 ' + tr('查看答案', 'Show answer');
      $('chat-answer').onclick = function () {
        $('chat-answer-box').hidden = false;
        $('chat-answer-box').innerHTML = '<div class="chat-fact-title">' + esc(tr('参考答案', 'One possible answer')) + '</div><p>' + esc(answer) + '</p>';
        $('chat-answer').hidden = true;
      };
    }
    if (staged) { setTimeout(showFollow, 120); setTimeout(showFact, 250); } else { showFollow(); showFact(); }
    var favBtn = $('chat-fav');
    if (favBtn) { favBtn.hidden = false; favBtn.textContent = favLabel(a); favBtn.onclick = function () { a.favorite = !a.favorite; save(); favBtn.textContent = favLabel(a); }; }
  }
  function chatPick() {
    if (busy) return;
    var m = mod('chat'), pool = poolOf('chat');
    if (!pool.length) { toast(tr('这个话题下没有卡片，换个筛选再试试。','No cards match these topics. Try another filter.')); return; }
    busy = true;
    var button = $('chat-pick'), card = $('chat-card'), a = pickOne(pool, m.lastPickedId);
    button.disabled = true; button.classList.remove('is-dealing'); void button.offsetWidth; button.classList.add('is-dealing');
    card.hidden = false; card.classList.remove('is-dealing'); void card.offsetWidth; card.classList.add('is-dealing');
    renderChat(a, true);
    rememberPick(m, a); burst('chat');
    setTimeout(function () { button.disabled = false; button.classList.remove('is-dealing'); busy = false; }, 620);
  }
  function renderOutingFilters() { var r = $('outing-region'); r.innerHTML = ''; ['全部','深圳市内','深圳周边'].forEach(function (x) { var b = document.createElement('button'); b.type = 'button'; b.className = 'clay-chip' + (outingRegion === x ? ' active' : ''); b.textContent = isEn()?({全部:'All',深圳市内:'Shenzhen',深圳周边:'Nearby'}[x]):x; b.onclick = function () { outingRegion = x; renderOutingFilters(); updateSummaries(); }; r.appendChild(b); }); renderCategories('outing', 'outing-categories'); updateSummaries(); }
  function renderOutingResult(a, animate) {
    currentOuting = a;
    var box = $('outing-result'), en = isEn();
    var region = en ? ({深圳市内:'Shenzhen',深圳周边:'Nearby Shenzhen'}[a.region] || a.region) : a.region;
    var indoor = en ? ({室内:'Indoor',室外:'Outdoor','室内/室外':'Indoor / outdoor'}[a.indoorOutdoor] || a.indoorOutdoor || '') : (a.indoorOutdoor || '');
    var duration = en ? ({半天:'Half day',一天:'Full day','1–2天':'1–2 days','2小时':'2 hours','2–3小时':'2–3 hours'}[a.duration] || a.duration || '') : (a.duration || '');
    var area = a.area && a.area !== a.region ? '<span class="badge">' + esc(a.area) + '</span>' : '';
    var pitch = S.outingPitch(a);
    var notesText = a.notes && a.notes !== a.highlights && a.notes !== pitch ? a.notes : '';
    var visitBits = Array.isArray(a.visitHistory) ? a.visitHistory.filter(function (v) { return v && (!notesText || notesText.indexOf(v) < 0); }) : [];
    var notes = notesText ? '<div class="outing-notes"><strong>' + esc(tr('出行笔记','Notes')) + '</strong><br>' + esc(notesText) + '</div>' : '';
    var visits = visitBits.length ? '<div class="outing-visits"><strong>' + esc(tr('去过','Been there')) + '</strong><br>' + esc(visitBits.join(' · ')) + '</div>' : '';
    var meta = [indoor, duration].filter(Boolean).join(' · ');
    box.hidden = false;
    box.innerHTML = '<div class="result-card outing-card' + (animate ? ' outing-result-in' : '') + '"><div class="outing-route-icon' + (animate ? ' compass-spin' : '') + '">✦</div><h2>' + esc(en ? (a.nameEn || a.nameZh) : a.nameZh) + '</h2><div class="result-meta"><span class="badge">' + esc(region) + '</span>' + area + '</div>' + (pitch ? '<p class="result-desc">' + esc(pitch) + '</p>' : '') + (meta ? '<p class="result-materials">' + esc(meta) + '</p>' : '') + notes + visits + '<div class="result-actions outing-actions"><button class="clay-btn" data-fav-result="1">' + favLabel(a) + '</button><button class="clay-btn primary map-btn">🗺️ ' + tr('地图搜索','Open map') + '</button><button class="clay-btn outing-again">💫 ' + tr('换一个','Another one') + '</button></div></div>';
    box.querySelector('.map-btn').onclick = function () { var q = encodeURIComponent(S.mapQuery(a)); var ua = navigator.userAgent || ''; if (/iPhone|iPad|iPod/i.test(ua)) window.location.href = 'maps://?q=' + q; else if (/Android/i.test(ua)) window.location.href = 'geo:0,0?q=' + q; else window.open('https://www.google.com/maps/search/?api=1&query=' + q, '_blank'); };
    box.querySelector('.outing-again').onclick = outingPick;
    bindResultFav(box, a, function () { renderOutingResult(a, false); });
  }
  function outingPick() { if (busy) return; var m = mod('outing'), pool = poolOf('outing'); if (!pool.length) { showEmpty($('outing-result')); return; } busy = true; var a = pickOne(pool, m.lastPickedId); renderOutingResult(a, true); rememberPick(m, a); burst('outing'); setTimeout(function () { busy = false; }, 720); }
  function renderManager(k) { var m = mod(k), c = $('drawer-content'), list = m.items.slice(); c.innerHTML = '<div class="drawer-tools"><input id="manager-search" class="clay-input" placeholder="🔍 '+tr('搜索本模块内容','Search this library')+'"><button id="manager-add" class="clay-btn small">➕ '+tr('新增','Add')+'</button></div><div class="drawer-count">'+(isEn()?'Total: ':'共 ')+list.length+(isEn()?' items':' 条')+'</div><div class="manager-list">' + list.map(function (a) { var x = cat(m, a.categoryId); var blurb = k === 'outing' ? (S.outingPitch(a) || '') : (isEn() ? (a.descriptionEn || a.descriptionZh || a.highlights || '') : (a.descriptionZh || a.highlights || '')); var notes = !isEn() && a.notes && a.notes !== blurb ? '<br>' + esc(a.notes) : ''; return '<div class="manager-item"><div class="manager-main"><div class="manager-icon">' + iconMarkup(a) + '</div><div><h3>' + esc(itemName(a)) + '</h3><span class="badge" style="background:' + esc(x.color) + '">' + esc(x.emoji + ' ' + (isEn()?x.nameEn:x.nameZh)) + '</span><p>' + esc(blurb) + notes + '</p></div></div><div class="manager-actions"><button class="icon-btn" data-edit="' + esc(a.id) + '" title="'+tr('编辑','Edit')+'">✏️</button><button class="icon-btn" data-fav="' + esc(a.id) + '" title="'+tr('收藏','Favorite')+'">' + (a.favorite ? '⭐' : '☆') + '</button><button class="icon-btn danger-icon" data-del="' + esc(a.id) + '" title="'+tr('删除','Delete')+'">🗑️</button></div></div>'; }).join('') + '</div>'; $('manager-search').oninput = function () { var q = this.value.toLowerCase(); c.querySelectorAll('.manager-item').forEach(function (el) { el.hidden = el.textContent.toLowerCase().indexOf(q) < 0; }); }; $('manager-add').onclick = function () { openForm(k, null); }; c.querySelectorAll('[data-edit]').forEach(function (b) { b.onclick = function () { openForm(k, m.items.find(function (a) { return a.id === b.dataset.edit; })); }; }); c.querySelectorAll('[data-fav]').forEach(function (b) { b.onclick = function () { var a = m.items.find(function (a) { return a.id === b.dataset.fav; }); if (!a) return; a.favorite = !a.favorite; save(); renderManager(k); }; }); c.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { var target = m.items.find(function (a) { return a.id === b.dataset.del; }); var label = target ? itemName(target) : ''; if (!window.confirm(isEn() ? 'Delete "' + label + '"?' : '确定删除「' + label + '」？')) return; var removed = false; m.items = m.items.filter(function (a) { if (!removed && a.id === b.dataset.del) { removed = true; return false; } return true; }); save(); renderManager(k); }; }); }
  function openDrawer(k) { moduleKey = k; $('drawer-title').textContent = isEn() ? (k === 'outing' ? 'Manage Places' : (k === 'chat' ? 'Manage Chat Cards' : 'Manage Activities')) : (k === 'outing' ? '管理地点库' : (k === 'chat' ? '管理聊天库' : '管理活动库')); $('drawer-backdrop').hidden = false; $('library-drawer').classList.add('open'); $('library-drawer').setAttribute('aria-hidden', 'false'); renderManager(k); setTimeout(function () { $('manager-search').focus(); }, 120); }
  function closeDrawer() { $('library-drawer').classList.remove('open'); $('library-drawer').setAttribute('aria-hidden', 'true'); setTimeout(function () { $('drawer-backdrop').hidden = true; }, 220); }
  function openForm(k, a) { $('item-module').value = k; $('item-id').value = a ? a.id : ''; var action = a ? tr('编辑','Edit') : tr('新增','Add'); var noun = k === 'outing' ? tr('地点','place') : tr('内容','item'); $('modal-title').textContent = isEn() ? action + ' ' + noun : action + noun; $('item-name').value = a ? a.nameZh : ''; $('item-name-en').value = a ? a.nameEn || '' : ''; $('item-emoji').value = a ? a.emoji || '🎈' : '🎈'; $('item-desc').value = a ? a.descriptionZh || '' : ''; $('item-favorite').checked = !!(a && a.favorite); $('outing-fields').hidden = k !== 'outing'; var m = mod(k); $('item-category').innerHTML = m.categories.map(function (c) { return '<option value="' + esc(c.id) + '">' + esc(c.emoji + ' ' + (isEn() ? c.nameEn : c.nameZh)) + '</option>'; }).join(''); $('item-category').value = a ? a.categoryId : m.categories[0].id; if (k === 'outing') { var map = {area:'area',region:'region',indoor:'indoorOutdoor',age:'suitableAge',duration:'duration',highlights:'highlights',notes:'notes',map:'mapSearchName'}; Object.keys(map).forEach(function (x) { $('item-' + x).value = a ? a[map[x]] || '' : ''; }); } $('item-modal').hidden = false; }
  function submitForm(e) { e.preventDefault(); var k = $('item-module').value, m = mod(k), id = $('item-id').value, a = id && m.items.find(function (x) { return x.id === id; }); var desc = $('item-desc').value.trim(); var d = { nameZh: $('item-name').value.trim(), nameEn: $('item-name-en').value.trim() || $('item-name').value.trim(), categoryId: $('item-category').value, emoji: $('item-emoji').value || '🎈', descriptionZh: desc, descriptionEn: (a && a.descriptionEn && a.descriptionEn !== a.descriptionZh) ? a.descriptionEn : desc, favorite: $('item-favorite').checked, updatedAt: S.now() }; if (k === 'outing') { d.area = $('item-area').value.trim(); d.region = $('item-region').value; d.indoorOutdoor = $('item-indoor').value.trim(); d.suitableAge = $('item-age').value.trim(); d.duration = $('item-duration').value.trim(); d.highlights = $('item-highlights').value.trim(); d.notes = $('item-notes').value.trim(); d.mapSearchName = $('item-map').value.trim() || d.nameZh; } if (a) Object.assign(a, d); else { d.id = S.genId(); d.source = 'custom'; d.createdAt = S.now(); d.pickCount = 0; d.lastPickedAt = null; m.items.unshift(d); } save(); $('item-modal').hidden = true; renderManager(k); }
  function init() {
    var tipsZh=['今天和孩子聊聊：如果你能设计一个秘密基地，会放在哪里？','小提示：先听完孩子的想法，再问一个“为什么”。','睡前可以问：今天哪一刻让你觉得自己很棒？'];
    var tipsEn=['Ask: if you could design a secret base, where would it be?','Tip: listen all the way through, then ask one “why?”.','At bedtime: which moment today made you feel proud?'];
    var ti=0; function showTip(){ var el=$('chat-tips'); if(!el) return; var tips=isEn()?tipsEn:tipsZh; el.textContent='💡 '+tips[ti++%tips.length]; } showTip(); setInterval(showTip,4200);
    var r = S.loadState(); state = r.state; showView('play'); document.querySelectorAll('.tab').forEach(function (b) { b.onclick = function () { showView(b.dataset.view); }; }); document.querySelectorAll('[data-manage]').forEach(function (b) { b.onclick = function () { openDrawer(b.dataset.manage); }; }); document.querySelectorAll('[data-toggle]').forEach(function (b) { b.onclick = function () { $(b.dataset.toggle).hidden = !$(b.dataset.toggle).hidden; }; }); $('play-pick').onclick = playPick; $('chat-pick').onclick = chatPick; $('chat-reroll').onclick = chatPick; $('chat-filter-toggle').onclick = function () { $('chat-filter-panel').hidden = !$('chat-filter-panel').hidden; }; $('outing-pick').onclick = outingPick; $('outing-filter-toggle').onclick = function () { $('outing-filter-panel').hidden = !$('outing-filter-panel').hidden; }; ['outing-indoor','outing-duration'].forEach(function (id) { $(id).onchange = updateSummaries; }); $('item-form').onsubmit = submitForm; $('drawer-close').onclick = closeDrawer; $('drawer-backdrop').onclick = closeDrawer; document.querySelectorAll('[data-close]').forEach(function (b) { b.onclick = function () { $(b.dataset.close).hidden = true; }; }); $('open-settings').onclick = function () { $('s-name').value = state.settings.userName; $('s-language').value = state.settings.language; $('settings-modal').hidden = false; }; $('save-settings').onclick = function () { state.settings.userName = $('s-name').value.trim() || '小朋友'; state.settings.language = $('s-language').value; save(); applyLanguage(); $('settings-modal').hidden = true; }; var installBtn=$('install-app'); if(installBtn){installBtn.onclick=function(){if(!installPrompt)return;installPrompt.prompt();installPrompt.userChoice.then(function(){installPrompt=null;installBtn.hidden=true;});};} window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();installPrompt=e;if(installBtn)installBtn.hidden=false;}); window.addEventListener('appinstalled',function(){installPrompt=null;if(installBtn)installBtn.hidden=true;}); renderCategories('play','play-categories'); renderCategories('chat','chat-categories'); renderOutingFilters(); updateSummaries(); applyLanguage(); }
  init();
})();
