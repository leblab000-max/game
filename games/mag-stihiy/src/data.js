// =====================================================================
//  Данные: оружие, рецепты котла, амулеты, враги, волны, прокачка
// =====================================================================
const WAVES_TOTAL = 20, ARENA = 620;                  // арена: квадрат ±620
const waveTime = w => Math.min(60, 20 + (w - 1) * 5);
const MAX_WEAP = 6;
const TIERS = ["I", "II", "III", "IV"], TCOL = ["#cfd3e6", "#5ab8ff", "#c46aff", "#ffcf3a"];

// Стихии — для цвета, значков и эффектов при попадании
const ELEM = {
  fire: { name: "Огонь", icon: "🔥", col: 0xff7a2e, css: "#ff7a2e", hit: "поджигает" },
  ice: { name: "Лёд", icon: "❄️", col: 0x7fdcff, css: "#7fdcff", hit: "замедляет и морозит" },
  wind: { name: "Ветер", icon: "🌀", col: 0x9dffc0, css: "#9dffc0", hit: "отбрасывает" },
  bolt: { name: "Молния", icon: "⚡", col: 0xffe45c, css: "#ffe45c", hit: "бьёт током соседей" },
};
const ELEM_IDS = Object.keys(ELEM);

// Оружие. Значения по рангам I..IV
const WEAP = {
  fire: { name: "Огненный шар", icon: "🔥", elem: "fire", kind: "fireball", price: 28,
    cd: [1.2, 1.05, 0.9, 0.75], dmg: [14, 22, 34, 52], n: [1, 1, 2, 3], boom: [38, 46, 56, 68], desc: "Шар летит в ближайшего врага и взрывается" },
  ice: { name: "Ледяные осколки", icon: "❄️", elem: "ice", kind: "shard", price: 26,
    cd: [1.1, 1.0, 0.9, 0.8], dmg: [9, 14, 21, 32], n: [3, 4, 5, 7], pierce: [1, 2, 2, 3], desc: "Веер осколков: пробивают и замедляют" },
  wind: { name: "Лезвия ветра", icon: "🌀", elem: "wind", kind: "blade", price: 30,
    dmg: [10, 16, 24, 36], n: [2, 2, 3, 4], rad: [60, 66, 72, 80], spin: [3.2, 3.5, 3.9, 4.4], desc: "Кружат вокруг мага и отбрасывают" },
  bolt: { name: "Молния", icon: "⚡", elem: "bolt", kind: "chain", price: 30,
    cd: [1.5, 1.35, 1.2, 1.0], dmg: [16, 25, 38, 56], n: [2, 3, 4, 6], desc: "Бьёт врага и перескакивает дальше" },
  dagger: { name: "Кинжалы", icon: "🗡️", kind: "dagger", price: 18, pl: true,
    cd: [0.6, 0.52, 0.45, 0.38], dmg: [8, 12, 18, 27], n: [1, 1, 2, 2], desc: "Быстрые броски в ближайшего врага" },
  hammer: { name: "Молот", icon: "🔨", kind: "melee", price: 22,
    cd: [1.0, 0.9, 0.8, 0.7], dmg: [18, 28, 42, 64], rad: [72, 80, 88, 98], desc: "Мощный удар по дуге перед магом" },
  wand: { name: "Жезл", icon: "🪄", kind: "missile", price: 24,
    cd: [1.3, 1.15, 1.0, 0.85], dmg: [20, 30, 46, 70], n: [1, 1, 2, 2], desc: "Самонаводящийся сгусток магии" },
};
const BASIC = Object.keys(WEAP), NEUTRAL = BASIC.filter(id => !WEAP[id].elem);

