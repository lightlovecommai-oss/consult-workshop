/* ═══════════════════════════════════════════════════════════
   ATPI 核心共用檔（跨專案共用，改這裡兩個專案會一起生效）
   使用專案：consult-workshop（任務儀表板）、comconverttest（測驗結果頁）
   內容：4 大肌肉順序、潛力值公式、變現路徑文案庫
   不放這裡：各專案自己的計分方式、題庫/任務庫、LIFF/Sheet 設定
   ═══════════════════════════════════════════════════════════ */

var DORD = ["A", "T", "P", "I"];

/* ═══════════════════════════════════════════════════════════
   12 小肌群（唯一真相＝productkit《01-核心定義字典》ATPI 條）
   🔄 2026-08-30 ATPI 重構寫回（逐格真相＝productkit 技巧樹校對）：
     · 肌理（內部用語，不對學生露）＝A 留多久／T 誰先給／P 怎麼證明你能解／I 差什麼
     · T 整組換內容（T1 講出心裡 OS＝我先給／T2 提問式聆聽＝他才給／T3 承諾兌現＝我兌現，7-11-4 退場）
     · P 重切成「怎麼證明你能解」（P1 目標落差＝三招融合／P2 自證＝大絕招・視覺化 Demo／P3 他證三件組）
     · 真誠收單→真誠邀請、預先框飾→前置約定
   name＝小肌群格名（「讓他XX」・2026-08-31 拍板・唯一寫法）｜name2＝歷史別名（已退場的四字動作，
   僅供回溯，任何 UI 都不要顯示）｜tech＝正選技巧｜ask＝週測問法
   ⚠️ 格名已定案（2026-08-31 拍板「讓他XX」，備案「四字動作」退場）；改名字前先改字典 01 ATPI 條，這裡跟著改。
   ✅ 2026-09-01 comconverttest 起真的載入本檔（<script src="atpi-core.js">），
      且已改成輸出 12 小肌群：每維 3 題＝3 個小肌群，題幹就是把本表 ask 欄改寫成情境選擇題，
      選項＝EVAL_ANCHORS 的 1–5，所以測驗分無縫就是體格分基線（不用換算）。
      該 repo 放的是同步副本（用它的 sync-atpi-core.sh 從本檔複製過去）——本檔仍是唯一真相。
   ═══════════════════════════════════════════════════════════ */
var MUSCLES = {
  A1: {dim:"A", name:"讓他開口", name2:"主動破冰", tech:"真誠稱讚・前置約定",        ask:"陌生情境有沒有主動開口、用真誠稱讚讓對方接話，防衛鬆下來（非只客套回謝謝）"},
  A2: {dim:"A", name:"讓他追問", name2:"端出亮點", tech:"端牛肉・萬能關鍵句",        ask:"有沒有讓對方當場哇並追問（然後呢／你怎麼做到的），非只點頭喔喔"},
  A3: {dim:"A", name:"讓他記得", name2:"留下故事", tech:"英雄之旅（低→轉→高·長版）", ask:"隔一週他還記得你、複述得出你的轉折點（＝能用一句話介紹你）"},
  T1: {dim:"T", name:"讓他敢說", name2:"我先交心", tech:"講出心裡 OS",                ask:"有沒有先把自己心裡沒說的（還在怕的、還沒成的）講出來，讓對方也開始給"},
  T2: {dim:"T", name:"讓他交心", name2:"請他交心", tech:"提問式聆聽・邀請講OS／預看", ask:"有沒有一層一層問下去、換到他講出你沒問的事"},
  T3: {dim:"T", name:"讓他當真", name2:"說到做到", tech:"承諾兌現",                    ask:"答應的有沒有兌現、能不能用結果或歷程佐證說到做到"},
  P1: {dim:"P", name:"讓他釐清", name2:"釐清問題", tech:"目標落差（A→B＋Whyyy＋Whooo）", ask:"有沒有畫出他的 A→B、在落差處挖出他沒說出口的卡點（兩端數字要他自己報）"},
  P2: {dim:"P", name:"讓他有感", name2:"親自實證", tech:"大絕招 3 步・視覺化 Demo",   ask:"有沒有讓對方親自實證／秒懂、給 0–10 分（7 分以上才算過）"},
  P3: {dim:"P", name:"讓他放心", name2:"他人作證", tech:"他證三件組（見證・數據・背書）", ask:"有沒有用他證讓對方主動追問那個案例"},
  I1: {dim:"I", name:"讓他想要", name2:"確認結果", tech:"結果翻譯",                    ask:"有沒有帶他確認他要的結果、他用你的結果句複述（非複述規格）"},
  I2: {dim:"I", name:"讓他敢要", name2:"拆掉疑慮", tech:"讀水溫 3 招",                 ask:"有沒有主動讀水溫、問出並回應抗點，而不是等對方自己說"},
  I3: {dim:"I", name:"讓他答應", name2:"邀他行動", tech:"真誠邀請・被動跟進",          ask:"有沒有拿到「對方同意的具體推進」（下次時間／他要準備的東西／他答應去對誰說）"}
};
/* 固定順序（A1→I3）。所有迴圈用它，別用 Object.keys（順序不保證）。 */
var MORD = ["A1","A2","A3","T1","T2","T3","P1","P2","P3","I1","I2","I3"];

