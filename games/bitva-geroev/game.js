// =====================================================================
//  БИТВА ГЕРОЕВ — данные, сохранение, прокачка, сундуки, бой
// =====================================================================
let soundOn = true, musicOn = true, G = null, dirty = true;
const $ = id => document.getElementById(id);
const hsh = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const rnd = (a, b) => a + Math.random() * (b - a), irnd = (a, b) => Math.floor(rnd(a, b + 1)), pick = a => a[Math.floor(Math.random() * a.length)];
function load(key, def) { try { const v = localStorage.getItem("arena_" + key); return v === null ? def : JSON.parse(v); } catch (e) { return def; } }
function save(key, val) { try { localStorage.setItem("arena_" + key, JSON.stringify(val)); } catch (e) {} }
// ---------------------------------------------------------------- герои
const RAR = { common: { name: "Обычный", col: "#8ab0d0", w: 6 }, rare: { name: "Редкий", col: "#ff9a2a", w: 3 }, epic: { name: "Эпический", col: "#b05af0", w: 1 } };
const HEROES = {
  knight: { name: "Рыцарь", rar: "common", role: "Защитник", melee: true, hp: 300, atk: 16, cd: 1.1, front: 0, abil: "Стена щитов", adesc: "Щит себе на половину здоровья и щит союзникам" },
  archer: { name: "Эльфийка-лучница", rar: "common", role: "Стрелок", melee: false, hp: 150, atk: 24, cd: 1.0, front: 4, abil: "Град стрел", adesc: "Стрела в каждого врага" },
  priest: { name: "Жрица", rar: "common", role: "Лекарь", melee: false, hp: 160, atk: 15, cd: 1.2, front: 6, heal: true, abil: "Свет исцеления", adesc: "Лечит весь отряд" },
  orc: { name: "Орк-берсерк", rar: "rare", role: "Боец", melee: true, hp: 260, atk: 26, cd: 1.0, front: 1, abil: "Ярость", adesc: "Бьёт вдвое быстрее и подлечивается" },
  mage: { name: "Огненный маг", rar: "rare", role: "Маг", melee: false, hp: 140, atk: 17, cd: 1.3, front: 5, abil: "Огненный шар", adesc: "Огромный урон цели и ожог остальным" },
  dwarf: { name: "Гном-молотобоец", rar: "rare", role: "Защитник", melee: true, hp: 280, atk: 16, cd: 1.2, front: 0, abil: "Землетрясение", adesc: "Урон всем врагам, передние оглушены" },
  rogue: { name: "Ассасин", rar: "epic", role: "Убийца", melee: true, hp: 140, atk: 18, cd: 1.0, front: 3, back: true, abil: "Удар в спину", adesc: "Добивает самого слабого врага" },
  ice: { name: "Ледяная чародейка", rar: "epic", role: "Маг", melee: false, hp: 150, atk: 15, cd: 1.2, front: 5, abil: "Ледяная буря", adesc: "Урон всем и заморозка" },
};
const HERO_IDS = Object.keys(HEROES);
const MAXLVL = 11;
let ATKX = 1.35;
const NEED_CARDS = [2, 4, 10, 20, 40, 80, 150, 300, 500, 800];
const NEED_GOLD = [10, 25, 60, 120, 250, 500, 1000, 2000, 4000, 8000];
const mult = l => 1.12 ** (l - 1);
// снаряжение из мастерской: оружие +6% атаки за уровень, зелье +7% здоровья за уровень
function gearOf(id) { const g = (G.heroes[id] && G.heroes[id].gear) || {}; return { atk: (g.w || 0) * 0.06, hp: (g.p || 0) * 0.07 }; }
const heroPower = (id, l, g = { atk: 0, hp: 0 }) => { const h = HEROES[id]; return Math.round((h.hp * (1 + g.hp) / 4 + h.atk * (1 + g.atk) * 4 / h.cd) * mult(l)); };
const teamPower = team => team.reduce((a, [id, l, g]) => a + heroPower(id, l, g), 0);
const myTeam = () => G.team.map(id => [id, G.heroes[id].lvl, gearOf(id)]);
// ---------------------------------------------------------------- лиги и сундуки
const LEAGUES = [
  { name: "Деревянная лига", min: 0, col: "#b8875a" }, { name: "Бронзовая лига", min: 200, col: "#d8884a" }, { name: "Серебряная лига", min: 500, col: "#b8c4d8" },
  { name: "Золотая лига", min: 900, col: "#f2c740" }, { name: "Изумрудная лига", min: 1400, col: "#4cd88a" }, { name: "Алмазная лига", min: 2000, col: "#6ad8ff" }, { name: "Лига легенд", min: 3000, col: "#c87aff" },
];
const leagueOf = t => { let k = 0; LEAGUES.forEach((l, i) => { if (t >= l.min) k = i; }); return k; };
const CHESTS = {
  wood: { name: "Деревянный сундук", time: 3 * 60, gold: [25, 40], cards: 8, kinds: 2, epic: 0.03, col: "#c08a4a" },
  silver: { name: "Серебряный сундук", time: 15 * 60, gold: [60, 90], cards: 20, kinds: 3, epic: 0.25, col: "#c8d4e8" },
  gold: { name: "Золотой сундук", time: 60 * 60, gold: [150, 220], cards: 45, kinds: 4, epic: 1, col: "#f2c740" },
};
const GIFT_EVERY = 4 * 3600 * 1000;
// ---------------------------------------------------------------- состояние
function newGame() {
  G = { gold: 100, trophies: 0, wins: 0, losses: 0, lstreak: 0, heroes: {}, team: ["knight", "orc", "archer", "priest"], chests: [null, null, null, null], gift: Date.now() - GIFT_EVERY, name: "Герой" + irnd(100, 999), seed: irnd(1, 1e6), tut: 0, battles: 0 };
  for (const id of HERO_IDS) G.heroes[id] = { lvl: 1, cards: 0, have: ["knight", "orc", "archer", "priest"].includes(id) };
  G.chests[0] = { type: "wood", openAt: null };
  G.ws = wsNew();
  saveGame();
}
function saveGame() { G.t = Date.now(); save("game", G); if (typeof yaPush === "function") yaPush(); }
function addCards(id, n) { const h = G.heroes[id]; if (!h.have) { h.have = true; n--; } h.cards += n; }
function rollChest(type) {
  const c = CHESTS[type], gold = irnd(...c.gold), got = {};
  const pool = HERO_IDS.flatMap(id => new Array(RAR[HEROES[id].rar].w).fill(id));
  const kinds = [];
  if (Math.random() < c.epic) kinds.push(pick(HERO_IDS.filter(id => HEROES[id].rar === "epic")));
  while (kinds.length < c.kinds) { const id = pick(pool); if (!kinds.includes(id)) kinds.push(id); }
  let left = c.cards; kinds.forEach((id, i) => { const n = i === kinds.length - 1 ? left : Math.max(1, Math.round(left * rnd(0.3, 0.6) / (HEROES[id].rar === "epic" ? 3 : 1))); got[id] = n; left -= n; });
  return { gold, got };
}
function openChest(i) {
  const ch = G.chests[i]; if (!ch) return null;
  const r = rollChest(ch.type); G.chests[i] = null; G.gold += r.gold;
  const fresh = []; for (const [id, n] of Object.entries(r.got)) { if (!G.heroes[id].have) fresh.push(id); addCards(id, n); }
  saveGame(); dirty = true; return { ...r, type: ch.type, fresh };
}
const chestLeft = ch => ch && ch.openAt ? Math.max(0, ch.openAt - Date.now()) : null;
const anyUnlocking = () => G.chests.some(c => c && c.openAt && c.openAt > Date.now());
function upgrade(id) {
  const h = G.heroes[id]; if (!h.have || h.lvl >= MAXLVL) return false;
  const nc = NEED_CARDS[h.lvl - 1], ng = NEED_GOLD[h.lvl - 1];
  if (h.cards < nc || G.gold < ng) return false;
  h.cards -= nc; G.gold -= ng; h.lvl++; questAdd("upgrades"); saveGame(); dirty = true; return true;
}
const canUpgrade = id => { const h = G.heroes[id]; return h.have && h.lvl < MAXLVL && h.cards >= NEED_CARDS[h.lvl - 1] && G.gold >= NEED_GOLD[h.lvl - 1]; };
// ---------------------------------------------------------------- соперники
const NICKS = ["Лёха_Танк", "Valkyrie", "СтарыйВолк", "Nastya_Star", "Бабушка_Зина", "Призрак", "Dragonslayer", "Иван Петров", "Магистр", "ProGamer", "Котик", "Сашка", "Лучник99", "Вова Медведь", "Elena", "ХитрыйЛис", "Шаман", "Татьяна К.", "Север", "Рыжий", "Ольга_М", "Капитан", "Dark_Knight", "Серёга", "Мила", "Гроза_Орков", "Ведьмак", "Михалыч", "Lucky", "Зубастик", "Тихоня", "Барон", "Ninja_RU", "Светлана", "Вихрь", "Пельмень", "Орлан", "Ярик", "Gandalf", "Ирина В."];
function makeEnemy() {
  const lg = leagueOf(G.trophies), pool = HERO_IDS.filter(id => HEROES[id].rar !== "epic" || G.trophies >= 300 || Math.random() < 0.15);
  const ids = []; ids.push(pick(pool.filter(id => HEROES[id].melee && !HEROES[id].back)));
  while (ids.length < 4) { const id = pick(pool); if (!ids.includes(id)) ids.push(id); }
  let factor = 0.86 + Math.random() * 0.26 + Math.min(0.12, G.trophies / 6000);
  if (G.lstreak >= 2) factor -= 0.14;
  if (G.battles === 0) factor = 0.6;
  const target = teamPower(myTeam()) * factor, lv = ids.map(() => 1);
  for (let guard = 0; guard < 200 && teamPower(ids.map((id, i) => [id, lv[i]])) < target; guard++) { const k = Math.floor(Math.random() * 4); if (lv[k] < MAXLVL) lv[k]++; }
  return { name: pick(NICKS), trophies: Math.max(0, G.trophies + irnd(-40, 40)), league: lg, team: ids.map((id, i) => [id, lv[i]]) };
}
// ---------------------------------------------------------------- бой (идёт сам, в реальном времени)
const SLOT_POS = [[74, 104], [80, 136], [42, 100], [48, 132]];   // [x ног, y ног] для левой стороны
function formation(team) { return [...team].sort((a, b) => HEROES[a[0]].front - HEROES[b[0]].front); }
let B = null;
function startBattle(enemy) {
  const units = [];
  const mk = (side, team) => formation(team).forEach(([id, lvl, g], slot) => {
    const h = HEROES[id], m = mult(lvl), [x, y] = SLOT_POS[slot], gh = 1 + (g ? g.hp : 0), ga = 1 + (g ? g.atk : 0);
    units.push({ side, slot, id, lvl, maxhp: Math.round(h.hp * m * gh), hp: Math.round(h.hp * m * gh), atk: h.atk * m * ga * ATKX, cd: h.cd, t: 0.3 + Math.random() * 0.6, en: 0, x: side ? AW - x : x, y, lunge: 0, hit: 0, cast: 0, shield: 0, stun: 0, rage: 0, dead: false, deadT: 0 });
  });
  mk(0, myTeam()); mk(1, enemy.team);
  B = { enemy, units, proj: [], floats: [], flashes: [], time: 0, over: false, result: null, speed: load("speed", 1), banner: { text: "В бой!", t: 0 } };
}
const alive = side => B.units.filter(u => u.side === side && !u.dead);
function targetFor(u) {
  const foes = alive(1 - u.side); if (!foes.length) return null;
  if (HEROES[u.id].back) return foes.reduce((a, b) => b.slot > a.slot ? b : a);
  const front = foes.filter(f => f.slot < 2), list = front.length ? front : foes;
  return list.find(f => f.slot % 2 === u.slot % 2) || list[0];
}
function float(u, text, col, big) { B.floats.push({ x: u.x + rnd(-4, 4), y: u.y - 30, text, col, t: 0, big }); }
function damage(src, u, amount, opts = {}) {
  if (!u || u.dead) return;
  let crit = !opts.nocrit && Math.random() < (src && src.id === "rogue" ? 0.25 : 0.1);
  let d = Math.round(amount * rnd(0.9, 1.1) * (crit ? 1.5 : 1));
  if (u.shield > 0) { const a = Math.min(u.shield, d); u.shield -= a; d -= a; if (a && !d) float(u, "блок", "#bfe6ff"); }
  u.hp -= d; u.hit = 0.2; u.en = Math.min(100, u.en + 6);
  if (d > 0) float(u, (crit ? "КРИТ " : "") + d, crit ? "#ffd02a" : "#ffffff", crit);
  if (opts.stun) u.stun = Math.max(u.stun, opts.stun);
  if (u.hp <= 0) { u.hp = 0; u.dead = true; u.deadT = 0; sfx(SND.die); }
  else sfx(opts.fx || SND.hit);
}
function heal(u, amount) { if (u.dead) return; const a = Math.min(u.maxhp - u.hp, Math.round(amount)); u.hp += a; if (a > 0) float(u, "+" + a, "#6aff7a"); }
function shoot(u, t, kind, dmg, opts = {}) { B.proj.push({ x: u.x + (u.side ? -8 : 8), y: u.y - 16, tx: t.x, ty: t.y - 14, t: 0, dur: 0.32, kind, src: u, to: t, dmg, opts }); }
function ability(u) {
  const h = HEROES[u.id], foes = alive(1 - u.side), friends = alive(u.side);
  u.cast = 0.6; u.en = 0; B.banner = { text: h.abil + "!", t: 0, side: u.side };
  B.flashes.push({ x: u.x, y: u.y - 12, t: 0, col: { knight: "#8ad0ff", archer: "#a8ff8a", priest: "#fff6a0", orc: "#ff5a3a", mage: "#ff9a2a", dwarf: "#f2c740", rogue: "#c87aff", ice: "#bfe6ff" }[u.id] });
  sfx(SND.magic);
  if (u.id === "knight") { u.shield += u.maxhp * 0.5; friends.forEach(f => { if (f !== u) f.shield += f.maxhp * 0.2; }); float(u, "ЩИТ", "#8ad0ff", true); }
  if (u.id === "archer") foes.forEach(f => shoot(u, f, "arrow", u.atk * 0.9));
  if (u.id === "priest") { friends.forEach(f => heal(f, u.atk * 3)); sfx(SND.heal); }
  if (u.id === "orc") { u.rage = 5; heal(u, u.maxhp * 0.15); float(u, "ЯРОСТЬ", "#ff5a3a", true); }
  if (u.id === "mage") { const t = targetFor(u); if (t) shoot(u, t, "fireball", u.atk * 3, { splash: u.atk * 0.5 }); }
  if (u.id === "dwarf") { B.shake = 0.35; foes.forEach(f => damage(u, f, u.atk * 1.2, { stun: f.slot < 2 ? 1 : 0, fx: SND.boom })); }
  if (u.id === "rogue") { const t = foes.reduce((a, b) => b.hp < a.hp ? b : a, foes[0]); if (t) { u.lunge = 0.3; damage(u, t, u.atk * 2.2, { nocrit: true }); } }
  if (u.id === "ice") { foes.forEach(f => shoot(u, f, "ice", u.atk * 0.8, { stun: 0.6 })); }
}
function attack(u) {
  const h = HEROES[u.id];
  if (h.heal) { const hurt = alive(u.side).filter(f => f.hp < f.maxhp * 0.9).sort((a, b) => a.hp / a.maxhp - b.hp / b.maxhp)[0]; if (hurt) { u.cast = 0.3; heal(hurt, u.atk * 1.0); u.en = Math.min(100, u.en + 25); sfx(SND.heal); return; } }
  const t = targetFor(u); if (!t) return;
  u.en = Math.min(100, u.en + 25);
  if (h.melee) { u.lunge = 0.25; damage(u, t, u.atk); }
  else { u.cast = 0.25; shoot(u, t, u.id === "archer" ? "arrow" : u.id === "mage" ? "fire" : u.id === "ice" ? "ice" : "holy", u.atk); sfx(SND.shoot); }
}
function stepBattle(dt) {
  if (!B || B.over) return;
  B.time += dt;
  for (const u of B.units) {
    if (u.dead) { u.deadT += dt; continue; }
    u.lunge = Math.max(0, u.lunge - dt); u.hit = Math.max(0, u.hit - dt); u.cast = Math.max(0, u.cast - dt); u.rage = Math.max(0, u.rage - dt);
    if (u.stun > 0) { u.stun -= dt; continue; }
    if (B.time < 0.8) continue;
    u.t -= dt * (u.rage > 0 ? 2 : 1);
    if (u.t <= 0) { u.t = u.cd * rnd(0.95, 1.05); if (u.en >= 100) ability(u); else attack(u); }
  }
  for (const p of B.proj) { p.t += dt; if (p.t >= p.dur && !p.done) { p.done = true;
    damage(p.src, p.to, p.dmg, { stun: p.opts.stun, fx: p.kind === "fireball" ? SND.boom : null });
    if (p.opts.splash) alive(p.to.side).forEach(f => { if (f !== p.to) damage(p.src, f, p.opts.splash, { nocrit: true }); });
    if (p.kind === "fireball") { B.shake = 0.25; B.flashes.push({ x: p.tx, y: p.ty, t: 0, col: "#ff9a2a", big: true }); }
  } }
  B.proj = B.proj.filter(p => !p.done);
  B.floats.forEach(f => f.t += dt); B.floats = B.floats.filter(f => f.t < 0.9);
  B.flashes.forEach(f => f.t += dt); B.flashes = B.flashes.filter(f => f.t < 0.5);
  if (B.shake) B.shake = Math.max(0, B.shake - dt);
  if (B.banner) { B.banner.t += dt; if (B.banner.t > 1.1) B.banner = null; }
  const a0 = alive(0).length, a1 = alive(1).length;
  if (!a0 || !a1 || B.time > 75) {
    const hp = s => B.units.filter(u => u.side === s).reduce((a, u) => a + u.hp / u.maxhp, 0);
    B.over = true; B.result = a1 === 0 ? "win" : a0 === 0 ? "lose" : hp(0) > hp(1) ? "win" : "lose";
    B.overT = 0;
  }
}
// итог боя: кубки, золото, сундук
function finishBattle() {
  const win = B.result === "win", r = { win, trophies: 0, gold: 0, chest: null };
  G.battles++; questAdd("battles"); if (win) questAdd("wins");
  if (win) {
    r.trophies = irnd(26, 32); r.gold = 12 + leagueOf(G.trophies) * 6; G.wins++; G.lstreak = 0;
    const free = G.chests.indexOf(null);
    if (free >= 0) { const roll = Math.random(); r.chest = G.wins % 12 === 0 ? "gold" : roll < 0.06 ? "gold" : roll < 0.3 ? "silver" : "wood"; G.chests[free] = { type: r.chest, openAt: null }; }
  } else { r.trophies = -Math.min(G.trophies, irnd(12, 18)); r.gold = 4; G.losses++; G.lstreak++; }
  const lgBefore = leagueOf(G.trophies);
  G.trophies += r.trophies; G.gold += r.gold;
  r.newLeague = leagueOf(G.trophies) > lgBefore ? leagueOf(G.trophies) : null;
  if (G.tut === 0) G.tut = 1;
  saveGame(); dirty = true; if (typeof yaScore === "function") yaScore(); return r;
}
// ---------------------------------------------------------------- звуки
const SND = {
  hit: [.4, .1, 200, 0, .01, .08, 4, 1, 0, 0, 0, 0, 0, 2],
  shoot: [.3, .05, 900, 0, .01, .08, 0, 1, -30],
  boom: [.7, .1, 80, 0, .05, .4, 4, 2, 0, 0, 0, 0, 0, 1.5],
  magic: [.45, 0, 600, .02, .1, .35, 1, 1, 0, 0, 300, .05, .05],
  heal: [.35, 0, 800, .02, .1, .3, 0, 1, 0, 0, 400, .08],
  die: [.5, .1, 300, 0, .05, .3, 1, 1, -8],
  click: [.35, 0, 900, 0, .005, .03, 1],
  coin: [.5, 0, 1675, 0, .03, .2, 1, 1.8, 0, 0, 837, .06],
  win: [.6, 0, 392, .02, .3, .6, 1, 1, 0, 0, 196, .1, .25, 0, 0, 0, .2],
  lose: [.6, 0, 160, 0, .1, .5, 3, 1.5, -4, 0, 0, 0, 0, .5],
  chest: [.6, 0, 523, .02, .2, .5, 1, 1, 0, 0, 262, .12, 0, 0, 0, 0, .15],
  up: [.55, 0, 440, .02, .25, .4, 1, 1, 0, 0, 220, .08, .1],
};
// бодрый марш вместо балалайки: мажор, барабан
const MARCH = [0, null, 2, 4, 4, null, 2, 0, 5, null, 4, 2, 4, null, null, null, 0, null, 2, 4, 7, null, 5, 4, 2, null, 0, 2, 0, null, null, null];
let musicNext = 0, musicStep = 0, musicTimer = 0;
function musicTick() {
  if (!AC || !musicOn || !soundOn) return;
  if (!musicGain) { musicGain = AC.createGain(); musicGain.gain.value = 0.35; musicGain.connect(master); }
  const SC = [0, 2, 4, 5, 7, 9, 11, 12], hz = s => 262 * 2 ** (s / 12);
  if (musicNext < AC.currentTime) musicNext = AC.currentTime + 0.05;
  while (musicNext < AC.currentTime + 0.5) {
    const s = musicStep % MARCH.length, n = MARCH[s], bar = Math.floor(musicStep / MARCH.length) % 4;
    const shift = [0, 5, 7, 0][bar];
    if (n !== null) sfx([.18, 0, hz(SC[n % 8] + shift), .005, .06, .14, 2, 1], musicNext, musicGain, true);
    if (s % 4 === 0) sfx([.25, 0, hz(shift - 24), .01, .1, .2, 1, 1], musicNext, musicGain, true);
    if (s % 4 === 2) sfx([.08, 0, 5000, 0, .01, .03, 4], musicNext, musicGain, true);
    musicNext += 0.16; musicStep++;
  }
}
function startMusic() { if (!musicTimer) musicTimer = setInterval(musicTick, 120); }
window.addEventListener("pointerdown", () => { if (soundOn) { audio(); startMusic(); } }, { passive: true });
function muteAll(m) { if (master) master.gain.value = m ? 0 : 0.32; }
