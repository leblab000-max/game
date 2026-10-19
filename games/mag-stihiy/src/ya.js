// =====================================================================
//  Яндекс Игры: SDK, облачные сохранения, реклама, рейтинг, пауза.
//  Вне Яндекса всё молча отключается.
// =====================================================================
const YA = { sdk: null, player: null, auth: false, lbOk: true, lastPush: 0, pushT: 0, lastAd: Date.now(), mute: new Set() };
function setMute(reason, on) { on ? YA.mute.add(reason) : YA.mute.delete(reason); muteAll(YA.mute.size > 0); pauseFor(reason, on); if (reason === "hidden" && on && R && !R.over && $("pause").hidden && $("lvlup").hidden) togglePause(); }
document.addEventListener("visibilitychange", () => setMute("hidden", document.hidden));
function yaStart() {
  if (window.YaGames) return initSDK();
  const s = document.createElement("script"); s.src = "/sdk.js"; s.async = true; s.onload = initSDK; s.onerror = () => {}; document.body.append(s);
}
async function initSDK() {
  try {
    const ysdk = await YaGames.init(); YA.sdk = ysdk; window.ysdk = ysdk;
    ysdk.features.LoadingAPI?.ready();
    if (ysdk.on) { ysdk.on("game_api_pause", () => setMute("platform", true)); ysdk.on("game_api_resume", () => setMute("platform", false)); }
    try {
      const p = await ysdk.getPlayer({ scopes: false }); YA.player = p; YA.auth = p.getMode && p.getMode() !== "lite";
      const d = await p.getData(["p"]);
      if (d && d.p && (d.p.t || 0) > (P.t || 0)) { P = Object.assign(newProfile(), d.p); save("p", P); renderMenu(); }
    } catch (e) {}
  } catch (e) {}
}
function yaPush() {
  if (!YA.player) return;
  const go = () => { YA.lastPush = Date.now(); YA.pushT = 0; try { YA.player.setData({ p: P }, false); } catch (e) {} };
  if (Date.now() - YA.lastPush > 5000) go(); else if (!YA.pushT) YA.pushT = setTimeout(go, 5000);
}
const yaGameplay = on => { try { const g = YA.sdk && YA.sdk.features.GameplayAPI; if (g) on ? g.start() : g.stop(); } catch (e) {} };
function yaInterstitial(done) {
  if (!YA.sdk || Date.now() - YA.lastAd < 90000) return done();
  YA.lastAd = Date.now();
  try { YA.sdk.adv.showFullscreenAdv({ callbacks: { onOpen: () => setMute("ad", true), onClose: () => { setMute("ad", false); done(); }, onError: () => { setMute("ad", false); done(); } } }); } catch (e) { done(); }
}
function yaRewarded(cb) {
  if (!YA.sdk) { toast("Здесь будет ролик (в версии для Яндекса)"); return cb(); }
  let got = false;
  try { YA.sdk.adv.showRewardedVideo({ callbacks: { onOpen: () => setMute("ad", true), onRewarded: () => { got = true; }, onClose: () => { setMute("ad", false); YA.lastAd = Date.now(); if (got) cb(); else toast("Досмотри ролик до конца, чтобы получить награду"); }, onError: () => { setMute("ad", false); toast("Ролик сейчас недоступен"); } } }); } catch (e) { toast("Ролик сейчас недоступен"); }
}
function yaScore(v) { if (!YA.sdk || !YA.auth || !YA.lbOk) return; try { YA.sdk.leaderboards.setScore("kills", v).catch(() => { YA.lbOk = false; }); } catch (e) {} }
