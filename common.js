var LIFF_ID = "2010316474-UovQ1zhe";
var SHEET_API = "https://script.google.com/macros/s/AKfycbwEwlg4cFa7B_e76ULJM26C2B9fgjwjFTXPFb_yRMWt1wZs33iTGnEI1LZ9v8uZHvdz/exec";

/* ── 四維度定義 ──
   k＝投入飽和曲線的「半滿點」：該維累積到 k 分時投入%＝50%（見 calcDims）。
   不是硬性滿分——投入% 永遠逼近 100 不爆表，所以可跨多 workshop 無限加總、加 workshop 免校準。
   k 是軟旋鈕，待真實數據微調，抓錯只影響曲線胖瘦不會頂死。 */
var DIMS = {
  A: {name:"吸引力", desc:"別人主動想靠近你",     color:"#e8734a", key:"social",   k:9,  inner:"批判心少・容易欣賞別人"},
  T: {name:"信任力", desc:"別人願意跟你說秘密",   color:"#5DCAA5", key:"team",     k:6,  inner:"真誠・心口合一"},
  P: {name:"專業力", desc:"別人理解並買你的服務", color:"#378ADD", key:"homework", k:10, inner:"不斷精進・有上進心・當責"},
  I: {name:"推進力", desc:"別人聽你的話採取行動", color:"#c8a84b", key:"attend",   k:4,  inner:"自己先願意配合・臣服"}
};
/* DORD、calcPotential、COMBO_PATH 已搬到共用檔 atpi-core.js（此檔案的 HTML 需先引入它） */

/* ── 計分校準常數（要調就改這裡，等真實數據累積後再校準）──
   核心哲學：能力由「市場」驗證，不是做多少功課就算數。
   每維能力 = 投入%（飽和曲線）× 驗證係數；驗證係數 = 保底 + (1-保底) ×（金額達成 × 簽單數達成）。 */
var TARGET_AMOUNT = 3000000; // 目標累計成交金額（元）＝ 300 萬（驗證係數的金額分母）
var TARGET_COUNT  = 5;       // 目標累計簽單數（防一張大單灌水，要反覆簽得下來）
var VALID_FLOOR   = 0.5;     // 保底驗證係數：完全沒成交時，投入至少兌現一半

/* ── 每日／每週的完成上限（跨所有 workshop 每種節奏的每期上限）── */
var CADENCE_CFG = {
  daily:  {cap:3, caption:"每天最多算 3 項，多做也不加分，明天可重新選"},
  weekly: {cap:2, caption:"每週最多算 2 項，下週重新開放"}
};

/* ── 等級定義（門檻沿用舊模型，血條改走 levelProgress 進度制，不再有 /29 上限）── */
var LEVELS = [
  {min:0,  title:"見習顧問", beat:20, next:"累積到 10 分，解鎖「顧問」稱號"},
  {min:10, title:"顧問",     beat:45, next:"累積到 18 分，解鎖「資深顧問」稱號"},
  {min:18, title:"資深顧問", beat:68, next:"累積到 24 分，解鎖「變現顧問」稱號"},
  {min:24, title:"變現顧問", beat:88, next:"累積到 29 分，解鎖「顧問大師」稱號"},
  {min:29, title:"顧問大師", beat:97, next:"你已站上頂端，現在聚焦長期合作與規模化"}
];

/* ── 徽章：四維各一枚，該維有累積任務即點亮 ── */
var BADGES = [
  {dim:"A", icon:"📣", name:"吸引力徽章", desc:"累積吸引力任務"},
  {dim:"T", icon:"🤝", name:"信任力徽章", desc:"累積信任力任務"},
  {dim:"P", icon:"✍️", name:"專業力徽章", desc:"累積專業力任務"},
  {dim:"I", icon:"🚀", name:"推進力徽章", desc:"累積推進力任務"}
];

/* ═══════════════════════════════════════════════════════════
   任務設定：全部資料驅動，來自 Google Sheet 的 tasks 分頁（不再寫死）。
   每筆 task：{workshopId, key, cadence, dim, pts, name, icon, needReview}
   cadence：once（專案）｜special（需審核）｜daily（每日池）｜weekly（每週池）
   ═══════════════════════════════════════════════════════════ */
var WORKSHOPS = [];    // [{id, name}]
var TASKS = [];        // [{workshopId, key, cadence, dim, pts, name, icon, needReview}]
var ENROLLMENTS = [];  // [{lineId, workshopId}]

async function loadConfig() {
  try {
    var r = await fetch(SHEET_API + "?action=config");
    var d = await r.json();
    if (d.status === "ok") {
      WORKSHOPS = d.workshops || [];
      TASKS = (d.tasks || []);
      ENROLLMENTS = d.enrollments || [];
    }
  } catch (e) { console.log("loadConfig error:", e); }
}

