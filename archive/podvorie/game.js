// =====================================================================
//  СКАЗОЧНОЕ ПОДВОРЬЕ — соединяй одинаковое, выполняй заказы, отстраивай деревню
// =====================================================================
const COLS = 7, ROWS = 8, SPR = 16;
const ENERGY_MAX0 = 50, ENERGY_REGEN = 45;   // секунд на единицу энергии
let soundOn = true, G = null, dirty = true;
const $ = id => document.getElementById(id);
function load(key, def) { try { const v = localStorage.getItem("podv_" + key); return v === null ? def : JSON.parse(v); } catch (e) { return def; } }
function save(key, val) { try { localStorage.setItem("podv_" + key, JSON.stringify(val)); } catch (e) {} }
// время года — как за окном
function seasonOf() { const m = new Date().getMonth(); return m >= 2 && m <= 4 ? 0 : m >= 5 && m <= 7 ? 1 : m >= 8 && m <= 10 ? 2 : 3; }
// ---------------------------------------------------------------- предметы
const CHAINS = {
  grain: { gen: "field", items: ["Колосок", "Сноп", "Мешок зерна", "Мешок муки", "Каравай", "Пирог"] },
  wood: { gen: "forest", items: ["Щепка", "Полено", "Бревно", "Поленница", "Сруб"] },
  stone: { gen: "quarry", items: ["Камушек", "Булыжник", "Валун", "Тёсаный камень"] },
};
const GENS = { field: { name: "Поле", chain: "grain", desc: "Нажми — вырастет колосок" }, forest: { name: "Опушка", chain: "wood", desc: "Нажми — нарубишь щепок" }, quarry: { name: "Каменоломня", chain: "stone", desc: "Нажми — наломаешь камней" } };
const itemName = it => it.gen ? GENS[it.gen].name : CHAINS[it.c].items[it.l - 1];
const maxLvl = c => CHAINS[c].items.length;
const PAL = {
  Y: "#f2c740", y: "#c8962a", h: "#fff4b0", g: "#6aa83a", G: "#3f7a2a", S: "#e8d8b0", s: "#c0a878", t: "#8a5a2a", W: "#fbfaf4", w: "#d6d2c6",
  K: "#e8a850", k: "#b8702a", c: "#7a4418", R: "#d03a2a", r: "#8a1a1a", L: "#b07a40", l: "#7a4e24", E: "#ecca90", e: "#c09050",
  A: "#a0a0a8", a: "#6a6a74", H: "#d0d0d8", M: "#8a5a30", m: "#5a3a1a", B: "#7a7a82", I: "#c8c8d0", Z: "#4a4a52", T: "#d8b070",
};
const ART = {
  grain1: ["................", ".......Y........", "......YhY.......", ".......Y.Y......", "......YyYhY.....", ".......YyY......", "......YhYy......", ".......YyY......", "........y.......", "........g.......", "........g.......", ".......gg.......", "........g.......", "........g.......", "................", "................"],
  grain2: ["................", "...Y..Y..Y..Y...", "..YhY.YhY.YhY...", "...YyYYyYYyY....", "....YYyyyYY.....", ".....YyyyY......", "......yyy.......", ".....ttttt......", "......yyy.......", ".....yyyyy......", "....yy.y.yy.....", "...yy..y..yy....", "..y....y....y...", "................", "................", "................"],
  grain3: ["................", "......tt........", ".....tYYt.......", "......SS........", ".....SSSS.......", "....SSSSSSs.....", "...SSSSSSSSs....", "..SSSSYSSSSss...", "..SSSYyYSSSss...", "..SSSSYSSSSss...", "..SSSSSSSSSss...", "..sSSSSSSSsss...", "...sssssssss....", "................", "................", "................"],
  grain4: ["................", "....W..W........", ".....WW.W.......", "......tt........", ".....tWWt.......", "......WW........", ".....WWWWw......", "....WWWWWWw.....", "...WWWWWWWww....", "..WWWWRWWWWww...", "..WWWRrRWWWww...", "..WWWWRWWWWww...", "..wWWWWWWWwww...", "...wwwwwwwww....", "................", "................"],
  grain5: ["................", "................", "................", "....kkkkkkkk....", "...kKKKKKKKKk...", "..kKKhKKKKhKKk..", "..kKKKKKKKKKKk..", ".kKKKcKKKcKKKKk.", ".kKKKKKKKKKKKKk.", ".kkKKKKKKKKKKkk.", "..ckkkkkkkkkkc..", "...cccccccccc...", "................", "................", "................", "................"],
  grain6: ["................", "................", "................", "...kkkkkkkkkk...", "..kKRKRKRKRKKk..", "..kRKRKRKRKRKk..", "..kKRKRKRKRKKk..", "..kRKRKRKRKRKk..", "..kKKKKKKKKKKk..", "..kkkkkkkkkkkk..", ".cKKKKKKKKKKKKc.", ".cccccccccccccc.", "................", "................", "................", "................"],
  wood1: ["................", "................", "................", "................", "................", "..........ll....", "........lLLl....", "......lLLLl.....", "....lLLELl......", "...lLLLLl.......", "....llll........", "................", "................", "................", "................", "................"],
  wood2: ["................", "................", "................", "................", "................", "...lLLLLLLLEE...", "..lLLLLLLLEeeE..", "..lLlLLLlLEeEE..", "..lLLLLLLLEeeE..", "...lllllllEEE...", "................", "................", "................", "................", "................", "................"],
  wood3: ["................", "................", "................", "................", "................", ".lLLLLLLLLLLLEE.", "lLLLlLLLLlLLEeeE", "lLLLLLLLLLLLEeEE", "lLlLLLLlLLLLEeeE", ".llllllllllllEE.", "................", "................", "................", "................", "................", "................"],
  wood4: ["................", "................", "......EEEE......", ".....EeeeeE.....", ".....EeEEeE.....", "....EEEEEEEEE...", "...EeeeEEeeeeE..", "...EeEeEEeEEeE..", "..EEEEEEEEEEEEE.", ".EeeeEEeeeEEeeeE", ".EeEeEEeEeEEeEeE", ".EEEEEEEEEEEEEEE", "................", "................", "................", "................"],
  wood5: ["................", ".......ll.......", "......lLLl......", ".....lLLLLl.....", "....lLLLLLLl....", "...lLLLLLLLLl...", "..llllllllllll..", "..ELLLLLLLLLLE..", "..EllllllllllE..", "..ELLLmmmmLLLE..", "..EllllmmlllE...", "..ELLLLmmLLLLE..", "..EllllmmllllE..", "..EEEEEEEEEEEE..", "................", "................"],
  stone1: ["................", "................", "................", "................", "................", "................", "................", "......AAA.......", ".....AHHAa......", ".....AAAAa......", "......aaa.......", "................", "................", "................", "................", "................"],
  stone2: ["................", "................", "................", "................", "................", ".....AAAAA......", "....AHHAAAa.....", "...AHHAAAAAa....", "...AAAAAAAAa....", "....aAAAAaaa....", ".....aaaaa......", "................", "................", "................", "................", "................"],
  stone3: ["................", "................", "................", "......AAAA......", "....AAHHAAAA....", "...AHHHAAAAAa...", "..AHHAAAAAAAaa..", "..AAAAAaAAAAaa..", "..AAAAAAAAAaaa..", "..aAAAAAAAaaaa..", "...aaAAAAaaaa...", ".....aaaaaa.....", "................", "................", "................", "................"],
  stone4: ["................", "................", "................", "...HHHHHHHHHH...", "..HIIIIIIIIIIB..", "..HIIIIIIIIIIB..", "..HBBBBBBBBBBB..", "..HIIIIBIIIIIB..", "..HIIIIBIIIIIB..", "..HBBBBBBBBBBB..", "..HIIBIIIIBIIB..", "..BBBBBBBBBBBB..", "................", "................", "................", "................"],
  field: ["................", "..g..g..g..g....", ".gYg.gYg.gYg.g..", "MMMMMMMMMMMMMMM.", "mmmmmmmmmmmmmmm.", "..g..g..g..g....", ".gYg.gYg.gYg.g..", "MMMMMMMMMMMMMMM.", "mmmmmmmmmmmmmmm.", "..g..g..g..g....", ".gYg.gYg.gYg.g..", "MMMMMMMMMMMMMMM.", "mmmmmmmmmmmmmmm.", "................", "................", "................"],
  forest: ["....GG..........", "...GggG...GG....", "..GgggGG.GggG...", "..GGgGG.GgggGG..", "...GGG...GGgG...", "....l.....GG....", "....l......l....", "...........l....", "....EEEEE.......", "...EeeeeeE...Z..", "...EeEEEeE..ZIZ.", "...EeeeeeE...l..", "...LLLLLLL...l..", "...LlLLlLL...l..", "...LLLLLLL......", "................"],
  quarry: ["................", "................", ".....AAAA.......", "...AAHHAAAA.....", "..AHHHAAAAAAa...", ".AHHAAAaAAAAaa..", ".AAAAAAAAAAAaa..", ".AAAaAAAAAAaaa..", "..aAAAAAAAaaa...", "...aaaaaaaa..ZZZ", "............ZIIZ", "...........l.ZZ.", "..........l.....", ".........l......", "........l.......", "................"],
};
const SPRITES = {};
function sprite(key) {
  if (SPRITES[key]) return SPRITES[key];
  const rows = ART[key], cv = document.createElement("canvas"); cv.width = SPR + 2; cv.height = SPR + 2;
  const g = cv.getContext("2d"), on = (x, y) => y >= 0 && y < SPR && x >= 0 && x < SPR && rows[y][x] !== ".";
  for (let y = -1; y <= SPR; y++) for (let x = -1; x <= SPR; x++) {   // тёмный контур вокруг рисунка
    if (on(x, y)) { g.fillStyle = PAL[rows[y][x]]; g.fillRect(x + 1, y + 1, 1, 1); }
    else if (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1)) { g.fillStyle = "#2a1a10"; g.fillRect(x + 1, y + 1, 1, 1); }
  }
  return (SPRITES[key] = cv);
}
const keyOf = it => it.gen || it.c + it.l;
// ---------------------------------------------------------------- деревня
const TASKS = [
  { name: "Расчистить двор от бурьяна", stars: 1, give: "Фома: «Ну вот, барин, и место для жизни нашлось»" },
  { name: "Починить колодец", stars: 2, give: "Народ: «Вода чистая, студёная — спасибо!»" },
  { name: "Поставить избу Фомы", stars: 3, give: "Фома: «Своя крыша над головой. Век не забуду»" },
  { name: "Срубить баню", stars: 4, give: "Кузьма: «С лёгким паром, хозяин! Энергии — на десятерых»", perk: "energy" },
  { name: "Мельница у ручья", stars: 5, give: "Водяной: «Буль… Мельницу поставили, а меня не спросили. Ладно уж»" },
  { name: "Кузница", stars: 5, give: "Кузьма: «Теперь и гвозди свои, и подковы»" },
  { name: "Изба старосты Кузьмы", stars: 6, give: "Кузьма: «Артель в сборе — деревня оживает!»" },
  { name: "Церковь с золотой луковкой", stars: 8, give: "Воевода: «Звонят колокола! Подворье твоё — на весь край слава»" },
];
// ---------------------------------------------------------------- заказы
const ORDER_PEOPLE = {
  grain: [["narod", "Хлебушка бы к столу"], ["foma", "Барин, муки на блины"], ["yaga", "Пирожка мне, соколик, — не съем тебя"], ["leshiy", "Каравай — лучшее подношение лесу"]],
  wood: [["kuzma", "На баньку брёвнышек"], ["leshiy", "Только сухостой бери, живое не трожь"], ["narod", "Дров к зиме"]],
  stone: [["voevoda", "Камня на стену детинца"], ["vodyanoy", "Камушков на дно омута, буль"], ["kuzma", "На печку кирпича бы"]],
};
function newOrder() {
  const lvlCap = 2 + Math.min(4, Math.floor(G.done / 3));
  const chains = Object.keys(CHAINS), c = chains[Math.floor(Math.random() * chains.length)];
  const [who, say] = ORDER_PEOPLE[c][Math.floor(Math.random() * ORDER_PEOPLE[c].length)];
  const items = [{ c, l: 1 + Math.floor(Math.random() * Math.min(lvlCap, maxLvl(c))) }];
  if (G.done >= 2 && Math.random() < 0.45) { const c2 = chains[Math.floor(Math.random() * chains.length)]; items.push({ c: c2, l: 1 + Math.floor(Math.random() * Math.min(lvlCap - 1, maxLvl(c2))) }); }
  const worth = items.reduce((a, it) => a + 2 ** (it.l - 1), 0);
  return { id: G.uid++, who, say, items, coins: 4 + worth * 3, stars: worth >= 8 ? 3 : worth >= 3 ? 2 : 1 };
}
// ---------------------------------------------------------------- состояние
function newGame() {
  G = { board: new Array(COLS * ROWS).fill(null), energy: ENERGY_MAX0, emax: ENERGY_MAX0, eTime: Date.now(), coins: 20, stars: 0, done: 0, task: 0, orders: [], uid: 1, tut: 0, sel: null };
  G.board[idx(1, 7)] = { gen: "field" }; G.board[idx(3, 7)] = { gen: "forest" }; G.board[idx(5, 7)] = { gen: "quarry" };
  G.board[idx(2, 4)] = { c: "grain", l: 1 }; G.board[idx(4, 3)] = { c: "wood", l: 1 }; G.board[idx(3, 2)] = { c: "stone", l: 1 };
  G.orders = [{ id: G.uid++, who: "foma", say: "Барин, с почином! Снопик бы", items: [{ c: "grain", l: 2 }], coins: 10, stars: 1 }, newOrder(), newOrder()];
  saveGame();
}
const idx = (x, y) => y * COLS + x;
function saveGame() { save("game", G); }
function tickEnergy() {
  const now = Date.now();
  if (G.energy >= G.emax) { G.eTime = now; return; }
  const gained = Math.floor((now - G.eTime) / (ENERGY_REGEN * 1000));
  if (gained > 0) { G.energy = Math.min(G.emax, G.energy + gained); G.eTime += gained * ENERGY_REGEN * 1000; dirty = true; saveGame(); }
}
// ---------------------------------------------------------------- действия
let fx = [];   // всплывающие эффекты на поле
function spawn(genIdx) {
  const gen = G.board[genIdx]; if (!gen || !gen.gen) return;
  if (G.energy <= 0) { toast("Энергия кончилась — подожди или возьми за ролик"); sfx(FX.bad); return; }
  const gx = genIdx % COLS, gy = Math.floor(genIdx / COLS);
  let best = -1, bd = 1e9;
  G.board.forEach((v, i) => { if (v) return; const d = Math.hypot(i % COLS - gx, Math.floor(i / COLS) - gy); if (d < bd) { bd = d; best = i; } });
  if (best < 0) { toast("Двор заставлен — соедини или продай что-нибудь"); sfx(FX.bad); return; }
  G.energy--; if (G.energy === G.emax - 1) G.eTime = Date.now();
  const c = GENS[gen.gen].chain, l = Math.random() < 0.1 ? 2 : 1;
  G.board[best] = { c, l };
  fx.push({ kind: "fly", from: genIdx, to: best, t0: performance.now(), key: c + l });
  sfx(FX.step); if (G.tut === 0) G.tut = 1;
  dirty = true; saveGame();
}
function dropOn(from, to) {
  if (from === to) return false;
  const a = G.board[from], b = G.board[to];
  if (!a || a.gen) return false;
  if (b && !b.gen && b.c === a.c && b.l === a.l && a.l < maxLvl(a.c)) {   // соединение
    G.board[from] = null; G.board[to] = { c: a.c, l: a.l + 1 };
    fx.push({ kind: "pop", at: to, t0: performance.now() });
    sfx(a.l + 1 === maxLvl(a.c) ? FX.win : FX.found); if (G.tut <= 1) G.tut = 2;
    G.sel = to;
  } else if (!b) { G.board[to] = a; G.board[from] = null; G.sel = to; sfx(FX.click); }
  else if (!b.gen) { G.board[to] = a; G.board[from] = b; G.sel = to; sfx(FX.click); }
  else return false;
  dirty = true; saveGame(); return true;
}
function haveItems(o) {
  const used = new Set();
  for (const it of o.items) { const i = G.board.findIndex((v, k) => v && !v.gen && v.c === it.c && v.l === it.l && !used.has(k)); if (i < 0) return null; used.add(i); }
  return [...used];
}
function deliver(id) {
  const o = G.orders.find(x => x.id === id); if (!o) return;
  const cells = haveItems(o); if (!cells) return;
  for (const i of cells) { fx.push({ kind: "pop", at: i, t0: performance.now(), gone: true }); G.board[i] = null; }
  G.coins += o.coins; G.stars += o.stars; G.done++; G.sel = null;
  G.orders[G.orders.indexOf(o)] = newOrder();
  sfx(FX.coin); if (G.tut <= 2) G.tut = 3;
  toast(`+${o.coins} монет, +${o.stars} ★`);
  dirty = true; saveGame();
}
function sellSel() {
  const it = G.board[G.sel]; if (!it || it.gen) return;
  const price = 2 ** (it.l - 1); G.coins += price; G.board[G.sel] = null; G.sel = null;
  sfx(FX.coin); dirty = true; saveGame();
}
function buildTask() {
  const t = TASKS[G.task]; if (!t || G.stars < t.stars) return;
  G.stars -= t.stars; G.task++; G.coins += 10 * G.task;
  if (t.perk === "energy") { G.emax += 10; G.energy = G.emax; }
  sfx(FX.build); setTimeout(() => sfx(FX.win), 250);
  const [who, ...rest] = t.give.split(": ");
  showSay({ Фома: "foma", Народ: "narod", Кузьма: "kuzma", Водяной: "vodyanoy", Воевода: "voevoda" }[who] || "narod", rest.join(": ").replace(/[«»]/g, ""));
  dirty = true; saveGame();
}
function buyEnergy() { if (G.coins < 40) return toast("Нужно 40 монет"); G.coins -= 40; G.energy = Math.min(G.emax + 20, G.energy + 20); sfx(FX.coin); dirty = true; saveGame(); }
function adEnergy() {   // ролик за награду: подключится через SDK Яндекса
  if (window.ysdk) { window.ysdk.adv.showRewardedVideo({ callbacks: { onOpen: () => muteAll(true), onRewarded: () => { G.energy += 25; saveGame(); dirty = true; }, onClose: () => muteAll(false) } }); return; }
  G.energy += 25; toast("+25 энергии (ролик появится в версии для Яндекса)"); sfx(FX.coin); dirty = true; saveGame();
}
function muteAll(m) { if (master) master.gain.value = m ? 0 : 0.32; }
let toastT = 0;
function toast(t) { const el = $("toast"); el.textContent = t; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => el.hidden = true, 2200); }
