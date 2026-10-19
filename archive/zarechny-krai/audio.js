// ================= Звук: ZzFX (Frank Force, MIT) + своя народная мелодия =================
// ZzFX — крошечный синтезатор звуков. Здесь он не играет сам, а отдаёт отсчёты,
// чтобы звук можно было ставить в очередь (для музыки) и пускать через общую громкость.
// Порядок параметров: громкость, разброс, частота, атака, удержание, затухание, форма, изгиб,
// сдвиг, сдвиг сдвига, скачок, время скачка, повтор, шум, модуляция, огрубление, эхо, уровень, спад, тремоло, фильтр.
const zzfxG = (p = 1, k = .05, b = 220, e = 0, r = 0, t = .1, q = 0, D = 1, u = 0, y = 0, v = 0, z = 0, l = 0, E = 0, A = 0, F = 0, c = 0, w = 1, m = 0, B = 0, N = 0) => { let M = Math, d = 2 * M.PI, R = 44100, G = u *= 500 * d / R / R, C = b *= (1 - k + 2 * k * M.random(k = [])) * d / R,
  g = 0, H = 0, a = 0, n = 1, I = 0, J = 0, f = 0, h = N < 0 ? -1 : 1, x = d * h * N * 2 / R, L = M.cos(x), Z = M.sin, K = Z(x) / 4, O = 1 + K,
  X = -2 * L / O, Y = (1 - K) / O, P = (1 + h * L) / 2 / O, Q = -(h + L) / O, S = P, T = 0, U = 0, V = 0, W = 0; e = R * e + 9; m *= R; r *= R; t *=
  R; c *= R; y *= 500 * d / R ** 3; A *= d / R; v *= d / R; z *= R; l = R * l | 0; for (h = e + m + r + t + c | 0; a < h; k[a++]
  = f * p) ++J % (100 * F | 0) || (f = q ? 1 < q ? 2 < q ? 3 < q ? 4 < q ? (g / d % 1 < D / 2) * 2 - 1 : Z(g ** 3) : M.max(M.min(M.tan(g)
  , 1), -1) : 1 - (2 * g / d % 2 + 2) % 2 : 1 - 4 * M.abs(M.round(g / d) - g / d) : Z(g), f = (l ? 1 - B + B * Z(d * a / l) : 1) * (4 < q ?
  f : (f < 0 ? -1 : 1) * M.abs(f) ** D) * (a < e ? a / e : a < e + m ? 1 - (a - e) / m * (1 - w) : a < e + m + r ? w : a < h - c ? (h - a - c) / t * w :
  0), f = c ? f / 2 + (c > a ? 0 : (a < h - c ? 1 : (h - a) / c) * k[a - c | 0] / 2 / p) : f, N ? f = W = S * T + Q * (T = U) + P * (U = f) - Y * V - X * (
  V = W) : 0), x = (b += u += y) * M.cos(A * H++), g += x + x * E * (a * a * d % 2 - 1), n && ++n > z && (b += v, C += v, n = 0), !l || ++I % l
  || (b = C, u = G, n = n || 1); return k; };
