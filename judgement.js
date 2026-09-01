/* ═══════════════════════════════════════════════════════════
   判讀規則表 v1 —— 分析師解盤的「標準判讀」層
   ───────────────────────────────────────────────────────────
   productkit 27§8.7 把解盤拆三層：
     層 1 讀數據    ：念出 12 小肌群分數、指出最低三塊     → 分析師（2 小時就會）
     層 2 標準判讀  ：最低那塊 → 典型症狀 → 標準功課       → 分析師（照表做，可訓練）
     層 3 客製 debug：你的情境為什麼卡、哪句話要改          → 顧問（需經驗，不在這張表）
   「陪伴不輔導」的操作定義＝**只做 1 和 2，不做 3。不是不准講話，是不准即興。**

   ⚠️ 本檔是 v1，內容由《01-核心定義字典》ATPI 條的週測問法 ＋《22-技巧對小肌群
      對應與練習庫》推導。productkit 的正式判讀規則表寫好後，以那份為準、這裡跟改。
      它同時是三樣東西：分析師訓練教材 ／ 品質下限保證 ／ 8800 內容骨架。
   🔄 2026-08-30 ATPI 重構同步：T 整組換內容（T1＝講出心裡 OS＝我先給／T2＝提問式聆聽・預看＝他才給／
      T3＝承諾兌現）、P2/P3 交換（視覺化 Demo 移 P2、P3 改他證三件組）、真誠收單→真誠邀請、
      牛肉庫 A3→A2、7-11-4 退場。格名已定案（2026-08-31「讓他XX」），此表仍以格碼＋症狀敘述為主、不硬綁格名。

   每塊小肌群四個欄位：
     symptom  典型症狀——分數低的人「在現實裡長什麼樣」，用來對答案（不是宣判）
     homework 標準功課——照 22 檔練習庫，直接可派成動作
     opener   標準話術——開場問句。刻意設計溫度：問經驗、不問缺點
     evidence 追問——請他舉具體事例（對齊字典「不憑感覺」的評分標準）
   ═══════════════════════════════════════════════════════════ */

var JUDGEMENT = {
  A1: {
    symptom: "進到陌生場合會等別人先開口；換完名片就沒有下一句。",
    homework: "每天對一個人講一句**具體**的真誠稱讚——講你真的注意到的事，不是客套。",
    opener: "你在陌生場合，通常是等別人先開口，還是你先？",
    evidence: "最近一次你主動跟不認識的人開口，是什麼場合？"
  },
  A2: {
    symptom: "自我介紹講完職稱就沒了，對方點頭說「喔不錯」，然後沒有下文。",
    homework: "向 1 個真人端一塊牛肉（端**結果**不端過程），看對方有沒有追問。",
    opener: "上一次有人聽完你在做什麼、主動追問你，是什麼時候？",
    evidence: "他當時追問了什麼？"
  },
  A3: {
    symptom: "見過面的人記不住你是誰、做什麼的；需要重新自我介紹第二次。",
    homework: "打造個人故事庫；練一個低→轉→高的英雄之旅故事，講給 3 個人聽。",
    opener: "如果對方要跟別人介紹你，他會怎麼說？",
    evidence: "有沒有人轉述過你講的哪一段？"
  },
  T1: {  /* 讓他敢說＝講出心裡 OS（我先給） */
    symptom: "對話都停在客氣，你不先掏心，對方也不會跟你講真話。",
    homework: "先講出自己心裡沒說的那句（還在怕的、還沒成的）：「我有點＿，但我想跟你說。」講完停住等他接。",
    opener: "上次你先跟人講了一句真心話、對方也跟著掏出他的，是什麼時候？",
    evidence: "你講了什麼？他接了什麼？"
  },
  T2: {  /* 讓他交心＝提問式聆聽・邀請講OS／預看（他才給） */
    symptom: "對話裡大部分是你在講；或對方一講問題你就急著給建議，他不會多講。",
    homework: "連續 3 次用「為什麼你＿呢？」接他上一句、不插自己意見；引不出真話就用預看猜那句他難說出口的。",
    opener: "最近一次有人跟你說「你怎麼知道」，是什麼時候？",
    evidence: "當時你問了什麼讓他願意多講？"
  },
  T3: {  /* 讓他當真＝承諾兌現（我兌現，7-11-4 已退場） */
    symptom: "答應的事會拖或忘記；別人不太把新的事交給你。",
    homework: "把這個月答應的事列出來、做到打勾；做不到的先開口。",
    opener: "這個月你答應別人的事，有幾件真的做完了？",
    evidence: "有沒有人因為你「說到做到」而找你第二次？"
  },
  P1: {
    symptom: "客戶說要什麼你就給什麼，成交後才發現不是他真正要的。",
    homework: "Whyyyy 挖核心；Whooo 找利害關係人；畫一次 A→B 歷程。",
    opener: "你上一次成交前，知道他真正在意的是什麼嗎？",
    evidence: "他自己講出來的，還是你問出來的？"
  },
  P2: {  /* 讓他有感＝大絕招 3 步・視覺化 Demo（自證·我作證） */
    symptom: "講完專業對方說「聽起來不錯」，但沒有下一步、沒有動手。",
    homework: "找出你的大絕招，用 3 步跑一次（創造對比→帶入情境→收 0–10 分回饋）；或把服務畫成 3–4 步視覺化 Demo 當面畫一次。",
    opener: "有沒有一個東西，你一做出來對方就秒懂你很懂？",
    evidence: "上次做給誰看過？他的反應是什麼？"
  },
  P3: {  /* 讓他放心＝他證三件組（別人作證） */
    symptom: "只能靠自己講，拿不出別人替你證明的東西；對方半信半疑。",
    homework: "整理 3 條可引用的他證：見證／成效數據／第三方背書（從《見證庫-共筆》挑、有截圖才給數字、不自己編）。",
    opener: "有沒有客戶或第三方，替你講過話？",
    evidence: "那則見證／數字，你手上有截圖嗎？"
  },
  I1: {
    symptom: "介紹產品都在講規格、內容、時數。",
    homework: "把方案改講成「對方要的結果」，寫一句話版本。",
    opener: "客戶買完之後，他的生活哪裡不一樣？",
    evidence: "有客戶自己講過這個差別嗎？"
  },
  I2: {
    symptom: "不知道對方到底想不想買，等對方自己說。",
    homework: "練讀水溫；做一次測試成交（問了才知道，不用猜）。",
    opener: "你怎麼知道他準備好了？",
    evidence: "上次你問了嗎？他怎麼說？"
  },
  I3: {  /* 讓他答應＝真誠邀請・被動跟進（留心已併入被動跟進） */
    symptom: "聊得很好但沒有邀約，回去就沒下文。",
    homework: "設計你的真誠邀請句（先講風險→給退路→邀請）；被拒就把門留著、用被動跟進給個 5 分鐘小任務讓他回來。",
    opener: "上次聊得很好的那個人，後來呢？",
    evidence: "當時有拿到「對方同意的具體推進」嗎（下次時間／他要準備的／他答應去找誰）？"
  }
};

