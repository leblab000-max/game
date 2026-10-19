// =====================================================================
//  МАСТЕРСКАЯ — соединяй одинаковые вещи, за каждое соединение монеты
// =====================================================================
const WC = 6, WR = 6, WS_EMAX = 40, WS_REGEN = 30;   // клетки, запас энергии, секунд на единицу
const WCHAINS = {
  weapon: { gen: "forge", items: ["Ржавый гвоздь", "Нож", "Кинжал", "Меч", "Боевой топор", "Рунный клинок", "Легендарный меч"] },
  potion: { gen: "alchemy", items: ["Капля росы", "Пузырёк", "Зелье здоровья", "Большое зелье", "Эликсир силы", "Философский камень"] },
};
const WGENS = { forge: { name: "Кузница", chain: "weapon" }, alchemy: { name: "Котёл алхимика", chain: "potion" } };
const wMax = c => WCHAINS[c].items.length;
const mergeCoins = l => Math.round(2 * 1.6 ** (l - 2));      // за соединение в предмет уровня l
const sellPrice = l => Math.round(2 ** (l - 1) * 1.2);
const wName = it => it.gen ? WGENS[it.gen].name : WCHAINS[it.c].items[it.l - 1];
// ---- рисунки вещей 16×16
const WPAINT = {
  weapon(R, D, l) {
    const blade = ["#8a8a92", "#c8ccd8", "#d8dce8", "#eef2f8", "#d8dce8", "#8ae8ff", "#ffe060"][l - 1];
    if (l === 1) { D(3, 13, 9, "#a8a8b4"); D(4, 13, 8, "#7a7a86"); R(11, 3, 1, 1, "#6a6a76"); R(12, 3, 1, 2, "#8a8a96"); R(13, 4, 1, 2, "#6a6a76"); R(12, 5, 1, 1, "#6a6a76"); R(2, 14, 1, 1, "#5a5a66"); return; }
    if (l === 5) { D(3, 13, 10, "#8a5a2a"); R(9, 2, 5, 6, blade); R(13, 3, 1, 4, "#a8b0c0"); R(9, 2, 5, 1, "#ffffff"); return; }
    const hl = l === 2 ? 3 : 4, bl = [0, 0, 5, 7, 10, 0, 11, 11][l];
    D(2, 14, hl, l >= 6 ? "#3a2a6a" : "#8a5a2a");
    if (l >= 3) { R(4, 9, 4, 1, l >= 4 ? "#f2c740" : "#8a8a92"); R(6, 11, 1, 1, l >= 4 ? "#f2c740" : "#8a8a92"); R(7, 8, 1, 4, l >= 4 ? "#f2c740" : "#8a8a92"); }
    D(2 + hl, 14 - hl, bl, blade); D(3 + hl, 14 - hl, bl - 1, blade);
    if (l >= 6) { for (let k = 2; k < bl; k += 3) R(3 + hl + k, 13 - hl - k, 1, 1, l === 7 ? "#ff4a6a" : "#ffffff"); }
    if (l === 7) { R(6, 9, 2, 2, "#ff4a6a"); }
  },
  potion(R, D, l) {
    if (l === 1) { R(7, 6, 2, 2, "#8ad0ff"); R(6, 8, 4, 3, "#5ab0f0"); R(7, 11, 2, 1, "#5ab0f0"); R(7, 8, 1, 1, "#ffffff"); return; }
    if (l === 6) { R(5, 4, 6, 8, "#e0303a"); R(4, 6, 8, 4, "#e0303a"); R(6, 5, 2, 2, "#ff9aa0"); R(9, 9, 2, 2, "#a01a24"); R(7, 2, 2, 1, "#fff6a0"); R(12, 4, 1, 1, "#fff6a0"); R(3, 11, 1, 1, "#fff6a0"); return; }
    const liquid = ["", "#5ab0f0", "#e04a4a", "#e04a4a", "#9a4ae0", "#ffd02a"][l - 1], w = [0, 4, 6, 8, 10, 10][l - 1], h = [0, 5, 6, 8, 9, 10][l - 1];
    const x0 = 8 - w / 2, y0 = 14 - h;
    R(7, y0 - 3, 2, 3, "#d8eef8"); R(6, y0 - 4, 4, 1, "#a86a2a");
    R(x0, y0, w, h, "#d8eef8"); R(x0 + 1, y0 + Math.ceil(h * 0.35), w - 2, h - Math.ceil(h * 0.35) - 1, liquid); R(x0 + 1, y0 + 1, 1, 2, "#ffffff");
    if (l >= 5) { R(x0 - 1, y0 + 2, 1, 1, "#fff6a0"); R(x0 + w, y0 + 1, 1, 1, "#fff6a0"); }
  },
  forge(R) { R(2, 9, 12, 3, "#5a5a66"); R(4, 12, 8, 2, "#3a3a44"); R(3, 14, 10, 1, "#3a3a44"); R(1, 9, 3, 2, "#5a5a66"); R(2, 8, 12, 1, "#8a8a96"); R(7, 2, 1, 6, "#8a5a2a"); R(5, 1, 5, 3, "#a8b0c0"); R(11, 6, 2, 2, "#ff9a2a"); R(13, 5, 1, 1, "#ffd02a"); },
  alchemy(R) { R(3, 7, 10, 7, "#3a3a44"); R(2, 6, 12, 2, "#5a5a66"); R(4, 6, 8, 1, "#6ad85a"); R(5, 4, 2, 2, "#8aff7a"); R(9, 2, 2, 2, "#8aff7a"); R(7, 1, 1, 1, "#c8ffc0"); R(4, 14, 2, 1, "#e05a2a"); R(10, 14, 2, 1, "#e05a2a"); R(6, 15, 4, 1, "#ff9a2a"); },
};
const WSPR = {};
function wSprite(key) {
  if (WSPR[key]) return WSPR[key];
  const N = 18, grid = Array.from({ length: N }, () => new Array(N).fill(null));
  const R = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const X = x + i + 1, Y = y + j + 1; if (X >= 0 && Y >= 0 && X < N && Y < N) grid[Y][X] = c; } };
  const D = (x, y, len, c) => { for (let k = 0; k < len; k++) R(x + k, y - k, 1, 1, c); };
  const m = key.match(/^([a-z]+)(\d*)$/);
  WPAINT[m[1]](R, D, +m[2]);
  const cv = document.createElement("canvas"); cv.width = N; cv.height = N; const g = cv.getContext("2d");
  const on = (x, y) => y >= 0 && y < N && x >= 0 && x < N && grid[y][x];
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (grid[y][x]) { g.fillStyle = grid[y][x]; g.fillRect(x, y, 1, 1); }
    else if (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1)) { g.fillStyle = OUTL; g.fillRect(x, y, 1, 1); }
  }
  return (WSPR[key] = cv);
}
const wKey = it => it.gen || it.c + it.l;
const WURL = {}; const wURL = k => WURL[k] || (WURL[k] = wSprite(k).toDataURL());
// ---- состояние
function wsNew() {
  const b = new Array(WC * WR).fill(null);
  b[WC * (WR - 1) + 1] = { gen: "forge" }; b[WC * (WR - 1) + 4] = { gen: "alchemy" };
  return { board: b, energy: WS_EMAX, emax: WS_EMAX, eTime: Date.now(), merges: 0, sel: null, tut: 0, orders: [], done: 0 };
}
function wsTick() {
  const W = G.ws, now = Date.now();
  if (W.energy >= W.emax) { W.eTime = now; return; }
  const k = Math.floor((now - W.eTime) / (WS_REGEN * 1000));
  if (k > 0) { W.energy = Math.min(W.emax, W.energy + k); W.eTime += k * WS_REGEN * 1000; saveGame(); }
}
let wfx = [];
function wsSpawn(gi) {
  const W = G.ws, gen = W.board[gi];
  if (W.energy <= 0) { toast("Энергия кончилась — подожди или посмотри ролик"); sfx(SND.lose); return; }
  const gx = gi % WC, gy = Math.floor(gi / WC); let best = -1, bd = 1e9;
  W.board.forEach((v, i) => { if (v) return; const d = Math.hypot(i % WC - gx, Math.floor(i / WC) - gy); if (d < bd) { bd = d; best = i; } });
  if (best < 0) { toast("Нет места — соедини или продай что-нибудь"); sfx(SND.lose); return; }
  if (W.energy === W.emax) W.eTime = Date.now();
  W.energy--;
  const c = WGENS[gen.gen].chain, l = Math.random() < 0.08 ? 2 : 1;
  W.board[best] = { c, l }; wfx.push({ kind: "fly", from: gi, to: best, t0: performance.now(), key: c + l });
  sfx(SND.click); if (W.tut === 0) W.tut = 1; saveGame(); dirty = true;
}
function wsDrop(from, to) {
  const W = G.ws, a = W.board[from], b = W.board[to];
  if (from === to || !a || a.gen) return;
  if (b && !b.gen && b.c === a.c && b.l === a.l && a.l < wMax(a.c)) {
    const nl = a.l + 1, coins = mergeCoins(nl);
    W.board[from] = null; W.board[to] = { c: a.c, l: nl }; W.sel = to; W.merges++;
    G.gold += coins; questAdd("merges");
    wfx.push({ kind: "pop", at: to, t0: performance.now() }, { kind: "coin", at: to, t0: performance.now(), text: "+" + coins });
    sfx(nl === wMax(a.c) ? SND.win : SND.coin); if (W.tut <= 1) W.tut = 2;
  } else if (!b) { W.board[to] = a; W.board[from] = null; W.sel = to; }
  else if (!b.gen) { W.board[to] = a; W.board[from] = b; W.sel = to; }
  saveGame(); dirty = true;
}
function wsSell() {
  const W = G.ws, it = W.board[W.sel]; if (!it || it.gen) return;
  const p = sellPrice(it.l); G.gold += p; W.board[W.sel] = null;
  wfx.push({ kind: "coin", at: W.sel, t0: performance.now(), text: "+" + p }); W.sel = null;
  sfx(SND.coin); saveGame(); dirty = true;
}
// ---- поле
const wcv = $("wboard"), wg = wcv.getContext("2d");
let wcell = 50, wdpr = 1, wdrag = null;
function wsResize() {
  const r = wcv.parentElement.getBoundingClientRect(); if (!r.height) return;
  wdpr = window.devicePixelRatio || 1;
  const w = Math.floor(Math.min(r.width, 444, r.height));
  wcv.style.width = w + "px"; wcv.style.height = w + "px"; wcv.width = Math.round(w * wdpr); wcv.height = Math.round(w * wdpr); wcell = wcv.width / WC;
}
function wsDraw(now) {
  const W = G.ws, g = wg, c = wcell, t = now / 1000, s = wdpr;
  g.setTransform(1, 0, 0, 1, 0, 0); g.imageSmoothingEnabled = false;
  for (let y = 0; y < WR; y++) for (let x = 0; x < WC; x++) { g.fillStyle = (x + y) % 2 ? "#d8b888" : "#e4c89a"; g.fillRect(x * c, y * c, c + 1, c + 1); g.fillStyle = "rgba(120,80,40,0.12)"; g.fillRect(x * c, y * c + c - 2 * s, c, 2 * s); }
  const dragging = wdrag && wdrag.moved ? wdrag.from : -1, dIt = dragging >= 0 ? W.board[dragging] : null;
  const hidden = new Set(wfx.filter(f => f.kind === "fly" && now - f.t0 < 240).map(f => f.to));
  const rr = (x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
  W.board.forEach((it, i) => {
    if (!it || i === dragging || hidden.has(i)) return;
    const x = (i % WC) * c, y = Math.floor(i / WC) * c;
    if (dIt && !it.gen && it.c === dIt.c && it.l === dIt.l && it.l < wMax(it.c)) { g.fillStyle = `rgba(255,220,80,${0.4 + Math.sin(t * 8) * 0.2})`; rr(x + 2 * s, y + 2 * s, c - 4 * s, c - 4 * s, 10 * s); g.fill(); }
    if (it.gen) { g.fillStyle = "rgba(255,255,255,0.55)"; rr(x + 3 * s, y + 3 * s, c - 6 * s, c - 6 * s, 12 * s); g.fill(); g.strokeStyle = "#ff9a2a"; g.lineWidth = 3 * s; g.stroke(); }
    let sc = 1; const pop = wfx.find(f => f.kind === "pop" && f.at === i && now - f.t0 < 280); if (pop) sc = 1 + 0.35 * Math.sin((now - pop.t0) / 280 * Math.PI);
    const z = c * 0.84 * sc; g.drawImage(wSprite(wKey(it)), Math.round(x + c / 2 - z / 2), Math.round(y + c / 2 - z / 2), Math.round(z), Math.round(z));
    if (it.gen) { g.font = `800 ${12 * s}px Rubik, sans-serif`; g.textAlign = "right"; g.fillStyle = "#ff9a2a"; g.fillText("⚡", x + c - 6 * s, y + 16 * s); }
    else { g.font = `800 ${11 * s}px Rubik, sans-serif`; g.textAlign = "center"; g.fillStyle = "#24304a"; rr(x + c - 17 * s, y + c - 17 * s, 14 * s, 14 * s, 4 * s); g.fill(); g.fillStyle = "#fff"; g.fillText(it.l, x + c - 10 * s, y + c - 6 * s); }
    if (i === W.sel) { g.strokeStyle = `rgba(74,138,224,${0.7 + Math.sin(t * 6) * 0.3})`; g.lineWidth = 3 * s; rr(x + 2 * s, y + 2 * s, c - 4 * s, c - 4 * s, 10 * s); g.stroke(); }
  });
  wfx = wfx.filter(f => now - f.t0 < 900);
  for (const f of wfx) {
    const k = Math.min(1, (now - f.t0) / 240);
    if (f.kind === "fly" && k < 1) { const ax = (f.from % WC + 0.5) * c, ay = (Math.floor(f.from / WC) + 0.5) * c, bx = (f.to % WC + 0.5) * c, by = (Math.floor(f.to / WC) + 0.5) * c, z = c * 0.8; g.drawImage(wSprite(f.key), ax + (bx - ax) * k - z / 2, ay + (by - ay) * k - Math.sin(k * Math.PI) * c * 0.6 - z / 2, z, z); }
    if (f.kind === "coin") { const q = (now - f.t0) / 900, x = (f.at % WC + 0.5) * c, y = (Math.floor(f.at / WC) + 0.3) * c - q * c * 0.7; g.globalAlpha = 1 - q * q; g.font = `800 ${16 * s}px Rubik, sans-serif`; g.textAlign = "center"; g.lineWidth = 4 * s; g.strokeStyle = "#24304a"; g.strokeText(f.text + " 🪙", x, y); g.fillStyle = "#ffd02a"; g.fillText(f.text + " 🪙", x, y); g.globalAlpha = 1; }
  }
  // подсказка-рука: куда нажать и что куда тащить
  if (!dIt && W.tut < 2) {
    const hand = (x, y) => { g.font = `${30 * s}px sans-serif`; g.textAlign = "center"; g.fillText("👆", x, y); };
    if (W.tut === 0) {
      const gi = W.board.findIndex(v => v && v.gen === "forge"), x = (gi % WC + 0.5) * c, y = (Math.floor(gi / WC) + 0.5) * c, p = (t * 1.5) % 1;
      g.strokeStyle = `rgba(255,154,42,${1 - p})`; g.lineWidth = 4 * s; g.beginPath(); g.arc(x, y, c * (0.45 + p * 0.3), 0, Math.PI * 2); g.stroke();
      hand(x + c * 0.15, y + c * 0.55 + Math.abs(Math.sin(t * 4)) * -8 * s);
    } else {
      const items = W.board.map((v, i) => v && !v.gen ? i : -1).filter(i => i >= 0);
      let a = -1, b = -1;
      for (const i of items) { const j = items.find(k => k !== i && W.board[k].c === W.board[i].c && W.board[k].l === W.board[i].l && W.board[i].l < wMax(W.board[i].c)); if (j !== undefined) { a = i; b = j; break; } }
      if (a >= 0) {
        const p = (t * 0.7) % 1, k = Math.min(1, p / 0.7), ax = (a % WC + 0.5) * c, ay = (Math.floor(a / WC) + 0.5) * c, bx = (b % WC + 0.5) * c, by = (Math.floor(b / WC) + 0.5) * c;
        const x = ax + (bx - ax) * k, y = ay + (by - ay) * k, z = c * 0.8;
        g.globalAlpha = 0.55; g.drawImage(wSprite(wKey(W.board[a])), x - z / 2, y - z / 2, z, z); g.globalAlpha = 1;
        hand(x + c * 0.15, y + c * 0.55);
      }
    }
  }
  if (dIt) { const z = c * 1.05; g.drawImage(wSprite(wKey(dIt)), wdrag.x - z / 2, wdrag.y - z * 0.7, z, z); }
}
const wCellAt = e => { const r = wcv.getBoundingClientRect(), x = Math.floor((e.clientX - r.left) * wdpr / wcell), y = Math.floor((e.clientY - r.top) * wdpr / wcell); return x >= 0 && y >= 0 && x < WC && y < WR ? y * WC + x : -1; };
wcv.addEventListener("pointerdown", e => { const i = wCellAt(e); if (i < 0) return; const r = wcv.getBoundingClientRect(); wdrag = { from: i, sx: e.clientX, sy: e.clientY, x: (e.clientX - r.left) * wdpr, y: (e.clientY - r.top) * wdpr, moved: false, id: e.pointerId }; wcv.setPointerCapture(e.pointerId); });
wcv.addEventListener("pointermove", e => { if (!wdrag || wdrag.id !== e.pointerId) return; const r = wcv.getBoundingClientRect(); wdrag.x = (e.clientX - r.left) * wdpr; wdrag.y = (e.clientY - r.top) * wdpr; const it = G.ws.board[wdrag.from]; if (!wdrag.moved && it && !it.gen && Math.hypot(e.clientX - wdrag.sx, e.clientY - wdrag.sy) > 6) wdrag.moved = true; });
wcv.addEventListener("pointerup", e => {
  if (!wdrag) return; const d = wdrag; wdrag = null; const to = wCellAt(e), W = G.ws;
  if (d.moved) { if (to >= 0) wsDrop(d.from, to); dirty = true; return; }
  const it = W.board[d.from];
  if (it && it.gen) { W.sel = d.from; wsSpawn(d.from); } else { W.sel = it ? d.from : null; sfx(SND.click); }
  dirty = true;
});
function renderWs() {
  const W = G.ws; wsTick();
  const left = W.energy >= W.emax ? "" : ` · +1 через ${Math.max(0, WS_REGEN - Math.floor((Date.now() - W.eTime) / 1000))} с`;
  $("wen").innerHTML = `<b>⚡ ${W.energy}</b>/${W.emax}<small>${left}</small>`;
  const it = W.sel !== null ? W.board[W.sel] : null;
  if (!it) $("winfo").innerHTML = `<span class="hint">Соединяй одинаковые вещи — за каждое соединение монеты. Монеты — на прокачку героев.</span>`;
  else if (it.gen) $("winfo").innerHTML = `<img class="pix" src="${wURL(it.gen)}" alt=""><span><b>${WGENS[it.gen].name}</b><br><small>Нажми — появится вещь, 1 ⚡</small></span>`;
  else { const nm = WCHAINS[it.c].items, nx = nm[it.l]; $("winfo").innerHTML = `<img class="pix" src="${wURL(wKey(it))}" alt=""><span><b>${nm[it.l - 1]}</b> <small>${it.c === "weapon" ? `+${Math.round(it.l * 6)}% атаки` : `+${Math.round(it.l * 7)}% здоровья`}</small><br><small>${nx ? `два таких → ${nx}, +${mergeCoins(it.l + 1)} 🪙` : "высший уровень"}</small></span><span class="wbtns"><button class="btn green" data-act="wequip">Надеть</button><button class="btn" data-act="wsell">Продать ${sellPrice(it.l)} 🪙</button></span>`; }
  wsFillOrders();
  $("worders").innerHTML = W.orders.map((o, k) => { const ok = wsHave(o) >= 0; return `<button class="word ${ok ? "ok" : ""}" data-worder="${k}" style="--r:${RAR[HEROES[o.hero].rar].col}">${heroImg(o.hero, "wh")}<span class="wwant">${wurl(o)}<small>${WCHAINS[o.c].items[o.l - 1]}</small></span><span class="wrew">+${o.coins} 🪙<br>+${o.cards} 🃏</span></button>`; }).join("");
  const pairs = W.board.some((v, i) => v && !v.gen && W.board.some((u, j) => j !== i && u && !u.gen && u.c === v.c && u.l === v.l));
  const tt = W.tut === 0 ? "Нажми на кузницу (там, где рука) — появится гвоздь." : W.tut === 1 ? (pairs ? "Видишь два одинаковых? Потяни пальцем один на другой — как показывает рука." : "Нажми на кузницу ещё раз — нужно два одинаковых гвоздя.") : "";
  if (!W.intro) { W.intro = 1; saveGame(); showWsIntro(); }
  $("wtut").textContent = tt; $("wtut").hidden = !tt;
}
// ---- заказы героев
const wurl = o => `<img class="pix" src="${wURL(o.c + o.l)}" alt="">`;
function wsOrder() {
  const W = G.ws, c = Math.random() < 0.5 ? "weapon" : "potion", top = Math.min(wMax(c), 3 + Math.floor(W.done / 4));
  const l = Math.max(2, Math.min(top, 2 + Math.floor(Math.random() * (top - 1))));
  const pool = HERO_IDS.filter(id => G.heroes[id].have || Math.random() < 0.25), hero = pick(pool.length ? pool : HERO_IDS);
  return { hero, c, l, coins: mergeCoins(l) * 3 + 5, cards: 1 + Math.floor(l / 2) };
}
function wsFillOrders() { const W = G.ws; if (!W.orders) W.orders = []; while (W.orders.length < 3) W.orders.push(wsOrder()); }
const wsHave = o => G.ws.board.findIndex(v => v && !v.gen && v.c === o.c && v.l === o.l);
function wsDeliver(k) {
  const W = G.ws, o = W.orders[k], i = wsHave(o);
  if (i < 0) { toast(`Нужен предмет «${WCHAINS[o.c].items[o.l - 1]}» — собери его на поле`); return; }
  W.board[i] = null; if (W.sel === i) W.sel = null;
  G.gold += o.coins; const fresh = !G.heroes[o.hero].have; addCards(o.hero, o.cards); W.done++;
  W.orders.splice(k, 1); wsFillOrders();
  toast(fresh ? `Новый герой: ${HEROES[o.hero].name}!` : `+${o.coins} монет, +${o.cards} карт: ${HEROES[o.hero].name}`);
  sfx(SND.chest); saveGame(); dirty = true;
}
// ---- снаряжение
function showEquip() {
  const W = G.ws, it = W.board[W.sel]; if (!it || it.gen) return;
  const slot = it.c === "weapon" ? "w" : "p", nm = WCHAINS[it.c].items[it.l - 1];
  const owned = HERO_IDS.filter(id => G.heroes[id].have).sort((a, b) => G.team.includes(b) - G.team.includes(a));
  $("chestBody").innerHTML = `<h2>Кому отдать: ${nm}?</h2><div class="hint">${it.c === "weapon" ? `+${it.l * 6}% атаки` : `+${it.l * 7}% здоровья`}. Старая вещь вернётся на поле.</div>
    <div class="eqgrid">${owned.map(id => { const g = (G.heroes[id].gear || {})[slot]; const better = !g || g < it.l; return `<button class="eq ${G.team.includes(id) ? "inteam" : ""}" data-equip="${id}" style="--r:${RAR[HEROES[id].rar].col}">${heroImg(id)}<b>${HEROES[id].name}</b><span>${g ? `сейчас: ${WCHAINS[it.c].items[g - 1]}` : "пусто"}</span>${better ? `<em>▲ сильнее</em>` : ""}</button>`; }).join("")}</div>
    <button class="btn" data-act="closechest">Отмена</button>`;
  $("chestWin").hidden = false;
}
function wsEquip(id) {
  const W = G.ws, it = W.board[W.sel]; if (!it || it.gen) return;
  const slot = it.c === "weapon" ? "w" : "p", h = G.heroes[id]; h.gear = h.gear || {};
  const prev = h.gear[slot]; h.gear[slot] = it.l; W.board[W.sel] = null; W.sel = null;
  if (prev) { const free = W.board.findIndex(v => !v); if (free >= 0) W.board[free] = { c: it.c, l: prev }; else { G.gold += sellPrice(prev); toast("Старая вещь продана — на поле нет места"); } }
  $("chestWin").hidden = true; sfx(SND.up); toast(`${HEROES[id].name} получил: ${WCHAINS[it.c].items[it.l - 1]}`); saveGame(); dirty = true;
}
function gearHTML(id) {
  const g = (G.heroes[id] && G.heroes[id].gear) || {};
  return `<span class="gear">${g.w ? `<img class="pix" src="${wURL("weapon" + g.w)}" alt="">` : ""}${g.p ? `<img class="pix" src="${wURL("potion" + g.p)}" alt="">` : ""}</span>`;
}
function showWsIntro() {
  const im = k => `<img class="pix wi" src="${wURL(k)}" alt="">`;
  $("chestBody").innerHTML = `<h2>Мастерская — здесь зарабатывают монеты</h2>
    <div class="wstep"><b>1</b>${im("forge")}<span>→</span>${im("weapon1")}<p>Нажми на кузницу — появится гвоздь</p></div>
    <div class="wstep"><b>2</b>${im("weapon1")}<span>+</span>${im("weapon1")}<span>=</span>${im("weapon2")}<p>Перетащи гвоздь на гвоздь — получится нож и <b>монеты</b></p></div>
    <div class="wstep"><b>3</b><span class="big">🗡 → 🛡</span><p>Готовые вещи отдавай героям: по заказу (сверху) — за монеты и карты, или нажми «Надеть» — герой станет сильнее</p></div>
    <div class="hint">Чем дальше соединяешь, тем больше монет: нож +2, кинжал +3, меч +5… легендарный меч +21.</div>
    <button class="btn orange" data-act="closechest">Понятно!</button>`;
  $("chestWin").hidden = false;
}
// ---- ежедневные задания
const QUESTS = {
  wins: { text: n => `Выиграй ${n} боя`, goal: 3, gold: 60 },
  battles: { text: n => `Проведи ${n} боёв`, goal: 5, gold: 50 },
  merges: { text: n => `Сделай ${n} соединений в мастерской`, goal: 25, gold: 0, chest: "silver" },
  upgrades: { text: n => `Улучши героя`, goal: 1, gold: 40 },
};
const today = () => new Date().toISOString().slice(0, 10);
function questsFresh() {
  if (G.daily && G.daily.day === today()) return;
  const ids = Object.keys(QUESTS).sort(() => Math.random() - 0.5).slice(0, 3);
  if (!ids.includes("merges")) ids[2] = "merges";
  G.daily = { day: today(), q: ids.map(id => ({ id, n: 0, claimed: false })) };
  saveGame();
}
function questAdd(id) { questsFresh(); for (const q of G.daily.q) if (q.id === id && q.n < QUESTS[id].goal) { q.n++; if (q.n === QUESTS[id].goal) toast("Задание выполнено — забери награду на арене"); } }
function questClaim(k) {
  const q = G.daily.q[k], Q = QUESTS[q.id]; if (q.claimed || q.n < Q.goal) return;
  q.claimed = true; G.gold += Q.gold;
  if (Q.chest) { const free = G.chests.indexOf(null); if (free >= 0) { G.chests[free] = { type: Q.chest, openAt: null }; toast("Серебряный сундук — в слотах!"); } else { G.gold += 80; toast("Слоты заняты — вместо сундука 80 монет"); } }
  else toast(`+${Q.gold} монет`);
  sfx(SND.chest); saveGame(); dirty = true;
}
function renderQuests() {
  questsFresh();
  $("quests").innerHTML = `<b>Задания на сегодня</b>` + G.daily.q.map((q, k) => {
    const Q = QUESTS[q.id], done = q.n >= Q.goal;
    return `<div class="quest"><span class="qt">${Q.text(Q.goal)}<span class="bar"><i style="width:${Math.min(100, q.n / Q.goal * 100)}%"></i></span></span>${q.claimed ? `<span class="qok">✔</span>` : `<button class="btn ${done ? "green" : ""}" data-quest="${k}" ${done ? "" : "disabled"}>${Q.chest ? "Сундук" : `+${Q.gold} 🪙`}</button>`}</div>`;
  }).join("");
}
