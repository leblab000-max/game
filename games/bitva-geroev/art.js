// =====================================================================
//  Рисунки: герои (кукла-конструктор 28×26), арена
// =====================================================================
const SW = 28, SH = 26, OUTL = "#1e1a2a";
const HERO_ART = {
  knight(R, f) {
    base(R, f, { skin: "#ffd2b0", body: "#5a8ae0", bodyD: "#3a62b0", belt: "#f2c740", arm: "#b8c4d8", pants: "#4a4a5a", boot: "#5a3a22" });
    R(2, 13, 5, 8, "#3a62b0"); R(3, 14, 3, 6, "#5a8ae0"); R(4, 14, 1, 6, "#f2c740"); R(3, 16, 3, 1, "#f2c740");   // щит
    R(6, 3, 12, 5, "#c8d0e0"); R(6, 3, 12, 1, "#e8eef8"); R(6, 8, 2, 5, "#a8b0c4"); R(8, 7, 9, 1, "#8890a8");     // шлем
    R(10, 1, 4, 2, "#e04a4a"); R(11, 0, 3, 1, "#ff7a6a");                                                     // плюмаж
    const [hx, hy] = hand(f);
    if (f) { R(hx, hy, 6, 1, "#eef2f8"); R(hx, hy + 1, 5, 1, "#a8b0c4"); R(hx - 1, hy - 1, 1, 3, "#f2c740"); }
    else { R(hx, hy - 8, 1, 7, "#eef2f8"); R(hx + 1, hy - 8, 1, 7, "#a8b0c4"); R(hx - 1, hy - 1, 3, 1, "#f2c740"); }
  },
  archer(R, f) {
    base(R, f, { skin: "#ffd8b8", body: "#4cb85a", bodyD: "#2f8a3e", belt: "#8a5a2a", arm: "#4cb85a", pants: "#6a4a2a", boot: "#4a2e16" });
    R(6, 2, 12, 5, "#3a9a48"); R(6, 2, 12, 1, "#5ccc6a"); R(6, 7, 3, 8, "#3a9a48"); R(7, 6, 10, 2, "#ffe07a");   // капюшон и чёлка
    R(4, 8, 2, 1, "#ffd8b8"); R(3, 7, 1, 1, "#ffd8b8");                                                         // эльфийское ухо
    const [hx, hy] = hand(f);
    const bx = hx + 2, by = hy - 6;
    R(bx, by, 1, 1, "#a86a2a"); R(bx + 1, by + 1, 1, 10, "#a86a2a"); R(bx, by + 11, 1, 1, "#a86a2a"); R(bx + 1, by + 3, 1, 1, "#f2c740"); R(bx + 1, by + 8, 1, 1, "#f2c740");
    if (f) { R(bx - 3, by + 1, 1, 10, "#ffffff"); R(bx - 6, by + 6, 9, 1, "#d8c8a0"); R(bx + 2, by + 5, 1, 3, "#c8d0e0"); }
    else R(bx, by + 1, 1, 10, "#ffffff");
  },
  priest(R, f) {
    base(R, f, { skin: "#ffdcc0", body: "#ffffff", bodyD: "#d8dcef", belt: "#f2c740", arm: "#ffffff", pants: "#ffffff", boot: "#d8dcef", robe: true });
    R(6, 3, 12, 4, "#ffd860"); R(6, 7, 3, 9, "#ffd860"); R(6, 3, 12, 1, "#fff0a0"); R(8, 5, 9, 1, "#f2a830"); R(12, 4, 2, 2, "#5ad0ff");   // волосы, обруч
    const [hx, hy] = hand(f), glow = f ? "#ffffff" : "#8ae8ff";
    R(hx + 1, hy - 12, 1, 17, "#c8963a"); R(hx, hy - 15, 3, 3, glow); R(hx + 1, hy - 16, 1, 5, glow); R(hx - 1, hy - 14, 5, 1, glow);
    if (f) { R(hx - 2, hy - 17, 1, 1, "#fff6a0"); R(hx + 4, hy - 17, 1, 1, "#fff6a0"); R(hx + 4, hy - 11, 1, 1, "#fff6a0"); }
  },
  mage(R, f) {
    base(R, f, { skin: "#ffd2b0", body: "#8a4ae0", bodyD: "#6230b0", belt: "#ff9a2a", arm: "#8a4ae0", pants: "#6230b0", boot: "#3a2060", robe: true });
    R(4, 6, 16, 2, "#6230b0"); R(7, 3, 10, 3, "#8a4ae0"); R(9, 1, 6, 2, "#8a4ae0"); R(12, -1, 3, 2, "#8a4ae0"); R(15, -2, 2, 1, "#8a4ae0");   // шляпа
    R(10, 3, 1, 1, "#ffe060"); R(14, 2, 1, 1, "#ffe060"); R(7, 5, 10, 1, "#ff9a2a");
    R(6, 8, 2, 5, "#e05a2a");                                                                                                         // рыжие волосы
    const [hx, hy] = hand(f);
    R(hx + 1, hy - 10, 1, 15, "#7a4a2a"); R(hx, hy - 13, 3, 3, "#ff6a1a"); R(hx + 1, hy - 14, 1, 2, "#ffd02a"); R(hx + 1, hy - 12, 1, 1, "#fff6a0");
    if (f) { R(hx + 3, hy - 15, 2, 2, "#ff9a2a"); R(hx - 2, hy - 15, 1, 1, "#ffd02a"); }
  },
  orc(R, f) {
    base(R, f, { skin: "#7ccc50", body: "#8a5a32", bodyD: "#6a4022", belt: "#3a2a1a", arm: "#7ccc50", pants: "#4a3a2a", boot: "#2a1e14", tusk: true });
    R(9, 1, 6, 3, "#2a2a2a"); R(10, 0, 4, 1, "#2a2a2a");                                                     // ирокез
    R(7, 14, 3, 2, "#c8c8d0"); R(14, 14, 3, 2, "#c8c8d0");                                                   // наплечники
    const [hx, hy] = hand(f);
    if (f) { R(hx, hy, 6, 1, "#8a5a2a"); R(hx + 4, hy - 3, 3, 7, "#d8dce8"); R(hx + 6, hy - 3, 1, 7, "#a8b0c0"); }
    else { R(hx, hy - 7, 1, 9, "#8a5a2a"); R(hx + 1, hy - 8, 3, 5, "#d8dce8"); R(hx + 3, hy - 8, 1, 5, "#a8b0c0"); }
  },
  dwarf(R, f) {
    base(R, f, { skin: "#ffc8a0", body: "#c84a3a", bodyD: "#983228", belt: "#f2c740", arm: "#c84a3a", pants: "#5a4a3a", boot: "#3a2a1a" });
    R(6, 3, 12, 4, "#a8b0c4"); R(6, 3, 12, 1, "#d8e0ee"); R(11, 3, 2, 4, "#f2c740");                            // шлем
    R(4, 1, 2, 4, "#fff4d8"); R(3, 0, 1, 2, "#fff4d8"); R(18, 1, 2, 4, "#fff4d8"); R(20, 0, 1, 2, "#fff4d8");      // рога
    R(10, 10, 8, 4, "#ff8a2a"); R(9, 13, 9, 4, "#ff8a2a"); R(11, 17, 6, 2, "#e06a1a"); R(12, 12, 4, 1, "#ffaa5a");   // борода
    R(6, 7, 3, 6, "#ff8a2a");
    const [hx, hy] = hand(f);
    if (f) { R(hx, hy, 5, 1, "#8a5a2a"); R(hx + 4, hy - 3, 4, 6, "#8890a0"); R(hx + 4, hy - 3, 4, 1, "#c8d0e0"); }
    else { R(hx, hy - 7, 1, 9, "#8a5a2a"); R(hx - 2, hy - 10, 5, 4, "#8890a0"); R(hx - 2, hy - 10, 5, 1, "#c8d0e0"); }
  },
  rogue(R, f) {
    base(R, f, { skin: "#f0c8a8", body: "#4a3a5a", bodyD: "#2e2440", belt: "#c83a5a", arm: "#4a3a5a", pants: "#2e2440", boot: "#1e1828" });
    R(6, 2, 12, 5, "#3a2e4a"); R(6, 7, 3, 8, "#3a2e4a"); R(6, 2, 12, 1, "#5a4a6a"); R(11, 10, 7, 4, "#2e2440");   // капюшон, маска
    R(4, 15, 2, 6, "#c83a5a"); R(3, 18, 2, 4, "#c83a5a");                                                       // шарф
    const [hx, hy] = hand(f);
    if (f) { R(hx, hy, 5, 1, "#eef2f8"); R(hx + 1, hy + 1, 3, 1, "#a8b0c4"); R(hx - 1, hy - 1, 1, 3, "#c83a5a"); }
    else { R(hx, hy - 1, 1, 5, "#eef2f8"); R(hx - 1, hy - 1, 3, 1, "#c83a5a"); }
  },
  ice(R, f) {
    base(R, f, { skin: "#ffe0d0", body: "#5ac8f0", bodyD: "#3a98d0", belt: "#ffffff", arm: "#5ac8f0", pants: "#3a98d0", boot: "#2a6a9a", robe: true });
    R(6, 3, 12, 4, "#e8f8ff"); R(6, 7, 3, 11, "#e8f8ff"); R(5, 9, 1, 8, "#e8f8ff"); R(16, 7, 1, 3, "#e8f8ff");   // белые волосы
    R(9, 1, 1, 2, "#8ae8ff"); R(12, 0, 1, 3, "#8ae8ff"); R(15, 1, 1, 2, "#8ae8ff"); R(8, 3, 9, 1, "#8ae8ff");    // ледяная корона
    const [hx, hy] = hand(f);
    R(hx + 1, hy - 10, 1, 15, "#c8e8ff"); R(hx, hy - 14, 3, 4, "#8ae8ff"); R(hx + 1, hy - 16, 1, 2, "#ffffff"); R(hx + 1, hy - 13, 1, 2, "#ffffff");
    if (f) { R(hx - 2, hy - 16, 1, 1, "#ffffff"); R(hx + 4, hy - 15, 1, 1, "#ffffff"); R(hx + 4, hy - 10, 1, 1, "#8ae8ff"); }
  },
};
function hand(f) { return f ? [19, 15] : [16, 19]; }
// общее тело: большая голова, маленькое туловище — как в мультике
function base(R, f, o) {
  if (o.robe) { R(7, 14, 10, 8, o.body); R(7, 14, 2, 8, o.bodyD); R(7, 21, 10, 1, o.belt); R(9, 22, 2, 1, o.boot); R(13, 22, 2, 1, o.boot); }
  else {
    R(9, 20, 2, 3, o.pants); R(13, 20, 2, 3, o.pants); R(9, 22, 3, 1, o.boot); R(13, 22, 3, 1, o.boot);
    R(8, 14, 8, 7, o.body); R(8, 14, 2, 7, o.bodyD); R(8, 18, 8, 1, o.belt);
  }
  R(7, 15, 2, 4, o.bodyD);
  R(7, 4, 10, 10, o.skin); R(7, 4, 1, 1, null); R(16, 4, 1, 1, null); R(7, 13, 1, 1, null); R(16, 13, 1, 1, null);
  R(13, 8, 1, 2, "#1a1a2a"); R(16, 8, 1, 2, "#1a1a2a"); R(13, 8, 1, 1, "#ffffff"); R(16, 8, 1, 1, "#ffffff");
  R(12, 11, 1, 1, "#ff9a9a"); R(17, 11, 1, 1, "#ff9a9a"); R(14, 11, 2, 1, "#9a3a3a");
  if (o.tusk) { R(13, 11, 1, 1, "#ffffff"); R(16, 11, 1, 1, "#ffffff"); R(14, 11, 2, 1, "#3a5a2a"); R(12, 7, 5, 1, "#3a5a2a"); }
  if (f) { R(15, 15, 4, 2, o.arm); R(19, 15, 1, 2, o.skin); }
  else { R(15, 15, 2, 4, o.arm); R(15, 19, 2, 1, o.skin); }
}
const SPRITE = {};
function heroSprite(id, f = 0, flip = false, tint = null) {
  const key = id + f + (flip ? "L" : "R") + (tint || "");
  if (SPRITE[key]) return SPRITE[key];
  const grid = Array.from({ length: SH }, () => new Array(SW).fill(null));
  const R = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const X = x + i + 2, Y = y + j + 2; if (X >= 0 && Y >= 0 && X < SW && Y < SH) grid[Y][X] = c; } };
  HERO_ART[id](R, f);
  const cv = document.createElement("canvas"); cv.width = SW; cv.height = SH; const g = cv.getContext("2d");
  const on = (x, y) => y >= 0 && y < SH && x >= 0 && x < SW && grid[y][x];
  for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) {
    const X = flip ? SW - 1 - x : x;
    if (grid[y][x]) { g.fillStyle = tint || grid[y][x]; g.fillRect(X, y, 1, 1); }
    else if (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1)) { g.fillStyle = tint ? tint : OUTL; g.fillRect(X, y, 1, 1); }
  }
  return (SPRITE[key] = cv);
}
const PORTRAIT = {};
function heroURL(id) { return PORTRAIT[id] || (PORTRAIT[id] = heroSprite(id).toDataURL()); }
// ---- арена: небо, трибуны со зрителями, песок
const AW = 200, AH = 150;
let ARENA_BG = null;
function arenaBg() {
  if (ARENA_BG) return ARENA_BG;
  const cv = document.createElement("canvas"); cv.width = AW; cv.height = AH; const g = cv.getContext("2d");
  const gr = g.createLinearGradient(0, 0, 0, 40); gr.addColorStop(0, "#5ab8ff"); gr.addColorStop(1, "#bfe6ff"); g.fillStyle = gr; g.fillRect(0, 0, AW, 40);
  g.fillStyle = "#ffffff"; for (const [x, y, w] of [[20, 10, 26], [120, 6, 34], [170, 18, 22], [70, 20, 18]]) { g.fillRect(x, y, w, 4); g.fillRect(x + 4, y - 3, w - 10, 3); }
  g.fillStyle = "#7ac85a"; for (let x = 0; x < AW; x++) g.fillRect(x, 34 + Math.round(Math.sin(x / 13) * 2), 1, 8);
  g.fillStyle = "#c8a878"; g.fillRect(0, 38, AW, 30); g.fillStyle = "#a88858"; for (let y = 42; y < 68; y += 6) g.fillRect(0, y, AW, 1);   // трибуны
  g.fillStyle = "#8a6a48"; g.fillRect(0, 66, AW, 4); g.fillStyle = "#f2c740"; for (let x = 4; x < AW; x += 16) g.fillRect(x, 66, 8, 2);
  for (const [x, c] of [[16, "#e04a4a"], [60, "#4a8ae0"], [140, "#e04a4a"], [184, "#4a8ae0"]]) { g.fillStyle = "#5a4a3a"; g.fillRect(x, 22, 1, 18); g.fillStyle = c; g.fillRect(x + 1, 22, 8, 6); g.fillRect(x + 1, 28, 6, 2); }
  for (let y = 70; y < AH; y++) for (let x = 0; x < AW; x++) { const n = hsh(x, y, 9); g.fillStyle = n < 0.08 ? "#e8c890" : n > 0.94 ? "#c89a5a" : "#f2d6a0"; g.fillRect(x, y, 1, 1); }
  g.strokeStyle = "rgba(200,150,90,0.6)"; g.lineWidth = 1; g.beginPath(); g.ellipse(100, 112, 40, 16, 0, 0, Math.PI * 2); g.stroke();
  return (ARENA_BG = cv);
}
const CROWD = ["#e04a4a", "#4a8ae0", "#f2c740", "#4cb85a", "#ffffff", "#ff8ac8", "#8a4ae0", "#ff9a2a"];
function drawCrowd(g, t, cheer) {
  for (let row = 0; row < 4; row++) for (let x = 2 + row * 2; x < AW; x += 5) {
    const k = hsh(x, row, 3), jump = cheer && hsh(x, row, 4) > 0.5 ? Math.max(0, Math.sin(t * 12 + k * 9)) * 2 : Math.sin(t * 2 + k * 9) > 0.96 ? 1 : 0;
    const y = 41 + row * 6 - jump;
    g.fillStyle = CROWD[Math.floor(k * CROWD.length)]; g.fillRect(x, y + 2, 3, 3); g.fillStyle = "#ffd2b0"; g.fillRect(x + 0.5, y, 2, 2);
  }
}
