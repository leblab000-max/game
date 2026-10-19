// =====================================================================
//  Данные: стихии, слияния, амулеты, враги, волны, прокачка
// =====================================================================
const RUN_TIME = 600;          // 10 минут — и ты победил
const MAX_ELEM = 3, MAX_PASS = 4;

// Стихии. Значения по уровням 1..5
const ELEM = {
  fire: { name: "Огонь", icon: "🔥", col: 0xff7a2e, css: "#ff7a2e",
    cd: [1.15, 1.0, 0.95, 0.85, 0.7], dmg: [14, 18, 20, 26, 32], n: [1, 1, 2, 2, 3], boom: [38, 44, 50, 58, 68],
    lvl: ["Огненный шар летит в ближайшего врага и взрывается", "Урон больше", "+1 шар", "Взрыв шире, урон больше", "+1 шар, быстрее"] },
  ice: { name: "Лёд", icon: "❄️", col: 0x7fdcff, css: "#7fdcff",
    cd: [1.2, 1.1, 1.0, 0.9, 0.8], dmg: [10, 12, 14, 17, 20], n: [3, 4, 5, 6, 8], pierce: [1, 2, 2, 3, 4],
    lvl: ["Осколки летят во все стороны и замедляют врагов", "+1 осколок, урон больше", "+1 осколок, пробивают двоих", "+1 осколок", "+2 осколка, пробивают четверых"] },
  wind: { name: "Ветер", icon: "🌀", col: 0x9dffc0, css: "#9dffc0",
    n: [2, 2, 3, 3, 4], dmg: [10, 12, 14, 17, 20], rad: [62, 66, 72, 78, 86], spin: [3, 3.3, 3.7, 4.1, 4.6],
    lvl: ["Лезвия ветра кружат вокруг и отбрасывают врагов", "Урон больше", "+1 лезвие, круг шире", "Урон больше, быстрее", "+1 лезвие"] },
  bolt: { name: "Молния", icon: "⚡", col: 0xffe45c, css: "#ffe45c",
    cd: [1.6, 1.4, 1.25, 1.1, 0.9], dmg: [16, 20, 25, 30, 36], n: [1, 2, 3, 4, 6],
    lvl: ["Молния бьёт врага и перескакивает на соседа", "+1 прыжок", "+1 прыжок, урон больше", "+1 прыжок, чаще", "+2 прыжка, урон больше"] },
};
const ELEM_IDS = Object.keys(ELEM);

// Слияния: две стихии 3-го уровня и выше дают новое заклинание
const FUSE = {
  fireWind: { a: "fire", b: "wind", name: "Огненный смерч", icon: "🔥🌀", col: 0xff9a3a, desc: "Смерчи бродят по полю, затягивают и жгут врагов" },
  fireIce: { a: "fire", b: "ice", name: "Паровой взрыв", icon: "🔥❄️", col: 0xf0f6ff, desc: "Волна пара раз в пару секунд разносит всех вокруг" },
  fireBolt: { a: "fire", b: "bolt", name: "Метеоры", icon: "🔥⚡", col: 0xff5a2a, desc: "С неба падают метеоры прямо в толпу врагов" },
  iceWind: { a: "ice", b: "wind", name: "Вьюга", icon: "❄️🌀", col: 0xc8f0ff, desc: "Метель вокруг мага: враги вязнут и мёрзнут" },
  iceBolt: { a: "ice", b: "bolt", name: "Хрустальная цепь", icon: "❄️⚡", col: 0xa8f4ff, desc: "Длинная цепь молний замораживает врагов на месте" },
  windBolt: { a: "wind", b: "bolt", name: "Гроза", icon: "🌀⚡", col: 0xd8e0ff, desc: "Две тучи кружат вокруг и бьют молниями всех снизу" },
};

// Амулеты (пассивные улучшения)
const PASS = {
  might: { name: "Кристалл силы", icon: "💎", desc: "Урон +12%" },
  haste: { name: "Песочные часы", icon: "⏳", desc: "Заклинания на 8% чаще" },
  area: { name: "Линза", icon: "🔮", desc: "Размер заклинаний +12%" },
  boots: { name: "Сапоги-скороходы", icon: "👢", desc: "Скорость +10%" },
  heart: { name: "Сердце дракона", icon: "❤️", desc: "Здоровье +25 и лечение" },
  magnet: { name: "Магнит", icon: "🧲", desc: "Опыт собирается издалека" },
};

