/* 聊天话题逻辑：筛选、随机抽取、避免立即重复 */
(function () {
  'use strict';
  var NS = (window.GamePicker = window.GamePicker || {});
  function filter(topics, categoryIds) {
    categoryIds = categoryIds || [];
    if (!categoryIds.length) return (topics || []).slice();
    return (topics || []).filter(function (topic) { return categoryIds.indexOf(topic.categoryId) !== -1; });
  }
  function pick(topics, lastTopicId) {
    if (!topics || !topics.length) return null;
    var pool = topics;
    if (topics.length > 1 && lastTopicId) {
      var fresh = topics.filter(function (topic) { return topic.id !== lastTopicId; });
      if (fresh.length) pool = fresh;
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }
  function byId(topics, id) {
    return (topics || []).find(function (topic) { return topic.id === id; }) || null;
  }
  NS.chatLogic = { filter: filter, pick: pick, byId: byId };
})();
