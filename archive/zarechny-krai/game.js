// =====================================================================
//  ЗАРЕЧНЫЙ КРАЙ — освоение по ходам. Обоз переселенцев, туман, города,
//  нечисть со своими интересами, лихие люди и мелкие беды каждый месяц.
// =====================================================================
const MW = 30, MH = 30, TS = 16;   // клеток по ширине и высоте, пикселей арта в клетке
const WATER = 0, MEADOW = 1, FOREST = 2, PINE = 3, HILLS = 4, MOUNT = 5, MARSH = 6;
const TERR = [
  { name: "Озеро", f: 2, w: 0, s: 0, m: 0, cost: 99 },
  { name: "Луг", f: 2, w: 0, s: 0, m: 0, cost: 1 },
  { name: "Лес", f: 1, w: 2, s: 0, m: 0, cost: 2 },
  { name: "Бор", f: 0, w: 3, s: 0, m: 0, cost: 2 },
  { name: "Холмы", f: 1, w: 0, s: 2, m: 0, cost: 2 },
  { name: "Горы", f: 0, w: 0, s: 1, m: 1, cost: 3 },
  { name: "Болото", f: 1, w: 1, s: 0, m: 0, cost: 3 },
];
const RES = { iron: { name: "железо", s: 2, m: 1 }, fish: { name: "рыба", f: 2 }, game: { name: "дичь", f: 1, m: 1 }, salt: { name: "соль", m: 3 }, soil: { name: "чернозём", f: 2 } };
const MONTHS = ["Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь", "Январь", "Февраль"];
const BUILD = {
  ambar: { name: "Амбар", w: 15, s: 0, m: 0, turns: 2, desc: "Хранит хлеб: после прироста жителей запас не пропадает, голод и неурожай вдвое мягче." },
  banya: { name: "Баня", w: 15, s: 5, m: 0, turns: 2, desc: "+8 к довольству. Мор обходит город стороной." },
  lesopilka: { name: "Лесопилка", w: 10, s: 5, m: 0, turns: 2, desc: "+1 дерево с каждой лесной клетки. Лешему это не понравится." },
  chastokol: { name: "Частокол", w: 25, s: 0, m: 0, turns: 3, desc: "Лихие люди не смеют грабить город." },
  melnica: { name: "Мельница", w: 15, s: 10, m: 0, turns: 3, desc: "+25% хлеба. У реки — водяная, и Водяной будет ворчать." },
  kuznya: { name: "Кузница", w: 10, s: 15, m: 0, turns: 3, desc: "Инструменты: +1 хлеб с лугов и +1 камень с холмов и гор." },
  torg: { name: "Торг", w: 20, s: 5, m: 20, turns: 3, desc: "+3 монеты в месяц, ещё +1 за каждую реку рядом. +5 к довольству." },
  church: { name: "Церковь", w: 25, s: 25, m: 40, turns: 4, desc: "+15 к довольству. Кикимора и прочая мелкая нечисть её боятся." },
};
const UNITS = {
  settlers: { name: "Переселенцы", mv: 2, f: 25, w: 10, s: 0, m: 0, turns: 3, minPop: 3, desc: "Обоз с семьями: найдите место и заложите новый город. Город теряет одного жителя." },
  druzhina: { name: "Дружина", mv: 2, f: 0, w: 10, s: 10, m: 40, turns: 3, minPop: 2, str: 5, desc: "Воины: разгоняют логова разбойников, могут выйти и против Змея." },
};
const FAC = {
  leshiy: { name: "Леший", site: "Чаща Лешего", wants: "Бережёт лес. Злится, когда рубят чащу и ставят лесопилки." },
  vodyanoy: { name: "Водяной", site: "Омут Водяного", wants: "Хозяин рек и озёр. Не любит, когда ловят его рыбу и ставят мельницы." },
  yaga: { name: "Баба-Яга", site: "Избушка на курьих ножках", wants: "Сама себе на уме: торгует зельями и знаниями, избушка бродит по краю." },
  gorynych: { name: "Змей Горыныч", site: "Огненная гора", wants: "Требует дани золотом и хлебом. Не дашь — жжёт города." },
  kikimora: { name: "Кикимора", site: "Кикиморино болото", wants: "Мелкая пакостница с болот: портит запасы и путает пряжу в ближних городах." },
};