/* 大肌肉的「結果句」——會員模式用（字典「兩種語言」條）。
   ⚠️ 不是別名：正式維度名仍只有 DIMS[k].name（〇〇肌肉），結果句只能用在會員模式的敘述文案。 */
var DIM_RESULT = { A:"讓他想靠近", T:"讓他願意說", P:"讓他要找你", I:"讓他願意動" };
/* ⚠️ P 結果句 2026-09-01 再改定義（老師拍板）：讓他覺得有解 → 讓他要找你。
   舊句沒把解法綁到「你」身上（他覺得有解也可以去找別人），與 P 的方向欄「怎麼證明你能解」脫鉤。
   新句 5 字、與其他三句完全同構、是決定不是認知狀態。
   ⚠️ 連帶：P/I 分界句同步改成「P＝他認定你就是那個人；I＝他真的動了」。
   歷史：2026-08-27 讓他覺得你懂 → 讓他覺得有解（兩句皆已作廢）。 */

/* ── 核心肌肉（基本功）＝地基層，2 塊——講故事＝推／問問題＝拉（字典 §750 推拉閉環：
      處方互相指向對方，講故事過頭→換去問問題、問問題過頭→換回講故事）。
      課程層概念、不進 ATPI 四維計分；ask 驗收句與 name2＝2026-09-05 老師拍板。
      打卡練習腳本在 consult-workshop judgement.js 的 CORE_DRILL（key 對這裡的 story/ask）。 */
var CORE_MUSCLES = {
  story: { name:"講故事", name2:"讓我有渲染力", role:"推",
           ask:"可以選用畫面描述事情，讓人身歷其境的產生感受" },
  ask:   { name:"問問題", name2:"讓他被引導", role:"拉",
           ask:"他越講越多，講到自己找到答案" }
};

/* 週測 1–5 錨點（字典 ATPI 條）。評分看「本週有無具體事例」，不憑感覺。
   🔄 2026-08-30（G8）改非單調：做太多（過頭）會扣分，出現「過頭訊號」該格封頂 3 分；
   健檢要分開寫「不足（加量）」與「過頭（減量並換方向）」。過頭訊號 12 格全表＝productkit 22 檔 §四。
   （UI 目前只呈現 1–5 label；過頭勾選待前端補，見 report/member 待處理清單。） */
var EVAL_ANCHORS = [
  {v:1, label:"沒做到"},
  {v:2, label:"偶爾且生硬"},
  {v:3, label:"想到才做、時好時壞（或做了但對方出現過頭訊號）"},
  {v:4, label:"多數情境做得到，且沒出現過頭訊號"},
  {v:5, label:"穩定到自動化，且能在對方出現過頭訊號前自己收手"}
];

/* 某大肌肉底下的 3 個小肌群 key */
function musclesOfDim(dim) {
  return MORD.filter(function(k){ return MUSCLES[k].dim === dim; });
}
/* 小肌群 key → 所屬大肌肉（吃不認得的 key 回 null，呼叫端自行忽略） */
function dimOfMuscle(mk) {
  return (MUSCLES[mk] || {}).dim || null;
}
/* 大肌肉分 ＝ 該維 3 小肌群平均（字典 ATPI 條的計分規則）。
   scores＝{A1:..,A2:..}；缺的小肌群不計入平均（分母只算有值的），全缺回 0。 */
function dimFromMuscles(muscleScores) {
  var out = {};
  DORD.forEach(function(d) {
    var vals = musclesOfDim(d)
      .map(function(k){ return muscleScores[k]; })
      .filter(function(v){ return typeof v === "number" && !isNaN(v); });
    out[d] = vals.length ? vals.reduce(function(a,b){ return a+b; }, 0) / vals.length : 0;
  });
  return out;
}
/* 最弱 n 塊小肌群（解盤層 1「指出最低三塊」＋ 自動派課表都用這個）。
   只排有分數的；同分時照 MORD 順序穩定排序，避免每次重整順序亂跳。 */
function weakestMuscles(muscleScores, n) {
  n = n || 3;
  return MORD
    .filter(function(k){ var v = muscleScores[k]; return typeof v === "number" && !isNaN(v); })
    .sort(function(a, b) {
      var d = muscleScores[a] - muscleScores[b];
      return d !== 0 ? d : (MORD.indexOf(a) - MORD.indexOf(b));
    })
    .slice(0, n);
}

/* ── 已解鎖影響力公式（字典 2026-09-03「公式重帶參數」・改這裡就全部生效）──
   scores＝四維「練到幾成」%（0–100，行為證據算出來的能力；D5A：成交不進 scores）。
   已解鎖影響力 ＝ (成數A × 成數T × 成數P × 成數I)^0.6 × 1000。
   γ=0.6 是體感軟旋鈕（只調體感、不改排名）；錨定：四塊全 5 成＝189、全 10 成＝1000。
   舊參數 ^0.8 作廢（字典 §834）。1–5 量表先用 pctFromEval() 歸零換算再進來。
   ⚠️ 口徑（D4A）：對外別說「缺一即零」，要說「任一塊趨近零時嚴重折損」。
   對外名稱一律「已解鎖影響力」；赤字語言禁令＝主敘述只講 unlocked、不拿 locked 當標籤。 */