// Слияния двух стихий
const FUSE = {
  fireWind: { a: "fire", b: "wind", name: "Огненный смерч", icon: "🔥🌀", col: 0xff9a3a, desc: "Смерчи бродят по арене, затягивают и жгут врагов" },
  fireIce: { a: "fire", b: "ice", name: "Паровой взрыв", icon: "🔥❄️", col: 0xf0f6ff, desc: "Волна пара разносит всех вокруг" },
  fireBolt: { a: "fire", b: "bolt", name: "Метеоры", icon: "🔥⚡", col: 0xff5a2a, desc: "С неба падают метеоры прямо в толпу" },
  iceWind: { a: "ice", b: "wind", name: "Вьюга", icon: "❄️🌀", col: 0xc8f0ff, desc: "Метель вокруг мага: враги вязнут и мёрзнут" },
  iceBolt: { a: "ice", b: "bolt", name: "Хрустальная цепь", icon: "❄️⚡", col: 0xa8f4ff, desc: "Длинная цепь молний замораживает врагов" },
  windBolt: { a: "wind", b: "bolt", name: "Гроза", icon: "🌀⚡", col: 0xd8e0ff, desc: "Тучи кружат вокруг и бьют молниями" },
};
const FUSE_MUL = [1, 1.6, 2.4, 3.5];
// Заряженное оружие: обычное + стихия
const ADJ = { fire: ["Огненный", "Огненные"], ice: ["Ледяной", "Ледяные"], wind: ["Вихревой", "Вихревые"], bolt: ["Грозовой", "Грозовые"] };
function wdef(id) {
  if (WEAP[id]) return Object.assign({ id }, WEAP[id]);
  if (FUSE[id]) { const f = FUSE[id]; return { id, name: f.name, icon: f.icon, kind: "fusion", price: 70, desc: f.desc, fuse: true }; }
  const [n, e] = id.split("_"), b = WEAP[n];
  return Object.assign({}, b, { id, base: n, elem: e, infused: true, name: ADJ[e][b.pl ? 1 : 0] + " " + b.name.toLowerCase(), icon: b.icon + ELEM[e].icon, price: b.price + 16, desc: b.desc + ", " + ELEM[e].hit });
}
// Котёл: что получится из двух предметов
function brew(a, b) {
  if (a.id === b.id) return a.tier < 3 && a.tier === b.tier ? { id: a.id, tier: a.tier + 1, kind: "up" } : null;
  const ea = WEAP[a.id] && WEAP[a.id].elem, eb = WEAP[b.id] && WEAP[b.id].elem, t = Math.max(a.tier, b.tier);
  if (ea && eb) { const f = Object.keys(FUSE).find(k => (FUSE[k].a === ea && FUSE[k].b === eb) || (FUSE[k].a === eb && FUSE[k].b === ea)); return f ? { id: f, tier: t, kind: "fuse" } : null; }
  if (ea && NEUTRAL.includes(b.id)) return { id: b.id + "_" + ea, tier: t, kind: "inf" };
  if (eb && NEUTRAL.includes(a.id)) return { id: a.id + "_" + eb, tier: t, kind: "inf" };
  return null;
}
const RECIPES = [...Object.keys(FUSE), ...NEUTRAL.flatMap(n => ELEM_IDS.map(e => n + "_" + e))];

// Амулеты из лавки (копятся без предела, цена растёт)
const ITEMS = {
  might: { name: "Кристалл силы", icon: "💎", price: 25, desc: "Урон +8%", st: { dmg: 0.08 } },
  haste: { name: "Песочные часы", icon: "⏳", price: 25, desc: "Скорость атак +7%", st: { atk: 0.07 } },
  lens: { name: "Линза", icon: "🔮", price: 22, desc: "Размер заклинаний +10%", st: { area: 0.1 } },
  boots: { name: "Сапоги-скороходы", icon: "👢", price: 20, desc: "Скорость бега +6%", st: { speed: 0.06 } },
  heart: { name: "Сердце дракона", icon: "❤️", price: 25, desc: "Здоровье +15", st: { maxhp: 15 } },
  fang: { name: "Волчий клык", icon: "🦷", price: 24, desc: "Шанс крита +4%", st: { crit: 0.04 } },
  root: { name: "Корень жизни", icon: "🌿", price: 28, desc: "Лечение +1.2 в секунду", st: { regen: 1.2 } },
  magnet: { name: "Магнит", icon: "🧲", price: 15, desc: "Радиус сбора +35%", st: { magnet: 0.35 } },
  bag: { name: "Мешок алхимика", icon: "💰", price: 30, desc: "Кристаллов +10%", st: { gain: 0.1 } },
};
// Улучшения за уровень (выбор после волны)
const LVUP = [
  { name: "Крепость", icon: "❤️", desc: "Здоровье +8", st: { maxhp: 8 } },
  { name: "Мощь", icon: "💪", desc: "Урон +5%", st: { dmg: 0.05 } },
  { name: "Ловкость рук", icon: "✋", desc: "Скорость атак +5%", st: { atk: 0.05 } },
  { name: "Быстрые ноги", icon: "👟", desc: "Скорость бега +4%", st: { speed: 0.04 } },
  { name: "Размах", icon: "🔮", desc: "Размер заклинаний +6%", st: { area: 0.06 } },
  { name: "Меткость", icon: "🎯", desc: "Шанс крита +3%", st: { crit: 0.03 } },
  { name: "Живучесть", icon: "🌿", desc: "Лечение +0.8 в секунду", st: { regen: 0.8 } },
  { name: "Жадность", icon: "💰", desc: "Кристаллов +6%", st: { gain: 0.06 } },
];

