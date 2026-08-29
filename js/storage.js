/* 数据层：双语固定目录、localStorage、导入导出与旧版本迁移 */
(function () {
  'use strict';
  var NS = (window.GamePicker = window.GamePicker || {});
  var KEY = 'gamepicker.v1';
  var CATALOG_VERSION = 5;
  var DEFAULT_CATEGORIES = [
    { id: 'learning', nameZh: '学习', nameEn: 'Learning', emoji: '📚', color: '#A8E6CF' },
    { id: 'toy', nameZh: '玩具', nameEn: 'Toys', emoji: '🧱', color: '#FFB6A3' },
    { id: 'board', nameZh: '桌游', nameEn: 'Board Games', emoji: '🎲', color: '#FFD98E' },
    { id: 'book', nameZh: '绘本', nameEn: 'Picture Books', emoji: '📖', color: '#B8D8BA' },
    { id: 'craft', nameZh: '手工', nameEn: 'Crafts', emoji: '🎨', color: '#C3B1E1' },
    { id: 'game', nameZh: '游戏', nameEn: 'Games', emoji: '🎯', color: '#A0D8EF' },
    { id: 'fitness', nameZh: '体能', nameEn: 'Fitness', emoji: '💪', color: '#FF8FA3' }
  ];
  var BUILTIN_META = {
    '洪恩识字': { catalogId: 'literacy', iconType: 'svg', iconKey: 'literacy', fallback: '✍️' },
    '学习英语': { catalogId: 'english-learning', iconType: 'svg', iconKey: 'english-learning', fallback: '🗣️', legacyNames: ['看Yakee Dee'] },
    '乐高搭动物乐园': { catalogId: 'lego-animal-park', iconType: 'svg', iconKey: 'lego-animal-park', fallback: '🧱' },
    '积木搭小房子': { catalogId: 'building-blocks', iconType: 'svg', iconKey: 'building-blocks', fallback: '🧱' },
    '三只小猪': { catalogId: 'three-little-pigs', iconType: 'svg', iconKey: 'three-little-pigs', fallback: '🐷' },
    '折纸飞机比赛': { catalogId: 'paper-airplane', iconType: 'svg', iconKey: 'paper-airplane', fallback: '📄' },
    '蹦床': { catalogId: 'trampoline', iconType: 'svg', iconKey: 'trampoline', fallback: '🤸' },
    '吊单杠': { catalogId: 'pull-up-bar', iconType: 'svg', iconKey: 'pull-up-bar', fallback: '🧗' },
    '仰卧起坐': { catalogId: 'sit-ups', iconType: 'svg', iconKey: 'sit-ups', fallback: '💪' },
    '数学启蒙': { catalogId: 'early-math', fallback: '🔢' },
    '看布鲁伊动画片': { catalogId: 'watch-bluey', fallback: '📺' },
    '科普动画片': { catalogId: 'science-cartoon', fallback: '🔬' },
    '磁力片搭城堡': { catalogId: 'magnetic-castle', fallback: '🏰' },
    '拼图闯关': { catalogId: 'puzzle-challenge', fallback: '🧩' },
    '超级密码机': { catalogId: 'super-code-machine', fallback: '🔐' },
    '磁力块': { catalogId: 'magnetic-blocks', fallback: '🧲' },
    '飞行棋大战': { catalogId: 'flying-chess', fallback: '🎲' },
    '动物有钱': { catalogId: 'animal-money', fallback: '💰' },
    '记忆翻牌配对': { catalogId: 'memory-match', fallback: '🃏' },
    '熊猫餐厅': { catalogId: 'panda-restaurant', fallback: '🐼' },
    '长颈鹿围巾': { catalogId: 'giraffe-scarf', fallback: '🦒' },
    '读中文绘本': { catalogId: 'chinese-picture-book', fallback: '📕' },
    '读英文绘本': { catalogId: 'english-picture-book', fallback: '📘' },
    '纸盘做面具': { catalogId: 'paper-plate-mask', fallback: '🎭' },
    '橡皮泥捏小动物': { catalogId: 'clay-animals', fallback: '🐾' },
    '手工创作': { catalogId: 'free-craft', fallback: '✂️' },
    '画一幅画': { catalogId: 'draw-picture', fallback: '🎨' },
    '客厅音乐会': { catalogId: 'living-room-concert', fallback: '🎤' },
    '医生游戏': { catalogId: 'doctor-game', fallback: '🩺' },
    '旱地自由泳': { catalogId: 'dry-land-freestyle', fallback: '🏊' }
  };
  var BUILTIN_BY_CATALOG = {};
  Object.keys(BUILTIN_META).forEach(function (name) { BUILTIN_BY_CATALOG[BUILTIN_META[name].catalogId] = Object.assign({ nameZh: name }, BUILTIN_META[name]); });
  var LEGACY_BUILTIN_NAMES = {};
  Object.keys(BUILTIN_META).forEach(function (name) { LEGACY_BUILTIN_NAMES[name] = BUILTIN_META[name].catalogId; (BUILTIN_META[name].legacyNames || []).forEach(function (legacy) { LEGACY_BUILTIN_NAMES[legacy] = BUILTIN_META[name].catalogId; }); });
  function genId() { return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8); }
  function now() { return Date.now(); }
  function clampInt(v, min, max, fallback) { var n = parseInt(v, 10); return isNaN(n) ? fallback : Math.max(min, Math.min(max, n)); }
  function categories() { return DEFAULT_CATEGORIES.map(function (c) { return { id: c.id, nameZh: c.nameZh, nameEn: c.nameEn, emoji: c.emoji, color: c.color }; }); }
  function act(o, t) {
    return { id: o.id || genId(), catalogId: o.catalogId || null, source: o.source === 'builtin' ? 'builtin' : 'custom', iconType: o.iconType === 'svg' ? 'svg' : 'emoji', iconKey: o.iconKey || '', nameZh: o.nameZh, nameEn: o.nameEn || o.nameZh, categoryId: o.categoryId, emoji: o.emoji,
      descriptionZh: o.descriptionZh || '', descriptionEn: o.descriptionEn || o.descriptionZh || '', materialsZh: o.materialsZh || '', materialsEn: o.materialsEn || o.materialsZh || '', favorite: !!o.favorite,
      lastPickedAt: o.lastPickedAt || null, pickCount: clampInt(o.pickCount, 0, 1000000, 0), lastPlayedAt: o.lastPlayedAt || null, playCount: clampInt(o.playCount, 0, 1000000, 0), createdAt: o.createdAt || t || now(), updatedAt: o.updatedAt || t || now() };
  }
  function sampleActivities() {
    var t = now();
    var a = function (nameZh, nameEn, categoryId, emoji, descriptionZh, descriptionEn, materialsZh, materialsEn) { return act({ nameZh: nameZh, nameEn: nameEn, categoryId: categoryId, emoji: emoji, descriptionZh: descriptionZh, descriptionEn: descriptionEn, materialsZh: materialsZh, materialsEn: materialsEn }, t); };
    return [
      a('洪恩识字','Honso Literacy','learning','📚','打开当天课程，完成识字任务，认读后尝试用新字组词或造句。','Open today’s lesson, learn the characters, then make words or sentences with them.','平板或手机、洪恩识字应用','Tablet or phone, Honso Literacy app'),
      a('数学启蒙','Early Math','learning','🔢','进行数数、分类、比较、加减等小游戏，完成后说一说自己的解题方法。','Play counting, sorting, comparing, and simple adding games, then explain how you solved one.','平板或手机、数字卡片（可选）','Tablet or phone, number cards (optional)'),
      a('看布鲁伊动画片','Watch Bluey','learning','📺','选择一集，观看前先猜主题，看完复述一个情节或说出喜欢的角色。','Choose an episode, guess its theme, then retell one scene or name a favorite character.','播放设备、动画片','A screen and an episode'),
      a('学习英语','Learn English','learning','🗣️','跟着 Yakee Dee 动画重复英文关键词和句型，暂停模仿发音并配合动作。','Follow Yakee Dee and repeat English words and phrases, pausing to copy the pronunciation and actions.','播放设备、Yakee Dee 动画片','A screen and a Yakee Dee episode'),
      a('科普动画片','Science Cartoon','learning','🔬','选择动物、自然、人体或太空主题，看完说出至少 3 个新发现。','Choose an animal, nature, body, or space topic and share three new discoveries.','播放设备、动画片','A screen and a science cartoon'),
      a('磁力片搭城堡','Magnetic Castle','toy','🧲','先搭底座和塔楼，再增加门、桥和房间，最后让玩具车通过城堡。','Build a base and towers, add doors, bridges, and rooms, then drive a toy car through.','磁力片、玩具车','Magnetic tiles, toy car'),
      a('乐高搭动物乐园','LEGO Animal Park','toy','🦁','分区搭建草地、水池和围栏，摆放动物并编一个动物园故事。','Build grass, a pond, and fences, place the animals, and make up a zoo story.','乐高、动物积木','LEGO bricks, animal figures'),
      a('拼图闯关','Puzzle Challenge','toy','🧩','按边框、颜色和图案分组拼图，可以计时并逐步挑战更难的拼图。','Sort edge pieces, colors, and patterns; use a timer and gradually try harder puzzles.','拼图、计时器（可选）','Puzzle, timer (optional)'),
      a('积木搭小房子','Build a Little House','toy','🧱','搭出有门、有窗和屋顶的小房子，再用小家具和人偶布置房间。','Build a house with doors, windows, and a roof, then furnish it with figures.','积木或乐高、小人偶','Building blocks or LEGO, small figures'),
      a('三只小猪','The Three Little Pigs','toy','🐷','轮流扮演小猪和大灰狼，用房子和道具演一遍故事，也可以改编结局。','Take turns as the pigs and the wolf, act out the story, and invent a new ending.','三只小猪玩具或绘本、积木','Three Little Pigs toys or book, blocks'),
      a('超级密码机','Super Code Machine','toy','🔐','设置数字或图形密码，轮流尝试破解，并为对方设计一个新密码。','Set a number or shape code, take turns cracking it, and create a new code for a partner.','超级密码机','Super Code Machine'),
      a('磁力块','Magnetic Blocks','toy','🔷','用磁力块拼动物、车辆或高塔，尝试对称结构和不同造型。','Build animals, vehicles, or towers and experiment with symmetry and new shapes.','磁力块、轮子配件（如有）','Magnetic blocks, wheel pieces (if available)'),
      a('飞行棋大战','Flying Chess','board','🎲','轮流掷骰子移动棋子，谁的棋子先全部到达终点谁获胜。','Roll the die and move pieces in turn; the first player to reach the finish wins.','飞行棋','Flying Chess set'),
      a('动物有钱','Animal Money','board','🐘','按游戏规则赚取、支付动物钱币，学习简单的选择和计划。','Earn and pay animal coins by the rules while practicing simple choices and planning.','动物有钱桌游','Animal Money board game'),
      a('记忆翻牌配对','Memory Match','board','🃏','将成对卡片打乱，轮流翻开两张，找到配对最多的人获胜。','Shuffle matching cards, flip two at a time, and win the most pairs.','配对卡片或扑克牌','Matching cards or playing cards'),
      a('熊猫餐厅','Panda Restaurant','board','🐼','轮流扮演顾客和厨师，根据订单准备食物、送餐并完成结账。','Take turns as customer and chef, prepare orders, serve food, and check out.','熊猫餐厅桌游','Panda Restaurant board game'),
      a('长颈鹿围巾','Giraffe Scarf','board','🦒','按颜色或图案规则为长颈鹿接围巾，轮流抽取并完成自己的围巾。','Follow color or pattern rules to build a scarf for the giraffe, taking turns to draw pieces.','长颈鹿围巾桌游','Giraffe Scarf board game'),
      a('读中文绘本','Read a Chinese Picture Book','book','📖','亲子共读，边指图边讲故事，读完后让孩子复述或改编结局。','Read together, point to the pictures, then retell the story or invent a new ending.','中文绘本','Chinese picture book'),
      a('读英文绘本','Read an English Picture Book','book','🔤','先看图猜意思，再朗读关键词和短句，最后说出故事的大致内容。','Guess from the pictures, read key words and short phrases, then tell the main idea.','英文绘本、点读笔（可选）','English picture book, reading pen (optional)'),
      a('纸盘做面具','Paper Plate Mask','craft','🎭','在纸盘上画脸、剪出眼睛，装饰后绑上橡皮筋做成面具。','Draw a face on a paper plate, cut eye holes, decorate it, and add an elastic strap.','纸盘、彩笔、剪刀、橡皮筋','Paper plate, markers, scissors, elastic'),
      a('橡皮泥捏小动物','Clay Animals','craft','🐣','捏小鸡、小兔子等动物，再用积木或纸盒为它们搭一个小家。','Shape chicks, bunnies, or other animals, then build them a little home.','橡皮泥、垫板、牙签（可选）','Modeling clay, mat, toothpick (optional)'),
      a('折纸飞机比赛','Paper Airplane Race','craft','✈️','每人折一架纸飞机，比一比谁飞得远、飞得稳或飞行时间最长。','Fold a paper airplane and compare distance, stability, or airtime.','彩纸、尺子（可选）','Colored paper, ruler (optional)'),
      a('手工创作','Free Craft','craft','✂️','使用纸盒、纸杯和纸张自由创作，可以做机器人、房子或交通工具。','Use boxes, cups, and paper to create a robot, house, vehicle, or anything you imagine.','纸盒、纸杯、彩纸、胶水、彩笔','Boxes, paper cups, colored paper, glue, markers'),
      a('画一幅画','Draw a Picture','craft','🎨','自选“我的家、动物朋友或想象中的世界”等主题完成一幅画，并讲解作品。','Choose a theme such as home, animal friends, or an imaginary world, then explain your picture.','画纸、蜡笔或彩笔','Drawing paper, crayons or markers'),
      a('客厅音乐会','Living Room Concert','game','🎤','播放喜欢的音乐，轮流唱歌、跳舞或当小主持人报幕。','Play favorite music and take turns singing, dancing, or hosting the show.','音乐播放器','Music player'),
      a('医生游戏','Doctor Game','game','🩺','轮流扮演医生和病人，进行问诊、检查、开“处方”，练习表达和照顾他人。','Take turns as doctor and patient, ask questions, examine, write a pretend prescription, and care for each other.','医生玩具套装、玩具听诊器','Doctor kit, toy stethoscope'),
      a('蹦床','Trampoline','fitness','🤸','先热身，再练习连续跳、双脚落地和简单转身，设置安全次数目标。','Warm up, practice steady jumps, two-foot landings, and simple turns with a safe goal.','儿童蹦床，成人陪同','Children’s trampoline, adult supervision'),
      a('吊单杠','Bar Hang','fitness','🧗','双手握住单杠悬挂，按能力进行短时间练习，注意防滑和落地保护。','Hang from a bar for short periods within your ability, with a safe, protected landing.','儿童单杠、防滑垫，成人保护','Children’s bar, safety mat, adult support'),
      a('仰卧起坐','Sit-Ups','fitness','💪','屈膝躺下完成仰卧起坐，可分 2–3 组进行，量力而行。','Do sit-ups with knees bent in two or three gentle sets, stopping when tired.','瑜伽垫、计时器（可选）','Yoga mat, timer (optional)'),
      a('旱地自由泳','Dry-Land Freestyle','fitness','🏊','趴在软垫上模仿自由泳划臂和打腿，配合口令完成一组动作。','Lie on a soft mat and copy freestyle arms and kicks with a simple rhythm.','瑜伽垫或软垫、毛巾','Yoga mat or soft mat, towel')
    ].map(function (item) {
      var meta = BUILTIN_META[item.nameZh] || { catalogId: item.nameZh, fallback: item.emoji };
      item.catalogId = meta.catalogId;
      item.id = 'builtin-' + meta.catalogId;
      item.source = 'builtin';
      item.iconType = meta.iconType || 'emoji';
      item.iconKey = meta.iconKey || '';
      item.emoji = meta.fallback || item.emoji;
      return item;
    });
  }
  function defaultState() { return { schemaVersion: 1, settings: { userName: '小朋友', avoidRecentCount: 3, categories: categories(), catalogVersion: CATALOG_VERSION, language: 'zh-CN', voiceEnabled: true }, activities: sampleActivities() }; }
  function canonicalCategoryId(value) { var map = { toy: 'toy', board: 'board', book: 'book', craft: 'craft', play: 'game', game: 'game', outdoor: 'fitness', other: 'game', learning: 'learning', fitness: 'fitness' }; return map[value] || (DEFAULT_CATEGORIES.some(function (c) { return c.id === value; }) ? value : 'game'); }
  function normalizeActivity(a, id) {
    var oldName = String(a.name || '未命名活动');
    var oldDesc = String(a.description || '');
    var oldMat = String(a.materials || '');
    var nameZh = String(a.nameZh || oldName).slice(0, 60);
    var catalogId = a.catalogId || LEGACY_BUILTIN_NAMES[nameZh] || null;
    var meta = catalogId && BUILTIN_BY_CATALOG[catalogId];
    var source = a.source === 'custom' ? 'custom' : (a.source === 'builtin' || meta ? 'builtin' : 'custom');
    return act({ id: id || a.id || (meta ? 'builtin-' + catalogId : genId()), catalogId: catalogId, source: source, iconType: a.iconType, iconKey: a.iconKey, nameZh: nameZh, nameEn: String(a.nameEn || oldName).slice(0, 80), categoryId: canonicalCategoryId(a.categoryId), emoji: String(a.emoji || (meta && meta.fallback) || '🎈').slice(0, 4), descriptionZh: String(a.descriptionZh || oldDesc), descriptionEn: String(a.descriptionEn || oldDesc), materialsZh: String(a.materialsZh || oldMat), materialsEn: String(a.materialsEn || oldMat), favorite: !!a.favorite, lastPickedAt: typeof a.lastPickedAt === 'number' ? a.lastPickedAt : null, pickCount: a.pickCount, lastPlayedAt: typeof a.lastPlayedAt === 'number' ? a.lastPlayedAt : null, playCount: a.playCount, createdAt: typeof a.createdAt === 'number' ? a.createdAt : now(), updatedAt: typeof a.updatedAt === 'number' ? a.updatedAt : now() });
  }
  function normalizeState(data) {
    data = data || {}; var settings = data.settings || {}; var normalizedName = typeof settings.userName === 'string' ? settings.userName : '小朋友'; if (normalizedName === '派派') normalizedName = '小朋友'; var out = { schemaVersion: 1, settings: { userName: normalizedName, avoidRecentCount: clampInt(settings.avoidRecentCount, 1, 10, 3), categories: categories(), catalogVersion: CATALOG_VERSION, language: settings.language === 'en-US' ? 'en-US' : 'zh-CN', voiceEnabled: typeof settings.voiceEnabled === 'boolean' ? settings.voiceEnabled : true }, activities: [] }; var seen = {};
    (Array.isArray(data.activities) ? data.activities : []).forEach(function (a) { if (!a || typeof a !== 'object') return; var id = String(a.id || genId()); if (seen[id]) return; seen[id] = true; out.activities.push(normalizeActivity(a, id)); }); return out;
  }
  function storageAvailable() { try { var k = '__gp_test__'; localStorage.setItem(k, '1'); localStorage.removeItem(k); return true; } catch (e) { return false; } }
  function saveState(state) { if (!storageAvailable()) return false; try { localStorage.setItem(KEY, JSON.stringify(state)); return true; } catch (e) { return false; } }
  function isBuiltinActivity(a) { return !!(a && a.source !== 'custom' && (a.source === 'builtin' || a.catalogId && BUILTIN_BY_CATALOG[a.catalogId] || LEGACY_BUILTIN_NAMES[a.nameZh] || LEGACY_BUILTIN_NAMES[a.name])); }
  function resetSample(currentState) {
    var fresh = defaultState();
    var old = currentState && Array.isArray(currentState.activities) ? currentState.activities : [];
    var customs = old.filter(function (a) { return !isBuiltinActivity(a); }).map(function (a) { var c = normalizeActivity(a); c.source = 'custom'; c.catalogId = null; return c; });
    if (currentState && currentState.settings) {
      fresh.settings.userName = typeof currentState.settings.userName === 'string' ? currentState.settings.userName : fresh.settings.userName;
      fresh.settings.avoidRecentCount = clampInt(currentState.settings.avoidRecentCount, 1, 10, fresh.settings.avoidRecentCount);
      fresh.settings.voiceEnabled = typeof currentState.settings.voiceEnabled === 'boolean' ? currentState.settings.voiceEnabled : fresh.settings.voiceEnabled;
      fresh.settings.language = currentState.settings.language === 'en-US' ? 'en-US' : 'zh-CN';
    }
    fresh.activities = fresh.activities.concat(customs);
    return fresh;
  }
  function migrateCatalog(data) {
    var fresh = defaultState(), oldActivities = Array.isArray(data.activities) ? data.activities : [], oldByCatalog = {};
    oldActivities.forEach(function (raw) {
      if (!raw || typeof raw !== 'object') return;
      var name = String(raw.nameZh || raw.name || '');
      var catalogId = raw.catalogId || LEGACY_BUILTIN_NAMES[name];
      if (catalogId) oldByCatalog[catalogId] = raw;
    });
    fresh.activities = fresh.activities.map(function (builtin) {
      var old = oldByCatalog[builtin.catalogId];
      if (!old) return builtin;
      builtin.favorite = !!old.favorite;
      builtin.lastPickedAt = typeof old.lastPickedAt === 'number' ? old.lastPickedAt : null;
      builtin.pickCount = clampInt(old.pickCount, 0, 1000000, 0);
      builtin.lastPlayedAt = typeof old.lastPlayedAt === 'number' ? old.lastPlayedAt : null;
      builtin.playCount = clampInt(old.playCount, 0, 1000000, 0);
      builtin.createdAt = typeof old.createdAt === 'number' ? old.createdAt : builtin.createdAt;
      return builtin;
    });
    var customs = oldActivities.filter(function (raw) { return !raw || typeof raw !== 'object' ? false : raw.source === 'custom' || !((raw.catalogId && BUILTIN_BY_CATALOG[raw.catalogId]) || LEGACY_BUILTIN_NAMES[String(raw.nameZh || raw.name || '')] || raw.source === 'builtin'); }).map(function (raw) { var c = normalizeActivity(raw); c.source = 'custom'; c.catalogId = null; return c; });
    fresh.activities = fresh.activities.concat(customs);
    var settings = data.settings || {};
    fresh.settings.userName = typeof settings.userName === 'string' ? settings.userName : fresh.settings.userName;
    if (fresh.settings.userName === '派派') fresh.settings.userName = '小朋友';
    fresh.settings.avoidRecentCount = clampInt(settings.avoidRecentCount, 1, 10, fresh.settings.avoidRecentCount);
    fresh.settings.voiceEnabled = typeof settings.voiceEnabled === 'boolean' ? settings.voiceEnabled : fresh.settings.voiceEnabled;
    fresh.settings.language = settings.language === 'en-US' ? 'en-US' : 'zh-CN';
    return fresh;
  }
  function loadState() {
    if (!storageAvailable()) return { state: defaultState(), inMemory: true, corrupt: false };
    var raw = null; try { raw = localStorage.getItem(KEY); } catch (e) { return { state: defaultState(), inMemory: true, corrupt: false }; }
    if (!raw) { var fresh = defaultState(); saveState(fresh); return { state: fresh, inMemory: false, corrupt: false }; }
    try { var data = JSON.parse(raw), oldVersion = data.settings && Number(data.settings.catalogVersion || 0), state = oldVersion < CATALOG_VERSION ? migrateCatalog(data) : normalizeState(data); if (oldVersion < CATALOG_VERSION) saveState(state); return { state: state, inMemory: false, corrupt: false }; }
    catch (e2) { try { localStorage.setItem(KEY + '.corrupt', raw || ''); } catch (e3) {} var fallback = defaultState(); saveState(fallback); return { state: fallback, inMemory: false, corrupt: true }; }
  }
  function exportJSON(state) { var blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }); var url = URL.createObjectURL(blob), a = document.createElement('a'), d = new Date(), pad = function (n) { return (n < 10 ? '0' : '') + n; }; a.href = url; a.download = '游戏决策机备份-' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '.json'; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function () { URL.revokeObjectURL(url); }, 1000); }
  function importJSON(text) { try { var data = JSON.parse(text); if (!data || typeof data !== 'object' || !Array.isArray(data.activities)) return { ok: false, error: '文件格式不正确：缺少 activities 列表' }; return { ok: true, state: normalizeState(data) }; } catch (e) { return { ok: false, error: '无法解析 JSON：' + e.message }; } }
  NS.storage = { KEY: KEY, CATALOG_VERSION: CATALOG_VERSION, DEFAULT_CATEGORIES: DEFAULT_CATEGORIES, BUILTIN_META: BUILTIN_META, genId: genId, now: now, defaultState: defaultState, normalizeState: normalizeState, loadState: loadState, saveState: saveState, exportJSON: exportJSON, importJSON: importJSON, resetSample: resetSample, storageAvailable: storageAvailable };
})();
