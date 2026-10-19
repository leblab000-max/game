function tone(notes, len, vol = 0.12) { if (!soundOn) return; try { let t = audio().currentTime; for (const f of notes) { sfx([Math.min(1, vol * 3), 0, f, .005, len * .5, len * .6, 1], t); t += len; } } catch (e) {} }
const SND = { buy: () => sfx(FX.coin), sell: () => sfx(FX.coin), sellQuiet: () => {}, travel: () => sfx(FX.step), event: () => sfx(FX.season), win: () => sfx(FX.found), wagon: () => sfx(FX.step) };
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const SEASONS = [
  { name: "Весна", news: "Пришла весна: снег сошёл, поля зазеленели, в садах цветут яблони.", grass: ["#7cc850", "#6cb844", "#5ca83a", "#94d866"], tuft: "#4a9632", flowers: ["#ffffff", "#ffd84a", "#ff9ac8", "#c8a0ff"], tree: ["#2e6a28", "#4a9a3a", "#6cc04a", "#ffb8d8"], pine: ["#1f5a30", "#2f7a3c", "#4a9a4a"], crop: "sprout", plaza: "#c09058" },
  { name: "Лето", news: "Настало лето: колосится пшеница, на ярмарках людно.", grass: ["#5cb040", "#4fa036", "#43902f", "#70c454"], tuft: "#367a26", flowers: ["#ffe04a", "#ff6a4a", "#ffffff"], tree: ["#225a20", "#357f2c", "#4f9f3a"], pine: ["#1b5028", "#2a6e34", "#43903f"], crop: "wheat", plaza: "#c89a60" },
  { name: "Осень", news: "Осень на дворе: листья пожелтели, мужики свозят урожай.", grass: ["#b8a24a", "#a89240", "#968038", "#c8b45c"], tuft: "#7e6a28", flowers: ["#e0602a", "#c8401e"], tree: ["#8a3418", "#c85e1c", "#f0a030"], pine: ["#1f4a2a", "#2f6a34", "#4a8040"], crop: "stubble", plaza: "#b88a50" },
  { name: "Зима", news: "Пришла зима: замело дороги, реки встали, в избах топят печи.", grass: ["#f2f6fa", "#e4ecf4", "#d6e0ec", "#ffffff"], tuft: "#c4d2e0", flowers: [], tree: null, pine: ["#1e4a3a", "#2a5e44", "#f2f6fa"], crop: "snow", plaza: "#dfe6ee" },
];
const RGBC = {};
const rgbOf = h => RGBC[h] || (RGBC[h] = [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
const hsh = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
function vnoise(x, y, sc, seed) {
  const gx = x / sc, gy = y / sc, x0 = Math.floor(gx), y0 = Math.floor(gy), sm = t => t * t * (3 - 2 * t), u = sm(gx - x0), v = sm(gy - y0);
  const a = hsh(x0, y0, seed), b = hsh(x0 + 1, y0, seed), c = hsh(x0, y0 + 1, seed), d = hsh(x0 + 1, y0 + 1, seed);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const SHORE = [[655, 0], [645, 90], [665, 200], [640, 330], [660, 430], [640, 560], [670, 720]];
function shoreX(y) { for (let i = 1; i < SHORE.length; i++) if (y <= SHORE[i][1]) { const a = SHORE[i - 1], b = SHORE[i], t = (y - a[1]) / (b[1] - a[1]); return a[0] + (b[0] - a[0]) * t + Math.sin(y * 0.09) * 3; } return 670; }
const hexN = s => parseInt(s.slice(1), 16);
function dk(hex, k) { const c = rgbOf(hex), f = v => Math.max(0, Math.min(255, Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k)))); return "#" + c.map(v => f(v).toString(16).padStart(2, "0")).join(""); }
function fromRows(put, rows, pal, ox = 0, oy = 0) { rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (r[x] !== ".") put(ox + x, oy + y, pal[r[x]]); }); }
const TREE_ROWS = ["...OOOOO...", "..OMMLLMO..", ".OMMLLLLMO.", "OMMMMLLMMMO", "ODMMMMMMMMO", "ODDMMMMMMDO", "ODDDMMMMDDO", ".ODDDDDDDO.", "..OODDDOO..", "....OTO....", "....OTO....", "...OTtTO...", "..SSSSSSS.."];
const BARE_ROWS = ["..T....T...", "...T..T..T.", "T...TT..T..", ".T..TT.TT..", "..TT.TTT...", "....TTT.T..", ".....TT....", "....OTO....", "....OTO....", "....OTO....", "....OTO....", "...OTtTO...", "..SSSSSSS.."];
const PINE_ROWS = ["....O....", "...OLO...", "..OLMDO..", "...OMO...", "..OLMDO..", ".OLMMDDO.", "..OMMDO..", ".OLMMMDO.", "OLMMMMDDO", "OOOMTMOOO", "....T....", "...OTO...", "..SSSSS.."];
const C_OUT = "#2a1a10";
function paintPixWagon(put, color, frame) {
  const O = C_OUT;
  for (let x = 1; x < 16; x++) put(x, 12, "rgba(30,20,5,0.3)");
  fromRows(put, ["..OOOOOO..", ".OWWWWWWO.", "OWWWWWWVVO", "OWWWWWVVVO"], { O, W: "#f4ecd2", V: "#d8ccaa" }, 0, 1);   // тент
  for (let x = 0; x < 10; x++) { put(x, 5, O); put(x, 6, x === 0 || x === 9 ? O : "#9a6a3a"); put(x, 7, x === 0 || x === 9 ? O : color); put(x, 8, O); }
  for (const wx of [2, 7]) { fromRows(put, [".OO.", "O" + (frame ? "B." : ".B") + "O", "O" + (frame ? ".B" : "B.") + "O", ".OO."], { O, B: "#8a5a30" }, wx - 1, 8); }
  put(10, 6, "#5a3818"); put(11, 6, "#5a3818");   // оглобля
  fromRows(put, ["....OO.", "...OHHO", "OOOOHHO", "OHHHHO.", "OHHHHO.", ".OOOO.."], { O, H: "#8a5430" }, 10, 2);   // лошадь
  put(15, 3, "#2a1a0a"); put(11, 4, "#a86a3c"); put(12, 4, "#a86a3c");
  const legs = frame ? [11, 14] : [12, 13];
  for (const lx of legs) { put(lx, 8, O); put(lx, 9, O); }
  put(10, 4, "#3a2410"); put(9, 5, "#3a2410");   // хвост
}
// ================= Портреты героев: пиксель-арт, рисуются кодом =================
// Сначала рисуем сцену и фигуру обычной графикой в 200x240, уменьшаем до 100x120,
// обводим фигуру тёмным контуром и сводим цвета к ограниченной палитре — получается пиксель-арт.
const LOOK = {
  voevoda: { skin: "#d6a07a", hair: "#4a2c18", beard: "#52321c", beardLen: 1, hairS: "long", hat: "gorlat", eye: "#4f6a80", brows: "stern", mouth: "firm", coat: "#8a1c1c", cloak: "#6a4426", trim: "#d6aa44", fur: "#5e3f26", bg: "kremlin", light: "#ffe6b0", sword: true },
  foma: { skin: "#d8a686", hair: "#cfccc4", beard: "#dedbd3", beardLen: 1.2, hairS: "bald", eye: "#6a5634", brows: "kind", mouth: "smile", coat: "#3e5636", trim: "#c2a060", bg: "izba", light: "#ffb868", glasses: true, old: true },
  grabov: { skin: "#e0aa86", hair: "#1c1612", beard: "#221a14", beardLen: 0.5, hairS: "short", hat: "furcap", eye: "#3a2c1c", brows: "sly", mouth: "smirk", coat: "#1e3a2a", trim: "#e2bc52", fur: "#1a1512", bg: "vault", light: "#ffcf7a", fat: true, chain: true },
  dyak: { skin: "#d2b090", hair: "#5a4a38", beard: "#6a5844", beardLen: 0.55, goatee: true, hairS: "short", hat: "tafya", eye: "#5a5a2a", brows: "squint", mouth: "thin", coat: "#38294a", trim: "#8c7aa6", bg: "office", light: "#cfd8ff", thin: true, quill: true },
  liho: { skin: "#b8825e", hair: "#140e0a", beard: "#1a120c", beardLen: 0.9, hairS: "long", hat: "papakha", eye: "#3a2412", brows: "angry", mouth: "grin", coat: "#4a3524", trim: "#a82626", bg: "night", light: "#ff8a4a", patch: true, scar: true, saber: true },
  kuzma: { skin: "#dea484", hair: "#9a6630", beard: "#a8702e", beardLen: 0.85, hairS: "long", band: true, eye: "#4f7ab0", brows: "kind", mouth: "smile", coat: "#ece2cc", trim: "#b8322a", bg: "birch", light: "#fff2c0", rosy: true, axe: true },
  narod: { skin: "#ddae8e", hair: "#8a7a6a", beard: null, hat: "platok", eye: "#5a7aa0", brows: "kind", mouth: "smile", coat: "#6e2e4e", trim: "#e2bc52", bg: "village", light: "#ffd8a0", old: true, woman: true },
};
function shade(hex, k, a = 1) {   // светлее (k>0) или темнее (k<0)
  const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255];
  const f = v => Math.max(0, Math.min(255, Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k))));
  return `rgba(${f(c[0])},${f(c[1])},${f(c[2])},${a})`;
}
const AVA_CACHE = {};
function drawAvatar(cv2, who) {
  if (!AVA_CACHE[who]) AVA_CACHE[who] = paintPortrait(who);
  cv2.width = 100; cv2.height = 120;
  cv2.getContext("2d").putImageData(AVA_CACHE[who], 0, 0);
}
function paintPortrait(who) {
  const L = LOOK[who] || LOOK.narod, PW = 100, PH = 120;
  const mk = () => { const c = document.createElement("canvas"); c.width = PW; c.height = PH; const g = c.getContext("2d"); g.setTransform(0.5, 0, 0, 0.5, 0, 0); return [c, g]; };
  const [bgc, bx] = mk(), [fgc, fx] = mk();
  const CR = typeof CREATURE_ART !== "undefined" && CREATURE_ART[who];
  if (CR) { CR.bg(bx, rng(who.length * 7919 + 13)); CR.fig(fx, rng(who.length * 104729 + 7)); }
  else { portraitBg(bx, L, rng(who.length * 7919 + 13)); portraitFigure(fx, L, rng(who.length * 104729 + 7)); }
  // свет сцены на фигуре
  fx.globalCompositeOperation = "source-atop";
  let g = fx.createLinearGradient(30, 0, 175, 0);
  g.addColorStop(0, shade(L.light, 0, 0.22)); g.addColorStop(0.45, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(10,5,0,0.32)");
  fx.fillStyle = g; fx.fillRect(0, 0, 200, 240);
  g = fx.createLinearGradient(0, 190, 0, 240); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,0.35)");
  fx.fillStyle = g; fx.fillRect(0, 0, 200, 240);
  if (L.bg === "night") { g = fx.createRadialGradient(100, 260, 10, 100, 260, 150); g.addColorStop(0, "rgba(255,120,40,0.45)"); g.addColorStop(1, "rgba(255,120,40,0)"); fx.fillStyle = g; fx.fillRect(0, 0, 200, 240); }
  fx.globalCompositeOperation = "source-over";
  // контур фигуры
  const bctx = bgc.getContext("2d"), bd = bctx.getImageData(0, 0, PW, PH), fd = fx.getImageData(0, 0, PW, PH).data, b = bd.data;
  const A = i => fd[i * 4 + 3] > 110;
  for (let y = 0; y < PH; y++) for (let xx = 0; xx < PW; xx++) {
    const i = y * PW + xx; if (A(i)) continue;
    if ((xx > 0 && A(i - 1)) || (xx < PW - 1 && A(i + 1)) || (y > 0 && A(i - PW)) || (y < PH - 1 && A(i + PW))) {
      b[i * 4] = b[i * 4] * 0.2 + 4; b[i * 4 + 1] = b[i * 4 + 1] * 0.2 + 3; b[i * 4 + 2] = b[i * 4 + 2] * 0.2 + 2;
    }
  }
  bctx.putImageData(bd, 0, 0);
  bctx.setTransform(1, 0, 0, 1, 0, 0); bctx.drawImage(fgc, 0, 0);
  // виньетка
  g = bctx.createRadialGradient(50, 52, 30, 50, 60, 82); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(8,4,0,0.55)");
  bctx.fillStyle = g; bctx.fillRect(0, 0, PW, PH);
  const im = bctx.getImageData(0, 0, PW, PH);
  quantize(im.data, 52);
  portraitFrame(im.data, PW, PH);
  return im;
}
// Сводим цвета к палитре из k цветов (k-средних), так картинка становится "пиксельной"
function quantize(a, k) {
  const n = a.length / 4, C = [];
  let m = [0, 0, 0]; for (let i = 0; i < n; i++) for (let c = 0; c < 3; c++) m[c] += a[i * 4 + c] / n;
  C.push(m);
  const d2 = (i, c) => { const r = a[i * 4] - c[0], g = a[i * 4 + 1] - c[1], b = a[i * 4 + 2] - c[2]; return r * r * 0.3 + g * g * 0.59 + b * b * 0.11; };
  const best = new Float32Array(n).fill(1e9);
  while (C.length < k) {   // самый непохожий пиксель — новый цвет (сохраняет яркие акценты)
    let far = 0, fd = -1; const c = C[C.length - 1];
    for (let i = 0; i < n; i += 2) { const d = d2(i, c); if (d < best[i]) best[i] = d; if (best[i] > fd) { fd = best[i]; far = i; } }
    C.push([a[far * 4], a[far * 4 + 1], a[far * 4 + 2]]);
  }
  const lab = new Uint8Array(n);
  for (let it = 0; it < 7; it++) {
    const sum = C.map(() => [0, 0, 0, 0]);
    for (let i = 0; i < n; i++) { let bi = 0, bd = 1e12; for (let j = 0; j < k; j++) { const d = d2(i, C[j]); if (d < bd) { bd = d; bi = j; } } lab[i] = bi; const s = sum[bi]; s[0] += a[i * 4]; s[1] += a[i * 4 + 1]; s[2] += a[i * 4 + 2]; s[3]++; }
    for (let j = 0; j < k; j++) if (sum[j][3]) C[j] = [sum[j][0] / sum[j][3], sum[j][1] / sum[j][3], sum[j][2] / sum[j][3]];
  }
  for (let i = 0; i < n; i++) { const c = C[lab[i]]; a[i * 4] = c[0]; a[i * 4 + 1] = c[1]; a[i * 4 + 2] = c[2]; a[i * 4 + 3] = 255; }
}
function portraitFrame(a, w, h) {   // резная золотая рамка по пикселям
  const set = (x, y, c) => { const i = (y * w + x) * 4; a[i] = c[0]; a[i + 1] = c[1]; a[i + 2] = c[2]; a[i + 3] = 255; };
  const dark = [26, 16, 8], hi = [244, 214, 140], mid = [214, 168, 70], lo = [138, 98, 34];
  for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) {
    const e = Math.min(x, y, w - 1 - x, h - 1 - y);
    if (e === 0 || e === 4) set(x, y, dark);
    else if (e <= 3) { const tl = x + y < w - 1 - x + h - 1 - y ? (e === 1 ? hi : e === 2 ? mid : lo) : (e === 1 ? lo : e === 2 ? mid : hi); set(x, y, tl); }
  }
  for (const [cx, cy] of [[7, 7], [w - 8, 7], [7, h - 8], [w - 8, h - 8]])   // уголки-ромбы
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (Math.abs(dx) + Math.abs(dy) <= 2) set(cx + dx, cy + dy, Math.abs(dx) + Math.abs(dy) === 2 ? dark : dy < 0 ? hi : mid);
}
// ---------- фоновые сцены ----------
function portraitBg(x, L, R) {
  const P = (pts, f) => { x.beginPath(); x.moveTo(pts[0][0], pts[0][1]); for (const q of pts.slice(1)) x.lineTo(q[0], q[1]); x.closePath(); x.fillStyle = f; x.fill(); };
  const E = (cx, cy, rx, ry, f, r = 0) => { x.beginPath(); x.ellipse(cx, cy, Math.max(0.1, rx), Math.max(0.1, ry), r, 0, Math.PI * 2); x.fillStyle = f; x.fill(); };
  const lin = (y0, y1, stops) => { const g = x.createLinearGradient(0, y0, 0, y1); stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c)); return g; };
  const glow = (cx, cy, r, col, a) => { const g = x.createRadialGradient(cx, cy, 1, cx, cy, r); g.addColorStop(0, shade(col, 0, a)); g.addColorStop(1, shade(col, 0, 0)); x.fillStyle = g; x.fillRect(0, 0, 200, 240); };
  const cloud = (cx, cy, s) => { for (let k = 0; k < 6; k++) E(cx + (k - 2.5) * 9 * s, cy - Math.sin(k / 5 * Math.PI) * 8 * s, 11 * s, 8 * s, "rgba(250,248,240,0.92)"); E(cx, cy + 5 * s, 30 * s, 4 * s, "rgba(170,180,200,0.6)"); };
  const tree = (tx, ty, s, c) => { x.fillStyle = "#4a3220"; x.fillRect(tx - 2 * s, ty, 4 * s, 16 * s); for (let k = 0; k < 7; k++) E(tx + (R() - 0.5) * 18 * s, ty - 4 * s - R() * 18 * s, 9 * s, 8 * s, k < 3 ? shade(c, -0.25) : k < 5 ? c : shade(c, 0.2)); };
  const pine = (tx, by, h, c) => { for (let k = 0; k < 4; k++) { const w = h * (0.32 - k * 0.06), y = by - k * h * 0.22; P([[tx - w, y], [tx, y - h * 0.38], [tx + w, y]], c); } };
  const izba = (bx, by, w, roof, wall, lit) => {
    x.fillStyle = wall; x.fillRect(bx, by - w * 0.6, w, w * 0.6);
    x.fillStyle = shade(wall.startsWith("#") ? wall : "#5a3a24", -0.3); for (let j = 1; j < 5; j++) x.fillRect(bx, by - w * 0.6 + j * w * 0.12, w, 1.2);
    P([[bx - 4, by - w * 0.6], [bx + w / 2, by - w * 1.05], [bx + w + 4, by - w * 0.6]], roof);
    x.fillStyle = lit ? "#ffd27a" : "#2a1a10"; x.fillRect(bx + w * 0.38, by - w * 0.42, w * 0.24, w * 0.2);
  };
  if (L.bg === "kremlin") {   // ясный день, деревянный кремль с флагами, поле с пахарем
    x.fillStyle = lin(0, 165, ["#5f8fc8", "#9fc0dc", "#e8e2c4"]); x.fillRect(0, 0, 200, 240);
    cloud(40, 30, 1.1); cloud(150, 18, 0.9); cloud(95, 52, 0.6);
    P([[0, 150], [30, 132], [70, 140], [110, 126], [150, 138], [200, 128], [200, 170], [0, 170]], "#7d9a9a");
    P([[0, 160], [40, 148], [90, 156], [140, 146], [200, 152], [200, 240], [0, 240]], "#5f8a3c");
    for (let j = 0; j < 9; j++) { x.fillStyle = j % 2 ? "#6a4a2a" : "#7f9a3a"; P([[0, 170 + j * 8], [70, 166 + j * 9], [70, 170 + j * 9], [0, 176 + j * 8]], x.fillStyle); }
    tree(14, 150, 1.1, "#3f7a2e"); tree(46, 140, 0.9, "#4a8a34"); tree(70, 152, 0.7, "#3f7a2e");
    // пахарь с лошадью вдали
    E(26, 196, 9, 5, "#6a3e22"); x.fillStyle = "#4a2a16"; x.fillRect(20, 199, 2, 8); x.fillRect(31, 199, 2, 8); E(35, 191, 4, 3, "#6a3e22");
    x.fillStyle = "#c9b48a"; x.fillRect(48, 186, 4, 10); E(50, 184, 2.5, 2.5, "#e0b090");
    // частокол на каменном основании
    x.fillStyle = "#8c8a84"; x.fillRect(112, 196, 90, 44);
    x.fillStyle = "rgba(60,60,60,0.5)"; for (let j = 0; j < 5; j++) for (let k = 0; k < 6; k++) x.fillRect(112 + k * 16 + (j % 2) * 8, 198 + j * 9, 1.2, 8), x.fillRect(112, 196 + j * 9, 90, 1);
    for (let k = 0; k < 16; k++) { const lx = 112 + k * 6; x.fillStyle = k % 2 ? "#8a6034" : "#9c6e3c"; x.fillRect(lx, 158, 6, 40); P([[lx, 158], [lx + 3, 151], [lx + 6, 158]], x.fillStyle); x.fillStyle = "rgba(40,20,8,0.35)"; x.fillRect(lx + 4.5, 158, 1.5, 40); }
    // башни
    const tower = (tx, ty, tw, th) => {
      x.fillStyle = "#8a5e32"; x.fillRect(tx, ty, tw, th);
      for (let j = 0; j < th / 6; j++) { x.fillStyle = j % 2 ? "#7a5028" : "#9a6a3a"; x.fillRect(tx, ty + j * 6, tw, 5); }
      x.fillStyle = "rgba(30,15,5,0.45)"; x.fillRect(tx + tw * 0.65, ty, tw * 0.35, th);
      x.fillStyle = "#3a2210"; x.fillRect(tx + tw * 0.4, ty + th * 0.3, tw * 0.2, tw * 0.25);
      P([[tx - 5, ty], [tx + tw / 2, ty - tw * 0.95], [tx + tw + 5, ty]], "#5a3820");
      P([[tx - 5, ty], [tx + tw / 2, ty - tw * 0.95], [tx + tw / 2, ty]], "#74492a");
      x.fillStyle = "#3a2a1a"; x.fillRect(tx + tw / 2 - 0.8, ty - tw * 0.95 - 16, 1.6, 16);
      P([[tx + tw / 2 + 1, ty - tw * 0.95 - 16], [tx + tw / 2 + 16, ty - tw * 0.95 - 13], [tx + tw / 2 + 12, ty - tw * 0.95 - 10], [tx + tw / 2 + 17, ty - tw * 0.95 - 6], [tx + tw / 2 + 1, ty - tw * 0.95 - 8]], "#c4281e");
    };
    tower(152, 104, 34, 92); tower(118, 130, 22, 62);
    x.fillStyle = "#2a1608"; x.beginPath(); x.arc(169, 196, 8, Math.PI, 0); x.fillRect(161, 196, 16, 0); x.fill();
  } else if (L.bg === "izba") {   // изба: брёвна, окошко, красный угол с иконой, печь
    for (let j = 0; j < 12; j++) { x.fillStyle = lin(j * 21, j * 21 + 20, ["#8a5a30", "#6a4022", "#4a2a16"]); x.fillRect(0, j * 21, 200, 20); x.fillStyle = "#2a160a"; x.fillRect(0, j * 21 + 20, 200, 1.5); }
    x.fillStyle = "#3a2212"; x.fillRect(10, 36, 46, 52); x.fillStyle = "#ffd890"; x.fillRect(14, 40, 38, 44); x.fillStyle = "#3a2212"; x.fillRect(31, 40, 3, 44); x.fillRect(14, 60, 38, 3);
    glow(33, 62, 70, "#ffd890", 0.35);
    x.fillStyle = "#2a160a"; x.fillRect(0, 112, 64, 4);
    for (const [px, c] of [[10, "#9a5a32"], [26, "#6a6a70"], [44, "#b0703a"]]) { E(px, 104, 7, 8, c); x.fillStyle = shade(c, -0.3); x.fillRect(px - 4, 94, 8, 3); }
    x.fillStyle = "#c9a040"; x.fillRect(164, 22, 26, 32); x.fillStyle = "#5a2a1a"; x.fillRect(167, 25, 20, 26); E(177, 34, 6, 7, "#d8a070"); E(177, 33, 9, 9, "rgba(230,190,90,0.6)");
    E(177, 62, 3, 4, "#d02a1a"); glow(177, 62, 28, "#ff9a40", 0.5);
    x.fillStyle = "#d8d0c0"; x.fillRect(150, 140, 50, 100); x.fillStyle = "#b8ae9c"; x.fillRect(150, 140, 50, 6);
    x.fillStyle = "#1a0e08"; x.beginPath(); x.arc(176, 196, 14, Math.PI, 0); x.fill(); x.fillRect(162, 196, 28, 18);
    E(176, 208, 10, 6, "#ff9a2a"); E(176, 206, 6, 4, "#ffe08a"); glow(176, 204, 80, "#ff8a2a", 0.4);
  } else if (L.bg === "vault") {   // кладовая ростовщика: кирпич, свеча, сундук с золотом
    x.fillStyle = lin(0, 240, ["#2e2a20", "#1a1610"]); x.fillRect(0, 0, 200, 240);
    for (let j = 0; j < 20; j++) for (let k = 0; k < 9; k++) { x.fillStyle = (j + k) % 3 ? "rgba(90,60,40,0.35)" : "rgba(120,80,50,0.3)"; x.fillRect(k * 24 + (j % 2) * 12, j * 12, 22, 10); }
    x.fillStyle = "rgba(0,0,0,0.5)"; x.beginPath(); x.arc(100, 120, 80, Math.PI, 0); x.fillRect(20, 120, 160, 120); x.fill();
    x.fillStyle = "#e8dcc0"; x.fillRect(22, 70, 9, 34); x.fillStyle = "#c8b890"; x.fillRect(27, 70, 4, 34); E(26.5, 64, 3.5, 7, "#ffcf5a"); E(26.5, 66, 1.8, 3.5, "#fff4c0");
    x.fillStyle = "#6a5030"; x.fillRect(14, 104, 26, 4);
    glow(27, 66, 90, "#ffc860", 0.5);
    x.fillStyle = "#5a3418"; x.fillRect(0, 196, 52, 44); x.fillStyle = "#3a2010"; x.fillRect(0, 190, 56, 8);
    x.fillStyle = "#8a8a7a"; x.fillRect(14, 190, 4, 50); x.fillRect(38, 190, 4, 50);
    for (let k = 0; k < 26; k++) E(6 + R() * 42, 192 - R() * 10, 5, 2.5, k % 3 ? "#e6c048" : "#fff0a0");
    for (let s = 0; s < 3; s++) { const sx = 158 + s * 15, hh = 6 + Math.floor(R() * 8); for (let q = 0; q < hh; q++) E(sx, 236 - q * 4, 7, 2.6, q % 2 ? "#b8902a" : "#f0cc50"); }
    x.fillStyle = "#e8d8b0"; x.fillRect(150, 40, 40, 52); x.fillStyle = "#6a4a2a"; for (let q = 0; q < 6; q++) x.fillRect(156, 50 + q * 6, q === 0 ? 28 : 18 + (q * 7) % 10, 2); E(178, 82, 6, 6, "#a82a22"); E(177, 81, 2, 2, "#e86050");   // «долевая грамота ГРАБОВЪ и К°»
    E(186, 176, 16, 22, "#a89470"); E(186, 158, 6, 4, "#7a6448"); glow(170, 210, 50, "#ffcc50", 0.25);
  } else if (L.bg === "office") {   // приказная изба: полки со свитками, решётчатое окно
    x.fillStyle = lin(0, 240, ["#4a4c58", "#24252e"]); x.fillRect(0, 0, 200, 240);
    x.fillStyle = "#1e1e26"; x.fillRect(8, 30, 44, 60); x.fillStyle = "#aac0e0"; x.fillRect(12, 34, 36, 52);
    x.strokeStyle = "#2a2a34"; x.lineWidth = 2; for (let k = -4; k < 8; k++) { x.beginPath(); x.moveTo(12 + k * 8, 34); x.lineTo(12 + k * 8 + 52, 86); x.moveTo(48 - k * 8, 34); x.lineTo(48 - k * 8 - 52, 86); x.stroke(); }
    x.fillStyle = "#1e1e26"; x.fillRect(0, 30, 8, 60); x.fillRect(52, 30, 30, 60);
    x.fillStyle = "rgba(190,210,255,0.13)"; P([[12, 86], [48, 86], [120, 240], [40, 240]], x.fillStyle);
    for (let j = 0; j < 4; j++) { x.fillStyle = "#4a3422"; x.fillRect(132, 30 + j * 46, 70, 5); for (let k = 0; k < 6; k++) { const sx = 140 + k * 11, sy = 22 + j * 46; E(sx, sy, 5, 5, k % 2 ? "#e0d2aa" : "#cdbb8a"); E(sx, sy, 1.6, 1.6, "#6a5636"); if ((k + j) % 3 === 0) { x.fillStyle = "#a82a22"; x.fillRect(sx - 1, sy + 4, 2, 9); } } }
    x.fillStyle = "#3a2818"; x.fillRect(0, 210, 200, 30);
    x.fillStyle = "#e8dcc0"; P([[10, 214], [56, 208], [62, 222], [14, 228]], "#e8dcc0"); x.fillStyle = "#1a1a1a"; x.fillRect(166, 200, 12, 12);
  } else if (L.bg === "night") {   // ночной лес, месяц, отсвет костра
    x.fillStyle = lin(0, 240, ["#081028", "#1a2a52", "#2a2a40"]); x.fillRect(0, 0, 200, 240);
    for (let k = 0; k < 50; k++) { const s = R() < 0.2 ? 1.6 : 0.9; E(R() * 200, R() * 140, s, s, "rgba(255,250,230,0.85)"); }
    glow(156, 40, 50, "#e8e0c0", 0.25); E(156, 40, 17, 17, "#f2ead0"); E(163, 35, 15, 15, "#1a2a52");
    for (let k = 0; k < 9; k++) pine(k * 26 - 4 + R() * 8, 200, 90 + R() * 40, "#121e34");
    for (let k = 0; k < 7; k++) pine(k * 34 + R() * 10, 250, 110 + R() * 40, "#08120c");
    glow(100, 250, 130, "#ff7a2a", 0.55);
    for (let k = 0; k < 14; k++) E(20 + R() * 160, 150 + R() * 90, 1, 1, "#ffc060");
  } else if (L.bg === "birch") {   // берёзовая роща, артельный сруб
    x.fillStyle = lin(0, 200, ["#a8cce4", "#e6efd8"]); x.fillRect(0, 0, 200, 240);
    for (let k = 0; k < 14; k++) E(k * 16, 120 + R() * 10, 16, 22, k % 2 ? "#7aa05a" : "#8ab06a");
    x.fillStyle = "#88a858"; x.fillRect(0, 150, 200, 90);
    for (let j = 0; j < 8; j++) { const ly = 120 + j * 10; x.fillStyle = j % 2 ? "#b88a50" : "#c89a5c"; x.fillRect(128, ly, 76, 9); E(128, ly + 4.5, 4.5, 4.5, "#e0bc80"); E(128, ly + 4.5, 2, 2, "#a07040"); }
    x.strokeStyle = "#8a6034"; x.lineWidth = 4; x.beginPath(); x.moveTo(132, 120); x.lineTo(166, 92); x.lineTo(200, 120); x.stroke();
    for (const bx2 of [8, 36, 186]) { x.fillStyle = "#f2f0e6"; x.fillRect(bx2, 0, 10, 240); x.fillStyle = "#c8c6bc"; x.fillRect(bx2 + 7, 0, 3, 240); x.fillStyle = "#1e1e1e"; for (let q = 0; q < 12; q++) x.fillRect(bx2 + (q % 2 ? 4 : 0), 8 + q * 20 + R() * 8, 6, 2); }
    for (let k = 0; k < 22; k++) E(R() * 200, R() * 70, 10, 7, k % 3 ? "#a8c84a" : "#d8d860");
    glow(170, 10, 120, "#fff6c0", 0.45);
  } else {   // village: заря, избы, белая церковь с золотой главой
    x.fillStyle = lin(0, 170, ["#7a6488", "#e8a07a", "#f8d494"]); x.fillRect(0, 0, 200, 240);
    glow(40, 150, 80, "#fff0c0", 0.6); E(40, 150, 18, 18, "#fff2c8");
    P([[0, 160], [60, 152], [130, 158], [200, 150], [200, 240], [0, 240]], "#6a6a40");
    for (let j = 0; j < 6; j++) P([[0, 176 + j * 12], [200, 168 + j * 12], [200, 172 + j * 12], [0, 180 + j * 12]], j % 2 ? "#8a7a44" : "#a08a4a");
    izba(2, 180, 32, "#3a2418", "#6a4428", true); izba(62, 172, 26, "#3a2418", "#5a3a22", false);
    x.fillStyle = "#ece6d8"; x.fillRect(146, 106, 30, 62); x.fillStyle = "#c8c0b0"; x.fillRect(166, 106, 10, 62); x.fillStyle = "#3a2a2a"; x.fillRect(157, 150, 8, 18);
    E(161, 100, 13, 15, "#e0b040"); E(157, 96, 5, 7, "#fff0a0"); P([[148, 102], [161, 78], [174, 102]], "#e0b040");
    x.fillStyle = "#e0b040"; x.fillRect(160, 64, 2, 16); x.fillRect(156, 69, 10, 2);
    for (let k = 0; k < 5; k++) E(18 + k * 4, 134 - k * 9, 4 + k, 3 + k * 0.6, "rgba(200,190,190,0.5)");
    x.fillStyle = "#4a3020"; for (let k = 0; k < 20; k++) x.fillRect(k * 10, 200, 3, 18); x.fillRect(0, 204, 200, 2); x.fillRect(0, 212, 200, 2);
  }
}
// ---------- сам герой ----------
function portraitFigure(x, L, R) {
  const P = (pts, f) => { x.beginPath(); x.moveTo(pts[0][0], pts[0][1]); for (const q of pts.slice(1)) x.lineTo(q[0], q[1]); x.closePath(); x.fillStyle = f; x.fill(); };
  const E = (cx, cy, rx, ry, f, r = 0) => { x.beginPath(); x.ellipse(cx, cy, Math.max(0.1, rx), Math.max(0.1, ry), r, 0, Math.PI * 2); x.fillStyle = f; x.fill(); };
  const hgrad = (x0, x1, a, b) => { const g = x.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, a); g.addColorStop(1, b); return g; };
  const vgrad = (y0, y1, a, b) => { const g = x.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; };
  // орнаментальная тесьма: полоса с ромбами
  const orn = (x0, y0, x1, y1, wd, c1, c2) => {
    const len = Math.hypot(x1 - x0, y1 - y0); x.save(); x.translate(x0, y0); x.rotate(Math.atan2(y1 - y0, x1 - x0));
    x.fillStyle = c1; x.fillRect(0, -wd / 2, len, wd); x.fillStyle = c2;
    for (let t = wd / 2; t < len; t += wd) { x.beginPath(); x.moveTo(t - wd * 0.42, 0); x.lineTo(t, -wd * 0.34); x.lineTo(t + wd * 0.42, 0); x.lineTo(t, wd * 0.34); x.closePath(); x.fill(); }
    x.fillStyle = "rgba(30,15,5,0.6)"; x.fillRect(0, -wd / 2, len, 1.3); x.fillRect(0, wd / 2 - 1.3, len, 1.3); x.restore();
  };
  const fluff = (cx, cy, rx, ry, col, n) => { for (let k = 0; k < n; k++) { const a = R() * Math.PI * 2, r = Math.sqrt(R()); E(cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r, 3.2, 2.6, k % 3 === 0 ? shade(col, 0.28) : k % 3 === 1 ? col : shade(col, -0.3)); } };
  const strands = (n, x0, x1, y0, y1, tipx, col, lw = 1.3) => { x.lineWidth = lw; for (let k = 0; k < n; k++) { const sx = x0 + R() * (x1 - x0), sy = y0 + R() * 8; x.strokeStyle = k % 2 ? shade(col, 0.3, 0.8) : shade(col, -0.4, 0.8); x.beginPath(); x.moveTo(sx, sy); x.quadraticCurveTo(sx + (R() - 0.5) * 6, (sy + y1) / 2, sx + (tipx - sx) * 0.45, y1 - R() * (y1 - y0) * 0.3); x.stroke(); } };
  const cx = 100, w = L.fat ? 1.16 : L.thin ? 0.9 : 1, jw = L.fat ? 1.22 : L.thin ? 0.84 : 1, ch = L.thin ? 154 : 150;
  const skin = L.skin, lit = shade(skin, 0.35, 0.45), shd = shade(skin, -0.5, 1);
  // --- оружие за спиной
  if (L.sword) {
    x.save(); x.translate(44, 196); x.rotate(-0.42);
    x.fillStyle = "#c4c8d0"; x.fillRect(-3.5, -120, 7, 120); x.fillStyle = "#8a909a"; x.fillRect(0.5, -120, 3, 120);
    x.fillStyle = "#d6aa44"; x.fillRect(-15, -126, 30, 6); x.fillStyle = "#5a3418"; x.fillRect(-3.5, -150, 7, 24);
    x.fillStyle = "#3a2010"; for (let q = 0; q < 5; q++) x.fillRect(-3.5, -148 + q * 5, 7, 1.5);
    E(0, -154, 6, 6, "#d6aa44"); E(-1.5, -155.5, 2, 2, "#fff0b0"); x.restore();
  }
  if (L.saber) {
    x.save(); x.translate(160, 200); x.rotate(0.38);
    x.strokeStyle = "#c8ccd4"; x.lineWidth = 6; x.beginPath(); x.moveTo(0, 0); x.quadraticCurveTo(8, -60, -2, -112); x.stroke();
    x.fillStyle = "#d6aa44"; x.fillRect(-12, -116, 22, 5); x.fillStyle = "#2a1a10"; x.fillRect(-3, -138, 6, 22); E(-1, -140, 4.5, 4, "#d6aa44"); x.restore();
  }
  // --- шея
  P([[cx - 16 * jw, 128], [cx + 16 * jw, 128], [cx + 19 * jw, 180], [cx - 19 * jw, 180]], hgrad(cx - 20, cx + 20, shade(skin, -0.12), shade(skin, -0.45)));
  E(cx, 152, 20 * jw, 10, shade(skin, -0.55, 0.6));
  // --- плечи и одежда
  x.beginPath(); x.moveTo(-5, 240); x.lineTo(-5, 210); x.bezierCurveTo(8, 186, 46, 172, cx - 22, 168); x.lineTo(cx + 22, 168); x.bezierCurveTo(154, 172, 192, 186, 205, 210); x.lineTo(205, 240); x.closePath();
  x.fillStyle = vgrad(166, 240, shade(L.coat, 0.18), shade(L.coat, -0.35)); x.fill();
  x.save(); x.clip();
  x.fillStyle = hgrad(0, 200, shade(L.coat, 0.25, 0.35), shade(L.coat, -0.6, 0.45)); x.fillRect(0, 160, 200, 80);
  for (let k = 0; k < 6; k++) { x.strokeStyle = shade(L.coat, -0.4, 0.5); x.lineWidth = 1.5; x.beginPath(); const fx2 = 20 + k * 32; x.moveTo(fx2, 200); x.quadraticCurveTo(fx2 + 6, 220, fx2 + 2, 240); x.stroke(); }
  x.restore();
  const who = L.bg;
  if (who === "kremlin") {   // воевода: кафтан с золотой планкой, корзно с фибулой, меховое ожерелье
    orn(cx, 182, cx, 240, 10, L.trim, "#8a1c1c");
    x.beginPath(); x.moveTo(-5, 206); x.bezierCurveTo(14, 180, 50, 170, cx - 30, 170); x.lineTo(cx - 14, 240); x.lineTo(-5, 240); x.closePath();
    x.fillStyle = vgrad(170, 240, shade(L.cloak, 0.15), shade(L.cloak, -0.4)); x.fill();
    orn(cx - 30, 172, cx - 12, 240, 8, "#7a1a14", L.trim);
    x.beginPath(); x.moveTo(205, 206); x.bezierCurveTo(186, 180, 150, 170, cx + 30, 170); x.lineTo(cx + 48, 186); x.bezierCurveTo(160, 200, 190, 210, 205, 240); x.closePath(); x.fillStyle = shade(L.cloak, -0.25); x.fill();
    fluff(cx, 174, 44, 10, L.fur, 90);
    E(cx - 40, 188, 9, 9, "#c9982e"); E(cx - 40, 188, 6, 6, "#e6c058"); E(cx - 42, 186, 2.5, 2.5, "#fff2b0"); E(cx - 40, 188, 2, 2, "#8a1c1c");
  } else if (who === "izba") {   // Фома: простой кафтан с тесьмой, рубаха
    P([[cx - 18, 168], [cx + 18, 168], [cx + 8, 200], [cx - 8, 200]], "#e6dcc4");
    orn(cx - 22, 168, cx - 4, 240, 7, L.trim, "#6a4a22"); orn(cx + 22, 168, cx + 4, 240, 7, L.trim, "#6a4a22");
    x.fillStyle = "#5a3a22"; x.fillRect(0, 226, 200, 6);
  } else if (who === "vault") {   // Грабов: соболий воротник и золотая цепь
    fluff(cx - 30, 182, 36, 16, L.fur, 90); fluff(cx + 30, 182, 36, 16, L.fur, 90);
    orn(cx, 192, cx, 240, 9, "#2a4a36", L.trim);
    x.strokeStyle = "#b8902a"; x.lineWidth = 3.5; x.beginPath(); x.moveTo(cx - 52, 186); x.quadraticCurveTo(cx, 238, cx + 52, 186); x.stroke();
    for (let q = 0; q <= 12; q++) { const t = q / 12, px = (1 - t) * (1 - t) * (cx - 52) + 2 * t * (1 - t) * cx + t * t * (cx + 52), py = (1 - t) * (1 - t) * 186 + 2 * t * (1 - t) * 238 + t * t * 186; E(px, py, 3.2, 2.4, q % 2 ? "#f0cc50" : "#c9a038"); }
    E(cx, 218, 11, 12, "#c9982e"); E(cx, 218, 8, 9, "#f0cc50"); E(cx - 3, 214, 3, 3, "#fff4c0"); E(cx, 219, 3.5, 3.5, "#2a6a3a");
  } else if (who === "office") {   // дьяк: высокий стоячий ворот с жемчугом, свиток за поясом
    P([[cx - 26, 160], [cx + 26, 160], [cx + 30, 186], [cx - 30, 186]], shade(L.trim, -0.2));
    for (let q = 0; q < 9; q++) E(cx - 24 + q * 6, 173, 2, 2, "#f2eee0");
    orn(cx, 186, cx, 240, 8, shade(L.trim, -0.1), "#e8dcc0");
    x.save(); x.translate(150, 214); x.rotate(-0.5); x.fillStyle = "#e8dcc0"; x.fillRect(-26, -5, 52, 10); E(-26, 0, 3, 5, "#c8b890"); E(26, 0, 3, 5, "#c8b890"); x.fillStyle = "#a82a22"; x.fillRect(-3, -6, 6, 12); x.restore();
  } else if (who === "night") {   // атаман: тулуп с овчиной, портупея, красный кушак
    fluff(cx - 34, 178, 30, 10, "#cdbb9a", 70); fluff(cx + 34, 178, 30, 10, "#cdbb9a", 70);
    x.strokeStyle = "#2a1a10"; x.lineWidth = 9; x.beginPath(); x.moveTo(cx - 52, 180); x.lineTo(cx + 46, 240); x.stroke();
    x.strokeStyle = "#5a3a22"; x.lineWidth = 5; x.beginPath(); x.moveTo(cx - 52, 180); x.lineTo(cx + 46, 240); x.stroke();
    x.fillStyle = "#b8b8b0"; x.fillRect(cx - 8, 204, 10, 10); x.fillStyle = "#2a1a10"; x.fillRect(cx - 5, 207, 4, 4);
    for (let q = 0; q < 6; q++) E(cx - 40 + q * 14, 188 + q * 8.5, 1.8, 1.8, "#c8c8c0");
    x.fillStyle = "#a82626"; x.fillRect(0, 230, 200, 10);
    for (let q = 0; q <= 14; q++) { const t = q / 14, px = cx - 34 + 68 * t, py = 186 + Math.sin(t * Math.PI) * 30; E(px, py, 3.6, 2.8, q % 2 ? "#f2d060" : "#b8902a"); }   // цепь «в палец толщиной»: привет из девяностых
    E(cx, 218, 6, 7, "#f2d060"); x.fillStyle = "#b8902a"; x.fillRect(cx - 1, 213, 2, 10); x.fillRect(cx - 4, 216, 8, 2);
  } else if (who === "birch") {   // Кузьма: белая косоворотка с красной вышивкой
    orn(cx - 24, 172, cx + 24, 172, 8, L.trim, "#f2e8d0");
    orn(cx + 14, 174, cx + 14, 214, 8, L.trim, "#f2e8d0");
    orn(16, 196, 56, 178, 9, L.trim, "#2a4a8a"); orn(144, 178, 184, 196, 9, L.trim, "#2a4a8a");
    x.fillStyle = "#6a4426"; x.fillRect(0, 230, 200, 5);
  } else {   // народ: шаль поверх сарафана и бусы
    x.beginPath(); x.moveTo(-5, 206); x.bezierCurveTo(30, 176, 70, 176, cx, 200); x.bezierCurveTo(130, 176, 170, 176, 205, 206); x.lineTo(205, 226); x.bezierCurveTo(160, 210, 120, 216, cx, 240); x.bezierCurveTo(80, 216, 40, 210, -5, 226); x.closePath();
    x.fillStyle = "#c8a048"; x.fill();
    for (let k = 0; k < 18; k++) E(10 + k * 10.5, 208 + Math.sin(k / 17 * Math.PI) * -12 + 8, 3, 3, k % 2 ? "#b02a2a" : "#2a5a3a");
    for (let q = 0; q < 11; q++) E(cx - 25 + q * 5, 184 + Math.sin(q / 10 * Math.PI) * 9, 2.6, 2.6, q % 2 ? "#c0392b" : "#f0d070");
  }
  if (L.axe) {   // топор на плече
    x.save(); x.translate(146, 240); x.rotate(0.42);
    x.fillStyle = "#9a7048"; x.fillRect(-4, -120, 8, 120); x.fillStyle = "#6a4a2a"; x.fillRect(1.5, -120, 2.5, 120);
    P([[-4, -118], [-30, -130], [-34, -100], [-4, -104]], "#a8b0b8"); P([[-30, -130], [-34, -100], [-36, -100], [-33, -131]], "#e8ecf0"); P([[-4, -118], [-18, -124], [-18, -108], [-4, -104]], "#7a8088");
    x.restore();
  }
  // --- волосы сзади (длинные)
  if (L.hairS === "long") {
    for (const s of [-1, 1]) {
      x.beginPath(); x.moveTo(cx + s * 30 * w, 80); x.bezierCurveTo(cx + s * 39 * w, 104, cx + s * 39, 138, cx + s * 35, 166); x.lineTo(cx + s * 25, 164); x.bezierCurveTo(cx + s * 27, 146, cx + s * 29, 124, cx + s * 22, 100); x.closePath();
      x.fillStyle = shade(L.hair, s > 0 ? -0.35 : 0); x.fill();
      x.save(); x.clip(); strands(22, cx + s * 22, cx + s * 40, 82, 168, cx + s * 30, L.hair); x.restore();
    }
  }
  // --- уши
  for (const s of [-1, 1]) { E(cx + s * 32 * w, 106, 5.5, 10, shade(skin, s > 0 ? -0.35 : -0.08)); E(cx + s * 33 * w, 106, 2.5, 6, shade(skin, -0.45)); }
  // --- голова
  const headPath = () => {
    x.beginPath(); x.moveTo(cx, 56);
    x.bezierCurveTo(cx + 20 * w, 55, cx + 31 * w, 64, cx + 32 * w, 84);
    x.bezierCurveTo(cx + 33 * w, 98, cx + 32 * jw, 110, cx + 29 * jw, 124);
    x.bezierCurveTo(cx + 25 * jw, 138, cx + 15 * jw, ch, cx, ch + 1);
    x.bezierCurveTo(cx - 15 * jw, ch, cx - 25 * jw, 138, cx - 29 * jw, 124);
    x.bezierCurveTo(cx - 32 * jw, 110, cx - 33 * w, 98, cx - 32 * w, 84);
    x.bezierCurveTo(cx - 31 * w, 64, cx - 20 * w, 55, cx, 56); x.closePath();
  };
  headPath(); x.fillStyle = skin; x.fill();
  x.save(); headPath(); x.clip();
  let g = x.createLinearGradient(cx - 34, 0, cx + 34, 0);
  g.addColorStop(0, shade(skin, 0.3, 0.35)); g.addColorStop(0.35, shade(skin, 0, 0)); g.addColorStop(0.62, "rgba(120,50,30,0.12)"); g.addColorStop(1, "rgba(100,40,26,0.6)");
  x.fillStyle = g; x.fillRect(0, 40, 200, 130);
  x.fillStyle = vgrad(120, 156, "rgba(0,0,0,0)", shade(skin, -0.6, 0.35)); x.fillRect(0, 120, 200, 40);
  E(cx - 8, 72, 15, 8, lit);
  for (const s of [-1, 1]) {
    E(cx + s * 13, 97, 11, 6.5, shade(skin, -0.55, s > 0 ? 0.55 : 0.4));
    E(cx + s * 13, 87.5, 9, 2.6, shade(skin, 0.3, s > 0 ? 0.15 : 0.35));
    E(cx + s * 23 * jw, 126, 5, 10, shade(skin, -0.55, s > 0 ? 0.45 : 0.25));
  }
  E(cx - 18, 110, 5, 3.5, shade(skin, 0.3, 0.3));
  if (L.rosy || L.fat) { E(cx - 19, 117, 8, 5, "rgba(214,90,76,0.32)"); E(cx + 19, 117, 8, 5, "rgba(190,70,60,0.3)"); }
  if (L.old) {
    x.strokeStyle = shade(skin, -0.45, 0.6); x.lineWidth = 1.3;
    for (let q = 0; q < 3; q++) { x.beginPath(); x.moveTo(cx - 16, 68 + q * 5); x.quadraticCurveTo(cx, 65 + q * 5, cx + 16, 68 + q * 5); x.stroke(); }
    for (const s of [-1, 1]) for (let q = 0; q < 2; q++) { x.beginPath(); x.moveTo(cx + s * 22, 96 + q * 3); x.lineTo(cx + s * 27, 94 + q * 5); x.stroke(); }
  }
  x.restore();
  // --- глаза
  const eye = (ex, ey, s) => {
    const half = L.brows === "squint" || L.brows === "sly", ew = 6.8, up = half ? 2.4 : 4, dn = half ? 1.8 : 2.6, look = L.brows === "sly" ? 1.6 : 0.4;
    x.save(); x.beginPath(); x.moveTo(ex - ew, ey); x.quadraticCurveTo(ex - 1, ey - up * 1.6, ex + ew, ey - 0.5); x.quadraticCurveTo(ex, ey + dn * 1.5, ex - ew, ey); x.closePath();
    x.fillStyle = "#d9cab4"; x.fill(); x.clip();
    E(ex + look, ey - 0.5, 3.4, 3.4, L.eye); E(ex + look, ey - 0.5, 1.7, 1.7, "#0e0805"); E(ex + look - 1.3, ey - 1.8, 0.9, 0.9, "#ffffff");
    x.fillStyle = "rgba(50,24,14,0.4)"; x.fillRect(ex - ew, ey - 7, ew * 2, 4.5);
    x.restore();
    x.strokeStyle = "#24130b"; x.lineWidth = 2; x.beginPath(); x.moveTo(ex - ew - 0.6, ey + 0.3); x.quadraticCurveTo(ex - 1, ey - up * 1.6, ex + ew + 0.6, ey - 0.6); x.stroke();
    x.strokeStyle = shade(skin, -0.45, 0.55); x.lineWidth = 1.1; x.beginPath(); x.moveTo(ex - ew + 1, ey + 2.6); x.quadraticCurveTo(ex, ey + dn * 1.9, ex + ew - 1, ey + 2); x.stroke();
  };
  for (const s of [-1, 1]) if (!(L.patch && s > 0)) eye(cx + s * 13 * (L.thin ? 0.92 : 1), 98, s);
  if (L.glasses) { x.strokeStyle = "#a08a50"; x.lineWidth = 1.6; for (const s of [-1, 1]) { x.beginPath(); x.arc(cx + s * 13, 98, 9, 0, Math.PI * 2); x.stroke(); E(cx + s * 13 - 4, 94, 2, 1.2, "rgba(255,255,255,0.7)"); } x.beginPath(); x.moveTo(cx - 4, 97); x.quadraticCurveTo(cx, 94, cx + 4, 97); x.stroke(); }
  // --- брови
  const BR = { stern: [90, 84.5, 86], angry: [92, 83, 83], kind: [86, 82.5, 88.5], squint: [89.5, 86.5, 88], sly: [89, 84.5, 87] }[L.brows];
  const bcol = L.woman ? "#7a5a40" : shade(L.beard || L.hair, L.hair === "#cfccc4" ? -0.15 : -0.1);
  for (const s of [-1, 1]) {
    let [yi, ym, yo] = BR; if (L.brows === "sly" && s < 0) { yi -= 3; ym -= 4; yo -= 2; }
    const th = L.woman ? 1.6 : L.brows === "angry" ? 3.8 : 3.2;
    x.beginPath(); x.moveTo(cx + s * 4, yi - th); x.quadraticCurveTo(cx + s * 14, ym - th, cx + s * 23, yo - 0.6); x.lineTo(cx + s * 23, yo + 0.8); x.quadraticCurveTo(cx + s * 14, ym + th * 0.7, cx + s * 4, yi + th); x.closePath();
    x.fillStyle = bcol; x.fill();
  }
  if (L.patch) {   // повязка через глаз
    x.strokeStyle = "#0e0a08"; x.lineWidth = 3; x.beginPath(); x.moveTo(cx - 34 * w, 74); x.lineTo(cx + 34 * w, 108); x.stroke();
    E(cx + 13, 98.5, 10, 7.5, "#141010", -0.25); E(cx + 10, 95.5, 4, 2, "rgba(255,255,255,0.15)", -0.25);
  }
  if (L.scar) { x.strokeStyle = "#a85a4a"; x.lineWidth = 2.2; x.beginPath(); x.moveTo(cx - 28, 102); x.lineTo(cx - 15, 128); x.stroke(); x.lineWidth = 1.3; for (let q = 0; q < 4; q++) { const t = 0.15 + q * 0.22, sx = cx - 28 + 13 * t, sy = 102 + 26 * t; x.beginPath(); x.moveTo(sx - 3.5, sy + 1.5); x.lineTo(sx + 3.5, sy - 1.5); x.stroke(); } }
  // --- нос
  const nw = L.fat ? 1.2 : 1;
  P([[cx + 1, 95], [cx + 5, 108], [cx + 9 * nw, 117], [cx + 6, 121], [cx + 1, 121]], shade(skin, -0.5, 0.55));
  P([[cx - 2.6, 97], [cx - 0.6, 97], [cx + 0.8, 113], [cx - 1.8, 113]], shade(skin, 0.35, 0.5));
  E(cx + 1, 116.5, 4.6 * nw, 3.6, shade(skin, 0.06)); E(cx, 115.3, 1.6, 1.2, shade(skin, 0.5, 0.8));
  E(cx - 4.6 * nw, 119.5, 3, 2.4, shade(skin, -0.12)); E(cx + 6 * nw, 119.5, 3, 2.4, shade(skin, -0.32));
  E(cx - 3.6 * nw, 121.2, 1.8, 1, "#3a1e14"); E(cx + 5 * nw, 121.2, 1.8, 1, "#3a1e14");
  E(cx + 1, 124.5, 6, 1.6, shade(skin, -0.5, 0.35));
  x.strokeStyle = shade(skin, -0.5, 0.45); x.lineWidth = 1.3;
  for (const s of [-1, 1]) { x.beginPath(); x.moveTo(cx + s * 8, 121); x.quadraticCurveTo(cx + s * 13, 128, cx + s * 12, 137); x.stroke(); }
  // --- рот
  const my = 133, lip = L.woman ? "#b8584c" : shade(skin, -0.3);
  x.strokeStyle = "#4a1e14"; x.lineWidth = 1.8; x.beginPath();
  if (L.mouth === "smile") { x.moveTo(cx - 10, my - 1.5); x.quadraticCurveTo(cx, my + 4, cx + 10, my - 1.5); }
  else if (L.mouth === "smirk") { x.moveTo(cx - 9, my + 1); x.quadraticCurveTo(cx + 2, my + 3, cx + 12, my - 3); }
  else if (L.mouth === "thin") { x.moveTo(cx - 8, my + 1); x.lineTo(cx + 8, my); }
  else if (L.mouth === "grin") { x.moveTo(cx - 11, my - 1); x.quadraticCurveTo(cx, my + 7, cx + 11, my - 1); }
  else { x.moveTo(cx - 9, my + 1.5); x.quadraticCurveTo(cx, my - 0.5, cx + 9, my + 1.5); }
  if (L.mouth === "grin") { x.closePath(); x.fillStyle = "#2a0e08"; x.fill(); x.stroke(); x.fillStyle = "#ece2c8"; x.fillRect(cx - 8, my - 0.5, 16, 3); x.fillStyle = "#e0b040"; x.fillRect(cx + 2, my - 0.5, 3.5, 3); x.fillStyle = "#2a0e08"; x.fillRect(cx - 3, my - 0.5, 1.2, 3); }
  else x.stroke();
  if (L.mouth !== "thin" && L.mouth !== "grin") E(cx, my + 4, 6.5, 2.2, lip);
  E(cx, my + 7.5, 5, 1.4, shade(skin, -0.55, 0.3));
  // --- борода и усы
  if (L.beard) {
    const bl = 42 * L.beardLen, tip = ch + bl, bc = L.beard;
    const beardPath = () => {
      x.beginPath();
      if (L.goatee) { x.moveTo(cx - 12, 136); x.quadraticCurveTo(cx - 15, ch - 2, cx - 4, tip); x.lineTo(cx + 4, tip); x.quadraticCurveTo(cx + 15, ch - 2, cx + 12, 136); x.quadraticCurveTo(cx, 141, cx - 12, 136); x.closePath(); return; }
      x.moveTo(cx - 31 * w, 96); x.quadraticCurveTo(cx - 34 * jw, 130, cx - 26 * jw, ch - 4 + bl * 0.4);
      x.quadraticCurveTo(cx - 16, tip - 2, cx, tip); x.quadraticCurveTo(cx + 16, tip - 2, cx + 26 * jw, ch - 4 + bl * 0.4);
      x.quadraticCurveTo(cx + 34 * jw, 130, cx + 31 * w, 96); x.lineTo(cx + 28 * w, 96);
      x.quadraticCurveTo(cx + 25, 118, cx + 14, 126); x.lineTo(cx + 10, 139); x.quadraticCurveTo(cx, 142, cx - 10, 139); x.lineTo(cx - 14, 126); x.quadraticCurveTo(cx - 25, 118, cx - 28 * w, 96); x.closePath();
    };
    beardPath(); x.fillStyle = bc; x.fill();
    x.save(); beardPath(); x.clip();
    x.fillStyle = hgrad(cx - 36, cx + 36, shade(bc, 0.25, 0.4), shade(bc, -0.6, 0.6)); x.fillRect(0, 90, 200, 150);
    x.fillStyle = vgrad(130, tip, "rgba(0,0,0,0)", shade(bc, -0.6, 0.5)); x.fillRect(0, 120, 200, 130);
    strands(L.goatee ? 18 : 70, cx - 32 * jw, cx + 32 * jw, 112, tip, cx, bc, 1.4);
    x.restore();
    if (L.mouth !== "thin" && L.mouth !== "grin") E(cx, my + 4, 5.5, 2, lip);
    const tw = L.hat === "furcap" ? -1 : L.bg === "night" ? 1.4 : 1;
    for (const s of [-1, 1]) {
      x.beginPath(); x.moveTo(cx, 124); x.quadraticCurveTo(cx + s * 10, 122, cx + s * 15, 128);
      if (tw < 0) { x.quadraticCurveTo(cx + s * 20, 130, cx + s * 24, 123); x.quadraticCurveTo(cx + s * 16, 134, cx, 130); }
      else { x.quadraticCurveTo(cx + s * 19, 134, cx + s * 18, 136 + 6 * tw); x.quadraticCurveTo(cx + s * 12, 134, cx, 129.5); }
      x.closePath(); x.fillStyle = s < 0 ? shade(bc, 0.12) : shade(bc, -0.3); x.fill();
      x.strokeStyle = shade(bc, s < 0 ? 0.4 : -0.55, 0.7); x.lineWidth = 1; x.beginPath(); x.moveTo(cx + s * 3, 125); x.quadraticCurveTo(cx + s * 11, 125, cx + s * 15, 131); x.stroke();
    }
  }
  // --- волосы спереди
  if (L.hairS === "long" || L.hairS === "short") {
    const side = L.hairS === "long" ? 104 : 92;
    const hp = () => { x.beginPath(); x.moveTo(cx - 33 * w, side); x.bezierCurveTo(cx - 37 * w, 72, cx - 24 * w, 48, cx, 48); x.bezierCurveTo(cx + 24 * w, 48, cx + 37 * w, 72, cx + 33 * w, side);
      x.lineTo(cx + 29 * w, side - 6); x.quadraticCurveTo(cx + 28 * w, 76, cx + 14, 68); x.quadraticCurveTo(cx + 6, 66, cx + 3, 70); x.quadraticCurveTo(cx - 10, 63, cx - 22, 70); x.quadraticCurveTo(cx - 29 * w, 78, cx - 29 * w, side - 6); x.closePath(); };
    hp(); x.fillStyle = L.hair; x.fill();
    x.save(); hp(); x.clip(); x.fillStyle = hgrad(cx - 36, cx + 36, shade(L.hair, 0.3, 0.5), shade(L.hair, -0.6, 0.6)); x.fillRect(0, 40, 200, 80);
    x.lineWidth = 1.4; for (let k = 0; k < 40; k++) { const s = R() < 0.5 ? -1 : 1, sx = cx + s * R() * 6; x.strokeStyle = k % 2 ? shade(L.hair, 0.35, 0.8) : shade(L.hair, -0.45, 0.8); x.beginPath(); x.moveTo(sx, 50); x.quadraticCurveTo(cx + s * (16 + R() * 14), 56, cx + s * (24 + R() * 12) * w, 70 + R() * (side - 64)); x.stroke(); }
    x.restore();
  } else if (L.hairS === "bald") {
    E(cx - 8, 64, 11, 5, shade(skin, 0.4, 0.55));
    for (const s of [-1, 1]) { E(cx + s * 31 * w, 92, 6, 11, shade(L.hair, s > 0 ? -0.25 : 0)); x.save(); x.beginPath(); x.ellipse(cx + s * 31 * w, 92, 6, 11, 0, 0, Math.PI * 2); x.clip(); strands(10, cx + s * 26, cx + s * 37, 80, 104, cx + s * 31, L.hair); x.restore(); }
  }
  if (L.band) { orn(cx - 35, 76, cx + 35, 73, 8, L.trim, "#f2e8d0"); }
  // --- головные уборы
  if (L.hat === "gorlat") {   // горлатная шапка: высокая, меховая, бархатный верх
    x.beginPath(); x.moveTo(cx - 34 * w, 72); x.lineTo(cx - 42, 2); x.quadraticCurveTo(cx, -6, cx + 42, 2); x.lineTo(cx + 34 * w, 72); x.quadraticCurveTo(cx, 64, cx - 34 * w, 72); x.closePath();
    x.fillStyle = hgrad(cx - 42, cx + 42, "#8a6038", "#2e1a0c"); x.fill();
    x.save(); x.clip(); x.lineWidth = 1.4; for (let k = 0; k < 90; k++) { const hx = cx - 44 + R() * 88, hy = R() * 72; x.strokeStyle = k % 2 ? "rgba(255,220,170,0.28)" : "rgba(20,10,4,0.4)"; x.beginPath(); x.moveTo(hx, hy); x.lineTo(hx + 1.5, hy - 6); x.stroke(); } x.restore();
    x.fillStyle = "#b8b098"; for (let q = 0; q < 9; q++) E(cx - 28 + q * 7, 70 - Math.sin(q / 8 * Math.PI) * 4, 1.8, 1.8, "#f2ecd8");
  } else if (L.hat === "furcap") {   // бархатная шапка с собольей опушкой
    E(cx, 58, 33 * w, 26, "#7a1a1a"); E(cx - 10, 46, 12, 9, "rgba(255,140,120,0.25)");
    for (let q = 0; q < 6; q++) E(cx - 22 + q * 9, 48 - Math.sin(q / 5 * Math.PI) * 10, 1.8, 1.8, "#f0cc50");
    x.beginPath(); x.roundRect(cx - 39 * w, 56, 78 * w, 18, 8); x.fillStyle = "#1a1512"; x.fill();
    x.save(); x.clip(); fluff(cx, 65, 40 * w, 10, "#2a221c", 120); x.restore();
  } else if (L.hat === "tafya") {   // тафья — маленькая шапочка
    x.save(); x.beginPath(); x.rect(0, 0, 200, 70); x.clip(); E(cx, 70, 29 * w, 20, "#16141c");
    for (let q = 0; q < 7; q++) E(cx - 18 + q * 6, 58 - Math.sin(q / 6 * Math.PI) * 6, 1.4, 1.4, "#c9a04a"); x.restore();
    x.fillStyle = "#c9a04a"; x.fillRect(cx - 29 * w, 68, 58 * w, 2.5);
  } else if (L.hat === "papakha") {   // папаха набекрень
    x.save(); x.translate(cx, 64); x.rotate(-0.14);
    x.beginPath(); x.roundRect(-40, -44, 80, 54, 10); x.fillStyle = "#1a1410"; x.fill();
    x.clip(); for (let k = 0; k < 140; k++) E(-40 + R() * 80, -44 + R() * 54, 2.6, 2.2, k % 3 ? "#2e241c" : "#4a3a2c"); x.restore();
    x.save(); x.translate(cx, 64); x.rotate(-0.14); x.fillStyle = "#a82626"; x.fillRect(-32, -48, 64, 8); x.fillStyle = "#d6aa44"; x.fillRect(-2, -48, 4, 8); x.restore();
  } else if (L.hat === "platok") {   // платок с цветами, узел под подбородком
    const pp = () => { x.beginPath(); x.moveTo(cx - 40, 168); x.bezierCurveTo(cx - 50, 110, cx - 44, 46, cx, 42); x.bezierCurveTo(cx + 44, 46, cx + 50, 110, cx + 40, 168); x.lineTo(cx + 20, 160);
      x.bezierCurveTo(cx + 30, 130, cx + 30, 80, cx, 72); x.bezierCurveTo(cx - 30, 80, cx - 30, 130, cx - 20, 160); x.closePath(); };
    pp(); x.fillStyle = "#b8302a"; x.fill();
    x.save(); pp(); x.clip(); x.fillStyle = hgrad(cx - 50, cx + 50, "rgba(255,200,170,0.25)", "rgba(40,0,0,0.5)"); x.fillRect(0, 30, 200, 150);
    for (let k = 0; k < 30; k++) { const fx3 = cx - 48 + R() * 96, fy3 = 44 + R() * 124; for (let p = 0; p < 4; p++) E(fx3 + Math.cos(p * 1.57) * 2.4, fy3 + Math.sin(p * 1.57) * 2.4, 1.7, 1.7, k % 2 ? "#f0d070" : "#f2ead6"); E(fx3, fy3, 1.2, 1.2, "#2a5a3a"); }
    x.restore();
    x.strokeStyle = "#e8c060"; x.lineWidth = 2; x.beginPath(); x.moveTo(cx - 28, 154); x.bezierCurveTo(cx - 32, 110, cx - 26, 76, cx, 72); x.bezierCurveTo(cx + 26, 76, cx + 32, 110, cx + 28, 154); x.stroke();
    P([[cx - 8, 152], [cx - 22, 176], [cx - 2, 164]], "#9a2620"); P([[cx + 8, 152], [cx + 22, 174], [cx + 2, 164]], "#8a2018"); E(cx, 156, 6, 5, "#b8302a");
  }
  if (L.quill) { x.save(); x.translate(cx + 30 * w, 84); x.rotate(-0.55); P([[0, 0], [4, -40], [9, -42], [3, 2]], "#f2ead6"); P([[4, -40], [9, -42], [7, -20]], "#d8ccb4"); x.strokeStyle = "#7a7a7a"; x.lineWidth = 0.9; x.beginPath(); x.moveTo(1.5, 0); x.lineTo(6.5, -41); x.stroke(); x.restore(); }
}