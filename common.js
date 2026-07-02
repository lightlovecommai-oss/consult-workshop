var LIFF_ID = "2010316474-UovQ1zhe";
var SHEET_API = "https://script.google.com/macros/s/AKfycbwEwlg4cFa7B_e76ULJM26C2B9fgjwjFTXPFb_yRMWt1wZs33iTGnEI1LZ9v8uZHvdz/exec";

/* ── 四維度定義 ── */
/* k＝投入飽和曲線的「半滿點」：該維累積到 k 分時投入%＝50%（見 calcDims）。
   不是硬性滿分——投入% 永遠逼近 100 不爆表，所以可跨多 workshop 無限加總、加 workshop 免校準。
   k 是軟旋鈕（大概「累積多少分算投入到位一半」），待真實數據微調，抓錯只影響曲線胖瘦不會頂死。 */
var DIMS = {
  A: {name:"吸引力", desc:"別人主動想靠近你",     color:"#e8734a", key:"social",   k:9,  inner:"批判心少・容易欣賞別人"},
  T: {name:"信任力", desc:"別人願意跟你說秘密",   color:"#5DCAA5", key:"team",     k:6,  inner:"真誠・心口合一"},
  P: {name:"專業力", desc:"別人理解並買你的服務", color:"#378ADD", key:"homework", k:10, inner:"不斷精進・有上進心・當責"},
  I: {name:"推進力", desc:"別人聽你的話採取行動", color:"#c8a84b", key:"attend",   k:4,  inner:"自己先願意配合・臣服"}
};
/* DORD、calcPotential、COMBO_PATH 已搬到共用檔 atpi-core.js（此檔案的 HTML 需先引入它） */

/* ── 計分校準常數（要調就改這裡，等真實數據累積後再校準）──
   核心哲學：能力由「市場」驗證，不是做多少功課就算數。
   每維能力 = 投入% × 驗證係數；驗證係數 = 保底 + (1-保底) ×（金額達成 × 簽單數達成）。 */
var TARGET_AMOUNT = 3000000; // 目標累計成交金額（元）＝ 300 萬（驗證係數的金額分母）
var TARGET_COUNT  = 5;       // 目標累計簽單數（防一張大單灌水，要反覆簽得下來）
var VALID_FLOOR   = 0.5;     // 保底驗證係數：完全沒成交時，投入至少兌現一半

/* ── 等級定義 ── */
var LEVELS = [
  {min:0,  title:"見習顧問", beat:20, next:"累積到 10 分，解鎖「顧問」稱號"},
  {min:10, title:"顧問",     beat:45, next:"累積到 18 分，解鎖「資深顧問」稱號"},
  {min:18, title:"資深顧問", beat:68, next:"累積到 24 分，解鎖「變現顧問」稱號"},
  {min:24, title:"變現顧問", beat:88, next:"累積到 29 分，解鎖「顧問大師」稱號"},
  {min:29, title:"顧問大師", beat:97, next:"你已站上頂端，現在聚焦長期合作與規模化"}
];

/* ── 徽章定義 ── */
var BADGES = [
  {key:"attend",   icon:"📅", name:"出席徽章", desc:"準時出席"},
  {key:"social",   icon:"📣", name:"分享徽章", desc:"社群分享"},
  {key:"homework", icon:"✍️", name:"作業徽章", desc:"逐字稿繳交"},
  {key:"team",     icon:"🏆", name:"團隊徽章", desc:"團隊賽得分"}
];

/* ── 專案任務（一次性，來自 Google Sheet 累積分數，其中 SPECIAL_DEFS 需導師審核）── */
var TASK_DEFS = [
  {key:"attend1", cat:"attend",  pts:2, name:"第 1 場準時出席",    icon:"📅", bg:"#fff8f4"},
  {key:"attend2", cat:"attend",  pts:2, name:"第 2 場準時出席",    icon:"📅", bg:"#fff8f4"},
  {key:"social1", cat:"social",  pts:3, name:"社群分享：自己故事", icon:"📣", bg:"#fff4f0"},
  {key:"social2", cat:"social",  pts:3, name:"社群分享：導師故事", icon:"📖", bg:"#fff4f0"},
  {key:"social3", cat:"social",  pts:3, name:"社群分享：培訓心得", icon:"✨", bg:"#fff4f0"}
];

var SPECIAL_DEFS = [
  {key:"hw1",   cat:"homework", pts:5, name:"作業：開場逐字稿", icon:"✍️", bg:"#fff8f4", desc:"繳交後導師批改，加分後通知"},
  {key:"hw2",   cat:"homework", pts:5, name:"作業：收單逐字稿", icon:"📝", bg:"#fff8f4", desc:"繳交後導師批改，加分後通知"},
  {key:"team1", cat:"team",     pts:6, name:"團隊賽得分",       icon:"⚔️", bg:"#fff4ec", desc:"兩兩互練 Role Play・導師計分"}
];