function calcPotential(scores) {
  var unlocked = Math.round(Math.pow(scores.A/100 * scores.T/100 * scores.P/100 * scores.I/100, 0.6) * 1000);
  return { unlocked: unlocked, locked: 1000 - unlocked };
}
/* 1–5 量表 → 成數%：先歸零（1 分＝完全沒做到＝0 成）再除以 4——字典人話三步的第①步。
   quiz／週測的維度分換算一律走這裡；舊寫法 d/5*100 沒歸零、作廢。 */
function pctFromEval(v) {
  return Math.max(0, Math.round((v - 1) / 4 * 100));
}

/* ── 單一強項 → 變現路徑敘述 ──
   ⚠️ 2026-08-28 正典：四維一律「〇〇肌肉」（吸引／信任／專業／推進），「〇〇力」作廢。
   ✅ 2026-09-01：底下三份文案庫（STRONG_PATH／COMBO_PATH／WEAK_DESC）comconverttest 已改成
      載入本檔、刪掉它內嵌的那一份，所以改這裡會同步到測驗結果頁。舊註記「那邊要另外過一次」作廢。
      ⚠️ 它內嵌版本裡多的 COMBO_PATH.avoid 欄從來沒被讀過，一併刪掉、本檔不補。 */
var STRONG_PATH = {
  A: "想像這個場景：你在一個商業活動或社群聚會開口說話，周圍的人自然把目光轉向你，有人開始追問「然後呢？」，有人默默加了你的 LINE。\n\n這就是你最容易、也是天賦的變現路徑——吸引型。你不需要刻意推銷，人自然往你身邊靠。最適合你的場景：社群經營、內容創作、演講分享，讓陌生人主動找上門。",
  T: "想像這個場景：你跟一個潛在客戶聊了半小時，對方把從沒跟別人說過的困擾都說出來了，最後主動問你「你有沒有什麼課程或服務？」\n\n這就是你最容易、也是天賦的變現路徑——關係型。你不用追客戶，客戶會追你。最適合你的場景：1對1 深度諮詢、長期顧問關係、讓滿意的客戶主動介紹新客戶。",
  P: "想像這個場景：你在一個場合分享了一個觀點或案例，對方聽完沉默了幾秒，然後說「這個人真的很懂，我想跟他聊聊」——主動問你有沒有合作的方式。\n\n這就是你最容易、也是天賦的變現路徑——權威型。你的專業本身就是最強的磁鐵。最適合你的場景：顧問服務、企業培訓、高單價專業諮詢，讓對方覺得「值得付這個價格」。",
  I: "想像這個場景：你在台上或現場說完一段話，台下的人紛紛走過來問你「怎麼跟你合作」、「下一堂課什麼時候開」——你還沒開口推銷，他們已經準備好了。\n\n這就是你最容易、也是天賦的變現路徑——推進型。你天生能讓人在當下做決定。最適合你的場景：演講現場收單、工作坊、活動型銷售，把每次亮相變成一次成交機會。"
};

/* ── 變現流程甜蜜點（依最強兩維度組合查表）── */
var COMBO_PATH = {
  AT: {
    title: "社群養粉 × 轉介紹成交",
    flow: "① 發內容，吸引肌肉自然帶來陌生流量\n② 有人私訊，信任肌肉讓他覺得你懂他\n③ 聊著聊著，對方主動問「你有什麼服務？」\n④ 不用推銷，他們已經說服自己了",
    tips: "專業肌肉弱 → 別賣方法論，賣「陪你一起做」的陪伴型服務\n推進肌肉弱 → 不做現場收單，改用限時報名表單讓截止日期幫你逼單\n定價走中低客單，靠口碑和量滾起來"
  },
  AP: {
    title: "知識型內容 × 課程產品",
    flow: "① 持續輸出有深度的內容，吸引肌肉帶流量、專業肌肉讓人覺得你很懂\n② 累積一群「覺得你很厲害」的追蹤者\n③ 推出課程或工作坊（不需要深度信任就能成交）\n④ 課程體驗本身幫你建立信任肌肉，之後再升級高單價",
    tips: "信任肌肉弱 → 靠出現頻率建熟悉感，常出現 = 類信任，不靠深聊\n推進肌肉弱 → 用稀缺名額＋截止日期讓環境幫你推進，不用自己開口\n最適合做課程、電子書、訂閱制"
  },
  AI: {
    title: "演講亮相 × 現場收單 → 後端升級",
    flow: "① 上台或辦活動，吸引肌肉讓台下捨不得滑手機\n② 活動結束前用推進肌肉現場推低客單入門產品，趁熱打鐵\n③ 進來的人靠課程體驗建立信任肌肉和專業肌肉\n④ 後端再做一次高單價升級",
    tips: "信任肌肉弱 → 不靠個人關係，靠見證和學員案例讓別人說話\n專業肌肉弱 → 賣結果不賣方法（「學員平均 3 個月增加 20 萬」比「7 步驟方法論」更有力）\n前端低客單可以很低，甚至免費，靠吸引肌肉和推進肌肉把人收進來"
  },
  PT: {
    title: "深度服務 × 口碑轉介紹循環",
    flow: "① 先在現有人脈裡找第一批客戶，信任肌肉讓對方覺得你真的懂他\n② 專業肌肉撐住高單價，交付讓對方超滿意\n③ 主動請客戶介紹下一個人（客戶的吸引肌肉幫你做你做不到的事）\n④ 新客戶帶著信任進來，直接進入成交",
    tips: "吸引肌肉弱 → 不做冷流量，找吸引肌肉強的合作夥伴導流，你專攻後端成交和交付\n推進肌肉弱 → 諮詢結尾問「如果繼續，三個月後你想達到什麼？」讓對方自己描繪未來，自然說 yes\n走高客單，靠深度不靠量"
  },
  IT: {
    title: "人脈深耕 × 結果說話 → 持續升價",
    flow: "① 從現有人脈找第一批客戶，信任肌肉讓他們願意試試看\n② 推進肌肉在對話結尾自然帶到成交，不拖\n③ 拿到真實結果，讓結果替代專業肌肉的位置\n④ 靠口碑和結果持續升價，不需要陌生流量",
    tips: "吸引肌肉弱 → 不自己冷啟動，去別人的場合露臉（上 Podcast、聯名活動、商業社群）\n專業肌肉弱 → 用學員結果替代理論（「他做了這件事之後收入翻倍了」比「我有方法論」更有說服力）\n這個組合最怕沒有舞台，要積極被介紹到人脈圈"
  },
  IP: {
    title: "專業提案 × B2B 企業成交",
    flow: "① 鎖定企業或機構客戶，不靠個人魅力，靠提案和結果說話\n② 專業肌肉撐住提案品質，讓對方覺得「這個人真的懂」\n③ 推進肌肉推動決策層，縮短採購周期，讓他們現在做決定\n④ 交付後直接談下一個合約，不需要重新開發",
    tips: "吸引肌肉弱 → 靠精緻的提案書和案例集替代個人魅力\n信任肌肉弱 → 用流程建立信任（回覆快、交付準時、清楚的合約），不靠個人溫度\n另一條路：找吸引肌肉和信任肌肉強的合夥人做前端，你專攻後端提案和交付"
  }
};

