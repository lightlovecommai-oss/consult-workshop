/* ═══════════════════════════════════════════════════════════
   consult-workshop 後端（Google Apps Script Web App）
   把這整支貼進「擴充功能 → Apps Script」，取代舊的 Code.gs，
   然後「部署 → 管理部署 → 編輯（鉛筆）→ 版本選「新增」→ 部署」，
   網址不變（common.js 的 SHEET_API 不用改）。存取權：「任何人」。

   分頁名稱在 TABS；欄位標題（中文/英文）對照在 COLS，讀寫都吃這張表，
   所以你的分頁維持中文欄名也能用。
   ═══════════════════════════════════════════════════════════ */

var SS_ID = "";  // 留空＝用這支腳本所綁定的試算表；若腳本是獨立的，填試算表 ID

var TABS = {
  students:    "(遊戲)學員名單",       // LINE userId | 姓名 | 團隊
  workshops:   "(遊戲)課程",           // ⬅ 需新建：workshopId | name | active（匯入 seed-workshops.csv）
  tasks:       "(遊戲)任務",           // ⬅ 需新建：workshopId | taskKey | cadence | dim | pts | name | icon | needReview（匯入 seed-tasks.csv）
  honors:      "(遊戲)榮譽",           // 各 workshop 專屬榮譽：workshopId | honorId | metric | value | icon | name | desc | tier | celebrate | scope
  honorEvents: "(遊戲)榮譽事件",       // 榮譽解鎖事件流（首頁他人快閃用；程式自動建立/去重）：lineId | 姓名 | honorId | 榮譽名 | icon | 時間 | ts
  enrollments: "(遊戲)開通名單",       // 一人一列，每門課一欄；格子打勾＝開通。欄名＝workshopId
  checkins:    "(遊戲)打卡紀錄",       // LINE userId | 任務key | 類型 | 維度 | 分數 | 日期（+ 課程）
  revenue:     "(遊戲)成交紀錄",       // LINE userId | 金額 | 日期 | 備註 | 吸引力 | 信任力 | 專業力 | 推進力（+ 課程）
  quiz:        "(引流.A)能力測驗"      // 自評來源（暫定，待確認）：LINE userId + ATPI 分數
};

/* 每個邏輯欄位 → 可能的實際標題（中英文都列，讀寫都靠這張表對齊）。 */
var COLS = {
  students: { lineId:["LINE userId","lineId"], name:["姓名","LINE名稱","name"], team:["團隊","team"] },
  enroll:   { lineId:["LINE userId","lineId"], workshopId:["課程","workshopId"] },
  checkins: { lineId:["LINE userId","lineId"], workshopId:["課程","workshopId"], taskKey:["任務key","taskKey"],
              cadence:["類型","cadence"], dim:["維度","dim"], pts:["分數","pts"], date:["日期","date"] },
  revenue:  { lineId:["LINE userId","lineId"], workshopId:["課程","workshopId"], amount:["金額","amount"],
              date:["日期","date"], note:["備註","note"],
              A:["吸引力","A"], T:["信任力","T"], P:["專業力","P"], I:["推進力","I"] },
  quiz:     { lineId:["LINE userId","userId","lineId"], A:["吸引力","scoreA","A"], T:["信任力","scoreT","T"],
              P:["專業力","scoreP","P"], I:["影響力","推進力","scoreI","I"] }
};

function ss_() { return SS_ID ? SpreadsheetApp.openById(SS_ID) : SpreadsheetApp.getActiveSpreadsheet(); }

/* 讀某分頁成物件陣列（用第一列標題當 key，欄位順序可任意）。分頁不存在回空陣列。 */
function rows_(tab) {
  var sh = ss_().getSheetByName(tab);
  if (!sh) return [];
  var values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0].map(function(h){ return String(h).trim(); });
  var out = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i], o = {};
    for (var j = 0; j < headers.length; j++) if (headers[j]) o[headers[j]] = row[j];
    out.push(o);
  }
  return out;
}

/* 依別名清單，從一列取第一個有值的欄位。 */
function pick_(r, aliases) {
  for (var i = 0; i < aliases.length; i++) {
    var v = r[aliases[i]];
    if (v !== undefined && v !== "") return v;
  }
  return "";
}

