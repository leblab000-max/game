// =====================================================================
//  Рисование: текстуры, фон в несколько слоёв, персонажи, эффекты
// =====================================================================
const cv = $("cv"), g = cv.getContext("2d");
const TAU = Math.PI * 2;
let CW = 400, CH = 700, dpr = 1, sc = 0.5, offY = 0, viewW = 1000;
const rnd = (a, b) => a + Math.random() * (b - a);
// ---- текстуры материалов (рисуются один раз)
function mkTex(w, h, fn) { const c = document.createElement("canvas"); c.width = w; c.height = h; fn(c.getContext("2d"), w, h); return c; }
const TEX = {
  wood: mkTex(128, 64, (x, w, h) => {
    x.fillStyle = "#c98a3e"; x.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 2) { x.fillStyle = `rgba(${120 + Math.random() * 30},${70 + Math.random() * 20},20,${0.08 + Math.random() * 0.1})`; x.fillRect(0, y, w, 1); }
    x.strokeStyle = "rgba(100,55,15,0.45)"; x.lineWidth = 1.2;
    for (let k = 0; k < 6; k++) { const y0 = rnd(4, h - 4); x.beginPath(); for (let i = 0; i <= w; i += 8) x.lineTo(i, y0 + Math.sin(i / 14 + k) * 2.5); x.stroke(); }
    for (let k = 0; k < 2; k++) { const cx = rnd(20, w - 20), cy = rnd(15, h - 15); x.fillStyle = "rgba(90,50,15,0.55)"; x.beginPath(); x.ellipse(cx, cy, 6, 3, 0, 0, TAU); x.fill(); x.strokeStyle = "rgba(90,50,15,0.3)"; x.beginPath(); x.ellipse(cx, cy, 11, 5.5, 0, 0, TAU); x.stroke(); }
  }),
  ice: mkTex(96, 96, (x, w, h) => {
    const gr = x.createLinearGradient(0, 0, w, h); gr.addColorStop(0, "#d8f6ff"); gr.addColorStop(1, "#8fd8f4"); x.fillStyle = gr; x.fillRect(0, 0, w, h);
    x.strokeStyle = "rgba(255,255,255,0.7)"; x.lineWidth = 2; for (let k = 0; k < 4; k++) { const s = rnd(0, w); x.beginPath(); x.moveTo(s, 0); x.lineTo(s - 30, h); x.stroke(); }
    x.fillStyle = "rgba(255,255,255,0.6)"; for (let k = 0; k < 10; k++) { x.beginPath(); x.arc(rnd(0, w), rnd(0, h), rnd(1, 2.5), 0, TAU); x.fill(); }
  }),
  stone: mkTex(96, 96, (x, w, h) => {
    x.fillStyle = "#9ca2ae"; x.fillRect(0, 0, w, h);
    for (let k = 0; k < 400; k++) { const v = 120 + Math.random() * 60; x.fillStyle = `rgba(${v},${v + 4},${v + 12},0.5)`; x.fillRect(rnd(0, w), rnd(0, h), 2, 2); }
    x.strokeStyle = "rgba(60,64,76,0.55)"; x.lineWidth = 2;
    for (let r = 0; r < 4; r++) { const y = r * 24; x.beginPath(); x.moveTo(0, y); x.lineTo(w, y); x.stroke(); for (let c = 0; c < 3; c++) { const xx = c * 36 + (r % 2) * 18; x.beginPath(); x.moveTo(xx, y); x.lineTo(xx, y + 24); x.stroke(); } }
  }),
};
const PAT = {};
function pat(m) { return PAT[m] || (PAT[m] = g.createPattern(TEX[m], "repeat")); }
const EDGE = { wood: ["#e8b06a", "#7a4a1a", "#5a3410"], ice: ["#ffffff", "#5ab0d8", "#3a8ab0"], stone: ["#d0d4dc", "#5a606c", "#3a3e48"] };
// ---- темы глав: небо, горы, лес, холмы, земля
const THEMES = {
  day: { sky: ["#4ab4f8", "#bfe8ff", "#e8f8ff"], sun: "#fff8c0", glow: "255,250,200", mount: "#a8c8e8", cap: "#f4faff", forestBg: "#6fb85a", tree: ["#4a9a48", "#3f8a42"], hill: "#86d06a", crown: "#3f9a40", grass: ["#5cb040", "#86d86a", "#4aa035", "#5cb845"], dirt: ["#9a5e30", "#6a3e1c"], cloud: "rgba(255,255,255,0.92)", tint: null },
  dusk: { sky: ["#5a4ab0", "#ff9a6a", "#ffd08a"], sun: "#ffb060", glow: "255,170,90", mount: "#8a6aa0", cap: "#f0c0d0", forestBg: "#5a7a4a", tree: ["#3a5a3a", "#2f4f34"], hill: "#7a9a4a", crown: "#4a6a2a", grass: ["#6a9a3a", "#9ac05a", "#5a8a30", "#6a9a3a"], dirt: ["#8a4e28", "#5a2e14"], cloud: "rgba(255,200,180,0.85)", tint: "rgba(255,120,60,0.08)", mill: true },
  winter: { sky: ["#8ab8e0", "#dcecf8", "#f4f8fc"], sun: "#ffffff", glow: "255,255,255", mount: "#b8c8dc", cap: "#ffffff", forestBg: "#e8f0f8", tree: ["#2f6a5a", "#285a4e"], hill: "#eef4fa", crown: "#3a7a64", grass: ["#f4f8fc", "#ffffff", "#dde8f2", "#eef4fa"], dirt: ["#8a7a6a", "#5a4a3e"], cloud: "rgba(255,255,255,0.95)", tint: null, snow: true },
  night: { sky: ["#0a1030", "#2a3a7a", "#5a5aa0"], sun: "#f8f4d8", glow: "200,210,255", mount: "#2a2a5a", cap: "#6a6aa0", forestBg: "#1a3a3a", tree: ["#123030", "#0e2828"], hill: "#2a4a3a", crown: "#1a3a2a", grass: ["#3a6a3a", "#4a8a4a", "#2a5a2a", "#3a6a3a"], dirt: ["#4a3020", "#2a1a10"], cloud: "rgba(120,130,180,0.5)", tint: "rgba(20,30,90,0.18)", moon: true, castle: true },
};
let previewN = 0;
const curTheme = () => THEMES[CHAPTERS[chapterOf(S ? S.n : previewN)].theme];
const BGS = {};
function buildBg(T) {
  const W = 2400;
  const mount = mkTex(W, 400, (x, w, h) => {
    x.fillStyle = T.mount; x.beginPath(); x.moveTo(0, h);
    for (let i = 0; i <= w; i += 40) x.lineTo(i, 120 + Math.abs(Math.sin(i / 260)) * -90 + Math.sin(i / 90) * 20 + Math.cos(i / 37) * 8);
    x.lineTo(w, h); x.fill();
    x.fillStyle = T.cap; for (let i = 0; i < w; i += 260) { const px = i + 130; x.beginPath(); x.moveTo(px - 40, 70); x.lineTo(px, 30 + Math.sin(i) * 10); x.lineTo(px + 40, 70); x.fill(); }
    if (T.castle) {   // силуэт крысиного замка вдали
      x.fillStyle = "#14143a"; const cx = 900; x.fillRect(cx - 160, 150, 320, 250); for (const [dx, hh] of [[-160, 120], [-60, 170], [60, 140], [160, 120]]) { x.fillRect(cx + dx - 30, 150 - hh + 100, 60, hh); x.beginPath(); x.moveTo(cx + dx - 38, 150 - hh + 100); x.lineTo(cx + dx, 150 - hh + 40); x.lineTo(cx + dx + 38, 150 - hh + 100); x.fill(); }
      x.fillStyle = "#ffd060"; for (let k = 0; k < 9; k++) x.fillRect(cx - 140 + k * 34, 200 + (k % 3) * 40, 8, 12);
    }
  });
  const forest = mkTex(W, 300, (x, w, h) => {
    x.fillStyle = T.forestBg; x.fillRect(0, 160, w, h);
    for (let i = 0; i < w; i += 26) { const tx = i + Math.sin(i) * 8, th = 70 + (Math.sin(i * 0.37) + 1) * 30; x.fillStyle = i % 3 ? T.tree[0] : T.tree[1]; x.beginPath(); x.moveTo(tx, 170 - th); x.lineTo(tx + 26, 175); x.lineTo(tx - 26, 175); x.fill();
      if (T.snow) { x.fillStyle = "#ffffff"; x.beginPath(); x.moveTo(tx, 170 - th); x.lineTo(tx + 9, 170 - th + 22); x.lineTo(tx - 9, 170 - th + 22); x.fill(); } }
    if (T.mill) {   // мельница с крыльями
      const mx = 1500; x.fillStyle = "#4a2a3a"; x.beginPath(); x.moveTo(mx - 40, 175); x.lineTo(mx - 24, 60); x.lineTo(mx + 24, 60); x.lineTo(mx + 40, 175); x.fill(); x.beginPath(); x.moveTo(mx - 30, 62); x.lineTo(mx, 30); x.lineTo(mx + 30, 62); x.fill();
    }
  });
  const hills = mkTex(W, 300, (x, w, h) => {
    x.fillStyle = T.hill; x.beginPath(); x.moveTo(0, h);
    for (let i = 0; i <= w; i += 20) x.lineTo(i, 120 - Math.sin(i / 300) * 50 - Math.sin(i / 110) * 12);
    x.lineTo(w, h); x.fill();
    for (let i = 60; i < w; i += 180 + (i % 70)) { const y = 120 - Math.sin(i / 300) * 50 - Math.sin(i / 110) * 12; x.fillStyle = "#5a3418"; x.fillRect(i - 4, y - 40, 8, 42); x.fillStyle = T.crown; for (const [dx, dy, r] of [[0, -55, 26], [-18, -40, 20], [18, -40, 20]]) { x.beginPath(); x.arc(i + dx, y + dy, r, 0, TAU); x.fill(); } x.fillStyle = T.snow ? "#ffffff" : "rgba(255,255,255,0.15)"; x.beginPath(); x.arc(i - 6, y - 66, T.snow ? 16 : 10, Math.PI, 0); x.fill(); }
  });
  return { mount, forest, hills, W };
}
function layer(img, par, y0, scale = 1) {
  const cam = S ? S.camX : 0, w = img.width * sc * scale, h = img.height * sc * scale;
  let x = -((cam * par * sc) % w); if (x > 0) x -= w;
  for (; x < CW; x += w) g.drawImage(img, x, offY + y0 * sc, w + 1, h);
}
const STARS = Array.from({ length: 80 }, () => [Math.random(), Math.random() * 0.6, Math.random() * 1.5 + 0.5]);
const FLAKES = Array.from({ length: 70 }, () => [Math.random(), Math.random(), 1 + Math.random() * 2.5, Math.random()]);
function sky() {
  const T = curTheme(), key = CHAPTERS[chapterOf(S ? S.n : previewN)].theme, BG = BGS[key] || (BGS[key] = buildBg(T));
  const gr = g.createLinearGradient(0, 0, 0, CH); gr.addColorStop(0, T.sky[0]); gr.addColorStop(0.6, T.sky[1]); gr.addColorStop(1, T.sky[2]);
  g.fillStyle = gr; g.fillRect(0, 0, CW, CH);
  const t = performance.now() / 1000;
  if (T.moon) for (const [x, y, s] of STARS) { g.fillStyle = `rgba(255,255,255,${0.5 + 0.5 * Math.sin(t * 2 + x * 50)})`; g.fillRect(x * CW, y * CH, s, s); }
  const sx = CW * 0.8, sy = offY + (T.moon ? 140 : 110) * sc, sr = 55 * sc;
  const sg = g.createRadialGradient(sx, sy, sr * 0.5, sx, sy, sr * 3); sg.addColorStop(0, `rgba(${T.glow},0.9)`); sg.addColorStop(1, `rgba(${T.glow},0)`); g.fillStyle = sg; g.fillRect(sx - sr * 3, sy - sr * 3, sr * 6, sr * 6);
  g.fillStyle = T.sun; g.beginPath(); g.arc(sx, sy, sr, 0, TAU); g.fill();
  if (T.moon) { g.fillStyle = "rgba(180,180,200,0.5)"; for (const [dx, dy, r] of [[-0.3, -0.2, 0.2], [0.25, 0.1, 0.15], [-0.05, 0.35, 0.12]]) { g.beginPath(); g.arc(sx + dx * sr, sy + dy * sr, r * sr, 0, TAU); g.fill(); } }
  const cam = S ? S.camX : 0;
  g.fillStyle = T.cloud;
  for (let i = 0; i < 7; i++) { const x = ((i * 600 + t * 8 - cam * 0.12) % 4200 + 4200) % 4200 * sc - 250 * sc, y = offY + (70 + (i * 61) % 150) * sc; cloud(x, y, (55 + (i * 23) % 45) * sc); }
  layer(BG.mount, 0.1, 330); layer(BG.forest, 0.25, 480);
  if (T.mill) { const mx = ((1500 - cam * 0.25 * 1) * sc) % (BG.W * sc), my = offY + (480 + 50) * sc; g.save(); g.translate(mx, my); g.rotate(t * 0.6); g.fillStyle = "#3a1e2a"; for (let k = 0; k < 4; k++) { g.rotate(Math.PI / 2); g.fillRect(-4 * sc, 0, 8 * sc, 70 * sc); g.fillRect(-14 * sc, 18 * sc, 10 * sc, 50 * sc); } g.restore(); }
  layer(BG.hills, 0.5, 560);
}
function weather() {   // снегопад зимой
  const T = curTheme(); if (!T.snow) return;
  const t = performance.now() / 1000; g.fillStyle = "rgba(255,255,255,0.9)";
  for (const f of FLAKES) { const x = ((f[0] * CW + Math.sin(t + f[3] * 6) * 20) % CW + CW) % CW, y = ((f[1] + t * 0.05 * f[2]) % 1) * CH; g.beginPath(); g.arc(x, y, f[2], 0, TAU); g.fill(); }
}
function cloud(x, y, r) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.arc(x + r * 0.95, y + r * 0.25, r * 0.75, 0, TAU); g.arc(x - r * 0.95, y + r * 0.3, r * 0.68, 0, TAU); g.arc(x + r * 0.3, y - r * 0.4, r * 0.6, 0, TAU); g.fill(); }
function groundStrip() {
  const T = curTheme(), x0 = Math.floor((S.camX - 60) / 56) * 56, top = KIMG[T.snow ? "snow" : "grass"], dirt = KIMG.dirt, TS = 56;
  if (ready(top) && ready(dirt)) {
    for (let x = x0; x < S.camX + viewW + 60; x += TS) { g.drawImage(top, x, GY - 14, TS + 0.5, TS + 0.5); for (let y = GY - 14 + TS; y < GY + 260; y += TS) g.drawImage(dirt, x, y, TS + 0.5, TS + 0.5); }
  } else { g.fillStyle = T.dirt[0]; g.fillRect(S.camX - 60, GY, viewW + 120, 260); }
  // кусты вдоль земли
  const bush = KIMG[T.snow ? "frozenBush" : "bush"];
  if (ready(bush)) for (let x = Math.floor(S.camX / 330) * 330 + 140; x < S.camX + viewW; x += 330) if (Math.abs(x - SLING.x) > 120) g.drawImage(bush, x, GY - 48, 46, 46);
  // холмы-утёсы из тех же плиток
  for (const r of S.rocks) {
    const { w: rw, h: rh } = r.rock, x = r.position.x - rw / 2, y = r.position.y - rh / 2;
    g.save(); g.beginPath(); g.roundRect(x, y - 12, rw, rh + 12, [26, 26, 0, 0]); g.clip();
    if (ready(top) && ready(dirt)) { for (let xx = x; xx < x + rw; xx += TS) { g.drawImage(top, xx, y - 12, TS + 0.5, TS + 0.5); for (let yy = y - 12 + TS; yy < y + rh; yy += TS) g.drawImage(dirt, xx, yy, TS + 0.5, TS + 0.5); } }
    else { g.fillStyle = pat("stone"); g.fillRect(x, y, rw, rh); }
    g.fillStyle = "rgba(0,0,0,0.18)"; g.fillRect(x + rw - 18, y, 18, rh);
    g.restore();
    g.strokeStyle = "rgba(60,30,10,0.5)"; g.lineWidth = 3; g.beginPath(); g.roundRect(x, y - 12, rw, rh + 12, [26, 26, 0, 0]); g.stroke();
  }
}
function grassFront() {
  const T = curTheme(), x0 = Math.floor((S.camX - 40) / 22) * 22;
  for (let x = x0; x < S.camX + viewW + 40; x += 22) { const h = 14 + (x * 7 % 13); g.fillStyle = (x / 22) % 2 ? T.grass[2] : T.grass[3]; g.beginPath(); g.moveTo(x, GY + 12); g.quadraticCurveTo(x + 4, GY + 4 - h * 0.4, x + 9 + Math.sin(performance.now() / 700 + x) * 2, GY + 6 - h); g.quadraticCurveTo(x + 8, GY, x + 14, GY + 12); g.fill(); }
  if (!T.snow) for (let x = x0 + 11; x < S.camX + viewW; x += 154) { g.fillStyle = ["#ffffff", "#ffd84a", "#ff8ac8"][(x / 154 | 0) % 3]; g.beginPath(); g.arc(x, GY - 2, 4, 0, TAU); g.fill(); g.fillStyle = "#ffb020"; g.beginPath(); g.arc(x, GY - 2, 1.6, 0, TAU); g.fill(); }
}
// ---- блоки
function bodyPath(b) { g.beginPath(); b.vertices.forEach((v, i) => i ? g.lineTo(v.x, v.y) : g.moveTo(v.x, v.y)); g.closePath(); }
// спрайты Kenney: выбор картинки по форме и степени разрушения
const ready = im => im && im.complete && im.naturalWidth > 0;
function spriteFor(b) {
  const st = b.hp / b.hp0 > 0.66 ? 0 : b.hp / b.hp0 > 0.33 ? 1 : 2;
  if (b.shape === "tnt") return KIMG["tnt_" + st];
  if (b.shape === "ball") return KIMG[`${b.mat}_ball_${st}`];
  if (b.shape === "poly") return KIMG[`${b.mat}_tri_${st}`];
  const ar = b.sw / b.sh, slot = ar >= 1.8 ? "h" : ar <= 0.56 ? "v" : (Math.max(b.sw, b.sh) >= 100 ? "S" : "s");
  return KIMG[`${b.mat}_${slot}_${st}`];
}
// растяжение «девять частей»: рамка картинки не растягивается, только середина
function slice9(im, w, h) {
  const iw = im.naturalWidth, ih = im.naturalHeight, src = Math.min(iw, ih) * 0.2, k = Math.min(w / iw, h / ih, Math.min(w, h) / Math.min(iw, ih)), d = Math.max(3, src * Math.max(k, Math.min(w, h) / Math.min(iw, ih)));
  const xs = [0, src, iw - src, iw], ys = [0, src, ih - src, ih], X = [-w / 2, -w / 2 + d, w / 2 - d, w / 2], Y = [-h / 2, -h / 2 + d, h / 2 - d, h / 2];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) { const sw = xs[c + 1] - xs[c], sh = ys[r + 1] - ys[r], dw = X[c + 1] - X[c], dh = Y[r + 1] - Y[r]; if (sw > 0 && sh > 0 && dw > 0 && dh > 0) g.drawImage(im, xs[c], ys[r], sw, sh, X[c], Y[r], dw + 0.5, dh + 0.5); }
}
function drawBlock(b) {
  const im = spriteFor(b);
  g.save(); g.translate(b.position.x, b.position.y); g.rotate(b.angle);
  if (!ready(im)) { g.fillStyle = MATCOL[b.mat][0]; g.fillRect(-(b.sw || b.r * 2) / 2, -(b.sh || b.r * 2) / 2, b.sw || b.r * 2, b.sh || b.r * 2); g.restore(); return; }
  if (b.mat === "ice") g.globalAlpha = 0.92;
  if (b.shape === "ball") g.drawImage(im, -b.r, -b.r, b.r * 2, b.r * 2);
  else if (b.shape === "poly") g.drawImage(im, -b.sw / 2, -b.sh / 2 - b.sh / 6, b.sw, b.sh);
  else slice9(im, b.sw, b.sh);
  g.restore();
}
// ---- коты
// ---- персонажи в плоском стиле Kenney: заливка без градиентов, контур темнее того же цвета
// цвета: [основной, контур и детали, светлый блик, мордочка]
const CATCOL = {
  ginger: ["#ffa443", "#c4651c", "#ffc27d", "#fff1de"], fat: ["#9aa6bd", "#5e6a82", "#bfc8da", "#eef1f6"],
  triple: ["#5a5a72", "#2e2e42", "#76769a", "#d8d8e8"], kitten: ["#5a5a72", "#2e2e42", "#76769a", "#d8d8e8"],
  rocket: ["#f3f4f8", "#9aa0b4", "#ffffff", "#ffffff"], bomb: ["#3f3f4e", "#1c1c26", "#5a5a6e", "#9a9ab0"],
};
function blob(cx, cy, rx, ry, fill, line, lw) { g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, TAU); g.fillStyle = fill; g.fill(); if (line) { g.lineWidth = lw; g.strokeStyle = line; g.stroke(); } }
function drawCat(x, y, r, ang, kind, mood = "angry", vel = null, squash = 0) {
  const [c, o, hi, face] = CATCOL[kind], lw = Math.max(2, r * 0.09);
  g.save(); g.translate(x, y);
  if (vel) { const sp = Math.hypot(vel.x, vel.y), a = Math.atan2(vel.y, vel.x), st = 1 + Math.min(0.22, sp / 90) - squash * 1.2; g.rotate(a); g.scale(st, 1 / st); g.rotate(-a); }
  g.rotate(ang); g.lineJoin = "round"; g.lineCap = "round";
  // хвост
  g.strokeStyle = o; g.lineWidth = r * 0.34; g.beginPath(); g.moveTo(-r * 0.6, r * 0.55); g.quadraticCurveTo(-r * 1.55, r * 0.5 + Math.sin(performance.now() / 160) * r * 0.2, -r * 1.3, -r * 0.35); g.stroke();
  g.strokeStyle = c; g.lineWidth = r * 0.2; g.stroke();
  // уши
  for (const s of [-1, 1]) {
    g.beginPath(); g.moveTo(s * r * 0.92, -r * 0.2); g.lineTo(s * r * 0.8, -r * 1.22); g.lineTo(s * r * 0.08, -r * 0.86); g.closePath(); g.fillStyle = c; g.fill(); g.lineWidth = lw; g.strokeStyle = o; g.stroke();
    g.beginPath(); g.moveTo(s * r * 0.72, -r * 0.48); g.lineTo(s * r * 0.7, -r * 0.98); g.lineTo(s * r * 0.34, -r * 0.8); g.closePath(); g.fillStyle = "#ff9fb4"; g.fill();
  }
  blob(0, 0, r, r, c, o, lw);
  // блик и «веснушки» как у персонажей Kenney
  g.save(); g.beginPath(); g.arc(0, 0, r - lw / 2, 0, TAU); g.clip(); blob(-r * 0.25, -r * 0.35, r * 0.75, r * 0.6, hi); blob(0, -r * 0.05, r * 0.92, r * 0.92, c); g.restore();
  if (kind === "ginger") { g.strokeStyle = o; g.lineWidth = r * 0.12; for (const k of [-0.3, 0, 0.3]) { g.beginPath(); g.moveTo(k * r, -r * 0.94); g.lineTo(k * r * 0.8, -r * 0.66); g.stroke(); } }
  if (kind === "fat") blob(0, r * 0.5, r * 0.55, r * 0.36, face);
  if (kind === "bomb") { g.strokeStyle = "#7a5230"; g.lineWidth = r * 0.12; g.beginPath(); g.moveTo(r * 0.05, -r * 0.95); g.quadraticCurveTo(r * 0.3, -r * 1.55, r * 0.62, -r * 1.42); g.stroke(); blob(r * 0.64, -r * 1.44, r * 0.15, r * 0.15, Math.sin(performance.now() / 60) > 0 ? "#ffd02a" : "#ff6a2a"); g.fillStyle = "#ff8a2a"; g.beginPath(); g.roundRect(-r * 0.85, r * 0.6, r * 1.7, r * 0.22, r * 0.1); g.fill(); }
  if (kind === "rocket") { g.fillStyle = "#e0303a"; g.beginPath(); g.roundRect(-r * 0.9, r * 0.6, r * 1.8, r * 0.24, r * 0.1); g.fill(); }
  // мордочка
  blob(0, r * 0.34, r * 0.46, r * 0.3, face);
  const ey = -r * 0.1;
  for (const s of [-1, 1]) {
    if (kind === "rocket") { blob(s * r * 0.36, ey, r * 0.3, r * 0.3, "#9fe0ff", "#5a6a8a", lw * 0.8); }
    blob(s * r * 0.36, ey, r * 0.22, r * 0.26, "#ffffff", o, lw * 0.6);
    blob(s * r * 0.36 + r * 0.06, ey + r * 0.03, r * 0.11, r * 0.15, "#2a2a36");
    blob(s * r * 0.36 + r * 0.02, ey - r * 0.05, r * 0.045, r * 0.045, "#ffffff");
    g.strokeStyle = o; g.lineWidth = r * 0.13; g.beginPath();
    if (mood === "angry" || mood === "yell") { g.moveTo(s * r * 0.62, ey - r * 0.36); g.lineTo(s * r * 0.14, ey - r * 0.2); } else { g.moveTo(s * r * 0.56, ey - r * 0.42); g.lineTo(s * r * 0.18, ey - r * 0.38); }
    g.stroke();
  }
  blob(0, r * 0.2, r * 0.1, r * 0.07, "#ff7a96");
  if (mood === "yell") { blob(0, r * 0.48, r * 0.18, r * 0.2, "#7a2238"); blob(0, r * 0.56, r * 0.1, r * 0.07, "#ff8aa0"); }
  else { g.strokeStyle = o; g.lineWidth = r * 0.07; g.beginPath(); g.moveTo(-r * 0.2, r * 0.36); g.quadraticCurveTo(-r * 0.1, r * 0.46, 0, r * 0.3); g.quadraticCurveTo(r * 0.1, r * 0.46, r * 0.2, r * 0.36); g.stroke(); }
  g.strokeStyle = o; g.lineWidth = Math.max(1, r * 0.04); for (const s of [-1, 1]) for (const k of [-0.07, 0.07]) { g.beginPath(); g.moveTo(s * r * 0.48, r * 0.32); g.lineTo(s * r * 1.02, r * (0.28 + k * 2.2)); g.stroke(); }
  g.restore();
}
// ---- мыши
function drawMouse(m, t) {
  const r = m.r, hop = S.taunt > 0 ? Math.abs(Math.sin(t * 10 + m.seed)) * r * 0.5 : 0, c = "#b4b8c8", o = "#6a6e84", hi = "#cdd0dc", lw = Math.max(2, r * 0.09);
  g.save(); g.translate(m.position.x, m.position.y - hop); g.rotate(m.angle); g.lineJoin = "round"; g.lineCap = "round";
  const sq = m.ouch ? 1 + Math.sin(m.ouch * 30) * 0.08 : 1; g.scale(sq, 1 / sq);
  g.strokeStyle = "#e892a6"; g.lineWidth = r * 0.12; g.beginPath(); g.moveTo(r * 0.6, r * 0.6); g.quadraticCurveTo(r * 1.5, r * 0.95, r * 1.3 + Math.sin(t * 3 + m.seed) * r * 0.2, r * 0.2); g.stroke();
  for (const s of [-1, 1]) { blob(s * r * 0.72, -r * 0.78, r * 0.52, r * 0.52, c, o, lw); blob(s * r * 0.72, -r * 0.78, r * 0.3, r * 0.3, "#ffb2c4"); }
  blob(0, 0, r, r, c, o, lw);
  g.save(); g.beginPath(); g.arc(0, 0, r - lw / 2, 0, TAU); g.clip(); blob(-r * 0.25, -r * 0.35, r * 0.75, r * 0.6, hi); blob(0, -r * 0.05, r * 0.92, r * 0.92, c); g.restore();
  blob(r * 0.45, r * 0.5, r * 0.07, r * 0.07, o); blob(r * 0.6, r * 0.36, r * 0.05, r * 0.05, o);
  if (m.kind === "helmet") { g.beginPath(); g.arc(0, -r * 0.18, r * 1.02, Math.PI * 1.04, Math.PI * 1.96); g.closePath(); g.fillStyle = "#7f8a9e"; g.fill(); g.lineWidth = lw; g.strokeStyle = "#4a5266"; g.stroke(); g.fillStyle = "#a6b0c2"; g.beginPath(); g.roundRect(-r * 0.62, -r * 0.92, r * 0.22, r * 0.5, r * 0.08); g.fill(); }
  if (m.kind === "king") { g.beginPath(); g.moveTo(-r * 0.6, -r * 0.72); g.lineTo(-r * 0.62, -r * 1.22); g.lineTo(-r * 0.3, -r * 0.95); g.lineTo(0, -r * 1.34); g.lineTo(r * 0.3, -r * 0.95); g.lineTo(r * 0.62, -r * 1.22); g.lineTo(r * 0.6, -r * 0.72); g.closePath(); g.fillStyle = "#ffcc20"; g.fill(); g.lineWidth = lw; g.strokeStyle = "#b88a00"; g.stroke(); blob(0, -r * 0.9, r * 0.09, r * 0.09, "#e0303a");
    g.strokeStyle = o; g.lineWidth = r * 0.07; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * r * 0.15, r * 0.4); g.quadraticCurveTo(s * r * 0.6, r * 0.55, s * r * 0.75, r * 0.3); g.stroke(); } }
  const blink = Math.sin(t * 1.3 + m.seed) > 0.97;
  for (const s of [-1, 1]) {
    if (m.ouch) { g.strokeStyle = "#2a2a36"; g.lineWidth = r * 0.1; g.beginPath(); g.moveTo(s * r * 0.35 - r * 0.12, -r * 0.22); g.lineTo(s * r * 0.35 + r * 0.12, r * 0.02); g.moveTo(s * r * 0.35 + r * 0.12, -r * 0.22); g.lineTo(s * r * 0.35 - r * 0.12, r * 0.02); g.stroke(); }
    else if (blink) { g.strokeStyle = "#2a2a36"; g.lineWidth = r * 0.08; g.beginPath(); g.moveTo(s * r * 0.33 - r * 0.12, -r * 0.08); g.lineTo(s * r * 0.33 + r * 0.12, -r * 0.08); g.stroke(); }
    else { blob(s * r * 0.33, -r * 0.1, r * 0.17, r * 0.21, "#ffffff", o, lw * 0.5); blob(s * r * 0.33 - r * 0.04, -r * 0.07, r * 0.1, r * 0.12, "#2a2a36"); blob(s * r * 0.33 - r * 0.07, -r * 0.12, r * 0.035, r * 0.035, "#ffffff"); }
  }
  blob(0, r * 0.15, r * 0.12, r * 0.1, "#ff7a96");
  if (S.taunt > 0) { g.beginPath(); g.arc(0, r * 0.36, r * 0.27, 0, Math.PI); g.closePath(); g.fillStyle = "#6a2236"; g.fill(); g.fillStyle = "#fff"; g.fillRect(-r * 0.1, r * 0.36, r * 0.09, r * 0.1); g.fillRect(r * 0.01, r * 0.36, r * 0.09, r * 0.1); }
  else { g.strokeStyle = o; g.lineWidth = r * 0.07; g.beginPath(); g.arc(0, r * 0.22, r * 0.25, 0.3, Math.PI - 0.3); g.stroke(); g.fillStyle = "#fff"; g.fillRect(-r * 0.09, r * 0.44, r * 0.08, r * 0.11); g.fillRect(r * 0.01, r * 0.44, r * 0.08, r * 0.11); }
  g.strokeStyle = o; g.lineWidth = Math.max(1, r * 0.035); for (const s of [-1, 1]) for (const k of [-0.06, 0.06]) { g.beginPath(); g.moveTo(s * r * 0.22, r * 0.17); g.lineTo(s * r * 0.85, r * (0.1 + k * 2)); g.stroke(); }
  g.restore();
}
// ---- рогатка
function drawSling(front) {
  const x = SLING.x, y = SLING.y;
  g.lineCap = "round";
  if (!front) { g.strokeStyle = "#5a3410"; g.lineWidth = 20; g.beginPath(); g.moveTo(x - 2, GY + 4); g.lineTo(x - 2, y + 62); g.quadraticCurveTo(x + 6, y + 30, x + 20, y - 6); g.stroke(); g.strokeStyle = "#8a5a2a"; g.lineWidth = 12; g.stroke(); }
  else { g.strokeStyle = "#5a3410"; g.lineWidth = 20; g.beginPath(); g.moveTo(x - 2, y + 62); g.quadraticCurveTo(x - 10, y + 30, x - 24, y - 8); g.stroke(); g.strokeStyle = "#b07a3a"; g.lineWidth = 12; g.stroke(); g.strokeStyle = "#5a3410"; g.lineWidth = 6; for (const dy of [70, 100]) { g.beginPath(); g.moveTo(x - 12, y + dy); g.lineTo(x + 8, y + dy - 6); g.stroke(); } }
  g.lineCap = "butt";
}
function band(cx, cy, tipX, pull) { g.strokeStyle = "#3a1a0a"; g.lineWidth = Math.max(4, 10 - pull / 25); g.beginPath(); g.moveTo(tipX, SLING.y - 6); g.lineTo(cx, cy); g.stroke(); }
// ---- кадр
function draw(now) {
  g.setTransform(dpr, 0, 0, dpr, 0, 0); sky();
  if (!S) return;
  const t = now / 1000, sh = S.shake;
  g.setTransform(dpr * sc, 0, 0, dpr * sc, (-S.camX * sc + (Math.random() - 0.5) * sh) * dpr, (offY + (Math.random() - 0.5) * sh) * dpr);
  groundStrip();
  // корзина с рыбой
  const fx0 = S.def.w - 130; g.fillStyle = "#a8742a"; g.beginPath(); g.moveTo(fx0 - 55, GY - 55); g.lineTo(fx0 + 55, GY - 55); g.lineTo(fx0 + 42, GY); g.lineTo(fx0 - 42, GY); g.fill(); g.strokeStyle = "#7a4a1a"; g.lineWidth = 3; g.stroke();
  g.strokeStyle = "rgba(90,50,15,0.6)"; g.lineWidth = 2; for (let k = -40; k <= 40; k += 14) { g.beginPath(); g.moveTo(fx0 + k, GY - 52); g.lineTo(fx0 + k * 0.8, GY - 2); g.stroke(); }
  for (let k = 0; k < 5; k++) { g.fillStyle = k % 2 ? "#8ad8f8" : "#5ab8e8"; g.save(); g.translate(fx0 - 36 + k * 18, GY - 60 - (k % 2) * 8); g.rotate(-0.4 + k * 0.2); g.beginPath(); g.ellipse(0, 0, 24, 9, 0, 0, TAU); g.fill(); g.beginPath(); g.moveTo(20, 0); g.lineTo(32, -8); g.lineTo(32, 8); g.fill(); g.fillStyle = "#1a1a24"; g.beginPath(); g.arc(-15, -2, 2, 0, TAU); g.fill(); g.restore(); }
  // след прошлого полёта
  g.fillStyle = "rgba(255,255,255,0.85)"; for (const [x, y, s] of S.trail) { g.beginPath(); g.arc(x, y, s, 0, TAU); g.fill(); }
  S.queue.forEach((k, i) => { const hop = Math.max(0, Math.sin(t * 4 + i * 1.7)) * 8; drawCat(SLING.x - 85 - i * 64, GY - CATS[k].r - hop, CATS[k].r, Math.sin(t * 2 + i) * 0.08, k, "calm"); });
  drawSling(false);
  if (S.cat) {
    const c = S.cat, pull = Math.hypot(c.x - SLING.x, c.y - SLING.y);
    band(c.x - 4, c.y, SLING.x + 20, pull);
    g.fillStyle = "#4a2a14"; g.save(); g.translate(c.x, c.y); g.rotate(Math.atan2(c.y - SLING.y, c.x - SLING.x)); g.beginPath(); g.ellipse(c.r * 0.55, 0, c.r * 0.45, c.r * 0.85, 0, 0, TAU); g.fill(); g.restore();
    drawCat(c.x, c.y, c.r, 0, c.kind, "angry");
    band(c.x - 4, c.y, SLING.x - 24, pull);
  } else { g.strokeStyle = "#3a1a0a"; g.lineWidth = 8; g.beginPath(); g.moveTo(SLING.x + 20, SLING.y - 6); g.lineTo(SLING.x - 2, SLING.y + 4); g.lineTo(SLING.x - 24, SLING.y - 6); g.stroke(); }
  drawSling(true);
  if (pulling && S.cat) { const pts = trajectory(S.cat.x - SLING.x, S.cat.y - SLING.y); pts.forEach(([x, y], i) => { g.fillStyle = `rgba(255,255,255,${0.95 - i * 0.045})`; g.beginPath(); g.arc(x, y, Math.max(2.5, 7 - i * 0.3), 0, TAU); g.fill(); }); }
  for (const b of S.blocks) if (!b.dead) drawBlock(b);
  for (const s of S.shards) { g.save(); g.translate(s.position.x, s.position.y); g.rotate(s.angle); g.globalAlpha = Math.min(1, s.life * 2); const im = s.spr && KIMG[s.spr]; if (ready(im)) g.drawImage(im, -s.sw / 2, -s.sh / 2, s.sw, s.sh); else { g.fillStyle = s.col; g.fillRect(-s.sw / 2, -s.sh / 2, s.sw, s.sh); } g.restore(); }
  g.globalAlpha = 1;
  for (const m of S.mice) if (!m.dead) drawMouse(m, t);
  for (const b of S.flying) {
    if (b.gone) continue;
    if (b.boost > 0) { b.boost -= 1 / 60; for (let k = 1; k < 6; k++) { g.fillStyle = `rgba(255,${120 + k * 20},40,${0.6 - k * 0.1})`; g.beginPath(); g.arc(b.position.x - b.velocity.x * k * 1.1, b.position.y - b.velocity.y * k * 1.1, b.r * (1 - k * 0.15), 0, TAU); g.fill(); } }
    drawCat(b.position.x, b.position.y, b.r, b.landed ? b.angle : 0, b.kind, b.landed ? "calm" : "yell", b.landed ? null : b.velocity, b.squash || 0);
  }
  for (const d of S.dust) { const k = d.t / 0.8; g.fillStyle = d.boom ? `rgba(255,${200 - k * 150},80,${0.7 * (1 - k)})` : `rgba(220,200,170,${0.55 * (1 - k)})`; for (let i = 0; i < 5; i++) { const a = i * 1.26 + d.s; g.beginPath(); g.arc(d.x + Math.cos(a) * d.s * k, d.y + Math.sin(a) * d.s * k * 0.6, d.s * 0.35 * (0.5 + k), 0, TAU); g.fill(); } }
  for (const p of S.parts) { g.globalAlpha = Math.max(0, 1 - p.t / 1.2); g.fillStyle = p.col; if (p.puff) { g.beginPath(); g.arc(p.x, p.y, p.s * (1 + p.t), 0, TAU); g.fill(); } else { g.save(); g.translate(p.x, p.y); g.rotate(p.a); g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); g.restore(); } }
  g.globalAlpha = 1;
  grassFront();
  const T = curTheme(); if (T.tint) { g.fillStyle = T.tint; g.fillRect(S.camX - 100, -200, viewW + 200, WH + 400); }
  g.textAlign = "center"; g.lineJoin = "round";
  for (const p of S.pops) { const k = p.t / 1.3, s = 1 + Math.max(0, 0.3 - p.t) * 2; g.globalAlpha = 1 - k * k; g.font = `800 ${Math.round((p.big ? 40 : 22) * s)}px Rubik, sans-serif`; g.lineWidth = p.big ? 8 : 5; g.strokeStyle = "#1b2550"; g.strokeText(p.text, p.x, p.y - k * 60); g.fillStyle = p.col; g.fillText(p.text, p.x, p.y - k * 60); }
  g.globalAlpha = 1;
  if (S.taunt > 0 && S.mice.some(m => !m.dead)) { const m = S.mice.filter(m => !m.dead).sort((a, b) => b.r - a.r)[0]; bubble(m.position.x, m.position.y - m.r * 1.6 - Math.abs(Math.sin(t * 8)) * 6, S.tauntText || "Хи-хи!"); }
  if (S.bark && S.cat && S.bark.t < 2.6) { S.bark.t += 1 / 60; bubble(S.cat.x + 30, S.cat.y - S.cat.r - 30, S.bark.text, true); }
  g.setTransform(dpr, 0, 0, dpr, 0, 0); weather();
  if (S.shout && S.shout.t < 1.6) { S.shout.t += 1 / 60; const k = S.shout.t, s2 = Math.min(1, k * 6) * (1 + Math.max(0, 0.2 - k)); g.save(); g.translate(CW / 2, CH * 0.32); g.scale(s2, s2); g.rotate(-0.06); g.globalAlpha = Math.min(1, (1.6 - k) * 3); g.textAlign = "center"; g.lineJoin = "round"; const fs = Math.min(64, CW / 9); g.font = `800 ${fs}px Rubik, sans-serif`; g.lineWidth = fs * 0.22; g.strokeStyle = "#1b2550"; g.strokeText(S.shout.text, 0, 0); g.fillStyle = "#ffd02a"; g.fillText(S.shout.text, 0, 0); g.font = `800 ${fs * 0.5}px Rubik, sans-serif`; g.lineWidth = 6; g.strokeText(S.shout.sub, 0, fs * 0.6); g.fillStyle = "#fff"; g.fillText(S.shout.sub, 0, fs * 0.6); g.restore(); }
}
// облачко с репликой персонажа
function bubble(x, y, text, left) {
  g.font = "700 22px Rubik, sans-serif"; const w = g.measureText(text).width + 26, h = 38, bx = x - w / 2, by = y - h;
  g.fillStyle = "#ffffff"; g.strokeStyle = "#1b2550"; g.lineWidth = 3; g.beginPath(); g.roundRect(bx, by, w, h, 14); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(x - 8, y - 1); g.lineTo(x + (left ? -14 : 0), y + 14); g.lineTo(x + 8, y - 1); g.fill(); g.stroke(); g.fillRect(x - 9, y - 4, 18, 4);
  g.fillStyle = "#1b2550"; g.textAlign = "center"; g.fillText(text, x, y - 12);
}
