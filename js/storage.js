(function () {
  'use strict';
  var NS = window.GamePicker = window.GamePicker || {};
  var KEY = 'explorekids.state.v1';
  var PLAY_CATEGORIES = [['learning','学习','Learning','📚','#A8E6CF'],['toy','玩具','Toys','🧱','#FFB6A3'],['board','桌游','Board Games','🎲','#FFD98E'],['book','绘本','Picture Books','📖','#B8D8BA'],['craft','手工','Crafts','🎨','#C3B1E1'],['role','角色游戏','Role Play','🩺','#F6C1C7'],['fitness','运动','Fitness','💪','#A0D8EF']];
  var CHAT_CATEGORIES = [['daily','日常分享','Daily','🌤️','#FFD98E'],['feelings','感受与情绪','Feelings','🌼','#FFB6A3'],['family','家庭','Family','🏠','#A8E6CF'],['imagine','想象','Imagination','🧚','#C3B1E1'],['logic','逻辑思考','Thinking','🧠','#A0D8EF'],['bedtime','睡前','Bedtime','🌙','#B8D8BA'],['dreams','梦想','Dreams','🌈','#F6C1C7'],['reflect','复盘','Reflection','🔁','#E8C4A0'],['science','小小科普','Little Science','🔬','#A0D8EF']];
  var OUTING_CATEGORIES = [['indoor-park','室内公园','Indoor Park','🛝','#A8E6CF'],['theme-park','主题乐园','Theme Park','🎢','#FFB6A3'],['mall','商场亲子空间','Mall Family Space','🛍️','#FFD98E'],['cycling','骑行','Cycling','🚲','#A0D8EF'],['hiking','爬山与自然','Hiking & Nature','🥾','#B8D8BA'],['museum','博物馆/科技馆','Museum & Science','🔭','#C3B1E1'],['rainy','雨天备选','Rainy Day','☔','#F6C1C7'],['nearby','周边周末','Nearby Weekend','🧭','#E8C4A0']];
  function now(){return Date.now();} function genId(){return now().toString(36)+'-'+Math.random().toString(36).slice(2,8);} function cats(rows){return rows.map(function(r){return {id:r[0],nameZh:r[1],nameEn:r[2],emoji:r[3],color:r[4]};});}
  function item(o){return Object.assign({id:genId(),nameZh:'未命名',nameEn:'Untitled',categoryId:'other',emoji:'🎈',descriptionZh:'',descriptionEn:'',favorite:false,source:'custom',createdAt:now(),updatedAt:now(),pickCount:0,lastPickedAt:null},o||{});}
  function playSeed(){return (NS.playCatalog||[]).map(function(x){return item(x);});}
  function durationMatches(value, filter) {
    if (!filter) return true;
    var v = String(value || '').trim();
    if (!v) return false;
    if (filter === '2') return /^2\s*小时/.test(v) || /^2\s*[–\-~到至]\s*3\s*小时/.test(v);
    if (filter === '一天') return v === '一天';
    if (filter === '半天') return v.indexOf('半天') >= 0;
    if (filter === '1–2天' || filter === '1-2天') return v.indexOf('1–2天') >= 0 || v.indexOf('1-2天') >= 0;
    return v === filter;
  }
  function genericHighlight(s) {
    var t = String(s || '').trim();
    return !t || t === '公园' || t === '适合周末亲子出游' || t === '商圈' || t === '文化馆' || t === '海滩' || t === '徒步' || t === '游乐园' || t === '古城' || t === '农场' || t === '校园' || t === '公司';
  }
  function mergeText(kept, incoming) {
    var a = String(kept || '').trim();
    var b = String(incoming || '').trim();
    if (!a) return b;
    if (!b || a.indexOf(b) !== -1) return a;
    if (b.indexOf(a) !== -1) return b;
    return a + '\n' + b;
  }
  function mergeOuting(kept, incoming) {
    var o = Object.assign({}, kept);
    if (!incoming) return o;
    if (incoming.area && (o.area === '深圳市内' || o.area === '深圳周边' || !o.area)) o.area = incoming.area;
    if (incoming.region) o.region = incoming.region;
    if (Array.isArray(incoming.visitHistory) && incoming.visitHistory.length) o.visitHistory = incoming.visitHistory.slice();
    o.notes = mergeText(o.notes, incoming.notes);
    if (genericHighlight(o.highlights) && incoming.highlights && !genericHighlight(incoming.highlights)) o.highlights = incoming.highlights;
    else if (!genericHighlight(incoming.highlights) && String(incoming.highlights).length > String(o.highlights || '').length) o.highlights = incoming.highlights;
    if (incoming.mapSearchName && String(incoming.mapSearchName).length > String(o.mapSearchName || '').length) o.mapSearchName = incoming.mapSearchName;
    return o;
  }
  function refineOutingCategory(x) {
    var name = x.nameZh || '';
    var high = x.highlights || '';
    var text = name + ' ' + high;
    var cat = x.categoryId || 'nearby';
    if (/羽毛球|体育馆|球馆/.test(name)) return x.indoorOutdoor === '室外' ? 'hiking' : 'rainy';
    if (/博物馆|美术馆|图书馆|科技馆|展览馆|艺术馆|纪念馆|博览馆/.test(name) && !/球馆|体育馆|羽毛球/.test(name)) return 'museum';
    if (/动物园|海洋王国|游乐园|民俗村|世界之窗/.test(name) || /长隆/.test(name)) return 'theme-park';
    if (cat === 'rainy' && x.indoorOutdoor === '室外' && /公园|海滩|沙滩|古城|古镇|农场|湿地|步道|登山|爬山|赶海/.test(text)) return 'hiking';
    if ((cat === 'cycling' || cat === 'mall') && /徒步|爬山|登山/.test(high) && !/^骑行/.test(high)) return 'hiking';
    if ((cat === 'mall' || cat === 'museum') && /沙滩|海滩|银滩|赶海|灯塔/.test(text) && !/博物馆|美术馆|图书馆|科技馆|展览馆|博览馆/.test(name)) return 'hiking';
    if (cat === 'rainy' && x.indoorOutdoor === '室外') return 'hiking';
    if (/^校园/.test(String(high).trim()) && !/博物馆|美术馆|图书馆|科技馆|纪念馆|博览馆/.test(name)) return x.indoorOutdoor === '室内' ? 'rainy' : 'hiking';
    if (cat === 'cycling' && !/骑行|绿道|自行车/.test(text)) return x.indoorOutdoor === '室内' ? 'rainy' : 'hiking';
    return cat;
  }
  function outingKey(x) { return (x.region || '') + '|' + (x.nameZh || ''); }
  function uniqueOutingId(x, seen) {
    var base = 'outing-' + String(x.nameZh || 'place').replace(/\s+/g, '');
    var id = base;
    var n = 2;
    while (seen[id]) { id = base + '-' + n; n += 1; }
    seen[id] = true;
    return id;
  }
  // Excel 导入曾让两百多条地点共用 id「excel-place」，删一条就会删掉整库。
  // 这里按名称生成稳定 id，并合并同名条目，保留更具体的笔记和去过记录。
  function outingSeed() {
    var emoji = { cycling: '🚲', hiking: '🥾', museum: '🔭', mall: '🛍️', 'theme-park': '🎢', rainy: '☔', 'indoor-park': '🛝', nearby: '🧭' };
    function place(name, area, cat, io, dur, high, notes) {
      return item({ id: 'outing-' + name, nameZh: name, nameEn: name, area: area, region: area === '深圳市内' ? '深圳市内' : '深圳周边', categoryId: cat, emoji: '🧭', indoorOutdoor: io, suitableAge: '3–12岁', duration: dur, highlights: high, notes: notes, mapSearchName: name, descriptionZh: high, descriptionEn: high, source: 'builtin' });
    }
    var base = [
      place('深圳湾公园', '深圳市内', 'cycling', '室外', '2–3小时', '沿海骑行、看日落、亲子散步', '注意防晒与补水'),
      place('莲花山公园', '深圳市内', 'hiking', '室外', '2小时', '登顶俯瞰城市，适合轻量爬山', '周末建议早出发'),
      place('深圳市儿童乐园', '深圳市内', 'theme-park', '室外', '半天', '经典游乐设施，适合低龄儿童', '关注现场开放项目'),
      place('深圳科学馆', '深圳市内', 'museum', '室内', '2–3小时', '互动展项和科学实验，雨天友好', '提前查看展览安排'),
      place('欢乐海岸购物中心', '深圳市内', 'mall', '室内/室外', '半天', '商场亲子空间、餐饮与水岸散步', '可按家庭预算灵活安排'),
      place('大鹏所城与较场尾', '深圳市内', 'hiking', '室外', '一天', '古城、人文和海边组合', '建议安排往返交通'),
      place('惠州西湖', '深圳周边', 'nearby', '室外', '一天', '湖边散步、骑行和城市周末游', '适合自驾或高铁接驳'),
      place('东莞松山湖', '深圳周边', 'cycling', '室外', '一天', '环湖骑行、草地和亲子休闲', '可自带儿童自行车'),
      place('珠海长隆海洋王国', '深圳周边', 'theme-park', '室内/室外', '1–2天', '大型海洋主题乐园，适合周末旅行', '提前规划住宿与门票')
    ];
    var extra = (NS.outingExtra || []).map(function (x) {
      return item(Object.assign({ source: 'builtin', emoji: '🧭', descriptionZh: x.highlights || x.nameZh, descriptionEn: x.highlights || x.nameZh }, x));
    });
    var by = {};
    var order = [];
    function add(x) {
      var key = outingKey(x);
      if (!by[key]) { by[key] = x; order.push(key); }
      else by[key] = mergeOuting(by[key], x);
    }
    base.forEach(add);
    extra.forEach(function (x) {
      var key = outingKey(x);
      if (by[key]) by[key] = mergeOuting(by[key], x);
      else add(x);
    });
    (NS.outingAdditions || []).forEach(function (raw) {
      var x = item(Object.assign({ source: 'builtin', emoji: '🧭', suitableAge: raw.suitableAge || '3–12岁', descriptionZh: raw.highlights || raw.nameZh, descriptionEn: raw.highlights || raw.nameZh }, raw));
      var key = outingKey(x);
      if (by[key]) by[key] = mergeOuting(by[key], x);
      else add(x);
    });
    var seen = {};
    return order.map(function (key) {
      var x = by[key];
      x.categoryId = refineOutingCategory(x);
      var tip = NS.outingEnrich && NS.outingEnrich[x.nameZh];
      if (tip && !outingPitch(x)) x.highlights = tip;
      x.emoji = emoji[x.categoryId] || x.emoji || '🧭';
      x.id = uniqueOutingId(x, seen);
      x.source = 'builtin';
      x.descriptionZh = x.highlights || x.nameZh;
      x.descriptionEn = x.highlights || x.nameEn || x.nameZh;
      if (x.area === x.region) x.area = '';
      return x;
    });
  }
  function chatCategories() {
    var rows = NS.chat && NS.chat.categories;
    if (rows && rows.length) {
      return rows.map(function (c) {
        return { id: c.id, nameZh: c.nameZh, nameEn: c.nameEn, emoji: c.emoji, color: c.color };
      });
    }
    return cats(CHAT_CATEGORIES);
  }
  function chatSeed() {
    var topics = (NS.chat && NS.chat.topics) || [];
    return topics.map(function (t) {
      return item({
        id: 'chat-' + t.id,
        nameZh: t.promptZh || t.questionZh || '聊天话题',
        nameEn: t.promptEn || t.questionEn || 'Chat topic',
        categoryId: t.categoryId || 'daily',
        emoji: t.emoji || '💬',
        descriptionZh: t.promptZh || t.questionZh || '',
        descriptionEn: t.promptEn || t.questionEn || '',
        promptZh: t.promptZh || t.questionZh || '',
        promptEn: t.promptEn || t.questionEn || '',
        followUpsZh: t.followUpsZh || [],
        followUpsEn: t.followUpsEn || [],
        factZh: t.factZh || '',
        factEn: t.factEn || '',
        hintZh: t.hintZh || '',
        hintEn: t.hintEn || '',
        thinkingPromptZh: t.thinkingPromptZh || '',
        thinkingPromptEn: t.thinkingPromptEn || '',
        answerZh: t.answerZh || '',
        answerEn: t.answerEn || '',
        difficulty: t.difficulty || 1,
        source: 'builtin'
      });
    });
  }
  function baseState() {
    return {
      schemaVersion: 1,
      settings: { userName: '小朋友', language: 'zh-CN' },
      modules: {
        play: { categories: cats(PLAY_CATEGORIES), items: playSeed(), lastPickedId: null },
        chat: { categories: chatCategories(), items: chatSeed(), lastPickedId: null },
        outing: { categories: cats(OUTING_CATEGORIES), items: outingSeed(), lastPickedId: null }
      }
    };
  }
  function clone(x){return JSON.parse(JSON.stringify(x));} function same(a,b){return JSON.stringify(a)===JSON.stringify(b);}
  function catalog(k){return baseState().modules[k].items;}
  function deltaFromState(s){var out={schemaVersion:1,settings:clone(s.settings||{}),modules:{}};['play','chat','outing'].forEach(function(k){var base=catalog(k), by={};base.forEach(function(x){by[x.id]=x;});var m=s.modules[k], d={customItems:[],overrides:{},deletedBuiltinIds:[],favorites:{},stats:{},lastPickedId:m.lastPickedId||null};(m.items||[]).forEach(function(x){var b=by[x.id];if(!b||x.source==='custom'){d.customItems.push(clone(x));return;}var patch={};Object.keys(x).forEach(function(key){if(['id','source','createdAt','updatedAt','favorite','pickCount','lastPickedAt'].indexOf(key)<0&&!same(x[key],b[key]))patch[key]=clone(x[key]);});if(Object.keys(patch).length)d.overrides[x.id]=patch;if(x.favorite)d.favorites[x.id]=true;if(x.pickCount||x.lastPickedAt)d.stats[x.id]={pickCount:x.pickCount||0,lastPickedAt:x.lastPickedAt||null};});var present={};(m.items||[]).forEach(function(x){present[x.id]=true;});base.forEach(function(x){if(!present[x.id])d.deletedBuiltinIds.push(x.id);});out.modules[k]=d;});return out;}
  function fullFromDelta(d){var s=baseState();s.settings=Object.assign(s.settings,d.settings||{});['play','chat','outing'].forEach(function(k){var m=s.modules[k], x=d.modules&&d.modules[k]||{}, deleted={};(x.deletedBuiltinIds||[]).forEach(function(id){deleted[id]=true;});m.items=m.items.filter(function(a){return !deleted[a.id];});Object.keys(x.overrides||{}).forEach(function(id){var a=m.items.find(function(z){return z.id===id;});if(a)Object.assign(a,x.overrides[id]);});(x.customItems||[]).forEach(function(a){m.items.push(item(a));});Object.keys(x.favorites||{}).forEach(function(id){var a=m.items.find(function(z){return z.id===id;});if(a)a.favorite=true;});Object.keys(x.stats||{}).forEach(function(id){var a=m.items.find(function(z){return z.id===id;});if(a)Object.assign(a,x.stats[id]);});m.lastPickedId=x.lastPickedId||null;});return s;}
  function storageAvailable(){try{var k='__explorekids__';localStorage.setItem(k,'1');localStorage.removeItem(k);return true;}catch(e){return false;}}
  function saveState(s){if(!storageAvailable())return false;try{localStorage.setItem(KEY,JSON.stringify(deltaFromState(s)));return true;}catch(e){return false;}}
  function loadState(){if(!storageAvailable())return {state:baseState(),inMemory:true,corrupt:false};var raw=localStorage.getItem(KEY);if(!raw){var fresh=baseState();saveState(fresh);return {state:fresh,inMemory:false,corrupt:false};}try{var parsed=JSON.parse(raw);if(!parsed||parsed.schemaVersion!==1)throw new Error('invalid state');return {state:fullFromDelta(parsed),inMemory:false,corrupt:false};}catch(e){var fallback=baseState();saveState(fallback);return {state:fallback,inMemory:false,corrupt:true};}}
  function outingPitch(a) {
    var generic = { '公园': 1, '适合周末亲子出游': 1, '文化馆': 1, '商圈': 1, '徒步': 1, '海滩': 1, '游乐园': 1, '古城': 1, '早教中心': 1, '校园': 1, '农场': 1, '骑行': 1, '公司': 1, '交通': 1, '市场': 1, '手工': 1, '喜来登': 1 };
    var high = String((a && (a.highlights || a.descriptionZh)) || '').trim();
    var specific = high.split(/\s*[·•]\s*/).map(function (s) { return s.trim(); }).filter(function (s) { return s && !generic[s]; });
    var bits = [];
    specific.forEach(function (part) {
      part.split('\n').forEach(function (row) {
        row = row.trim();
        if (row && !generic[row]) bits.push(row);
      });
    });
    if (bits.length) {
      var line = bits.join(' · ');
      if (line === (a.nameZh || '')) return '';
      return line.length > 48 ? line.slice(0, 48) + '…' : line;
    }
    if (a && a.descriptionZh && a.descriptionZh !== a.highlights && !generic[a.descriptionZh]) {
      var custom = String(a.descriptionZh).trim().split('\n')[0];
      if (custom && custom !== a.nameZh) return custom.length > 48 ? custom.slice(0, 48) + '…' : custom;
    }
    var notes = String((a && a.notes) || '')
      .replace(/首次去过[:：][^；;\n]*/g, '')
      .replace(/再次去过[:：][^；;\n]*/g, '')
      .replace(/(?:^|[；;\s])去过[:：][^；;\n]*/g, '')
      .replace(/[；;]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!notes || generic[notes] || notes === (a && a.nameZh)) return '';
    return notes.length > 48 ? notes.slice(0, 48) + '…' : notes;
  }
  function mapQuery(a) {
    var name = String((a && a.nameZh) || '').trim();
    var named = String((a && (a.mapSearchName || a.nameZh)) || '').trim();
    var area = String((a && a.area) || '').trim();
    if (!a || a.region !== '深圳市内' || named.indexOf('深圳') !== -1) return named;
    var prefix = '深圳';
    if (area && named.indexOf(area) === -1 && name.indexOf(area) === -1) prefix += area;
    return prefix + ' ' + (name || named);
  }
  NS.storage={KEY:KEY,defaultState:baseState,saveState:saveState,loadState:loadState,now:now,genId:genId,durationMatches:durationMatches,outingPitch:outingPitch,mapQuery:mapQuery,PLAY_CATEGORIES:PLAY_CATEGORIES,CHAT_CATEGORIES:CHAT_CATEGORIES,OUTING_CATEGORIES:OUTING_CATEGORIES};
})();