// Враги
const FOES = {
  slime: { name: "Слизень", hp: 12, sp: 44, dmg: 7, r: 13, cr: 1, col: 0x7ad65a },
  bat: { name: "Летучая мышь", hp: 7, sp: 92, dmg: 5, r: 10, cr: 1, col: 0xa877e8 },
  imp: { name: "Бесёнок", hp: 16, sp: 46, dmg: 6, r: 12, cr: 2, col: 0xf05a5a, ranged: true },
  boar: { name: "Кабан", hp: 32, sp: 48, dmg: 12, r: 15, cr: 2, col: 0x9a6a44, charger: true, heavy: 0.6 },
  ghost: { name: "Призрак", hp: 24, sp: 64, dmg: 9, r: 14, cr: 2, col: 0xcfe6ff },
  brute: { name: "Голем", hp: 60, sp: 30, dmg: 14, r: 21, cr: 4, col: 0xb98048, heavy: 0.35 },
  boss1: { name: "Каменный великан", hp: 2600, sp: 40, dmg: 22, r: 46, cr: 60, col: 0x9a7650, boss: true, heavy: 0.05 },
  boss2: { name: "Владыка Тьмы", hp: 9000, sp: 46, dmg: 30, r: 58, cr: 150, col: 0x7a48c8, boss: true, heavy: 0.03 },
};
// Кто приходит на волне
function waveMix(w) {
  const m = { slime: 3 };
  if (w >= 2) m.bat = 2; if (w >= 3) m.boar = 0.6 + w * 0.05; if (w >= 4) m.imp = 0.8;
  if (w >= 6) m.ghost = 1 + w * 0.05; if (w >= 7) m.brute = 0.5 + w * 0.06; if (w >= 12) m.slime = 1;
  return m;
}
const WAVE_EVENTS = {
  3: [{ at: 10, kind: "ring", foe: "slime", n: 18, say: "Слизни окружают!" }],
  5: [{ at: 8, kind: "elite", foe: "brute", say: "Элитный голем!" }],
  8: [{ at: 12, kind: "ring", foe: "bat", n: 30, say: "Стая летучих мышей!" }],
  10: [{ at: 4, kind: "boss", foe: "boss1", say: "Каменный великан проснулся!" }],
  13: [{ at: 15, kind: "elite", foe: "boar", say: "Элитный кабан!" }, { at: 30, kind: "ring", foe: "ghost", n: 30, say: "Призраки!" }],
  16: [{ at: 10, kind: "elite", foe: "ghost", say: "Элитный призрак!" }, { at: 35, kind: "elite", foe: "brute", say: "Ещё один!" }],
  18: [{ at: 20, kind: "ring", foe: "bat", n: 50, say: "Тьма летучих мышей!" }],
  20: [{ at: 4, kind: "boss", foe: "boss2", say: "Владыка Тьмы пришёл за тобой!" }],
};
const hpMul = w => 1 + (w - 1) * 0.25 + (w - 1) ** 2 * 0.018;
const waveCap = w => Math.min(230, 12 + w * 10);
const spawnRate = w => 1.6 + w * 0.7;                       // врагов в секунду
const xpNeed = L => 6 + L * 4 + Math.floor(L * L * 0.6);

// Прокачка между забегами
const META = {
  might: { name: "Сила", icon: "💪", max: 5, cost: 60, desc: "+5% урона" },
  hp: { name: "Здоровье", icon: "❤️", max: 5, cost: 50, desc: "+10 здоровья" },
  speed: { name: "Ловкость", icon: "👟", max: 5, cost: 50, desc: "+4% скорости" },
  start: { name: "Запас", icon: "💰", max: 5, cost: 40, desc: "+10 кристаллов на старте" },
  gain: { name: "Жадность", icon: "🪙", max: 5, cost: 70, desc: "+5% кристаллов" },
  reroll: { name: "Удача", icon: "🎲", max: 3, cost: 120, desc: "Бесплатный переброс в лавке" },
};
const newProfile = () => ({ coins: 0, meta: {}, start: "fire", best: { wave: 0, kills: 0 }, runs: 0, wins: 0, book: {}, t: 0 });