/* 依 COLS 對照，把邏輯欄位的值 append 成一列——寫進該分頁「實際存在」的標題欄（中英文皆可）。 */
function appendMapped_(tab, colmap, values) {
  var sh = ss_().getSheetByName(tab);
  if (!sh) throw new Error("找不到分頁：" + tab);
  var headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(function(h){ return String(h).trim(); });
  var line = headers.map(function(h) {
    for (var f in values) {
      if (colmap[f] && colmap[f].indexOf(h) > -1) return values[f];
    }
    return "";
  });
  sh.appendRow(line);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function truthy_(v) {
  if (v === "" || v === undefined || v === null) return false;
  if (v === true || v === 1) return true;
  return String(v).toLowerCase() === "true" || String(v) === "1";
}
/* 開通格判定：核取方塊 TRUE、或打勾類文字(✅/是/v/o…)＝開通；空白或叉/否/0＝沒開通。 */
function granted_(v) {
  if (v === true || v === 1) return true;
  var s = String(v).trim().toLowerCase();
  if (s === "") return false;
  if (s === "false" || s === "0" || s === "x" || s === "✗" || s === "✕" || s === "否" || s === "-") return false;
  return true;
}

/* 把 Sheet 的日期值（Date 物件或字串）統一成 yyyy-MM-dd。 */
function normDateStr_(v) {
  if (v === "" || v === null || v === undefined) return "";
  if (Object.prototype.toString.call(v) === "[object Date]") return Utilities.formatDate(v, Session.getScriptTimeZone(), "yyyy-MM-dd");
  return String(v).slice(0, 10);
}
function dstr_(d, tz) { return Utilities.formatDate(d, tz, "yyyy-MM-dd"); }
/* 連續打卡天數：從今天（或昨天，若今天還沒打）往回數，dates 有的天就 +1。 */
function streak_(dates, today, tz) {
  var n = 0, d = new Date(today);
  if (!dates[dstr_(d, tz)]) d.setDate(d.getDate() - 1);
  while (dates[dstr_(d, tz)]) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
/* 本週完成率＝本週一到今天「有打卡的天數 / 已過天數」。 */
function weekPct_(dates, today, tz) {
  var elapsed = Number(Utilities.formatDate(today, tz, "u")); // 1=一 … 7=日
  var hit = 0, d = new Date(today);
  for (var i = 0; i < elapsed; i++) {
    if (dates[dstr_(d, tz)]) hit++;
    d.setDate(d.getDate() - 1);
  }
  return Math.round(hit / elapsed * 100);
}

/* ── 共用計算（各端點與 bootstrap 共用，單一真相）── */
function computeStudent_(uid) {
  var st = null;
  rows_(TABS.students).forEach(function(r) {
    var id = String(pick_(r, COLS.students.lineId));
    if (id === uid) st = { lineId: id, name: String(pick_(r, COLS.students.name)) || id, team: String(pick_(r, COLS.students.team)) };
  });
  return st;
}
function computeConfig_() {
  var workshops = rows_(TABS.workshops)
    .filter(function(r){ return r.active === "" || r.active === undefined || truthy_(r.active); })
    .map(function(r){
      function mod(v){ return (v === "" || v === undefined) ? true : truthy_(v); }
      return { id: String(r.workshopId || r.id || ""), name: String(r.name || ""),
               modules: { team: mod(r.team), leaderboard: mod(r.leaderboard), badges: mod(r.badges), revenue: mod(r.revenue) } };
    }).filter(function(w){ return w.id; });
  var tasks = rows_(TABS.tasks).map(function(r){
    return { workshopId: String(r.workshopId || ""), key: String(r.taskKey || r.key || ""), cadence: String(r.cadence || "once"),
             dim: String(r.dim || ""), pts: Number(r.pts) || 0, name: String(r.name || ""), icon: String(r.icon || ""), needReview: truthy_(r.needReview) };
  }).filter(function(t){ return t.workshopId && t.key; });
  /* 開通名單是寬表：一人一列，每門課一欄(欄名＝workshopId)，格子打勾＝開通。 */
  var wids = workshops.map(function(w){ return w.id; });
  var enrollments = [];
  rows_(TABS.enrollments).forEach(function(r){
    var lineId = String(pick_(r, COLS.enroll.lineId));
    if (!lineId) return;
    wids.forEach(function(wid){ if (granted_(r[wid])) enrollments.push({ lineId: lineId, workshopId: wid }); });
  });
  return { workshops: workshops, tasks: tasks, enrollments: enrollments, honors: computeHonors_() };
}
/* 各 workshop 專屬榮譽（資料驅動，欄名為英文 key，跟 tasks 一致）。
   metric 對照前端 ctx：dealCount/revenueTotal/potential/streak/checkinCount/dimsCovered/
   workshopsActive/bestWeekDays/investPct.A|T|P|I/scores.A|T|P|I。
   scope=workshop（預設）用該課過濾後資料算；scope=global 用跨課合併資料算。 */
function computeHonors_() {
  return rows_(TABS.honors).map(function(r){
    return { honorId: String(r.honorId || r.id || ""), workshopId: String(r.workshopId || ""),
             metric: String(r.metric || ""), value: Number(r.value) || 0,
             icon: String(r.icon || ""), name: String(r.name || ""), desc: String(r.desc || ""),
             tier: String(r.tier || ""), celebrate: truthy_(r.celebrate), scope: String(r.scope || "workshop") };
  }).filter(function(h){ return h.honorId && h.name; });
}
/* 榮譽解鎖事件流：最近 N 筆（時間新到舊），供首頁他人快閃。 */
function computeHonorFeed_(limit) {
  limit = limit || 30;
  var rows = rows_(TABS.honorEvents).map(function(r){
    return { lineId: String(r.lineId || ""), name: String(r["姓名"] || r.name || ""),
             honorId: String(r.honorId || ""), honorName: String(r["榮譽名"] || r.honorName || ""),
             icon: String(r.icon || ""), ts: Number(r.ts) || 0 };
  }).filter(function(e){ return e.lineId && e.honorName; });
  rows.sort(function(a, b){ return b.ts - a.ts; });
  return rows.slice(0, limit);
}
/* 事件表不存在就自動建立（含表頭），使用者不用手開分頁。 */
function ensureHonorEventsSheet_() {
  var ss = ss_();
  var sh = ss.getSheetByName(TABS.honorEvents);
  if (!sh) {
    sh = ss.insertSheet(TABS.honorEvents);
    sh.getRange(1, 1, 1, 7).setValues([["lineId", "姓名", "honorId", "榮譽名", "icon", "時間", "ts"]]);
  }
  return sh;
}
function computeLogs_(uid) {
  var checkins = rows_(TABS.checkins).filter(function(r){ return String(pick_(r, COLS.checkins.lineId)) === uid; }).map(function(r){
    return { workshopId: String(pick_(r, COLS.checkins.workshopId)), taskKey: String(pick_(r, COLS.checkins.taskKey)),
             cadence: String(pick_(r, COLS.checkins.cadence) || "daily"), dim: String(pick_(r, COLS.checkins.dim)),
             pts: Number(pick_(r, COLS.checkins.pts)) || 0, date: pick_(r, COLS.checkins.date) };
  });
  var revenue = rows_(TABS.revenue).filter(function(r){ return String(pick_(r, COLS.revenue.lineId)) === uid; }).map(function(r){
    return { workshopId: String(pick_(r, COLS.revenue.workshopId)), amount: Number(pick_(r, COLS.revenue.amount)) || 0,
             date: pick_(r, COLS.revenue.date), note: String(pick_(r, COLS.revenue.note)),
             A: Number(pick_(r, COLS.revenue.A)) || 0, T: Number(pick_(r, COLS.revenue.T)) || 0,
             P: Number(pick_(r, COLS.revenue.P)) || 0, I: Number(pick_(r, COLS.revenue.I)) || 0 };
  });
  return { checkins: checkins, revenue: revenue };
}
function computeSelfEval_(uid) {
  var row = rows_(TABS.quiz).filter(function(r){ return String(pick_(r, COLS.quiz.lineId)) === uid; }).pop();
  if (!row) return null;
  return { A: Number(pick_(row, COLS.quiz.A)) || 0, T: Number(pick_(row, COLS.quiz.T)) || 0,
           P: Number(pick_(row, COLS.quiz.P)) || 0, I: Number(pick_(row, COLS.quiz.I)) || 0 };
}
function computeLeaderboard_(wid) {
  var byUser = {};        // 分數：只算本課程（各 workshop 各一張榜）
  rows_(TABS.checkins).forEach(function(r){
    if (wid && String(pick_(r, COLS.checkins.workshopId)) !== wid) return;
    var id = String(pick_(r, COLS.checkins.lineId)); if (!id) return;
    byUser[id] = (byUser[id] || 0) + (Number(pick_(r, COLS.checkins.pts)) || 0);
  });
  // 稱號用的打卡紀錄：跨所有 workshop（榮譽是「人」的屬性），只帶 honor ctx 需要的欄。
  var logsByUser = {};
  rows_(TABS.checkins).forEach(function(r){
    var id = String(pick_(r, COLS.checkins.lineId)); if (!id || byUser[id] == null) return;
    (logsByUser[id] || (logsByUser[id] = { checkins: [], revenue: [] })).checkins.push({
      workshopId: String(pick_(r, COLS.checkins.workshopId)), dim: String(pick_(r, COLS.checkins.dim)),
      pts: Number(pick_(r, COLS.checkins.pts)) || 0, date: normDateStr_(pick_(r, COLS.checkins.date))
    });
  });
  rows_(TABS.revenue).forEach(function(r){
    var id = String(pick_(r, COLS.revenue.lineId)); if (!id || byUser[id] == null) return;
    (logsByUser[id] || (logsByUser[id] = { checkins: [], revenue: [] })).revenue.push({
      amount: Number(pick_(r, COLS.revenue.amount)) || 0
    });
  });
  var idx = {};
  rows_(TABS.students).forEach(function(r){
    var id = String(pick_(r, COLS.students.lineId));
    if (id) idx[id] = { name: String(pick_(r, COLS.students.name)), team: String(pick_(r, COLS.students.team)) };
  });
  return Object.keys(byUser).map(function(id){
    return { lineId: id, name: (idx[id] || {}).name || id, team: (idx[id] || {}).team || "",
             score: byUser[id], logs: logsByUser[id] || { checkins: [], revenue: [] } };
  }).sort(function(a, b){ return b.score - a.score; });
}
function computeTeam_(wid) {
  var enrolled = {};
  rows_(TABS.enrollments).forEach(function(r){ if (granted_(r[wid])) enrolled[String(pick_(r, COLS.enroll.lineId))] = true; });
  var sinfo = {};
  rows_(TABS.students).forEach(function(r){
    var id = String(pick_(r, COLS.students.lineId));
    if (id) sinfo[id] = { name: String(pick_(r, COLS.students.name)) || id, group: String(pick_(r, COLS.students.team)) };
  });
  var byU = {};
  rows_(TABS.checkins).forEach(function(r){
    if (String(pick_(r, COLS.checkins.workshopId)) !== wid) return;
    var id = String(pick_(r, COLS.checkins.lineId)); if (!id) return;
    var m = byU[id] || (byU[id] = { invest: 0, dates: {} });
    m.invest += Number(pick_(r, COLS.checkins.pts)) || 0;
    var ds = normDateStr_(pick_(r, COLS.checkins.date)); if (ds) m.dates[ds] = true;
  });
  var tz = Session.getScriptTimeZone(), now = new Date();
  return Object.keys(enrolled).map(function(id){
    var m = byU[id] || { invest: 0, dates: {} };
    return { lineId: id, name: (sinfo[id] || {}).name || id, group: (sinfo[id] || {}).group || "",
             invest: m.invest, streak: streak_(m.dates, now, tz), weekPct: weekPct_(m.dates, now, tz) };
  });
}

function doGet(e) {
  try {
    var p = e.parameter || {};
    var action = p.action || "";

    if (action === "students") {
      var students = rows_(TABS.students).map(function(r) {
        return { lineId: String(pick_(r, COLS.students.lineId)), name: String(pick_(r, COLS.students.name)), team: String(pick_(r, COLS.students.team)) };
      }).filter(function(s){ return s.lineId; });
      return json_({ status: "ok", students: students });
    }

    if (action === "config") {
      var cfg = computeConfig_();
      return json_({ status: "ok", workshops: cfg.workshops, tasks: cfg.tasks, enrollments: cfg.enrollments, honors: cfg.honors });
    }

    if (action === "bootstrap") {  // 一通回傳整個儀表板需要的資料（B：減少往返）
      var buid = String(p.userId || "");
      var bcfg = computeConfig_();
      var blogs = computeLogs_(buid);
      var enrolledWids = bcfg.enrollments.filter(function(e){ return e.lineId === buid; }).map(function(e){ return e.workshopId; });
      var bw = String(p.w || "");  // 入口帶的課程：有開通才用它當預設，否則落在第一門開通的
      var defWid = "";
      if (bw && enrolledWids.indexOf(bw) > -1) defWid = bw;
      else { for (var bi = 0; bi < bcfg.workshops.length; bi++) { if (enrolledWids.indexOf(bcfg.workshops[bi].id) > -1) { defWid = bcfg.workshops[bi].id; break; } } }
      return json_({ status: "ok", student: computeStudent_(buid),
                     workshops: bcfg.workshops, tasks: bcfg.tasks, enrollments: bcfg.enrollments, honors: bcfg.honors,
                     checkins: blogs.checkins, revenue: blogs.revenue, selfEval: computeSelfEval_(buid),
                     defaultWorkshop: defWid, leaderboard: computeLeaderboard_(defWid), team: computeTeam_(defWid),
                     honorFeed: computeHonorFeed_(30) });
    }

    if (action === "logs") {
      var logs = computeLogs_(String(p.userId || ""));
      return json_({ status: "ok", checkins: logs.checkins, revenue: logs.revenue });
    }

    if (action === "leaderboard") {
      return json_({ status: "ok", rows: computeLeaderboard_(String(p.workshopId || "")) });
    }

    if (action === "team") {
      return json_({ status: "ok", members: computeTeam_(String(p.workshopId || "")) });
    }

    if (action === "honorFeed") {
      return json_({ status: "ok", events: computeHonorFeed_(Number(p.limit) || 30) });
    }

    if (p.userId) {  // 自評（測驗結果），無 action
      var se = computeSelfEval_(String(p.userId));
      if (!se) return json_({ status: "none" });
      return json_({ status: "ok", scoreA: se.A, scoreT: se.T, scoreP: se.P, scoreI: se.I });
    }

    return json_({ status: "error", message: "unknown action" });
  } catch (err) {
    return json_({ status: "error", message: String(err) });
  }
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
    if (body.action === "checkin") {
      appendMapped_(TABS.checkins, COLS.checkins, {
        lineId: body.lineId, workshopId: body.workshopId || "", taskKey: body.taskKey,
        cadence: body.cadence || body.taskType || "daily", dim: body.dim || "", pts: body.pts || 0, date: body.date || today
      });
      return json_({ status: "ok" });
    }
    if (body.action === "revenue") {
      appendMapped_(TABS.revenue, COLS.revenue, {
        lineId: body.lineId, workshopId: body.workshopId || "", amount: body.amount || 0, date: body.date || today,
        note: body.note || "", A: body.scoreA || 0, T: body.scoreT || 0, P: body.scoreP || 0, I: body.scoreI || 0
      });
      return json_({ status: "ok" });
    }
    if (body.action === "honorEvent") {  // 榮譽解鎖事件：一人一榮譽只記一次（去重）
      var eid = String(body.lineId || ""), hid = String(body.honorId || "");
      if (!eid || !hid) return json_({ status: "error", message: "missing lineId/honorId" });
      var existing = rows_(TABS.honorEvents);
      for (var k = 0; k < existing.length; k++) {
        if (String(existing[k].lineId) === eid && String(existing[k].honorId) === hid) return json_({ status: "ok", dup: true });
      }
      var st = computeStudent_(eid), now = new Date();
      ensureHonorEventsSheet_().appendRow([
        eid, (st ? st.name : eid), hid, String(body.name || ""), String(body.icon || ""),
        Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm"), now.getTime()
      ]);
      return json_({ status: "ok" });
    }
    return json_({ status: "error", message: "unknown action" });
  } catch (err) {
    return json_({ status: "error", message: String(err) });
  }
}

/* ═══════════════════════════════════════════════════════════
   一鍵初始化：在 Apps Script 編輯器選這個 setup 函式 → 按「執行」一次即可。
   會自動：① 幫打卡/成交分頁補「課程」欄　② 建好 (遊戲)課程 / (遊戲)任務並填資料。
   第一次執行會跳授權，按「審查權限 → 允許」。不用再手動加欄位或匯入 CSV。
   ═══════════════════════════════════════════════════════════ */
function setup() {
  ensureColumn_(TABS.checkins, "課程");
  ensureColumn_(TABS.revenue, "課程");
  writeSheet_(TABS.workshops, [
    ["workshopId", "name", "active"],
    ["一階", "一階", true],
    ["二階", "二階", true],
    ["三階", "三階", true],
    ["1v1顧問實戰", "1v1顧問實戰", true],
    ["主持人實戰", "主持人實戰", true],
    ["短影音實戰", "短影音實戰", true]
  ]);
  writeSheet_(TABS.tasks, TASKS_SEED);
  var e = ensureEnrollmentSheet_();
  return "初始化完成；" + e;
}

/* 建「開通名單」寬表：一人一列、每門課一欄(核取方塊)，預設把第一門課(一階)開通。
   已存在就「不覆蓋」，避免洗掉你手動的開通設定。 */
function ensureEnrollmentSheet_() {
  var ss = ss_();
  if (ss.getSheetByName(TABS.enrollments)) return "開通名單已存在，未變動";
  var sh = ss.insertSheet(TABS.enrollments);
  var wids = rows_(TABS.workshops).map(function(r){ return String(r.workshopId || r.id || ""); }).filter(function(x){ return x; });
  var header = ["LINE userId", "姓名"].concat(wids);
  var firstCourse = wids[0] || "";
  var out = [header];
  rows_(TABS.students).forEach(function(r){
    var id = String(pick_(r, COLS.students.lineId));
    if (!id) return;
    var line = [id, String(pick_(r, COLS.students.name)) || ""];
    wids.forEach(function(w){ line.push(w === firstCourse); });  // 預設開通第一門課
    out.push(line);
  });
  sh.getRange(1, 1, out.length, header.length).setValues(out);
  if (out.length > 1 && wids.length) sh.getRange(2, 3, out.length - 1, wids.length).insertCheckboxes();
  return "已建開通名單，" + (out.length - 1) + " 人，預設開通「" + firstCourse + "」";
}

function ensureColumn_(tab, header) {
  var sh = ss_().getSheetByName(tab);
  if (!sh) return;
  var lastCol = Math.max(1, sh.getLastColumn());
  var headers = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h){ return String(h).trim(); });
  if (headers.indexOf(header) > -1) return;
  sh.getRange(1, sh.getLastColumn() + 1).setValue(header);
}