/* ── 單一弱項 → 缺口說明 ── */
var WEAK_DESC = {
  A: "吸引肌肉是成交流程的入口——沒有人被你吸引進來，後面的信任、專業、推進都沒有機會發揮。\n\n你需要的不是更努力說話，而是讓說話本身更有磁性，讓對方自然想靠近。",
  T: "信任肌肉是成交的地基——對方可能覺得你很厲害，但還沒有到「願意掏錢給你」的程度。\n\n你需要的是讓對方在短時間內感覺「你真的懂我」，打開心房才能打開錢包。",
  P: "專業肌肉決定對方願不願意付你高單價——如果對方覺得你說的東西「聽起來不錯但不確定有沒有用」，就不會成交。\n\n你需要的是把你的能力用對方聽得懂的語言說出來。",
  I: "推進肌肉是臨門一腳——前面吸引、信任、專業都做對了，但對方就是沒有採取行動。\n\n你需要的是在對的時機給對方一個說「好」的理由，而不是等他自己決定。"
};

/* ── 依分數找出強項組合 × 甜蜜路徑（各專案共用同一套判斷邏輯，不用各自重算）── */
function getCombo(scores) {
  var sorted = DORD.slice().sort(function(a, b) { return scores[b] - scores[a]; });
  var sk = sorted[0], sk2 = sorted[1], wk = sorted[3];
  var comboKey = [sk, sk2].sort().join("");
  var combo = COMBO_PATH[comboKey] || COMBO_PATH[Object.keys(COMBO_PATH)[0]];
  return { sorted: sorted, sk: sk, sk2: sk2, wk: wk, comboKey: comboKey, combo: combo };
}

/* ═══════════════════════════════════════════════════════════
   以下是渲染輔助函式（依賴呼叫端已定義好 DIMS 全域變數，
   以及 CSS 裡的 .hdiv 樣式）。跟上面的純資料不同，這類函式
   綁定了固定版面，只在「大部分專案都會長一樣」的部分才共用。
   ═══════════════════════════════════════════════════════════ */

/* 文字用色：優先吃 DIMS[k].textColor（品牌 21 檔的「暖版・深版」，小字才過 WCAG），
   沒給就退回 color——consult-workshop 的 DIMS 沒有這欄，行為與改版前完全一致。
   ⚠️ 暖版的 I 原版 #C99A4E 連大字都不合格，用暖色盤時 textColor 是必填不是選填。 */
function dimTextColor(k) { return DIMS[k].textColor || DIMS[k].color; }
/* #rrggbb → rgba(...)，只給下面的雷達填色用（別的地方請直接寫 CSS 變數） */
function hexRGBA(hex, alpha) {
  var h = String(hex).replace("#", "");
  return "rgba(" + parseInt(h.slice(0,2),16) + "," + parseInt(h.slice(2,4),16) + "," + parseInt(h.slice(4,6),16) + "," + alpha + ")";
}

/* ── 4 大肌肉雷達圖（SVG 向量版，取代舊的 canvas 畫法）
      svgEl：一個 <svg> DOM 元素；scores：{A,T,P,I} 0-100 分數
      資料多邊形吃 DIMS.A.color（＝品牌行動色），所以換色盤時這裡自動跟著換 ── */