let AC = null, master = null, musicGain = null;
function audio() {
  if (!AC) { AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = 0.32; master.connect(AC.destination); musicGain = AC.createGain(); musicGain.gain.value = 0.42; musicGain.connect(master); }
  if (AC.state === "suspended") AC.resume();
  return AC;
}
const SFX_CACHE = new Map();
function sfx(params, when = 0, dest = null, force = false) {
  if (!soundOn && !force) return;
  try {
    const ac = audio(), key = params.join(",");
    let buf = SFX_CACHE.get(key);
    if (!buf) { const k = zzfxG(...params); buf = ac.createBuffer(1, k.length, 44100); buf.getChannelData(0).set(k); if (!params[1]) SFX_CACHE.set(key, buf); }
    const s = ac.createBufferSource(); s.buffer = buf; s.connect(dest || master); s.start(when || 0);
  } catch (e) {}
}
const FX = {
  click: [.35, 0, 900, 0, .005, .03, 1],
  step: [.35, .1, 120, 0, .01, .06, 4, 1, 0, 0, 0, 0, 0, 3],
  coin: [.5, 0, 1675, 0, .03, .2, 1, 1.8, 0, 0, 837, .06],
  build: [.6, .05, 180, 0, .01, .09, 4, 1, 0, 0, 0, 0, .12, 1, 0, 0, 0, .5],
  found: [.5, 0, 523, .02, .2, .5, 1, 1, 0, 0, 262, .12, 0, 0, 0, 0, .15],
  dice: [.5, .4, 340, 0, .02, .05, 4, 0, 0, 0, 0, 0, .025, 9],
  win: [.6, 0, 392, .02, .3, .6, 1, 1, 0, 0, 196, .1, .25, 0, 0, 0, .2],
  bad: [.6, 0, 160, 0, .1, .35, 3, 1.5, -4, 0, 0, 0, 0, .5],
  roar: [1, .2, 55, .05, .35, .6, 2, 2, -.4, 0, 0, 0, 0, 1.6, 0, .3, 0, .8, 0, .2],
  wind: [.5, .2, 240, .3, .4, .7, 4, 0, 0, 0, 0, 0, 0, 4, 0, 0, .2],
  water: [.45, .2, 400, .05, .2, .4, 0, 1, -6, 0, 0, 0, .06, 0, 0, 0, .1],
  witch: [.45, 0, 700, .02, .1, .3, 1, 1, 0, 0, -200, .05, .07, 0, 2, 0, .1],
  season: [.45, 0, 1200, 0, .1, .7, 0, 1, 0, 0, 600, .12, 0, 0, 0, 0, .2],
  turn: [.3, 0, 330, 0, .02, .12, 1, 1, 0, 0, 110, .05],
};
const CREATURE_FX = { leshiy: "wind", vodyanoy: "water", yaga: "witch", gorynych: "roar", kikimora: "witch", liho: "bad" };
// ---- музыка: балалаечный перебор, своя мелодия в народном ладу, меняется по временам года
let musicOn = true, musicNext = 0, musicStep = 0, musicTimer = 0;
const MINOR = [0, 2, 3, 5, 7, 8, 10], MAJOR = [0, 2, 4, 5, 7, 9, 11];
const MOTIFS = [
  [0, null, 2, null, 4, 4, 3, 2, 1, null, 2, null, 0, null, null, null],
  [4, null, 5, 4, 3, null, 2, null, 3, 3, 2, 1, 2, null, null, null],
  [0, 2, 4, 7, 6, 4, 5, null, 4, 3, 2, null, 1, null, 0, null],
  [7, null, 6, 5, 4, null, 4, 5, 6, null, 5, 4, 3, null, null, null],
];
const FORM = [0, 1, 0, 2, 3, 1, 2, 0];
const deg = (sc, d) => Math.floor(d / 7) * 12 + sc[((d % 7) + 7) % 7];
function musicTick() {
  if (!AC || !musicOn || !soundOn || !G) return;
  const si = seasonOf(), major = si <= 1, sc = major ? MAJOR : MINOR, base = major ? 3 : 0;
  const stepLen = [0.24, 0.22, 0.28, 0.34][si];
  if (musicNext < AC.currentTime) musicNext = AC.currentTime + 0.05;
  while (musicNext < AC.currentTime + 0.5) {
    const bar = Math.floor(musicStep / 16) % FORM.length, s = musicStep % 16, motif = MOTIFS[FORM[bar]], n = motif[s];
    const hz = semi => 220 * 2 ** ((semi + base) / 12);
    if (n !== null && !(si === 3 && s % 2)) {   // перебор балалайки: короткий щипок с эхом
      sfx([.32, 0, hz(deg(sc, n)), .002, .02, .22, 1, 1.4, 0, 0, 0, 0, 0, 0, 0, 0, .09, .4, .12], musicNext, musicGain, true);
      if (si === 3) sfx([.1, 0, hz(deg(sc, n)) * 2, .01, .05, .6, 0], musicNext, musicGain, true);   // зимой — колокольчики
    }
    if (s === 0 || s === 8) sfx([.28, 0, hz(deg(sc, (bar % 2 ? 4 : 0)) - 24), .01, .25, .3, 1, 1], musicNext, musicGain, true);   // бас
    if (si === 1 && s % 4 === 2) sfx([.06, 0, 6000, 0, .01, .04, 4], musicNext, musicGain, true);   // летом бубен
    musicNext += stepLen; musicStep++;
  }
}
function startMusic() { if (!musicTimer) musicTimer = setInterval(musicTick, 120); }
window.addEventListener("pointerdown", () => { if (soundOn) { audio(); startMusic(); } }, { passive: true });
