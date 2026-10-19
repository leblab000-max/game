// =====================================================================
//  Музыка: своя мелодия, синтезируется на лету (ничего не загружаем)
//  Ля минор, 112 ударов в минуту. В бою — бас, бочка и арпеджио,
//  в лавке и меню — тихо и спокойно.
// =====================================================================
const MUS = { mode: "off", next: 0, step: 0, vol: 0 };
const mtof = m => 440 * 2 ** ((m - 69) / 12);
const PROG = [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 55, 59]];   // Am F G Em
const ARP = [0, 1, 2, 1, 0, 2, 1, 2];
// мелодия: 64 шага (4 такта), нули — паузы. Ложится на аккорды выше
const MEL = [76, 0, 0, 74, 72, 0, 69, 0, 72, 0, 74, 0, 76, 0, 0, 0,
  77, 0, 0, 76, 74, 0, 72, 0, 69, 0, 72, 0, 74, 0, 0, 0,
  79, 0, 0, 77, 76, 0, 74, 0, 71, 0, 74, 0, 79, 0, 76, 0,
  76, 0, 74, 0, 72, 0, 71, 0, 69, 0, 0, 0, 71, 0, 72, 0];
function mNote(t, m, dur, type, vol) {
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.value = mtof(m);
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(musicGain); o.start(t); o.stop(t + dur + 0.05);
}
function mKick(t) {
  const o = AC.createOscillator(), g = AC.createGain();
  o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
  g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  o.connect(g); g.connect(musicGain); o.start(t); o.stop(t + 0.2);
}
function mHat(t, v) {
  const n = AC.createBufferSource(), b = AC.createBuffer(1, 2205, 44100), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const f = AC.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 7000;
  const g = AC.createGain(); g.gain.value = v; n.buffer = b; n.connect(f); f.connect(g); g.connect(musicGain); n.start(t);
}
function musicTick() {
  if (!AC || !musicGain) return;
  const want = soundOn && MUS.mode !== "off" ? (MUS.mode === "battle" ? 0.26 : 0.16) : 0;
  MUS.vol += (want - MUS.vol) * 0.15; musicGain.gain.value = MUS.vol;
  if (MUS.vol < 0.005) { MUS.next = AC.currentTime + 0.05; return; }
  const spb = 60 / 112 / 2, battle = MUS.mode === "battle";
  if (MUS.next < AC.currentTime) MUS.next = AC.currentTime + 0.05;
  while (MUS.next < AC.currentTime + 0.25) {
    const s = MUS.step, t = MUS.next, ch = PROG[(s >> 4) % 4];
    if (s % 8 === 0) mNote(t, ch[0] - 24, spb * 7, "triangle", 0.32);
    if (battle && s % 4 === 0) mKick(t);
    if (battle && s % 2 === 1) mHat(t, s % 4 === 3 ? 0.06 : 0.03);
    if (battle || s % 2 === 0) mNote(t, ch[ARP[s % 8]] + (s % 16 >= 8 ? 12 : 0), spb * (battle ? 0.8 : 1.8), "square", battle ? 0.035 : 0.025);
    const m = MEL[s % 64]; if (m && (battle || s % 128 < 64)) mNote(t, m, spb * 1.9, "triangle", battle ? 0.11 : 0.07);
    MUS.next += spb; MUS.step++;
  }
}
setInterval(musicTick, 60);
function music(mode) { MUS.mode = mode; }