/* ── 每日任務池（固定 10 項，每天最多算 3 項，可重複勾選）── */
var DAILY_POOL = {
  cap: 3,
  caption: "每天最多算 3 項，多做也不加分，但明天可以重新選",
  tasks: [
    {key:"d1",  cat:"social",   pts:1, name:"發一則社群貼文",         icon:"📣"},
    {key:"d2",  cat:"social",   pts:1, name:"留言互動 3 位夥伴的貼文", icon:"💬"},
    {key:"d3",  cat:"team",     pts:1, name:"主動關心一位夥伴的近況", icon:"🤝"},
    {key:"d4",  cat:"team",     pts:1, name:"在群組裡真誠回應一則訊息", icon:"💛"},
    {key:"d5",  cat:"homework", pts:1, name:"寫 100 字今日反思",      icon:"📝"},
    {key:"d6",  cat:"homework", pts:1, name:"練習一次開場白或提案台詞", icon:"🎤"},
    {key:"d7",  cat:"homework", pts:1, name:"覆盤一件今天做得好的事", icon:"🔍"},
    {key:"d8",  cat:"attend",   pts:1, name:"準時開始今天的行動",     icon:"⏰"},
    {key:"d9",  cat:"attend",   pts:1, name:"完成今天排定的一件任務", icon:"✅"},
    {key:"d10", cat:"social",   pts:1, name:"分享一則有價值的觀點",   icon:"✨"}
  ]
};

/* ── 每週任務池（固定 5 項，每週最多算 2 項）── */
var WEEKLY_POOL = {
  cap: 2,
  caption: "每週最多算 2 項，下週重新開放",
  tasks: [
    {key:"w1", cat:"attend",   pts:2, name:"出席本週固定會議／直播",   icon:"📅"},
    {key:"w2", cat:"homework", pts:2, name:"交一份週報／進度整理",     icon:"📋"},
    {key:"w3", cat:"team",     pts:2, name:"跟夥伴進行一次共學或角色扮演", icon:"🎭"},
    {key:"w4", cat:"social",   pts:2, name:"開發一位新名單／新連結",   icon:"🌱"},
    {key:"w5", cat:"team",     pts:2, name:"幫夥伴做一次回饋或複盤",   icon:"🪞"}
  ]
};

/* ── 日期／週次小工具 ── */
function todayStr() {
  var d = new Date();
  return d.getFullYear() + "-" + ("0"+(d.getMonth()+1)).slice(-2) + "-" + ("0"+d.getDate()).slice(-2);
}
/* Sheet 讀回的日期可能是 Date 物件字串，統一normalize成本地 YYYY-MM-DD，才能跟 todayStr 比對 */
function normDate(v) {
  var d = new Date(v);
  if (isNaN(d.getTime())) return String(v).slice(0, 10);
  return d.getFullYear() + "-" + ("0"+(d.getMonth()+1)).slice(-2) + "-" + ("0"+d.getDate()).slice(-2);
}
function weekStr(d) {
  d = d || new Date();
  var t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  var day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  var yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  var weekNo = Math.ceil((((t - yearStart) / 86400000) + 1) / 7);
  return t.getUTCFullYear() + "-W" + weekNo;
}

/* ── 每日/每週：今天/本週已完成的任務 key 清單 ── */
function dailyDoneToday(s) {
  var today = todayStr();
  return s.dailyLog.filter(function(e) { return e.date === today; }).map(function(e) { return e.taskId; });
}
function weeklyDoneThisWeek(s) {
  var wk = weekStr();
  return s.weeklyLog.filter(function(e) { return e.week === wk; }).map(function(e) { return e.taskId; });
}

/* ── 計算函式 ── */
function catSum(s, cat) {
  var wantDim = DORD.find(function(k) { return DIMS[k].key === cat; });
  var sum = 0;
  TASK_DEFS.concat(SPECIAL_DEFS).forEach(function(t) {
    if (t.cat === cat && s.tasks[t.key]) sum += t.pts;
  });
  /* 每日／每週：優先用打卡紀錄裡存的 dim/pts（跨 workshop 安全，不必回查本專案任務池——
     別的 workshop 的任務 key 不在這裡也算得到）；舊資料或樂觀更新沒帶 dim/pts 時，退回用 taskId 查任務池。 */
  s.dailyLog.concat(s.weeklyLog).forEach(function(e) {
    if (e.dim && e.pts != null) {
      if (e.dim === wantDim) sum += e.pts;
    } else {
      var t = DAILY_POOL.tasks.concat(WEEKLY_POOL.tasks).find(function(x) { return x.key === e.taskId; });
      if (t && t.cat === cat) sum += t.pts;
    }
  });
  return sum;
}

