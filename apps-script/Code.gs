/* ═══════════════════════════════════════════════════════════
   consult-workshop 後端（Google Apps Script Web App）
   把這整支貼進「擴充功能 → Apps Script」，取代舊的 Code.gs，
   然後「部署 → 管理部署 → 編輯（鉛筆）→ 版本選「新增」→ 部署」，
   網址不變（common.js 的 SHEET_API 不用改）。存取權：「任何人」。

   分頁名稱在下面 TABS 設定，跟你的試算表對齊即可（預設用中文分頁名）。
   ═══════════════════════════════════════════════════════════ */

var SS_ID = "";  // 留空＝用這支腳本所綁定的試算表；若腳本是獨立的，填試算表 ID

var TABS = {
  students:    "學員",       // 身份：LINE userId | 姓名 | 團隊
  workshops:   "workshops",  // workshopId | name | active
  tasks:       "tasks",      // workshopId | taskKey | cadence | dim | pts | name | icon | needReview
  enrollments: "enrollments",// lineId | workshopId
  checkins:    "打卡紀錄",    // lineId | workshopId | taskKey | cadence | dim | pts | date
  revenue:     "成交紀錄",    // lineId | workshopId | amount | date | note | A | T | P | I
  quiz:        "測驗結果"     // 自評來源（comconverttest 寫入）：userId | scoreA | scoreT | scoreP | scoreI
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

/* 依標題對齊，把物件 append 成一列（沒有對應欄位的留空）。 */
function appendRow_(tab, obj) {
  var sh = ss_().getSheetByName(tab);
  if (!sh) throw new Error("找不到分頁：" + tab);
  var headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(function(h){ return String(h).trim(); });
  sh.appendRow(headers.map(function(h){ return obj.hasOwnProperty(h) ? obj[h] : ""; }));
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
        return { lineId: String(r["LINE userId"] || r.lineId || ""), name: String(r["姓名"] || r.name || ""), team: String(r["團隊"] || r.team || "") };
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
        return { lineId: String(r.lineId || r["LINE userId"] || ""), workshopId: String(r.workshopId || "") };
      }).filter(function(x){ return x.lineId && x.workshopId; });
      return json_({ status: "ok", workshops: workshops, tasks: tasks, enrollments: enrollments });
    }

    if (action === "logs") {
      var uid = String(p.userId || "");
      var checkins = rows_(TABS.checkins).filter(function(r){ return String(r.lineId) === uid; }).map(function(r) {
        return { workshopId: String(r.workshopId || ""), taskKey: String(r.taskKey || ""), cadence: String(r.cadence || r.taskType || "daily"),
                 dim: String(r.dim || ""), pts: Number(r.pts) || 0, date: r.date };
      });
      var revenue = rows_(TABS.revenue).filter(function(r){ return String(r.lineId) === uid; }).map(function(r) {
        return { workshopId: String(r.workshopId || ""), amount: Number(r.amount) || 0, date: r.date, note: String(r.note || ""),
                 A: Number(r.A) || 0, T: Number(r.T) || 0, P: Number(r.P) || 0, I: Number(r.I) || 0 };
      });
      return json_({ status: "ok", checkins: checkins, revenue: revenue });
    }

    if (action === "leaderboard") {
      var wid = String(p.workshopId || "");
      var byUser = {};
      rows_(TABS.checkins).forEach(function(r) {
        if (wid && String(r.workshopId) !== wid) return;
        var id = String(r.lineId); if (!id) return;
        byUser[id] = (byUser[id] || 0) + (Number(r.pts) || 0);
      });
      var idx = {};
      rows_(TABS.students).forEach(function(r) {
        var id = String(r["LINE userId"] || r.lineId || "");
        if (id) idx[id] = { name: String(r["姓名"] || r.name || ""), team: String(r["團隊"] || r.team || "") };
      });
      var out = Object.keys(byUser).map(function(id) {
        return { lineId: id, name: (idx[id] || {}).name || id, team: (idx[id] || {}).team || "", score: byUser[id] };
      }).sort(function(a, b){ return b.score - a.score; });
      return json_({ status: "ok", rows: out });
    }

    if (p.userId) {  // 自評（測驗結果），無 action
      var uid2 = String(p.userId);
      var row = rows_(TABS.quiz).filter(function(r){ return String(r.userId || r["LINE userId"] || "") === uid2; }).pop();
      if (!row) return json_({ status: "none" });
      return json_({ status: "ok", scoreA: Number(row.scoreA) || 0, scoreT: Number(row.scoreT) || 0, scoreP: Number(row.scoreP) || 0, scoreI: Number(row.scoreI) || 0 });
    }

    return json_({ status: "error", message: "unknown action" });
  } catch (err) {
    return json_({ status: "error", message: String(err) });
  }
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    if (body.action === "checkin") {
      appendRow_(TABS.checkins, {
        lineId: body.lineId, workshopId: body.workshopId || "", taskKey: body.taskKey,
        cadence: body.cadence || body.taskType || "daily", dim: body.dim || "", pts: body.pts || 0,
        date: body.date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd")
      });
      return json_({ status: "ok" });
    }
    if (body.action === "revenue") {
      appendRow_(TABS.revenue, {
        lineId: body.lineId, workshopId: body.workshopId || "", amount: body.amount || 0,
        date: body.date || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"),
        note: body.note || "", A: body.scoreA || 0, T: body.scoreT || 0, P: body.scoreP || 0, I: body.scoreI || 0
      });
      return json_({ status: "ok" });
    }
    return json_({ status: "error", message: "unknown action" });
  } catch (err) {
    return json_({ status: "error", message: String(err) });
  }
}
