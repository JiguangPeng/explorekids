/* ==========================================================================
   推荐引擎 · recommend.js（纯函数，无 DOM 依赖，可单测）
   挂载到 window.GamePicker.recommend
   ========================================================================== */
(function () {
  'use strict';
  var NS = (window.GamePicker = window.GamePicker || {});

  /* 时长区间 */
  var DURATION = { short: 15, medium: 30 };

  /**
   * 按条件过滤活动
   * @param {Array} activities 全部活动
   * @param {Object} options
   *   - categoryIds: string[]（空/缺省 = 全部）
   *   - duration: 'short'|'medium'|'long'|null
   *   - energy: '安静'|'适中'|'活跃'|null
   *   - players: '独自'|'亲子'|'多人'|null
   *   - indoorOutdoor: '室内'|'户外'|'皆可'|null
   *   - favoriteOnly: boolean
   */
  function filter(activities, options) {
    options = options || {};
    return activities.filter(function (a) {
      if (options.categoryIds && options.categoryIds.length && options.categoryIds.indexOf(a.categoryId) === -1) return false;
      if (options.energy && a.energyLevel !== options.energy) return false;
      if (options.players && a.players !== options.players) return false;
      // 「皆可」的活动匹配任意选择；选择「皆可」则不限制
      if (options.indoorOutdoor && options.indoorOutdoor !== '皆可' &&
          a.indoorOutdoor !== options.indoorOutdoor && a.indoorOutdoor !== '皆可') return false;
      if (options.duration) {
        var d = a.durationMinutes || 0;
        if (options.duration === 'short' && d > DURATION.short) return false;
        if (options.duration === 'medium' && (d <= DURATION.short || d > DURATION.medium)) return false;
        if (options.duration === 'long' && d <= DURATION.medium) return false;
      }
      if (options.favoriteOnly && !a.favorite) return false;
      return true;
    });
  }

  /**
   * 从候选池中抽取一个：优先避开最近 pick 过的，并按「越久没被推荐权重越高」加权随机
   * @param {Array} pool 候选池
   * @param {number} avoidRecentCount 避开的最近数量
   */
  function pick(pool, avoidRecentCount) {
    if (!pool || !pool.length) return null;
    var n = (typeof avoidRecentCount === 'number') ? Math.max(0, Math.floor(avoidRecentCount)) : 0;
    var candidates = pool.slice();
    if (n > 0 && pool.length > n) {
      var sorted = pool.slice().sort(function (a, b) { return (b.lastPickedAt || 0) - (a.lastPickedAt || 0); });
      var recent = {};
      for (var i = 0; i < n && i < sorted.length; i++) recent[sorted[i].id] = true;
      var fresh = pool.filter(function (a) { return !recent[a.id]; });
      if (fresh.length) candidates = fresh;
    }
    return weightedByRecency(candidates);
  }

  function weightedByRecency(list) {
    var nowMs = Date.now();
    var DAY = 30 * 24 * 3600 * 1000;
    var weights = list.map(function (a) {
      var last = a.lastPickedAt || 0;
      var age = nowMs - last;
      if (age < 0) age = 0;
      return 1 + Math.min(age, DAY); // 越久没被推荐权重越高
    });
    var total = 0;
    for (var i = 0; i < weights.length; i++) total += weights[i];
    var r = Math.random() * total;
    for (var j = 0; j < list.length; j++) {
      r -= weights[j];
      if (r <= 0) return list[j];
    }
    return list[list.length - 1];
  }

  NS.recommend = {
    filter: filter,
    pick: pick,
    weightedByRecency: weightedByRecency
  };
})();
