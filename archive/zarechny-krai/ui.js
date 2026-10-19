// =====================================================================
//  Панель управления, нажатия по карте, разговоры, запуск
// =====================================================================
function yieldsChips(y) { return `<span class="yl f">${ic("food")}хлеб ${y.f}</span><span class="yl w">${ic("wood")}дерево ${y.w}</span><span class="yl s">${ic("stone")}камень ${y.s}</span><span class="yl m">${ic("money")}деньги ${y.m}</span>`; }
function siteAt(x, y) { return G.sites.find(s => s.alive && s.x === x && s.y === y); }
function siteName(s) { return s.kind === "ruin" ? "Старое городище" : s.kind === "lair" ? "Логово разбойников" : FAC[s.kind].site; }
function tileText(x, y) {
  const i = idx(x, y);
  if (!G.explored[i]) return `<div class="hint">Неведомая земля. Пошли туда отряд, чтобы разведать.</div>`;
  const tt = G.t[i], r = G.res[i], s = siteAt(x, y), owner = G.cities.find(c => c.worked.includes(i) || (c.x === x && c.y === y));
  let h = `<div class="tname">${TERR[tt].name}${r ? ` · ${RES[r].name}` : ""}${G.river[i] ? " · река" : ""}</div><div class="yrow">${yieldsChips(tileYield(i, owner))}</div>`;
  if (s) { h += `<div class="site"><b>${siteName(s)}.</b> `; if (FAC[s.kind]) { const f = G.fac[s.kind]; h += `${FAC[s.kind].wants} ${f.met ? `Отношение: ${Math.round(f.rel)} — ${relWord(f.rel)}.` : "Ты с ним ещё не встречался: подведи отряд поближе."}`; } else if (s.kind === "lair") h += "Здесь прячется ватага Лихо. Дружина может разгромить логово (бросок кубика)."; else h += "Отправь сюда отряд — вдруг что найдётся."; h += `</div>`; }
  if (owner) h += `<div class="hint">${owner.x === x && owner.y === y ? "Город" : "Обрабатывает город"} ${owner.name}.</div>`;
  return h;
}
function costText(d) { const p = []; if (d.f) p.push(`хлеб ${d.f}`); if (d.w) p.push(`дерево ${d.w}`); if (d.s) p.push(`камень ${d.s}`); if (d.m) p.push(`${d.m} мон.`); return p.join(", "); }
function orderWord(o) { return o >= 75 ? "довольны" : o >= 50 ? "спокойны" : o >= 30 ? "ворчат" : "бунтуют"; }
function renderAct() {
  const el = $("act"), u = sel && sel.unit ? G.units.find(x => x.id === sel.unit) : null, c = sel && sel.city ? G.cities.find(x => x.id === sel.city) : null;
  if (u) {
    const d = UNITS[u.kind], here = canFound(u.x, u.y);
    let h = `<div class="card"><div class="ctitle">${d.name}</div><div class="hint">Ходы: <b>${u.mv}</b> из ${d.mv}${u.kind === "settlers" ? ` · хлеба в обозе на <b class="${u.food <= 2 ? "down" : ""}">${u.food}</b> мес.` : ""}${u.path.length ? ` · идут к цели, ещё ${u.path.length} кл.` : ""}</div>`;
    h += tileText(u.x, u.y);
    if (u.kind === "settlers") {
      const sc = siteScore(u.x, u.y), st = stars(sc);
      h += `<div class="stars">Место: ${"★".repeat(st)}${"☆".repeat(5 - st)}</div>`;
      h += `<button class="wide go" data-do="found" ${here ? "disabled" : ""}>${here ? here : "Заложить город здесь"}</button>`;
    } else h += `<div class="hint">Наведи дружину на логово разбойников, чтобы атаковать. Против Змея нужна удача: кубик 20 граней, сила дружины +5.</div>`;
    h += `<div class="bar"><button data-do="skip">Ждать до следующего месяца</button><button data-do="center">Показать на карте</button></div>`;
    h += `<div class="hint">Нажми на клетку карты — отряд пойдёт туда.</div></div>`;
    el.innerHTML = h;
  } else if (c) {
    const L = c.last || calcCity(c), pct = Math.min(100, Math.round(c.food / L.need * 100));
    let h = `<div class="card"><div class="ctitle">${c.name} · ${c.pop} ${c.pop === 1 ? "двор" : c.pop < 5 ? "двора" : "дворов"}</div>`;
    h += `<div class="meter"><span>Народ ${orderWord(c.order)}</span><div class="mbar"><i style="width:${c.order}%;background:${c.order < 30 ? "#c8402e" : c.order < 50 ? "#d8a030" : "#4fbf4f"}"></i></div><b>${Math.round(c.order)}</b></div>`;
    h += `<div class="meter"><span>Хлеб ${Math.max(0, Math.floor(c.food))}/${L.need}</span><div class="mbar"><i style="width:${pct}%;background:#e0b040"></i></div><b class="${L.net < 0 ? "down" : "up"}">${L.net >= 0 ? "+" : ""}${L.net}</b></div>`;
    h += `<div class="stock"><span>${ic("wood")}Дерево <b>${Math.floor(c.wood)}</b> <i class="${L.w - L.heat < 0 ? "down" : "up"}">${L.w - L.heat >= 0 ? "+" : ""}${L.w - L.heat}</i></span><span>${ic("stone")}Камень <b>${Math.floor(c.stone)}</b> <i class="up">+${L.s}</i></span><span>${ic("money")}В казну <b class="up">+${L.m + L.tax}</b></span></div>`;
    if (L.net < 0) h += `<div class="warn">Хлеба не хватает: скоро голод. Поставь упор на хлеб или построй мельницу.</div>`;
    if (seasonOf() === 3 && L.w - L.heat < 0) h += `<div class="warn">Зима: дрова кончаются, люди мёрзнут.</div>`;
    if (c.order < 30) h += `<div class="warn">Бунт: стройка стоит. Снизь подать, построй церковь или баню.</div>`;
    h += `<div class="label">Упор работы</div><div class="seg">${[["bal", "Поровну"], ["food", "Хлеб"], ["wood", "Лес"], ["stone", "Камень"], ["money", "Деньги"]].map(([k, n]) => `<button data-focus="${k}" class="${c.focus === k ? "on" : ""}">${n}</button>`).join("")}</div>`;
    if (c.build) { const d = BUILD[c.build.key] || UNITS[c.build.key]; h += `<div class="label">Строится</div><div class="building">${d.name} — ещё ${c.build.left} мес.</div>`; }
    else {
      h += `<div class="label">Что строить</div><div class="blist">`;
      for (const k of [...Object.keys(UNITS), ...Object.keys(BUILD)]) {
        if (BUILD[k] && c.b[k]) continue;
        const d = BUILD[k] || UNITS[k], why = canStart(c, k);
        h += `<div class="bi"><div>${ic(k, "big")}<b>${d.name}</b> <span class="cost">${costText(d)} · ${d.turns} мес.</span><div class="hint">${d.desc}</div></div><button data-build="${k}" ${why ? "disabled" : ""} title="${why}">${why ? why : "Строить"}</button></div>`;
      }
      h += `</div>`;
    }
    if (G.cities.length > 1) {   // обоз в другой город
      const tgt = G.cities.filter(x => x !== c), cur = tgt.find(x => x.id === c.sendTo) || tgt[0];
      h += `<div class="label">Обоз в другой город — ${CONVOY_AMT} ед. за ${CONVOY_COST} монет</div><div class="seg2">${tgt.map(x => `<button data-sendto="${x.id}" class="${x === cur ? "on" : ""}">${x.name} · ${convoyTime(c, x)} мес.</button>`).join("")}</div>`;
      h += `<div class="seg3"><button data-send="food" ${c.food < CONVOY_AMT ? "disabled" : ""}>Хлеб</button><button data-send="wood" ${c.wood < CONVOY_AMT ? "disabled" : ""}>Дерево</button><button data-send="stone" ${c.stone < CONVOY_AMT ? "disabled" : ""}>Камень</button></div>`;
      const inc = (G.convoys || []).filter(v => v.to === c.id), out = (G.convoys || []).filter(v => v.from === c.id);
      if (inc.length) h += `<div class="hint">Идут сюда: ${inc.map(v => `${v.amt} ${RESN[v.res]} (${v.left} мес.)`).join(", ")}</div>`;
      if (out.length) h += `<div class="hint">Отправлены: ${out.map(v => `${v.amt} ${RESN[v.res]} → ${(G.cities.find(x => x.id === v.to) || {}).name}`).join(", ")}</div>`;
    }
    const built = Object.keys(c.b); if (built.length) h += `<div class="label">Постройки</div><div class="chips">${built.map(k => `<span class="chip">${BUILD[k].name}</span>`).join("")}</div>`;
    h += `</div>`;
    el.innerHTML = h;
  } else if (sel && sel.tile) el.innerHTML = `<div class="card">${tileText(sel.tile.x, sel.tile.y)}</div>`;
  else el.innerHTML = `<div class="card hint">Нажми на отряд, город или клетку карты.</div>`;
}
function renderCities() {
  $("cities").innerHTML = G.cities.length ? G.cities.map(c => { const L = c.last || calcCity(c); return `<button class="crow" data-city="${c.id}"><b>${c.name}</b><span>${c.pop} дв. · хлеб ${L.net >= 0 ? "+" : ""}${L.net} · народ ${orderWord(c.order)}${c.build ? ` · строит: ${(BUILD[c.build.key] || UNITS[c.build.key]).name.toLowerCase()}` : ""}</span></button>`; }).join("") : `<div class="hint">Городов пока нет. Веди обоз и закладывай первый.</div>`;
  $("units").innerHTML = G.units.map(u => `<button class="crow" data-unit="${u.id}"><b>${UNITS[u.kind].name}</b><span>${TERR[G.t[idx(u.x, u.y)]].name} · ходы ${u.mv}${u.kind === "settlers" ? ` · хлеба на ${u.food} мес.` : ""}</span></button>`).join("") || `<div class="hint">Отрядов нет.</div>`;
}
function renderFac() {
  $("fac").innerHTML = Object.keys(FAC).map(k => {
    const f = G.fac[k], s = G.sites.find(x => x.kind === k && x.alive);
    if (f.absent && !f.met) return "";
    const known = f.met || (s && G.explored[idx(s.x, s.y)]);
    return `<div class="fac"><canvas class="fava" data-ava="${k}" width="100" height="120"></canvas><div><b>${FAC[k].name}</b>${known ? "" : " <span class='hint'>(ходят слухи)</span>"}<div class="hint">${FAC[k].wants}</div>${f.met ? `<div class="meter"><span>${relWord(f.rel)}</span><div class="mbar"><i style="width:${f.rel}%;background:${f.rel < 25 ? "#c8402e" : f.rel < 60 ? "#d8a030" : "#4fbf4f"}"></i></div><b>${Math.round(f.rel)}</b></div>` : ""}${s && G.explored[idx(s.x, s.y)] ? `<button data-show="${s.x},${s.y}">Показать на карте</button>` : ""}${f.absent ? "<div class='hint'>Больше не тревожит край.</div>" : ""}</div></div>`;
  }).join("");
  document.querySelectorAll("canvas[data-ava]").forEach(cv => drawAvatar(cv, cv.dataset.ava));
}
function renderLog() { $("log").innerHTML = G.log.map(l => `<div class="${l.good ? "up" : "down"}"><span class="hint">${MONTHS[l.t % 12]} ${1 + Math.floor(l.t / 12)} г.</span> ${l.text}</div>`).join("") || `<div class="hint">Летопись пуста.</div>`; }
let lastPanelKey = "";
// подсказки для первых шагов
function tutText() {
  if (load("tutDone", false)) return "";
  if (!G.cities.length) {
    if (!(sel && sel.unit)) return "Нажми на обоз переселенцев на карте.";
    if (!G.flags.moved) return "Теперь нажми на клетку неподалёку — обоз пойдёт туда. Ищи место у реки, где вокруг луга и лес.";
    return "Звёзды над обозом — оценка места. 3–5 звёзд — хорошо: жми «Заложить город здесь». Ходы кончились — жми «Конец месяца».";
  }
  if (!G.flags.built) return "Нажми на свой город и выбери, что строить. Начни с амбара: без запасов зимой голод.";
  if (G.turn < 4) return "Дела сделаны — жми «Конец месяца». Город растёт, когда хлеба хватает. Каждый месяц что-нибудь случается — решай.";
  save("tutDone", true); return "";
}
function renderUI() {
  const inc = G.cities.reduce((a, c) => { const L = c.last || calcCity(c); return a + L.m + L.tax; }, 0);
  $("money").innerHTML = `${ic("money", "gold")}Казна <b>${G.money}</b> <i class="up">+${inc}</i>`;
  $("date").textContent = `${MONTHS[month()]}, ${year()}-й год · ${SEASONS[seasonOf()].name}`;
  const ch = CHAPTERS[Math.min(G.chapter, CHAPTERS.length - 1)];
  $("goal").innerHTML = G.won ? `<b>Летопись завершена!</b> Край освоен за ${G.turn} мес.` : `<b>Глава ${G.chapter + 1}. ${ch.title}:</b> ${ch.goal()}`;
  $("next").disabled = busy || !!G.dialogs.length || G.won || G.lost;
  document.querySelectorAll("#tabs button").forEach(b => b.classList.toggle("on", b.dataset.tab === tab));
  document.querySelectorAll(".tabsec").forEach(s => s.hidden = s.dataset.tab !== tab);
  if (tab === "act") renderAct(); else if (tab === "cities") renderCities(); else if (tab === "fac") renderFac(); else if (tab === "log") renderLog();
  $("taxSeg").querySelectorAll("button").forEach(b => b.classList.toggle("on", +b.dataset.tax === G.tax));
  $("sound").textContent = soundOn ? "Звук вкл" : "Звук выкл"; $("music").textContent = musicOn ? "Музыка вкл" : "Музыка выкл";
  const best = load("best", 0); $("best").textContent = best ? `Рекорд: край освоен за ${best} мес.` : "";
  const tt = tutText(); $("tutText").textContent = tt; $("tutBar").hidden = !tt || !!G.dialogs.length;
  const idle = G.units.filter(u => u.mv > 0 && !u.path.length).length; $("next").classList.toggle("pulse", !idle && !G.dialogs.length);
}
// ---- разговоры и кубик
let shownDlg = null, diceTimer = 0;
function renderDialog() {
  const d = G.dialogs[0], box = $("dlg");
  if (!d) { box.hidden = true; shownDlg = null; return; }
  if (shownDlg === d) return;
  shownDlg = d; box.hidden = false;
  const p = PEOPLE[d.who];
  $("dlgName").textContent = p.name; $("dlgRole").textContent = p.role; $("dlgText").textContent = d.text;
  drawAvatar($("dlgAva"), d.who);
  const bar = $("dlgBtns"); bar.innerHTML = "";
  const dice = $("dice");
  for (const ch of d.choices) {
    const b = document.createElement("button"); b.type = "button"; b.textContent = ch.label;
    b.onclick = () => { G.dialogs.shift(); if (ch.act !== "ok") runChoice(ch); renderDialog(); autoSelect(); saveGame(); dirty = true; };
    bar.appendChild(b);
  }
  if (d.dice) {   // бросок кубика: цифры мелькают, потом выпадает результат
    dice.hidden = false; $("dlgText").style.visibility = "hidden"; bar.style.visibility = "hidden";
    let n = 0; clearInterval(diceTimer);
    sfx(FX.dice);
    diceTimer = setInterval(() => { n++; dice.textContent = n < 14 ? 1 + Math.floor(Math.random() * 20) : d.dice; if (n === 14) sfx(d.dice >= d.need - d.bonus || d.dice === 20 ? FX.win : FX.bad);
      if (n >= 14) { clearInterval(diceTimer); dice.classList.toggle("crit", d.dice === 20 || d.dice <= 3); $("dlgText").style.visibility = ""; bar.style.visibility = ""; bar.lastChild.focus(); } }, 60);
  } else { dice.hidden = true; $("dlgText").style.visibility = ""; bar.style.visibility = ""; bar.lastChild.focus(); }
  sfx(FX[CREATURE_FX[d.who]] || FX.click);
}
// ---- нажатия по карте
let pd = null;
view.addEventListener("pointerdown", e => { pd = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y, moved: false, id: e.pointerId }; view.setPointerCapture(e.pointerId); });
view.addEventListener("pointermove", e => {
  if (!pd || pd.id !== e.pointerId) return;
  const dpr = window.devicePixelRatio || 1, dx = e.clientX - pd.x, dy = e.clientY - pd.y;
  if (Math.hypot(dx, dy) > 7) pd.moved = true;
  if (pd.moved) { cam.x = pd.cx - dx * dpr / Z; cam.y = pd.cy - dy * dpr / Z; clampCam(); }
});
view.addEventListener("pointerup", e => {
  if (!pd) return; const moved = pd.moved; pd = null; if (moved) return;
  const r = view.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
  const sx = cam.x - view.width / (2 * Z), sy = cam.y - view.height / (2 * Z);
  const ax = sx + (e.clientX - r.left) * dpr / Z, ay = sy + (e.clientY - r.top) * dpr / Z;
  tapTile(Math.floor(ax / TS), Math.floor(ay / TS));
});
view.addEventListener("wheel", e => { e.preventDefault(); zoomBy(e.deltaY < 0 ? 1 : -1); }, { passive: false });
function tapTile(x, y) {
  if (!inMap(x, y) || busy || G.dialogs.length) return;
  const selU = sel && sel.unit ? G.units.find(u => u.id === sel.unit) : null;
  const uHere = G.units.filter(u => u.x === x && u.y === y), cHere = G.cities.find(c => c.x === x && c.y === y);
  if (uHere.length && !(selU && uHere.includes(selU))) { sel = { unit: uHere[0].id }; tab = "act"; dirty = true; return; }
  if (selU && uHere.includes(selU)) { if (cHere) { sel = { city: cHere.id }; tab = "act"; } dirty = true; return; }
  if (selU && !cHere) { orderMove(selU, x, y); tab = "act"; dirty = true; return; }
  if (cHere) { sel = { city: cHere.id }; tab = "act"; dirty = true; return; }
  sel = { tile: { x, y } }; tab = "act"; dirty = true;
}
// ---- кнопки панели
document.addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b || !G) return;
  const u = sel && sel.unit ? G.units.find(x => x.id === sel.unit) : null, c = sel && sel.city ? G.cities.find(x => x.id === sel.city) : null;
  if (b.dataset.do === "found" && u) { foundCity(u); checkChapter(); saveGame(); }
  else if (b.dataset.do === "skip" && u) { u.mv = 0; u.path = []; const nx = G.units.find(x => x.mv > 0 && !x.path.length); sel = nx ? { unit: nx.id } : null; if (nx) centerOn(nx.x, nx.y); }
  else if (b.dataset.do === "center" && u) centerOn(u.x, u.y);
  else if (b.dataset.focus && c) { c.focus = b.dataset.focus; assignWork(c); calcCity(c); }
  else if (b.dataset.build && c) { startBuild(c, b.dataset.build); saveGame(); }
  else if (b.dataset.city) { const cc = G.cities.find(x => x.id === +b.dataset.city); sel = { city: cc.id }; tab = "act"; centerOn(cc.x, cc.y); }
  else if (b.dataset.unit) { const uu = G.units.find(x => x.id === +b.dataset.unit); sel = { unit: uu.id }; tab = "act"; centerOn(uu.x, uu.y); }
  else if (b.dataset.show) { const [x, y] = b.dataset.show.split(",").map(Number); centerOn(x, y); sel = { tile: { x, y } }; tab = "act"; }
  else if (b.dataset.tab) tab = b.dataset.tab;
  else if (b.dataset.sendto && c) c.sendTo = +b.dataset.sendto;
  else if (b.dataset.send && c) { const tgt = G.cities.filter(x => x !== c), to = tgt.find(x => x.id === c.sendTo) || tgt[0]; sendConvoy(c, to, b.dataset.send); }
  else if (b.id === "tutSkip") { save("tutDone", true); }
  else if (b.dataset.tax !== undefined) { G.tax = +b.dataset.tax; for (const cc of G.cities) calcCity(cc); }
  else return;
  dirty = true;
});
$("next").onclick = () => endTurn();
$("zin").onclick = () => { zoomBy(1); dirty = true; };
$("zout").onclick = () => { zoomBy(-1); dirty = true; };
$("sound").onclick = () => { soundOn = !soundOn; save("sound", soundOn); if (soundOn) { audio(); startMusic(); } dirty = true; };
$("music").onclick = () => { musicOn = !musicOn; save("music", musicOn); if (musicOn) { audio(); startMusic(); } dirty = true; };
$("goal").onclick = () => $("goal").classList.toggle("open");
let confirmNew = 0;
$("restart").onclick = () => { if (Date.now() - confirmNew < 3000) { newGame(); resizeView(); confirmNew = 0; $("restart").textContent = "Новая игра"; } else { confirmNew = Date.now(); $("restart").textContent = "Точно? Нажми ещё раз"; } };
window.addEventListener("keydown", e => { if (e.code === "Enter" && !G.dialogs.length && document.activeElement === document.body) endTurn(); });
window.addEventListener("resize", resizeView);
// ---- запуск
function frame(now) {
  if (dirty && G) { dirty = false; renderUI(); renderDialog(); }
  draw(now);
  requestAnimationFrame(frame);
}
function start() {
  soundOn = load("sound", true); musicOn = load("music", true);
  const saved = load("game", null);
  if (saved && saved.t && saved.t.length === MW * MH && saved.fac) { G = saved; G.dialogs = G.dialogs || []; busy = false; for (const c of G.cities) calcCity(c); logMsg("Продолжаем летопись.", true); const u = G.units[0] || null, c = G.cities[0]; if (u) { sel = { unit: u.id }; centerOn(u.x, u.y); } else if (c) { sel = { city: c.id }; centerOn(c.x, c.y); } }
  else newGame();
  resizeView(); fogDirty = true; dirty = true;
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { dirty = true; });
  requestAnimationFrame(frame);
}
window.__krai = { get G() { return G; }, endTurn, tapTile, newGame, foundCity, runChoice, startBuild, monthEvents, battle, findPath, get sel() { return sel; }, set sel(v) { sel = v; dirty = true; }, centerOn };
start();