// Враги
const FOES = {
  slime: { name: "Слизень", hp: 12, sp: 44, dmg: 8, r: 13, xp: 1, col: 0x7ad65a },
  bat: { name: "Летучая мышь", hp: 7, sp: 92, dmg: 5, r: 10, xp: 1, col: 0xa877e8 },
  imp: { name: "Бесёнок", hp: 16, sp: 46, dmg: 6, r: 12, xp: 2, col: 0xf05a5a, ranged: true },
  boar: { name: "Кабан", hp: 34, sp: 48, dmg: 14, r: 15, xp: 3, col: 0x9a6a44, charger: true, heavy: 0.6 },
  ghost: { name: "Призрак", hp: 26, sp: 62, dmg: 10, r: 14, xp: 3, col: 0xcfe6ff },
  brute: { name: "Голем", hp: 60, sp: 30, dmg: 15, r: 21, xp: 5, col: 0xb98048, heavy: 0.35 },
  boss1: { name: "Каменный великан", hp: 1400, sp: 40, dmg: 25, r: 46, xp: 60, col: 0x9a7650, boss: true, heavy: 0.05 },
  boss2: { name: "Владыка Тьмы", hp: 4200, sp: 46, dmg: 35, r: 58, xp: 150, col: 0x7a48c8, boss: true, heavy: 0.03 },
};
// Кого и сколько присылать по минутам
const WAVES = [
  { slime: 1 },
  { slime: 3, bat: 2, boar: 0.6, imp: 0.5 },
  { slime: 2, bat: 2, imp: 1, boar: 1 },
  { slime: 2, bat: 2, imp: 1, brute: 0.5 },
  { slime: 1, bat: 2, imp: 1, ghost: 1, brute: 0.6 },
  { bat: 2, imp: 1, ghost: 2, brute: 1, boar: 1 },
  { slime: 2, bat: 2, ghost: 2, brute: 1, imp: 1 },
  { bat: 3, ghost: 2, brute: 1.5, imp: 1, boar: 1.5 },
  { slime: 2, bat: 2, ghost: 2, brute: 2, imp: 1.5 },
  { bat: 2, ghost: 3, brute: 2, imp: 2 },
];
// Особые события по времени (секунды)
const EVENTS = [
  { t: 75, kind: "ring", foe: "bat", n: 36, say: "Стая летучих мышей!" },
  { t: 150, kind: "elite", foe: "brute", say: "Идёт элитный голем" },
  { t: 210, kind: "ring", foe: "slime", n: 48, say: "Слизни окружают!" },
  { t: 270, kind: "boss", foe: "boss1", say: "Каменный великан проснулся!" },
  { t: 360, kind: "ring", foe: "ghost", n: 40, say: "Призраки повсюду!" },
  { t: 420, kind: "elite", foe: "ghost", say: "Элитный призрак" },
  { t: 480, kind: "ring", foe: "bat", n: 70, say: "Тьма летучих мышей!" },
  { t: 540, kind: "boss", foe: "boss2", say: "Владыка Тьмы пришёл за тобой!" },
];
const targetCount = t => Math.min(300, 20 + t * 0.45);
const hpMul = t => 1 + t / 60 * 0.22 + (t / 60) ** 2 * 0.035;
const xpNeed = L => 3 + L * 2 + Math.floor(L * L * 0.45);

// Прокачка между забегами
const META = {
  might: { name: "Сила", icon: "💪", max: 5, cost: 60, desc: "+6% урона" },
  hp: { name: "Здоровье", icon: "❤️", max: 5, cost: 50, desc: "+12 здоровья" },
  speed: { name: "Ловкость", icon: "👟", max: 5, cost: 50, desc: "+5% скорости" },
  magnet: { name: "Притяжение", icon: "🧲", max: 5, cost: 40, desc: "+15% радиус сбора" },
  xp: { name: "Мудрость", icon: "📘", max: 5, cost: 70, desc: "+6% опыта" },
  reroll: { name: "Перебросы", icon: "🎲", max: 3, cost: 120, desc: "+1 переброс карт за забег" },
};
const newProfile = () => ({ coins: 0, meta: {}, start: "fire", best: { t: 0, kills: 0 }, runs: 0, wins: 0, fusions: {}, t: 0 });