const PEOPLE = {
  voevoda: { name: "Воевода Ярослав Мстиславич", role: "правит краем от имени князя" },
  foma: { name: "Фома Лукич", role: "старый приказчик, идёт с обозом" },
  grabov: { name: "Гаврила Грабов", role: "купец-ростовщик, наживается на чужой беде" },
  dyak: { name: "Дьяк Ерёма Кривой", role: "мздоимец из приказной избы" },
  liho: { name: "Атаман Лихо", role: "главарь разбойной ватаги" },
  kuzma: { name: "Староста Кузьма", role: "плотницкая артель" },
  narod: { name: "Народ", role: "вести из городов" },
  leshiy: { name: "Леший", role: "хозяин леса" },
  vodyanoy: { name: "Водяной", role: "хозяин омута" },
  yaga: { name: "Баба-Яга", role: "живёт в избушке на курьих ножках" },
  gorynych: { name: "Змей Горыныч", role: "трёхглавый змей с Огненной горы" },
  kikimora: { name: "Кикимора", role: "болотная пакостница" },
};
const CITY_NAMES = ["Заречье", "Берёзовка", "Ключи", "Красный Яр", "Сосновка", "Медвежий Угол", "Ольховка", "Студёный", "Белый Камень", "Рябиновка", "Светлояр", "Овражки", "Липки", "Дубрава", "Кремнёв", "Тихий Бор"];
const CHAPTERS = [
  { title: "Новая земля", goal: () => "найди хорошее место и заложи первый город", done: () => G.cities.length >= 1,
    intro: ["voevoda", "Князь жалует тебе Заречный край — дикий, нехоженый. Бери обоз с переселенцами и веди их за реку. Ищи место, где земля родит, а лес и камень под рукой. Да поторапливайся: хлеба в обозе месяцев на восемь."],
    tip: ["foma", "Я, барин, старый, но глаз ещё зоркий. Лучшее место — у реки: и вода, и рыба, и торговым людям путь. Луга дают хлеб, лес — дерево на избы, холмы — камень. Нажми на обоз, потом на клетку — пойдём туда. Над хорошим местом загорятся звёздочки."],
    outro: ["foma", "Вот и первый двор поставили! Теперь, барин, корми людей, а они тебе город вырастят. Да гляди в оба: в этом краю, говорят, не одни люди живут."] },
  { title: "Крепкий двор", goal: () => { const c = G.cities[0]; return `вырасти город до 4 жителей (${c ? c.pop : 0}/4) и построй амбар`; }, done: () => G.cities.some(c => c.pop >= 4 && c.b.ambar),
    outro: ["voevoda", "Слух о твоём городе дошёл до князя. Мало одного двора на целый край: собирай новых переселенцев и закладывай второй город."] },
  { title: "Второй город", goal: () => `заложи второй город (${G.cities.length}/2). Переселенцев собирает город от 3 жителей`, done: () => G.cities.length >= 2,
    outro: ["foma", "Два города — уже край, а не хутор. Только чем дальше в лес, тем больше дров… и тем ближе хозяева здешних мест. С ними, барин, надо уметь ладить. Или драться."] },
  { title: "Хозяева края", goal: () => "подружись с кем-то из нечисти (отношение 70+) или разгони разбойничье логово", done: () => G.flags.lairWon || Object.values(G.fac).some(f => f.met && f.rel >= 70),
    outro: ["voevoda", "Теперь тебя в крае знают и люди, и нелюди. Последнее дело: четыре города, и чтобы один стал настоящей столицей — десять дворов."] },
  { title: "Столица края", goal: () => { const big = Math.max(0, ...G.cities.map(c => c.pop)); return `четыре города (${G.cities.length}/4) и столица на 10 жителей (сейчас ${big})`; }, done: () => G.cities.length >= 4 && G.cities.some(c => c.pop >= 10),
    outro: ["voevoda", "Звонят колокола по всему Заречному краю! Где был бурелом, там теперь пашни и торги. Князь жалует тебя воеводой края. Летописец уже записывает твоё имя."] },
];
let G = null, soundOn = true, sel = null, busy = false, dirty = true, tab = "act";
const $ = id => document.getElementById(id);
const idx = (x, y) => y * MW + x, inMap = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH;
const cheb = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
const month = () => G.turn % 12, year = () => 1 + Math.floor(G.turn / 12), seasonOf = () => Math.floor(month() / 3);
function load(key, def) { try { const v = localStorage.getItem("krai_" + key); return v === null ? def : JSON.parse(v); } catch (e) { return def; } }
function save(key, val) { try { localStorage.setItem("krai_" + key, JSON.stringify(val)); } catch (e) {} }
// ---------------------------------------------------------------- карта
function genMap(seed) {
  const R = rng(seed), t = new Array(MW * MH), res = new Array(MW * MH).fill(null), river = new Array(MW * MH).fill(0), elev = new Array(MW * MH);
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const e = vnoise(x, y, 7, seed) * 0.62 + vnoise(x, y, 3, seed + 1) * 0.38, m = vnoise(x, y, 6, seed + 2) * 0.8 + vnoise(x, y, 2.5, seed + 3) * 0.2, i = idx(x, y);
    elev[i] = e;
    t[i] = e < 0.27 ? WATER : e > 0.77 ? MOUNT : e > 0.65 ? HILLS : m > 0.64 && e < 0.42 ? MARSH : m > 0.48 ? (y < MH * 0.4 || hsh(x, y, seed) < 0.25 ? PINE : FOREST) : MEADOW;
  }
  // реки: от гор вниз к воде
  const tops = [...t.keys()].filter(i => t[i] === HILLS || t[i] === MOUNT).sort(() => R() - 0.5).slice(0, 4);
  for (const s of tops) {
    let i = s, guard = 0;
    while (guard++ < 60) {
      const x = i % MW, y = Math.floor(i / MW);
      if (t[i] === WATER) break;
      if (t[i] !== MOUNT) river[i] = 1;
      const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [x + dx, y + dy]).filter(([a, b]) => inMap(a, b)).map(([a, b]) => idx(a, b));
      if (!nb.length) break;
      let best = nb.reduce((a, b) => elev[a] < elev[b] ? a : b);
      if (elev[best] >= elev[i]) { if (x === 0 || y === 0 || x === MW - 1 || y === MH - 1) break; elev[best] = elev[i] - 0.001; }
      i = best;
    }
  }
  // ресурсы
  for (let i = 0; i < MW * MH; i++) {
    const r = hsh(i, 7, seed), x = i % MW, y = Math.floor(i / MW);
    const coast = t[i] === WATER && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => inMap(x + dx, y + dy) && t[idx(x + dx, y + dy)] !== WATER);
    if ((t[i] === HILLS || t[i] === MOUNT) && r < 0.2) res[i] = "iron";
    else if (coast && r < 0.3) res[i] = "fish";
    else if (t[i] === FOREST && r < 0.18) res[i] = "game";
    else if (t[i] === MARSH && r < 0.3) res[i] = "salt";
    else if (t[i] === MEADOW && r < 0.14) res[i] = "soil";
  }
  return { t, res, river };
}
function newGame(seed) {
  seed = seed || (Date.now() % 1e9);
  const m = genMap(seed), R = rng(seed + 9);
  G = { seed, turn: 0, money: 40, tax: 1, t: m.t, res: m.res, river: m.river, explored: new Array(MW * MH).fill(0), units: [], cities: [], sites: [], fac: {}, log: [], chapter: 0, dialogs: [], won: false, lost: false, uid: 1, flags: {}, convoys: [], names: [...CITY_NAMES].sort(() => R() - 0.5) };
  for (const k of Object.keys(FAC)) G.fac[k] = { rel: 50, met: false, last: -99 };
  // старт: луг у реки ближе к середине юга
  let start = null, bestS = -1;
  for (let y = 4; y < MH - 3; y++) for (let x = 3; x < MW - 3; x++) {
    const i = idx(x, y); if (G.t[i] === WATER || G.t[i] === MOUNT) continue;
    let s = siteScore(x, y) - Math.abs(y - MH * 0.72) * 0.3 - Math.abs(x - MW / 2) * 0.15 + (G.t[i] === MEADOW ? 1 : 0);
    if (s > bestS) { bestS = s; start = { x, y }; }
  }
  // обоз ставим в 3–4 клетках от лучшего места, чтобы было что поискать
  let sp = start;
  for (let r = 4; r >= 2 && sp === start; r--) for (const [dx, dy] of [[0, r], [r, 0], [-r, 0], [0, -r], [r, r], [-r, r]]) { const x = start.x + dx, y = start.y + dy; if (inMap(x, y) && G.t[idx(x, y)] !== WATER && G.t[idx(x, y)] !== MOUNT) { sp = { x, y }; break; } }
  G.units.push({ id: G.uid++, kind: "settlers", x: sp.x, y: sp.y, mv: 2, path: [], food: 8 });
  // особые места: городища, логова, нечисть
  const free = (x, y, d) => inMap(x, y) && G.t[idx(x, y)] !== WATER && !G.sites.some(s => cheb(s, { x, y }) < 3) && cheb({ x, y }, sp) >= d;
  const place = (kind, ok, d, n = 1) => { let tries = 0; while (n > 0 && tries++ < 3000) { const x = Math.floor(R() * MW), y = Math.floor(R() * MH); if (ok(G.t[idx(x, y)], x, y) && free(x, y, d)) { G.sites.push({ kind, x, y, alive: 1, str: 10 + Math.floor(R() * 3) }); n--; } } };
  place("ruin", tt => tt !== MOUNT, 4, 4);
  place("lair", tt => tt === FOREST || tt === PINE || tt === HILLS, 8, 2);
  place("leshiy", (tt, x, y) => (tt === FOREST || tt === PINE) && [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([a, b]) => inMap(x + a, y + b) && [FOREST, PINE].includes(G.t[idx(x + a, y + b)])).length >= 3, 6);
  place("gorynych", tt => tt === MOUNT, 10);
  place("yaga", tt => tt === FOREST || tt === PINE || tt === MARSH, 7);
  place("kikimora", tt => tt === MARSH, 5);
  { let tries = 0; while (tries++ < 2000) { const x = Math.floor(R() * MW), y = Math.floor(R() * MH), i = idx(x, y); if (G.t[i] === WATER && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => inMap(x + a, y + b) && G.t[idx(x + a, y + b)] !== WATER) && cheb({ x, y }, sp) >= 5) { G.sites.push({ kind: "vodyanoy", x, y, alive: 1 }); break; } } }
  for (const k of Object.keys(FAC)) if (!G.sites.some(s => s.kind === k)) G.fac[k].absent = true;
  reveal(sp.x, sp.y, 2);
  say(...CHAPTERS[0].intro, [{ label: "В путь!", act: "ok" }]);
  say(...CHAPTERS[0].tip);
  sel = { unit: G.units[0].id }; centerOn(sp.x, sp.y);
  logMsg("Обоз переселенцев вышел в Заречный край.", true);
  saveGame(); dirty = true;
}
function reveal(x0, y0, r) { for (let y = y0 - r; y <= y0 + r; y++) for (let x = x0 - r; x <= x0 + r; x++) if (inMap(x, y) && (x - x0) ** 2 + (y - y0) ** 2 <= r * r + 1) G.explored[idx(x, y)] = 1; fogDirty = true; }
function visibleSet() {
  const v = new Uint8Array(MW * MH);
  const mark = (x0, y0, r) => { for (let y = y0 - r; y <= y0 + r; y++) for (let x = x0 - r; x <= x0 + r; x++) if (inMap(x, y) && (x - x0) ** 2 + (y - y0) ** 2 <= r * r + 1) v[idx(x, y)] = 1; };
  for (const u of G.units) mark(u.x, u.y, 2);
  for (const c of G.cities) mark(c.x, c.y, c.pop >= 6 ? 3 : 2);
  return v;
}
// ---------------------------------------------------------------- доход клеток
function tileYield(i, city) {
  const tt = G.t[i], base = TERR[tt], y = { f: base.f, w: base.w, s: base.s, m: base.m }, r = G.res[i], si = seasonOf(), mo = month();
  if (r) { const d = RES[r]; y.f += d.f || 0; y.w += d.w || 0; y.s += d.s || 0; y.m += d.m || 0; }
  if (G.river[i]) { y.f += 1; y.m += 1; }
  if (si === 3 && (tt === MEADOW)) y.f = r === "soil" ? 2 : 1;   // зимой поля под снегом
  if (si === 3 && tt === WATER) y.f = Math.max(1, y.f - 1);     // подлёдный лов
  if (mo === 6 && tt === MEADOW) y.f += 1;                        // сентябрь — урожай
  if (city) {
    if (city.b.lesopilka && (tt === FOREST || tt === PINE)) y.w += 1;
    if (city.b.kuznya && tt === MEADOW) y.f += 1;
    if (city.b.kuznya && (tt === HILLS || tt === MOUNT)) y.s += 1;
  }
  const L = G.fac.leshiy.rel, V = G.fac.vodyanoy.rel;
  if ((tt === FOREST || tt === PINE) && !G.fac.leshiy.absent) { if (L >= 70) y.f += 1; else if (L <= 25) y.w = Math.max(0, y.w - 1); }
  if (tt === WATER && !G.fac.vodyanoy.absent) { if (V >= 70) y.f += 1; else if (V <= 25) y.f = Math.max(0, y.f - 1); }
  return y;
}
function siteScore(x, y) {
  let s = 0;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!inMap(x + dx, y + dy)) continue; const i = idx(x + dx, y + dy), tt = G.t[i], b = TERR[tt], r = G.res[i] ? RES[G.res[i]] : {}; s += (b.f + (r.f || 0) + (G.river[i] ? 1 : 0)) * 1.5 + b.w + (r.w || 0) + b.s + (r.s || 0) + (b.m + (r.m || 0) + (G.river[i] ? 1 : 0)) * 0.8; }
  return s;
}
const stars = s => s >= 40 ? 5 : s >= 34 ? 4 : s >= 28 ? 3 : s >= 22 ? 2 : 1;
function canFound(x, y) {
  const i = idx(x, y), tt = G.t[i];
  if (tt === WATER || tt === MOUNT) return "Здесь нельзя ставить город: " + TERR[tt].name.toLowerCase();
  if (G.cities.some(c => cheb(c, { x, y }) < 3)) return "Слишком близко к другому городу (нужно 3 клетки)";
  if (G.sites.some(s => s.alive && s.x === x && s.y === y)) return "Это место уже занято";
  return "";
}
// ---------------------------------------------------------------- города
function foundCity(u) {
  const name = G.names.shift() || "Новый двор " + (G.cities.length + 1);
  const c = { id: G.uid++, name, x: u.x, y: u.y, pop: G.cities.length ? 1 : 2, food: 8, wood: 8, stone: 0, order: 65, build: null, b: {}, focus: "bal", worked: [], last: null };
  G.cities.push(c); G.units.splice(G.units.indexOf(u), 1);
  if (G.t[idx(u.x, u.y)] === FOREST || G.t[idx(u.x, u.y)] === PINE) relChange("leshiy", -5);
  reveal(c.x, c.y, 3); assignWork(c); calcCity(c);
  logMsg(`Заложен город ${name}.`, true); SND.win();
  sel = { city: c.id }; tab = "act"; dirty = true;
}
function cityRadius(c) { return c.pop >= 6 ? 2 : 1; }
function assignWork(c) {
  const takenBy = new Set(); for (const o of G.cities) if (o !== c) for (const i of o.worked) takenBy.add(i);
  const r = cityRadius(c), cand = [];
  for (let y = c.y - r; y <= c.y + r; y++) for (let x = c.x - r; x <= c.x + r; x++) { if (!inMap(x, y) || (x === c.x && y === c.y)) continue; const i = idx(x, y); if (!G.explored[i] || takenBy.has(i) || G.sites.some(s => s.alive && s.x === x && s.y === y && s.kind !== "ruin")) continue; cand.push(i); }
  const W = { bal: [1.4, 1, 0.9, 0.8], food: [2.4, 0.6, 0.5, 0.5], wood: [1, 2.2, 0.6, 0.5], stone: [1, 0.6, 2.2, 0.6], money: [1, 0.5, 0.5, 2.2] }[c.focus];
  c.worked = [];
  let food = cityCenter(c).f - c.pop * 2;
  for (let k = 0; k < Math.min(c.pop, cand.length); k++) {
    let best = null, bs = -1e9;
    for (const i of cand) { if (c.worked.includes(i)) continue; const y = tileYield(i, c), hunger = food < 0 ? 2 : 0; const sc = y.f * (W[0] + hunger) + y.w * W[1] + y.s * W[2] + y.m * W[3]; if (sc > bs) { bs = sc; best = i; } }
    if (best === null) break; c.worked.push(best); food += tileYield(best, c).f;
  }
}
function cityCenter(c) { const y = tileYield(idx(c.x, c.y), c); return { f: Math.max(2, y.f + 1), w: Math.max(1, y.w), s: Math.max(1, y.s), m: y.m + 1 }; }
function calcCity(c) {
  const y = cityCenter(c);
  for (const i of c.worked) { const t = tileYield(i, c); y.f += t.f; y.w += t.w; y.s += t.s; y.m += t.m; }
  if (c.b.melnica) y.f = Math.round(y.f * 1.25);
  if (c.b.torg) { y.m += 3; let rv = 0; for (const i of c.worked) rv += G.river[i]; y.m += Math.min(3, rv); }
  const tax = c.pop * [0, 1, 2][G.tax];
  const winter = seasonOf() === 3, eat = c.pop * 2, heat = winter ? c.pop : 0;
  const need = 10 + c.pop * 6;
  let target = 62 + (c.b.church ? 15 : 0) + (c.b.banya ? 8 : 0) + (c.b.torg ? 5 : 0) - Math.max(0, c.pop - 4) * 4 - [0, 6, 18][G.tax];
  if (y.f - eat < 0 && c.food + y.f - eat < 0) target -= 20;
  if (heat && c.wood + y.w - heat < 0) target -= 15;
  c.last = { ...y, tax, eat, heat, need, net: y.f - eat, target: Math.max(0, Math.min(100, target)) };
  return c.last;
}
function cityTurn(c) {
  assignWork(c); const L = calcCity(c);
  G.money += L.m + L.tax;
  c.wood += L.w - L.heat; c.stone += L.s;
  if (c.wood < 0) { c.wood = 0; logMsg(`${c.name}: нет дров, люди мёрзнут.`, false); }
  c.food += L.net;
  if (c.food < 0) {
    if (c.pop > 1) { c.pop--; logMsg(`${c.name}: голод, один двор опустел.`, false); }
    c.food = 0; c.order -= 8;
  } else if (c.food >= L.need) { c.food = c.b.ambar ? c.food - L.need : Math.floor((c.food - L.need) + L.need * 0.2); c.pop++; logMsg(`${c.name}: прибавилось жителей, теперь ${c.pop}.`, true); }
  c.order += (L.target - c.order) * 0.3; c.order = Math.max(0, Math.min(100, c.order));
  // стройка: при бунте стоит
  if (c.build && c.order >= 25) {
    c.build.left--;
    if (c.build.left <= 0) {
      const k = c.build.key;
      if (UNITS[k]) { const u = { id: G.uid++, kind: k, x: c.x, y: c.y, mv: UNITS[k].mv, path: [], food: k === "settlers" ? 6 : 0 }; G.units.push(u); logMsg(`${c.name}: ${k === "settlers" ? "переселенцы собрались в путь" : "дружина готова выступать"}.`, true); }
      else { c.b[k] = 1; logMsg(`${c.name}: достроили — ${BUILD[k].name}.`, true); if (k === "lesopilka") { relChange("leshiy", -12); if (G.flags.leshiyPromise) { relChange("leshiy", -25); G.flags.leshiyPromise = 0; say("leshiy", "Обещал беречь мой лес — а сам пилы завёл?! Ну, купец, пеняй на себя. Заплутают твои люди в чаще."); } } if (k === "melnica" && hasRiverNear(c)) relChange("vodyanoy", -10); }
      c.build = null;
    }
  }
  calcCity(c);
}
function hasRiverNear(c) { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (inMap(c.x + dx, c.y + dy) && (G.river[idx(c.x + dx, c.y + dy)] || G.t[idx(c.x + dx, c.y + dy)] === WATER)) return true; return false; }
function canStart(c, k) {
  const d = BUILD[k] || UNITS[k];
  if (c.build) return "Уже идёт стройка";
  if (BUILD[k] && c.b[k]) return "Уже построено";
  if (UNITS[k] && c.pop < d.minPop) return `Нужно ${d.minPop} жителя`;
  if ((d.f || 0) > c.food) return `Мало хлеба (${d.f})`;
  if (d.w > c.wood) return `Мало дерева (${d.w})`;
  if (d.s > c.stone) return `Мало камня (${d.s})`;
  if (d.m > G.money) return `Мало денег (${d.m})`;
  return "";
}
function startBuild(c, k) {
  if (canStart(c, k)) return;
  const d = BUILD[k] || UNITS[k];
  c.food -= d.f || 0; c.wood -= d.w; c.stone -= d.s; G.money -= d.m;
  if (UNITS[k] && k === "settlers") { c.pop--; assignWork(c); }
  c.build = { key: k, left: d.turns }; G.flags.built = 1; sfx(FX.build); calcCity(c); dirty = true;
}
// ---------------------------------------------------------------- обозы между своими городами
const CONVOY_AMT = 10, CONVOY_COST = 5, RESN = { food: "хлеба", wood: "дерева", stone: "камня" };
function convoyTime(a, b) { return Math.max(1, Math.ceil(cheb(a, b) / 3)); }
function sendConvoy(from, to, res) {
  if (!from || !to || from === to) return;
  G.convoys = G.convoys || [];
  if (from[res] < CONVOY_AMT) return toast(`На складе мало ${RESN[res]}`);
  if (G.money < CONVOY_COST) return toast("Нужно 5 монет возницам");
  from[res] -= CONVOY_AMT; G.money -= CONVOY_COST;
  const t = convoyTime(from, to);
  G.convoys.push({ from: from.id, to: to.id, res, amt: CONVOY_AMT, left: t, total: t });
  SND.buy(); calcCity(from); toast(`Обоз ушёл в ${to.name}: ${t} мес. пути`); dirty = true; saveGame();
}
function convoysTurn() {
  G.convoys = G.convoys || [];
  for (const v of [...G.convoys]) {
    const A = G.cities.find(c => c.id === v.from), B = G.cities.find(c => c.id === v.to);
    if (!B) { G.convoys.splice(G.convoys.indexOf(v), 1); continue; }
    if (!v.risked && A) {   // на полпути может поджидать ватага Лихо
      v.risked = 1;
      const mid = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 }, lair = G.sites.find(s => s.kind === "lair" && s.alive && cheb(s, mid) <= 4), guard = G.units.some(u => u.kind === "druzhina" && cheb(u, mid) <= 3);
      if (lair && !guard && Math.random() < 0.35) { G.convoys.splice(G.convoys.indexOf(v), 1); say("liho", `Хе-хе, купец! Обоз из ${A.name} в ${B.name} мы встретили в лесочке. ${v.amt} ${RESN[v.res]} теперь наши. Поставил бы дружину у дороги — глядишь, и не тронули бы.`); continue; }
    }
    v.left--;
    if (v.left <= 0) { sfx(FX.coin); B[v.res] += v.amt; G.convoys.splice(G.convoys.indexOf(v), 1); logMsg(`Обоз пришёл в ${B.name}: +${v.amt} ${RESN[v.res]}.`, true); }
  }
}
// ---------------------------------------------------------------- отряды и путь
function moveCost(i, kind) { const tt = G.t[i]; if (tt === WATER) return 99; let c = TERR[tt].cost; if (kind === "druzhina" && tt === MOUNT) c = 2; return c; }
function findPath(u, tx, ty) {
  const N = MW * MH, dist = new Float32Array(N).fill(1e9), prev = new Int32Array(N).fill(-1), done = new Uint8Array(N), s = idx(u.x, u.y), goal = idx(tx, ty);
  dist[s] = 0;
  for (let it = 0; it < N; it++) {
    let a = -1, bd = 1e9; for (let i = 0; i < N; i++) if (!done[i] && dist[i] < bd) { bd = dist[i]; a = i; }
    if (a < 0 || a === goal) break; done[a] = 1;
    const ax = a % MW, ay = Math.floor(a / MW);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue; const x = ax + dx, y = ay + dy; if (!inMap(x, y)) continue;
      const b = idx(x, y); if (done[b]) continue;
      const known = G.explored[b];
      let c = known ? moveCost(b, u.kind) : 2;
      if (c >= 99) continue;
      const lair = G.sites.find(q => q.alive && q.x === x && q.y === y && (q.kind === "lair" || q.kind === "gorynych"));
      if (lair && (u.kind !== "druzhina" || b !== goal)) continue;
      if (dx && dy) c += 0.01;
      if (dist[a] + c < dist[b]) { dist[b] = dist[a] + c; prev[b] = a; }
    }
  }
  if (dist[goal] >= 1e9) return null;
  const path = []; for (let i = goal; i !== s; i = prev[i]) path.unshift({ x: i % MW, y: Math.floor(i / MW) });
  return path;
}
async function walk(u) {
  busy = true;
  while (u.path.length && u.mv > 0) {
    const nx = u.path[0], i = idx(nx.x, nx.y), c = moveCost(i, u.kind);
    if (c >= 99) { u.path = []; break; }
    const site = G.sites.find(q => q.alive && q.x === nx.x && q.y === nx.y);
    if (site && (site.kind === "lair" || site.kind === "gorynych")) { u.path = []; if (u.kind === "druzhina") { u.mv = 0; battle(u, site); } break; }
    u.path.shift(); u.anim = { fx: u.x, fy: u.y, t0: performance.now() };
    u.x = nx.x; u.y = nx.y; u.mv = Math.max(0, u.mv - c); sfx(FX.step);
    reveal(u.x, u.y, 2); dirty = true;
    await new Promise(r => setTimeout(r, 160));
    if (site && site.kind === "ruin") { visitRuin(u, site); }
    if (checkEncounters(u)) { u.path = []; break; }
  }
  u.anim = null; busy = false; dirty = true; saveGame();
}
function orderMove(u, tx, ty) {
  if (busy || (u.x === tx && u.y === ty)) return;
  const p = findPath(u, tx, ty);
  if (!p) { toast("Туда не пройти"); return; }
  u.path = p; G.flags.moved = 1; walk(u);
}
// ---------------------------------------------------------------- нечисть и особые места
function relChange(k, d) { const f = G.fac[k]; if (!f || f.absent) return; f.rel = Math.max(0, Math.min(100, f.rel + d)); }
function relWord(r) { return r >= 80 ? "друг" : r >= 60 ? "благоволит" : r >= 40 ? "присматривается" : r >= 20 ? "сердится" : "враждует"; }
function checkEncounters(u) {
  for (const s of G.sites) {
    if (!s.alive || !FAC[s.kind] || cheb(s, u) > 1) continue;
    const f = G.fac[s.kind];
    if (f.met && G.turn - f.last < 5) continue;
    f.last = G.turn; const first = !f.met; f.met = true;
    encounter(s.kind, first, u); return true;
  }
  return false;
}
function nearestCity(p) { let best = null, bd = 1e9; for (const c of G.cities) { const d = cheb(c, p); if (d < bd) { bd = d; best = c; } } return best; }
function encounter(k, first, u) {
  const c = nearestCity(u);
  if (k === "leshiy") say("leshiy", (first ? "Кто это по моему лесу топчется? Я здесь хозяин, купец. " : "Опять ты… ") + "Лес мой не руби без спросу — и будет тебе и дичь, и тропы прямые. А обидишь — заведу твоих людей в такую глушь, что дорогу домой забудут.",
    [{ label: "Оставить подношение (−15 хлеба)", act: "rel", k, d: 25, food: 15, city: c && c.id }, { label: "Пообещать беречь лес", act: "promise", k }, { label: "Прогнать нечистого", act: "rel", k, d: -25, curse: u.id }]);
  else if (k === "vodyanoy") say("vodyanoy", (first ? "Буль-буль… Новый хозяин на моём берегу? " : "Опять пришёл, купец? ") + "Рыбу мою берёшь, воду мутишь. Брось в омут монету да каравай — и сети твои будут полны. А нет — и половодье придёт, и сети порвутся.",
    [{ label: "Бросить монеты и каравай (−20 монет)", act: "rel", k, d: 25, money: 20 }, { label: "Посмеяться над старым", act: "rel", k, d: -20 }]);
  else if (k === "yaga") say("yaga", (first ? "Фу-фу, русским духом пахнет! " : "Снова ты, соколик? ") + "Не съем, не бойся — я нынче торговать настроена. Есть у меня клубок-путеводец, есть зелье от мора. А могу и словечко шепнуть, где что лежит. Всё не задаром.",
    [{ label: "Клубок: открыть край вокруг (30 монет)", act: "yaga_ball", u: u.id }, { label: "Зелье от мора (40 монет)", act: "yaga_potion" }, { label: "Шепнуть, где логова (20 монет)", act: "yaga_tell" }, { label: "Уйти подобру", act: "ok" }]);
  else if (k === "gorynych") say("gorynych", (first ? "Ррр-ха! Три головы — три вопроса: кто ты, зачем пришёл и что принёс? " : "Опять ты, мелкий? ") + "В моих горах всё моё. Будешь платить дань — жги свои печки спокойно. Не будешь — я их сам подожгу.",
    [{ label: "Поднести дань (60 монет)", act: "rel", k, d: 30, money: 60 }, { label: "Пообещать дань позже", act: "rel", k, d: 0 }, { label: "Плюнуть и уйти", act: "rel", k, d: -20 }]);
  else if (k === "kikimora") say("kikimora", (first ? "Хи-хи-хи… Ой, гости на моём болоте! " : "Опять ты тут шастаешь… ") + "Я бабушка тихая: то кашу посолю, то пряжу спутаю, то крынку разобью. Поставишь мне блюдечко молока — может, и не трону твоих.",
    [{ label: "Поставить угощение (−10 хлеба)", act: "rel", k, d: 30, food: 10, city: c && c.id }, { label: "Прогнать кикимору", act: "kiki_out", city: c && c.id }]);
  SND.event();
}
function visitRuin(u, s) {
  s.alive = 0; const R = Math.random();
  if (R < 0.35) { const m = 40 + Math.floor(Math.random() * 50); G.money += m; say("narod", `Твои люди раскопали старое городище — нашли кубышку с серебром: ${m} монет! Видать, давние хозяева спешили уходить…`); }
  else if (R < 0.6) { reveal(u.x, u.y, 6); say("foma", "В развалинах нашёлся старый чертёж края на бересте. Теперь многое видно, барин, — гляди на карту."); }
  else if (R < 0.8 && u.kind === "settlers") { u.food += 4; say("narod", "В погребе старого городища — бочки с мёдом и сухарями. Переселенцам запасов прибавилось на четыре месяца."); }
  else { for (const c of G.cities) c.order = Math.min(100, c.order + 10); say("narod", "На городище нашли старинную икону в серебряном окладе. По всему краю молебны, народ радуется: +10 к довольству во всех городах."); }
  logMsg("Раскопано старое городище.", true);
}
// ---------------------------------------------------------------- бой на кубике
function battle(u, site) {
  const gor = site.kind === "gorynych", need = gor ? 17 : site.str, bonus = UNITS.druzhina.str + (G.fac.yaga.rel >= 70 ? 2 : 0);
  const roll = 1 + Math.floor(Math.random() * 20), total = roll + bonus, win = total >= need || roll === 20;
  const foeName = gor ? "Змей Горыныч" : "ватага Лихо";
  let text = `Дружина идёт на ${gor ? "Огненную гору" : "логово разбойников"}! Бросок кубика: ${roll} + ${bonus} (дружина) = ${total}, нужно ${need}. `;
  if (win) {
    site.alive = 0;
    if (gor) { G.money += 150; for (const c of G.cities) c.order = Math.min(100, c.order + 25); G.flags.lairWon = 1; G.fac.gorynych.absent = true; text += "Три головы покатились с горы! Змей повержен, в пещере — несметное золото: 150 монет. Весь край ликует!"; }
    else { const loot = 50 + Math.floor(Math.random() * 40); G.money += loot; G.flags.lairWon = 1; text += `Ватага разбежалась по лесам, логово сожгли. Добыча: ${loot} монет.`; }
    SND.win(); logMsg(`Победа: ${foeName} разбит.`, true);
  } else {
    if (roll <= 3) { G.units.splice(G.units.indexOf(u), 1); text += `Неудача! ${foeName} разбил дружину наголову.`; }
    else text += `${foeName} отбился. Дружина отступила, зализывает раны — можно попробовать снова.`;
    logMsg(`Поражение: ${foeName} отбился.`, false);
  }
  say(gor ? "gorynych" : "liho", text, [{ label: "Понятно", act: "ok" }], { dice: roll, need, bonus });
}
// ---------------------------------------------------------------- события месяца
function rnd(a) { return a[Math.floor(Math.random() * a.length)]; }
function monthEvents() {
  const si = seasonOf();
  // нечисть живёт своей жизнью
  if (!G.fac.leshiy.absent) { let wf = 0; for (const c of G.cities) for (const i of c.worked) if (G.t[i] === FOREST || G.t[i] === PINE) wf++; let sawmills = G.cities.filter(c => c.b.lesopilka).length; relChange("leshiy", (50 - G.fac.leshiy.rel) * 0.04 - wf * 0.25 - sawmills * 0.8); }
  if (!G.fac.vodyanoy.absent) { let ww = 0; for (const c of G.cities) for (const i of c.worked) if (G.t[i] === WATER) ww++; relChange("vodyanoy", (50 - G.fac.vodyanoy.rel) * 0.04 - ww * 0.5); }
  // избушка бродит
  const yaga = G.sites.find(s => s.kind === "yaga" && s.alive);
  if (yaga && G.turn % 5 === 0) for (let k = 0; k < 20; k++) { const x = yaga.x + Math.floor(Math.random() * 7) - 3, y = yaga.y + Math.floor(Math.random() * 7) - 3; if (inMap(x, y) && [FOREST, PINE, MARSH].includes(G.t[idx(x, y)]) && !G.cities.some(c => cheb(c, { x, y }) < 2) && !G.sites.some(s => s !== yaga && s.alive && s.x === x && s.y === y)) { yaga.x = x; yaga.y = y; break; } }
  if (!G.cities.length) return;
  const any = rnd(G.cities);
  // Змей требует дани
  const gor = G.sites.find(s => s.kind === "gorynych" && s.alive);
  if (gor && G.turn >= 14 && G.turn % (G.fac.gorynych.rel >= 70 ? 14 : 8) === 0) {
    const near = G.cities.filter(c => cheb(c, gor) <= 10); if (near.length) {
      const c = rnd(near), ch = [{ label: "Отдать дань (60 монет)", act: "gor_pay" }, { label: "Отказать", act: "gor_no", city: c.id }];
      if (G.units.some(u => u.kind === "druzhina")) ch.push({ label: "Пусть дружина идёт на гору", act: "gor_fight" });
      G.fac.gorynych.met = true;
      return say("gorynych", `Ррр! Пора платить, купец. Шестьдесят монет — и ${c.name} будет стоять. А нет — от твоего города останутся одни головешки!`, ch);
    }
  }
  // разбойники
  for (const lair of G.sites.filter(s => s.kind === "lair" && s.alive)) {
    if (Math.random() > 0.14) continue;
    const near = G.cities.filter(c => cheb(c, lair) <= 8 && !c.b.chastokol); if (!near.length) continue;
    const c = rnd(near), ch = [{ label: "Откупиться (30 монет)", act: "liho_pay", city: c.id }, { label: "Не дам!", act: "liho_no", city: c.id }];
    return say("liho", `Хорош город ${c.name}, купец. Будет жаль, если амбары сгорят. Тридцать монет — и мы тебя не тронем. Частокол поставишь — тогда и поговорим, хе-хе.`, ch);
  }
  // мелкая нечисть по нраву
  const kiki = G.sites.find(s => s.kind === "kikimora" && s.alive);
  if (kiki && G.fac.kikimora.rel < 60 && Math.random() < 0.15) { const near = G.cities.filter(c => cheb(c, kiki) <= 5 && !c.b.church); if (near.length) { const c = rnd(near); const lost = Math.ceil(c.food * 0.3); c.food -= lost; G.fac.kikimora.met = true; return say("kikimora", `Хи-хи! Это я в ${c.name} по ночам шастала: квашню опрокинула, крынки побила. Пропало ${lost} хлеба. Поставишь угощение — может, и уймусь.`, [{ label: "Поставить блюдечко (−5 хлеба)", act: "rel", k: "kikimora", d: 30, food: 5, city: c.id }, { label: "Махнуть рукой", act: "ok" }]); } }
  if (!G.fac.leshiy.absent && G.fac.leshiy.rel < 25 && Math.random() < 0.18) { G.fac.leshiy.met = true; for (const u of G.units) if ([FOREST, PINE].includes(G.t[idx(u.x, u.y)])) { u.mv = 0; u.path = []; } const c = rnd(G.cities); c.food = Math.max(0, c.food - 6); return say("leshiy", `Ну что, рубщик, нравится в моём лесу плутать? Отряды твои в чаще кругами ходят, а в ${c.name} я скотину в бурелом увёл. Задобри — отпущу.`, [{ label: "Оставить подношение (−20 монет)", act: "rel", k: "leshiy", d: 30, money: 20 }, { label: "Перетерпим", act: "ok" }]); }
  if (!G.fac.leshiy.absent && G.fac.leshiy.rel >= 80 && Math.random() < 0.1) { const c = rnd(G.cities); c.food += 10; c.wood += 10; return say("leshiy", `Уважил ты мой лес, купец. Вот тебе подарок: в ${c.name} лоси сами к околице вышли, а бурелом я тебе на дрова сложил. +10 хлеба и +10 дерева.`); }
  if (!G.fac.vodyanoy.absent && G.fac.vodyanoy.rel < 25 && si === 0 && Math.random() < 0.3) { const rc = G.cities.filter(hasRiverNear); if (rc.length) { const c = rnd(rc); c.food = Math.max(0, c.food - 12); c.order -= 8; G.fac.vodyanoy.met = true; return say("vodyanoy", `Буль! Не уважил старика — получай половодье. ${c.name} затопило, погреба размыло: пропало 12 хлеба.`, [{ label: "Задобрить (−25 монет)", act: "rel", k: "vodyanoy", d: 30, money: 25 }, { label: "Отстроимся", act: "ok" }]); } }
  if (Math.random() > 0.42) return;
  // людские дела
  const pool = ["fire", "refugees", "dyak", "grabov", "kuzma", "wedding"];
  if (si === 1 || si === 2) pool.push("drought");
  if (si === 2) pool.push("fair", "fair");
  if (si === 3) pool.push("wolves", "cold");
  if (G.turn > 6) pool.push("plague");
  if (G.tax === 2) pool.push("riot", "riot");
  if (G.cities.some(c => c.order >= 75)) pool.push("domovoy");
  if (!G.flags.pyramid && G.turn > 10) pool.push("pyramid");
  const k = rnd(pool), c = any;
  if (k === "fire") say("narod", `Беда в ${c.name}: ночью полыхнуло, сгорело пять дворов. Погорельцы просят леса на новые избы.`, [{ label: "Дать 15 дерева", act: "fire_help", city: c.id }, { label: "Пусть сами", act: "fire_no", city: c.id }]);
  else if (k === "refugees") say("narod", `К воротам ${c.name} пришли беглые крестьяне из-за реки: «Примите, люди добрые, отработаем». Прокормить их — 10 хлеба.`, [{ label: "Принять (+1 житель)", act: "refugees", city: c.id }, { label: "Отказать", act: "ok" }]);
  else if (k === "dyak") say("dyak", rnd(["Государев сбор, купец: 30 монет в казну. А можно и полюбовно — 15 мне в руку, и я про сбор забуду.", "Без справки о том, что у тебя есть справка, торговать нельзя. Сбор — 30 монет. Или 15 лично мне, и справка не понадобится."]), [{ label: "Заплатить сбор (30)", act: "dyak_pay" }, { label: "Сунуть в руку (15)", act: "dyak_bribe" }, { label: "Отказать", act: "dyak_no" }]);
  else if (k === "grabov") say("grabov", `Продай мне хлебушка из ${c.name}, купец: 20 мешков за 35 монет. Мне на перепродажу, а тебе — живые деньги.`, [{ label: "Продать 20 хлеба", act: "grabov_sell", city: c.id }, { label: "Не продам", act: "ok" }]);
  else if (k === "pyramid") { G.flags.pyramid = 1; say("grabov", "Вкладывай в «Долевые грамоты ГРАБОВЪ и К°»! Сегодня отдаёшь 50, через полгода получаешь 150. Ты не простак, ты — пайщик!", [{ label: "Вложить 50", act: "pyramid" }, { label: "Знаю я ваши пирамиды", act: "pyr_no" }]); }
  else if (k === "kuzma") { const bc = G.cities.find(x => x.build && x.build.left > 1); if (bc) say("kuzma", `Здорово, хозяин! Артель у нас крепкая. В ${bc.name} стройку закончим на месяц раньше — за 15 монет.`, [{ label: "По рукам (15)", act: "kuzma", city: bc.id }, { label: "Сами управимся", act: "ok" }]); }
  else if (k === "wedding") { c.order = Math.min(100, c.order + 6); say("narod", `В ${c.name} сыграли сразу три свадьбы! Гуляли всем городом. +6 к довольству.`); }
  else if (k === "drought") { const loss = Math.ceil(c.food * (c.b.ambar ? 0.2 : 0.45)); c.food -= loss; say("narod", `Засуха над ${c.name}: хлеба повыгорели, пропало ${loss} хлеба${c.b.ambar ? " (амбар спас часть)" : ""}.`, [{ label: "Купить хлеб у Грабова (−30 монет, +15)", act: "buy_bread", city: c.id }, { label: "Затянуть пояса", act: "belt", city: c.id }]); }
  else if (k === "fair") say("narod", `В ${c.name} собирается осенняя ярмарка! Поставь угощение — съедутся купцы со всего края.`, [{ label: "Устроить (−10 хлеба, +35 монет)", act: "fair", city: c.id }, { label: "Не до гуляний", act: "ok" }]);
  else if (k === "wolves") { c.food = Math.max(0, c.food - 6); say("narod", `Зима лютая, волки подошли к ${c.name}, задрали скотину: −6 хлеба. Мужики просят ружей и собак.`, [{ label: "Устроить облаву (−15 монет, +5 довольства)", act: "wolves", city: c.id }, { label: "Ничего", act: "ok" }]); }
  else if (k === "cold") { say("foma", `Барин, морозы трескучие. Смотри, чтобы в ${c.name} хватало дров: зимой каждый двор жжёт по полену в месяц, а без дров люди злятся.`); }
  else if (k === "plague") { if (c.b.banya || G.flags.potion) say("narod", `В соседних деревнях мор, но ${c.name} беда обошла: ${c.b.banya ? "баня да чистота спасли" : "зелье Бабы-Яги помогло"}.`); else { if (c.pop > 1) c.pop--; c.order -= 10; say("narod", `Мор пришёл в ${c.name}: один двор вымер, народ в страхе. Баня бы спасла.`); } }
  else if (k === "riot") say("narod", `${c.name} гудит: «Обложили, мочи нет!» Народ собрался у приказной избы. Как при Соляном бунте 1648-го — того и гляди лавки громить начнут.`, [{ label: "Снизить подать", act: "tax_down" }, { label: "Раздать хлеб (−15)", act: "belt_give", city: c.id }, { label: "Стоять на своём", act: "riot_no", city: c.id }]);
  else if (k === "domovoy") { const dc = G.cities.filter(x => x.order >= 75); const d = rnd(dc); d.food += 6; say("narod", `В ${d.name} довольный народ — и домовые довольны: по ночам кто-то и сено перебрал, и хлеб в квашне поднял. +6 хлеба.`); }
}
function runChoice(ch) {
  const C = ch.city ? G.cities.find(c => c.id === ch.city) : null;
  switch (ch.act) {
    case "rel": {
      if (ch.money && G.money < ch.money) { toast("Не хватает денег"); break; }
      if (ch.food && C && C.food < ch.food) { toast("Не хватает хлеба"); break; }
      if (ch.money) G.money -= ch.money; if (ch.food && C) C.food -= ch.food;
      relChange(ch.k, ch.d);
      if (ch.curse) { const u = G.units.find(x => x.id === ch.curse); if (u) { u.mv = 0; u.path = []; } toast("Леший завёл отряд кругами — до конца месяца ни шагу"); }
      if (ch.k === "gorynych" && ch.d < 0) G.flags.gorAngry = 1;
      break;
    }
    case "promise": relChange("leshiy", 12); G.flags.leshiyPromise = 1; toast("Леший поверил на слово. Не строй лесопилку!"); break;
    case "yaga_ball": if (G.money >= 30) { G.money -= 30; relChange("yaga", 8); const u = G.units.find(x => x.id === ch.u) || G.units[0]; if (u) reveal(u.x, u.y, 7); toast("Клубок покатился — край открылся"); } else toast("Не хватает денег"); break;
    case "yaga_potion": if (G.money >= 40) { G.money -= 40; G.flags.potion = 1; relChange("yaga", 10); toast("Зелье от мора у тебя"); } else toast("Не хватает денег"); break;
    case "yaga_tell": if (G.money >= 20) { G.money -= 20; relChange("yaga", 6); for (const s of G.sites) if (s.alive && s.kind !== "ruin") reveal(s.x, s.y, 1); toast("Яга нашептала, где кто живёт"); } else toast("Не хватает денег"); break;
    case "kiki_out": { const ok = C && C.b.church; if (ok) { const s = G.sites.find(x => x.kind === "kikimora"); if (s) s.alive = 0; G.fac.kikimora.absent = true; say("narod", "Батюшка из церкви окропил болото святой водой — кикимора с визгом убралась в дальние топи."); } else { relChange("kikimora", -30); say("kikimora", "Прогнать меня? Без попа да без церкви? Хи-хи-хи! Ну, жди теперь гостей по ночам…"); } break; }
    case "gor_pay": if (G.money >= 60) { G.money -= 60; relChange("gorynych", 15); toast("Змей забрал дань и улетел"); } else { toast("Денег не хватило — Змей зол"); burnCity(rnd(G.cities)); } break;
    case "gor_no": burnCity(C || rnd(G.cities)); relChange("gorynych", -10); break;
    case "gor_fight": { const u = G.units.find(x => x.kind === "druzhina"), s = G.sites.find(x => x.kind === "gorynych" && x.alive); if (u && s) battle(u, s); break; }
    case "liho_pay": if (G.money >= 30) G.money -= 30; else { C.food = Math.floor(C.food * 0.6); toast("Денег не хватило — разбойники пограбили амбары"); } break;
    case "liho_no": { const u = G.units.find(x => x.kind === "druzhina" && cheb(x, C) <= 3); if (u) { say("narod", `Дружина встретила ватагу у ворот ${C.name} и прогнала прочь!`); C.order = Math.min(100, C.order + 5); } else { C.food = Math.floor(C.food * 0.6); C.wood = Math.floor(C.wood * 0.6); C.order -= 10; say("liho", `Сам напросился, купец. Пограбили мы ${C.name}: хлеба и дерева там теперь поменьше. Частокол-то где?`); } break; }
    case "fire_help": if (C.wood >= 15) { C.wood -= 15; C.order = Math.min(100, C.order + 10); } else { C.order -= 10; toast("Дерева не хватило"); } break;
    case "fire_no": C.order -= 10; break;
    case "refugees": C.food -= 10; C.pop++; if (C.food < 0) C.food = 0; break;
    case "dyak_pay": if (G.money >= 30) G.money -= 30; else { G.money = 0; for (const c of G.cities) c.order -= 5; } break;
    case "dyak_bribe": if (G.money >= 15) { G.money -= 15; if (Math.random() < 0.3) { for (const c of G.cities) c.order -= 8; say("voevoda", "Мне донесли, что ты дьяку взятки суёшь. Срамота! Народ об этом судачит."); } } break;
    case "dyak_no": for (const c of G.cities) c.order -= 6; toast("Дьяк обиделся и пустил худую молву"); break;
    case "grabov_sell": if (C.food >= 20) { C.food -= 20; G.money += 35; } else toast("Столько хлеба нет"); break;
    case "pyramid": if (G.money >= 50) { G.money -= 50; G.flags.pyrAt = G.turn + 6; } break;
    case "pyr_no": for (const c of G.cities) c.order = Math.min(100, c.order + 3); break;
    case "kuzma": if (G.money >= 15 && C.build) { G.money -= 15; C.build.left = Math.max(1, C.build.left - 1); } break;
    case "buy_bread": if (G.money >= 30) { G.money -= 30; C.food += 15; } break;
    case "belt": C.order -= 6; break;
    case "belt_give": C.food = Math.max(0, C.food - 15); C.order = Math.min(100, C.order + 12); break;
    case "fair": if (C.food >= 10) { C.food -= 10; G.money += 35; C.order = Math.min(100, C.order + 4); } else toast("Хлеба мало для ярмарки"); break;
    case "wolves": if (G.money >= 15) { G.money -= 15; C.order = Math.min(100, C.order + 5); } break;
    case "tax_down": G.tax = Math.max(0, G.tax - 1); for (const c of G.cities) c.order = Math.min(100, c.order + 5); break;
    case "riot_no": C.order -= 15; if (C.build) C.build.left += 1; break;
  }
  for (const c of G.cities) calcCity(c);
  dirty = true;
}
function burnCity(c) {
  if (!c) return;
  const built = Object.keys(c.b); let what = "";
  if (built.length) { const k = rnd(built); delete c.b[k]; what = `сгорела ${BUILD[k].name.toLowerCase()}`; } else { c.wood = 0; what = "сгорели все дрова"; }
  if (c.pop > 1) c.pop--; c.order -= 20;
  say("gorynych", `Ха-ха-ха! Три головы — три огня! В ${c.name} ${what}, один двор в пепле. В другой раз будешь сговорчивее.`);
}
// ---------------------------------------------------------------- ход
function endTurn() {
  if (busy || G.dialogs.length || G.won || G.lost) return;
  busy = true;
  // отряды: новые силы и путь дальше
  for (const u of [...G.units]) {
    u.mv = UNITS[u.kind].mv;
    if (u.kind === "settlers") { u.food--; if (u.food <= 0) { G.units.splice(G.units.indexOf(u), 1); say("narod", "У переселенцев кончился хлеб. Обоз рассеялся по чужим деревням — людей уже не собрать."); logMsg("Обоз переселенцев распался от голода.", false); } }
  }
  for (const c of G.cities) cityTurn(c);
  convoysTurn();
  if (G.flags.pyrAt && G.turn + 1 >= G.flags.pyrAt) { G.flags.pyrAt = 0; if (Math.random() < 0.3) { G.money += 150; say("grabov", "Держи 150, пайщик! Видишь, всё честно. Рассказывай соседям!"); } else say("narod", "Контора «ГРАБОВЪ и К°» закрыта, на двери замок. Грабов сказал, что пайщики сами виноваты. Твои 50 монет пропали, как и у тысяч других простаков."); }
  G.turn++;
  if (month() % 3 === 0) logMsg(["Пришла весна: снег сошёл, пора пахать.", "Наступило лето: колосятся хлеба.", "Пришла осень: время собирать урожай.", "Пришла зима: поля под снегом, топите печи."][seasonOf()], true);
  monthEvents();
  checkChapter();
  if (!G.cities.length && !G.units.some(u => u.kind === "settlers")) { G.lost = true; say("voevoda", "Не осталось у тебя ни города, ни переселенцев. Край так и остался диким… Начни сначала — и в этот раз выбирай место быстрее."); }
  busy = false;
  // дальше по проложенным путям
  (async () => { for (const u of G.units) if (u.path.length) await walk(u); autoSelect(); saveGame(); dirty = true; })();
  sfx(month() % 3 === 0 ? FX.season : FX.turn); dirty = true;
}
function checkChapter() {
  const ch = CHAPTERS[G.chapter];
  if (ch && !G.won && ch.done()) {
    say(...ch.outro); G.chapter++;
    if (G.chapter >= CHAPTERS.length) { G.won = true; const best = load("best", 0); if (!best || G.turn < best) save("best", G.turn); SND.win(); }
    else logMsg(`Глава ${G.chapter + 1}: «${CHAPTERS[G.chapter].title}».`, true);
  }
}
function autoSelect() {
  const u = G.units.find(x => x.mv > 0 && !x.path.length);
  if (u && !G.dialogs.length) { sel = { unit: u.id }; }
}
function logMsg(text, good) { G.log.unshift({ text, good, t: G.turn }); if (G.log.length > 40) G.log.pop(); }
function say(who, text, choices, extra) { G.dialogs.push({ who, text, choices: choices || [{ label: "Понятно", act: "ok" }], ...(extra || {}) }); dirty = true; }
function saveGame() { if (G) save("game", G); }
let toastT = 0;
function toast(t) { const el = $("toast"); el.textContent = t; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 2200); }