function drawRadarSVG(svgEl, scores) {
  svgEl.innerHTML = "";
  var cx = 130, cy = 140, mr = 90;
  var vals = DORD.map(function(k) { return scores[k] / 100; });
  var angles = DORD.map(function(_, i) { return (Math.PI*2*i/4) - Math.PI/2; });
  function pt(r, a) { return [cx + r*Math.cos(a), cy + r*Math.sin(a)]; }
  function el(tag, attrs) {
    var e = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.keys(attrs).forEach(function(k) { e.setAttribute(k, attrs[k]); });
    return e;
  }
  [0.25,0.5,0.75,1.0].forEach(function(f) {
    var pts = angles.map(function(a) { var p = pt(mr*f, a); return p[0]+","+p[1]; }).join(" ");
    svgEl.appendChild(el("polygon", {points:pts, fill:f===1?"rgba(240,228,218,0.4)":"none", stroke:"rgba(168,128,96,0.18)", "stroke-width":"0.8"}));
  });
  angles.forEach(function(a) {
    var p = pt(mr, a);
    svgEl.appendChild(el("line", {x1:cx, y1:cy, x2:p[0], y2:p[1], stroke:"rgba(168,128,96,0.15)", "stroke-width":"0.8"}));
  });
  var dpts = angles.map(function(a, i) { var p = pt(mr*Math.min(vals[i],1), a); return p[0]+","+p[1]; }).join(" ");
  svgEl.appendChild(el("polygon", {points:dpts, fill:hexRGBA(DIMS.A.color, 0.15), stroke:DIMS.A.color, "stroke-width":"2", "stroke-linejoin":"round"}));

  var tip = el("g", {id:"radar-tip", opacity:"0", style:"pointer-events:none;"});
  var tipBg = el("rect", {rx:"8", ry:"8", fill:"#2d1f0f", height:"26"});
  var tipTxt = el("text", {"font-size":"12", "font-weight":"600", fill:"#fff", "text-anchor":"middle", "dominant-baseline":"middle", "font-family":"-apple-system,sans-serif"});
  tip.appendChild(tipBg); tip.appendChild(tipTxt); svgEl.appendChild(tip);
  function showTip(px, py, txt, color) {
    tipTxt.textContent = txt;
    tipBg.setAttribute("fill", color);
    var tw = txt.length*7.5+16;
    tipBg.setAttribute("width", tw); tipBg.setAttribute("x", px-tw/2); tipBg.setAttribute("y", py-34);
    tipTxt.setAttribute("x", px); tipTxt.setAttribute("y", py-21);
    tip.setAttribute("opacity", "1");
  }
  svgEl.addEventListener("click", function() { tip.setAttribute("opacity", "0"); });

  DORD.forEach(function(k, i) {
    var p = pt(mr*Math.min(vals[i],1), angles[i]);
    var hit = el("circle", {cx:p[0], cy:p[1], r:"14", fill:"transparent", style:"cursor:pointer;"});
    var c = el("circle", {cx:p[0], cy:p[1], r:"5", fill:DIMS[k].color, stroke:"#fff", "stroke-width":"1.5", style:"pointer-events:none;"});
    hit.addEventListener("click", function(e) {
      e.stopPropagation();
      showTip(p[0], p[1], DIMS[k].name+" "+scores[k], dimTextColor(k));  // tooltip 是色塊上的白色小字＝深版
    });
    svgEl.appendChild(hit); svgEl.appendChild(c);
  });
  DORD.forEach(function(k, i) {
    var p = pt(mr+22, angles[i]);
    var t = el("text", {x:p[0], y:p[1], "font-size":"12", "font-weight":"500", fill:dimTextColor(k), "text-anchor":"middle", "dominant-baseline":"middle", "font-family":"-apple-system,sans-serif"});  // 12px＝小字，一定要深版
    t.textContent = DIMS[k].name;
    svgEl.appendChild(t);
  });
}

/* ── 起點 vs 現在：4 大肌肉成長條 + 潛力值（+ 選填的右側欄位，如年收入）── */
function renderGrowthCard(startScores, nowScores, footerRight) {
  var dimRows = DORD.map(function(k) {
    var d = DIMS[k], sv = startScores[k], ev = nowScores[k], diff = ev - sv;
    return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:7px;">'
      + '<div style="width:36px;font-size:11px;color:'+d.color+';">'+d.name+'</div>'
      + '<div style="flex:1;height:4px;background:#ede4da;border-radius:2px;">'
      + '<div style="height:4px;border-radius:2px;background:'+d.color+';width:'+ev+'%;"></div></div>'
      + '<div style="font-size:11px;color:#a08060;width:76px;text-align:right;">'+sv+' → '+ev
      + ' <span style="color:#5DCAA5;font-weight:500;">+'+diff+'</span></div>'
      + '</div>';
  }).join("");
  var potential = calcPotential(nowScores).unlocked;
  var footer = '<div style="display:flex;justify-content:space-between;font-size:12px;">'
    + '<div style="color:#6b4c30;">已解鎖影響力 <span style="color:#e8734a;font-weight:600;">'+potential+'</span> / 1000</div>'
    + (footerRight ? '<div style="color:#6b4c30;">'+footerRight+'</div>' : '')
    + '</div>';
  return '<div style="font-size:12px;color:#a08060;margin-bottom:8px;">起點 vs 現在</div>' + dimRows + '<div class="hdiv"></div>' + footer;
}

/* ── 自評起點 × 練出來的：中性並列，不是「成長」框架（自評只是起點假設）。
   selfScores＝測驗自評 ATPI；trainedScores＝行為證據算出來的能力（calcDims，只吃打卡/練習）。
   2026-08-28 D5A：右邊那欄不再叫「市場」——成交不進分數，市場驗證另外獨立顯示。 */
