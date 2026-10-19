// =====================================================================
//  БЛОКИ-САМОЦВЕТЫ — классика и приключение, бонусы, монеты
// =====================================================================
let soundOn = true, musicOn = false, G = null, P = null, dirty = true;
const $ = id => document.getElementById(id);
const N = 8;
function load(key, def) { try { const v = localStorage.getItem("blocks_" + key); return v === null ? def : JSON.parse(v); } catch (e) { return def; } }
function save(key, val) { try { localStorage.setItem("blocks_" + key, JSON.stringify(val)); } catch (e) {} }
function srng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const GEMS = [
  ["#ff4d6d", "#ff9aae", "#b3123a"], ["#ffb020", "#ffd98a", "#b86e00"], ["#2fd27a", "#9af0c0", "#11804a"], ["#3d8bff", "#9cc4ff", "#1a4fb8"],
  ["#a35cff", "#d2adff", "#6420c0"], ["#22d3d6", "#9af2f2", "#0e8a8c"], ["#ff7ad9", "#ffc2ee", "#c02a98"],
];
const STONE = 7;   // серый камень на уровнях приключения
const SHAPES = (() => {
  const S = [], add = (rows, w) => { const c = []; rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch === "#") c.push([x, y]); })); S.push({ c, w, wd: Math.max(...c.map(p => p[0])) + 1, ht: Math.max(...c.map(p => p[1])) + 1 }); };
  add(["#"], 3);
  add(["##"], 4); add(["#", "#"], 4);
  add(["###"], 4); add(["#", "#", "#"], 4);
  add(["####"], 3); add(["#", "#", "#", "#"], 3);
  add(["#####"], 2); add(["#", "#", "#", "#", "#"], 2);
  add(["##", "##"], 5);
  add(["###", "###", "###"], 2);
  add(["##", "#."], 3); add(["##", ".#"], 3); add(["#.", "##"], 3); add([".#", "##"], 3);
  add(["###", "#..", "#.."], 1); add(["###", "..#", "..#"], 1); add(["#..", "#..", "###"], 1); add(["..#", "..#", "###"], 1);
  add(["###", ".#."], 2); add([".#.", "###"], 2); add(["#.", "##", "#."], 2); add([".#", "##", ".#"], 2);
  add(["##.", ".##"], 2); add([".##", "##."], 2); add(["#.", "##", ".#"], 2); add([".#", "##", "#."], 2);
  add(["#..", "###"], 2); add(["..#", "###"], 2); add(["###", "#.."], 2); add(["###", "..#"], 2);
  return S;
})();
const SMALL = SHAPES.filter(s => s.c.length <= 2);
function randShape(pool = SHAPES) { const tot = pool.reduce((a, s) => a + s.w, 0); let r = Math.random() * tot; for (const s of pool) { r -= s.w; if (r <= 0) return s; } return pool[0]; }
const mkPiece = pool => ({ si: SHAPES.indexOf(randShape(pool)), gem: Math.floor(Math.random() * GEMS.length) });
// ---------------------------------------------------------------- профиль игрока
const BOOST = {
  hammer: { name: "Молот", icon: "🔨", price: 40, desc: "Разбей один блок" },
  bomb: { name: "Бомба", icon: "💣", price: 70, desc: "Взорви квадрат 3×3" },
  refresh: { name: "Новые фигуры", icon: "🔄", price: 30, desc: "Замени все три фигуры" },
};
function newProfile() { return { coins: 100, best: 0, lvl: 0, stars: [], boost: { hammer: 2, bomb: 1, refresh: 2 }, gift: 0, giftDay: 0, t: 0 }; }
function saveP() { P.t = Date.now(); save("p", P); if (typeof yaPush === "function") yaPush(); }
const GIFT_EVERY = 6 * 3600 * 1000;
function claimGift() {
  if (Date.now() - P.gift < GIFT_EVERY) return null;
  const streak = Date.now() - P.gift < 2 * 86400000 ? Math.min(7, (P.giftDay || 0) + 1) : 1;
  const coins = 20 + streak * 10, b = ["hammer", "refresh", "bomb"][streak % 3];
  P.gift = Date.now(); P.giftDay = streak; P.coins += coins; P.boost[b]++; saveP();
  return { coins, b, streak };
}
// ---------------------------------------------------------------- уровни приключения
const LEVELS = 60;
function levelDef(n) {   // n с нуля
  const r = srng(n * 7919 + 13), kind = n % 5 === 3 ? "score" : "crystal";
  const fill = Math.min(18, 5 + Math.floor(n * 0.4)), crys = Math.min(10, 3 + Math.floor(n / 5)), stones = n >= 6 ? Math.min(4, Math.floor((n - 4) / 8)) : 0;
  const board = Array.from({ length: N }, () => new Array(N).fill(-1)), cr = [];
  const free = () => { for (;;) { const x = Math.floor(r() * N), y = Math.floor(r() * N); if (board[y][x] < 0) return [x, y]; } };
  // узоры: симметричные кусочки, чтобы поле выглядело задуманным
  for (let k = 0; k < fill; k++) {
    const [x, y] = free(), gem = Math.floor(r() * 7);
    board[y][x] = gem; if (board[y][N - 1 - x] < 0 && r() < 0.6) board[y][N - 1 - x] = gem;
  }
  for (let i = 0; i < N; i++) { if (board[i].every(v => v >= 0)) board[i][Math.floor(r() * N)] = -1; if (board.every(row => row[i] >= 0)) board[Math.floor(r() * N)][i] = -1; }
  for (let k = 0; k < stones; k++) { const [x, y] = free(); board[y][x] = STONE; }
  if (kind === "crystal") {
    const filled = []; board.forEach((row, y) => row.forEach((v, x) => { if (v >= 0 && v !== STONE) filled.push(y * N + x); }));
    while (cr.length < Math.min(crys, filled.length)) { const k = filled[Math.floor(r() * filled.length)]; if (!cr.includes(k)) cr.push(k); }
  }
  const target = kind === "score" ? 200 + n * 30 : cr.length;
  const par = kind === "score" ? Math.round(target / 18) : Math.round(cr.length * 2.5 + 6);
  return { n, kind, board, cr, target, par };
}
// ---------------------------------------------------------------- партия
function startClassic() {
  fx = [];
  G = { mode: "classic", board: Array.from({ length: N }, () => new Array(N).fill(-1)), cr: [], tray: [], score: 0, combo: 0, sinceClear: 0, cont: 0, over: false, won: false, moves: 0, t: Date.now(), newBest: false };
  refill(); saveGame(); dirty = true; yaGameplay(true);
}
function startLevel(n) {
  fx = [];
  const L = levelDef(n);
  G = { mode: "adv", lvl: n, kind: L.kind, target: L.target, par: L.par, board: L.board, cr: L.cr.slice(), got: 0, tray: [], score: 0, combo: 0, sinceClear: 0, cont: 0, over: false, won: false, moves: 0, t: Date.now() };
  refill(); saveGame(); dirty = true; yaGameplay(true);
}
function refill() {
  for (let tries = 0; tries < 40; tries++) {
    const t = [mkPiece(), mkPiece(), mkPiece()];
    if (t.some(p => canPlaceAny(SHAPES[p.si])) || tries === 39) { G.tray = t; G.trayT = performance.now(); return; }
  }
}
function saveGame() { G.t = Date.now(); save("game", G); }
const fits = (sh, bx, by) => sh.c.every(([x, y]) => { const X = bx + x, Y = by + y; return X >= 0 && Y >= 0 && X < N && Y < N && G.board[Y][X] < 0; });
function canPlaceAny(sh) { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (fits(sh, x, y)) return true; return false; }
function fullLines(b) { const rows = [], cols = []; for (let i = 0; i < N; i++) { if (b[i].every(v => v >= 0)) rows.push(i); if (b.every(r => r[i] >= 0)) cols.push(i); } return { rows, cols }; }
function wouldClear(sh, bx, by) { const b = G.board.map(r => r.slice()); sh.c.forEach(([x, y]) => b[by + y][bx + x] = 1); return fullLines(b); }
let fx = [], shake = 0;
const PRAISE = ["", "", "Хорошо!", "Отлично!", "Супер!", "Невероятно!", "Легенда!"];
// убрать клетки (общая для рядов, молота и бомбы); возвращает сколько кристаллов собрано
function removeCells(cells, now) {
  let got = 0;
  for (const k of cells) {
    const x = k % N, y = Math.floor(k / N), v = G.board[y][x]; if (v < 0) continue;
    fx.push({ kind: "burst", x, y, gem: v, t0: now + (x + y) * 16 });
    const ci = G.cr.indexOf(k); if (ci >= 0) { G.cr.splice(ci, 1); got++; fx.push({ kind: "crys", x, y, t0: now + (x + y) * 16 }); }
    G.board[y][x] = -1;
  }
  if (got) { G.got = (G.got || 0) + got; sfx([.45, 0, 1320, .01, .1, .3, 0, 1, 0, 0, 660, .05], 0); }
  return got;
}
function place(ti, bx, by) {
  const p = G.tray[ti]; if (!p) return false; const sh = SHAPES[p.si]; if (!fits(sh, bx, by)) return false;
  sh.c.forEach(([x, y]) => G.board[by + y][bx + x] = p.gem);
  G.tray[ti] = null; G.score += sh.c.length; G.moves++;
  const now = performance.now(), { rows, cols } = fullLines(G.board), L = rows.length + cols.length;
  if (L) {
    G.combo++; G.sinceClear = 0;
    const cells = new Set(); rows.forEach(r => { for (let x = 0; x < N; x++) cells.add(r * N + x); }); cols.forEach(c => { for (let y = 0; y < N; y++) cells.add(y * N + c); });
    removeCells(cells, now);
    const pts = Math.round((L * 10 + (L - 1) * 20) * (1 + (G.combo - 1) * 0.5));
    G.score += pts;
    const word = PRAISE[Math.min(PRAISE.length - 1, L + (G.combo > 2 ? 1 : 0))] || "";
    fx.push({ kind: "text", text: `+${pts}` + (G.combo > 1 ? `  Комбо ×${G.combo}` : ""), sub: word, x: bx + sh.wd / 2, y: by + sh.ht / 2, t0: now });
    sfx([.5, 0, 520 * 2 ** (Math.min(G.combo, 8) / 12), .01, .15, .35, 1, 1, 0, 0, 260, .07, .05]);
    if (L >= 2) { shake = Math.min(14, 4 + L * 3); fx.push({ kind: "flash", t0: now }); vibe(40); } else vibe(20);
    if (!G.board.some(r => r.some(v => v >= 0))) { G.score += 300; fx.push({ kind: "text", text: "+300", sub: "Чистое поле!", x: 4, y: 4, t0: now + 300 }); }
  } else { G.sinceClear++; if (G.sinceClear >= 3) G.combo = 0; sfx([.35, 0, 300, 0, .02, .06, 1, 1.5, 0, 0, 0, 0, 0, 1]); }
  sh.c.forEach(([x, y]) => fx.push({ kind: "pop", x: bx + x, y: by + y, t0: now }));
  afterMove();
  return true;
}
function afterMove() {
  if (G.mode === "classic" && G.score > P.best) { P.best = G.score; G.newBest = true; }
  if (G.mode === "adv" && !G.won && (G.kind === "crystal" ? G.cr.length === 0 : G.score >= G.target)) return winLevel();
  if (G.tray.every(t => !t)) refill();
  if (!G.tray.some(t => t && canPlaceAny(SHAPES[t.si]))) gameOver();
  saveGame(); dirty = true;
}
function starsFor() { return G.moves <= G.par ? 3 : G.moves <= G.par * 1.4 ? 2 : 1; }
function winLevel() {
  G.won = true; G.over = true; G.overAt = performance.now(); yaGameplay(false);
  const st = starsFor(), prev = P.stars[G.lvl] || 0, coins = 10 + st * 10 + (prev ? 0 : 20);
  P.stars[G.lvl] = Math.max(prev, st); if (P.lvl <= G.lvl) P.lvl = G.lvl + 1; P.coins += coins;
  G.reward = { st, coins }; saveP(); saveGame(); dirty = true;
  sfx([.6, 0, 523, .02, .3, .6, 1, 1, 0, 0, 262, .1, .25, 0, 0, 0, .2]);
}
function gameOver() {
  G.over = true; G.overAt = performance.now(); yaGameplay(false);
  if (G.mode === "classic") { G.reward = { coins: Math.floor(G.score / 40) }; P.coins += G.reward.coins; saveP(); if (typeof yaScore === "function") yaScore(); }
  sfx([.5, 0, 220, .05, .2, .6, 3, 1, -2, 0, 0, 0, 0, .3]);
}
function continueGame() {
  const now = performance.now(), cells = [];
  for (let y = 2; y < 6; y++) for (let x = 2; x < 6; x++) cells.push(y * N + x);
  removeCells(cells, now);
  G.tray = [mkPiece(SMALL), mkPiece(SMALL), mkPiece(SMALL)]; G.trayT = now; G.over = false; G.cont++; yaGameplay(true);
  sfx([.5, 0, 523, .02, .2, .5, 1, 1, 0, 0, 262, .12, 0, 0, 0, 0, .15]); saveGame(); dirty = true;
}
// ---- бонусы
function useHammer(x, y) {
  if (G.board[y][x] < 0) return false;
  P.boost.hammer--; removeCells([y * N + x], performance.now()); shake = 6; sfx([.6, .1, 120, 0, .03, .2, 4, 1.5, 0, 0, 0, 0, 0, 2]); vibe(30);
  saveP(); afterMove(); return true;
}
function useBomb(x, y) {
  const cells = []; for (let j = y - 1; j <= y + 1; j++) for (let i = x - 1; i <= x + 1; i++) if (i >= 0 && j >= 0 && i < N && j < N) cells.push(j * N + i);
  P.boost.bomb--; removeCells(cells, performance.now()); shake = 14; fx.push({ kind: "flash", t0: performance.now() });
  sfx([.8, .1, 70, 0, .08, .5, 4, 2, 0, 0, 0, 0, 0, 1.5]); vibe(60); saveP(); afterMove(); return true;
}
function useRefresh() {
  P.boost.refresh--; G.tray = [mkPiece(), mkPiece(), mkPiece()]; for (let k = 0; k < 20 && !G.tray.some(t => canPlaceAny(SHAPES[t.si])); k++) G.tray = [mkPiece(), mkPiece(), mkPiece()];
  G.trayT = performance.now(); sfx([.4, 0, 700, .01, .1, .2, 1, 1, 0, 0, 350, .05]); saveP(); saveGame(); dirty = true;
}
function vibe(ms) { try { if (load("vibe", true) && navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }
function muteAll(m) { if (master) master.gain.value = m ? 0 : 0.32; }
window.addEventListener("pointerdown", () => { if (soundOn) audio(); }, { passive: true });
