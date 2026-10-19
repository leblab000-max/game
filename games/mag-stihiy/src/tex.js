// =====================================================================
//  Текстуры прототипа: всё рисуется кодом при запуске.
//  Потом заменим на сгенерированные картинки — ключи останутся те же.
// =====================================================================
const K = 3;                 // текстуры рисуем в 3 раза крупнее — чётко на телефонах
const TEXO = {}, TEXW = {};  // точка привязки и ширина каждой текстуры в мировых единицах
const css = c => "#" + c.toString(16).padStart(6, "0");
function shade(c, f) { let r = c >> 16 & 255, g = c >> 8 & 255, b = c & 255; const m = f < 0 ? 0 : 255, k = Math.abs(f); r += (m - r) * k; g += (m - g) * k; b += (m - b) * k; return `rgb(${r | 0},${g | 0},${b | 0})`; }
function tex(sc, key, w, h, ox, oy, fn) {
  const t = sc.textures.createCanvas(key, Math.ceil(w * K), Math.ceil(h * K)), x = t.getContext();
  x.scale(K, K); x.translate(ox, oy); x.lineJoin = "round"; x.lineCap = "round"; fn(x); t.refresh();
  TEXO[key] = [ox / w, oy / h]; TEXW[key] = w;
}
function shadowE(x, y, rx, ry) { x.fillStyle = "rgba(10,20,15,.32)"; x.beginPath(); x.ellipse(0, y, rx, ry, 0, 0, 7); x.fill(); }
function eyes(x, ex, ey, s, angry) {
  for (const sx of [-1, 1]) {
    x.fillStyle = "#fff"; x.beginPath(); x.ellipse(sx * ex, ey, s, s * 1.15, 0, 0, 7); x.fill();
    x.fillStyle = "#1a1420"; x.beginPath(); x.arc(sx * ex + sx * s * 0.15, ey + s * 0.15, s * 0.55, 0, 7); x.fill();
    x.fillStyle = "#fff"; x.beginPath(); x.arc(sx * ex + sx * s * 0.15 - s * 0.2, ey - s * 0.1, s * 0.2, 0, 7); x.fill();
    if (angry) { x.strokeStyle = "#1a1420"; x.lineWidth = 1.8; x.beginPath(); x.moveTo(sx * (ex + s * 1.1), ey - s * 1.5); x.lineTo(sx * (ex - s * 0.9), ey - s * 0.9); x.stroke(); }
  }
}
function body(x, col, path) { path(); x.fillStyle = css(col); x.fill(); x.lineWidth = 2.4; x.strokeStyle = shade(col, -0.62); x.stroke(); }
function shine(x, cx, cy, rx, ry) { x.fillStyle = "rgba(255,255,255,.35)"; x.beginPath(); x.ellipse(cx, cy, rx, ry, -0.5, 0, 7); x.fill(); }