/* 某 workshop、某節奏的任務清單 */
function tasksFor(workshopId, cadence) {
  return TASKS.filter(function(t){ return t.workshopId === workshopId && t.cadence === cadence; });
}
/* 某任務 key（在某 workshop 內）的定義 */
function taskDef(workshopId, key) {
  return TASKS.find(function(t){ return t.workshopId === workshopId && t.key === key; }) || null;
}
/* 某學員報名的 workshop（依 enrollments，比對 WORKSHOPS 取名稱） */
function enrolledWorkshops(lineId) {
  var ids = ENROLLMENTS.filter(function(e){ return e.lineId === lineId; }).map(function(e){ return e.workshopId; });
  var list = WORKSHOPS.filter(function(w){ return ids.indexOf(w.id) > -1; });
  return list.length ? list : WORKSHOPS.slice();  // 沒設 enrollment 就先給全部，避免空畫面
}

/* ── 日期／週次小工具 ── */
function todayStr() {
  var d = new Date();
  return d.getFullYear() + "-" + ("0"+(d.getMonth()+1)).slice(-2) + "-" + ("0"+d.getDate()).slice(-2);
}
/* Sheet 讀回的日期可能是 Date 物件字串，統一 normalize 成本地 YYYY-MM-DD，才能跟 todayStr 比對 */
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

/* ═══════════════════════════════════════════════════════════
   打卡紀錄 checkinLog 是投入的唯一真相來源（每筆帶 workshopId/cadence/dim/pts）。
   能力用 dim 加總、跨所有 workshop——別的 workshop 的任務不在本專案定義也算得到。
   ═══════════════════════════════════════════════════════════ */

/* 該維累積投入分（跨所有 workshop、所有節奏） */
function investDim(s, dim) {
  return s.checkinLog.reduce(function(sum, e){ return sum + (e.dim === dim ? e.pts : 0); }, 0);
}

/* 每維「市場驗證能力」＝ 投入%（飽和曲線）× 市場驗證係數。
   投入% = 100 × 累積分 /(累積分 + k)：k 分＝50%、3k＝75%，永遠逼近 100 不爆表——
   跨多 workshop 無限加總也不頂死。做很多功課但沒變現，能力仍被驗證係數壓在天花板下（刻意設計）。 */
function calcDims(s) {
  var factor = validationFactor(s);
  var sc = {};
  DORD.forEach(function(k) {
    var invest = investDim(s, k);
    sc[k] = Math.round(100 * invest / (invest + DIMS[k].k) * factor);
  });
  return sc;
}

/* 個人總分（所有 workshop、所有節奏的打卡分加總）——驅動等級／血條 */
function totalScore(s) {
  return s.checkinLog.reduce(function(sum, e){ return sum + e.pts; }, 0);
}

function levelFor(total) {
  var lv = LEVELS[0];
  LEVELS.forEach(function(l){ if (total >= l.min) lv = l; });
  return lv;
}
/* 目前等級 + 到下一級的進度。pct 永遠 0~100 不爆表；封頂時 capped=true、nextMin=null。 */
function levelProgress(total) {
  var idx = 0;
  LEVELS.forEach(function(l, i){ if (total >= l.min) idx = i; });
  var lv = LEVELS[idx], next = LEVELS[idx + 1] || null;
  if (!next) return { lv: lv, nextMin: null, capped: true, pct: 100 };
  var pct = Math.round((total - lv.min) / (next.min - lv.min) * 100);
  return { lv: lv, nextMin: next.min, capped: false, pct: Math.max(0, Math.min(100, pct)) };
}

/* 市場驗證係數：0~1。沒成交時＝保底值，隨累計金額與簽單數往 1.0 靠（兩者相乘，擋一張大單灌水）。 */
function validationFactor(s) {
  var amtAchieve = Math.min(1, revenueTotal(s) / TARGET_AMOUNT);
  var cntAchieve = Math.min(1, s.revenueLog.length / TARGET_COUNT);
  return VALID_FLOOR + (1 - VALID_FLOOR) * (amtAchieve * cntAchieve);
}

/* ── 某 workshop 內：今天／本週已完成的每日／每週任務 key、已完成的一次性任務 ── */
function dailyDoneToday(s, workshopId) {
  var today = todayStr();
  return s.checkinLog.filter(function(e){ return e.cadence === "daily" && e.date === today && e.workshopId === workshopId; })
                     .map(function(e){ return e.taskKey; });
}
function weeklyDoneThisWeek(s, workshopId) {
  var wk = weekStr();
  return s.checkinLog.filter(function(e){ return e.cadence === "weekly" && e.week === wk && e.workshopId === workshopId; })
                     .map(function(e){ return e.taskKey; });
}
/* 一次性（once／special）：回傳 {taskKey: true} 的完成表 */
function onceDoneMap(s, workshopId) {
  var m = {};
  s.checkinLog.forEach(function(e){
    if ((e.cadence === "once" || e.cadence === "special") && e.workshopId === workshopId) m[e.taskKey] = true;
  });
  return m;
}

/* ── 打卡：樂觀更新 checkinLog，同時寫進 Sheet ── */
function doCheckin(s, task, workshopId) {
  s.checkinLog.push({
    workshopId: workshopId, taskKey: task.key, cadence: task.cadence,
    dim: task.dim, pts: task.pts, date: todayStr(), week: weekStr()
  });
  postCheckin(s.lineId, task, workshopId);
}

