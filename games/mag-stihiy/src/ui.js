// =====================================================================
//  Интерфейс: меню, прокачка, выбор карт, конец забега, управление
// =====================================================================
const $ = id => document.getElementById(id);
const DPR = Math.min(3, window.devicePixelRatio || 1);
let P = null, soundOn = true, screen = "menu";
const save = (k, v) => { try { localStorage.setItem("mag_" + k, JSON.stringify(v)); } catch (e) {} };
const load = (k, d) => { try { const v = localStorage.getItem("mag_" + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
function saveP() { P.t = Date.now(); save("p", P); yaPush(); }
const fmt = t => `${String(t / 60 | 0).padStart(2, "0")}:${String(t % 60 | 0).padStart(2, "0")}`;

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
  let x = 0, y = 0;
  if (keys.has("KeyA") || keys.has("ArrowLeft")) x--; if (keys.has("KeyD") || keys.has("ArrowRight")) x++;
  if (keys.has("KeyW") || keys.has("ArrowUp")) y--; if (keys.has("KeyS") || keys.has("ArrowDown")) y++;
  if (window.__bot) return window.__bot();
  if (joy) { const d = Math.hypot(joy.dx, joy.dy); if (d > 0.15) { x = joy.dx; y = joy.dy; } }
  const d = Math.hypot(x, y); if (d > 1) { x /= d; y /= d; }
  return { x, y };
}

// ---------- экраны
function show(s) {
  screen = s;
  $("menu").hidden = s !== "menu"; $("shopScr").hidden = s !== "shop"; $("hud").hidden = s !== "game";
  if (s === "menu") renderMenu(); if (s === "shop") renderShop();
}
function renderMenu() {
  $("mCoins").textContent = "🪙 " + P.coins;
  $("mPicks").innerHTML = ELEM_IDS.map(id => `<button class="pick ${P.start === id ? "on" : ""}" style="--c:${ELEM[id].css}" data-start="${id}"><span>${ELEM[id].icon}</span>${ELEM[id].name}</button>`).join("");
  $("mStats").innerHTML = `<span>Рекорд: <b>${fmt(P.best.t)}</b></span><span>Врагов: <b>${P.best.kills}</b></span><span>Слияний открыто: <b>${Object.keys(P.fusions).length}/6</b></span>`;
  $("mSound").textContent = soundOn ? "🔊 Звук" : "🔇 Звук";
}
function renderShop() {
  $("sCoins").textContent = "🪙 " + P.coins;
  $("shopList").innerHTML = Object.entries(META).map(([id, m]) => {
    const l = P.meta[id] || 0, cost = m.cost * (l + 1), max = l >= m.max;
    return `<div class="srow"><span class="ic">${m.icon}</span><div><b>${m.name}</b><small>${m.desc}</small><div class="pips">${Array.from({ length: m.max }, (_, i) => `<i class="${i < l ? "on" : ""}"></i>`).join("")}</div></div><button data-buy="${id}" ${max || P.coins < cost ? "disabled" : ""}>${max ? "Макс." : "🪙 " + cost}</button></div>`;
  }).join("");
}

// ---------- игра
function startGame() { show("game"); newRun(P.start); renderSlots(); P.runs++; saveP(); }
function renderSlots() {
  if (!R) return;
  $("slots").innerHTML = Object.entries(R.elems).map(([id, l]) => `<div class="slot" style="--c:${ELEM[id].css}">${ELEM[id].icon}<small>${l}</small></div>`).join("")
    + Object.keys(R.fus).map(id => `<div class="slot f">${FUSE[id].icon}<small>★</small></div>`).join("")
    + Object.entries(R.pass).map(([id, l]) => `<div class="slot" style="--c:#b8a8e8">${PASS[id].icon}<small>${l}</small></div>`).join("");
}
let hudT = 0;
function uiFrame(dt) {
  if (screen !== "game" || !R) return;
  $("hXp").style.width = (R.xp / R.need * 100).toFixed(1) + "%";
  hudT -= dt; if (hudT > 0) return; hudT = 0.1;
  $("hLvl").textContent = "Ур. " + R.lvl; $("hTime").textContent = fmt(R.t); $("hKills").textContent = "💀 " + R.kills; $("hCoins").textContent = "🪙 " + R.coins;
  $("hTime").style.color = R.t > RUN_TIME - 30 ? "#ffd23a" : "";
  if (R.boss) $("bossHp").style.width = Math.max(0, R.boss.hp / R.boss.maxhp * 100) + "%";
}
function bossBar(e) { $("boss").hidden = !e; if (e) { $("bossName").textContent = e.d.name; $("bossHp").style.width = "100%"; } }
let banT = 0;
function banner(t) { const b = $("banner"); b.textContent = t; b.classList.add("on"); clearTimeout(banT); banT = setTimeout(() => b.classList.remove("on"), 2200); }
let hurtTm = 0;
function hurtFlash() { const h = $("hurt"); h.classList.add("on"); clearTimeout(hurtTm); hurtTm = setTimeout(() => h.classList.remove("on"), 60); }
let toastT = 0;
function toast(t) { const el = $("toast"); el.textContent = t; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => el.hidden = true, 2400); }

// ---------- пауза (кнопка, сворачивание, реклама)
const pauseWhy = new Set();
function pauseFor(why, on) { on ? pauseWhy.add(why) : pauseWhy.delete(why); if (R) R.paused = pauseWhy.size > 0; }
function togglePause() {
  if (!R || R.over) return; const on = $("pause").hidden;
  if (on) { $("pBuild").innerHTML = $("slots").innerHTML; $("pSound").textContent = soundOn ? "🔊 Звук" : "🔇 Звук"; }
  $("pause").hidden = !on; pauseFor("menu", on); joy = null; $("joy").style.display = "none";
}

// ---------- выбор улучшения
let cur = null, chestMode = false;
function cardHtml(o, i) {
  if (o.k === "f") { const f = FUSE[o.id]; return `<button class="card fuse" data-opt="${i}"><span class="ic">${f.icon}</span><div><em>✦ Слияние стихий</em><b>${f.name}</b><p>${f.desc}</p></div></button>`; }
  if (o.k === "e") { const e = ELEM[o.id], l = R.elems[o.id] || 0; return `<button class="card" style="--c:${e.css}" data-opt="${i}"><span class="ic">${e.icon}</span><div><em>${l ? "Уровень " + (l + 1) : "Новая стихия"}</em><b>${e.name}</b><p>${e.lvl[l]}</p></div></button>`; }
  if (o.k === "p") { const p = PASS[o.id], l = R.pass[o.id] || 0; return `<button class="card" style="--c:#b8a8e8" data-opt="${i}"><span class="ic">${p.icon}</span><div><em>${l ? "Уровень " + (l + 1) : "Амулет"}</em><b>${p.name}</b><p>${p.desc}</p></div></button>`; }
  if (o.k === "heal") return `<button class="card" style="--c:#ff4a6a" data-opt="${i}"><span class="ic">❤️</span><div><em>Отдых</em><b>Полное здоровье</b><p>Всё прокачано — лечись</p></div></button>`;
  return `<button class="card" style="--c:#ffd23a" data-opt="${i}"><span class="ic">🪙</span><div><em>Добыча</em><b>15 монет</b><p>Пригодятся для прокачки</p></div></button>`;
}
function showLevelUp() {
  if (!R || R.pend <= 0) return;
  pauseFor("lvl", true); joy = null; $("joy").style.display = "none";
  cur = options(3); $("luTitle").textContent = chestMode ? "Сундук!" : "Новый уровень!";
  $("luCards").innerHTML = cur.map(cardHtml).join("");
  $("luReroll").hidden = chestMode || R.rerolls <= 0; $("luReroll").textContent = `🎲 Перебросить (${R.rerolls})`;
  $("lvlup").hidden = false;
}
function openChest() { chestMode = true; R.pend++; showLevelUp(); }
function chooseOpt(i) {
  applyOption(cur[i]); renderSlots(); R.pend--; chestMode = false;
  $("lvlup").hidden = true;
  if (R.pend > 0) setTimeout(showLevelUp, 120); else pauseFor("lvl", false);
}

// ---------- воскрешение и итоги
function showRevive() { $("revive").hidden = false; }
let lastEnd = null;
function endRun(won) {
  $("revive").hidden = true;
  const r = R, earned = r.coins + Math.floor(r.kills / 12) + Math.floor(r.t / 20) + (won ? 100 : 0);
  P.coins += earned; if (won) P.wins++;
  const rec = r.t > P.best.t || (won && r.kills > P.best.kills);
  if (r.t > P.best.t) P.best.t = Math.min(RUN_TIME, r.t); if (r.kills > P.best.kills) { P.best.kills = r.kills; yaScore(r.kills); }
  saveP(); lastEnd = { earned, doubled: false };
  $("endBox").innerHTML = `<h1>${won ? "Победа! Ты выстоял!" : "Забег окончен"}</h1>${rec ? `<div style="color:var(--gold);font-weight:800">Новый рекорд!</div>` : ""}
    <div class="rows">Время: <b>${fmt(r.t)}</b> · Уровень: <b>${r.lvl}</b> · Врагов: <b>${r.kills}</b></div>
    <div class="build">${$("slots").innerHTML}</div>
    <div class="big" id="eCoins">+${earned} 🪙</div>
    <button class="btn green" id="eDouble">▶ Удвоить монеты<small>за просмотр ролика</small></button>
    <button class="btn gold" id="eAgain">Ещё забег</button><button class="btn" id="eMenu">В меню</button>`;
  $("end").hidden = false;
}
function leaveRun(then) { $("end").hidden = true; clearRun(); bossBar(null); pauseWhy.clear(); then(); }

// ---------- клики
document.addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return; audio();
  if (b.dataset.start) { P.start = b.dataset.start; saveP(); renderMenu(); sfx(SND.coin); return; }
  if (b.dataset.buy) { const id = b.dataset.buy, m = META[id], l = P.meta[id] || 0, c = m.cost * (l + 1); if (P.coins >= c && l < m.max) { P.coins -= c; P.meta[id] = l + 1; saveP(); sfx(SND.lvl); renderShop(); } return; }
  if (b.dataset.opt !== undefined) { chooseOpt(+b.dataset.opt); sfx(SND.coin); return; }
  switch (b.id) {
    case "mPlay": startGame(); break;
    case "mShop": show("shop"); break;
    case "sBack": show("menu"); break;
    case "mSound": case "pSound": soundOn = !soundOn; save("sound", soundOn); b.textContent = soundOn ? "🔊 Звук" : "🔇 Звук"; break;
    case "hPause": togglePause(); break;
    case "pGo": togglePause(); break;
    case "pQuit": $("pause").hidden = true; pauseFor("menu", false); R.over = true; endRun(false); break;
    case "luReroll": R.rerolls--; showLevelUp(); break;
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
  G = new Phaser.Game({ type: Phaser.AUTO, parent: "stage", width: innerWidth * DPR, height: innerHeight * DPR, backgroundColor: "#2f5a3a",
    scale: { mode: Phaser.Scale.NONE, zoom: 1 / DPR }, render: { antialias: true, powerPreference: "high-performance" }, audio: { noAudio: true }, banner: false, scene: [Run] });
  addEventListener("resize", () => { G.scale.resize(innerWidth * DPR, innerHeight * DPR); G.scale.setZoom(1 / DPR); fitCamera(); });
}
(document.fonts && document.fonts.load ? document.fonts.load("800 16px Rubik", "МАГ") : Promise.resolve()).finally(boot);

window.__ui = { chooseOpt, get cur() { return cur; }, startGame };
