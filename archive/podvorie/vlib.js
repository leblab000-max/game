function cput(g, x, y, c) { if (!c) return; g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), 1, 1); }
function crect(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
// булыжная мостовая
function cobble(g, x0, y0, w, h, snow, seed) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    const bx = Math.floor((x + (Math.floor(y / 4) % 2) * 2) / 4), by = Math.floor(y / 4), edge = (x + (Math.floor(y / 4) % 2) * 2) % 4 === 0 || y % 4 === 0;
    let c = edge ? "#9a8c76" : hsh(bx, by, seed) < 0.33 ? "#cfc2a8" : hsh(bx, by, seed) < 0.66 ? "#c2b49a" : "#b8aa90";
    if (snow && hsh(x, y, seed + 1) < 0.55) c = hsh(x, y, seed + 2) < 0.5 ? "#f2f6fa" : "#e2eaf2";
    cput(g, x, y, c);
  }
}
// дом в духе Stardew: крыша с черепицей, окна с цветочными ящиками, дверь
function cityHouse(g, st, x, by, w, wallH, roofH, wall, roof, timber, si, seed) {
  const snow = si === 3, wy = by - wallH, flowers = SEASONS[si].flowers;
  crect(g, x + 2, by, w, 2, "rgba(20,30,10,0.25)");
  crect(g, x, wy, w, wallH, wall); crect(g, x + w - 3, wy, 3, wallH, dk(wall, -0.15));
  if (timber) { crect(g, x + 1, wy, 1, wallH, "#6a4424"); crect(g, x + w - 2, wy, 1, wallH, "#6a4424"); crect(g, x, wy + 1, w, 1, "#6a4424"); }
  crect(g, x, wy, 1, wallH, C_OUT); crect(g, x + w - 1, wy, 1, wallH, C_OUT); crect(g, x, by - 1, w, 1, C_OUT);
  for (const wx of [x + 3, x + w - 8]) {   // окна
    crect(g, wx, wy + 3, 5, 5, "#5a3418"); crect(g, wx + 1, wy + 4, 3, 3, "#5a7aa0"); cput(g, wx + 1, wy + 4, "#9ac0e0");
    for (const [lx, ly] of [[wx + 1, wy + 4], [wx + 3, wy + 4], [wx + 1, wy + 6], [wx + 3, wy + 6], [wx + 2, wy + 5]]) st.lights.push([lx, ly]);
    crect(g, wx - 1, wy + 8, 7, 2, snow ? "#f2f6fa" : "#8a5a30");
    if (!snow && flowers.length) for (let k = 0; k < 3; k++) cput(g, wx + k * 2, wy + 7, flowers[(seed + k) % flowers.length]);
  }
  const dx = x + Math.floor(w / 2) - 2;   // дверь и ступенька
  crect(g, dx, by - 8, 5, 7, "#7a4a24"); crect(g, dx + 2, by - 8, 1, 7, "#5a3418"); cput(g, dx + 3, by - 4, "#e0b040"); crect(g, dx - 1, by - 9, 7, 1, "#5a3418");
  crect(g, dx - 1, by, 7, 1, "#a8a090");
  const ry = wy - roofH;   // крыша-трапеция с рядами черепицы
  for (let r = 0; r < roofH; r++) {
    const inset = Math.floor((roofH - 1 - r) * 0.6), rx0 = x - 2 + inset, rw = w + 4 - inset * 2;
    for (let k = 0; k < rw; k++) {
      let c = k === 0 || k === rw - 1 || r === 0 ? C_OUT : r === roofH - 1 ? dk(roof, -0.35) : (r + Math.floor((k + r) / 3)) % 3 === 0 ? dk(roof, -0.18) : k < rw / 2 ? dk(roof, 0.08) : roof;
      if (snow && r < 4 && c !== C_OUT) c = r < 2 ? "#ffffff" : hsh(k, r, seed) < 0.6 ? "#e2eaf2" : c;
      cput(g, rx0 + k, ry + r, c);
    }
  }
  if (seed % 3 !== 1) { const cx = x + w - 7; crect(g, cx, ry - 3, 3, 5, "#7a6a5a"); crect(g, cx, ry - 3, 3, 1, C_OUT); st.chimneys.push([cx + 1, ry - 4]); }
}
function cityTree(g, x, by, si, pine) {
  const se = SEASONS[si], sh = "rgba(30,40,10,0.35)";
  if (pine) return fromRows((px, py, c) => cput(g, px, py, c), PINE_ROWS, { O: dk(se.pine[0], -0.5), D: se.pine[0], M: se.pine[1], L: se.pine[2], T: "#5a3a20", S: sh }, x - 4, by - 12);
  if (!se.tree) return fromRows((px, py, c) => cput(g, px, py, c), BARE_ROWS, { T: "#5a3a20", t: "#3a2410", O: "#2a1a0a", S: sh }, x - 5, by - 12);
  fromRows((px, py, c) => cput(g, px, py, c), TREE_ROWS, { O: dk(se.tree[0], -0.45), D: se.tree[0], M: se.tree[1], L: se.tree[2], T: "#6a4424", t: "#4a2c14", S: sh }, x - 5, by - 12);
  if (si === 0) for (const [a, b] of [[3, 3], [6, 2], [8, 4], [4, 5]]) cput(g, x - 5 + a, by - 12 + b, se.tree[3]);
}