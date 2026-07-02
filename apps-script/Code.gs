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
  enrollments: "(引流.T)課程報名紀錄", // 沿用既有：LINE userId + 課程
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
      var workshops = rows_(TABS.workshops)
        .filter(function(r){ return r.active === "" || r.active === undefined || truthy_(r.active); })
        .map(function(r){ return { id: String(r.workshopId || r.id || ""), name: String(r.name || "") }; })
        .filter(function(w){ return w.id; });
      var tasks = rows_(TABS.tasks).map(function(r) {
        return {
          workshopId: String(r.workshopId || ""),
          key:        String(r.taskKey || r.key || ""),
          cadence:    String(r.cadence || "once"),       // once | special | daily | weekly
          dim:        String(r.dim || ""),               // A | T | P | I
          pts:        Number(r.pts) || 0,
          name:       String(r.name || ""),
          icon:       String(r.icon || ""),
          needReview: truthy_(r.needReview)
        };
      }).filter(function(t){ return t.workshopId && t.key; });
      var enrollments = rows_(TABS.enrollments).map(function(r) {
        return { lineId: String(pick_(r, COLS.enroll.lineId)), workshopId: String(pick_(r, COLS.enroll.workshopId)) };
      }).filter(function(x){ return x.lineId && x.workshopId; });
      return json_({ status: "ok", workshops: workshops, tasks: tasks, enrollments: enrollments });
    }

    if (action === "logs") {
      var uid = String(p.userId || "");
      var checkins = rows_(TABS.checkins).filter(function(r){ return String(pick_(r, COLS.checkins.lineId)) === uid; }).map(function(r) {
        return { workshopId: String(pick_(r, COLS.checkins.workshopId)), taskKey: String(pick_(r, COLS.checkins.taskKey)),
                 cadence: String(pick_(r, COLS.checkins.cadence) || "daily"), dim: String(pick_(r, COLS.checkins.dim)),
                 pts: Number(pick_(r, COLS.checkins.pts)) || 0, date: pick_(r, COLS.checkins.date) };
      });
      var revenue = rows_(TABS.revenue).filter(function(r){ return String(pick_(r, COLS.revenue.lineId)) === uid; }).map(function(r) {
        return { workshopId: String(pick_(r, COLS.revenue.workshopId)), amount: Number(pick_(r, COLS.revenue.amount)) || 0,
                 date: pick_(r, COLS.revenue.date), note: String(pick_(r, COLS.revenue.note)),
                 A: Number(pick_(r, COLS.revenue.A)) || 0, T: Number(pick_(r, COLS.revenue.T)) || 0,
                 P: Number(pick_(r, COLS.revenue.P)) || 0, I: Number(pick_(r, COLS.revenue.I)) || 0 };
      });
      return json_({ status: "ok", checkins: checkins, revenue: revenue });
    }

    if (action === "leaderboard") {
      var wid = String(p.workshopId || "");
      var byUser = {};
      rows_(TABS.checkins).forEach(function(r) {
        if (wid && String(pick_(r, COLS.checkins.workshopId)) !== wid) return;
        var id = String(pick_(r, COLS.checkins.lineId)); if (!id) return;
        byUser[id] = (byUser[id] || 0) + (Number(pick_(r, COLS.checkins.pts)) || 0);
      });
      var idx = {};
      rows_(TABS.students).forEach(function(r) {
        var id = String(pick_(r, COLS.students.lineId));
        if (id) idx[id] = { name: String(pick_(r, COLS.students.name)), team: String(pick_(r, COLS.students.team)) };
      });
      var out = Object.keys(byUser).map(function(id) {
        return { lineId: id, name: (idx[id] || {}).name || id, team: (idx[id] || {}).team || "", score: byUser[id] };
      }).sort(function(a, b){ return b.score - a.score; });
      return json_({ status: "ok", rows: out });
    }

    if (p.userId) {  // 自評（測驗結果），無 action
      var uid2 = String(p.userId);
      var row = rows_(TABS.quiz).filter(function(r){ return String(pick_(r, COLS.quiz.lineId)) === uid2; }).pop();
      if (!row) return json_({ status: "none" });
      return json_({ status: "ok", scoreA: Number(pick_(row, COLS.quiz.A)) || 0, scoreT: Number(pick_(row, COLS.quiz.T)) || 0,
                     scoreP: Number(pick_(row, COLS.quiz.P)) || 0, scoreI: Number(pick_(row, COLS.quiz.I)) || 0 });
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
    return json_({ status: "error", message: "unknown action" });
  } catch (err) {
    return json_({ status: "error", message: String(err) });
  }
}
