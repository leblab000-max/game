// =====================================================================
//  Сюжет и характеры: кто есть кто, что говорят, комиксы между главами
// =====================================================================
const WHO = {
  ginger: { name: "Рыжик", role: "горячая голова, вечно голодный" },
  fat: { name: "Борис", role: "не толстый, а пушистый" },
  triple: { name: "Кекс", role: "младший из тройняшек" },
  rocket: { name: "Ласточка", role: "бывшая почтовая кошка" },
  bomb: { name: "Уголёк", role: "кот-пиротехник" },
  mouse: { name: "Мышь-воришка", role: "" },
  helmet: { name: "Генерал Мышевич", role: "" },
  king: { name: "Крысиный Король Сыр I", role: "" },
};
// реплики котов, когда садятся в рогатку
const BARKS = {
  ginger: ["За рыбу!", "Держитесь, хвостатые!", "Мяу-у-у в атаку!", "Верните селёдку!"],
  fat: ["Разойдись!", "Я не толстый, я пушистый!", "Сейчас будет тяжело...", "Кто тут на диете?"],
  triple: ["Нас трое!", "Чур, я первый!", "Мама разрешила!"],
  rocket: ["Срочная доставка!", "Пристегнитесь!", "Лечу без остановок!"],
  bomb: ["Бабах — моё второе имя!", "Отойдите подальше...", "Фитиль готов!"],
};
// дразнилки мышей после промаха
const TAUNTS = ["Хи-хи!", "Мимо!", "Рыбка наша!", "Попробуй ещё!", "Ку-ку!", "Слабо?"];
const KING_TAUNTS = ["Мои стены вечны!", "Ха! Котишки!", "Сыр — сила!"];
const SCENES = {
  0: [["ginger", "Борис! Где рыба к празднику?!"], ["fat", "Была в корзине... Теперь там только мышиные следы."], ["mouse", "Хи-хи! Рыбка теперь наша!"], ["ginger", "Тащите рогатку. Идём на штурм!"]],
  1: [["helmet", "Стоять! Мельница под охраной армии Его Величества!"], ["fat", "Какого ещё величества?"], ["helmet", "Крысиного Короля Сыра Первого!"], ["ginger", "Значит, рыба у него. Борис, твой выход."], ["fat", "Наконец-то пригодится мой вес."]],
  2: [["triple", "Мы тоже хотим на штурм!"], ["ginger", "Вы же котята..."], ["triple", "Нас трое — как один большой кот!"], ["bomb", "А я принёс кое-что погорячее. Бабах — моё второе имя."], ["ginger", "Уголёк! Только без пожара в лесу."]],
  3: [["rocket", "Я облетела замок. Рыба — в тронном зале!"], ["king", "Мяукайте сколько хотите! Мои стены не по зубам котам!"], ["ginger", "Проверим, Ваше Сырейшество."]],
  end: [["king", "Пощадите! Забирайте свою рыбу!"], ["ginger", "И сыр твой заберём — к чаю."], ["fat", "Я не толстый, я праздничный!"], ["triple", "Ура! Праздник спасён!"], ["bomb", "А можно напоследок один маленький бабах?"], ["ginger", "Нет!"]],
};
// портреты персонажей рисуются один раз на основном холсте и копируются
const PORTRAIT = {};
function portrait(who) {
  if (PORTRAIT[who]) return PORTRAIT[who];
  const c = document.createElement("canvas"); c.width = 220; c.height = 220; const x = c.getContext("2d");
  const keepS = S; S = S || { taunt: 0 };
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 240, 240);
  if (WHO[who] && CATS[who === "triple" ? "triple" : who]) drawCat(110, 125, 72, -0.05, who === "triple" ? "kitten" : who, "angry");
  else drawMouse({ r: who === "king" ? 62 : 58, kind: who === "mouse" ? "normal" : who, position: { x: 110, y: 135 }, angle: 0, seed: 1 }, 0);
  x.drawImage(cv, 0, 0, 220, 220, 0, 0, 220, 220);
  g.restore(); S = keepS;
  return (PORTRAIT[who] = c.toDataURL());
}
let scene = null;
function playScene(key, done) {
  const lines = SCENES[key]; if (!lines) return done();
  scene = { lines, i: 0, done }; showLine(); $("story").hidden = false;
}
function showLine() {
  const [who, text] = scene.lines[scene.i], left = !["mouse", "helmet", "king"].includes(who);
  $("storyBody").className = "sbox " + (left ? "l" : "r");
  $("storyBody").innerHTML = `<img src="${portrait(who)}" alt=""><div class="say"><b>${WHO[who].name}</b><p>${text}</p><small>Нажми, чтобы продолжить · ${scene.i + 1}/${scene.lines.length}</small></div>`;
  sfx(["mouse", "helmet", "king"].includes(who) ? [.3, 0, 1200, .01, .04, .08, 1, 1, 0, 0, 300, .03] : [.3, 0, 500, .02, .05, .12, 1, 1, 0, 0, -100, .05]);
}
function nextLine() { if (!scene) return; scene.i++; if (scene.i >= scene.lines.length) { const d = scene.done; scene = null; $("story").hidden = true; d(); } else showLine(); }
