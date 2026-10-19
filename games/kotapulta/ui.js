// =====================================================================
//  Камера, управление, экраны
// =====================================================================
let screen = "menu", pulling = null;
function resize() {
  dpr = Math.min(2.5, window.devicePixelRatio || 1); CW = innerWidth; CH = innerHeight;
  cv.width = Math.round(CW * dpr); cv.height = Math.round(CH * dpr); cv.style.width = CW + "px"; cv.style.height = CH + "px";
  sc = Math.min(CH / 640, CW / 880); viewW = CW / sc; offY = CH - (GY + 45) * sc;
  $("rotate").hidden = !(CH > CW * 1.15);
}
window.addEventListener("resize", resize);
const toWorld = (x, y) => ({ x: x / sc + S.camX, y: (y - offY) / sc });
// ---- камера
function camera() {
  if (!S) return;
  const max = Math.max(0, S.def.w - viewW);
  let goal = 0;
  if (S.state === "intro") goal = max;
  else if (S.state === "fly" && S.flying[0]) goal = S.flying[0].position.x - viewW * 0.35;
  else if (S.state === "won" || S.state === "lost") goal = Math.min(max, Math.max(0, S.def.w - viewW * 1.05));
  goal = Math.max(0, Math.min(max, goal));
  S.camX += (goal - S.camX) * (S.state === "intro" ? 0.03 : 0.08);
}
// ---- управление
cv.addEventListener("pointerdown", e => {
  if (screen !== "game" || !S) return;
  if (S.state === "fly") { ability(); return; }
  if (S.state !== "aim" || !S.cat) return;
  const w = toWorld(e.clientX, e.clientY);
  if (Math.hypot(w.x - S.cat.x, w.y - S.cat.y) < Math.max(70, 50 / sc)) { pulling = { id: e.pointerId }; cv.setPointerCapture(e.pointerId); sfx([.2, 0, 500, 0, .02, .05, 1]); }
});
cv.addEventListener("pointermove", e => {
  if (!pulling || pulling.id !== e.pointerId) return;
  const w = toWorld(e.clientX, e.clientY); let d = { x: w.x - SLING.x, y: w.y - SLING.y };
  const L = Math.hypot(d.x, d.y); if (L > MAXPULL) d = { x: d.x / L * MAXPULL, y: d.y / L * MAXPULL };
  if (d.x > 10) d.x = 10;
  S.cat.x = SLING.x + d.x; S.cat.y = SLING.y + d.y;
});
cv.addEventListener("pointerup", () => {
  if (!pulling) return; pulling = null;
  const dx = S.cat.x - SLING.x, dy = S.cat.y - SLING.y;
  if (Math.hypot(dx, dy) > 25) { fire(dx, dy); S.tip = 1; } else { S.cat.x = SLING.x; S.cat.y = SLING.y; }
  dirty = true;
});
// ---- экраны и окна
function show(s) { screen = s; ["menuScr", "lvlScr", "hud"].forEach(id => $(id).hidden = !((id === "menuScr" && s === "menu") || (id === "lvlScr" && s === "levels") || (id === "hud" && s === "game"))); if (s !== "game") { $("win").hidden = true; } dirty = true; }
function play(n) {
  $("win").hidden = true; pulling = null; previewN = n;
  const c = chapterOf(n);
  if (n === CHAPTERS[c].from && !(P.seen || {})[c]) { S = null; show("game"); $("chap").textContent = CHAPTERS[c].name; $("chap").hidden = false; playScene(c, () => { P.seen = P.seen || {}; P.seen[c] = 1; saveP(); $("chap").hidden = true; startLevel(n); }); return; }
  startLevel(n); show("game");
}
function renderHud() {
  if (!S) return;
  $("hLvl").textContent = `${S.n + 1}. ${S.def.title}`; $("hScore").textContent = S.score;
  const c = S.cat, tip = S.state === "aim" && c ? (S.n === 0 && !S.tip ? "Оттяни кота назад и отпусти" : CATS[c.kind].desc !== "Обычный кот" ? `${CATS[c.kind].name}: ${CATS[c.kind].desc}` : "") : "";
  $("tip").textContent = tip; $("tip").hidden = !tip;
}
function renderLevels() {
  $("lvlStars").textContent = `★ ${totalStars()} / ${LEVELS * 3}`;
  $("lvlGrid").innerHTML = LV.map((d, n) => { const open = n <= P.lvl, st = P.stars[n] || 0, c = chapterOf(n); return (n === CHAPTERS[c].from ? `<h3 class="ch ${CHAPTERS[c].theme}">${CHAPTERS[c].name}</h3>` : "") + `<button class="lv ${open ? "" : "locked"} ${CHAPTERS[c].theme}" data-lvl="${n}" ${open ? "" : "disabled"}><b>${open ? n + 1 : "🔒"}</b><span>${open ? "★".repeat(st) + "☆".repeat(3 - st) : ""}</span></button>`; }).join("");
}
function showEnd() {
  const won = S.state === "won";
  if (won && S.n === LEVELS - 1 && !(P.seen || {}).end) { P.seen.end = 1; saveP(); playScene("end", showEnd); return; }
  $("winBody").innerHTML = won
    ? `<h1>Мыши повержены!</h1><div class="stars">${[0, 1, 2].map(i => `<span class="${i < S.stars ? "on" : ""}" style="animation-delay:${i * 0.25}s">★</span>`).join("")}</div><div class="big">${S.score}</div>
      <div class="btns">${S.n + 1 < LEVELS ? `<button class="btn orange" data-act="next">Дальше</button>` : `<div class="hint">Все уровни пройдены! Скоро новые.</div>`}<button class="btn" data-act="retry">Ещё раз</button><button class="btn" data-act="levels">Уровни</button></div>`
    : `<h1>Мыши устояли</h1><div class="hint">Осталось мышей: ${S.mice.filter(m => !m.dead).length}</div>
      <div class="btns">${!S.extra ? `<button class="btn green" data-act="extra">▶ Ещё один кот<small>за просмотр ролика</small></button>` : ""}<button class="btn orange" data-act="retry">Заново</button><button class="btn" data-act="levels">Уровни</button></div>`;
  $("win").hidden = false;
}
document.addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return; const a = b.dataset.act;
  if (b.closest("#story")) { if (b.id === "skip") { scene.i = scene.lines.length - 1; } nextLine(); return; }
  if (b.dataset.lvl !== undefined) play(+b.dataset.lvl);
  else if (b.id === "mPlay") { show("levels"); }
  else if (b.id === "mSound" || b.id === "hSound") { soundOn = !soundOn; save("sound", soundOn); if (soundOn) audio(); }
  else if (b.id === "lvlBack") show("menu");
  else if (b.id === "hBack") { S = null; show("levels"); }
  else if (b.id === "hRetry") play(S.n);
  else if (a === "next") { const n = S.n + 1; $("win").hidden = true; yaInterstitial(() => play(n)); }
  else if (a === "retry") { const n = S.n; $("win").hidden = true; yaInterstitial(() => play(n)); }
  else if (a === "levels") { S = null; show("levels"); }
  else if (a === "extra") adReward(() => { $("win").hidden = true; endShown = false; extraCat(); });
  dirty = true;
});
let toastT = 0;
function toast(t) { const el = $("toast"); el.textContent = t; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => el.hidden = true, 2400); }
function adReward(cb) { if (YA.sdk) return yaRewarded(cb); toast("Здесь будет ролик (в версии для Яндекса)"); cb(); }
let last = 0, endShown = false, endT = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (screen === "game" && S) {
    if (S.state === "load") loadCat();
    step(dt); camera();
    if ((S.state === "won" || S.state === "lost") && !endShown) { endT += dt; if (endT > 1.4) { endShown = true; showEnd(); } } else if (S.state !== "won" && S.state !== "lost") { endShown = false; endT = 0; }
  }
  if (dirty) { dirty = false; if (screen === "levels") renderLevels(); if (screen === "game") renderHud(); $("mSound").textContent = soundOn ? "🔊 Звук" : "🔇 Звук"; $("hSound").textContent = soundOn ? "🔊" : "🔇"; $("mStars").textContent = `★ ${totalStars()}`; }
  if (screen === "game" && S) { $("hScore").textContent = S.score; }
  $("hud").style.visibility = S ? "visible" : "hidden";
  draw(now);
  requestAnimationFrame(frame);
}
function start() {
  soundOn = load("sound", true);
  P = Object.assign(newProfile(), load("p", {}));
  resize(); show("menu");
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => dirty = true);
  requestAnimationFrame(t => { last = t; frame(t); });
  yaStart();
}
window.__cat = { get S() { return S; }, get P() { return P; }, play, fire, ability, loadCat, LV };
start();
