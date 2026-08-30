(function () {
  'use strict';
  // 内置“玩一玩”目录：一项一行，便于人工查看和维护。
  var catalog = [
    ['洪恩识字','Honso Literacy','learning','📚'], ['数学启蒙','Early Math','learning','🔢'], ['看布鲁伊动画片','Watch Bluey','learning','📺'],
    ['学习英语','Learn English','learning','🗣️'], ['科普动画片','Science Cartoon','learning','🔬'], ['磁力片搭城堡','Magnetic Castle','toy','🏰'],
    ['乐高搭动物乐园','LEGO Animal Park','toy','🦁'], ['拼图闯关','Puzzle Challenge','toy','🧩'], ['积木搭小房子','Build a Little House','toy','🧱'],
    ['三只小猪','The Three Little Pigs','toy','🐷'], ['超级密码机','Super Code Machine','toy','🔐'], ['磁力块','Magnetic Blocks','toy','🔷'],
    ['飞行棋大战','Flying Chess','board','🎲'], ['动物有钱','Animal Money','board','🐘'], ['记忆翻牌配对','Memory Match','board','🃏'],
    ['熊猫餐厅','Panda Restaurant','board','🐼'], ['长颈鹿围巾','Giraffe Scarf','board','🦒'], ['读中文绘本','Read a Chinese Picture Book','book','📖'],
    ['读英文绘本','Read an English Picture Book','book','📘'], ['纸盘做面具','Paper Plate Mask','craft','🎭'], ['橡皮泥捏小动物','Clay Animals','craft','🐣'],
    ['折纸飞机比赛','Paper Airplane Race','craft','✈️'], ['手工创作','Free Craft','craft','✂️'], ['画一幅画','Draw a Picture','craft','🎨'],
    ['客厅音乐会','Living Room Concert','role','🎤'], ['医生游戏','Doctor Game','role','🩺'], ['蹦床','Trampoline','fitness','🤸'],
    ['吊单杠','Bar Hang','fitness','🧗'], ['仰卧起坐','Sit-Ups','fitness','💪'], ['旱地自由泳','Dry-Land Freestyle','fitness','🏊']
  ].map(function (r) {
    return { id: 'play-' + r[0], nameZh: r[0], nameEn: r[1], categoryId: r[2], emoji: r[3],
      descriptionZh: '和家人一起完成一个小挑战，玩完后分享你的发现。',
      descriptionEn: 'Try a small challenge together and share what you discovered.', source: 'builtin' };
  });
  window.GamePicker = window.GamePicker || {};
  window.GamePicker.playCatalog = catalog;
})();