function writeSheet_(name, rows) {
  var ss = ss_();
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  sh.clearContents();
  sh.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
}

var TASKS_SEED = [
  ["workshopId", "taskKey", "cadence", "dim", "pts", "name", "icon", "needReview"],
  ["一階", "attend1", "once", "I", 2, "第 1 場準時出席", "📅", false],
  ["一階", "attend2", "once", "I", 2, "第 2 場準時出席", "📅", false],
  ["一階", "social1", "once", "A", 3, "社群分享：自己故事", "📣", false],
  ["一階", "social2", "once", "A", 3, "社群分享：導師故事", "📖", false],
  ["一階", "social3", "once", "A", 3, "社群分享：培訓心得", "✨", false],
  ["一階", "hw1", "special", "P", 5, "作業：開場逐字稿", "✍️", true],
  ["一階", "hw2", "special", "P", 5, "作業：收單逐字稿", "📝", true],
  ["一階", "team1", "special", "T", 6, "團隊賽得分", "⚔️", true],
  ["一階", "d1", "daily", "A", 1, "發一則社群貼文", "📣", false],
  ["一階", "d2", "daily", "A", 1, "留言互動 3 位夥伴的貼文", "💬", false],
  ["一階", "d3", "daily", "T", 1, "主動關心一位夥伴的近況", "🤝", false],
  ["一階", "d4", "daily", "T", 1, "在群組裡真誠回應一則訊息", "💛", false],
  ["一階", "d5", "daily", "P", 1, "寫 100 字今日反思", "📝", false],
  ["一階", "d6", "daily", "P", 1, "練習一次開場白或提案台詞", "🎤", false],
  ["一階", "d7", "daily", "P", 1, "覆盤一件今天做得好的事", "🔍", false],
  ["一階", "d8", "daily", "I", 1, "準時開始今天的行動", "⏰", false],
  ["一階", "d9", "daily", "I", 1, "完成今天排定的一件任務", "✅", false],
  ["一階", "d10", "daily", "A", 1, "分享一則有價值的觀點", "✨", false],
  ["一階", "wk1", "weekly", "I", 2, "出席本週固定會議／直播", "📅", false],
  ["一階", "wk2", "weekly", "P", 2, "交一份週報／進度整理", "📋", false],
  ["一階", "wk3", "weekly", "T", 2, "跟夥伴進行一次共學或角色扮演", "🎭", false],
  ["一階", "wk4", "weekly", "A", 2, "開發一位新名單／新連結", "🌱", false],
  ["一階", "wk5", "weekly", "T", 2, "幫夥伴做一次回饋或複盤", "🪞", false]
];