/* 兩種處置——由 readWeakest() 的 verdict 決定（低分＋沒練 vs 低分＋練很多）。
   ⚠️ plateau 是**升單訊號**，不是分析師自己下場 debug：
      分析師只做到「指出來、記錄下來、交給顧問」，層 3 不是他的工作。 */
var VERDICT = {
  untrained: {
    label: "還沒開始練",
    tone: "neutral",
    lead: "這塊分數低，但這個月幾乎沒練——先派功課，不用急著找原因。",
    action: "派標準功課，下個月再量一次。",
    next: "assign"
  },
  plateau: {
    label: "練了沒進步",
    tone: "signal",
    lead: "練得夠多了，分數卻沒動——**問題不在勤勞，在姿勢**。",
    action: "這一塊已超出標準判讀範圍：記錄下來、轉給顧問做客製 debug。",
    next: "escalate"
  }
};

/* 解盤逐字腳本（層 1 → 層 2），給還不熟的分析師照著念。
   rows＝readWeakest() 的輸出；scores＝calcMuscleScores()。 */
function buildScript(name, scores, rows) {
  var lines = [];
  lines.push("① 讀數據");
  lines.push("「" + name + "，我們先看你這次的體格。12 塊裡面最低的是這三塊——" +
    rows.map(function(r){ return MUSCLES[r.muscle].name + " " + fmtScore(r.score); }).join("、") + "。」");
  lines.push("");
  lines.push("② 標準判讀");
  rows.forEach(function(r, i) {
    var j = JUDGEMENT[r.muscle], v = VERDICT[r.verdict];
    lines.push((i + 1) + ". " + r.muscle + " " + MUSCLES[r.muscle].name + "（" + v.label + "・這個月練了 " + r.count + " 次）");
    lines.push("　開場：「" + j.opener + "」");
    lines.push("　追問：「" + j.evidence + "」");
    lines.push("　對答案：" + j.symptom);
    lines.push(r.verdict === "plateau"
      ? "　⚠️ 練了沒進步 → 不要自己 debug，記錄下來轉顧問。"
      : "　功課：" + j.homework.replace(/\*\*/g, ""));
    lines.push("");
  });
  lines.push("③ 客製 debug ＝ 顧問的工作，不在這場。");
  return lines.join("\n");
}

function fmtScore(v) {
  return (typeof v === "number" && !isNaN(v)) ? (Math.round(v * 10) / 10).toFixed(1) : "未量";
}

/* ═══════════════════════════════════════════════════════════
   內建動作庫（fallback）
   任務分頁的 `muscle` 欄還沒填時，會員模式仍要有東西可以練——
   否則「今天這組」會是空的、整個迴路卡住。這裡用 22 檔練習庫直接生成 12 個動作。
   ⚠️ 一旦 Sheet 的任務有對應 muscle，**以 Sheet 為準**（pickTodaySet 會優先用它），
      這裡只是地板，不是天花板。
   ═══════════════════════════════════════════════════════════ */
var FALLBACK_ICON = {
  A1:"👋", A2:"🥩", A3:"📖", T1:"👂", T2:"💭", T3:"🤝",
  P1:"🔍", P2:"✨", P3:"🗺️", I1:"🎯", I2:"🌡️", I3:"🚀"
};
function fallbackMove(mk) {
  var m = MUSCLES[mk], j = JUDGEMENT[mk] || {};
  return {
    workshopId: "", key: "m_" + mk.toLowerCase(), cadence: "daily",
    dim: m.dim, muscle: mk, pts: 1,
    name: m.tech, icon: FALLBACK_ICON[mk] || "💪",
    desc: (j.homework || "").replace(/\*\*/g, ""),
    _fallback: true
  };
}
/* 今天這組＝最弱三塊各派一個動作。
   還沒量過體格（weakestThree 為空）時退回「A1→A2→A3」當新手起手式，不留空畫面。 */
function pickTodaySet(s, workshopId) {
  var weak = weakestThree(s);
  if (!weak.length) weak = ["A1", "A2", "A3"];
  return weak.map(function(mk) {
    var t = (typeof TASKS !== "undefined" ? TASKS : []).find(function(x) {
      return x.cadence === "daily" && taskMuscles_(x.muscle).indexOf(mk) > -1
          && (!workshopId || x.workshopId === workshopId);
    });
    return { muscle: mk, task: t || fallbackMove(mk) };
  });
}