function renderSelfEvalCompare(selfScores, trainedScores) {
  var rows = DORD.map(function(k) {
    var d = DIMS[k];
    return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:7px;">'
      + '<div style="width:40px;font-size:11px;color:'+d.color+';">'+d.name+'</div>'
      + '<div style="flex:1;height:4px;background:#ede4da;border-radius:2px;">'
      +   '<div style="height:4px;border-radius:2px;background:'+d.color+';width:'+Math.min(100,trainedScores[k])+'%;"></div>'
      + '</div>'
      + '<div style="font-size:11px;color:#a08060;width:104px;text-align:right;">自評 '+selfScores[k]
      +   ' ｜ 練出 <strong style="color:'+d.color+';">'+trainedScores[k]+'</strong></div>'
      + '</div>';
  }).join("");
  return '<div style="font-size:12px;color:#a08060;margin-bottom:4px;">你怎麼看自己 × 你實際練了什麼</div>'
    + '<div style="font-size:11px;color:#a08060;margin-bottom:10px;">自評是你的起點假設，右邊是打卡與練習紀錄長出來的分數（成交不算在裡面，另外看市場驗證）</div>'
    + rows;
}

/* ── 潛力值 × 金額 走勢圖（雙線共用同一座標軸）
      points: [{label, A, T, P, I, income}, ...]，至少要 2 筆才有線可畫
      incomeUnit：金額的單位文字，預設「萬」── */
function renderTrendChart(points, incomeUnit) {
  incomeUnit = incomeUnit || "萬";
  if (!points || points.length < 2) {
    return '<div style="font-size:12px;color:#a08060;margin-bottom:4px;">影響力 × 金額走勢</div>'
      + '<div style="font-size:12px;color:#a08060;padding:24px 0;text-align:center;">還沒有足夠的紀錄，累積 2 筆以上「回報成交」後就會畫出趨勢線</div>';
  }
  var data = points.map(function(p) { return { label:p.label, v:calcPotential(p).unlocked, income:p.income }; });
  var W=300, H=170, pl=34, pr=30, pt=18, pb=38;
  var pw=W-pl-pr, ph=H-pt-pb, n=data.length;
  /* 潛力值（0-1000）和金額量級差很多，共用一軸會把某條線壓在底部——改雙軸各自算 max。
     左軸＝潛力（橘），右軸＝金額（綠）。 */
  function niceMax(arr) { var m = Math.max.apply(null, arr); return Math.ceil((m || 1) / 100) * 100 || 100; }
  var vMax = niceMax(data.map(function(d){ return d.v; }));
  var iMax = niceMax(data.map(function(d){ return d.income; }));
  function xP(i) { return pl + i*(pw/(n-1)); }
  function yV(v) { return pt + ph - (v/vMax)*ph; }
  function yI(inc) { return pt + ph - (inc/iMax)*ph; }
  var gridLines = "";
  [0,0.25,0.5,0.75,1].forEach(function(f) {
    var y = pt + ph*(1-f);
    gridLines += '<line x1="'+pl+'" y1="'+y+'" x2="'+(W-pr)+'" y2="'+y+'" stroke="rgba(168,128,96,0.12)" stroke-width="0.5"/>';
  });
  var axisLabels =
    '<text x="'+(pl-4)+'" y="'+(pt)+'" text-anchor="end" font-size="8" fill="#e8734a">'+vMax+'</text>'
   +'<text x="'+(pl-4)+'" y="'+(pt+ph/2)+'" text-anchor="end" font-size="8" fill="#e8734a">'+(vMax/2)+'</text>'
   +'<text x="'+(pl-4)+'" y="'+(pt+ph)+'" text-anchor="end" font-size="8" fill="#e8734a">0</text>'
   +'<text x="'+(W-pr+4)+'" y="'+(pt)+'" text-anchor="start" font-size="8" fill="#5DCAA5">'+iMax+'</text>'
   +'<text x="'+(W-pr+4)+'" y="'+(pt+ph/2)+'" text-anchor="start" font-size="8" fill="#5DCAA5">'+(iMax/2)+'</text>'
   +'<text x="'+(W-pr+4)+'" y="'+(pt+ph)+'" text-anchor="start" font-size="8" fill="#5DCAA5">0</text>';
  var vPts = data.map(function(d,i) { return xP(i)+","+yV(d.v); }).join(" ");
  var iPts = data.map(function(d,i) { return xP(i)+","+yI(d.income); }).join(" ");
  var vArea = "M"+xP(0)+","+yV(data[0].v)+" "+data.map(function(d,i){return "L"+xP(i)+","+yV(d.v);}).join(" ")+" L"+xP(n-1)+","+(pt+ph)+" L"+xP(0)+","+(pt+ph)+" Z";
  var iArea = "M"+xP(0)+","+yI(data[0].income)+" "+data.map(function(d,i){return "L"+xP(i)+","+yI(d.income);}).join(" ")+" L"+xP(n-1)+","+(pt+ph)+" L"+xP(0)+","+(pt+ph)+" Z";
  var dots = "";
  data.forEach(function(d, i) {
    var x=xP(i), yv=yV(d.v), yi=yI(d.income);
    dots += '<circle cx="'+x+'" cy="'+yv+'" r="3.5" fill="#e8734a" stroke="#fff" stroke-width="1.5"/>';
    dots += '<circle cx="'+x+'" cy="'+yi+'" r="3.5" fill="#5DCAA5" stroke="#fff" stroke-width="1.5"/>';
    dots += '<text x="'+x+'" y="'+(H-pb+14)+'" text-anchor="middle" font-size="8.5" fill="#a08060">'+d.label+'</text>';
    dots += '<text x="'+x+'" y="'+(yv-7)+'" text-anchor="middle" font-size="8" fill="#e8734a">'+d.v+'</text>';
    if (d.income > 0) dots += '<text x="'+x+'" y="'+(yi-7)+'" text-anchor="middle" font-size="8" fill="#5DCAA5">'+d.income+incomeUnit+'</text>';
  });
  var svg = '<svg viewBox="0 0 '+W+' '+H+'" width="100%" xmlns="http://www.w3.org/2000/svg">'
   +'<defs>'
   +'<linearGradient id="gV" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#e8734a" stop-opacity="0.2"/><stop offset="100%" stop-color="#e8734a" stop-opacity="0"/></linearGradient>'
   +'<linearGradient id="gI" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#5DCAA5" stop-opacity="0.15"/><stop offset="100%" stop-color="#5DCAA5" stop-opacity="0"/></linearGradient>'
   +'</defs>'+gridLines+axisLabels
   +'<path d="'+vArea+'" fill="url(#gV)"/>'
   +'<path d="'+iArea+'" fill="url(#gI)"/>'
   +'<polyline points="'+vPts+'" fill="none" stroke="#e8734a" stroke-width="2" stroke-linejoin="round"/>'
   +'<polyline points="'+iPts+'" fill="none" stroke="#5DCAA5" stroke-width="2" stroke-linejoin="round" stroke-dasharray="5,3"/>'
   +dots+'</svg>';
  var legend =
    '<div style="display:flex;gap:14px;margin-bottom:8px;">'
   +'<div style="display:flex;align-items:center;gap:5px;font-size:11px;color:#6b4c30;"><div style="width:14px;height:2px;background:#e8734a;border-radius:1px;"></div>已解鎖影響力</div>'
   +'<div style="display:flex;align-items:center;gap:5px;font-size:11px;color:#6b4c30;"><div style="width:14px;height:2px;background:#5DCAA5;border-radius:1px;"></div>金額（'+incomeUnit+'）</div>'
   +'</div>';
  return '<div style="font-size:12px;color:#a08060;margin-bottom:4px;">影響力 × 金額走勢</div>' + legend + svg;
}

