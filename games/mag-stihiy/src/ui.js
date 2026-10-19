// =====================================================================
//  Интерфейс: меню, лавка, котёл, книга рецептов, итоги, управление
// =====================================================================
const $ = id => document.getElementById(id);
const DPR = Math.min(3, window.devicePixelRatio || 1);
let P = null, soundOn = true, screen = "menu";
const save = (k, v) => { try { localStorage.setItem("mag_" + k, JSON.stringify(v)); } catch (e) {} };
const load = (k, d) => { try { const v = localStorage.getItem("mag_" + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
function saveP() { P.t = Date.now(); save("p", P); yaPush(); }
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// ---------- управление: джойстик где коснулся + клавиатура
const keys = new Set(); let joy = null;
addEventListener("keydown", e => { keys.add(e.code); if (e.code === "Escape" && screen === "game") togglePause(); });
addEventListener("keyup", e => keys.delete(e.code));
const tz = $("touch");
tz.addEventListener("pointerdown", e => { if (screen !== "game") return; audio(); joy = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, dy: 0 }; tz.setPointerCapture(e.pointerId); $("joy").style.display = "block"; $("joy").style.left = e.clientX + "px"; $("joy").style.top = e.clientY + "px"; $("knob").style.transform = ""; });
tz.addEventListener("pointermove", e => { if (!joy || joy.id !== e.pointerId) return; let dx = e.clientX - joy.x, dy = e.clientY - joy.y; const d = Math.hypot(dx, dy), m = 48; if (d > m) { dx *= m / d; dy *= m / d; } joy.dx = dx / m; joy.dy = dy / m; $("knob").style.transform = `translate(${dx}px,${dy}px)`; });
const joyEnd = e => { if (joy && joy.id === e.pointerId) { joy = null; $("joy").style.display = "none"; } };
tz.addEventListener("pointerup", joyEnd); tz.addEventListener("pointercancel", joyEnd);
function inputVec() {
  if (window.__bot) return window.__bot();
  let x = 0, y = 0;
  if (keys.has("KeyA") || keys.has("ArrowLeft")) x--; if (keys.has("KeyD") || keys.has("ArrowRight")) x++;
  if (keys.has("KeyW") || keys.has("ArrowUp")) y--; if (keys.has("KeyS") || keys.has("ArrowDown")) y++;
  if (joy) { const d = Math.hypot(joy.dx, joy.dy); if (d > 0.15) { x = joy.dx; y = joy.dy; } }
  const d = Math.hypot(x, y); if (d > 1) { x /= d; y /= d; }
  return { x, y };
}

// ---------- экраны
function show(s) {
  screen = s;
  $("menu").hidden = s !== "menu"; $("shopScr").hidden = s !== "meta"; $("hud").hidden = s !== "game"; $("shop").hidden = s !== "shop";
  if (s === "menu") renderMenu(); if (s === "meta") renderMeta();
}
function renderMenu() {
  $("mCoins").textContent = "🪙 " + P.coins;
  $("mPicks").innerHTML = BASIC.map(id => `<button class="pick ${P.start === id ? "on" : ""}" data-start="${id}"><span>${WEAP[id].icon}</span>${WEAP[id].name}</button>`).join("");
  $("mStats").innerHTML = `<span>Рекорд: <b>волна ${P.best.wave}</b></span><span>Побед: <b>${P.wins}</b></span><span>Рецептов: <b>${Object.keys(P.book).length}/${RECIPES.length}</b></span>`;
  $("mSound").textContent = soundOn ? "🔊 Звук" : "🔇 Звук";
}
function renderMeta() {
  $("sCoins").textContent = "🪙 " + P.coins;
  $("shopList").innerHTML = Object.entries(META).map(([id, m]) => {
    const l = P.meta[id] || 0, cost = m.cost * (l + 1), max = l >= m.max;
    return `<div class="srow"><span class="ic">${m.icon}</span><div><b>${m.name}</b><small>${m.desc}</small><div class="pips">${Array.from({ length: m.max }, (_, i) => `<i class="${i < l ? "on" : ""}"></i>`).join("")}</div></div><button data-buy="${id}" ${max || P.coins < cost ? "disabled" : ""}>${max ? "Макс." : "🪙 " + cost}</button></div>`;
  }).join("");
}
const wsHtml = (w, i, cls = "", attr = "") => { const d = wdef(w.id); const two = Array.from(d.icon.replace(/\uFE0F/g, "")).length > 1; return `<button class="ws ${cls}" style="--tc:${TCOL[w.tier]};${two ? "font-size:" + (cls.includes("big") ? 15 : 11) + "px" : ""}" ${attr} title="${esc(d.name)}">${d.icon}<small>${TIERS[w.tier]}</small></button>`; };

// ---------- бой
function startGame() { show("game"); newRun(P.start); renderSlots(); P.runs++; saveP(); }
function renderSlots() { if (R) $("slots").innerHTML = R.weap.map((w, i) => wsHtml(w, i)).join(""); }
let hudT = 0;
function uiFrame(dt) {
  if (screen !== "game" || !R) return;
  $("hXp").style.width = (R.xp / R.need * 100).toFixed(1) + "%";
  $("hHp").style.width = Math.max(0, R.hp / R.maxhp * 100).toFixed(1) + "%";
  hudT -= dt; if (hudT > 0) return; hudT = 0.1;
  $("hLvl").textContent = "Ур. " + R.lvl; $("hLv").textContent = R.pend ? `+${R.pend} ур.` : "";
  $("hWave").textContent = `Волна ${R.wave}/${WAVES_TOTAL}`; $("hTime").textContent = Math.max(0, Math.ceil(R.waveT));
  $("hTime").style.color = R.waveT < 5 && R.inWave ? "#ffd23a" : "";
  $("hGems").textContent = "💎 " + Math.floor(R.cr); $("hHpT").textContent = `${Math.ceil(R.hp)} / ${Math.round(R.maxhp)}`;
  if (R.boss) $("bossHp").style.width = Math.max(0, R.boss.hp / R.boss.maxhp * 100) + "%";
}
function bossBar(e) { $("boss").hidden = !e; if (e) { $("bossName").textContent = e.d.name; $("bossHp").style.width = "100%"; } }
let banT = 0;
function banner(t) { const b = $("banner"); b.textContent = t; b.classList.add("on"); clearTimeout(banT); banT = setTimeout(() => b.classList.remove("on"), 2000); }
let hurtTm = 0;
function hurtFlash() { const h = $("hurt"); h.classList.add("on"); clearTimeout(hurtTm); hurtTm = setTimeout(() => h.classList.remove("on"), 60); }
let toastT = 0;
function toast(t) { const el = $("toast"); el.textContent = t; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => el.hidden = true, 2400); }

// ---------- пауза
const pauseWhy = new Set();
function pauseFor(why, on) { on ? pauseWhy.add(why) : pauseWhy.delete(why); if (R) R.paused = pauseWhy.size > 0; }
function togglePause() {
  if (!R || R.over || screen !== "game") return; const on = $("pause").hidden;
  if (on) { $("pBuild").innerHTML = $("slots").innerHTML; $("pSound").textContent = soundOn ? "🔊 Звук" : "🔇 Звук"; }
  $("pause").hidden = !on; pauseFor("menu", on); joy = null; $("joy").style.display = "none";
}

// ---------- после волны: уровни, потом лавка
let luOpts = null;
function waveDone() { joy = null; $("joy").style.display = "none"; if (R.pend > 0) showLevelUp(); else openShop(); }
function showLevelUp() {
  const pool = [...LVUP]; luOpts = [];
  while (luOpts.length < 4) luOpts.push(pool.splice(Math.random() * pool.length | 0, 1)[0]);
  $("luTitle").textContent = R.pend > 1 ? `Новый уровень! (ещё ${R.pend - 1})` : "Новый уровень!";
  $("luCards").innerHTML = luOpts.map((o, i) => `<button class="card" style="--c:#ffd23a" data-lu="${i}"><span class="ic">${o.icon}</span><div><b>${o.name}</b><p>${o.desc}</p></div></button>`).join("");
  $("lvlup").hidden = false;
}
function chooseLu(i) { applySt(luOpts[i].st); R.pend--; $("lvlup").hidden = true; if (R.pend > 0) setTimeout(showLevelUp, 100); else openShop(); }

// ---------- лавка алхимика
const SH = { offers: [], roll: 0, sel: null, pot: [] };
const TMUL = [1, 1.9, 3.4, 6];
const wPrice = (id, t) => Math.round(wdef(id).price * TMUL[t] * (1 + R.wave * 0.12));
const iPrice = id => Math.round(ITEMS[id].price * (1 + R.wave * 0.13) * (1 + 0.12 * (R.items[id] || 0)));
function rollTier(w) { const r = Math.random(); if (w >= 15 && r < 0.08) return 3; if (w >= 9 && r < (w >= 15 ? 0.3 : 0.14)) return 2; if (w >= 4 && r < (w >= 9 ? 0.5 : 0.3)) return 1; return 0; }
function genOffers() { const w = R.wave + 1, items = Object.keys(ITEMS); SH.offers = Array.from({ length: 4 }, () => Math.random() < 0.6 ? { k: "w", id: pick(BASIC), tier: rollTier(w) } : { k: "i", id: pick(items) }); }
function openShop() {
  screen = "shop"; $("hud").hidden = true; $("shop").hidden = false; $("shop").scrollTop = 0;
  SH.roll = 0; SH.sel = null; SH.pot = []; genOffers(); renderShop();
}
function rollCost() { return R.freeRolls > 0 && SH.roll === 0 ? 0 : 2 + R.wave + SH.roll * 2; }
function canBuyW(o) { if (R.weap.length < MAX_WEAP) return true; return R.weap.some(w => w.id === o.id && w.tier === o.tier && w.tier < 3); }
function renderShop() {
  $("shGems").textContent = "💎 " + Math.floor(R.cr);
  $("shSub").textContent = `Волна ${R.wave} пройдена · впереди волна ${R.wave + 1} из ${WAVES_TOTAL}`;
  $("shOffers").innerHTML = SH.offers.map((o, i) => {
    if (o.sold) return `<div class="offer sold"><div class="top"><span class="ic">✓</span><b>Куплено</b></div></div>`;
    if (o.k === "w") { const d = wdef(o.id), p = wPrice(o.id, o.tier), ok = R.cr >= p && canBuyW(o); return `<div class="offer" style="--tc:${TCOL[o.tier]};border-color:${TCOL[o.tier]}"><div class="top"><span class="ic">${d.icon}</span><div><em>Оружие · ранг ${TIERS[o.tier]}</em><b>${d.name}</b></div></div><p>${d.desc}</p><button data-buyo="${i}" ${ok ? "" : "disabled"}>${canBuyW(o) ? "💎 " + p : "Нет места"}</button></div>`; }
    const it = ITEMS[o.id], p = iPrice(o.id); return `<div class="offer"><div class="top"><span class="ic">${it.icon}</span><div><em>Амулет${R.items[o.id] ? " · есть " + R.items[o.id] : ""}</em><b>${it.name}</b></div></div><p>${it.desc}</p><button data-buyo="${i}" ${R.cr >= p ? "" : "disabled"}>💎 ${p}</button></div>`;
  }).join("");
  const rc = rollCost(); $("shRoll").textContent = rc ? `🎲 Перебросить · 💎 ${rc}` : "🎲 Перебросить · бесплатно"; $("shRoll").disabled = R.cr < rc;
  $("shInvT").textContent = `Оружие ${R.weap.length}/${MAX_WEAP}`;
  $("shInv").innerHTML = R.weap.map((w, i) => wsHtml(w, i, "big" + (SH.sel === i ? " sel" : "") + (SH.pot.includes(i) ? " sel" : ""), `data-wi="${i}"`)).join("") + Array.from({ length: MAX_WEAP - R.weap.length }, () => `<span class="ws big empty"></span>`).join("");
  if (SH.sel !== null && R.weap[SH.sel]) {
    const w = R.weap[SH.sel], d = wdef(w.id), inPot = SH.pot.includes(SH.sel), sell = Math.round(wPrice(w.id, w.tier) * 0.4);
    $("shSel").innerHTML = `<div class="selp"><b>${d.icon} ${d.name}</b> <span style="color:${TCOL[w.tier]};font-weight:800">ранг ${TIERS[w.tier]}</span><br>${d.desc}<div class="row"><button class="btn small" data-pot="1" ${inPot || SH.pot.length >= 2 ? "disabled" : ""}>⚗️ В котёл</button><button class="btn small" data-sell="1" ${R.weap.length <= 1 ? "disabled" : ""}>Продать · 💎 ${sell}</button></div></div>`;
  } else $("shSel").innerHTML = `<div class="selp">Нажми на оружие, чтобы положить его в котёл или продать. Два одинаковых дают ранг выше, разные стихии рождают новые заклинания.</div>`;
  const pa = R.weap[SH.pot[0]], pb = R.weap[SH.pot[1]];
  let res = `<div class="res" style="color:var(--sub)">Положи два предмета</div>`, can = false;
  if (pa && pb) {
    const r = brew(pa, pb);
    if (!r) res = `<div class="res"><b>Не смешивается</b><span style="color:var(--sub)">Попробуй другую пару</span></div>`;
    else { const d = wdef(r.id), known = r.kind === "up" || P.book[r.id]; can = true; res = `<div class="res"><b>${known ? d.icon + " " + d.name : "❓ Неизвестный рецепт"}</b><span style="color:${TCOL[r.tier]}">ранг ${TIERS[r.tier]}</span></div>`; }
  } else if (pa) res = `<div class="res" style="color:var(--sub)">Добавь второй предмет</div>`;
  const slot = (w, i) => w ? wsHtml(w, 0, "big", `data-unpot="${i}"`) : `<span class="ws big empty"></span>`;
  $("shPot").innerHTML = `${slot(pa, 0)}<span class="plus">+</span>${slot(pb, 1)}<span class="plus">=</span>${res}<button class="btn small green" data-brew="1" style="margin:4px 0 0;padding:10px" ${can ? "" : "disabled"}>Сварить</button>`;
  const its = Object.entries(R.items);
  $("shItT").hidden = $("shItems").hidden = !its.length;
  $("shItems").innerHTML = its.map(([id, n]) => `<span class="it">${ITEMS[id].icon} ${n > 1 ? "×" + n : ""}</span>`).join("");
}
function buyOffer(i) {
  const o = SH.offers[i];
  if (o.k === "w") {
    const p = wPrice(o.id, o.tier); if (R.cr < p || !canBuyW(o)) return; R.cr -= p;
    if (!addWeapon(o.id, o.tier)) { const w = R.weap.find(w => w.id === o.id && w.tier === o.tier); w.tier++; toast(`${wdef(o.id).name} → ранг ${TIERS[w.tier]}`); }
  } else { const p = iPrice(o.id); if (R.cr < p) return; R.cr -= p; R.items[o.id] = (R.items[o.id] || 0) + 1; applySt(ITEMS[o.id].st); }
  o.sold = true; sfx(SND.coin); renderShop();
}
function doBrew() {
  const [a, b] = SH.pot, r = brew(R.weap[a], R.weap[b]); if (!r) return;
  const isNew = r.kind !== "up" && !P.book[r.id];
  [a, b].sort((x, y) => y - x).forEach(i => removeWeapon(i)); addWeapon(r.id, r.tier);
  if (r.kind !== "up") { P.book[r.id] = 1; saveP(); }
  SH.pot = []; SH.sel = null; sfx(SND.brew);
  const d = wdef(r.id); banner(isNew ? "Новый рецепт: " + d.name + "!" : d.name + " · ранг " + TIERS[r.tier]);
  renderShop();
}
function nextWave() {
  $("shop").hidden = true; show("game"); renderSlots();
  const go = () => startWave(R.wave + 1);
  if (R.wave % 3 === 0) yaInterstitial(go); else go();
}
function renderBook() {
  $("bkSub").textContent = `Открыто ${Object.keys(P.book).length} из ${RECIPES.length}`;
  $("bkList").innerHTML = RECIPES.map(id => {
    const d = wdef(id), f = FUSE[id], ing = f ? ELEM[f.a].icon + " + " + ELEM[f.b].icon : WEAP[d.base].icon + " + " + ELEM[d.elem].icon;
    return P.book[id] ? `<div class="rec"><span class="ic">${d.icon}</span><b>${d.name}</b>${ing}</div>` : `<div class="rec no"><span class="ic">❓</span><b>???</b>${f ? "две стихии" : "оружие + стихия"}</div>`;
  }).join("");
  $("bookM").hidden = false;
}

// ---------- воскрешение и итоги
function showRevive() { $("revive").hidden = false; }
let lastEnd = null;
function endRun(won) {
  $("revive").hidden = true;
  const r = R, earned = Math.floor(r.earned / 5) + r.wave * 4 + (won ? 150 : 0);
  P.coins += earned; if (won) P.wins++;
  const rec = r.wave > P.best.wave;
  if (rec) P.best.wave = r.wave; if (r.kills > P.best.kills) P.best.kills = r.kills;
  yaScore(r.wave * 1000 + Math.min(999, r.kills)); saveP(); lastEnd = { earned, doubled: false };
  $("endBox").innerHTML = `<h1>${won ? "Победа! Орда разбита!" : "Забег окончен"}</h1>${rec ? `<div style="color:var(--gold);font-weight:800">Новый рекорд!</div>` : ""}
    <div class="rows">Волна: <b>${r.wave}/${WAVES_TOTAL}</b> · Уровень: <b>${r.lvl}</b> · Врагов: <b>${r.kills}</b></div>
    <div class="build">${r.weap.map((w, i) => wsHtml(w, i)).join("")}</div>
    <div class="big" id="eCoins">+${earned} 🪙</div>
    <button class="btn green" id="eDouble">▶ Удвоить монеты<small>за просмотр ролика</small></button>
    <button class="btn gold" id="eAgain">Ещё забег</button><button class="btn" id="eMenu">В меню</button>`;
  $("end").hidden = false;
}
function leaveRun(then) { $("end").hidden = true; $("shop").hidden = true; clearRun(); bossBar(null); pauseWhy.clear(); then(); }

// ---------- клики
document.addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b || b.disabled) return; audio();
  const ds = b.dataset;
  if (ds.start) { P.start = ds.start; saveP(); renderMenu(); sfx(SND.coin); return; }
  if (ds.buy) { const id = ds.buy, m = META[id], l = P.meta[id] || 0, c = m.cost * (l + 1); if (P.coins >= c && l < m.max) { P.coins -= c; P.meta[id] = l + 1; saveP(); sfx(SND.lvl); renderMeta(); } return; }
  if (ds.lu !== undefined) { sfx(SND.coin); chooseLu(+ds.lu); return; }
  if (ds.buyo !== undefined) { buyOffer(+ds.buyo); return; }
  if (ds.wi !== undefined) { const i = +ds.wi; SH.sel = SH.sel === i ? null : i; renderShop(); return; }
  if (ds.pot) { if (SH.pot.length < 2 && !SH.pot.includes(SH.sel)) SH.pot.push(SH.sel); SH.sel = null; sfx(SND.throw); renderShop(); return; }
  if (ds.unpot !== undefined) { SH.pot.splice(+ds.unpot, 1); renderShop(); return; }
  if (ds.sell) { const i = SH.sel, w = R.weap[i]; R.cr += Math.round(wPrice(w.id, w.tier) * 0.4); removeWeapon(i); SH.pot = SH.pot.filter(x => x !== i).map(x => x > i ? x - 1 : x); SH.sel = null; sfx(SND.coin); renderShop(); return; }
  if (ds.brew) { doBrew(); return; }
  switch (b.id) {
    case "mPlay": startGame(); break;
    case "mShop": show("meta"); break;
    case "mBook": case "shBook": renderBook(); break;
    case "bkClose": $("bookM").hidden = true; break;
    case "sBack": show("menu"); break;
    case "mSound": case "pSound": soundOn = !soundOn; save("sound", soundOn); b.textContent = soundOn ? "🔊 Звук" : "🔇 Звук"; break;
    case "hPause": case "pGo": togglePause(); break;
    case "pQuit": $("pause").hidden = true; pauseFor("menu", false); R.over = true; endRun(false); break;
    case "shRoll": { const c = rollCost(); if (R.cr < c) break; R.cr -= c; if (c === 0) R.freeRolls--; SH.roll++; genOffers(); sfx(SND.throw); renderShop(); break; }
    case "shGo": nextWave(); break;
    case "rAd": yaRewarded(() => { $("revive").hidden = true; revive(); }); break;
    case "rNo": endRun(false); break;
    case "eDouble": if (!lastEnd.doubled) yaRewarded(() => { lastEnd.doubled = true; P.coins += lastEnd.earned; saveP(); $("eCoins").textContent = `+${lastEnd.earned * 2} 🪙`; b.disabled = true; }); break;
    case "eAgain": leaveRun(() => yaInterstitial(startGame)); break;
    case "eMenu": leaveRun(() => yaInterstitial(() => show("menu"))); break;
  }
});

// ---------- запуск
function onReady() { show("menu"); yaStart(); }
function boot() {
  soundOn = load("sound", true); P = Object.assign(newProfile(), load("p", {}));
  if (!WEAP[P.start]) P.start = "fire"; if (!P.best || P.best.wave === undefined) P.best = { wave: 0, kills: 0 }; P.book = P.book || {};
  G = new Phaser.Game({ type: Phaser.AUTO, parent: "stage", width: innerWidth * DPR, height: innerHeight * DPR, backgroundColor: "#2f5a3a",
    scale: { mode: Phaser.Scale.NONE, zoom: 1 / DPR }, render: { antialias: true, powerPreference: "high-performance" }, audio: { noAudio: true }, banner: false, scene: [Run] });
  addEventListener("resize", () => { G.scale.resize(innerWidth * DPR, innerHeight * DPR); G.scale.setZoom(1 / DPR); fitCamera(); });
}
(document.fonts && document.fonts.load ? document.fonts.load("800 16px Rubik", "МАГ") : Promise.resolve()).finally(boot);
window.__ui = { chooseLu, openShop, buyOffer, doBrew, nextWave, SH, get luOpts() { return luOpts; }, startGame };