function initTasks(raw) {
  var tasks = {};
  var allDefs = TASK_DEFS.concat(SPECIAL_DEFS);
  ["attend","social","homework","team"].forEach(function(cat) {
    var remain = cat === "team" ? (raw.team_score || 0) : raw[cat];
    allDefs.filter(function(t) { return t.cat === cat; }).forEach(function(t) {
      if (remain >= t.pts) { tasks[t.key] = true; remain -= t.pts; }
      else { tasks[t.key] = false; }
    });
  });
  return tasks;
}

function totalScore(s) {
  return catSum(s,"attend") + catSum(s,"social") + catSum(s,"homework") + catSum(s,"team");
}

function levelFor(total) {
  var lv = LEVELS[0];
  LEVELS.forEach(function(l) { if (total >= l.min) lv = l; });
  return lv;
}

/* 目前等級 + 到下一級的進度。totalScore 現在含每日／每週打卡、會無限累積，
   所以血條不能再用固定 /29——改成「本級區間內的進度」，pct 永遠 0~100 不爆表。
   封頂（最高級）時 capped=true、pct=100，nextMin=null。 */
function levelProgress(total) {
  var idx = 0;
  LEVELS.forEach(function(l, i) { if (total >= l.min) idx = i; });
  var lv = LEVELS[idx], next = LEVELS[idx + 1] || null;
  if (!next) return { lv: lv, nextMin: null, capped: true, pct: 100 };
  var pct = Math.round((total - lv.min) / (next.min - lv.min) * 100);
  return { lv: lv, nextMin: next.min, capped: false, pct: Math.max(0, Math.min(100, pct)) };
}

/* 導師計分（專案＋特殊任務，來自 Google Sheet，每位學員都有）。
   排行榜／排名只能用這個才公平——每日／每週打卡目前只讀得到當前學員自己的，
   別人的 dailyLog／weeklyLog 是空的，拿 totalScore 跨人比較會讓當前學員灌水。 */
function baseScore(s, workshopId) {
  return TASK_DEFS.concat(SPECIAL_DEFS).reduce(function(sum, t) {
    if (workshopId && t.workshop && t.workshop !== workshopId) return sum;  // 各 workshop 各一張榜；任務尚未帶 workshop 前為 no-op
    return sum + (s.tasks[t.key] ? t.pts : 0);
  }, 0);
}

/* 市場驗證係數：0~1 之間。沒成交時＝保底值，隨累計金額與簽單數往 1.0 靠。
   金額與簽單數兩個達成度「相乘」——一張大單（金額到但單數少）不會 full 兌現，
   逼學員反覆簽得下來才算真本事，順帶擋掉靠一張運氣單灌水。 */
function validationFactor(s) {
  var amtAchieve = Math.min(1, revenueTotal(s) / TARGET_AMOUNT);
  var cntAchieve = Math.min(1, s.revenueLog.length / TARGET_COUNT);
  return VALID_FLOOR + (1 - VALID_FLOOR) * (amtAchieve * cntAchieve);
}

/* 每維「市場驗證能力」＝ 投入%（飽和曲線）× 市場驗證係數。
   投入% = 100 × 累積分 /(累積分 + k)：累積到 k 分＝50%、3k＝75%，永遠逼近 100 不爆表——
   所以跨多 workshop 無限加總也不會頂死，加 workshop 免重新校準（見專案記憶 multi-workshop-architecture）。
   做很多功課但沒變現，能力仍會被驗證係數壓在天花板下——這是刻意的設計，不是 bug。 */
function calcDims(s) {
  var factor = validationFactor(s);
  var sc = {};
  DORD.forEach(function(k) {
    var invest = catSum(s, DIMS[k].key);                    // 該維累積投入分（跨所有來源／workshop 加總）
    var effortPct = 100 * invest / (invest + DIMS[k].k);
    sc[k] = Math.round(effortPct * factor);
  });
  return sc;
}

/* ── 回報成交（金額 + 當下的四維分數快照，用來畫「潛力值 × 金額」走勢圖）──
   樂觀更新記憶體，同時寫進 Sheet「成交紀錄」分頁。 */
function addRevenue(s, amount, note) {
  var scores = calcDims(s);
  s.revenueLog.push({
    date: todayStr(),
    amount: amount,
    note: note || "",
    A: scores.A, T: scores.T, P: scores.P, I: scores.I
  });
  postRevenue(s.lineId, amount, note, scores);
}
function revenueTotal(s) {
  return s.revenueLog.reduce(function(sum, e) { return sum + e.amount; }, 0);
}
/* 走勢圖的金額換算成「萬」再畫（回報時存的是「元」），跟 showcase 的示範資料同單位。 */
function revenueTrendPoints(s) {
  return s.revenueLog.map(function(e) { return {label:e.date, A:e.A, T:e.T, P:e.P, I:e.I, income: Math.round(e.amount/1000)/10}; });
}