/* ═══════════════════════════════════════════════════════════
   榮譽系統（跨專案共用目錄）
   榮譽是「人」的屬性、跟著人走、跨 workshop 共用一份牆。
   這裡只放「純目錄 HONORS + 通用評估器」；各專案用自己的資料組出
   正規化 ctx 再傳進來（跟 drawRadarSVG 一樣：共用邏輯、各自餵資料）。
   ctx 形狀：{scores:{A,T,P,I}, potential, revenueTotal, dealCount,
             checkinCount, investPct:{A,T,P,I}, dimsCovered,
             workshopsActive, streak, bestWeekDays}
   本專案 consult-workshop 餵得齊全部；comconverttest 只餵得出分數/潛力類，
   投入/成交類自然點不亮（顯示未解鎖）。
   ═══════════════════════════════════════════════════════════ */

/* 4 大肌肉分級徽章的階梯：門檻綁「投入%」，各維 k 不同也公平（跟計分同一把尺）。 */
var HONOR_TIERS = [
  {tier:"bronze",  label:"銅", pct:30, icon:"🥉"},
  {tier:"silver",  label:"銀", pct:50, icon:"🥈"},
  {tier:"gold",    label:"金", pct:70, icon:"🥇"},
  {tier:"diamond", label:"鑽", pct:85, icon:"💎"}
];

/* 🔥 努力堅持（來自打卡，人人可得） */
var HONORS_EFFORT = [
  {id:"streak7",   cat:"effort", icon:"🔥", name:"連七",     desc:"連續打卡 7 天",    metric:"streak",          value:7},
  {id:"streak30",  cat:"effort", icon:"🔥", name:"連三十",   desc:"連續打卡 30 天",   metric:"streak",          value:30,  celebrate:true},
  {id:"streak100", cat:"effort", icon:"🏔️", name:"連百",     desc:"連續打卡 100 天",  metric:"streak",          value:100, celebrate:true},
  {id:"allweek",   cat:"effort", icon:"📅", name:"全勤週",   desc:"一週天天都打卡",   metric:"bestWeekDays",    value:7,   celebrate:true},
  {id:"balanced",  cat:"effort", icon:"🌈", name:"4 大肌肉並進", desc:"4 大肌肉都有投入不偏科", metric:"dimsCovered",   value:4},
  {id:"crossws",   cat:"effort", icon:"🎓", name:"跨界學員", desc:"在 2 門以上課都打卡", metric:"workshopsActive", value:2, celebrate:true},
  {id:"check100",  cat:"effort", icon:"💯", name:"百次打卡", desc:"累積打卡 100 次",  metric:"checkinCount",    value:100},
  {id:"check500",  cat:"effort", icon:"🏅", name:"五百次打卡", desc:"累積打卡 500 次", metric:"checkinCount",    value:500, celebrate:true}
];

