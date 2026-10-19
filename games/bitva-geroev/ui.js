// =====================================================================
//  Экраны: арена, герои, рейтинг, бой, окна
// =====================================================================
let view = "arena", sheetHero = null, replacing = false;
const fmtT = ms => { const s = Math.ceil(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), ss = s % 60; return h ? `${h} ч ${m} мин` : m ? `${m}:${String(ss).padStart(2, "0")}` : `${ss} с`; };
let toastT = 0;
function toast(t) { const el = $("toast"); el.textContent = t; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => el.hidden = true, 2200); }
function adReward(cb) {   // ролик за награду: в версии для Яндекса — через SDK
  if (YA.sdk) return yaRewarded(cb);
  toast("Здесь будет ролик (в версии для Яндекса)"); cb();
}
const heroImg = (id, cls = "") => `<img class="pix ${cls}" src="${heroURL(id)}" alt="${HEROES[id].name}">`;
// ---- верх
function renderTop() {
  $("gold").textContent = G.gold; $("troph").textContent = G.trophies; $("pname").textContent = G.name;
}
// ---- арена
function renderArena() {
  const k = leagueOf(G.trophies), L = LEAGUES[k], N = LEAGUES[k + 1];
  const pr = N ? (G.trophies - L.min) / (N.min - L.min) : 1;
  $("league").innerHTML = `<div class="shield" style="--c:${L.col}">${k + 1}</div><div class="lgtext"><b>${L.name}</b><div class="bar"><i style="width:${Math.round(pr * 100)}%"></i></div><small>${N ? `🏆 ${G.trophies} / ${N.min} до «${N.name}»` : `🏆 ${G.trophies}`}</small></div>`;
  $("teamrow").innerHTML = formation(myTeam()).map(([id, l]) => `<div class="tm" data-hero="${id}" style="--r:${RAR[HEROES[id].rar].col}">${heroImg(id)}<span class="lv">${l}</span></div>`).join("") + `<div class="pow">Сила<br><b>${teamPower(myTeam())}</b></div>`;
  const gl = G.gift + GIFT_EVERY - Date.now();
  $("gift").innerHTML = gl <= 0 ? `<span>🎁 Подарок готов!</span><button class="btn green" data-act="gift">Забрать</button>` : `<span>🎁 Следующий подарок через ${fmtT(gl)}</span>`;
  $("chests").innerHTML = G.chests.map((c, i) => {
    if (!c) return `<div class="chest empty"><span>Пусто</span></div>`;
    const C = CHESTS[c.type], left = chestLeft(c);
    const body = left === null ? `<small>${fmtT(C.time * 1000)}</small><b>Открыть</b>` : left > 0 ? `<small>⏳ ${fmtT(left)}</small><b class="ad">▶ Сразу</b>` : `<b class="ready">Открыть!</b>`;
    return `<button class="chest ${left === 0 ? "glow" : ""}" data-chest="${i}" style="--c:${C.col}"><canvas class="pix chcv" data-ch="${c.type}" width="20" height="16"></canvas>${body}</button>`;
  }).join("");
  document.querySelectorAll("canvas[data-ch]").forEach(cv => drawChest(cv, cv.dataset.ch));
  $("tutA").hidden = !(G.tut === 0 || (G.tut === 1 && G.chests.some(c => c)));
  $("tutA").textContent = G.tut === 0 ? "Жми «В бой!» — герои дерутся сами. Побеждай и получай сундуки." : "Нажми на сундук: он откроется через пару минут. В нём золото и карты героев.";
}
function drawChest(cv, type) {
  const g = cv.getContext("2d"), C = CHESTS[type], dark = "#5a3a1a";
  g.clearRect(0, 0, 20, 16);
  g.fillStyle = "#2a1a10"; g.fillRect(1, 3, 18, 13); g.fillStyle = C.col; g.fillRect(2, 4, 16, 11);
  g.fillStyle = dark; g.fillRect(2, 8, 16, 1); g.fillStyle = "rgba(255,255,255,0.35)"; g.fillRect(2, 4, 16, 1);
  g.fillStyle = "#f2c740"; g.fillRect(9, 7, 2, 4); g.fillStyle = "#2a1a10"; g.fillRect(9, 9, 2, 1);
  g.fillStyle = type === "gold" ? "#ffffff" : "#f2c740"; g.fillRect(2, 4, 1, 11); g.fillRect(17, 4, 1, 11);
}
// ---- герои
function renderHeroes() {
  $("hteam").innerHTML = G.team.map(id => `<div class="tm" data-hero="${id}" style="--r:${RAR[HEROES[id].rar].col}">${heroImg(id)}<span class="lv">${G.heroes[id].lvl}</span></div>`).join("");
  $("hgrid").innerHTML = HERO_IDS.map(id => {
    const h = HEROES[id], s = G.heroes[id], need = NEED_CARDS[s.lvl - 1] || 1;
    return `<button class="hcard ${s.have ? "" : "locked"} ${G.team.includes(id) ? "inteam" : ""}" data-hero="${id}" style="--r:${RAR[h.rar].col}">
      ${canUpgrade(id) ? `<span class="up">▲</span>` : ""}${gearHTML(id)}${heroImg(id)}<b>${h.name}</b>
      ${s.have ? `<span class="lvl">Ур. ${s.lvl}</span><span class="cbar"><i style="width:${Math.min(100, s.cards / need * 100)}%"></i><em>${s.lvl >= MAXLVL ? "МАКС" : `${s.cards}/${need}`}</em></span>` : `<span class="lvl">Найди в сундуке</span>`}</button>`;
  }).join("");
  $("tutH").hidden = !(G.tut === 2);
}
function renderSheet() {
  const id = sheetHero, h = HEROES[id], s = G.heroes[id], m = mult(s.lvl), m2 = mult(s.lvl + 1), max = s.lvl >= MAXLVL;
  const nc = NEED_CARDS[s.lvl - 1], ng = NEED_GOLD[s.lvl - 1], inTeam = G.team.includes(id);
  $("sheetBody").innerHTML = `<div class="shead" style="--r:${RAR[h.rar].col}">${heroImg(id, "big")}<div><h2>${h.name}</h2><div class="rar" style="color:${RAR[h.rar].col}">${RAR[h.rar].name} · ${h.role}</div><div>${s.have ? `Уровень <b>${s.lvl}</b>` : "Ещё не найден"}</div></div></div>
    <div class="stats"><div>❤ Здоровье <b>${Math.round(h.hp * m * (1 + gearOf(id).hp))}</b>${!max && s.have ? `<em> → ${Math.round(h.hp * m2 * (1 + gearOf(id).hp))}</em>` : ""}</div><div>⚔ Атака <b>${Math.round(h.atk * m * (1 + gearOf(id).atk))}</b>${!max && s.have ? `<em> → ${Math.round(h.atk * m2 * (1 + gearOf(id).atk))}</em>` : ""}</div><div>⏱ Удар раз в <b>${h.cd} с</b></div><div>${h.melee ? "Ближний бой" : "Бьёт издалека"}</div></div>
    ${s.have ? `<div class="gearrow">${["w", "p"].map(sl => { const v = (s.gear || {})[sl], ch = sl === "w" ? "weapon" : "potion"; return `<div>${v ? `<img class="pix" src="${wURL(ch + v)}" alt=""><span><b>${WCHAINS[ch].items[v - 1]}</b><br>+${sl === "w" ? v * 6 + "% атаки" : v * 7 + "% здоровья"}</span>` : `<span class="hint">${sl === "w" ? "Оружие" : "Зелье"}: пусто — собери в мастерской</span>`}</div>`; }).join("")}</div>` : ""}
    <div class="abil"><b>✨ ${h.abil}</b><br>${h.adesc}. Срабатывает, когда наполнится жёлтая полоска.</div>
    ${replacing ? `<div class="repl"><b>Кого заменить?</b><div class="row">${G.team.map(t => `<button class="tm" data-swap="${t}" style="--r:${RAR[HEROES[t].rar].col}">${heroImg(t)}</button>`).join("")}</div></div>` : ""}
    <div class="sbtns">${s.have && !max ? `<button class="btn ${canUpgrade(id) ? "green" : ""}" data-act="upgrade" ${canUpgrade(id) ? "" : "disabled"}>Улучшить · ${ng} 🪙 · ${s.cards}/${nc} карт</button>` : ""}
    ${s.have ? (inTeam ? `<button class="btn" disabled>В отряде</button>` : `<button class="btn orange" data-act="toteam">В отряд</button>`) : ""}
    <button class="btn" data-act="closesheet">Закрыть</button></div>`;
}
// ---- рейтинг
function renderTop100() {
  yaFetchTop();
  if (yaTop && yaTop.length) { $("rank").innerHTML = yaTop.map(p => `<div class="rrow ${p.me ? "me" : ""}"><span class="rn">${p.rank}</span><span class="shield s" style="--c:${LEAGUES[leagueOf(p.t)].col}"></span><span class="rname">${p.name}${p.me ? " (ты)" : ""}</span><b>🏆 ${p.t}</b></div>`).join(""); return; }
  const list = []; for (let i = 0; i < 40; i++) list.push({ name: NICKS[(i + G.seed) % NICKS.length], t: Math.round(3200 * (1 - i / 40) ** 1.6 + hsh(i, G.seed, 1) * 40), me: false });
  list.push({ name: G.name + " (ты)", t: G.trophies, me: true }); list.sort((a, b) => b.t - a.t);
  $("rank").innerHTML = list.map((p, i) => `<div class="rrow ${p.me ? "me" : ""}"><span class="rn">${i + 1}</span><span class="shield s" style="--c:${LEAGUES[leagueOf(p.t)].col}"></span><span class="rname">${p.name}</span><b>🏆 ${p.t}</b></div>`).join("");
  const me = document.querySelector(".rrow.me"); if (me) me.scrollIntoView({ block: "center" });
}
// ---- бой
const bcv = $("bcv"), bg = bcv.getContext("2d"), K = 3;
bcv.width = AW * K; bcv.height = AH * K;
function openBattle() {
  yaGameplay(true);
  if (G.team.length < 4) return;
  const enemy = makeEnemy(); startBattle(enemy);
  $("bme").innerHTML = `<b>${G.name}</b><small>Сила ${teamPower(myTeam())}</small>`;
  $("bfoe").innerHTML = `<b>${enemy.name}</b><small>Сила ${teamPower(enemy.team)} · 🏆 ${enemy.trophies}</small>`;
  $("bspeed").textContent = "×" + B.speed;
  $("battle").hidden = false; $("result").hidden = true; B.shown = false; lastT = performance.now();
  sfx(SND.magic);
}
function drawBattle(now) {
  const t = now / 1000, g = bg;
  g.setTransform(K, 0, 0, K, 0, 0); g.imageSmoothingEnabled = false;
  if (B.shake) g.translate(rnd(-1.5, 1.5), rnd(-1.5, 1.5));
  g.drawImage(arenaBg(), 0, 0); drawCrowd(g, t, B.over);
  const order = [...B.units].sort((a, b) => a.y - b.y);
  for (const u of order) {
    const flip = u.side === 1, dir = flip ? -1 : 1;
    const a = u.dead ? Math.max(0, 1 - u.deadT * 1.5) : 1; if (a <= 0) continue;
    g.globalAlpha = a;
    g.fillStyle = "rgba(0,0,0,0.18)"; g.beginPath(); g.ellipse(u.x, u.y, 9, 3, 0, 0, Math.PI * 2); g.fill();
    if (!u.dead) { g.strokeStyle = u.side ? "rgba(255,80,80,0.8)" : "rgba(80,160,255,0.85)"; g.lineWidth = 1; g.beginPath(); g.ellipse(u.x, u.y, 10, 3.5, 0, 0, Math.PI * 2); g.stroke(); }
    const lp = u.lunge > 0 ? Math.sin((1 - u.lunge / 0.25) * Math.PI) : 0, bob = u.dead || u.stun > 0 ? 0 : Math.round(Math.sin(t * 5 + u.slot * 1.7) * 0.6);
    const x = Math.round(u.x + dir * lp * 14 - SW / 2), y = Math.round(u.y - SH + 3 + bob + (u.dead ? u.deadT * 10 : 0));
    const f = u.lunge > 0 || u.cast > 0 ? 1 : 0;
    g.drawImage(heroSprite(u.id, f, flip), x, y);
    if (u.hit > 0.1) { g.globalAlpha = a * 0.75; g.drawImage(heroSprite(u.id, f, flip, "#ffffff"), x, y); g.globalAlpha = a; }
    if (u.rage > 0) { g.globalAlpha = a * (0.3 + 0.2 * Math.sin(t * 20)); g.drawImage(heroSprite(u.id, f, flip, "#ff3a2a"), x, y); g.globalAlpha = a; }
    if (u.stun > 0) { g.fillStyle = "#ffe060"; for (let k = 0; k < 3; k++) { const ang = t * 6 + k * 2.1; g.fillRect(u.x + Math.cos(ang) * 6 - 1, u.y - SH - 1 + Math.sin(ang) * 2, 2, 2); } }
    if (u.shield > 0) { g.strokeStyle = `rgba(140,210,255,${0.5 + 0.2 * Math.sin(t * 6)})`; g.lineWidth = 1; g.beginPath(); g.ellipse(u.x, u.y - 11, 11, 14, 0, 0, Math.PI * 2); g.stroke(); }
    if (!u.dead) {
      const bx = u.x - 10, by = u.y - SH - 2;
      g.fillStyle = "#1e1a2a"; g.fillRect(bx - 0.5, by - 0.5, 21, 4);
      g.fillStyle = u.side ? "#ff4a4a" : "#4ad86a"; g.fillRect(bx, by, 20 * u.hp / u.maxhp, 2);
      if (u.shield > 0) { g.fillStyle = "#cfeaff"; g.fillRect(bx, by, Math.min(20, 20 * u.shield / u.maxhp), 1); }
      g.fillStyle = u.en >= 100 ? (Math.sin(t * 15) > 0 ? "#fff6a0" : "#ffd02a") : "#ffd02a"; g.fillRect(bx, by + 2.5, 20 * u.en / 100, 1);
      g.font = "700 5px Rubik, sans-serif"; g.textAlign = "center"; g.fillStyle = "#1e1a2a"; g.fillRect(bx - 6, by - 1, 6, 6); g.fillStyle = "#ffffff"; g.fillText(u.lvl, bx - 3, by + 3.5);
    }
    g.globalAlpha = 1;
  }
  for (const p of B.proj) {
    const k = Math.min(1, p.t / p.dur), arc = p.kind === "arrow" ? Math.sin(k * Math.PI) * 10 : 0;
    const x = p.x + (p.tx - p.x) * k, y = p.y + (p.ty - p.y) * k - arc;
    if (p.kind === "arrow") { const dx = p.tx - p.x, ang = Math.atan2((p.ty - p.y) / 3 - Math.cos(k * Math.PI) * 10, dx); g.save(); g.translate(x, y); g.rotate(ang); g.fillStyle = "#8a5a2a"; g.fillRect(-5, -0.5, 8, 1); g.fillStyle = "#e8eef8"; g.fillRect(3, -1, 2, 2); g.fillStyle = "#ffffff"; g.fillRect(-6, -1, 2, 2); g.restore(); }
    else { const big = p.kind === "fireball" ? 5 : 2.5, col = { fire: "#ff7a1a", fireball: "#ff5a1a", ice: "#8ae8ff", holy: "#fff6a0" }[p.kind];
      g.fillStyle = col; g.beginPath(); g.arc(x, y, big, 0, Math.PI * 2); g.fill(); g.fillStyle = "#ffffff"; g.beginPath(); g.arc(x, y, big * 0.45, 0, Math.PI * 2); g.fill();
      g.globalAlpha = 0.4; g.fillStyle = col; g.beginPath(); g.arc(x - (p.tx - p.x) * 0.04, y, big * 0.8, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1; }
  }
  for (const fl of B.flashes) { const k = fl.t / 0.5; g.strokeStyle = fl.col; g.globalAlpha = 1 - k; g.lineWidth = 2; g.beginPath(); g.arc(fl.x, fl.y, 4 + k * (fl.big ? 26 : 16), 0, Math.PI * 2); g.stroke(); g.globalAlpha = 1; }
  g.textAlign = "center";
  for (const fl of B.floats) { const k = fl.t / 0.9; g.font = `800 ${fl.big ? 8 : 6.5}px Rubik, sans-serif`; g.globalAlpha = 1 - Math.max(0, k - 0.6) / 0.4; g.lineWidth = 2; g.strokeStyle = "#1e1a2a"; g.strokeText(fl.text, fl.x, fl.y - k * 12); g.fillStyle = fl.col; g.fillText(fl.text, fl.x, fl.y - k * 12); g.globalAlpha = 1; }
  if (B.banner) { const k = B.banner.t; const sc = Math.min(1, k * 5); g.save(); g.translate(AW / 2, 22); g.scale(sc, sc); g.font = "800 12px Rubik, sans-serif"; g.lineWidth = 3; g.strokeStyle = "#1e1a2a"; g.globalAlpha = Math.min(1, (1.1 - k) * 4); g.strokeText(B.banner.text, 0, 0); g.fillStyle = B.banner.side === 1 ? "#ff8a7a" : "#ffe060"; g.fillText(B.banner.text, 0, 0); g.restore(); g.globalAlpha = 1; }
  // таймер
  g.font = "700 6px Rubik, sans-serif"; g.fillStyle = "rgba(30,26,42,0.6)"; g.fillRect(AW / 2 - 12, 2, 24, 8); g.fillStyle = "#fff"; g.fillText(Math.max(0, Math.ceil(75 - B.time)) + " с", AW / 2, 8.5);
}
function showResult() {
  yaGameplay(false);
  const r = finishBattle(); B.shown = true; B.r = r;
  sfx(r.win ? SND.win : SND.lose);
  $("result").hidden = false;
  $("resBody").innerHTML = `<h1 class="${r.win ? "w" : "l"}">${r.win ? "ПОБЕДА!" : "Поражение"}</h1>
    <div class="rew"><span>🏆 ${r.trophies > 0 ? "+" : ""}${r.trophies}</span><span>🪙 +<b id="resGold">${r.gold}</b></span></div>
    ${r.chest ? `<div class="rchest"><canvas class="pix chcv big" id="resChest" width="20" height="16"></canvas><div>${CHESTS[r.chest].name}!</div></div>` : r.win ? `<div class="hint">Все места под сундуки заняты — открой старые.</div>` : ""}
    ${r.newLeague !== null ? `<div class="newlg" style="--c:${LEAGUES[r.newLeague].col}">Новая лига: <b>${LEAGUES[r.newLeague].name}</b>!</div>` : ""}
    ${!r.win ? `<div class="hint">Улучши героев во вкладке «Герои» — и снова в бой.</div>` : ""}
    <div class="sbtns">${r.win ? `<button class="btn green" data-act="x2">▶ Удвоить золото</button>` : ""}<button class="btn orange" data-act="closeres">Дальше</button></div>`;
  if (r.chest) drawChest($("resChest"), r.chest);
}
// ---- сундук открыт
function showChest(r) {
  sfx(SND.chest);
  $("chestBody").innerHTML = `<h2>${CHESTS[r.type || "wood"] ? CHESTS[r.type].name : "Подарок"}</h2><div class="rew"><span>🪙 +${r.gold}</span></div>
    <div class="cards">${Object.entries(r.got).map(([id, n]) => `<div class="cardgot" style="--r:${RAR[HEROES[id].rar].col}">${r.fresh.includes(id) ? `<span class="new">НОВЫЙ!</span>` : ""}${heroImg(id)}<b>${HEROES[id].name}</b><span>+${n} карт</span></div>`).join("")}</div>
    <button class="btn orange" data-act="closechest">Забрать</button>`;
  $("chestWin").hidden = false;
  if (G.tut === 1) G.tut = 2;
}
// ---- нажатия
document.addEventListener("click", e => {
  const b = e.target.closest("button, [data-hero]"); if (!b) return;
  const d = b.dataset;
  if (d.tab) { view = d.tab; replacing = false; sfx(SND.click); }
  else if (d.swap) { const i = G.team.indexOf(d.swap); G.team[i] = sheetHero; replacing = false; saveGame(); sfx(SND.up); toast(`${HEROES[sheetHero].name} в отряде`); }
  else if (d.hero) { sheetHero = d.hero; replacing = false; $("sheet").hidden = false; sfx(SND.click); }
  else if (d.chest !== undefined) {
    const i = +d.chest, c = G.chests[i], left = chestLeft(c);
    if (left === null) { if (anyUnlocking()) { toast("Открывается другой сундук — подожди или посмотри ролик"); return; } c.openAt = Date.now() + CHESTS[c.type].time * 1000; saveGame(); sfx(SND.click); }
    else if (left > 0) adReward(() => { c.openAt = Date.now(); saveGame(); showChest(openChest(i)); dirty = true; });
    else showChest(openChest(i));
  }
  else if (d.act === "fight" || b.id === "fight") { sfx(SND.click); openBattle(); }
  else if (d.act === "gift") { G.gift = Date.now(); G.gold += 20; const ids = HERO_IDS.filter(id => HEROES[id].rar !== "epic"), id = pick(ids), fresh = G.heroes[id].have ? [] : [id]; addCards(id, 3); saveGame(); showChest({ type: null, gold: 20, got: { [id]: 3 }, fresh }); }
  else if (d.act === "upgrade") { if (upgrade(sheetHero)) { sfx(SND.up); toast(`${HEROES[sheetHero].name}: уровень ${G.heroes[sheetHero].lvl}!`); if (G.tut === 2) G.tut = 3; saveGame(); } }
  else if (d.act === "toteam") { replacing = true; sfx(SND.click); }
  else if (d.act === "closesheet") { $("sheet").hidden = true; replacing = false; }
  else if (d.act === "x2") adReward(() => { G.gold += B.r.gold; saveGame(); $("resGold").textContent = B.r.gold * 2; b.disabled = true; sfx(SND.coin); dirty = true; });
  else if (d.act === "closeres") { $("battle").hidden = true; B = null; sfx(SND.click); yaInterstitial(() => {}); }
  else if (d.act === "closechest") { $("chestWin").hidden = true; sfx(SND.coin); }
  else if (d.act === "wsell") wsSell();
  else if (d.act === "wequip") { showEquip(); return; }
  else if (d.equip) wsEquip(d.equip);
  else if (d.worder !== undefined) wsDeliver(+d.worder);
  else if (d.act === "wsad") adReward(() => { G.ws.energy += 20; saveGame(); dirty = true; sfx(SND.coin); });
  else if (d.quest !== undefined) questClaim(+d.quest);
  else if (b.id === "bspeed") { B.speed = B.speed === 1 ? 2 : 1; save("speed", B.speed); b.textContent = "×" + B.speed; }
  else if (b.id === "gear") $("settings").hidden = false;
  else if (d.act === "closeset") $("settings").hidden = true;
  else if (b.id === "sound") { soundOn = !soundOn; save("sound", soundOn); if (soundOn) { audio(); startMusic(); } }
  else if (b.id === "music") { musicOn = !musicOn; save("music", musicOn); }
  else if (b.id === "restart") { if (d.sure) { newGame(); d.sure = ""; b.textContent = "Начать заново"; $("settings").hidden = true; } else { d.sure = 1; b.textContent = "Точно? Нажми ещё раз"; return; } }
  else return;
  dirty = true;
});
// ---- главный цикл
let lastT = 0, lastSec = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
  if (B && !$("battle").hidden) {
    stepBattle(dt * B.speed);
    if (B.over) { B.overT += dt; if (B.overT > 1.2 && !B.shown) showResult(); }
    drawBattle(now);
  }
  const sec = Math.floor(now / 1000);
  if (sec !== lastSec) { lastSec = sec; if (view === "arena" || view === "ws") dirty = true; }
  if (view === "ws" && G.ws) wsDraw(now);
  if (dirty) {
    dirty = false; renderTop();
    document.querySelectorAll(".view").forEach(v => v.hidden = v.dataset.view !== view);
    document.querySelectorAll(".tabs button").forEach(b => b.classList.toggle("on", b.dataset.tab === view));
    if (view === "arena") { renderArena(); renderQuests(); }
    if (view === "ws") { renderWs(); wsResize(); }
    if (view === "heroes") renderHeroes();
    if (view === "top") renderTop100();
    if (!$("sheet").hidden) renderSheet();
    $("hbadge").hidden = !HERO_IDS.some(canUpgrade);
    questsFresh(); $("abadge").hidden = !G.daily.q.some(q => !q.claimed && q.n >= QUESTS[q.id].goal) && !G.chests.some(c => c && chestLeft(c) === 0);
    $("sound").textContent = soundOn ? "🔊 Звук вкл" : "🔇 Звук выкл"; $("music").textContent = musicOn ? "🎵 Музыка вкл" : "🎵 Музыка выкл";
  }
  requestAnimationFrame(frame);
}
function start() {
  soundOn = load("sound", true); musicOn = load("music", true);
  const s = load("game", null);
  if (s && s.heroes && s.team) G = s; else newGame();
  if (!G.ws) G.ws = wsNew();
  new ResizeObserver(wsResize).observe(wcv.parentElement);
  for (const id of HERO_IDS) if (!G.heroes[id]) G.heroes[id] = { lvl: 1, cards: 0, have: false };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => dirty = true);
  requestAnimationFrame(t => { lastT = t; frame(t); });
  yaStart();
}
window.__arena = { get G() { return G; }, get B() { return B; }, openBattle, openChest, upgrade, newGame, set view(v) { view = v; dirty = true; } };
start();