/* ── 寫入 Google Sheet（打卡／成交）──
   用 text/plain 避開 CORS 預檢；採樂觀更新，送出後不強依賴回應，
   下次載入時以 Sheet 為準。 */
function postToSheet(payload) {
  return fetch(SHEET_API, {
    method: "POST",
    headers: {"Content-Type": "text/plain;charset=utf-8"},
    body: JSON.stringify(payload)
  }).catch(function(e) { console.log("postToSheet error:", e); });
}

function postCheckin(lineId, task, taskType, dateStr) {
  var dim = DORD.find(function(k) { return DIMS[k].key === task.cat; }) || "";
  return postToSheet({
    action: "checkin",
    lineId: lineId, taskKey: task.key, taskType: taskType,
    dim: dim, pts: task.pts, date: dateStr
  });
}

function postRevenue(lineId, amount, note, scores) {
  return postToSheet({
    action: "revenue",
    lineId: lineId, amount: amount, date: todayStr(), note: note || "",
    scoreA: scores.A, scoreT: scores.T, scoreP: scores.P, scoreI: scores.I
  });
}

/* ── 從 Sheet 讀回某學員的打卡＋成交紀錄，轉成前端用的 dailyLog／weeklyLog／revenueLog 形狀 ── */
async function loadLogs(userId) {
  try {
    var r = await fetch(SHEET_API + "?action=logs&userId=" + encodeURIComponent(userId));
    var d = await r.json();
    if (d.status !== "ok") return {dailyLog: [], weeklyLog: [], revenueLog: []};
    var dailyLog = [], weeklyLog = [];
    (d.checkins || []).forEach(function(c) {
      /* 保留 dim/pts：calcDims 直接靠它們加總投入，不必回查本專案任務池（跨 workshop 才安全）。 */
      var dim = c.dim || "", pts = Number(c.pts) || 0;
      if (c.taskType === "weekly") {
        weeklyLog.push({taskId: c.taskKey, week: weekStr(new Date(c.date)), date: normDate(c.date), dim: dim, pts: pts});
      } else {
        dailyLog.push({taskId: c.taskKey, date: normDate(c.date), dim: dim, pts: pts});
      }
    });
    var revenueLog = (d.revenue || []).map(function(e) {
      return {date: normDate(e.date), amount: Number(e.amount)||0, note: e.note||"",
              A: Number(e.A)||0, T: Number(e.T)||0, P: Number(e.P)||0, I: Number(e.I)||0};
    });
    return {dailyLog: dailyLog, weeklyLog: weeklyLog, revenueLog: revenueLog};
  } catch(e) {
    console.log("loadLogs error:", e);
    return {dailyLog: [], weeklyLog: [], revenueLog: []};
  }
}

/* ── 自評起點：從同一個試算表的測驗結果讀回該學員的自評 ATPI（只當對照顯示，不進計分）。
   沒測過就回 null，畫面上那條對照線自動隱藏。 */
async function loadSelfEval(userId) {
  try {
    var r = await fetch(SHEET_API + "?userId=" + encodeURIComponent(userId));
    var d = await r.json();
    if (d.status !== "ok") return null;
    return { A: Number(d.scoreA)||0, T: Number(d.scoreT)||0, P: Number(d.scoreP)||0, I: Number(d.scoreI)||0 };
  } catch(e) {
    console.log("loadSelfEval error:", e);
    return null;
  }
}

/* ── 學員資料 ── */
var STUDENTS = [];

async function loadStudents() {
  var sr = await fetch(SHEET_API + "?action=students");
  var sd = await sr.json();
  if (sd.status === "ok" && sd.students) {
    STUDENTS = sd.students.map(function(s) {
      var st = {
        lineId:     s["LINE userId"] || s.lineId,
        name:       s["姓名"]       || s.name,
        team:       s["團隊"]       || s.team,
        attend:     +(s["出席"]     || s.attend     || 0),
        social:     +(s["社群分享"] || s.social     || 0),
        homework:   +(s["作業"]     || s.homework   || 0),
        team_score: +(s["團隊賽"]   || s.team_score || 0)
      };
      st.tasks = initTasks(st);
      /* 先給空陣列佔位；當前學員的每日／每週打卡與成交紀錄會在 dashboard init 時
         用 loadLogs() 從 Google Sheet 讀回覆蓋（其他學員維持空，見 baseScore 說明）。 */
      st.dailyLog = [];
      st.weeklyLog = [];
      st.revenueLog = [];
      return st;
    });
  }
}