function makeTextures(sc) {
  // мягкое свечение и простые формы
  tex(sc, "soft", 64, 64, 32, 32, x => { const g = x.createRadialGradient(0, 0, 0, 0, 0, 32); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.35, "rgba(255,255,255,.55)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(-32, -32, 64, 64); });
  tex(sc, "dot", 16, 16, 8, 8, x => { x.fillStyle = "#fff"; x.beginPath(); x.arc(0, 0, 7.5, 0, 7); x.fill(); });
  tex(sc, "ring", 128, 128, 64, 64, x => { x.strokeStyle = "#fff"; x.lineWidth = 7; x.beginPath(); x.arc(0, 0, 58, 0, 7); x.stroke(); x.globalAlpha = .35; x.lineWidth = 16; x.beginPath(); x.arc(0, 0, 54, 0, 7); x.stroke(); });
  tex(sc, "spark", 16, 16, 8, 8, x => { x.fillStyle = "#fff"; x.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = i % 2 ? 2.2 : 8; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); } x.fill(); });
  tex(sc, "shard", 34, 12, 17, 6, x => { x.fillStyle = "#fff"; x.beginPath(); x.moveTo(17, 0); x.lineTo(2, -5); x.lineTo(-17, 0); x.lineTo(2, 5); x.closePath(); x.fill(); x.fillStyle = "rgba(160,230,255,1)"; x.beginPath(); x.moveTo(15, 0); x.lineTo(2, -2.5); x.lineTo(-8, 0); x.lineTo(2, 2.5); x.fill(); });
  tex(sc, "blade", 48, 48, 24, 24, x => { x.fillStyle = "#fff"; x.beginPath(); x.arc(0, 0, 22, -0.3, Math.PI * 0.9); x.arc(-5, -4, 17, Math.PI * 0.9, -0.3, true); x.closePath(); x.fill(); });
  tex(sc, "swirl", 80, 80, 40, 40, x => { x.strokeStyle = "#fff"; x.lineCap = "round"; for (let k = 0; k < 3; k++) { x.lineWidth = 6 - k * 1.5; x.beginPath(); for (let a = 0; a < 9; a += 0.15) { const r = 4 + a * 3.8, aa = a + k * 2.1; x.lineTo(Math.cos(aa) * r, Math.sin(aa) * r * 0.75); } x.stroke(); } });
  tex(sc, "cloud", 90, 50, 45, 28, x => { x.fillStyle = "#5a5f88"; for (const [cx, cy, r] of [[-22, 4, 16], [0, -6, 22], [22, 4, 16], [0, 8, 18]]) { x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); } x.fillStyle = "#7c82b0"; for (const [cx, cy, r] of [[-20, 0, 12], [0, -10, 16], [20, 0, 11]]) { x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); } });
  // земля: тёмная трава с пятнами и кустиками
  tex(sc, "tile", 256, 256, 0, 0, x => {
    x.fillStyle = "#2f5a3a"; x.fillRect(0, 0, 256, 256);
    let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const wrap = (px, py, f) => { for (const ox of [-256, 0, 256]) for (const oy of [-256, 0, 256]) f(px + ox, py + oy); };
    for (let i = 0; i < 26; i++) { const st = rnd() < .5 ? "rgba(70,120,70,.35)" : "rgba(25,55,35,.35)", px = rnd() * 256, py = rnd() * 256, rx = 10 + rnd() * 30, ry = 6 + rnd() * 16, a = rnd() * 3; wrap(px, py, (X, Y) => { x.fillStyle = st; x.beginPath(); x.ellipse(X, Y, rx, ry, a, 0, 7); x.fill(); }); }
    for (let i = 0; i < 40; i++) { const px = 8 + rnd() * 240, py = 10 + rnd() * 240; x.strokeStyle = rnd() < .5 ? "#4f8a52" : "#3d7445"; x.lineWidth = 1.6; x.beginPath(); x.moveTo(px - 3, py); x.lineTo(px - 4, py - 6); x.moveTo(px, py); x.lineTo(px, py - 8); x.moveTo(px + 3, py); x.lineTo(px + 4, py - 6); x.stroke(); }
    for (let i = 0; i < 6; i++) { const px = 8 + rnd() * 240, py = 8 + rnd() * 240; x.fillStyle = ["#f5e36a", "#f0a0c8", "#ffffff"][i % 3]; for (let k = 0; k < 5; k++) { x.beginPath(); x.arc(px + Math.cos(k * 1.26) * 2.6, py + Math.sin(k * 1.26) * 2.6, 1.8, 0, 7); x.fill(); } x.fillStyle = "#e09030"; x.beginPath(); x.arc(px, py, 1.4, 0, 7); x.fill(); }
  });
  // маг
  tex(sc, "mage", 40, 56, 20, 36, x => {
    shadowE(x, 16, 13, 4.5);
    x.strokeStyle = "#6a4426"; x.lineWidth = 3; x.beginPath(); x.moveTo(13, 15); x.lineTo(15, -14); x.stroke();
    body(x, 0x4a5fe0, () => { x.beginPath(); x.moveTo(-7, -4); x.lineTo(7, -4); x.lineTo(12, 15); x.quadraticCurveTo(0, 18, -12, 15); x.closePath(); });
    x.fillStyle = "#f6c544"; x.fillRect(-9, 6, 18, 3);
    body(x, 0xffd9b4, () => { x.beginPath(); x.arc(0, -8, 8, 0, 7); });
    x.fillStyle = "#f2f2f2"; x.beginPath(); x.moveTo(-6, -5); x.quadraticCurveTo(0, 8, 6, -5); x.quadraticCurveTo(0, -1, -6, -5); x.fill();
    x.fillStyle = "#1a1420"; x.beginPath(); x.arc(-3, -9, 1.4, 0, 7); x.arc(3, -9, 1.4, 0, 7); x.fill();
    body(x, 0x7a46d8, () => { x.beginPath(); x.moveTo(-13, -12); x.quadraticCurveTo(0, -17, 13, -12); x.lineTo(4, -32); x.quadraticCurveTo(8, -34, 9, -30); x.lineTo(4, -32); x.lineTo(-1, -14); x.closePath(); });
    body(x, 0x7a46d8, () => { x.beginPath(); x.ellipse(0, -12, 15, 4, 0, 0, 7); });
    x.fillStyle = "#ffe45c"; x.beginPath(); for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, r = i % 2 ? 1.4 : 3.4; x.lineTo(1 + Math.cos(a) * r, -21 + Math.sin(a) * r); } x.fill();
  });
  // враги
  tex(sc, "f_slime", 34, 34, 17, 19, x => { shadowE(x, 11, 13, 4); body(x, FOES.slime.col, () => { x.beginPath(); x.moveTo(-13, 10); x.quadraticCurveTo(-15, -13, 0, -13); x.quadraticCurveTo(15, -13, 13, 10); x.quadraticCurveTo(0, 13, -13, 10); }); shine(x, -6, -6, 4, 2.5); eyes(x, 4.5, -1, 3); });
  tex(sc, "f_bat", 40, 30, 20, 15, x => { shadowE(x, 12, 8, 3); for (const s of [-1, 1]) body(x, 0x6a48a8, () => { x.beginPath(); x.moveTo(s * 5, -2); x.lineTo(s * 19, -9); x.lineTo(s * 15, -2); x.lineTo(s * 18, 3); x.lineTo(s * 11, 1); x.lineTo(s * 9, 6); x.closePath(); }); body(x, FOES.bat.col, () => { x.beginPath(); x.arc(0, 0, 8, 0, 7); }); x.fillStyle = css(FOES.bat.col); x.beginPath(); x.moveTo(-6, -5); x.lineTo(-4, -12); x.lineTo(-1, -6); x.moveTo(6, -5); x.lineTo(4, -12); x.lineTo(1, -6); x.fill(); eyes(x, 3, -1, 2.3, true); });
  tex(sc, "f_imp", 34, 38, 17, 20, x => { shadowE(x, 12, 10, 3.5); for (const s of [-1, 1]) body(x, 0xf2e0b0, () => { x.beginPath(); x.moveTo(s * 5, -9); x.quadraticCurveTo(s * 12, -14, s * 11, -19); x.quadraticCurveTo(s * 8, -12, s * 2, -11); x.closePath(); }); body(x, FOES.imp.col, () => { x.beginPath(); x.arc(0, 0, 11, 0, 7); }); shine(x, -5, -5, 3.5, 2); eyes(x, 4, -1, 2.6, true); x.strokeStyle = "#3a1010"; x.lineWidth = 1.5; x.beginPath(); x.arc(0, 4, 3.5, 0.2, Math.PI - 0.2); x.stroke(); });
  tex(sc, "f_ghost", 36, 40, 18, 19, x => { shadowE(x, 15, 10, 3); x.globalAlpha = .92; body(x, FOES.ghost.col, () => { x.beginPath(); x.moveTo(-13, 12); x.lineTo(-13, -2); x.arc(0, -2, 13, Math.PI, 0); x.lineTo(13, 12); for (let i = 0; i < 4; i++) { x.quadraticCurveTo(13 - i * 6.5 - 3.2, 7, 13 - (i + 1) * 6.5, 12); } x.closePath(); }); x.globalAlpha = 1; x.fillStyle = "#2a3048"; x.beginPath(); x.ellipse(-5, -3, 3, 4, 0, 0, 7); x.ellipse(5, -3, 3, 4, 0, 0, 7); x.fill(); x.beginPath(); x.ellipse(0, 5, 2.5, 3, 0, 0, 7); x.fill(); });
  tex(sc, "f_brute", 50, 52, 25, 26, x => { shadowE(x, 20, 19, 5); body(x, FOES.brute.col, () => { x.beginPath(); x.roundRect(-19, -19, 38, 38, 9); }); x.strokeStyle = shade(FOES.brute.col, -0.45); x.lineWidth = 1.6; x.beginPath(); x.moveTo(-12, 8); x.lineTo(-6, 12); x.lineTo(-8, 17); x.moveTo(10, -14); x.lineTo(6, -9); x.stroke(); x.fillStyle = "#6fa04a"; x.beginPath(); x.ellipse(-8, -18, 9, 3.5, 0, 0, 7); x.fill(); eyes(x, 6.5, -3, 3.4, true); x.fillStyle = "#3a2410"; x.fillRect(-7, 7, 14, 3); });
  tex(sc, "f_boss1", 110, 110, 55, 54, x => { shadowE(x, 44, 42, 10); body(x, FOES.boss1.col, () => { x.beginPath(); x.roundRect(-42, -40, 84, 82, 20); }); for (const s of [-1, 1]) body(x, 0x8a6644, () => { x.beginPath(); x.arc(s * 46, 6, 15, 0, 7); }); x.fillStyle = "#6fa04a"; x.beginPath(); x.ellipse(-12, -40, 22, 7, 0, 0, 7); x.ellipse(16, -38, 14, 5, 0, 0, 7); x.fill(); x.strokeStyle = shade(FOES.boss1.col, -0.5); x.lineWidth = 2.5; x.beginPath(); x.moveTo(-28, 16); x.lineTo(-16, 24); x.lineTo(-20, 34); x.moveTo(22, -24); x.lineTo(14, -14); x.lineTo(20, -6); x.stroke(); x.fillStyle = "#ffcf3a"; x.shadowColor = "#ffb000"; x.shadowBlur = 8; x.beginPath(); x.ellipse(-14, -10, 6, 5, 0, 0, 7); x.ellipse(14, -10, 6, 5, 0, 0, 7); x.fill(); x.shadowBlur = 0; x.fillStyle = "#2a1a0a"; x.fillRect(-16, 12, 32, 6); });
  tex(sc, "f_boss2", 130, 130, 65, 62, x => { shadowE(x, 56, 46, 11); body(x, 0x3a2068, () => { x.beginPath(); x.moveTo(-50, 50); x.quadraticCurveTo(-56, -10, -30, -30); x.lineTo(30, -30); x.quadraticCurveTo(56, -10, 50, 50); x.quadraticCurveTo(0, 40, -50, 50); }); body(x, FOES.boss2.col, () => { x.beginPath(); x.arc(0, -16, 30, 0, 7); }); x.fillStyle = "#ffd23a"; x.strokeStyle = "#6a4a00"; x.lineWidth = 2; x.beginPath(); x.moveTo(-24, -38); x.lineTo(-24, -58); x.lineTo(-12, -46); x.lineTo(0, -64); x.lineTo(12, -46); x.lineTo(24, -58); x.lineTo(24, -38); x.closePath(); x.fill(); x.stroke(); x.fillStyle = "#ff3a6a"; x.shadowColor = "#ff2a5a"; x.shadowBlur = 10; x.beginPath(); x.ellipse(-11, -16, 7, 5, 0.3, 0, 7); x.ellipse(11, -16, 7, 5, -0.3, 0, 7); x.fill(); x.shadowBlur = 0; });
  // добыча
  const gem = (k, c, s) => tex(sc, k, s * 2 + 4, s * 2 + 6, s + 2, s + 2, x => { shadowE(x, s + 1, s * 0.6, 1.6); body(x, c, () => { x.beginPath(); x.moveTo(0, -s); x.lineTo(s * 0.8, 0); x.lineTo(0, s); x.lineTo(-s * 0.8, 0); x.closePath(); }); x.fillStyle = "rgba(255,255,255,.6)"; x.beginPath(); x.moveTo(0, -s * 0.7); x.lineTo(s * 0.35, -s * 0.1); x.lineTo(0, 0); x.closePath(); x.fill(); });
  gem("gem1", 0x5ab8ff, 6); gem("gem2", 0x5aef7a, 7.5); gem("gem3", 0xff5a7a, 9);
  tex(sc, "coin", 18, 20, 9, 9, x => { shadowE(x, 8, 6, 2); body(x, 0xffcc33, () => { x.beginPath(); x.arc(0, 0, 7, 0, 7); }); x.strokeStyle = "#c88a10"; x.lineWidth = 1.5; x.beginPath(); x.arc(0, 0, 4, 0, 7); x.stroke(); });
  tex(sc, "meat", 24, 22, 12, 11, x => { shadowE(x, 8, 8, 2); body(x, 0xff4a6a, () => { x.beginPath(); x.moveTo(0, 7); x.bezierCurveTo(-12, -1, -6, -10, 0, -4); x.bezierCurveTo(6, -10, 12, -1, 0, 7); }); shine(x, -4, -3, 2.5, 1.5); });
  tex(sc, "magnetP", 24, 24, 12, 12, x => { shadowE(x, 9, 8, 2); x.lineWidth = 6; x.strokeStyle = "#e83a3a"; x.beginPath(); x.arc(0, -1, 6, Math.PI, 0); x.stroke(); x.strokeStyle = "#d8d8e0"; x.beginPath(); x.moveTo(-6, -1); x.lineTo(-6, 6); x.moveTo(6, -1); x.lineTo(6, 6); x.stroke(); });
  tex(sc, "chest", 34, 30, 17, 15, x => { shadowE(x, 12, 14, 3.5); body(x, 0xb8742c, () => { x.beginPath(); x.roundRect(-14, -6, 28, 17, 3); }); body(x, 0xd08a38, () => { x.beginPath(); x.moveTo(-14, -5); x.quadraticCurveTo(0, -18, 14, -5); x.closePath(); }); x.fillStyle = "#ffd23a"; x.fillRect(-2.5, -6, 5, 8); x.fillRect(-14, -1, 28, 2.4); });
}
