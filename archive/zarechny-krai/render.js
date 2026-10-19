// =====================================================================
//  Отрисовка: пиксельная карта по сезонам, туман, города, отряды, нечисть
// =====================================================================
const view = $("view"), vx = view.getContext("2d");
let cam = { x: MW * TS / 2, y: MH * TS / 2 }, Z = 4, zoomUser = false, fogDirty = true;
const ART = {};
function px(g, x, y, c) { if (!c) return; g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), 1, 1); }
function rows(g, r, pal, ox, oy) { fromRows((x, y, c) => px(g, x, y, c), r, pal, ox, oy); }
const SPR = {
  tree: ["..OOO..", ".OMLLO.", "OMMMLMO", "ODMMMMO", ".ODDDO.", "...T...", "..STS.."],
  bare: ["T..T..T", ".T.T.T.", "..TTT..", "...T...", "...T...", "...T...", "..STS.."],
  pine: ["..O..", ".OLO.", ".OMO.", "OLMDO", ".OMO.", "OLMDO", "OOTOO", ".STS."],
  hill: ["...OOO...", "..OLLMO..", ".OLLMMDO.", "OLLMMMDDO"],
  iron: [".OOO.", "OGRGO", "ORGRO", "OGRGO", ".OOO."],
  fish: ["...B.B", ".BBBBB", "BWBBB.", ".BBBBB", "...B.B"],
  game: ["T.T.T", ".TTT.", "..T..", ".TTT.", "T...T"],
  salt: ["..W..", ".WWW.", "WWSWW", ".WSW.", "..W.."],
  ruin: ["............", "OO....OO....", "OGO..OGGO...", "OGGO.OGGO.OO", "OGGOOOGGGOGO", "OGGGGGGGGGGO", "OOOOOOOOOOOO"],
  lair: [".....F......", ".....FF.....", ".....O......", "....OTO.....", "...OTTTO....", "..OTTDTTO...", ".OTTTDTTTO..", "OOOOODOOOO..", "........YRY.", ".......ORRRO"],
  leshiy: ["....OOOOO.....", "..OODDMMMOO...", ".ODDMMMLLMMO..", "ODDMMMMMLLMMO.", "ODDMMEMMEMMMO.", "ODDDMMMMMMMDO.", ".ODDDDMMMDDO..", "..OOODDDDOO...", "....OTTTO.....", "....OTTTO.....", "...OTTtTTO....", "..OTT.t.TTO...", ".SSSSSSSSSSS.."],
  yaga: ["....OO.....", "...OSSO....", "..OSSSSO...", ".OOOOOOOO..", ".OWWWWWWO..", ".OWYYWWWO..", ".OWYYWWWO..", ".OOOOOOOO..", "...L..L....", "...L..L....", "..L....L...", "..L....L...", ".LL...LL...", ".SSSSSSS..."],
  kiki: ["...OOOO...", "..OMMMMO..", ".OMMMMMMO.", "OOOOOOOOOO", ".OWWEWEWO.", ".OWWWWWWO.", ".OOOOOOOO.", "R.R..R..R.", "R.R.RR.RR."],
  cave: ["....OOOOO.....", "...OGGGGGO....", "..OGGGGGGGO...", ".OGGOOOOGGGO..", "OGGO....OGGGO.", "OGO..FF..OGGO.", "OGO.FYYF.OGGO.", "OOOOOOOOOOOOO."],
  druzh: ["...OOO...", "..OHHHO..", "..OSSSO..", "..OSESO..", ".OOOOOOO.", "ORROCCCO.", "ORRWCCCOP", "ORROCCCO.", ".OOOOOOO.", "..OB.BO..", "..OB.BO..", "..SS.SS.."],
};
// ---- земля края по сезону
function mapArt(si) {
  if (ART[si] && ART[si].seed === G.seed) return ART[si].cv;
  const cv = document.createElement("canvas"); cv.width = MW * TS; cv.height = MH * TS;
  const g = cv.getContext("2d"), se = SEASONS[si], winter = si === 3, W2 = MW * TS, H2 = MH * TS;
  const im = g.createImageData(W2, H2), d = im.data;
  const landNear = (x, y) => { for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (inMap(x + dx, y + dy) && G.t[idx(x + dx, y + dy)] !== WATER) return true; return false; };
  for (let py = 0; py < H2; py++) for (let pxx = 0; pxx < W2; pxx++) {
    const tx = Math.floor(pxx / TS), ty = Math.floor(py / TS), i = idx(tx, ty), tt = G.t[i];
    let c;
    if (tt === WATER) {
      const lx = pxx % TS, ly = py % TS, edge = (dx, dy) => inMap(tx + dx, ty + dy) && G.t[idx(tx + dx, ty + dy)] !== WATER;
      const nearEdge = (lx < 3 && edge(-1, 0)) || (lx > 12 && edge(1, 0)) || (ly < 3 && edge(0, -1)) || (ly > 12 && edge(0, 1));
      c = winter ? (nearEdge ? "#e8f2fa" : hsh(pxx, py, 4) < 0.04 ? "#ffffff" : "#c4dcee") : nearEdge ? (hsh(pxx, py, 3) < 0.4 ? "#e8f6ff" : "#7cc4f0") : landNear(tx, ty) ? "#5aa8e6" : "#428fd2";
      if (!winter && !nearEdge && hsh(pxx, py, 5) < 0.02) c = "#a8dcfa";
    } else if (tt === MOUNT) c = hsh(pxx, py, 7) < 0.3 ? "#8a8078" : "#9a9088";
    else if (tt === MARSH) c = winter ? (hsh(pxx, py, 8) < 0.5 ? "#e8eef2" : "#c8d0c8") : hsh(pxx, py, 8) < 0.3 ? "#4a5a32" : vnoise(pxx, py, 5, 3) < 0.5 ? "#5a6a3a" : "#66763e";
    else { const n = vnoise(pxx, py, 9, 1) + (hsh(pxx, py, 2) - 0.5) * 0.22; c = hsh(pxx, py, 6) < 0.04 ? se.grass[3] : se.grass[n < 0.38 ? 2 : n < 0.62 ? 1 : 0]; if (tt === PINE && !winter) c = dk(c, -0.12); }
    const col = rgbOf(c), k = (py * W2 + pxx) * 4; d[k] = col[0]; d[k + 1] = col[1]; d[k + 2] = col[2]; d[k + 3] = 255;
  }
  g.putImageData(im, 0, 0);
  const sh = "rgba(30,40,10,0.3)", treePal = se.tree ? { O: dk(se.tree[0], -0.45), D: se.tree[0], M: se.tree[1], L: se.tree[2], T: "#6a4424", S: sh } : null;
  const pinePal = { O: dk(se.pine[0], -0.5), D: se.pine[0], M: se.pine[1], L: se.pine[2], T: "#5a3a20", S: sh };
  for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++) {
    const i = idx(tx, ty), tt = G.t[i], ox = tx * TS, oy = ty * TS, R = rng(i * 31 + G.seed);
    if (tt === MEADOW) {
      if (G.res[i] === "soil") { for (let r = 0; r < 5; r++) for (let k = 0; k < 12; k++) { const x = ox + 2 + k, y = oy + 3 + r * 2; px(g, x, y, winter ? (r % 2 ? "#c8d4e0" : "#f2f6fa") : si === 1 ? (k % 2 ? "#e0b03a" : "#f0c84a") : si === 0 ? (k % 2 ? "#6cc04a" : "#7a4e2c") : (k % 3 ? "#8e5e34" : "#d8b060")); } }
      else for (let k = 0; k < 5; k++) { const x = ox + 1 + R() * 13, y = oy + 2 + R() * 12; if (k < 2 && se.flowers.length) px(g, x, y, se.flowers[k % se.flowers.length]); else { px(g, x, y, se.tuft); px(g, x - 1, y - 1, se.tuft); px(g, x + 1, y - 1, se.tuft); } }
    } else if (tt === FOREST) { for (const [a, b] of [[0, 1], [8, 0], [4, 7], [9, 8]].slice(0, 3 + (R() < 0.5 ? 1 : 0))) rows(g, treePal ? SPR.tree : SPR.bare, treePal || { T: "#5a3a20", S: sh }, ox + a, oy + b); if (si === 0) px(g, ox + 3, oy + 3, "#ffb8d8"); }
    else if (tt === PINE) { for (const [a, b] of [[0, 0], [6, 1], [10, 5], [3, 7]]) rows(g, SPR.pine, pinePal, ox + a, oy + b); }
    else if (tt === HILLS) { const hp = { O: "#4a4030", L: winter ? "#ffffff" : dk(se.grass[0], 0.15), M: winter ? "#dfe6ee" : se.grass[2], D: dk(se.grass[2], -0.3) }; rows(g, SPR.hill, hp, ox + 0, oy + 4); rows(g, SPR.hill, hp, ox + 6, oy + 9); }
    else if (tt === MOUNT) {
      const cx = ox + 8, base = oy + 15, hw = 7.5, ht = 14;
      for (let r = 0; r <= ht; r++) { const y = base - r, half = hw * (1 - r / ht); for (let x = Math.round(cx - half); x <= Math.round(cx + half); x++) { const edge = x === Math.round(cx - half) || x === Math.round(cx + half); px(g, x, y, edge ? "#3e3630" : r > ht * (winter ? 0.3 : 0.6) ? (x < cx ? "#ffffff" : "#d8e2ec") : x < cx ? "#a89e96" : "#6f655f"); } }
    } else if (tt === MARSH) { for (let k = 0; k < 4; k++) { const x = ox + 2 + R() * 11, y = oy + 3 + R() * 9; if (!winter) { px(g, x, y, "#7a9aa8"); px(g, x + 1, y, "#7a9aa8"); } for (let q = 0; q < 3; q++) px(g, x + 3, y - q, winter ? "#a8b0a0" : "#2a4a1a"); px(g, x + 3, y - 3, "#6a4a2a"); } }
    // река: полоса воды к соседним рекам и озёрам
    if (G.river[i]) {
      const col = winter ? "#d8ecf8" : "#5aa8e6", hi = winter ? "#ffffff" : "#9ad4f6";
      const link = (dx, dy) => inMap(tx + dx, ty + dy) && (G.river[idx(tx + dx, ty + dy)] || G.t[idx(tx + dx, ty + dy)] === WATER);
      const seg = (x0, y0, x1, y1) => { g.fillStyle = col; g.fillRect(x0, y0, x1 - x0, y1 - y0); };
      seg(ox + 6, oy + 6, ox + 10, oy + 10);
      if (link(1, 0)) seg(ox + 8, oy + 6, ox + 16, oy + 10); if (link(-1, 0)) seg(ox, oy + 6, ox + 8, oy + 10);
      if (link(0, 1)) seg(ox + 6, oy + 8, ox + 10, oy + 16); if (link(0, -1)) seg(ox + 6, oy, ox + 10, oy + 8);
      px(g, ox + 7, oy + 7, hi);
    }
    // ресурс: значок в углу клетки
    const r = G.res[i];
    if (r === "iron") rows(g, SPR.iron, { O: "#2a2420", G: "#8a8a90", R: "#e07a30" }, ox + 10, oy + 10);
    else if (r === "fish" && !winter) rows(g, SPR.fish, { B: "#d8e8f0", W: "#1a2a3a" }, ox + 9, oy + 10);
    else if (r === "game") rows(g, SPR.game, { T: "#8a5a30" }, ox + 10, oy + 10);
    else if (r === "salt") rows(g, SPR.salt, { W: "#ffffff", S: "#c8d4e0" }, ox + 10, oy + 10);
  }
  ART[si] = { cv, seed: G.seed };
  return cv;
}
// ---- маленький город по числу жителей
const CITY_TEX = {};
function cityTex(tier, winter, lit) {
  const key = `${tier}_${winter}_${lit}`; if (CITY_TEX[key]) return CITY_TEX[key];
  const cv = document.createElement("canvas"); cv.width = 26; cv.height = 22; const g = cv.getContext("2d"), O = "#2a1a10";
  const house = (x, y, wall, roof) => {
    for (let c = -1; c <= 5; c++) px(g, x + c, y, O);
    for (let r = 1; r <= 2; r++) for (let c = -1; c <= 5; c++) px(g, x + c, y + r, c === -1 || c === 5 ? O : winter && r === 1 ? "#ffffff" : r === 2 ? dk(roof, -0.25) : roof);
    for (let r = 3; r <= 5; r++) for (let c = 0; c <= 4; c++) px(g, x + c, y + r, c === 0 || c === 4 || r === 5 ? O : c === 3 ? dk(wall, -0.18) : wall);
    px(g, x + 1, y + 4, lit ? "#ffd860" : "#4a5a7a"); px(g, x + 2, y + 4, "#5a3418");
  };
  const ground = winter ? "#e8eef4" : "#b08a58";
  for (let y = 0; y < 22; y++) for (let x = 0; x < 26; x++) { const e = ((x - 13) / (9 + tier)) ** 2 + ((y - 15) / (5 + tier * 0.6)) ** 2; if (e <= 1) px(g, x, y, e > 0.8 ? dk(ground, -0.2) : ground); }
  if (tier >= 1) for (let k = 0; k < 40; k += 2) { const a = k / 40 * Math.PI * 2, x = 13 + Math.cos(a) * (10 + tier), y = 15 + Math.sin(a) * (6 + tier * 0.6); if (y > 9) px(g, x, y, "#6a4424"); }
  const spots = [[[6, 9], [13, 10]], [[4, 9], [11, 7], [16, 10]], [[3, 10], [9, 7], [17, 9], [12, 12]], [[2, 10], [8, 7], [18, 8], [12, 12], [19, 13]]][tier];
  if (tier >= 2) { const x = 11, y = 1; for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) px(g, x + c, y + 6 + r, c === 0 || c === 4 || r === 6 ? O : "#f4eee2"); rows(g, [".OOO.", "OLMDO", "OLMDO", ".OOO."], { O, L: winter ? "#ffffff" : tier === 3 ? "#f8d860" : "#6a9ae0", M: tier === 3 ? "#e0b040" : "#3a6ab0", D: tier === 3 ? "#a87a20" : "#2a4a88" }, x, y + 2); px(g, x + 2, y, "#e0b040"); px(g, x + 2, y + 1, "#e0b040"); px(g, x + 1, y + 1, "#e0b040"); px(g, x + 3, y + 1, "#e0b040"); if (lit) px(g, x + 2, y + 9, "#ffd860"); }
  const walls = ["#ecdcb8", "#e0c89c", "#f2e6cc"], roofs = ["#c8483a", "#a83e30", "#8a5a34", "#5a6a8a"];
  spots.forEach(([x, y], k) => house(x, y, walls[k % 3], roofs[(k + tier) % 4]));
  return (CITY_TEX[key] = cv);
}
const SPR_CACHE = {};
function spr(name, pal) { const key = name + JSON.stringify(pal); if (SPR_CACHE[key]) return SPR_CACHE[key]; const r = SPR[name], cv = document.createElement("canvas"); cv.width = Math.max(...r.map(s => s.length)); cv.height = r.length; rows(cv.getContext("2d"), r, pal, 0, 0); return (SPR_CACHE[key] = cv); }
const WAGON_CV = {};
function wagonCv(f) { if (WAGON_CV[f]) return WAGON_CV[f]; const cv = document.createElement("canvas"); cv.width = 17; cv.height = 13; const g = cv.getContext("2d"); paintPixWagon((x, y, c) => px(g, x, y, c), "#f28c26", f); return (WAGON_CV[f] = cv); }
// ---- туман
const fogCv = document.createElement("canvas"); fogCv.width = MW * TS; fogCv.height = MH * TS; const fg = fogCv.getContext("2d");
let VIS = null;
function updateFog() {
  VIS = visibleSet(); fg.clearRect(0, 0, fogCv.width, fogCv.height);
  for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++) {
    const i = idx(tx, ty), ox = tx * TS, oy = ty * TS;
    if (!G.explored[i]) {
      for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) {
        const gx = ox + x, gy = oy + y, edgeL = x < 3 && tx > 0 && G.explored[i - 1], edgeR = x > 12 && tx < MW - 1 && G.explored[i + 1], edgeT = y < 3 && ty > 0 && G.explored[i - MW], edgeB = y > 12 && ty < MH - 1 && G.explored[i + MW];
        if ((edgeL || edgeR || edgeT || edgeB) && hsh(gx, gy, 77) < 0.5) continue;
        const n = vnoise(gx, gy, 10, 5) + (hsh(gx, gy, 3) - 0.5) * 0.08; fg.fillStyle = n < 0.35 ? "#241c15" : n < 0.55 ? "#2a2119" : n < 0.75 ? "#30261d" : "#382d22"; fg.fillRect(gx, gy, 1, 1);
      }
    } else if (!VIS[i]) { fg.fillStyle = "rgba(14,10,24,0.42)"; fg.fillRect(ox, oy, TS, TS); }
  }
  fogDirty = false;
}
// ---- камера
function resizeView() {
  const r = view.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
  view.width = Math.max(50, Math.round(r.width * dpr)); view.height = Math.max(50, Math.round(r.height * dpr));
  if (!zoomUser) Z = Math.max(2, Math.round(view.width / ((r.width < 600 ? 10 : 16) * TS)));
  clampCam(); dirty = true;
}
function clampCam() {
  const hw = view.width / (2 * Z), hh = view.height / (2 * Z), W2 = MW * TS, H2 = MH * TS;
  cam.x = hw * 2 >= W2 ? W2 / 2 : Math.max(hw, Math.min(W2 - hw, cam.x));
  cam.y = hh * 2 >= H2 ? H2 / 2 : Math.max(hh, Math.min(H2 - hh, cam.y));
}
function centerOn(x, y) { cam.x = x * TS + TS / 2; cam.y = y * TS + TS / 2; clampCam(); }
function zoomBy(k) { const dpr = window.devicePixelRatio || 1; Z = Math.max(Math.max(1, Math.round(dpr)), Math.min(Math.round(8 * dpr), Z + k * Math.max(1, Math.round(dpr)))); zoomUser = true; clampCam(); }
// ---- рисуем кадр
let lastVisKey = "";
function draw(now) {
  if (!G) return;
  const t = now / 1000, si = seasonOf(), winter = si === 3;
  const vk = G.units.map(u => u.x + "," + u.y).join(";") + "|" + G.cities.map(c => c.x + "," + c.y + "," + c.pop).join(";");
  if (fogDirty || vk !== lastVisKey) { updateFog(); lastVisKey = vk; }
  const sx = Math.round((cam.x - view.width / (2 * Z)) * Z) / Z, sy = Math.round((cam.y - view.height / (2 * Z)) * Z) / Z;
  vx.setTransform(1, 0, 0, 1, 0, 0); vx.fillStyle = "#14100c"; vx.fillRect(0, 0, view.width, view.height);
  vx.imageSmoothingEnabled = false;
  vx.setTransform(Z, 0, 0, Z, -sx * Z, -sy * Z);
  vx.drawImage(mapArt(si), 0, 0);
  const selU = sel && sel.unit ? G.units.find(u => u.id === sel.unit) : null, selC = sel && sel.city ? G.cities.find(c => c.id === sel.city) : null;
  // поля, которые обрабатывает выбранный город
  if (selC) { vx.lineWidth = 1 / Z * 2; for (const i of selC.worked) { vx.strokeStyle = "rgba(255,217,77,0.9)"; vx.strokeRect((i % MW) * TS + 1, Math.floor(i / MW) * TS + 1, TS - 2, TS - 2); } const r = cityRadius(selC); vx.strokeStyle = "rgba(255,255,255,0.35)"; vx.strokeRect((selC.x - r) * TS, (selC.y - r) * TS, (r * 2 + 1) * TS, (r * 2 + 1) * TS); }
  // оценка места для переселенцев
  if (selU && selU.kind === "settlers" && !selU.path.length) { vx.strokeStyle = canFound(selU.x, selU.y) ? "rgba(255,120,100,0.8)" : "rgba(255,255,255,0.85)"; vx.lineWidth = 2 / Z; vx.setLineDash([3, 2]); vx.strokeRect((selU.x - 1) * TS, (selU.y - 1) * TS, TS * 3, TS * 3); vx.setLineDash([]); }
  // путь отряда
  if (selU && selU.path.length) { let mv = selU.mv; for (const p of selU.path) { mv -= moveCost(idx(p.x, p.y), selU.kind); vx.fillStyle = mv >= 0 ? "#ffd94d" : "#f2f2f2"; vx.fillRect(p.x * TS + 6, p.y * TS + 6, 4, 4); } }
  // особые места (видны, если клетка открыта)
  for (const s of G.sites) {
    if (!s.alive || !G.explored[idx(s.x, s.y)]) continue;
    const ox = s.x * TS, oy = s.y * TS;
    if (s.kind === "ruin") vx.drawImage(spr("ruin", { O: "#3a3430", G: "#a8a094" }), ox + 2, oy + 6);
    else if (s.kind === "lair") { vx.drawImage(spr("lair", { O: "#2a1a10", T: "#8a5a34", D: "#4a2a14", F: "#d83a2a", Y: Math.floor(t * 8) % 2 ? "#ffd040" : "#ff8a20", R: "#e05020" }), ox + 2, oy + 4); }
    else if (s.kind === "leshiy") vx.drawImage(spr("leshiy", { O: "#0e1a0c", D: "#1e3a1a", M: "#2e5a2a", L: "#4a7a3a", E: Math.floor(t * 1.5) % 4 ? "#c8ff60" : "#2e5a2a", T: "#3a2a18", t: "#1a1008", S: "rgba(20,30,10,0.4)" }), ox + 1, oy + 1);
    else if (s.kind === "yaga") vx.drawImage(spr("yaga", { O: "#2a1a10", S: winter ? "#ffffff" : "#5a3a20", W: "#7a5030", Y: "#ffd060", L: "#c8a060", S2: "" }), ox + 3, oy + 1 + (Math.floor(t * 2) % 2));
    else if (s.kind === "kikimora") vx.drawImage(spr("kiki", { O: "#1a2010", M: "#4a5a3a", W: "#5a4a30", E: Math.floor(t * 2) % 3 ? "#c8ff90" : "#5a4a30", R: "#2a4a1a" }), ox + 3, oy + 4);
    else if (s.kind === "gorynych") { vx.drawImage(spr("cave", { O: "#1a1410", G: "#5a5048", F: "#ff6020", Y: "#ffd040" }), ox + 1, oy + 7); for (let k = 0; k < 3; k++) { const f = (t * 0.6 + k / 3) % 1; vx.fillStyle = `rgba(80,70,70,${0.7 * (1 - f)})`; vx.fillRect(ox + 7 + f * 3, oy + 6 - f * 10, 2 + f * 2, 2 + f * 2); } }
    else if (s.kind === "vodyanoy") { vx.strokeStyle = "rgba(220,240,255,0.85)"; vx.lineWidth = 1; for (let k = 0; k < 3; k++) { vx.beginPath(); vx.arc(ox + 8, oy + 8, 2 + k * 2, t * 2 + k, t * 2 + k + 4); vx.stroke(); } px(vx, ox + 8, oy + 8, "#1a3a4a"); }
  }
  // города
  const nl = 0;
  for (const c of G.cities) { const tier = c.pop >= 10 ? 3 : c.pop >= 7 ? 2 : c.pop >= 4 ? 1 : 0; vx.drawImage(cityTex(tier, winter ? 1 : 0, 0), c.x * TS - 5, c.y * TS - 6); }
  // обозы между городами
  for (const v of G.convoys || []) {
    const A = G.cities.find(c => c.id === v.from), B = G.cities.find(c => c.id === v.to); if (!A || !B) continue;
    vx.fillStyle = "rgba(242,200,121,0.75)";
    for (let k = 1; k < 12; k++) { const q = k / 12; vx.fillRect((A.x + (B.x - A.x) * q) * TS + 7, (A.y + (B.y - A.y) * q) * TS + 9, 2, 2); }
    const p = Math.min(0.95, Math.max(0.05, 1 - v.left / v.total + 0.08)), X = (A.x + (B.x - A.x) * p) * TS, Y = (A.y + (B.y - A.y) * p) * TS;
    vx.save(); if (B.x < A.x) { vx.translate(X * 2 + 16, 0); vx.scale(-1, 1); } vx.drawImage(wagonCv(Math.floor(now / 300) % 2), X - 1, Y + 2); vx.restore();
  }
  // отряды
  for (const u of G.units) {
    let ax = u.x, ay = u.y;
    if (u.anim) { const k = Math.min(1, (now - u.anim.t0) / 160); ax = u.anim.fx + (u.x - u.anim.fx) * k; ay = u.anim.fy + (u.y - u.anim.fy) * k; }
    const X = ax * TS, Y = ay * TS, moving = !!u.anim;
    if (u.kind === "settlers") vx.drawImage(wagonCv(moving ? Math.floor(now / 120) % 2 : 0), X - 1, Y + 2);
    else vx.drawImage(spr("druzh", { O: "#1a1410", H: "#a8b0b8", S: "#e0b088", E: "#2a1a10", R: "#c8302a", C: "#3a5a8a", W: "#e0b040", P: "#c8c8d0", B: "#5a3418", S2: "" }), X + 3, Y + 2);
    if (u.mv > 0 && !u.path.length) { vx.fillStyle = "#6fdc6f"; vx.fillRect(X + 13, Y + 1, 2, 2); }
  }
  vx.drawImage(fogCv, 0, 0);
  // выделение
  const blink = 0.55 + Math.sin(t * 6) * 0.45;
  if (selU) { vx.strokeStyle = `rgba(255,217,77,${blink})`; vx.lineWidth = 2 / Z * 1.5; vx.strokeRect(selU.x * TS + 0.5, selU.y * TS + 0.5, TS - 1, TS - 1); }
  if (sel && sel.tile) { vx.strokeStyle = "rgba(255,255,255,0.8)"; vx.lineWidth = 2 / Z; vx.strokeRect(sel.tile.x * TS + 0.5, sel.tile.y * TS + 0.5, TS - 1, TS - 1); }
  // подписи городов и звёзды места — уже в экранных пикселях
  vx.setTransform(1, 0, 0, 1, 0, 0);
  const dpr = window.devicePixelRatio || 1, fs = Math.round(11 * dpr * Math.min(1.4, Math.max(1, Z / (3 * dpr))));
  vx.font = `700 ${fs}px 'PT Sans', sans-serif`; vx.textBaseline = "middle";
  for (const c of G.cities) {
    const X = (c.x * TS + TS / 2 - sx) * Z, Y = (c.y * TS + TS + 4 - sy) * Z, label = c.name, w = vx.measureText(label).width + fs * 2.4, h = fs * 1.5;
    vx.fillStyle = "rgba(42,30,22,0.9)"; vx.beginPath(); vx.roundRect(X - w / 2, Y, w, h, h / 3); vx.fill();
    vx.fillStyle = c.order < 30 ? "#c8402e" : "#b88a4a"; vx.beginPath(); vx.roundRect(X - w / 2, Y, fs * 1.6, h, h / 3); vx.fill();
    vx.fillStyle = "#fff"; vx.textAlign = "center"; vx.fillText(String(c.pop), X - w / 2 + fs * 0.8, Y + h / 2);
    vx.fillStyle = "#f6ead0"; vx.textAlign = "left"; vx.fillText(label, X - w / 2 + fs * 1.9, Y + h / 2);
    if (c.build) { vx.fillStyle = "#f2c879"; vx.fillRect(X - w / 2, Y + h - 2 * dpr, w * (1 - c.build.left / (BUILD[c.build.key] || UNITS[c.build.key]).turns), 2 * dpr); }
  }
  if (selU && selU.kind === "settlers" && !selU.path.length) {
    const st = stars(siteScore(selU.x, selU.y)), X = (selU.x * TS + TS / 2 - sx) * Z, Y = ((selU.y - 1) * TS - sy) * Z - fs;
    vx.textAlign = "center"; vx.font = `700 ${Math.round(fs * 1.3)}px 'PT Sans', sans-serif`;
    vx.fillStyle = "rgba(42,30,22,0.85)"; const tw = vx.measureText("★★★★★").width + 12 * dpr; vx.beginPath(); vx.roundRect(X - tw / 2, Y - fs, tw, fs * 2, fs / 2); vx.fill();
    vx.fillStyle = "#ffd94d"; vx.fillText("★".repeat(st) + "☆".repeat(5 - st), X, Y);
  }
  vx.textAlign = "left";
}
