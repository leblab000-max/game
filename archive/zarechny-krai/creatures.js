// ================= Портреты нечисти: у каждой твари своё логово и свой нрав =================
Object.assign(LOOK, {
  leshiy: { light: "#b8ff90", bg: "creature" }, vodyanoy: { light: "#90e8ff", bg: "creature" }, yaga: { light: "#ffb070", bg: "creature" },
  gorynych: { light: "#ff9040", bg: "creature" }, kikimora: { light: "#c0ff90", bg: "creature" },
});
const CREATURE_ART = (() => {
  const tools = x => ({
    P: (pts, f) => { x.beginPath(); x.moveTo(pts[0][0], pts[0][1]); for (const q of pts.slice(1)) x.lineTo(q[0], q[1]); x.closePath(); x.fillStyle = f; x.fill(); },
    E: (cx, cy, rx, ry, f, r = 0) => { x.beginPath(); x.ellipse(cx, cy, Math.max(0.1, rx), Math.max(0.1, ry), r, 0, Math.PI * 2); x.fillStyle = f; x.fill(); },
    lin: (y0, y1, stops) => { const g = x.createLinearGradient(0, y0, 0, y1); stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c)); return g; },
    glow: (cx, cy, r, col, a) => { const g = x.createRadialGradient(cx, cy, 1, cx, cy, r); g.addColorStop(0, shade(col, 0, a)); g.addColorStop(1, shade(col, 0, 0)); x.fillStyle = g; x.fillRect(0, 0, 200, 240); },
    stroke: (pts, col, w) => { x.strokeStyle = col; x.lineWidth = w; x.lineCap = "round"; x.beginPath(); x.moveTo(pts[0][0], pts[0][1]); for (const q of pts.slice(1)) x.lineTo(q[0], q[1]); x.stroke(); },
  });
  const eyes = (T, x0, y0, dx, col, r = 5) => { for (const s of [-1, 1]) { T.glow(x0 + s * dx, y0, 18, col, 0.5); T.E(x0 + s * dx, y0, r, r * 0.8, col); T.E(x0 + s * dx, y0, r * 0.35, r * 0.6, "#0a0a04"); } };
  return {
    leshiy: {
      bg(x, R) { const T = tools(x);   // глухая чаща, туман, светляки
        x.fillStyle = T.lin(0, 240, ["#0e1e12", "#1e3a22", "#0a140c"]); x.fillRect(0, 0, 200, 240);
        for (let k = 0; k < 9; k++) { const tx = k * 26 - 10 + R() * 10, w = 10 + R() * 14; x.fillStyle = k % 2 ? "#1a2a18" : "#24361e"; x.fillRect(tx, 0, w, 240); }
        T.glow(100, 200, 140, "#a0c8a0", 0.25);
        for (let k = 0; k < 24; k++) T.E(R() * 200, 40 + R() * 180, 1.5, 1.5, "#d8ff80");
      },
      fig(x, R) { const T = tools(x);
        // ветвистые рога
        for (const s of [-1, 1]) { T.stroke([[100 + s * 26, 70], [100 + s * 44, 40], [100 + s * 50, 10]], "#4a3420", 7); T.stroke([[100 + s * 40, 48], [100 + s * 66, 36]], "#4a3420", 5); T.stroke([[100 + s * 47, 22], [100 + s * 30, 4]], "#4a3420", 4); T.E(100 + s * 64, 34, 8, 5, "#4a8a3a"); T.E(100 + s * 52, 8, 7, 5, "#5a9a40"); }
        // тело из корней и мха
        T.P([[10, 240], [30, 180], [70, 160], [130, 160], [170, 180], [190, 240]], "#3a2a18");
        for (let k = 0; k < 14; k++) T.stroke([[20 + k * 12, 240], [30 + k * 11, 190 + R() * 10], [60 + k * 6, 166]], k % 2 ? "#5a3e24" : "#2a1c10", 4);
        // лицо-кора
        T.E(100, 105, 40, 52, "#6a4a2a");
        x.save(); x.beginPath(); x.ellipse(100, 105, 40, 52, 0, 0, Math.PI * 2); x.clip();
        for (let k = 0; k < 18; k++) T.stroke([[62 + k * 4.5, 50], [64 + k * 4.5 + (R() - 0.5) * 6, 110], [62 + k * 4.5, 160]], k % 3 ? "rgba(40,24,10,0.5)" : "rgba(140,100,60,0.4)", 1.6);
        x.fillStyle = "rgba(10,5,0,0.35)"; x.fillRect(100, 50, 50, 120); x.restore();
        T.P([[96, 100], [104, 100], [108, 128], [92, 128]], "#4a3018");   // нос-сучок
        T.E(100, 92, 30, 7, "rgba(20,10,0,0.6)");
        eyes(T, 100, 90, 15, "#c8ff60", 6);
        // моховая борода с листьями
        for (let k = 0; k < 40; k++) { const bx = 66 + R() * 68; T.stroke([[bx, 132], [bx + (R() - 0.5) * 12, 175 + R() * 30]], k % 3 ? "#3a6a2a" : "#6a9a3a", 3); }
        for (let k = 0; k < 10; k++) T.E(64 + R() * 72, 50 + R() * 10, 7, 4, k % 2 ? "#4a8a3a" : "#8ab040", R());
        T.P([[86, 140], [114, 140], [108, 146], [92, 146]], "#1a0a04");
      },
    },
    vodyanoy: {
      bg(x, R) { const T = tools(x);   // мутный омут, камыш, пузыри
        x.fillStyle = T.lin(0, 240, ["#1a4a5a", "#0e3040", "#081a24"]); x.fillRect(0, 0, 200, 240);
        for (let k = 0; k < 6; k++) { x.fillStyle = "rgba(160,220,240,0.08)"; T.P([[k * 40, 0], [k * 40 + 24, 0], [k * 40 - 20, 240], [k * 40 - 44, 240]], x.fillStyle); }
        for (let k = 0; k < 12; k++) { const rx = R() < 0.5 ? R() * 40 : 160 + R() * 40; T.stroke([[rx, 240], [rx + (R() - 0.5) * 10, 120 + R() * 60]], "#2a5a2a", 3); T.E(rx, 120 + R() * 50, 3, 9, "#5a3a20"); }
        for (let k = 0; k < 16; k++) { const r = 2 + R() * 4; x.strokeStyle = "rgba(200,240,255,0.5)"; x.lineWidth = 1.2; x.beginPath(); x.arc(R() * 200, R() * 200, r, 0, Math.PI * 2); x.stroke(); }
      },
      fig(x, R) { const T = tools(x);
        T.P([[0, 240], [20, 175], [70, 158], [130, 158], [180, 175], [200, 240]], "#3a6a4a");
        for (let k = 0; k < 18; k++) T.E(20 + k * 9, 200 + (k % 3) * 10, 6, 4, "rgba(150,220,180,0.25)");
        // широкая жабья голова
        T.E(100, 108, 56, 50, "#5a9a6a");
        x.save(); x.beginPath(); x.ellipse(100, 108, 56, 50, 0, 0, Math.PI * 2); x.clip(); x.fillStyle = "rgba(10,30,20,0.35)"; x.fillRect(100, 50, 60, 120);
        for (let k = 0; k < 14; k++) T.E(60 + R() * 80, 70 + R() * 70, 3, 2.5, "rgba(30,70,40,0.6)"); x.restore();
        for (const s of [-1, 1]) { T.E(100 + s * 24, 78, 16, 15, "#6aaa7a"); T.E(100 + s * 24, 78, 11, 11, "#f0f0b0"); T.E(100 + s * 24 + s * 2, 79, 4, 9, "#0a0a04"); }
        T.P([[56, 118], [144, 118], [130, 134], [70, 134]], "#1a3a24"); T.P([[60, 118], [140, 118], [128, 124], [72, 124]], "#a83a3a");
        for (const s of [-1, 1]) T.E(100 + s * 6, 104, 2.5, 1.5, "#1a3a24");
        // борода из водорослей и тины
        for (let k = 0; k < 34; k++) { const bx = 56 + R() * 88; T.stroke([[bx, 132], [bx + Math.sin(k) * 8, 160], [bx + (R() - 0.5) * 16, 200 + R() * 30]], k % 3 ? "#2a5a3a" : "#5a8a3a", 3); }
        // корона из ракушек
        for (let k = 0; k < 5; k++) { const cx = 70 + k * 15, h = k === 2 ? 22 : 15; T.P([[cx - 6, 64], [cx, 64 - h], [cx + 6, 64]], k % 2 ? "#e8d8b8" : "#f4e8d0"); }
        T.E(150, 196, 18, 8, "#b8c8d0", -0.4); T.P([[132, 200], [124, 192], [124, 208]], "#98a8b0"); T.E(160, 192, 2, 2, "#0a0a04");   // рыбина в лапе
      },
    },
    yaga: {
      bg(x, R) { const T = tools(x);   // избушка на курьих ножках под луной
        x.fillStyle = T.lin(0, 240, ["#1a1430", "#3a2a4a", "#1a1020"]); x.fillRect(0, 0, 200, 240);
        T.glow(40, 40, 50, "#f0e0b0", 0.4); T.E(40, 40, 15, 15, "#f6ecd0");
        for (let k = 0; k < 8; k++) { const tx = k * 28 + R() * 8; T.P([[tx - 12, 240], [tx, 120 + R() * 40], [tx + 12, 240]], "#120c18"); }
        x.fillStyle = "#4a3020"; x.fillRect(146, 70, 40, 34); T.P([[140, 72], [166, 50], [192, 72]], "#2a1a10");
        x.fillStyle = "#ffcf60"; x.fillRect(160, 80, 10, 10); T.glow(165, 85, 30, "#ffb040", 0.5);
        for (const lx of [154, 176]) { T.stroke([[lx, 104], [lx - 4, 130], [lx + 2, 150]], "#c8a060", 4); T.stroke([[lx + 2, 150], [lx - 8, 156]], "#c8a060", 3); T.stroke([[lx + 2, 150], [lx + 10, 156]], "#c8a060", 3); }
      },
      fig(x, R) { const T = tools(x);
        T.P([[10, 240], [30, 180], [70, 162], [130, 162], [170, 180], [190, 240]], "#3a2a30");
        for (let k = 0; k < 12; k++) T.stroke([[20 + k * 14, 240], [40 + k * 10, 180]], "rgba(90,60,70,0.6)", 3);
        // платок
        T.P([[44, 150], [40, 70], [70, 40], [130, 40], [160, 70], [156, 150], [130, 170], [70, 170]], "#5a2a3a");
        for (let k = 0; k < 16; k++) T.E(50 + R() * 100, 50 + R() * 100, 3, 3, k % 2 ? "#8a4a5a" : "#c8a050");
        // лицо
        T.E(100, 110, 32, 42, "#c8a88a");
        x.save(); x.beginPath(); x.ellipse(100, 110, 32, 42, 0, 0, Math.PI * 2); x.clip(); x.fillStyle = "rgba(60,30,20,0.3)"; x.fillRect(100, 60, 40, 100);
        x.strokeStyle = "rgba(90,50,30,0.6)"; x.lineWidth = 1.4; for (let q = 0; q < 4; q++) { x.beginPath(); x.moveTo(78, 80 + q * 5); x.quadraticCurveTo(100, 76 + q * 5, 122, 80 + q * 5); x.stroke(); }
        x.restore();
        for (let k = 0; k < 16; k++) T.stroke([[70 + R() * 10, 74], [60 + R() * 10, 120 + R() * 30]], "#b8b4b0", 2);   // седые космы
        for (let k = 0; k < 16; k++) T.stroke([[122 + R() * 10, 74], [134 + R() * 10, 120 + R() * 30]], "#b8b4b0", 2);
        for (const s of [-1, 1]) { T.E(100 + s * 13, 100, 7, 4, "#f0e8d0"); T.E(100 + s * 13 + 2, 100, 3, 3.5, "#3a8a3a"); T.E(100 + s * 13 + 2, 100, 1.4, 2, "#0a0a04"); T.stroke([[100 + s * 20, 92], [100 + s * 6, 95]], "#8a8a88", 3); }
        T.P([[97, 100], [105, 100], [120, 138], [110, 142], [100, 128]], "#7a4a32"); T.P([[99, 102], [104, 102], [116, 135], [110, 138], [102, 127]], "#b07a58");   // крючковатый нос
        T.E(113, 128, 3, 3, "#8a5a3a");
        T.P([[86, 140], [116, 138], [110, 146], [90, 146]], "#4a1a14"); x.fillStyle = "#f0e8c8"; x.fillRect(96, 139, 4, 6);   // один зуб
      },
    },
    gorynych: {
      bg(x, R) { const T = tools(x);   // Огненная гора, багровое небо
        x.fillStyle = T.lin(0, 240, ["#3a0a08", "#8a2a10", "#2a0a06"]); x.fillRect(0, 0, 200, 240);
        T.P([[0, 200], [50, 90], [90, 150], [140, 60], [200, 170], [200, 240], [0, 240]], "#2a1410");
        T.glow(140, 60, 60, "#ff8030", 0.6);
        for (let k = 0; k < 30; k++) T.E(R() * 200, R() * 200, 1.4, 1.4, k % 2 ? "#ffc060" : "#ff6020");
      },
      fig(x, R) { const T = tools(x);
        T.P([[0, 240], [30, 190], [100, 170], [170, 190], [200, 240]], "#2e5a2a");
        for (let k = 0; k < 20; k++) T.E(20 + k * 9, 210 + (k % 2) * 8, 6, 4, "#4a8a3a");
        const head = (cx, cy, s, ang) => {   // одна из трёх голов
          T.stroke([[100, 200], [cx, cy + 30 * s]], "#2e6a2a", 22 * s);
          x.save(); x.translate(cx, cy); x.rotate(ang); x.scale(s, s);
          T.E(0, 0, 26, 22, "#3a7a32"); T.P([[10, -8], [46, 0], [44, 12], [10, 14]], "#3a7a32"); T.P([[12, 8], [44, 12], [10, 18]], "#2a1008");
          for (const hx of [-12, 2]) T.P([[hx, -16], [hx - 8, -40], [hx + 6, -18]], "#e8d8b0");
          T.E(4, -6, 6, 5, "#ffd030"); T.E(5, -6, 2, 4, "#0a0a04");
          for (let k = 0; k < 4; k++) T.P([[14 + k * 8, 12], [17 + k * 8, 18], [20 + k * 8, 12]], "#f4f0e0");
          x.restore();
        };
        head(46, 96, 0.8, -0.4); head(154, 96, 0.8, 0.4 + Math.PI); head(100, 72, 1, -0.15);
        T.glow(150, 70, 50, "#ffb040", 0.7); T.P([[140, 68], [200, 40], [200, 100]], "rgba(255,160,40,0.75)"); T.P([[140, 70], [200, 58], [200, 84]], "rgba(255,240,160,0.8)");
      },
    },
    kikimora: {
      bg(x, R) { const T = tools(x);   // болото в сумерках
        x.fillStyle = T.lin(0, 240, ["#3a3a2a", "#2a3a2a", "#1a2018"]); x.fillRect(0, 0, 200, 240);
        for (let k = 0; k < 6; k++) T.E(R() * 200, 180 + R() * 50, 30, 6, "rgba(120,140,140,0.35)");
        for (let k = 0; k < 16; k++) { const rx = R() * 200; T.stroke([[rx, 240], [rx + (R() - 0.5) * 8, 130 + R() * 60]], "#3a4a2a", 2.5); }
        for (let k = 0; k < 8; k++) { T.glow(R() * 200, 100 + R() * 100, 12, "#c8ff90", 0.5); }
      },
      fig(x, R) { const T = tools(x);
        T.P([[30, 240], [50, 180], [80, 166], [120, 166], [150, 180], [170, 240]], "#4a5a3a");
        for (let k = 0; k < 10; k++) T.stroke([[40 + k * 13, 240], [60 + k * 8, 190]], "rgba(30,40,20,0.6)", 3);
        // космы с ветками
        for (let k = 0; k < 40; k++) { const a = -Math.PI + R() * Math.PI, r = 40 + R() * 20; T.stroke([[100, 100], [100 + Math.cos(a) * r, 100 + Math.sin(a) * r * 0.9 + 30]], k % 3 ? "#3a3a2a" : "#6a6a4a", 3); }
        T.E(100, 112, 28, 38, "#9aa890");
        x.save(); x.beginPath(); x.ellipse(100, 112, 28, 38, 0, 0, Math.PI * 2); x.clip(); x.fillStyle = "rgba(20,30,20,0.3)"; x.fillRect(100, 70, 40, 90); x.restore();
        for (const s of [-1, 1]) { T.E(100 + s * 12, 104, 9, 9, "#f0f0c8"); T.E(100 + s * 12, 104, 4, 6, "#2a4a1a"); T.E(100 + s * 12, 104, 1.5, 3, "#0a0a04"); }
        T.P([[98, 108], [102, 108], [110, 128], [100, 126]], "#7a8a70");
        T.stroke([[88, 138], [100, 134], [112, 140]], "#3a2a20", 2.4);
        for (let k = 0; k < 6; k++) T.stroke([[70 + R() * 60, 70], [64 + R() * 70, 52]], "#5a3a20", 2.5);   // сучки в волосах
        T.E(84, 66, 6, 3, "#4a7a3a", 0.4); T.E(122, 62, 5, 3, "#6a8a3a", -0.4);
      },
    },
  };
})();