/* 💎 變現里程碑（來自成交，稀有・會發光）。門檻對齊計分常數 TARGET_AMOUNT/TARGET_COUNT/潛力畢業錨點。 */
var HONORS_REVENUE = [
  {id:"firstdeal", cat:"revenue", tier:"rare",   icon:"🎉", name:"開張大吉",     desc:"回報第一筆成交",         metric:"dealCount",    value:1,       celebrate:true},
  {id:"rev1w",     cat:"revenue", tier:"rare",   icon:"💰", name:"破萬",         desc:"累計成交突破 1 萬",      metric:"revenueTotal", value:10000},
  {id:"rev10w",    cat:"revenue", tier:"rare",   icon:"💰", name:"破十萬",       desc:"累計成交突破 10 萬",     metric:"revenueTotal", value:100000,  celebrate:true},
  {id:"rev100w",   cat:"revenue", tier:"legend", icon:"💰", name:"破百萬",       desc:"累計成交突破 100 萬",    metric:"revenueTotal", value:1000000, celebrate:true},
  {id:"club300",   cat:"revenue", tier:"legend", icon:"👑", name:"三百萬俱樂部", desc:"累計成交達畢業錨點 300 萬", metric:"revenueTotal", value:3000000, celebrate:true},
  {id:"deal3",     cat:"revenue", tier:"rare",   icon:"✍️", name:"穩定簽單",     desc:"累計簽下 3 單",          metric:"dealCount",    value:3},
  {id:"deal5",     cat:"revenue", tier:"rare",   icon:"✍️", name:"簽單達人",     desc:"累計簽下 5 單",          metric:"dealCount",    value:5,       celebrate:true},
  {id:"pot300",    cat:"revenue", tier:"rare",   icon:"⭐", name:"潛力覺醒",     desc:"變現潛力突破 300",       metric:"potential",    value:300,     celebrate:true},
  {id:"pot600",    cat:"revenue", tier:"legend", icon:"🌟", name:"潛力大師",     desc:"變現潛力突破 600",       metric:"potential",    value:600,     celebrate:true},
  {id:"sweetmaster", cat:"revenue", tier:"legend", icon:"🗝️", name:"甜蜜點大師", desc:"最強兩維都破 60 且反覆成交，走通你的變現路徑",
     test:function(ctx){
       var s = ctx.scores;
       var sorted = DORD.slice().sort(function(a,b){ return s[b] - s[a]; });
       return s[sorted[0]] >= 60 && s[sorted[1]] >= 60 && ctx.dealCount >= 3;
     }, celebrate:true}
];

/* 🏅 4 大肌肉分級徽章：DORD × 四階自動展開（名稱由呼叫端用自己的維度名合成）。 */
var HONORS_DIM = [];
DORD.forEach(function(k) {
  HONOR_TIERS.forEach(function(t) {
    HONORS_DIM.push({
      id:"dim_"+k+"_"+t.tier, cat:"dim", dim:k, tier:t.tier, tierLabel:t.label,
      icon:t.icon, metric:"investPct."+k, value:t.pct,
      celebrate:(t.tier === "gold" || t.tier === "diamond")
    });
  });
});

/* 完整目錄（各專案可再 concat 自己 workshop 的專屬榮譽——Phase 2）。 */
var HONORS = HONORS_DIM.concat(HONORS_EFFORT, HONORS_REVENUE);

/* 稱號：由已解鎖成就合成，優先序 變現 > 分級 > 堅持。頂在成就頁橫幅。 */
var HONOR_TITLES = [
  {id:"club300",   title:"三百萬變現家"},
  {id:"rev100w",   title:"百萬實戰家"},
  {id:"pot600",    title:"潛力大師"},
  {id:"sweetmaster", title:"甜蜜點大師"},
  {id:"deal5",     title:"簽單達人"},
  {id:"rev10w",    title:"十萬俱樂部"},
  {id:"pot300",    title:"潛力覺醒者"},
  {id:"firstdeal", title:"開張新星"},
  {id:"streak100", title:"鐵人顧問"},
  {id:"streak30",  title:"堅持者"},
  {id:"balanced",  title:"均衡型選手"}
];

/* 取 ctx 裡的指標值（支援 "investPct.A" 這種點路徑）。 */
function honorMetricVal(ctx, metric) {
  if (!metric) return undefined;
  var parts = metric.split("."), v = ctx;
  for (var i = 0; i < parts.length; i++) { if (v == null) return undefined; v = v[parts[i]]; }
  return v;
}
/* 單一榮譽是否解鎖：有 test 用 test，否則 ctx[metric] >= value。 */
function honorMet(h, ctx) {
  if (typeof h.test === "function") return !!h.test(ctx);
  var v = honorMetricVal(ctx, h.metric);
  return typeof v === "number" && v >= h.value;
}
/* 回傳已解鎖的榮譽 id 陣列（依 HONORS 順序）。 */
function evalHonors(ctx) {
  return HONORS.filter(function(h){ return honorMet(h, ctx); }).map(function(h){ return h.id; });
}
/* 依已解鎖清單選出顯示稱號（優先序見 HONOR_TITLES），沒有就給預設。 */
function pickTitle(earnedIds) {
  for (var i = 0; i < HONOR_TITLES.length; i++) {
    if (earnedIds.indexOf(HONOR_TITLES[i].id) > -1) return HONOR_TITLES[i].title;
  }
  return "見習學員";
}
/* 依 id 取回完整榮譽定義（慶祝彈窗用）。 */
function honorById(id) {
  for (var i = 0; i < HONORS.length; i++) { if (HONORS[i].id === id) return HONORS[i]; }
  return null;
}
