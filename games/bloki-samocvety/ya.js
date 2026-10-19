// =====================================================================
//  Яндекс Игры: SDK, облачные сохранения, реклама, рейтинг, пауза
//  Вне Яндекса всё молча отключается — игра работает как обычно.
// =====================================================================
const YA = { sdk: null, player: null, auth: false, lbOk: true, lastPush: 0, pushT: 0, battlesSinceAd: 0, lastAd: 0, mute: new Set() };
function setMute(reason, on) { on ? YA.mute.add(reason) : YA.mute.delete(reason); muteAll(YA.mute.size > 0); }
document.addEventListener("visibilitychange", () => setMute("hidden", document.hidden));
YA.lastAd = Date.now();   // первая реклама — не раньше чем через 90 с после входа
// Подключение SDK — динамическая загрузка, как в документации Яндекса:
// скрипт /sdk.js добавляется в страницу, после загрузки вызывается initSDK.
function yaStart() {
  if (window.YaGames) return initSDK();
  const script = document.createElement("script");
  script.src = "/sdk.js";
  script.async = true;
  script.onload = initSDK;
  script.onerror = () => {};   // вне Яндекса SDK нет — игра работает без него
  document.body.append(script);
}
async function initSDK() {
  try {
    const ysdk = await YaGames.init();
    YA.sdk = ysdk; window.ysdk = ysdk;
    ysdk.features.LoadingAPI?.ready();   // игра загружена, можно играть
    if (ysdk.on) { ysdk.on("game_api_pause", () => setMute("platform", true)); ysdk.on("game_api_resume", () => setMute("platform", false)); }
    try {
      const p = await ysdk.getPlayer({ scopes: false }); YA.player = p; YA.auth = p.getMode && p.getMode() !== "lite";
      const d = await p.getData(["p"]);
      if (d && d.p && (d.p.t || 0) > (P.t || 0)) { P = Object.assign(newProfile(), d.p); save("p", P); }
    } catch (e) {}
    dirty = true;
  } catch (e) {}
}
// облако: не чаще раза в 5 секунд
function yaPush() {
  if (!YA.player) return;
  const go = () => { YA.lastPush = Date.now(); YA.pushT = 0; try { YA.player.setData({ p: P }, false); } catch (e) {} };
  if (Date.now() - YA.lastPush > 5000) go(); else if (!YA.pushT) YA.pushT = setTimeout(go, 5000);
}
const yaGameplay = on => { try { const g = YA.sdk && YA.sdk.features.GameplayAPI; if (g) on ? g.start() : g.stop(); } catch (e) {} };
// реклама между партиями: не чаще раза в 90 секунд
function yaInterstitial(done) {
  if (!YA.sdk || Date.now() - YA.lastAd < 90000) return done();
  YA.lastAd = Date.now();
  try { YA.sdk.adv.showFullscreenAdv({ callbacks: { onOpen: () => setMute("ad", true), onClose: () => { setMute("ad", false); done(); }, onError: () => { setMute("ad", false); done(); } } }); } catch (e) { done(); }
}
function yaRewarded(cb) {
  let got = false;
  try { YA.sdk.adv.showRewardedVideo({ callbacks: { onOpen: () => { setMute("ad", true); yaGameplay(false); }, onRewarded: () => { got = true; }, onClose: () => { setMute("ad", false); if (got) cb(); else toast("Досмотри ролик до конца, чтобы получить награду"); }, onError: () => { setMute("ad", false); toast("Ролик сейчас недоступен, попробуй позже"); } } }); } catch (e) { toast("Ролик сейчас недоступен"); }
}
function yaScore() { if (!YA.sdk || !YA.auth || !YA.lbOk) return; try { YA.sdk.leaderboards.setScore("score", P.best).catch(() => {}); } catch (e) {} }
let yaTop = null, yaTopAt = 0;
function yaFetchTop() {
  if (!YA.sdk || !YA.lbOk || Date.now() - yaTopAt < 30000) return; yaTopAt = Date.now();
  YA.sdk.leaderboards.getEntries("score", { quantityTop: 20, includeUser: true, quantityAround: 3 })
    .then(r => { yaTop = r.entries.map(e => ({ rank: e.rank, name: e.player.publicName || "Игрок", t: e.score, me: YA.player && e.player.uniqueID === YA.player.getUniqueID() })); dirty = true; })
    .catch(() => { YA.lbOk = false; });
}
