// =====================================================================
//  Экраны: меню, карта уровней, игра. Отрисовка поля и управление
// =====================================================================
const cv = $("cv"), g = cv.getContext("2d");
let dpr = 1, W = 360, cell = 40, BX = 8, BY = 8, BS = 320, TY = 340, TH = 140, drag = null, tool = null, screen = "menu";
function resize() {
  const r = cv.parentElement.getBoundingClientRect(); if (!r.width || !r.height) return;
  dpr = Math.min(3, window.devicePixelRatio || 1);
  W = Math.min(r.width, 480, r.height / 1.42);
  BX = W * 0.025; BS = W - BX * 2; cell = BS / N; BY = BX + 2; TY = BY + BS + W * 0.03; TH = W * 0.37;
  const H = TY + TH;
  cv.style.width = W + "px"; cv.style.height = H + "px"; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
}
function rr(x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
function gem(x, y, s, k, alpha = 1) {
  g.globalAlpha = alpha;
  const p = s * 0.06, r = s * 0.16;
  if (k === STONE) {
    rr(x + p, y + p, s - 2 * p, s - 2 * p, r * 0.6); g.fillStyle = "#4a4f66"; g.fill();
    rr(x + p, y + p, s - 2 * p, s - 2 * p - s * 0.07, r * 0.6); g.fillStyle = "#8a90a8"; g.fill();
    g.strokeStyle = "#5a6078"; g.lineWidth = Math.max(1, s * 0.05); g.beginPath(); g.moveTo(x + s * 0.3, y + s * 0.25); g.lineTo(x + s * 0.45, y + s * 0.5); g.lineTo(x + s * 0.35, y + s * 0.72); g.moveTo(x + s * 0.45, y + s * 0.5); g.lineTo(x + s * 0.7, y + s * 0.55); g.stroke();
    g.globalAlpha = 1; return;
  }
  const c = GEMS[k];
  rr(x + p, y + p, s - 2 * p, s - 2 * p, r); g.fillStyle = c[2]; g.fill();
  rr(x + p, y + p, s - 2 * p, s - 2 * p - s * 0.07, r); g.fillStyle = c[0]; g.fill();
  const i = s * 0.22; rr(x + i, y + i, s - 2 * i, s - 2 * i - s * 0.05, r * 0.6); g.fillStyle = c[1]; g.globalAlpha = alpha * 0.45; g.fill();
  g.globalAlpha = alpha * 0.9; g.fillStyle = "#ffffff"; rr(x + s * 0.2, y + s * 0.16, s * 0.22, s * 0.1, s * 0.05); g.fill();
  g.globalAlpha = 1;
}
function crystal(cx, cy, s, t) {   // сверкающий кристалл поверх блока
  const k = 1 + Math.sin(t / 250 + cx) * 0.06, h = s * 0.3 * k;
  g.beginPath(); g.moveTo(cx, cy - h); g.lineTo(cx + h * 0.75, cy - h * 0.2); g.lineTo(cx, cy + h); g.lineTo(cx - h * 0.75, cy - h * 0.2); g.closePath();
  g.fillStyle = "#ffffff"; g.fill(); g.strokeStyle = "#1b2550"; g.lineWidth = Math.max(1.5, s * 0.06); g.stroke();
  g.beginPath(); g.moveTo(cx - h * 0.75, cy - h * 0.2); g.lineTo(cx + h * 0.75, cy - h * 0.2); g.moveTo(cx, cy - h); g.lineTo(cx, cy + h); g.strokeStyle = "rgba(90,120,255,0.6)"; g.lineWidth = Math.max(1, s * 0.03); g.stroke();
}
function trayRect(i) { const w = BS / 3; return { x: BX + w * i, y: TY, w, h: TH }; }
const trayScale = sh => Math.min(0.6, (BS / 3 - 14) / (sh.wd * cell), (TH - 14) / (sh.ht * cell));
function draw(now) {
  g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, TY + TH);
  if (shake > 0) { g.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake); shake *= 0.86; if (shake < 0.4) shake = 0; }
  rr(BX - 4, BY - 4, BS + 8, BS + 8, 16); g.fillStyle = "#1b2550"; g.fill();
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { rr(BX + x * cell + 2, BY + y * cell + 2, cell - 4, cell - 4, cell * 0.14); g.fillStyle = (x + y) % 2 ? "#26336a" : "#2a3874"; g.fill(); }
  let ghost = null, clear = null;
  if (drag) { const sh = SHAPES[G.tray[drag.i].si], tl = dragTL(sh), bx = Math.round((tl.x - BX) / cell), by = Math.round((tl.y - BY) / cell); if (fits(sh, bx, by)) { ghost = { sh, bx, by }; clear = wouldClear(sh, bx, by); } }
  const lit = new Set(); if (clear) { clear.rows.forEach(r => { for (let x = 0; x < N; x++) lit.add(r * N + x); }); clear.cols.forEach(c => { for (let y = 0; y < N; y++) lit.add(y * N + c); }); }
  const dg = drag ? G.tray[drag.i].gem : 0;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const k = G.board[y][x]; if (k < 0) continue;
    if (fx.some(f => f.kind === "land" && now - f.t0 < f.dur && f.at.has(y * N + x))) continue;
    let s = cell, ox = 0; const pop = fx.find(f => f.kind === "pop" && f.x === x && f.y === y && now >= f.t0 && now - f.t0 < 260);
    if (pop) { const q = (now - pop.t0) / 260; s = cell * (1 + 0.12 * Math.sin(q * Math.PI) * (1 - q)); ox = (cell - s) / 2; }
    gem(BX + x * cell + ox, BY + y * cell + ox, s, lit.has(y * N + x) && k !== STONE ? dg : k);
    if (G.cr.includes(y * N + x)) crystal(BX + (x + 0.5) * cell, BY + (y + 0.5) * cell, cell, now);
  }
  if (ghost) { ghost.sh.c.forEach(([x, y]) => gem(BX + (ghost.bx + x) * cell, BY + (ghost.by + y) * cell, cell, dg, 0.45)); lit.forEach(k => { const x = k % N, y = Math.floor(k / N); g.fillStyle = `rgba(255,255,255,${0.18 + 0.1 * Math.sin(now / 90)})`; rr(BX + x * cell + 2, BY + y * cell + 2, cell - 4, cell - 4, cell * 0.14); g.fill(); }); }
  // прицел молота или бомбы
  if (tool && tool.x !== undefined) { const r = tool.kind === "bomb" ? 1 : 0; g.strokeStyle = "#ffd02a"; g.lineWidth = 3; rr(BX + (tool.x - r) * cell + 1, BY + (tool.y - r) * cell + 1, (2 * r + 1) * cell - 2, (2 * r + 1) * cell - 2, 10); g.stroke(); }
  // лоток: новые фигуры въезжают снизу
  const ti = Math.min(1, (now - (G.trayT || 0)) / 300);
  G.tray.forEach((p, i) => {
    if (!p || (drag && drag.i === i) || fx.some(f => f.kind === "back" && f.i === i && now - f.t0 < f.dur)) return;
    const sh = SHAPES[p.si], R = trayRect(i), sc = trayScale(sh), s = cell * sc, can = canPlaceAny(sh);
    const ox = R.x + (R.w - sh.wd * s) / 2, oy = R.y + (R.h - sh.ht * s) / 2 + (1 - easeOut(Math.max(0, ti - i * 0.15) / (1 - i * 0.15 || 1))) * TH;
    sh.c.forEach(([x, y]) => gem(ox + x * s, oy + y * s, s, p.gem, can ? 1 : 0.3));
  });
  if (drag) {
    const sh = SHAPES[G.tray[drag.i].si], v = dragView(sh), k = easeOut((now - drag.t0) / 140), R = trayRect(drag.i), s0 = trayScale(sh);
    const sc = s0 + (1 - s0) * k, s = cell * sc, ox = v.x + (sh.wd * cell - sh.wd * s) / 2, oy = v.y + (sh.ht * cell - sh.ht * s) / 2;
    g.save(); g.shadowColor = "rgba(0,0,0,0.35)"; g.shadowBlur = 14; g.shadowOffsetY = 8;
    sh.c.forEach(([x, y]) => gem(ox + x * s, oy + y * s, s, G.tray[drag.i].gem, 1)); g.restore();
  }
  // приземление и возврат в лоток
  for (const f of fx) {
    if (f.kind !== "land" && f.kind !== "back") continue;
    const k = easeOut((now - f.t0) / f.dur); if (k >= 1) continue;
    f.cells.forEach(c => { const s = c.s0 + (c.s1 - c.s0) * k; gem(c.x0 + (c.x1 - c.x0) * k, c.y0 + (c.y1 - c.y0) * k, s, f.gem, 1); });
  }
  fx = fx.filter(f => now - f.t0 < 1400);
  for (const f of fx) {
    const q = (now - f.t0) / 650;
    if (f.kind === "burst" && q < 0) gem(BX + f.x * cell, BY + f.y * cell, cell, f.gem);
    if (f.kind === "burst" && q >= 0 && q < 1) {
      const cx = BX + (f.x + 0.5) * cell, cy = BY + (f.y + 0.5) * cell;
      if (q < 0.25) gem(cx - cell / 2 * (1 - q), cy - cell / 2 * (1 - q), cell * (1 - q), f.gem, 1 - q * 2);
      g.fillStyle = f.gem === STONE ? "#8a90a8" : GEMS[f.gem][1];
      for (let k = 0; k < 6; k++) { const a = k * 1.047 + f.x, d = cell * (0.2 + q * 1.1); g.globalAlpha = 1 - q; g.fillRect(cx + Math.cos(a) * d - 3, cy + Math.sin(a) * d + q * q * cell * 1.2 - 3, 6, 6); }
      g.globalAlpha = 1;
    }
    if (f.kind === "crys" && q >= 0 && q < 1.4) {   // кристалл летит к счётчику цели
      const k = Math.min(1, q / 1.2), sx = BX + (f.x + 0.5) * cell, sy = BY + (f.y + 0.5) * cell, tx = W / 2, ty = -20;
      crystal(sx + (tx - sx) * easeIn(k), sy + (ty - sy) * easeIn(k) - Math.sin(k * Math.PI) * 40, cell * (1 + k * 0.3), now);
    }
    if (f.kind === "flash" && q < 0.5) { g.fillStyle = `rgba(255,255,255,${0.35 * (1 - q * 2)})`; g.fillRect(BX, BY, BS, BS); }
    if (f.kind === "text" && now >= f.t0) {
      const q2 = (now - f.t0) / 1200, x = BX + f.x * cell, y = BY + f.y * cell - q2 * cell * 1.2;
      g.globalAlpha = Math.max(0, Math.min(1, (1 - q2) * 3)); g.textAlign = "center"; g.lineJoin = "round";
      const big = Math.round(cell * 0.62);
      if (f.sub) { const sc = Math.min(1, q2 * 8) * (1 + Math.max(0, 0.15 - q2)); g.save(); g.translate(W / 2, BY + BS * 0.42 - q2 * 30); g.scale(sc, sc); g.font = `800 ${big}px Rubik, sans-serif`; g.lineWidth = big * 0.25; g.strokeStyle = "#1b2550"; g.strokeText(f.sub, 0, 0); g.fillStyle = "#ffd02a"; g.fillText(f.sub, 0, 0); g.restore(); }
      g.font = `800 ${Math.round(cell * 0.42)}px Rubik, sans-serif`; g.lineWidth = 5; g.strokeStyle = "#1b2550"; const tx = Math.max(80, Math.min(W - 80, x)); g.strokeText(f.text, tx, y); g.fillStyle = "#ffffff"; g.fillText(f.text, tx, y);
      g.globalAlpha = 1;
    }
  }
}
const easeOut = t => 1 - (1 - Math.max(0, Math.min(1, t))) ** 3, easeIn = t => t * t;
function dragTL(sh, d = drag) { const lift = d.touch ? cell * 1.6 : cell * 0.5; return { x: d.x - sh.wd * cell / 2, y: d.y - sh.ht * cell / 2 - lift }; }
// плавное следование за пальцем: фигура догоняет палец, а не прыгает
function dragView(sh) { const tl = dragTL(sh); if (drag.vx === undefined) { drag.vx = tl.x; drag.vy = tl.y; } drag.vx += (tl.x - drag.vx) * 0.5; drag.vy += (tl.y - drag.vy) * 0.5; return { x: drag.vx, y: drag.vy }; }
function pos(e) { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
const cellAt = p => { const x = Math.floor((p.x - BX) / cell), y = Math.floor((p.y - BY) / cell); return x >= 0 && y >= 0 && x < N && y < N ? { x, y } : null; };
cv.addEventListener("pointerdown", e => {
  if (G.over || screen !== "game") return; const p = pos(e);
  if (tool) { const c = cellAt(p); if (c) { tool.x = c.x; tool.y = c.y; cv.setPointerCapture(e.pointerId); } return; }
  for (let i = 0; i < 3; i++) { const R = trayRect(i); if (G.tray[i] && p.x >= R.x && p.x < R.x + R.w && p.y >= R.y - 10 && p.y < R.y + R.h) {
    drag = { i, x: p.x, y: p.y, touch: e.pointerType !== "mouse", id: e.pointerId, t0: performance.now() }; cv.setPointerCapture(e.pointerId); sfx([.25, 0, 700, 0, .01, .03, 1]); return; } }
});
cv.addEventListener("pointermove", e => {
  const p = pos(e);
  if (tool && tool.x !== undefined) { const c = cellAt(p); if (c) { tool.x = c.x; tool.y = c.y; } return; }
  if (!drag || drag.id !== e.pointerId) return; drag.x = p.x; drag.y = p.y;
});
cv.addEventListener("pointerup", e => {
  if (tool && tool.x !== undefined) {
    const ok = tool.kind === "hammer" ? useHammer(tool.x, tool.y) : useBomb(tool.x, tool.y);
    if (ok) { tool = null; $("toolHint").hidden = true; } else { tool.x = undefined; toast("Здесь пусто — выбери блок"); }
    dirty = true; return;
  }
  if (!drag) return;
  const sh = SHAPES[G.tray[drag.i].si], tl = dragTL(sh), i = drag.i, gm = G.tray[i].gem, vx = drag.vx ?? tl.x, vy = drag.vy ?? tl.y; drag = null;
  const bx = Math.round((tl.x - BX) / cell), by = Math.round((tl.y - BY) / cell), now = performance.now();
  if (fits(sh, bx, by)) {
    // фигура мягко долетает до своих клеток, потом они чуть пружинят
    const LAND = 110, at = new Set(sh.c.map(([x, y]) => (by + y) * N + bx + x));
    fx.push({ kind: "land", gem: gm, t0: now, dur: LAND, at, cells: sh.c.map(([x, y]) => ({ x0: vx + x * cell, y0: vy + y * cell, x1: BX + (bx + x) * cell, y1: BY + (by + y) * cell, s0: cell, s1: cell })) });
    place(i, bx, by);
    fx.forEach(f => { if (f.kind === "pop" && f.t0 >= now) f.t0 = now + LAND; });
    // взрывы рядов начинаются после приземления
    fx.forEach(f => { if ((f.kind === "burst" || f.kind === "crys" || f.kind === "text" || f.kind === "flash") && f.t0 >= now - 1) f.t0 += LAND; });
  } else {
    const R = trayRect(i), s0 = trayScale(sh) * cell, ox = R.x + (R.w - sh.wd * s0) / 2, oy = R.y + (R.h - sh.ht * s0) / 2;
    fx.push({ kind: "back", i, gem: gm, t0: now, dur: 200, cells: sh.c.map(([x, y]) => ({ x0: vx + x * cell, y0: vy + y * cell, x1: ox + x * s0, y1: oy + y * s0, s0: cell, s1: s0 })) });
    sfx([.2, 0, 200, 0, .01, .05, 1]);
  }
  dirty = true;
});
cv.addEventListener("pointercancel", () => { drag = null; });
// ---- экраны
function show(s) {
  screen = s; ["menuScr", "mapScr", "gameScr"].forEach(id => $(id).hidden = id !== s + "Scr");
  if (s === "game") requestAnimationFrame(resize);
  dirty = true;
}
function renderMenu() {
  const gl = P.gift + GIFT_EVERY - Date.now();
  $("mCoins").textContent = P.coins;
  $("mAdv").innerHTML = `Приключение<small>Уровень ${Math.min(P.lvl + 1, LEVELS)} · ★ ${P.stars.reduce((a, b) => a + (b || 0), 0)}</small>`;
  $("mClassic").innerHTML = `Классика<small>Рекорд: ${P.best}</small>`;
  $("mGift").innerHTML = gl <= 0 ? `🎁 Забрать подарок` : `🎁 Подарок через ${fmtT(gl)}`; $("mGift").disabled = gl > 0;
  $("mSound").textContent = soundOn ? "🔊 Звук" : "🔇 Звук";
}
function renderMap() {
  $("mapCoins").textContent = P.coins;
  let h = ""; for (let n = 0; n < LEVELS; n++) {
    const open = n <= P.lvl, st = P.stars[n] || 0, off = [0, 60, 110, 60, 0, -60, -110, -60][n % 8], kind = n % 5 === 3 ? "🏆" : "💎";
    h += `<button class="node ${open ? "" : "locked"} ${n === P.lvl ? "cur" : ""}" data-lvl="${n}" style="--off:${off}px" ${open ? "" : "disabled"}><b>${n + 1}</b><span class="nk">${open ? kind : "🔒"}</span><span class="st">${"★".repeat(st)}${"☆".repeat(open && n < P.lvl ? 3 - st : 0)}</span></button>`;
  }
  $("map").innerHTML = h;
}
let mapScrolled = false;
function renderGameHud() {
  $("gCoins").textContent = P.coins;
  if (G.mode === "classic") $("goal").innerHTML = `<div class="sc">${G.score}</div><div class="sub">👑 ${P.best}</div>`;
  else {
    const left = G.kind === "crystal" ? `<span class="gi">💎</span> ${G.cr.length}` : `<span class="gi">🏆</span> ${Math.min(G.score, G.target)}/${G.target}`;
    const st = G.moves <= G.par ? 3 : G.moves <= G.par * 1.4 ? 2 : 1;
    $("goal").innerHTML = `<div class="lv">Уровень ${G.lvl + 1}</div><div class="sc2">${left}</div><div class="sub">${"★".repeat(st)}<span class="dim">${"★".repeat(3 - st)}</span> · ходов ${G.moves}</div>`;
  }
  for (const k of Object.keys(BOOST)) $("b_" + k).innerHTML = `<span class="bi">${BOOST[k].icon}</span><span class="bc">${P.boost[k] > 0 ? P.boost[k] : "+"}</span>`;
  $("tutG").hidden = !(G.mode === "classic" && P.best === 0 && G.moves < 2) && !(G.mode === "adv" && G.lvl === 0 && G.moves < 2);
  $("tutG").textContent = G.mode === "adv" ? "Собери все 💎: убери ряды или столбцы, в которых они лежат." : "Перетащи фигуру на поле. Заполни ряд или столбец — он исчезнет.";
}
const fmtT = ms => { const s = Math.ceil(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return h ? `${h} ч ${m} мин` : `${m} мин`; };
let overShown = false;
function showOver() {
  overShown = true; let h;
  if (G.won) h = `<h1>Уровень ${G.lvl + 1} пройден!</h1><div class="stars">${[0, 1, 2].map(i => `<span class="${i < G.reward.st ? "on" : ""}" style="animation-delay:${i * 0.25}s">★</span>`).join("")}</div><div class="rew">+${G.reward.coins} 🪙</div>
    <div class="btns">${G.lvl + 1 < LEVELS ? `<button class="btn orange" data-act="next">Дальше</button>` : ""}<button class="btn" data-act="tomap">К карте</button></div>`;
  else if (G.mode === "adv") h = `<h1>Ходов больше нет</h1><div class="hint">${G.kind === "crystal" ? `Осталось собрать 💎 ${G.cr.length}` : `Не хватило ${G.target - G.score} очков`}</div>
    <div class="btns">${G.cont < 1 ? `<button class="btn green" data-act="cont">▶ Продолжить<small>ролик — середина поля очистится</small></button>` : ""}<button class="btn orange" data-act="retry">Заново</button><button class="btn" data-act="tomap">К карте</button></div>`;
  else h = `<h1>Ходов больше нет</h1><div class="big">${G.score}</div><div class="hint">${G.newBest ? "🏆 Новый рекорд!" : `Рекорд: ${P.best}`}</div><div class="rew">+${G.reward.coins} 🪙</div>
    <div class="btns">${G.cont < 1 ? `<button class="btn green" data-act="cont">▶ Продолжить<small>ролик — середина поля очистится</small></button>` : ""}<button class="btn orange" data-act="again">Новая игра</button><button class="btn" data-act="tomenu">В меню</button></div>`;
  $("overBody").innerHTML = h; $("over").hidden = false;
}
function boostTap(k) {
  if (G.over) return;
  if (P.boost[k] <= 0) { buyBoost(k); return; }
  if (k === "refresh") { useRefresh(); return; }
  tool = tool && tool.kind === k ? null : { kind: k }; $("toolHint").hidden = !tool;
  if (tool) $("toolHint").textContent = k === "hammer" ? "🔨 Нажми на блок, который разбить" : "💣 Нажми, куда бросить бомбу (3×3)";
}
function buyBoost(k) {
  const B = BOOST[k];
  $("shopBody").innerHTML = `<h1>${B.icon} ${B.name}</h1><div class="hint">${B.desc}</div><div class="btns"><button class="btn orange" data-buy="${k}" ${P.coins >= B.price ? "" : "disabled"}>Купить за ${B.price} 🪙</button><button class="btn green" data-adboost="${k}">▶ Бесплатно за ролик</button><button class="btn" data-act="closeshop">Отмена</button></div><div class="hint">У тебя ${P.coins} 🪙</div>`;
  $("shop").hidden = false;
}
document.addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return; const a = b.dataset.act;
  if (b.dataset.lvl !== undefined) { startLevel(+b.dataset.lvl); show("game"); }
  else if (b.dataset.boost) boostTap(b.dataset.boost);
  else if (b.dataset.buy) { const k = b.dataset.buy; P.coins -= BOOST[k].price; P.boost[k]++; saveP(); $("shop").hidden = true; sfx([.5, 0, 1675, 0, .03, .2, 1, 1.8, 0, 0, 837, .06]); }
  else if (b.dataset.adboost) { const k = b.dataset.adboost; $("shop").hidden = true; adReward(() => { P.boost[k]++; saveP(); dirty = true; }); }
  else if (a === "closeshop") $("shop").hidden = true;
  else if (b.id === "mAdv") { show("map"); mapScrolled = false; }
  else if (b.id === "mClassic") { if (!(G && G.mode === "classic" && !G.over)) startClassic(); show("game"); }
  else if (b.id === "mGift") { const r = claimGift(); if (r) { toast(`День ${r.streak}: +${r.coins} 🪙 и ${BOOST[r.b].icon} ${BOOST[r.b].name}`); sfx([.5, 0, 523, .02, .2, .5, 1, 1, 0, 0, 262, .12, 0, 0, 0, 0, .15]); } }
  else if (b.id === "mSound") { soundOn = !soundOn; save("sound", soundOn); if (soundOn) audio(); }
  else if (b.id === "mTop") { $("topWin").hidden = false; renderTop(); }
  else if (a === "closetop") $("topWin").hidden = true;
  else if (b.id === "back" || a === "tomenu") { $("over").hidden = true; overShown = false; tool = null; $("toolHint").hidden = true; if (G.mode === "adv" && a !== "tomenu") show("map"); else show("menu"); }
  else if (b.id === "mapBack") show("menu");
  else if (a === "cont") adReward(() => { $("over").hidden = true; overShown = false; continueGame(); });
  else if (a === "again") { $("over").hidden = true; overShown = false; yaInterstitial(() => startClassic()); }
  else if (a === "retry") { $("over").hidden = true; overShown = false; yaInterstitial(() => startLevel(G.lvl)); }
  else if (a === "next") { $("over").hidden = true; overShown = false; const n = G.lvl + 1; yaInterstitial(() => startLevel(n)); }
  else if (a === "tomap") { $("over").hidden = true; overShown = false; show("map"); }
  dirty = true;
});
function renderTop() {
  yaFetchTop();
  $("topList").innerHTML = yaTop && yaTop.length ? yaTop.map(p => `<div class="rrow ${p.me ? "me" : ""}"><span>${p.rank}</span><span class="nm">${p.name}${p.me ? " (ты)" : ""}</span><b>${p.t}</b></div>`).join("") : `<div class="hint">Рейтинг игроков появится в версии на Яндекс Играх. Твой рекорд: <b>${P.best}</b></div>`;
}
let toastT = 0;
function toast(t) { const el = $("toast"); el.textContent = t; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => el.hidden = true, 2400); }
function adReward(cb) { if (YA.sdk) return yaRewarded(cb); toast("Здесь будет ролик (в версии для Яндекса)"); cb(); }
// фоновые искорки на всех экранах
const bg = $("bg"), bgx = bg.getContext("2d"), SPARK = Array.from({ length: 40 }, (_, i) => ({ x: Math.random(), y: Math.random(), s: 1 + Math.random() * 2.5, v: 0.01 + Math.random() * 0.03, k: i % 7 }));
function drawBg(now) {
  const w = bg.width = innerWidth, h = bg.height = innerHeight;
  for (const s of SPARK) { s.y -= s.v / 60; if (s.y < -0.05) { s.y = 1.05; s.x = Math.random(); } bgx.globalAlpha = 0.25 + 0.25 * Math.sin(now / 500 + s.x * 20); bgx.fillStyle = GEMS[s.k][1]; bgx.fillRect(s.x * w, s.y * h, s.s * 2, s.s * 2); }
}
let lastSec = 0;
function frame(now) {
  const sec = Math.floor(now / 1000); if (sec !== lastSec) { lastSec = sec; if (screen === "menu") dirty = true; }
  if (dirty) { dirty = false;
    if (screen === "menu") renderMenu();
    if (screen === "map") { renderMap(); if (!mapScrolled) { mapScrolled = true; const c = document.querySelector(".node.cur"); if (c) c.scrollIntoView({ block: "center" }); } }
    if (screen === "game") renderGameHud();
  }
  if (screen === "game") {
    if (G.over && !overShown && now - (G.overAt || 0) > (G.won ? 900 : 700)) showOver();
    draw(now);
  }
  drawBg(now);
  requestAnimationFrame(frame);
}
function start() {
  soundOn = load("sound", true);
  P = Object.assign(newProfile(), load("p", {}));
  const s = load("game", null);
  if (s && s.board && s.tray && s.mode) { G = s; G.overAt = 0; G.cr = G.cr || []; } else startClassic();
  if (G.over) G.overAt = 0;
  new ResizeObserver(resize).observe(cv.parentElement);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => dirty = true);
  show("menu");
  requestAnimationFrame(frame);
  yaStart();
}
window.__blocks = { get G() { return G; }, get P() { return P; }, place, startClassic, startLevel, continueGame, SHAPES, levelDef, show };
start();