/* ── 回報成交（金額 + 當下四維快照，供走勢圖）── */
function addRevenue(s, amount, note, workshopId) {
  var scores = calcDims(s);
  s.revenueLog.push({
    workshopId: workshopId || "", date: todayStr(), amount: amount, note: note || "",
    A: scores.A, T: scores.T, P: scores.P, I: scores.I
  });
  postRevenue(s.lineId, amount, note, scores, workshopId);
}
function revenueTotal(s) {
  return s.revenueLog.reduce(function(sum, e){ return sum + e.amount; }, 0);
}
/* 走勢圖金額換算成「萬」再畫（存的是「元」），跟 showcase 示範資料同單位 */
function revenueTrendPoints(s) {
  return s.revenueLog.map(function(e){ return {label:e.date, A:e.A, T:e.T, P:e.P, I:e.I, income: Math.round(e.amount/1000)/10}; });
}

/* ── 寫入 Google Sheet：text/plain 避開 CORS 預檢；樂觀更新，下次載入以 Sheet 為準 ── */
function postToSheet(payload) {
  return fetch(SHEET_API, {
    method: "POST",
    headers: {"Content-Type": "text/plain;charset=utf-8"},
    body: JSON.stringify(payload)
  }).catch(function(e){ console.log("postToSheet error:", e); });
}
function postCheckin(lineId, task, workshopId) {
  return postToSheet({
    action: "checkin", lineId: lineId, workshopId: workshopId || "",
    taskKey: task.key, cadence: task.cadence, dim: task.dim, pts: task.pts, date: todayStr()
  });
}
function postRevenue(lineId, amount, note, scores, workshopId) {
  return postToSheet({
    action: "revenue", lineId: lineId, workshopId: workshopId || "", amount: amount, date: todayStr(), note: note || "",
    scoreA: scores.A, scoreT: scores.T, scoreP: scores.P, scoreI: scores.I
  });
}

/* ── 讀回某學員的打卡＋成交紀錄 ── */
async function loadLogs(userId) {
  try {
    var r = await fetch(SHEET_API + "?action=logs&userId=" + encodeURIComponent(userId));
    var d = await r.json();
    if (d.status !== "ok") return {checkins: [], revenue: []};
    var checkins = (d.checkins || []).map(function(c){
      return { workshopId: String(c.workshopId || ""), taskKey: String(c.taskKey || ""), cadence: String(c.cadence || "daily"),
               dim: String(c.dim || ""), pts: Number(c.pts) || 0, date: normDate(c.date), week: weekStr(new Date(c.date)) };
    });
    var revenue = (d.revenue || []).map(function(e){
      return { workshopId: String(e.workshopId || ""), date: normDate(e.date), amount: Number(e.amount) || 0, note: e.note || "",
               A: Number(e.A) || 0, T: Number(e.T) || 0, P: Number(e.P) || 0, I: Number(e.I) || 0 };
    });
    return {checkins: checkins, revenue: revenue};
  } catch (e) {
    console.log("loadLogs error:", e);
    return {checkins: [], revenue: []};
  }
}

/* ── 排行榜：後端彙總（各 workshop 各一張），回傳所有人的分數，跨人才公平 ── */
async function loadLeaderboard(workshopId) {
  try {
    var r = await fetch(SHEET_API + "?action=leaderboard&workshopId=" + encodeURIComponent(workshopId || ""));
    var d = await r.json();
    return d.status === "ok" ? d.rows : [];
  } catch (e) {
    console.log("loadLeaderboard error:", e);
    return [];
  }
}

/* ── 夥伴頁：該課程每位組員的努力指標（連續天數/本週完成率/投入分）── */
async function loadTeam(workshopId) {
  try {
    var r = await fetch(SHEET_API + "?action=team&workshopId=" + encodeURIComponent(workshopId || ""));
    var d = await r.json();
    return d.status === "ok" ? d.members : [];
  } catch (e) {
    console.log("loadTeam error:", e);
    return [];
  }
}

/* ── 自評起點：讀回測驗自評 ATPI（只當對照顯示，不進計分）── */
async function loadSelfEval(userId) {
  try {
    var r = await fetch(SHEET_API + "?userId=" + encodeURIComponent(userId));
    var d = await r.json();
    if (d.status !== "ok") return null;
    return { A: Number(d.scoreA)||0, T: Number(d.scoreT)||0, P: Number(d.scoreP)||0, I: Number(d.scoreI)||0 };
  } catch (e) {
    console.log("loadSelfEval error:", e);
    return null;
  }
}

/* ── 學員身份（只讀 lineId／姓名／團隊；分數一律來自打卡紀錄）── */
var STUDENTS = [];
async function loadStudents() {
  var sr = await fetch(SHEET_API + "?action=students");
  var sd = await sr.json();
  if (sd.status === "ok" && sd.students) {
    STUDENTS = sd.students.map(function(s){
      return {
        lineId: s.lineId || s["LINE userId"],
        name:   s.name   || s["姓名"],
        team:   s.team   || s["團隊"],
        checkinLog: [], revenueLog: [], selfEval: null
      };
    });
  }
}
