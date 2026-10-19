// =====================================================================
//  Поле, заказы, деревня, разговоры
// =====================================================================
const PEOPLE = {
  voevoda: "Воевода", foma: "Фома Лукич", grabov: "Гаврила Грабов", dyak: "Дьяк Ерёма", liho: "Атаман Лихо", kuzma: "Староста Кузьма", narod: "Народ",
  leshiy: "Леший", vodyanoy: "Водяной", yaga: "Баба-Яга", gorynych: "Змей Горыныч", kikimora: "Кикимора",
};
const board = $("board"), bx = board.getContext("2d");
let cell = 50, dpr = 1, drag = null, view = "yard";
function resize() {
  const r = board.parentElement.getBoundingClientRect();
  dpr = window.devicePixelRatio || 1;
  if (!r.height) return; const w = Math.floor(Math.min(r.width, 460, r.height * COLS / ROWS)), h = w * ROWS / COLS;
  board.style.width = w + "px"; board.style.height = h + "px";
  board.width = Math.round(w * dpr); board.height = Math.round(h * dpr);
  cell = board.width / COLS; dirty = true;
}
const SPRITE_URL = {};
function spriteURL(key) { return SPRITE_URL[key] || (SPRITE_URL[key] = sprite(key).toDataURL()); }
// ---- поле
function drawBoard(now) {
  const se = SEASONS[seasonOf()], t = now / 1000;
  bx.setTransform(1, 0, 0, 1, 0, 0); bx.imageSmoothingEnabled = false;
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    const X = x * cell, Y = y * cell;
    bx.fillStyle = (x + y) % 2 ? se.grass[0] : se.grass[1]; bx.fillRect(X, Y, cell + 1, cell + 1);
    bx.fillStyle = "rgba(0,0,0,0.06)"; bx.fillRect(X, Y + cell - 2 * dpr, cell, 2 * dpr);
  }
  // травинки и цветы для живости
  for (let k = 0; k < 40; k++) { const x = hsh(k, 1, 5) * board.width, y = hsh(k, 2, 5) * board.height, s = 2 * dpr; bx.fillStyle = k % 3 === 0 && se.flowers.length ? se.flowers[k % se.flowers.length] : se.tuft; bx.fillRect(Math.round(x), Math.round(y), s, s); }
  const dragging = drag && drag.moved ? drag.from : -1, dItem = dragging >= 0 ? G.board[dragging] : null;
  const hidden = new Set(fx.filter(f => f.kind === "fly" && now - f.t0 < 260).map(f => f.to));
  const ready = new Set(); for (const o of G.orders) { const c = haveItems(o); if (c) c.forEach(i => ready.add(i)); }
  G.board.forEach((it, i) => {
    if (!it || i === dragging || hidden.has(i)) return;
    const x = (i % COLS) * cell, y = Math.floor(i / COLS) * cell;
    if (dItem && !it.gen && it.c === dItem.c && it.l === dItem.l && it.l < maxLvl(it.c)) { bx.fillStyle = `rgba(255,230,120,${0.35 + Math.sin(t * 8) * 0.2})`; roundRect(x + 2 * dpr, y + 2 * dpr, cell - 4 * dpr, cell - 4 * dpr, 8 * dpr); bx.fill(); }
    if (it.gen) { bx.fillStyle = "rgba(90,60,30,0.45)"; roundRect(x + 3 * dpr, y + 3 * dpr, cell - 6 * dpr, cell - 6 * dpr, 10 * dpr); bx.fill(); bx.strokeStyle = "#f2c879"; bx.lineWidth = 2 * dpr; bx.stroke(); }
    if (ready.has(i)) { bx.fillStyle = "rgba(111,220,111,0.35)"; roundRect(x + 3 * dpr, y + 3 * dpr, cell - 6 * dpr, cell - 6 * dpr, 10 * dpr); bx.fill(); }
    let sc = 1; const pop = fx.find(f => f.kind === "pop" && f.at === i && !f.gone && now - f.t0 < 280); if (pop) sc = 1 + 0.4 * Math.sin((now - pop.t0) / 280 * Math.PI);
    drawItem(it, x + cell / 2, y + cell / 2, cell * 0.86 * sc);
    if (it.gen) { bx.font = `700 ${Math.round(11 * dpr)}px 'PT Sans', sans-serif`; bx.fillStyle = "#fff2b0"; bx.textAlign = "right"; bx.fillText("⚡", x + cell - 5 * dpr, y + 13 * dpr); }
    else if (it.l > 1) { bx.font = `700 ${Math.round(10 * dpr)}px 'PT Sans', sans-serif`; bx.textAlign = "right"; bx.fillStyle = "rgba(42,30,22,0.8)"; bx.fillRect(x + cell - 15 * dpr, y + cell - 14 * dpr, 12 * dpr, 11 * dpr); bx.fillStyle = "#fff"; bx.fillText(it.l, x + cell - 5 * dpr, y + cell - 5 * dpr); }
    if (i === G.sel) { bx.strokeStyle = `rgba(255,217,77,${0.7 + Math.sin(t * 6) * 0.3})`; bx.lineWidth = 3 * dpr; roundRect(x + 2 * dpr, y + 2 * dpr, cell - 4 * dpr, cell - 4 * dpr, 8 * dpr); bx.stroke(); }
  });
  // эффекты: полёт из источника, искры при соединении
  fx = fx.filter(f => now - f.t0 < 450);
  for (const f of fx) {
    const k = Math.min(1, (now - f.t0) / 260);
    if (f.kind === "fly" && k < 1) { const a = f.from, b = f.to, ax = (a % COLS + 0.5) * cell, ay = (Math.floor(a / COLS) + 0.5) * cell, cx = (b % COLS + 0.5) * cell, cy = (Math.floor(b / COLS) + 0.5) * cell; drawItem({ c: f.key.replace(/\d/g, ""), l: +f.key.replace(/\D/g, "") }, ax + (cx - ax) * k, ay + (cy - ay) * k - Math.sin(k * Math.PI) * cell * 0.6, cell * 0.8); }
    if (f.kind === "pop") { const q = (now - f.t0) / 450, x = (f.at % COLS + 0.5) * cell, y = (Math.floor(f.at / COLS) + 0.5) * cell; bx.fillStyle = `rgba(255,240,150,${1 - q})`; for (let r = 0; r < 8; r++) { const a = r / 8 * Math.PI * 2, d = cell * (0.3 + q * 0.5); bx.fillRect(x + Math.cos(a) * d - 2 * dpr, y + Math.sin(a) * d - 2 * dpr, 4 * dpr, 4 * dpr); } }
  }
  if (dItem) drawItem(dItem, drag.x, drag.y - cell * 0.2, cell * 1.05);
}
function roundRect(x, y, w, h, r) { bx.beginPath(); bx.roundRect(x, y, w, h, r); }
function drawItem(it, cx, cy, size) { const s = sprite(keyOf(it)); bx.drawImage(s, Math.round(cx - size / 2), Math.round(cy - size / 2), Math.round(size), Math.round(size)); }
function cellAt(e) { const r = board.getBoundingClientRect(), x = (e.clientX - r.left) * dpr, y = (e.clientY - r.top) * dpr; const cx = Math.floor(x / cell), cy = Math.floor(y / cell); return cx >= 0 && cy >= 0 && cx < COLS && cy < ROWS ? idx(cx, cy) : -1; }
board.addEventListener("pointerdown", e => {
  const i = cellAt(e); if (i < 0) return;
  const r = board.getBoundingClientRect();
  drag = { from: i, sx: e.clientX, sy: e.clientY, x: (e.clientX - r.left) * dpr, y: (e.clientY - r.top) * dpr, moved: false, id: e.pointerId };
  board.setPointerCapture(e.pointerId);
});
board.addEventListener("pointermove", e => {
  if (!drag || drag.id !== e.pointerId) return;
  const r = board.getBoundingClientRect(); drag.x = (e.clientX - r.left) * dpr; drag.y = (e.clientY - r.top) * dpr;
  if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 6 && G.board[drag.from] && !G.board[drag.from].gen) drag.moved = true;
});
board.addEventListener("pointerup", e => {
  if (!drag) return; const d = drag; drag = null;
  const to = cellAt(e);
  if (d.moved) { if (to >= 0) dropOn(d.from, to); dirty = true; return; }
  const it = G.board[d.from];
  if (it && it.gen) { G.sel = d.from; spawn(d.from); }
  else { G.sel = it ? d.from : null; sfx(FX.click); }
  dirty = true;
});
// ---- панели
function renderTop() {
  tickEnergy();
  const left = G.energy >= G.emax ? "" : (() => { const s = Math.max(0, ENERGY_REGEN - Math.floor((Date.now() - G.eTime) / 1000)); return ` · +1 через 0:${String(s).padStart(2, "0")}`; })();
  $("energy").innerHTML = `<b>⚡ ${G.energy}</b>/${G.emax}<span class="tiny">${left}</span>`;
  $("coins").innerHTML = `${ic("money", "gold")}<b>${G.coins}</b>`;
  $("stars").innerHTML = `<span class="star">★</span><b>${G.stars}</b>`;
}
function renderOrders() {
  $("orders").innerHTML = G.orders.map(o => {
    const ok = !!haveItems(o);
    return `<div class="order ${ok ? "ok" : ""}"><canvas class="oava" data-ava="${o.who}" width="100" height="120"></canvas><div class="obody"><div class="osay">${o.say}</div><div class="oitems">${o.items.map(it => `<img alt="${CHAINS[it.c].items[it.l - 1]}" title="${CHAINS[it.c].items[it.l - 1]}" src="${spriteURL(it.c + it.l)}">`).join("")}</div><div class="orew">+${o.coins} ${ic("money", "gold")} +${o.stars}<span class="star">★</span></div></div><button data-give="${o.id}" ${ok ? "" : "disabled"}>Отдать</button></div>`;
  }).join("");
  document.querySelectorAll("#orders canvas[data-ava]").forEach(cv => drawAvatar(cv, cv.dataset.ava));
}
function renderInfo() {
  const it = G.sel !== null ? G.board[G.sel] : null;
  if (!it) { $("info").innerHTML = `<span class="hint">Нажми на предмет, чтобы узнать, во что он превратится.</span><span class="grow"></span><button data-act="energy">+⚡</button>`; return; }
  if (it.gen) { $("info").innerHTML = `<img src="${spriteURL(it.gen)}" alt=""><span><b>${GENS[it.gen].name}</b> · ${GENS[it.gen].desc}, 1 ⚡</span><span class="grow"></span><button data-act="energy">+⚡</button>`; return; }
  const nm = CHAINS[it.c].items, next = nm[it.l];
  $("info").innerHTML = `<img src="${spriteURL(keyOf(it))}" alt=""><span><b>${nm[it.l - 1]}</b>${next ? ` · два таких → <b>${next}</b>` : " · высший уровень"}</span><span class="grow"></span><button data-act="sell">Продать за ${2 ** (it.l - 1)}</button>`;
}
function tutText() {
  if (G.tut === 0) return "Нажми на поле внизу — вырастет колосок. Каждое нажатие тратит одну ⚡.";
  if (G.tut === 1) return "Перетащи колосок на такой же колосок — получится сноп. Одинаковые подсвечиваются.";
  if (G.tut === 2) return "Нашёлся предмет из заказа? Он подсвечен зелёным — жми «Отдать» наверху.";
  if (G.tut === 3 && G.task === 0) return "За заказы дают звёзды. Трать их во вкладке «Деревня» — отстраивай подворье.";
  return "";
}
// ---- деревня
const vcv = $("village"), vg = vcv.getContext("2d");
function drawVillage() {
  const W = 234, H = 150, si = seasonOf(), se = SEASONS[si], snow = si === 3;
  vcv.width = W; vcv.height = H; vg.imageSmoothingEnabled = false;
  const im = vg.createImageData(W, H), d = im.data;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const n = vnoise(x, y, 8, 7) + (hsh(x, y, 2) - 0.5) * 0.2, c = rgbOf(se.grass[n < 0.38 ? 2 : n < 0.62 ? 1 : 0]), i = (y * W + x) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255; }
  vg.putImageData(im, 0, 0);
  for (let x = -2; x < W; x += 7) cityTree(vg, x + hsh(x, 1, 7) * 3, 12 + hsh(x, 2, 7) * 4, si, true);
  cobble(vg, 0, 96, W, 10, snow, 3); cobble(vg, 108, 60, 10, 36, snow, 4);
  const st = { lights: [], chimneys: [] }, done = k => G.task > k;
  const ruin = (x, y) => { crect(vg, x, y - 4, 14, 4, "#8a7a68"); crect(vg, x + 3, y - 7, 6, 3, "#a89884"); crect(vg, x + 2, y - 2, 10, 1, "#6a4424"); crect(vg, x + 8, y - 9, 1, 6, "#6a4424"); vg.fillStyle = "#ffd94d"; vg.font = "700 8px PT Sans, sans-serif"; vg.fillText("?", x + 5, y - 10); };
  if (!done(0)) for (let k = 0; k < 40; k++) { const x = hsh(k, 3, 9) * W, y = 60 + hsh(k, 4, 9) * 80; crect(vg, x, y, 2, 4, "#5a6a2a"); crect(vg, x + 1, y - 2, 1, 2, "#7a8a3a"); }
  // 1 колодец
  if (done(1)) { crect(vg, 120, 110, 10, 7, "#8f8576"); crect(vg, 121, 110, 8, 2, "#2a3a4a"); crect(vg, 119, 102, 1, 8, "#6a4424"); crect(vg, 130, 102, 1, 8, "#6a4424"); crect(vg, 117, 100, 16, 2, snow ? "#ffffff" : "#8a3a2a"); } else ruin(118, 116);
  // 2 изба Фомы, 6 изба старосты
  if (done(2)) cityHouse(vg, st, 20, 92, 24, 14, 10, "#ecdcb8", "#c8483a", true, si, 1); else ruin(26, 92);
  if (done(6)) cityHouse(vg, st, 150, 92, 30, 16, 11, "#e0c89c", "#5a6a8a", true, si, 4); else ruin(158, 92);
  // 3 баня с паром
  if (done(3)) { cityHouse(vg, st, 60, 140, 18, 10, 7, "#9a6a3a", "#5a3a22", false, si, 2); for (let k = 0; k < 3; k++) crect(vg, 72 + k * 2, 112 - k * 4, 2, 2, "rgba(230,230,230,0.7)"); } else ruin(62, 140);
  // 4 мельница
  if (done(4)) { for (let r = 0; r < 20; r++) { const half = 3 + r * 0.15; for (let q = -half; q <= half; q++) cput(vg, 205 + q, 120 + r, Math.abs(q) >= half - 0.5 ? C_OUT : "#f2ead6"); } crect(vg, 201, 116, 9, 4, snow ? "#fff" : "#a83e30"); vg.strokeStyle = "#5a3418"; vg.lineWidth = 1; for (let k = 0; k < 4; k++) { const a = performance.now() / 900 + k * Math.PI / 2; vg.beginPath(); vg.moveTo(205, 122); vg.lineTo(205 + Math.cos(a) * 12, 122 + Math.sin(a) * 12); vg.stroke(); } } else ruin(200, 140);
  // 5 кузница
  if (done(5)) { cityHouse(vg, st, 94, 140, 22, 12, 8, "#b8b0a2", "#4a4a52", false, si, 3); crect(vg, 118, 132, 4, 3, "#3a3a44"); } else ruin(98, 140);
  // 7 церковь
  if (done(7)) { const x = 50, by = 60; crect(vg, x, by - 18, 20, 18, "#f4eee2"); crect(vg, x + 16, by - 18, 4, 18, "#d6ccb8"); crect(vg, x + 7, by - 8, 6, 8, "#7a4a24"); crect(vg, x + 5, by - 28, 10, 10, "#f4eee2"); fromRows((a, b, col) => cput(vg, a, b, col), ["..OOOO..", ".OLLMMO.", "OLLMMMDO", "OLMMMMDO", ".OOOOOO."], { O: C_OUT, L: "#f8d860", M: "#e0b040", D: "#a87a20" }, x + 6, by - 33); crect(vg, x + 9, by - 38, 2, 5, "#e0b040"); crect(vg, x + 7, by - 36, 6, 1, "#e0b040"); } else ruin(54, 60);
  vg.fillStyle = `rgba(20,28,72,0)`;
}
function renderVillage() {
  drawVillage();
  const t = TASKS[G.task];
  $("task").innerHTML = t ? `<div class="tcard"><div><b>${t.name}</b><div class="hint">Стройка ${G.task + 1} из ${TASKS.length}</div></div><button data-act="build" ${G.stars >= t.stars ? "" : "disabled"}>Построить · ${t.stars}<span class="star">★</span></button></div>${G.stars < t.stars ? `<div class="hint">Не хватает ${t.stars - G.stars} ★ — выполняй заказы на дворе.</div>` : ""}` : `<div class="tcard"><b>Деревня отстроена! Скоро новые земли.</b></div>`;
  $("tdone").innerHTML = TASKS.slice(0, G.task).map(x => `<li>${x.name}</li>`).join("");
}
// ---- разговор
function showSay(who, text) {
  $("sayName").textContent = PEOPLE[who] || who; $("sayText").textContent = text; drawAvatar($("sayAva"), who);
  $("say").hidden = false; sfx(FX[CREATURE_FX[who]] || FX.click);
}
// ---- общие нажатия
document.addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  if (b.dataset.give) deliver(+b.dataset.give);
  else if (b.dataset.act === "sell") sellSel();
  else if (b.dataset.act === "build") buildTask();
  else if (b.dataset.act === "energy") $("emenu").hidden = !$("emenu").hidden;
  else if (b.dataset.act === "ad") { $("emenu").hidden = true; adEnergy(); }
  else if (b.dataset.act === "buy") { $("emenu").hidden = true; buyEnergy(); }
  else if (b.dataset.act === "sayok") $("say").hidden = true;
  else if (b.dataset.tab) { view = b.dataset.tab; sfx(FX.click); }
  else if (b.id === "sound") { soundOn = !soundOn; save("sound", soundOn); if (soundOn) { audio(); startMusic(); } }
  else if (b.id === "music") { musicOn = !musicOn; save("music", musicOn); if (musicOn) { audio(); startMusic(); } }
  else if (b.id === "restart") { if (b.dataset.sure) { newGame(); b.dataset.sure = ""; b.textContent = "Начать заново"; } else { b.dataset.sure = 1; b.textContent = "Точно? Нажми ещё раз"; } }
  else return;
  dirty = true;
});
let lastSec = 0;
function frame(now) {
  const sec = Math.floor(now / 1000);
  if (sec !== lastSec) { lastSec = sec; renderTop(); if (view === "village" && G.task > 4) drawVillage(); }
  if (dirty) {
    dirty = false; renderTop();
    document.querySelectorAll(".view").forEach(v => v.hidden = v.dataset.view !== view);
    document.querySelectorAll(".tabs button").forEach(b => b.classList.toggle("on", b.dataset.tab === view));
    if (view === "yard") { renderOrders(); renderInfo(); const tt = tutText(); $("tut").textContent = tt; $("tut").hidden = !tt; }
    if (view === "village") renderVillage();
    $("sound").textContent = soundOn ? "Звук вкл" : "Звук выкл"; $("music").textContent = musicOn ? "Музыка вкл" : "Музыка выкл";
    const t = TASKS[G.task]; $("vbadge").hidden = !(t && G.stars >= t.stars);
  }
  if (view === "yard") drawBoard(now);
  requestAnimationFrame(frame);
}
function start() {
  soundOn = load("sound", true); musicOn = load("music", true);
  const s = load("game", null);
  if (s && s.board && s.board.length === COLS * ROWS) { G = s; G.sel = null; tickEnergy(); } else newGame();
  window.addEventListener("resize", resize); new ResizeObserver(resize).observe(board.parentElement);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => dirty = true);
  requestAnimationFrame(frame);
}
window.__podv = { get G() { return G; }, spawn, dropOn, deliver, buildTask, newGame, set view(v) { view = v; dirty = true; } };
start();
