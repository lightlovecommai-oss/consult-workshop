/* ═══════════════════════════════════════════════════════════
   consult-workshop 後端（Google Apps Script Web App）
   把這整支貼進「擴充功能 → Apps Script」，取代舊的 Code.gs，
   然後「部署 → 管理部署 → 編輯（鉛筆）→ 版本選「新增」→ 部署」，
   網址不變（common.js 的 SHEET_API 不用改）。存取權：「任何人」。

   分頁名稱在 TABS；欄位標題（中文/英文）對照在 COLS，讀寫都吃這張表，
   所以你的分頁維持中文欄名也能用。

   ── 天麗共訓營 (tenlead-1) 在檔尾自成一區「██ 天麗變現共訓營 ██」，
      單一真相＝TENLEAD_TASKS / TENLEAD_HONORS / TENLEAD_TEAMS。
   ═══════════════════════════════════════════════════════════ */

var SS_ID = "";  // 留空＝用這支腳本所綁定的試算表；若腳本是獨立的，填試算表 ID

var TABS = {
  students:    "(遊戲)開通名單",       // 人主檔（含身份+開通）：LINE userId | 姓名 | 團隊 | 各課開通欄
  workshops:   "(設定)課程",           // workshopId | name | active（跑 setup() 自動建立/覆蓋，不用手動匯入 CSV）
  tasks:       "(設定)任務",           // workshopId | taskKey | cadence | dim | muscle | pts | name | icon | needReview（跑 setup() 自動建立/覆蓋）
  evals:       "(遊戲)體測紀錄",       // v2 小肌群 1–5：LINE userId | 小肌群 | 分數 | 來源 | 日期 | 週次（程式自動建立）
  honors:      "(設定)榮譽品項",       // 各 workshop 專屬榮譽：workshopId | honorId | metric | value | icon | name | desc | tier | celebrate | scope
  honorEvents: "(遊戲)榮譽事件",       // 榮譽解鎖事件流（首頁他人快閃用；程式自動建立/去重）：lineId | 姓名 | honorId | 榮譽名 | icon | 時間 | ts
  enrollments: "(遊戲)開通名單",       // 與學員名單合併為同一張：每門課一欄，欄名＝workshopId，格子打勾＝開通
  checkins:    "(遊戲)打卡紀錄",       // LINE userId | 任務key | 類型 | 維度 | 分數 | 日期（+ 課程）
  revenue:     "(遊戲)成交紀錄",       // LINE userId | 金額 | 日期 | 備註 | 吸引/信任/專業/推進肌肉（+ 課程）
  quiz:        "(漏斗)能力測驗",       // 自評來源（comconverttest 寫入）：LINE userId + ATPI 分數
  rewards:     "(設定)兌換品項",       // 代幣可兌換的獎勵（各 workshop 共用一個代幣錢包）：rewardId | name | desc | cost | value | icon | active
  redemptions: "(遊戲)兌換紀錄",       // 兌換申請（需人工審核）：LINE userId | 姓名 | rewardId | 名稱 | 代幣 | 申請時間 | 狀態
  pending:     "(遊戲)待審核"          // 作業繳交待審核：繳交時間 | LINE userId | 姓名 | 課程 | 任務key | 任務名 | 維度 | 分數 | 檔案連結 | 通過(勾) | 狀態
};

/* 每個邏輯欄位 → 可能的實際標題（中英文都列，讀寫都靠這張表對齊）。
   ⚠️ 2026-08-28 正典：四維正式名＝「吸引／信任／專業／推進肌肉」，「〇〇力」作廢。
      但這張表比對的是「試算表分頁的實際標題」——線上分頁目前仍是舊標題，
      所以是「新名擺前面、舊名保留在後」的加法，兩種標題都讀得到、也寫得進去。
      等分頁標題改成肌肉版之後，才可以把「〇〇力」／「影響力」從別名裡拿掉。 */
var COLS = {
  /* paidMember＝手動勾選欄「溝通健身房會員」（誰付了 99），2026-09-01 起用來區分
     member.html 的體驗客／會員內容。欄位在「(遊戲)開通名單」姓名跟團隊中間，人工維護，
     跟課程開通欄（workshopId 那些）是不同性質的旗標，不會被 computeConfig_() 的課程掃描讀到。 */
  students: { lineId:["LINE userId","lineId"], name:["姓名","LINE名稱","name"], team:["團隊","team"],
              paidMember:["溝通健身房會員","paidMember"] },
  enroll:   { lineId:["LINE userId","lineId"], workshopId:["課程","workshopId"] },
  checkins: { lineId:["LINE userId","lineId"], workshopId:["課程","workshopId"], taskKey:["任務key","taskKey"],
              cadence:["類型","cadence"], dim:["維度","dim"], pts:["分數","pts"], date:["日期","date"],
              /* v2：小肌群層＋會員模式的開練紀錄（都可空，舊列不受影響） */
              muscle:["小肌群","muscle"], reaction:["對方反應","reaction"],
              target:["對象","target"], rel:["關係","rel"], note:["發生什麼","note"],
              /* share＝「分享到館裡」勾選（v9 補死碼：以前前端有勾選、這裡沒欄位接） */
              share:["分享到館裡","share"] },
  /* v2 體測：小肌群 1–5 評分。source＝quiz(測驗基線)／self(週測自評)／coach(教練校準) */
  evals:    { lineId:["LINE userId","lineId"], muscle:["小肌群","muscle"], score:["分數","score"],
              source:["來源","source"], date:["日期","date"], week:["週次","week"] },
  revenue:  { lineId:["LINE userId","lineId"], workshopId:["課程","workshopId"], amount:["金額","amount"],
              date:["日期","date"], note:["備註","note"],
              A:["吸引肌肉","吸引力","A"], T:["信任肌肉","信任力","T"],
              P:["專業肌肉","專業力","P"], I:["推進肌肉","推進力","I"] },
  quiz:     { lineId:["LINE userId","userId","lineId"],
              A:["吸引肌肉","吸引力","scoreA","A"], T:["信任肌肉","信任力","scoreT","T"],
              P:["專業肌肉","專業力","scoreP","P"], I:["推進肌肉","推進力","影響力","scoreI","I"] },
  /* 寫入用（comconverttest 測驗送來）：對齊「(引流.A)能力測驗」分頁的所有欄位。
     ⚠️ 2026-09-01 補齊兩組一直在寫、但這張表沒有對應欄位所以被整批丟棄的資料——
        ① 情境座標五欄（105504b 那次 commit 就開始送了，字典 G4「分數脫離對象無法判讀」靠它）
        ② 年收目標 goalIncome、客戶來源 customerSource
        沒有欄位的欄名 setup()／migrateQuizCols() 會自動補上，跑一次就好。
     ⭐ Q1..Q12 改對位：測驗改成 12 小肌群之後，Q1..Q12 ＝ A1..I3 的 1–5 原始分（照 MORD 順序）。
        舊版是「Q1 其實是 GOAL 題、Q2 起才是能力題」，而且只收 12 格 → I 第三題/SRC/INC 被截掉。
        ⚠️ 2026-09-01 之前的舊列，Q1..Q12 是舊語意，跟新列不可混著比。 */
  quizWrite:{ time:["時間","timestamp"], lineId:["LINE userId","userId","lineId"], displayName:["LINE名稱","displayName"],
              pictureUrl:["頭像","pictureUrl"], name:["姓名","name"], email:["Email","email"], job:["職業","job"],
              A:["吸引肌肉","吸引力","scoreA","A"], T:["信任肌肉","信任力","scoreT","T"],
              P:["專業肌肉","專業力","scoreP","P"], I:["推進肌肉","推進力","影響力","scoreI","I"],
              income:["收入等級","incomeLevel"], goalIncome:["年收目標","goalIncome"],
              customerSource:["客戶來源","customerSource"],
              mainAbility:["主能力"], subAbility:["副能力"],
              /* 情境座標（G4）：不進計分，只判讀「這組分數是對誰的分數」 */
              targetContext:["對象情境","targetContext"], targetDistance:["對象關係","targetDistance"],
              targetRank:["對象位階","targetRank"], targetNeed:["對象需求","targetNeed"],
              targetKeyMuscle:["情境最吃哪塊","targetKeyMuscle"],
              /* Q1..Q12 ＝ 12 小肌群 A1..I3 的 1–5 原始分（別名寫在後面，之後改標題也讀得到） */
              Q1:["Q1","A1"], Q2:["Q2","A2"], Q3:["Q3","A3"], Q4:["Q4","T1"], Q5:["Q5","T2"], Q6:["Q6","T3"],
              Q7:["Q7","P1"], Q8:["Q8","P2"], Q9:["Q9","P3"], Q10:["Q10","I1"], Q11:["Q11","I2"], Q12:["Q12","I3"] }
};

/* 測驗分頁補欄位（可重複執行，已存在就跳過）。改完 COLS.quizWrite 之後在編輯器跑一次。
   ⚠️ 只補欄名，不動既有資料；補完之後 comconverttest 送來的情境座標才寫得進去。 */
function migrateQuizCols() {
  ["年收目標", "客戶來源", "對象情境", "對象關係", "對象位階", "對象需求", "情境最吃哪塊"]
    .forEach(function(h){ ensureColumn_(TABS.quiz, h); });
  for (var i = 1; i <= 12; i++) ensureColumn_(TABS.quiz, "Q" + i);
  evalSheet_();  // 順便確保「(遊戲)體測紀錄」存在——測驗的 action:"eval" 要寫進去
  Logger.log("完成：測驗分頁欄位已補齊，體測分頁已就緒。");
}

function ss_() { return SS_ID ? SpreadsheetApp.openById(SS_ID) : SpreadsheetApp.getActiveSpreadsheet(); }

/* ── 把所有 TRUE/FALSE 欄轉成核取方塊(checkbox)，並把開通名單課程欄也設成 checkbox。
   在編輯器選 checkboxifyBooleans → 執行。之後打勾＝TRUE、沒打勾＝FALSE，程式判斷不受影響。 */
function checkboxifyBooleans() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var rule = SpreadsheetApp.newDataValidation().requireCheckbox().build();
  ss.getSheets().forEach(function(sh) {
    var lastRow = sh.getLastRow(), lastCol = sh.getLastColumn();
    if (lastRow < 2 || lastCol < 1) return;
    var vals = sh.getRange(1, 1, lastRow, lastCol).getValues();
    for (var c = 0; c < lastCol; c++) {
      var hasBool = false, ok = true;
      for (var r = 1; r < lastRow; r++) {
        var v = vals[r][c];
        if (v === "" || v === null) continue;
        if (v === true || v === false) { hasBool = true; }
        else { var u = String(v).trim().toUpperCase(); if (u === "TRUE" || u === "FALSE") hasBool = true; else { ok = false; break; } }
      }
      if (hasBool && ok) { applyCheckbox_(sh, 2, c + 1, lastRow - 1, rule); Logger.log("☑ %s 第%s欄（%s）", sh.getName(), c + 1, vals[0][c]); }
    }
  });
  // 開通名單：課程欄（第4欄 workshopId「一階」＝鍛鍊段 L1–L4 起）即使空白也設成 checkbox，方便打勾開通
  var roster = ss.getSheetByName(TABS.students);
  if (roster && roster.getLastRow() >= 2 && roster.getLastColumn() > 3) {
    applyCheckbox_(roster, 2, 4, roster.getLastRow() - 1, rule);
    Logger.log("☑ %s 課程欄(第4欄起)設為 checkbox", TABS.students);
  }
  Logger.log("完成。");
}
function applyCheckbox_(sh, row, col, numRows, rule) {
  var rng = sh.getRange(row, col, numRows, 1);
  rng.setDataValidation(rule);
  var cur = rng.getValues(), changed = false;
  for (var i = 0; i < cur.length; i++) {
    var cv = cur[i][0];
    if (typeof cv === "string") { var u = cv.trim().toUpperCase(); if (u === "TRUE") { cur[i][0] = true; changed = true; } else if (u === "FALSE") { cur[i][0] = false; changed = true; } }
  }
  if (changed) rng.setValues(cur);
}

/* ── 診斷：唯讀。看「能力測驗」分頁有沒有 userId 空白的列（＝在 LINE 外做測驗、抓不到身份）。 */
function auditQuizRows() {
  var rs = rows_(TABS.quiz);
  var empty = 0, ok = 0, samples = [];
  rs.forEach(function(r) {
    var uid = String(pick_(r, COLS.quiz.lineId) || "").trim();
    if (uid) ok++; else empty++;
    if (samples.length < 12) samples.push((uid ? "有id" : "❌空") + " | " + String(r["時間"] || "") + " | " + String(r["姓名"] || "") + " | " + String(r["職業"] || ""));
  });
  Logger.log("能力測驗共 %s 列：有 userId %s、空白 userId %s", rs.length, ok, empty);
  Logger.log("─────────────");
  samples.forEach(function(s){ Logger.log(s); });
}

/* ── 稽核：唯讀。列出每個分頁的標題列 / 列數 / 欄數，印到執行記錄。
   在編輯器選 auditTabs → 執行，把「執行記錄」內容貼回來即可（不會改任何資料）。 */
function auditTabs() {
  var ss = ss_();
  var sheets = ss.getSheets();
  Logger.log("試算表：%s（共 %s 個分頁）", ss.getName(), sheets.length);
  Logger.log("─────────────────────────────────────────");
  sheets.forEach(function(sh) {
    var lastRow = sh.getLastRow();
    var lastCol = sh.getLastColumn();
    var dataRows = Math.max(0, lastRow - 1);  // 扣掉標題列
    var headers = lastCol > 0 && lastRow > 0
      ? sh.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h){ return String(h).trim(); })
      : [];
    Logger.log("【%s】資料列數=%s，欄數=%s\n  標題：%s", sh.getName(), dataRows, lastCol, headers.join(" | "));
  });
}

/* ── 廢欄清理：執行前先自動複製「整份備份」到雲端硬碟，再刪指定廢欄。
   在編輯器選 cleanupDeadColumns → 執行。備份網址會印在執行記錄，出事可還原。
   清理內容：
     ①(遊戲)學員名單：刪 出席/社群分享/作業/團隊賽（已不計分）
     ②(引流.A)機器人對話紀錄：刪尾端空標題欄（bot 只寫前 5 欄）
     ③(引流.A)能力測驗：刪尾端空標題欄 */
function cleanupDeadColumns() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd-HHmm");
  var backup = ss.copy("溝通變現資料 備份 " + stamp);
  Logger.log("✅ 已建立整份備份：%s", backup.getName());
  Logger.log("   備份網址：%s", backup.getUrl());
  Logger.log("─────────────────────────────");
  deleteColsByHeader_(ss, "(遊戲)學員名單", ["出席", "社群分享", "作業", "團隊賽"]);
  deleteTrailingEmptyCols_(ss, "(漏斗)對話紀錄");
  deleteTrailingEmptyCols_(ss, "(漏斗)能力測驗");
  Logger.log("─────────────────────────────");
  Logger.log("完成。請開 dashboard 與各 bot 確認正常；有問題就用上面的備份還原。");
}

/* 依標題名刪欄（由右往左刪避免索引位移；找不到的標題略過）。 */
function deleteColsByHeader_(ss, tab, names) {
  var sh = ss.getSheetByName(tab);
  if (!sh) { Logger.log("跳過(找不到分頁)：%s", tab); return; }
  var headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(function(h){ return String(h).trim(); });
  var idxs = [];
  names.forEach(function(n){ var i = headers.indexOf(n); if (i > -1) idxs.push(i + 1); });
  idxs.sort(function(a, b){ return b - a; }).forEach(function(c){ sh.deleteColumn(c); });
  Logger.log("【%s】刪除欄：%s（實刪 %s 欄）", tab, names.join("/"), idxs.length);
}

/* ── 合併「學員名單」進「開通名單」成單一人主檔（設計B：留開通名單、刪學員名單）。
   因現有為假資料，直接清空重建表頭、不搬資料。跑前先整份備份；跑完刪掉「(遊戲)學員名單」。
   之後 TABS.students / TABS.enrollments 都指向 (遊戲)開通名單。在編輯器選 mergeRoster → 執行。 */
function mergeRoster() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd-HHmm");
  var backup = ss.copy("溝通變現資料 備份 " + stamp);
  Logger.log("✅ 已備份：%s", backup.getUrl());

  var roster = ss.getSheetByName("(遊戲)開通名單");
  if (!roster) { Logger.log("中止：找不到 (遊戲)開通名單"); return; }
  // 補上原本只在學員名單的「團隊」欄，成為單一人主檔（身份+開通）
  var headers = ["LINE userId", "姓名", "團隊", "一階", "二階", "三階", "1v1顧問實戰", "主持人實戰", "短影音實戰"];
  roster.clear();
  roster.getRange(1, 1, 1, headers.length).setValues([headers]);
  Logger.log("已清空假資料並重建表頭（%s 欄）：%s", headers.length, headers.join(" | "));

  var stu = ss.getSheetByName("(遊戲)學員名單");
  if (stu) { ss.deleteSheet(stu); Logger.log("已刪除 (遊戲)學員名單（已併入開通名單）"); }
  else Logger.log("（找不到 (遊戲)學員名單，略過刪除）");
  Logger.log("完成。記得重新部署課程 Code.gs（TABS 已指向開通名單）。");
}

/* ── 全清資料：清掉每個分頁的資料列（保留標題列），含漏斗名單與機器人紀錄。
   ⚠️ 預設保護 (設定)* 四張（課程/任務/榮譽品項/兌換品項）——那是遊戲設定檔，清了 dashboard 會壞。
   用 clearContent 保留標題與核取方塊格式。跑前先整份備份。在編輯器選 resetAllData → 執行。 */
function resetAllData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd-HHmm");
  var backup = ss.copy("溝通變現資料 備份(清空前) " + stamp);
  Logger.log("✅ 已備份：%s", backup.getUrl());
  Logger.log("─────────────────────────────");
  var protectTabs = ["(設定)課程", "(設定)任務", "(設定)榮譽品項", "(設定)兌換品項"];
  ss.getSheets().forEach(function(sh) {
    var name = sh.getName();
    if (protectTabs.indexOf(name) > -1) { Logger.log("🛡️ 保留(設定表)：%s", name); return; }
    var lastRow = sh.getLastRow(), lastCol = sh.getLastColumn();
    if (lastRow > 1 && lastCol > 0) {
      sh.getRange(2, 1, lastRow - 1, lastCol).clearContent();
      Logger.log("🧹 清空【%s】%s 列（保留標題）", name, lastRow - 1);
    } else {
      Logger.log("－【%s】本來就沒資料", name);
    }
  });
  Logger.log("─────────────────────────────");
  Logger.log("完成。設定表已保留；漏斗/機器人/遊戲紀錄全清，標題與核取方塊保留。");
}

/* ── 一次改名 + 重排 16 個分頁。在編輯器選 reorderRenameTabs → 執行。
   ⚠️ 跑之前務必已把 5 支 bot 的分頁名常數改好、並準備好重新部署，
      否則舊版 bot 找不到新名分頁時會用舊名重建一個空分頁。 */
function reorderRenameTabs() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var renames = [
    ["(引流.A)能力測驗", "(漏斗)能力測驗"],
    ["(引流.T)變現診斷總表", "(漏斗)變現診斷"],
    ["(引流.A)Line OA 5題分流", "(漏斗)OA五題分流"],
    ["(引流.T)課程報名紀錄", "(漏斗)課程報名"],
    ["(引流.A)OA內行為記錄", "(漏斗)OA行為"],
    ["(引流.A)機器人對話紀錄", "(漏斗)對話紀錄"],
    ["(遊戲)代幣兌換紀錄", "(遊戲)兌換紀錄"],
    ["(遊戲)課程", "(設定)課程"],
    ["(遊戲)任務", "(設定)任務"],
    ["(遊戲)榮譽", "(設定)榮譽品項"],
    ["(遊戲)兌換品項", "(設定)兌換品項"]
  ];
  renames.forEach(function(pair) {
    var oldName = pair[0], newName = pair[1];
    var sh = ss.getSheetByName(oldName);
    if (!sh) { Logger.log("跳過(找不到)：%s", oldName); return; }
    if (ss.getSheetByName(newName)) { Logger.log("⚠️ 目標已存在，跳過：%s → %s", oldName, newName); return; }
    sh.setName(newName);
    Logger.log("改名：%s → %s", oldName, newName);
  });
  var order = [
    "(漏斗)能力測驗", "(漏斗)變現診斷", "(漏斗)OA五題分流", "(漏斗)課程報名", "(漏斗)OA行為", "(漏斗)對話紀錄",
    "(遊戲)開通名單", "(遊戲)打卡紀錄", "(遊戲)成交紀錄", "(遊戲)榮譽事件", "(遊戲)兌換紀錄",
    "(設定)課程", "(設定)任務", "(設定)榮譽品項", "(設定)兌換品項"
  ];
  order.forEach(function(name, i) {
    var sh = ss.getSheetByName(name);
    if (sh) { ss.setActiveSheet(sh); ss.moveActiveSheet(i + 1); }
    else Logger.log("排序時找不到：%s", name);
  });
  Logger.log("─────────────────────────────");
  Logger.log("完成改名+重排。接著：重新部署課程 Code.gs，並重啟/重部署 5 支 bot。");
}

/* 從最右往左，刪掉「標題為空」的欄，遇到有標題的欄就停。 */
function deleteTrailingEmptyCols_(ss, tab) {
  var sh = ss.getSheetByName(tab);
  if (!sh) { Logger.log("跳過(找不到分頁)：%s", tab); return; }
  var last = sh.getLastColumn();
  var headers = sh.getRange(1, 1, 1, last).getValues()[0];
  var c = last, removed = 0;
  while (c >= 1 && String(headers[c - 1]).trim() === "") { sh.deleteColumn(c); c--; removed++; }
  Logger.log("【%s】刪除尾端空欄 %s 個（保留至第 %s 欄）", tab, removed, c);
}

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

/* 同 appendMapped_，但依 keyField 找既有列：找到就更新那一列、找不到才新增。用於一人一列（測驗可重送不重複）。 */
function upsertMapped_(tab, colmap, keyField, values) {
  var sh = ss_().getSheetByName(tab);
  if (!sh) throw new Error("找不到分頁：" + tab);
  var lastRow = sh.getLastRow(), lastCol = sh.getLastColumn();
  var headers = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h){ return String(h).trim(); });
  var line = headers.map(function(h) {
    for (var f in values) if (colmap[f] && colmap[f].indexOf(h) > -1) return values[f];
    return "";
  });
  var keyAliases = colmap[keyField] || [];
  var keyCol = -1;
  for (var c = 0; c < headers.length; c++) if (keyAliases.indexOf(headers[c]) > -1) { keyCol = c; break; }
  var keyVal = values[keyField];
  if (keyCol > -1 && lastRow > 1 && keyVal !== undefined && keyVal !== "") {
    var colVals = sh.getRange(2, keyCol + 1, lastRow - 1, 1).getValues();
    for (var i = 0; i < colVals.length; i++) {
      if (String(colVals[i][0]) === String(keyVal)) {
        sh.getRange(i + 2, 1, 1, line.length).setValues([line]);
        return "updated";
      }
    }
  }
  sh.appendRow(line);
  return "appended";
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* ── Kit (ConvertKit) 電子報串接 ──────────────────────────────
   把測驗名單（有 email 的）同步進 Kit：先 upsert 訂閱者（帶姓名＋ATPI 自訂欄），
   再打上一個 tag（＝進哪份電子報／區隔）。任何失敗只記 log，不影響寫入 Sheet。

   設定：Apps Script →「專案設定 → 指令碼屬性」新增兩把：
     KIT_API_KEY = 你的 Kit v4 API Key（Kit 後台 Settings → Advanced → API）
     KIT_TAG_ID  = 要打的 tag id（Kit 後台 Grow → Tags；沒填就只建訂閱者不分區）
   沒設 KIT_API_KEY 時整段直接跳過（本地/未上線不會噴錯）。 */
function addToKit_(email, firstName, fields) {
  try {
    email = String(email || "").trim();
    if (!email || email.indexOf("@") < 0) return;                    // 沒 email（純 LINE 用戶）就跳過
    var props = PropertiesService.getScriptProperties();
    var apiKey = props.getProperty("KIT_API_KEY");
    if (!apiKey) return;                                             // 未設定＝不串
    var tagId = props.getProperty("KIT_TAG_ID");
    var headers = { "X-Kit-Api-Key": apiKey };

    // 1) upsert 訂閱者（同 email 會更新，不會重複）
    var subBody = { email_address: email };
    if (firstName) subBody.first_name = String(firstName);
    if (fields && Object.keys(fields).length) subBody.fields = fields;
    var r1 = UrlFetchApp.fetch("https://api.kit.com/v4/subscribers", {
      method: "post", contentType: "application/json",
      headers: headers, payload: JSON.stringify(subBody), muteHttpExceptions: true
    });
    if (r1.getResponseCode() >= 300)
      Logger.log("Kit subscriber 失敗 " + r1.getResponseCode() + ": " + r1.getContentText());

    // 2) 打 tag（＝訂閱到某份電子報／區隔）
    if (tagId) {
      var r2 = UrlFetchApp.fetch("https://api.kit.com/v4/tags/" + tagId + "/subscribers", {
        method: "post", contentType: "application/json",
        headers: headers, payload: JSON.stringify({ email_address: email }), muteHttpExceptions: true
      });
      if (r2.getResponseCode() >= 300)
        Logger.log("Kit tag 失敗 " + r2.getResponseCode() + ": " + r2.getContentText());
    }
  } catch (kerr) {
    Logger.log("Kit 串接例外: " + kerr);                            // 絕不讓 Kit 影響主流程
  }
}

/* 測驗完自動在開通名單(=人主檔)建一列：只填 userId/姓名，團隊與各課開通欄留空（＝未開通）。
   已存在同 userId 就不動，避免重複。 */
function ensureRosterRow_(lineId, name) {
  if (!lineId) return;
  var sh = ss_().getSheetByName(TABS.students);
  if (!sh) return;
  var existing = rows_(TABS.students);
  for (var i = 0; i < existing.length; i++) {
    if (String(pick_(existing[i], COLS.students.lineId)) === lineId) return;  // 已在名單，不重複
  }
  appendMapped_(TABS.students, { lineId: COLS.students.lineId, name: COLS.students.name },
                { lineId: lineId, name: name || "" });
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
    if (id === uid) st = { lineId: id, name: String(pick_(r, COLS.students.name)) || id, team: String(pick_(r, COLS.students.team)),
                            paidMember: granted_(pick_(r, COLS.students.paidMember)) };
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
             dim: String(r.dim || ""), muscle: String(r.muscle || r["小肌群"] || ""),
             pts: Number(r.pts) || 0, name: String(r.name || ""), icon: String(r.icon || ""),
             needReview: truthy_(r.needReview), desc: String(r.desc || ""), locked: truthy_(r.locked) };
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

/* ── 代幣兌換：跨所有 workshop 共用一個錢包（比照 ATPI 是「人」的屬性）──
   代幣天花板 = 該生已開通的每個 workshop「一次性任務」(cadence=once/special) 滿分加總，
   避免每日/每週這種可無限重複打的任務把代幣灌爆（浮濫）。 */
function computeRewards_() {
  return rows_(TABS.rewards)
    .filter(function(r){ return r.active === "" || r.active === undefined || truthy_(r.active); })
    .map(function(r){
      return { rewardId: String(r.rewardId || r.id || ""), name: String(r.name || ""), desc: String(r.desc || ""),
               cost: Number(r.cost) || 0, value: String(r.value || ""), icon: String(r.icon || "") };
    }).filter(function(r){ return r.rewardId && r.name; });
}
function computeTokenBalance_(uid) {
  var cfg = computeConfig_();
  var enrolledWids = cfg.enrollments.filter(function(e){ return e.lineId === uid; }).map(function(e){ return e.workshopId; });
  var ceiling = 0;
  cfg.tasks.forEach(function(t){
    if ((t.cadence === "once" || t.cadence === "special") && enrolledWids.indexOf(t.workshopId) > -1) ceiling += t.pts;
  });
  var earnedRaw = 0;
  rows_(TABS.checkins).forEach(function(r){
    if (String(pick_(r, COLS.checkins.lineId)) === uid) earnedRaw += Number(pick_(r, COLS.checkins.pts)) || 0;
  });
  var earned = Math.min(earnedRaw, ceiling);
  var spent = 0;
  rows_(TABS.redemptions).forEach(function(r){
    var rid = String(r["LINE userId"] || r.lineId || "");
    var status = String(r["狀態"] || r.status || "");
    if (rid === uid && status !== "已拒絕") spent += Number(r["代幣"] || r.cost) || 0;
  });
  return { ceiling: ceiling, earned: earned, spent: spent, balance: Math.max(0, earned - spent) };
}
/* 兌換紀錄表不存在就自動建立（含表頭）。 */
function ensureRedemptionSheet_() {
  var ss = ss_();
  var sh = ss.getSheetByName(TABS.redemptions);
  if (!sh) {
    sh = ss.insertSheet(TABS.redemptions);
    sh.getRange(1, 1, 1, 7).setValues([["LINE userId", "姓名", "rewardId", "名稱", "代幣", "申請時間", "狀態"]]);
  }
  return sh;
}
/* 該生的兌換紀錄（給前端顯示「待審核／已核准」狀態用）。 */
function computeRedemptions_(uid) {
  return rows_(TABS.redemptions).filter(function(r){ return String(r["LINE userId"] || r.lineId || "") === uid; }).map(function(r){
    return { rewardId: String(r.rewardId || ""), name: String(r["名稱"] || r.name || ""), cost: Number(r["代幣"] || r.cost) || 0,
             date: String(r["申請時間"] || r.date || ""), status: String(r["狀態"] || r.status || "") };
  });
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
/* 「館」動態流的真資料——補 §9/A5 標記的死碼：REC.share 以前只有前端切換，
   從沒送到後端也沒欄位可讀。這裡只回傳 share=true 且有 reaction 的最近幾筆，
   對象一律匿名（只回 rel 關係類型，不回 target 姓名）——分享到館裡分享的是
   「我做了什麼」，不是把別人的名字公開給陌生人看。 */
function computeGymPosts_(limit) {
  limit = limit || 12;
  var nameByUid = {};
  rows_(TABS.students).forEach(function(r){
    var id = String(pick_(r, COLS.students.lineId));
    if (id) nameByUid[id] = String(pick_(r, COLS.students.name)) || id;
  });
  var rows = rows_(TABS.checkins).filter(function(r){
    return granted_(pick_(r, COLS.checkins.share)) && String(pick_(r, COLS.checkins.reaction) || "");
  }).map(function(r){
    var mk = String(pick_(r, COLS.checkins.muscle) || "").toUpperCase();
    return {
      lineId: String(pick_(r, COLS.checkins.lineId)),
      muscle: mk, dim: String(pick_(r, COLS.checkins.dim) || ""),
      rel: String(pick_(r, COLS.checkins.rel) || ""),
      reaction: String(pick_(r, COLS.checkins.reaction) || ""),
      note: String(pick_(r, COLS.checkins.note) || ""),
      date: normDateStr_(pick_(r, COLS.checkins.date))
    };
  }).filter(function(e){ return e.lineId && e.date; });
  rows.sort(function(a, b){ return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
  return rows.slice(0, limit).map(function(e){
    return { name: nameByUid[e.lineId] || "夥伴", muscle: e.muscle, dim: e.dim,
             rel: e.rel, reaction: e.reaction, note: e.note, date: e.date };
  });
}
/* 純點擊那層（沒勾分享的開練）——夥伴頁一行小卡用，沒人打字這頁照樣會動。
   這層沒經過「分享到館裡」的同意，只露不涉內容的最小資訊：
   名字＋肌肉＋反應＋日期，不回 note/target/rel。 */
function computeGymSlim_(limit) {
  limit = limit || 8;
  var nameByUid = {};
  rows_(TABS.students).forEach(function(r){
    var id = String(pick_(r, COLS.students.lineId));
    if (id) nameByUid[id] = String(pick_(r, COLS.students.name)) || id;
  });
  var rows = rows_(TABS.checkins).filter(function(r){
    return String(pick_(r, COLS.checkins.reaction) || "") && !granted_(pick_(r, COLS.checkins.share));
  }).map(function(r){
    return { lineId: String(pick_(r, COLS.checkins.lineId)),
             muscle: String(pick_(r, COLS.checkins.muscle) || "").toUpperCase(),
             dim: String(pick_(r, COLS.checkins.dim) || ""),
             reaction: String(pick_(r, COLS.checkins.reaction) || ""),
             date: normDateStr_(pick_(r, COLS.checkins.date)) };
  }).filter(function(e){ return e.lineId && e.date; });
  rows.sort(function(a, b){ return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
  return rows.slice(0, limit).map(function(e){
    return { name: nameByUid[e.lineId] || "夥伴", muscle: e.muscle, dim: e.dim,
             reaction: e.reaction, date: e.date };
  });
}
/* 全館本月統計——夥伴頁 hero「這個月，大家一起練了 N 次」＋共同焦點
   「這個月大家練最多的是 X」用（2026-09-04）。算全部打卡不分 share；
   只回數字與肌肉代號，不回內容，沒有隱私問題。 */
function monthStats_() {
  var ym = normDateStr_(new Date()).slice(0, 7);
  var total = 0, people = {}, byMuscle = {}, dimOf = {};
  rows_(TABS.checkins).forEach(function(r){
    if (normDateStr_(pick_(r, COLS.checkins.date)).slice(0, 7) !== ym) return;
    total++;
    var uid = String(pick_(r, COLS.checkins.lineId) || "");
    if (uid) people[uid] = 1;
    var mk = String(pick_(r, COLS.checkins.muscle) || "").toUpperCase().split(",")[0].trim();
    if (mk) { byMuscle[mk] = (byMuscle[mk] || 0) + 1; dimOf[mk] = String(pick_(r, COLS.checkins.dim) || ""); }
  });
  var top = Object.keys(byMuscle).sort(function(a, b){ return byMuscle[b] - byMuscle[a]; })[0] || "";
  return { total: total, people: Object.keys(people).length,
           topMuscle: top, topDim: top ? (dimOf[top] || top.charAt(0)) : "" };
}
function computeLogs_(uid) {
  var checkins = rows_(TABS.checkins).filter(function(r){ return String(pick_(r, COLS.checkins.lineId)) === uid; }).map(function(r){
    return { workshopId: String(pick_(r, COLS.checkins.workshopId)), taskKey: String(pick_(r, COLS.checkins.taskKey)),
             cadence: String(pick_(r, COLS.checkins.cadence) || "daily"), dim: String(pick_(r, COLS.checkins.dim)),
             muscle: String(pick_(r, COLS.checkins.muscle) || ""),
             pts: Number(pick_(r, COLS.checkins.pts)) || 0, date: pick_(r, COLS.checkins.date),
             reaction: String(pick_(r, COLS.checkins.reaction) || ""),
             target: String(pick_(r, COLS.checkins.target) || ""),
             rel: String(pick_(r, COLS.checkins.rel) || ""),
             note: String(pick_(r, COLS.checkins.note) || "") };
  });
  var revenue = rows_(TABS.revenue).filter(function(r){ return String(pick_(r, COLS.revenue.lineId)) === uid; }).map(function(r){
    return { workshopId: String(pick_(r, COLS.revenue.workshopId)), amount: Number(pick_(r, COLS.revenue.amount)) || 0,
             date: pick_(r, COLS.revenue.date), note: String(pick_(r, COLS.revenue.note)),
             A: Number(pick_(r, COLS.revenue.A)) || 0, T: Number(pick_(r, COLS.revenue.T)) || 0,
             P: Number(pick_(r, COLS.revenue.P)) || 0, I: Number(pick_(r, COLS.revenue.I)) || 0 };
  });
  return { checkins: checkins, revenue: revenue, evals: computeEvals_(uid) };
}
/* v2 體測紀錄（小肌群 1–5）。分頁不存在就回空陣列——舊試算表不跑 migrate 也不會壞。 */
function computeEvals_(uid) {
  var ss = ss_();
  if (!ss.getSheetByName(TABS.evals)) return [];
  return rows_(TABS.evals).filter(function(r){ return String(pick_(r, COLS.evals.lineId)) === uid; }).map(function(r){
    return { muscle: String(pick_(r, COLS.evals.muscle) || "").toUpperCase(),
             score: Number(pick_(r, COLS.evals.score)) || 0,
             source: String(pick_(r, COLS.evals.source) || "self"),
             date: normDateStr_(pick_(r, COLS.evals.date)),
             week: String(pick_(r, COLS.evals.week) || "") };
  }).filter(function(e){ return e.muscle && e.score >= 1 && e.score <= 5; });
}
/* 體測分頁：不存在就建（標題對齊 COLS.evals 的中文欄名）。 */
function evalSheet_() {
  var ss = ss_(), sh = ss.getSheetByName(TABS.evals);
  if (!sh) {
    sh = ss.insertSheet(TABS.evals);
    sh.getRange(1, 1, 1, 6).setValues([["LINE userId", "小肌群", "分數", "來源", "日期", "週次"]]);
  }
  return sh;
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
      // enrolled = 該 userId 至少開通一門課（進遊戲的閘門）；由合併後學員名單的課程欄判斷
      var enrolledSet = {};
      computeConfig_().enrollments.forEach(function(en){ enrolledSet[en.lineId] = true; });
      var students = rows_(TABS.students).map(function(r) {
        var id = String(pick_(r, COLS.students.lineId));
        return { lineId: id, name: String(pick_(r, COLS.students.name)), team: String(pick_(r, COLS.students.team)),
                 enrolled: !!enrolledSet[id], paidMember: granted_(pick_(r, COLS.students.paidMember)) };
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
                     checkins: blogs.checkins, revenue: blogs.revenue, evals: blogs.evals, selfEval: computeSelfEval_(buid),
                     defaultWorkshop: defWid, leaderboard: computeLeaderboard_(defWid), team: computeTeam_(defWid),
                     honorFeed: computeHonorFeed_(30),
                     rewards: computeRewards_(), tokenBalance: computeTokenBalance_(buid), redemptions: computeRedemptions_(buid),
                     pending: computePending_(buid) });
    }

    if (action === "logs") {
      var logs = computeLogs_(String(p.userId || ""));
      return json_({ status: "ok", checkins: logs.checkins, revenue: logs.revenue, evals: logs.evals });
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

    if (action === "gymPosts") {
      var ms = monthStats_();
      return json_({ status: "ok", posts: computeGymPosts_(Number(p.limit) || 12), slim: computeGymSlim_(8),
                     monthTotal: ms.total, monthPeople: ms.people,
                     monthTop: { muscle: ms.topMuscle, dim: ms.topDim } });
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

/* 某學員「待審核中」的作業（給前端顯示「已繳交」）。 */
function computePending_(uid) {
  var sh = ss_().getSheetByName(TABS.pending);
  if (!sh || sh.getLastRow() < 2) return [];
  return rows_(TABS.pending).filter(function(r) {
    return String(r["LINE userId"]) === uid && String(r["狀態"] || "").trim() !== "已通過";
  }).map(function(r) {
    return { workshopId: String(r["課程"] || ""), taskKey: String(r["任務key"] || "") };
  });
}

/* 待審核分頁：不存在就建、補標題與「通過」核取方塊。 */
function ensurePendingSheet_() {
  var ss = ss_();
  var sh = ss.getSheetByName(TABS.pending);
  var headers = ["繳交時間", "LINE userId", "姓名", "課程", "任務key", "任務名", "維度", "分數", "檔案連結", "通過", "狀態"];
  if (!sh) {
    sh = ss.insertSheet(TABS.pending);
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  return sh;
}

/* 一次性：在編輯器選 authorizeDrive → 執行 → 允許，授權 Drive 權限（作業上傳才會成功）。 */
function authorizeDrive() {
  var f = getSubmitFolder_();
  Logger.log("✅ Drive 已授權。作業繳交資料夾：" + f.getUrl());
}

/* 作業繳交檔案的 Drive 資料夾（不存在就建）。 */
function getSubmitFolder_() {
  var name = "作業繳交";
  var it = DriveApp.getFoldersByName(name);
  return it.hasNext() ? it.next() : DriveApp.createFolder(name);
}

/* 一次性：把缺說明的任務文案填進 (設定)任務 的 desc 欄（之後你在試算表細修即可）。 */
function fillMissingDescs() {
  var fills = {
    "二階|wk1": "主動開發一位新名單、或建立一個新連結。變現的活水來自源源不絕的新關係——每週先讓池子有新的人進來，後面才有得成交。",
    "二階|wk2": "找一位客戶或準客戶深聊一次，先別急著成交，把關係聊深。信任是深聊堆出來的，不是話術堆出來的。"
  };
  var sh = ss_().getSheetByName(TABS.tasks);
  if (!sh) { Logger.log("找不到 " + TABS.tasks); return; }
  var vals = sh.getDataRange().getValues();
  var headers = vals[0].map(function(h){ return String(h).trim(); });
  var cW = headers.indexOf("workshopId"), cK = headers.indexOf("taskKey"), cD = headers.indexOf("desc");
  if (cD < 0) { Logger.log("找不到 desc 欄"); return; }
  var n = 0;
  for (var i = 1; i < vals.length; i++) {
    var key = String(vals[i][cW]).trim() + "|" + String(vals[i][cK]).trim();
    if (fills[key] && !String(vals[i][cD]).trim()) { sh.getRange(i + 1, cD + 1).setValue(fills[key]); n++; Logger.log("填 " + key); }
  }
  Logger.log("完成，填了 " + n + " 筆");
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
    if (body.action === "checkin") {
      appendMapped_(TABS.checkins, COLS.checkins, {
        lineId: body.lineId, workshopId: body.workshopId || "", taskKey: body.taskKey,
        cadence: body.cadence || body.taskType || "daily", dim: body.dim || "",
        muscle: String(body.muscle || "").toUpperCase(), pts: body.pts || 0, date: body.date || today,
        /* v2 會員模式：低摩擦守則——這三欄全部可空，不擋打卡 */
        reaction: body.reaction || "", target: body.target || "", rel: body.rel || "", note: body.note || "",
        share: body.share ? true : false
      });
      return json_({ status: "ok" });
    }
    /* v2 體測：一次寫多筆小肌群評分。evals＝[{muscle:"A1", score:3}, ...]
       用 appendRows 一次寫，別逐列 append（大量寫入會卡「發生不明錯誤」）。 */
    if (body.action === "eval") {
      var evUid = String(body.lineId || "");
      var evList = (body.evals || []).map(function(e){
        return { muscle: String(e.muscle || "").toUpperCase(), score: Number(e.score) };
      }).filter(function(e){ return e.muscle && e.score >= 1 && e.score <= 5; });
      if (!evUid || !evList.length) return json_({ status: "error", message: "缺少 lineId 或有效的 evals" });
      var evSrc = String(body.source || "self");
      if (["quiz", "self", "coach"].indexOf(evSrc) < 0) evSrc = "self";
      var evSh = evalSheet_();
      var evDate = body.date || today, evWeek = String(body.week || "");
      evSh.getRange(evSh.getLastRow() + 1, 1, evList.length, 6).setValues(
        evList.map(function(e){ return [evUid, e.muscle, e.score, evSrc, evDate, evWeek]; })
      );
      return json_({ status: "ok", written: evList.length });
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
    if (body.action === "redeem") {  // 代幣兌換申請：伺服器端重算餘額防竄改，送出後狀態＝待審核，人工審核
      var uid = String(body.lineId || ""), rid = String(body.rewardId || "");
      var reward = computeRewards_().filter(function(r){ return r.rewardId === rid; })[0];
      if (!reward) return json_({ status: "error", message: "找不到兌換品項" });
      var bal = computeTokenBalance_(uid);
      if (bal.balance < reward.cost) return json_({ status: "error", message: "代幣不足" });
      var rst = computeStudent_(uid);
      ensureRedemptionSheet_().appendRow([
        uid, (rst ? rst.name : uid), rid, reward.name, reward.cost,
        Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm"), "待審核"
      ]);
      return json_({ status: "ok" });
    }
    if (body.action === "submit") {  // 作業繳交：三題文字（線上學習單）＋可帶檔案(base64)存 Drive，寫待審核分頁，等導師打勾通過
      var suid = String(body.userId || body.lineId || "");
      if (!suid) return json_({ status: "error", message: "missing userId" });
      var sq1 = String(body.q1 || "").trim(), sq2s = String(body.q2scene || "").trim(),
          sq2h = String(body.q2how || "").trim(), sq3 = String(body.q3 || "").trim();
      if (sq1 && sq1.replace(/\s/g, "").length < 150) return json_({ status: "error", message: "Q1 心得需至少 150 字" });
      var fileUrl = "";
      if (body.fileData) {
        try {
          var bytes = Utilities.base64Decode(body.fileData);
          var blob = Utilities.newBlob(bytes, body.mimeType || "application/octet-stream", body.filename || ("繳交_" + Date.now()));
          var f = getSubmitFolder_().createFile(blob);
          try { f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (se) {}
          fileUrl = f.getUrl();
        } catch (fe) { fileUrl = "(上傳失敗)"; }
      }
      var sst = computeStudent_(suid);
      var psh = ensurePendingSheet_();
      ["Q1 心得", "Q2 場景", "Q2 做法", "Q3 專屬題"].forEach(function(h){ ensureColumn_(TABS.pending, h); });
      psh.appendRow([
        Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm"),
        suid, (sst ? sst.name : suid), String(body.workshopId || ""), String(body.taskKey || ""),
        String(body.taskName || ""), String(body.dim || ""), Number(body.pts) || 0, fileUrl, false, "待審核"
      ]);
      /* 三題文字寫進對應標題欄（欄位可能被移動過，依標題找，不靠位置） */
      var pHeaders = psh.getRange(1, 1, 1, psh.getLastColumn()).getValues()[0].map(function(h){ return String(h).trim(); });
      var pRow = psh.getLastRow();
      var pQ = { "Q1 心得": sq1, "Q2 場景": sq2s, "Q2 做法": sq2h, "Q3 專屬題": sq3 };
      for (var ph in pQ) {
        var pc = pHeaders.indexOf(ph);
        if (pc > -1 && pQ[ph]) psh.getRange(pRow, pc + 1).setValue(pQ[ph]);
      }
      return json_({ status: "ok", fileUrl: fileUrl });
    }
    if (body.action === "quiz") {  // 測驗結果寫入（comconverttest 送來）：附加一列到「(引流.A)能力測驗」分頁
      var quid = String(body.userId || body.lineId || "");
      if (!quid) return json_({ status: "error", message: "missing userId" });
      var qvals = {
        time: body.timestamp || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
        lineId: quid, displayName: body.displayName || "", pictureUrl: body.pictureUrl || "",
        name: body.name || "", email: body.email || "", job: body.job || "",
        A: body.scoreA || 0, T: body.scoreT || 0, P: body.scoreP || 0, I: body.scoreI || 0,
        income: body.incomeLevel || "", goalIncome: body.goalIncome || "",
        customerSource: body.customerSource || "",
        mainAbility: body.mainAbility || "", subAbility: body.subAbility || "",
        /* 情境座標（G4）：測驗從 105504b 起就在送，但一直沒有欄位接，2026-09-01 補上 */
        targetContext: body.targetContext || "", targetDistance: body.targetDistance || "",
        targetRank: body.targetRank || "", targetNeed: body.targetNeed || "",
        targetKeyMuscle: body.targetKeyMuscle || ""
      };
      var qraw = String(body.rawAnswers || "").split(",");  // "3,2,4,..." → Q1..Q12 ＝ A1..I3 的 1–5
      for (var qi = 1; qi <= 12; qi++) qvals["Q" + qi] = (qraw[qi - 1] !== undefined ? qraw[qi - 1] : "");
      upsertMapped_(TABS.quiz, COLS.quizWrite, "lineId", qvals);  // 同 userId 更新那列，重測/重開不重複
      ensureRosterRow_(quid, body.name || body.displayName || "");  // 測驗完自動在開通名單建一列（課程欄留空＝未開通）
      addToKit_(body.email, body.name || body.displayName || "", {  // 同步進 Kit 電子報（有 email 才會送；失敗不影響上面寫入）
        atpi_a: body.scoreA || 0, atpi_t: body.scoreT || 0, atpi_p: body.scoreP || 0, atpi_i: body.scoreI || 0,
        main_ability: body.mainAbility || "", income_level: body.incomeLevel || "", job: body.job || ""
      });
      return json_({ status: "ok" });
    }
    return json_({ status: "error", message: "unknown action" });
  } catch (err) {
    return json_({ status: "error", message: String(err) });
  }
}

/* 簡易觸發器：導師在「(遊戲)待審核」把某列「通過」打勾 → 自動寫進打卡紀錄給分、狀態改已通過。
   不用手動安裝，存檔即生效（由編輯的人＝擁有者觸發）。 */
function onEdit(e) {
  try {
    var sh = e.range.getSheet();
    if (sh.getName() !== TABS.pending) return;
    var headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(function(h){ return String(h).trim(); });
    var passCol = headers.indexOf("通過") + 1;
    if (passCol < 1 || e.range.getColumn() !== passCol) return;
    if (e.range.getValue() !== true) return;  // 只在打勾(TRUE)時處理
    var row = e.range.getRow();
    var data = {};
    headers.forEach(function(h, i){ data[h] = sh.getRange(row, i + 1).getValue(); });
    if (String(data["狀態"]).trim() === "已通過") return;  // 已處理過就跳過
    appendMapped_(TABS.checkins, COLS.checkins, {
      lineId: data["LINE userId"], workshopId: data["課程"], taskKey: data["任務key"],
      cadence: "special", dim: data["維度"], pts: Number(data["分數"]) || 0,
      date: Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd")
    });
    var stCol = headers.indexOf("狀態") + 1;
    if (stCol > 0) sh.getRange(row, stCol).setValue("已通過");
  } catch (err) { /* onEdit 內錯誤靜默，避免卡住編輯 */ }
}

/* ═══════════════════════════════════════════════════════════
   v2 遷移：12 小肌群層。可重複執行（ensureColumn_ 已存在就跳過）。
   ① 任務分頁補「小肌群」欄（A1–I3，可留空＝只算大肌肉，舊任務不受影響）
   ② 打卡紀錄補「小肌群 / 對方反應 / 對象 / 發生什麼」四欄
   ③ 建 (遊戲)體測紀錄 分頁
   舊資料完全不用回填：沒有 muscle 的打卡列仍照 dim 計進大肌肉（前端 logMuscles_ 會回查任務池）。
   ═══════════════════════════════════════════════════════════ */
function migrateV2_() {
  ensureColumn_(TABS.tasks, "muscle");
  ["小肌群", "對方反應", "對象", "關係", "發生什麼"].forEach(function(h){ ensureColumn_(TABS.checkins, h); });
  evalSheet_();
}
/* 單獨跑遷移（不想整個 setup 重跑時用這支） */
function migrateV2() { migrateV2_(); }

/* ═══════════════════════════════════════════════════════════
   一鍵初始化：在 Apps Script 編輯器選 setup → 按「執行」一次即可。
   會自動：① 幫打卡/成交分頁補「課程」欄　② 建好 (設定)課程 / (設定)任務並填資料。
   第一次執行會跳授權，按「審查權限 → 允許」。不用再手動加欄位或匯入 CSV。
   ═══════════════════════════════════════════════════════════ */
function setup() {
  ensureColumn_(TABS.checkins, "課程");
  ensureColumn_(TABS.revenue, "課程");
  migrateV2_();
  /* ⚠️ workshopId 的「一階／二階／三階」是 Google Sheet 既有資料鍵，不能改；
        2026-08-28 正典只換「顯示名 name」，對照如下：
          一階＝鍛鍊段 L1–L4｜二階＝放大段 L5–L8｜三階＝演說段 L9–L13
        SKU：L1–L8＝超引力顧問課(3.28萬)／L1–L13＝超引力公眾演說課(10.8萬)，系列名＝超引力成交學。
     team 欄：段課程(一/二/三階)＝FALSE（中間格改顯示「愛的貨幣」、隱藏夥伴小組頁）；
     工作坊＝TRUE（戰隊才是重點）。空白視為 TRUE。 */
  writeSheet_(TABS.workshops, [
    ["workshopId", "name", "active", "team"],
    ["二階", "放大段 L5–L8", true, false],    // ← 目前定錨的正式課程，排第一＝預設落點
    ["一階", "鍛鍊段 L1–L4", true, false],    // 已開課（跑 openLevel1() 安全上線，不必重跑 setup）
    ["三階", "演說段 L9–L13", true, false],
    ["1v1顧問實戰", "工作坊-1v1顧問實戰", true, true],
    ["主持人實戰", "工作坊-1VN主持人實戰", true, true],
    ["短影音實戰", "工作坊-短影音實戰", true, true]
  ]);
  writeSheet_(TABS.tasks, TASKS_SEED);
  var e = ensureEnrollmentSheet_();
  var r = ensureRewardsSheet_();
  return "初始化完成；" + e + "；" + r;
}

/* ═══════════════════════════════════════════════════════════
   一次性：把 6 門課的顯示名稱改成正式課名，只動「name」這一欄，
   不會動到 active／team／leaderboard 等你手動設定過的欄位（跟重跑 setup() 不同，很安全）。
   在 Apps Script 選 updateWorkshopNames → 執行 一次即可，之後不用再跑。
   ═══════════════════════════════════════════════════════════ */
function updateWorkshopNames() {
  var names = {
    "一階": "鍛鍊段 L1–L4",
    "二階": "放大段 L5–L8",
    "三階": "演說段 L9–L13",
    "1v1顧問實戰": "工作坊-1v1顧問實戰",
    "主持人實戰": "工作坊-1VN主持人實戰",
    "短影音實戰": "工作坊-短影音實戰"
  };
  var sh = ss_().getSheetByName(TABS.workshops);
  if (!sh) return "找不到「" + TABS.workshops + "」分頁";
  var headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(function(h){ return String(h).trim(); });
  var idCol = headers.indexOf("workshopId") + 1;
  var nameCol = headers.indexOf("name") + 1;
  if (idCol < 1 || nameCol < 1) return "找不到 workshopId 或 name 欄位";
  var lastRow = sh.getLastRow();
  var updated = 0;
  for (var r = 2; r <= lastRow; r++) {
    var wid = String(sh.getRange(r, idCol).getValue()).trim();
    if (names[wid]) { sh.getRange(r, nameCol).setValue(names[wid]); updated++; }
  }
  return "已更新 " + updated + " 門課程的正式名稱";
}

/* ═══════════════════════════════════════════════════════════
   一次性：把「戰隊」在段課程換成「愛的貨幣」——安全，不重跑 setup。
   在 workshops 分頁確保有 team 欄，並設：workshopId 一/二/三階（＝鍛鍊/放大/演說段）＝FALSE、工作坊＝TRUE。
   前端會據此把中間 stat 格改成💛愛的貨幣、並隱藏夥伴小組頁。
   在 Apps Script 選 applyCourseTeamOff → 執行 一次即可。
   ═══════════════════════════════════════════════════════════ */
function applyCourseTeamOff() {
  var courseOff = { "一階": false, "二階": false, "三階": false };  // 只這三門關 team；其餘(工作坊)維持開
  var sh = ss_().getSheetByName(TABS.workshops);
  if (!sh) return "找不到「" + TABS.workshops + "」分頁";
  var headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(function(h){ return String(h).trim(); });
  var idCol = headers.indexOf("workshopId") + 1;
  if (idCol < 1) return "找不到 workshopId 欄位";
  var teamCol = headers.indexOf("team") + 1;
  if (teamCol < 1) { teamCol = sh.getLastColumn() + 1; sh.getRange(1, teamCol).setValue("team"); }  // 沒有就新增一欄
  var updated = 0;
  for (var r = 2; r <= sh.getLastRow(); r++) {
    var wid = String(sh.getRange(r, idCol).getValue()).trim();
    if (!wid) continue;
    var v = courseOff.hasOwnProperty(wid) ? false : true;  // 段課程 FALSE、其餘 TRUE
    sh.getRange(r, teamCol).setValue(v);
    updated++;
  }
  return "已設定 team 欄：段課程 FALSE／工作坊 TRUE，共 " + updated + " 列";
}

/* ═══════════════════════════════════════════════════════════
   （下文的「一階／二階／三階」都是 workshopId 資料鍵，不是課名；
      段名對照：一階＝鍛鍊段 L1–L4／二階＝放大段 L5–L8／三階＝演說段 L9–L13）
   一次性：安全開通「一階」（鍛鍊段 L1–L4）——不重跑 setup（那會蓋掉你手動改過的 active／locked）。
   做兩件事：
   (1) workshops 分頁把「一階」那列 active 設為 TRUE（其他課完全不動）；
   (2) tasks 分頁把 TASKS_SEED 裡「一階」的任務列 append 進去（已存在同 taskKey 就跳過，可重複執行）。
   在 Apps Script 選 openLevel1 → 執行 一次即可。
   ═══════════════════════════════════════════════════════════ */
function openLevel1() {
  var wid = "一階";
  // (1) 開 active
  var wsMsg = "workshops 找不到一階列";
  var wsh = ss_().getSheetByName(TABS.workshops);
  if (wsh) {
    var wh = wsh.getRange(1, 1, 1, wsh.getLastColumn()).getValues()[0].map(function(h){ return String(h).trim(); });
    var idC = wh.indexOf("workshopId") + 1, acC = wh.indexOf("active") + 1;
    if (idC > 0 && acC > 0) {
      for (var r = 2; r <= wsh.getLastRow(); r++) {
        if (String(wsh.getRange(r, idC).getValue()).trim() === wid) { wsh.getRange(r, acC).setValue(true); wsMsg = "已開通一階 active=TRUE"; break; }
      }
    }
  }
  // (2) append 一階任務（跳過已存在的 taskKey，可重複執行不重複）
  var tsh = ss_().getSheetByName(TABS.tasks);
  if (!tsh) return wsMsg + "；找不到任務分頁";
  var th = tsh.getRange(1, 1, 1, tsh.getLastColumn()).getValues()[0].map(function(h){ return String(h).trim(); });
  var wC = th.indexOf("workshopId"), kC = th.indexOf("taskKey");
  var existing = {};
  var data = tsh.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) { if (String(data[i][wC]).trim() === wid) existing[String(data[i][kC]).trim()] = true; }
  var header = TASKS_SEED[0];
  var toAdd = [];
  for (var s = 1; s < TASKS_SEED.length; s++) {
    var row = TASKS_SEED[s];
    if (row[0] !== wid) continue;
    if (existing[row[1]]) continue;
    var line = th.map(function(h){ var ci = header.indexOf(h); return ci > -1 ? row[ci] : ""; });
    toAdd.push(line);
  }
  if (toAdd.length) tsh.getRange(tsh.getLastRow() + 1, 1, toAdd.length, th.length).setValues(toAdd);
  return wsMsg + "；一階任務新增 " + toAdd.length + " 列（已存在的已跳過）";
}

/* ═══════════════════════════════════════════════════════════
   一次性：把 TASKS_SEED 裡「一階」（鍛鍊段 L1–L4）任務同步進任務分頁——依 taskKey 更新已存在列、
   新增沒有的列，並**保留該列現有的 locked 值**（不蓋掉手動開放過的週次）。
   改完 name/desc/dim/pts 後跑這支即可；不影響二階（放大段 L5–L8）。
   在 Apps Script 選 updateLevel1Tasks → 執行。
   ═══════════════════════════════════════════════════════════ */
function updateLevel1Tasks() {
  var wid = "一階";
  var tsh = ss_().getSheetByName(TABS.tasks);
  if (!tsh) return "找不到任務分頁";
  var th = tsh.getRange(1, 1, 1, tsh.getLastColumn()).getValues()[0].map(function(h){ return String(h).trim(); });
  var wC = th.indexOf("workshopId"), kC = th.indexOf("taskKey"), lC = th.indexOf("locked");
  if (wC < 0 || kC < 0) return "任務分頁缺 workshopId/taskKey 欄";
  var data = tsh.getDataRange().getValues();
  var rowOf = {};
  for (var i = 1; i < data.length; i++) { if (String(data[i][wC]).trim() === wid) rowOf[String(data[i][kC]).trim()] = i + 1; }
  var header = TASKS_SEED[0];
  var updated = 0, added = 0;
  for (var s = 1; s < TASKS_SEED.length; s++) {
    var row = TASKS_SEED[s];
    if (row[0] !== wid) continue;
    var key = row[1];
    var line = th.map(function(h){ var ci = header.indexOf(h); return ci > -1 ? row[ci] : ""; });
    if (rowOf[key]) {
      if (lC > -1) line[lC] = data[rowOf[key] - 1][lC];  // 保留現有 locked
      tsh.getRange(rowOf[key], 1, 1, th.length).setValues([line]);
      updated++;
    } else {
      tsh.getRange(tsh.getLastRow() + 1, 1, 1, th.length).setValues([line]);
      added++;
    }
  }
  return "一階任務同步：更新 " + updated + " 列、新增 " + added + " 列（locked 保留現值）。";
}

/* 建「兌換品項」表（代幣可換的獎勵，跨所有 workshop 共用）。已存在就不覆蓋，
   避免洗掉你之後手動加/改的獎勵（例如之後要補上 Podcast）。 */
/* 兌換品項種子：cost 一律等比例換算＝原價 ÷ 200 元/愛的貨幣（5000→25、2000→10、3600→18、7800→39）。
   desc 只寫一次原價、不用「約」，前端不再重複顯示價值。value 欄保留但已不顯示。 */
var REWARDS_SEED = [
  ["rewardId", "name", "desc", "cost", "value", "icon", "active"],
  ["course_discount", "課程折抵",         "折抵下一期課程學費，原價 5000 元",   25, "", "🎓", true],
  ["consult",         "光頭 1對1 諮詢",    "與光頭進行一次 1對1 深度諮詢，原價 3600 元", 18, "", "🧑‍💼", true],
  ["sv_check",        "專業短影音顧問健檢", "短影音一對一專業顧問健檢，原價 3600 元", 18, "", "🎬", true],
  ["biz_consult",     "企業顧問諮詢",       "企業經營顧問諮詢一次，原價 3600 元",   18, "", "🏢", true],
  ["bizmodel_course", "商業模式課程兌換",   "兌換商業模式課程，原價 7800 元",       39, "", "📈", true]
];

function ensureRewardsSheet_() {
  var ss = ss_();
  if (ss.getSheetByName(TABS.rewards)) return "兌換品項已存在，未變動";
  var sh = ss.insertSheet(TABS.rewards);
  sh.getRange(1, 1, REWARDS_SEED.length, REWARDS_SEED[0].length).setValues(REWARDS_SEED);
  return "已建兌換品項，" + (REWARDS_SEED.length - 1) + " 項獎勵";
}

/* ═══════════════════════════════════════════════════════════
   一次性：把 REWARDS_SEED 的 5 項兌換品 upsert 進「兌換品項」分頁——安全，不重跑 setup。
   依 rewardId 比對：已存在就更新該列、不存在就 append；不在種子裡的其他品項完全不動。
   在 Apps Script 選 upsertRewards → 執行 一次即可（改價/加品後可重跑）。
   ═══════════════════════════════════════════════════════════ */
function upsertRewards() {
  var ss = ss_();
  var sh = ss.getSheetByName(TABS.rewards);
  if (!sh) { var m = ensureRewardsSheet_(); return "兌換品項不存在→" + m; }
  var headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(function(h){ return String(h).trim(); });
  var idCol = headers.indexOf("rewardId");
  if (idCol < 0) return "找不到 rewardId 欄";
  var data = sh.getDataRange().getValues();
  var rowOf = {};
  for (var i = 1; i < data.length; i++) { var id = String(data[i][idCol]).trim(); if (id) rowOf[id] = i + 1; }
  var seedHeader = REWARDS_SEED[0], added = 0, updated = 0;
  for (var s = 1; s < REWARDS_SEED.length; s++) {
    var row = REWARDS_SEED[s];
    var rid = row[seedHeader.indexOf("rewardId")];
    var line = headers.map(function(h){ var ci = seedHeader.indexOf(h); return ci > -1 ? row[ci] : ""; });
    if (rowOf[rid]) { sh.getRange(rowOf[rid], 1, 1, headers.length).setValues([line]); updated++; }
    else { sh.getRange(sh.getLastRow() + 1, 1, 1, headers.length).setValues([line]); added++; }
  }
  return "兌換品項 upsert 完成：新增 " + added + "、更新 " + updated + " 項（等比例 200元/愛的貨幣）";
}

/* ═══════════════════════════════════════════════════════════
   從「測驗分頁」把新 userId 同步進「學員名單」——只補不覆蓋，可重複執行。
   找分頁：先用 TABS.quiz；找不到就掃描名稱含「測驗」的分頁。
   若回報「找不到／0 筆」，代表測驗寫在另一份試算表 → 需要那份的 ID/分頁名。
   在 Apps Script 選 syncStudentsFromQuiz → 執行 一次即可（之後每次要同步就再跑）。
   ═══════════════════════════════════════════════════════════ */
function syncStudentsFromQuiz() {
  var ss = ss_();
  var qsh = ss.getSheetByName(TABS.quiz);
  if (!qsh) {
    var all = ss.getSheets();
    for (var i = 0; i < all.length; i++) { if (all[i].getName().indexOf("測驗") > -1) { qsh = all[i]; break; } }
  }
  if (!qsh) return "找不到測驗分頁（TABS.quiz=「" + TABS.quiz + "」，也沒有名稱含『測驗』的分頁）——測驗可能寫在另一份試算表，請提供該試算表 ID 或分頁名。";
  var qrows = readSheetObjs_(qsh);
  if (!qrows.length) return "測驗分頁「" + qsh.getName() + "」讀到 0 筆資料（可能寫在另一份試算表）。";

  var stSh = ss.getSheetByName(TABS.students);
  if (!stSh) return "找不到學員名單分頁「" + TABS.students + "」。";
  var existing = {};
  rows_(TABS.students).forEach(function(r){ var id = String(pick_(r, COLS.students.lineId)).trim(); if (id) existing[id] = true; });

  var stHeaders = stSh.getRange(1, 1, 1, stSh.getLastColumn()).getValues()[0].map(function(h){ return String(h).trim(); });
  var uidAliases  = ["LINE userId", "userId", "lineId", "userID", "使用者ID"];
  var nameAliases = ["姓名", "name", "displayName", "LINE名稱", "暱稱", "名字"];
  var teamAliases = ["團隊", "team", "組別"];

  var added = 0, skipped = 0, sample = [];
  qrows.forEach(function(q){
    var uid = String(pick_(q, uidAliases)).trim();
    if (!uid) return;
    if (existing[uid]) { skipped++; return; }
    existing[uid] = true;
    var name = String(pick_(q, nameAliases)).trim();
    var team = String(pick_(q, teamAliases)).trim();
    var line = stHeaders.map(function(h){
      if (COLS.students.lineId.indexOf(h) > -1) return uid;
      if (COLS.students.name.indexOf(h)  > -1) return name;
      if (COLS.students.team.indexOf(h)  > -1) return team;
      return "";
    });
    stSh.appendRow(line);
    added++;
    if (sample.length < 10) sample.push(name || uid.slice(0, 10) + "…");
  });
  return "同步完成：測驗分頁「" + qsh.getName() + "」" + qrows.length + " 筆 → 新增學員 " + added + " 位、已存在略過 " + skipped + "。新增名單：" + (sample.join("、") || "無") + "。（記得再到『開通名單』勾選他們要上的課）";
}
/* ═══════════════════════════════════════════════════════════
   把「學員名單有、但開通名單還沒有」的人補一列進開通名單（課程欄預設未勾）。
   syncStudentsFromQuiz 只補學員名單；這支補開通名單，兩支各跑一次就到位。可重複執行。
   在 Apps Script 選 syncEnrollmentRows → 執行。
   ═══════════════════════════════════════════════════════════ */
function syncEnrollmentRows() {
  var ss = ss_();
  var esh = ss.getSheetByName(TABS.enrollments);
  if (!esh) return "找不到開通名單分頁「" + TABS.enrollments + "」，請先跑 setup。";
  var headers = esh.getRange(1, 1, 1, esh.getLastColumn()).getValues()[0].map(function(h){ return String(h).trim(); });
  var uidIdx = -1, nameIdx = -1;
  for (var c = 0; c < headers.length; c++) {
    if (uidIdx < 0 && COLS.students.lineId.indexOf(headers[c]) > -1) uidIdx = c;
    else if (nameIdx < 0 && COLS.students.name.indexOf(headers[c]) > -1) nameIdx = c;
  }
  if (uidIdx < 0) return "開通名單找不到 userId 欄";
  var courseCols = [];
  for (var c2 = 0; c2 < headers.length; c2++) { if (c2 !== uidIdx && c2 !== nameIdx && headers[c2]) courseCols.push(c2); }

  var existing = {};
  var data = esh.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) { var id = String(data[i][uidIdx]).trim(); if (id) existing[id] = true; }

  var added = 0, names = [];
  rows_(TABS.students).forEach(function(r){
    var uid = String(pick_(r, COLS.students.lineId)).trim(); if (!uid) return;
    if (existing[uid]) return;
    existing[uid] = true;
    var name = String(pick_(r, COLS.students.name)).trim();
    var line = headers.map(function(h, ci){ return ci === uidIdx ? uid : (ci === nameIdx ? name : false); });
    var newRow = esh.getLastRow() + 1;
    esh.getRange(newRow, 1, 1, headers.length).setValues([line]);
    courseCols.forEach(function(cc){ esh.getRange(newRow, cc + 1).insertCheckboxes(); });
    added++; names.push(name || uid.slice(0, 8));
  });
  return "開通名單補列：新增 " + added + " 人（" + (names.join("、") || "無") + "），課程欄預設未勾，請到分頁勾選要開通的課。";
}

/* 讀某「分頁物件」成物件陣列（rows_ 吃分頁名，這支吃 Sheet 物件，供掃描到的分頁用）。 */
function readSheetObjs_(sh) {
  var values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0].map(function(h){ return String(h).trim(); });
  var out = [];
  for (var i = 1; i < values.length; i++) {
    var o = {};
    for (var j = 0; j < headers.length; j++) if (headers[j]) o[headers[j]] = values[i][j];
    out.push(o);
  }
  return out;
}

/* ═══════════════════════════════════════════════════════════
   一次性：把舊的「一階」測試打卡／成交紀錄清掉（過往資料是測試資料，覆蓋掉沒關係）。
   只清資料列、保留標題列；之後這個專案就乾淨地以「二階」（放大段 L5–L8）為主繼續跑。
   在 Apps Script 選 clearOldTestData → 執行 一次即可，之後不用再跑。
   ═══════════════════════════════════════════════════════════ */
function clearOldTestData() {
  var a = clearSheetRows_(TABS.checkins);
  var b = clearSheetRows_(TABS.revenue);
  return "已清空舊測試資料：打卡紀錄 " + a + " 列、成交紀錄 " + b + " 列（標題列保留）";
}
function clearSheetRows_(tab) {
  var sh = ss_().getSheetByName(tab);
  if (!sh) return 0;
  var lastRow = sh.getLastRow();
  if (lastRow < 2) return 0;
  var n = lastRow - 1;
  sh.getRange(2, 1, n, sh.getLastColumn()).clearContent();
  return n;
}

/* 建「開通名單」寬表：一人一列、每門課一欄(核取方塊)，預設把第一門課(目前是二階＝放大段 L5–L8)開通。
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
  ["workshopId", "taskKey", "cadence", "dim", "pts", "name", "icon", "needReview", "desc", "locked"],

  /* 特殊（cadence=once，社群分享3項）*/
  ["二階", "social1", "once", "A", 3, "社群分享：自己故事", "📣", false, "分享一則你自己的故事，讓大家更認識真實的你。", false],
  ["二階", "social2", "once", "A", 3, "社群分享：導師故事", "📖", false, "分享一則跟導師學到的故事或啟發。", false],
  ["二階", "social3", "once", "A", 3, "社群分享：培訓心得", "✨", false, "分享一則這次培訓給你的心得或轉變。", false],

  /* 課程（cadence=special，每週上兩堂：乾貨課+討論課各一次出席，加一個作業）：
     只有第1週開放，第2週起(出席+作業)全部預設鎖定(locked=true，灰色不能打)，
     邊教邊在(遊戲)任務分頁把該列 locked 改 FALSE 開放，不用重部署。*/
  ["二階", "w1a", "special", "I", 2, "第1週｜乾貨課出席", "📅", false, "完成 Lesson 5：建立自己變現「甜蜜」路徑 的乾貨課出席打卡。", false],
  ["二階", "w1b", "special", "I", 2, "第1週｜討論課出席", "🗣️", false, "完成第1週討論課的出席打卡，一起討論變現路徑的優化方向。", false],
  ["二階", "hw1", "special", "P", 5, "作業：優化你的變現路徑", "✍️", true, "請研究 ATPI 手冊，並於下次討論課，説出你會如何優化你的「變現路徑」，寫出 1-2 條路徑。", false],
  ["二階", "w2a", "special", "I", 2, "第2週｜乾貨課出席", "📅", false, "完成 Lesson 6：「甜蜜」路徑2大指南針 的乾貨課出席打卡。", true],
  ["二階", "w2b", "special", "I", 2, "第2週｜討論課出席", "🗣️", false, "完成第2週討論課的出席打卡。", true],
  ["二階", "hw2", "special", "P", 5, "作業：(待公布)", "✍️", true, "(待出作業，開課後在此堂課公布)", true],
  ["二階", "w3a", "special", "I", 2, "第3週｜乾貨課出席", "📅", false, "完成 Lesson 7：高單價最後一哩路（上） 的乾貨課出席打卡。", true],
  ["二階", "w3b", "special", "I", 2, "第3週｜討論課出席", "🗣️", false, "完成第3週討論課的出席打卡。", true],
  ["二階", "hw3", "special", "P", 5, "作業：(待公布)", "✍️", true, "(待出作業，開課後在此堂課公布)", true],
  ["二階", "w4a", "special", "I", 2, "第4週｜乾貨課出席", "📅", false, "完成 Lesson 8：高單價最後一哩路（下） 的乾貨課出席打卡。", true],
  ["二階", "w4b", "special", "I", 2, "第4週｜討論課出席", "🗣️", false, "完成第4週討論課的出席打卡。", true],
  ["二階", "hw4", "special", "P", 5, "作業：(待公布)", "✍️", true, "(待出作業，開課後在此堂課公布)", true],

  /* 每日（cadence=daily，7項：3心態+4技法，每天上限3項）*/
  ["二階", "d1", "daily", "I", 1, "開始累計就有奇蹟：信任感才是成交關鍵，不求今天就有結果", "🔥", false,
    "累計才有奇蹟——7-11-4 法則：信任要靠反覆累積接觸（約7次/11小時/4個平台）才會發生，信任感才是成交關鍵。今天做一次曝光或互動就好，不用急著看結果。", false],
  ["二階", "d2", "daily", "P", 1, "對齊內心：用 ATPI 架構，寫下今天溝通中一件你喜歡/不喜歡的事", "🪞", false,
    "對齊內心——用 ATPI（A吸引/T信任/P專業/I推進）當鏡子，回想今天一次溝通，寫下你喜歡或不喜歡的地方。", false],
  ["二階", "d3", "daily", "T", 1, "同理心：今天主動跟一個人要一次反饋，理解「你在客戶內心樣貌」", "🤝", false,
    "同理心——今天主動找一個人要一句真實反饋，聽完先不解釋、不辯解，單純接住，理解「你在客戶內心的樣貌」。", false],
  ["二階", "d4", "daily", "A", 1, "提升吸引肌肉，讓開口更吸引人", "🥩", false,
    "今天任選一個技巧練習：①端牛肉（說出核心價值一句話）②講故事 ③吸引Combo技（牛肉+故事+啟示）④關鍵問句。", false],
  ["二階", "d5", "daily", "T", 1, "提升信任肌肉，讓對方更願意說真話", "❓", false,
    "今天任選一個技巧練習：①Whyyyy（深挖問題，問一次為什麼）②Whoooo（想清楚利害關係人）③A→B消費者歷程 ④接收回饋（請對方打0-10分）。", false],
  ["二階", "d6", "daily", "P", 1, "提升專業肌肉，讓對方覺得你真的懂", "💡", false,
    "今天任選一個技巧練習：①創造對比（讓對方自己做做看）②帶入情境（想好應用場景）③乾貨佐證（用邏輯或數據佐證）。", false],
  ["二階", "d7", "daily", "I", 1, "提升推進肌肉，讓對方更願意馬上行動", "🎯", false,
    "塑造價值——今天跟一個人說一句「這樣做對你的好處」。", false],

  /* 每週（cadence=weekly，2025-07 改版：A×1／T×2／P×1／I×1，每週上限算 2 項）*/
  ["二階", "wk1", "weekly", "A", 2, "開發一位新名單／新連結", "🌱", false, "", false],
  ["二階", "wk2", "weekly", "T", 2, "跟你的客戶或準客戶深聊建立連結", "🎭", false, "", false],
  ["二階", "wk3", "weekly", "T", 2, "向客戶主動吐露你的心理感受，並非工作", "🫶", false,
    "主動讓客戶知道你也是有血有肉的人，不只是在工作——建立更深的信任。", false],
  ["二階", "wk4", "weekly", "P", 2, "讓人更理解你的專業能力（建議讓客戶有體驗）", "🎯", false,
    "讓客戶親身體驗你的專業，而不只是聽你說——體驗比說服更有說服力。", false],
  ["二階", "wk5", "weekly", "I", 2, "本週主動推進一位已經聊過的準客戶，問一次下一步", "🚀", false,
    "找一位已經聊過的準客戶，主動問一次「我們可以往下一步了嗎」，練習不逃避推進的時刻。", false],

  /* ═══════ workshopId「一階」＝鍛鍊段 L1–L4（4 週，每週對應一塊大肌肉）═══════
     出席維度＝該週大肌肉（W1=A吸引 / W2=T信任 / W3=P專業 / W4=I推進），上完四週 4 大肌肉均勻點亮。
     只有第1週開放，W2 起(出席+作業)預設 locked=true，邊教邊在(遊戲)任務分頁把該列 locked 改 FALSE。
     daily/weekly 特意跟放大段(二階)不同：切到日常人際場景(家庭/朋友/社群/貼文)，用鍛鍊段自己的技法，變化性才夠。*/

  /* 社群分享（once，A，同放大段/二階）*/
  ["一階", "social1", "once", "A,T,P", 3, "社群賣自己", "📣", false, "分享一則你自己的人生故事，用「低點→轉折→高點」的方法說，讓大家更認識真實的你。(e.g. FB / IG / Thread……)", false],
  ["一階", "social2", "once", "A,T,P", 3, "社群推薦光頭", "📖", false, "分享真實的上課心得——你的突破、喜悅、看見……，最後自然把光頭推薦出去（不用為了硬推而寫，因為感動而寫）。", false],
  ["一階", "social3", "once", "A,T,P", 3, "讓愛流動", "💗", false, "講出你的內心OS：找你的爸／媽／家人（擇一），說出你心中藏了很久想跟他說的話（道謝・道歉・道愛）。", false],
  ["一階", "sp_beef",   "once", "A", 3, "打造你的牛肉庫", "🥩", false, "寫下事業／財富／感情／家庭／身體 5 個面向，各一句你的核心價值（牛肉），之後開口就能隨時端出來。", false],
  ["一階", "sp_dig",    "once", "T", 3, "深挖一個人的故事", "🔍", false, "找一個人，用 Whyyyy＋問句深聊一次，聽出他表面底下真正在意的事，讓他覺得「你真的懂我」。", false],
  ["一階", "sp_invite", "once", "I", 3, "勇敢邀請一次", "🚀", false, "對一個已經聊過的人，發出一次明確的下一步邀請（見面／體驗／合作），練習臨門一腳、不逃避推進。", false],

  /* 先修課（special，開課即開放，看完影片自行打卡）*/
  ["一階", "pre_method",  "special", "P", 2, "先修課｜L1.L2影片", "🎬", false, "看完 2 隻「學習方法」先修影片後，到『溝通健身房』打卡 https://liff.line.me/2010316474-wmb1ODe0", false],
  ["一階", "pre_skill",   "special", "T", 2, "先修課｜L3.L4影片", "🎬", false, "看完 2 隻「問問題」的技法＋心法影片後打卡，並實際落地用一次。", false],
  ["一階", "pre_mindset", "special", "T", 2, "先修課｜L5.L6影片", "🎬", false, "看完 2 隻「講故事」的技法＋心法影片後打卡，並實際落地用一次。", false],

  /* 課程（special，每週乾貨課+討論課+作業，維度＝該週維度）*/
  ["一階", "w1a", "special", "A", 2, "第1週｜乾貨課出席", "📅", false, "完成第1週乾貨課出席打卡。本週 A吸引肌肉：Core1 吸引式溝通4核心・Core2 5大黃金選擇・Core3 秀肌肉・Core4 萬能關鍵問句。", false],
  ["一階", "w1b", "special", "A", 2, "第1週｜討論課出席", "🗣️", false, "完成第1週討論課出席打卡，一起討論你的「秀肌肉」怎麼說更吸引。", false],
  ["一階", "hw1", "special", "A", 5, "作業：練你的「秀肌肉」一句話", "✍️", true, "寫出一句能讓人眼睛一亮的核心亮點（秀肌肉），下次討論課分享。", false],
  ["一階", "w2a", "special", "T", 2, "第2週｜乾貨課出席", "📅", false, "完成第2週乾貨課出席打卡。本週 T信任肌肉：英雄之旅・Whyyyy深挖信任・句號還是問號。", true],
  ["一階", "w2b", "special", "T", 2, "第2週｜討論課出席", "🗣️", false, "完成第2週討論課出席打卡。", true],
  ["一階", "hw2", "special", "T", 5, "作業：(待公布)", "✍️", true, "(待出作業，開課後在此堂課公布)", true],
  ["一階", "w3a", "special", "P", 2, "第3週｜乾貨課出席", "📅", false, "完成第3週乾貨課出席打卡。本週 P專業肌肉：乾貨 vs 乾貨感・5感體驗法・打造專屬影響技巧。", true],
  ["一階", "w3b", "special", "P", 2, "第3週｜討論課出席", "🗣️", false, "完成第3週討論課出席打卡。", true],
  ["一階", "hw3", "special", "P", 5, "作業：(待公布)", "✍️", true, "(待出作業，開課後在此堂課公布)", true],
  ["一階", "w4a", "special", "I", 2, "第4週｜乾貨課出席", "📅", false, "完成第4週乾貨課出席打卡。本週 I推進肌肉：家庭/朋友/社群三大場景整合・不銷而銷・讓人主動行動。", true],
  ["一階", "w4b", "special", "I", 2, "第4週｜討論課出席", "🗣️", false, "完成第4週討論課出席打卡。", true],
  ["一階", "hw4", "special", "I", 5, "作業：(待公布)", "✍️", true, "(待出作業，開課後在此堂課公布)", true],

  /* 每日（daily，7項，每天上限3）— 鍛鍊段技法 × 日常對話 */
  ["一階", "d1", "daily", "A", 1, "秀肌肉：今天用一句話說出你的核心亮點", "💪", false,
    "用一句話「秀肌肉」——說出讓人眼睛一亮的核心亮點/結果，今天找一次對話或貼文用出來。", false],
  ["一階", "d2", "daily", "A", 1, "關鍵問句：今天用一個會勾到對方需求的問句，抓住對方焦點", "❓", false,
    "用一個好問句代替一句陳述，勾到對方真正在意的需求，抓住焦點讓他想繼續說。", false],
  ["一階", "d3", "daily", "T", 1, "英雄之旅：今天跟一個人分享你一段真實的低谷→轉變", "📖", false,
    "用「英雄之旅」說一段你自己的真實故事（低谷→轉變），讓對方覺得你真實、可信。", false],
  ["一階", "d4", "daily", "T", 1, "Whyyyy：今天在一次聊天多問一次「為什麼」", "🔍", false,
    "深挖信任——在一次聊天多問一次為什麼，問出對方真正在意的事。", false],
  ["一階", "d5", "daily", "T", 1, "句號變問號：把一句陳述句改成問句再說出口", "💬", false,
    "用句號還是問號？今天刻意把一句陳述改成問句再說出口，感受對話質量的不同。", false],
  ["一階", "d6", "daily", "P", 1, "乾貨感：說專業時用一個比喻或畫面讓對方「有感」", "💡", false,
    "乾貨 vs 乾貨感——說專業時用一個比喻/畫面/情境讓對方真的有感，而不是丟一堆資訊。", false],
  ["一階", "d7", "daily", "I", 1, "不銷而銷：對話結尾自然帶對方看到「下一步的好處」", "🎯", false,
    "在一次對話結尾，自然帶對方看到往下一步的好處，不推銷也能推進。", false],

  /* 每週（weekly，5項，每週上限2）— 家庭/朋友/社群，不是客戶 */
  ["一階", "wk1", "weekly", "A", 2, "發一則貼文/限動，用「秀肌肉＋故事」結構寫", "🌱", false,
    "用「秀肌肉＋故事」的結構發一則貼文或限動，讓讀者覺得「這就是在說我」。", false],
  ["一階", "wk2", "weekly", "T", 2, "找一位家人或朋友深聊，聽他的英雄之旅故事", "🎭", false,
    "找一位家人或朋友深聊一次，用英雄之旅的方式聽他的故事，建立更深連結。", false],
  ["一階", "wk3", "weekly", "T", 2, "主動向一個人吐露你的真實感受（不是報告事情）", "🫶", false,
    "主動讓一個人知道你的真實感受，不只是報告事情——真誠會換來真誠。", false],
  ["一階", "wk4", "weekly", "P", 2, "跟一個人解釋你在做的事，讓他「聽得懂又有感」", "🎯", false,
    "跟一個人解釋你在做的事，用對方聽得懂又有感的方式，而不是專業術語。", false],
  ["一階", "wk5", "weekly", "I", 2, "在一次對話中自然推進一段關係到下一步", "🚀", false,
    "在一次對話中主動推進一段關係到下一步（約下次見面/合作/延續話題）。", false]
];


/* ═══════════════════════════════════════════════════════════════════════════
   ██ 天麗變現共訓營 (tenlead-1) ██  —— 同一 Sheet 的一個 workshop（不 fork）
   單一真相：TENLEAD_TASKS（25 任務）／TENLEAD_HONORS（6 徽章）／TENLEAD_TEAMS（15 隊）。
   第一次上線的操作順序：
     1) setupTenlead()        建課程 + 任務 + 徽章 + 開通名單加 tenlead-1 欄（一鍵到底）
     2) 到「(遊戲)開通名單」勾選天麗夥伴的 tenlead-1 欄開通
     3) assignTenleadTeams()  依姓名批次填「團隊」欄分隊（回報未對到的名字→手動補）
   之後細修：改 TENLEAD_TASKS 內容 → updateTenleadTasks()（整組覆蓋，安全可重跑）。
   測試清空：removeTenlead()（連測試打卡/成交一起清，正式上線後勿隨手跑）。
   ═══════════════════════════════════════════════════════════════════════════ */
var TENLEAD_WID = "tenlead-1";

/* 任務（25 支・每日8選3／每週5選2／里程碑6／課程6・全自打卡）。來源＝productkit 5-逐字稿-raw/直銷團隊共訓營 三堂萃取 CSV 的
   「練習任務」原子 ＋ 操作/檔期任務。欄位對齊 (設定)任務：
   workshopId | taskKey | cadence | dim | pts | name | icon | needReview | desc */
var TENLEAD_TASKS = [
  ["workshopId","taskKey","cadence","dim","pts","name","icon","needReview","desc"],
  // ── 每日池 7 支（每天做 3；A1／T2／P2／I2）──
  ["tenlead-1","tl_praise",    "daily","A",1,"練習「稱讚+問句」跟客戶對話","💬","","用「先真心稱讚一個優點，再用開放問句往下問」跟一位客戶對話練習，先不講產品（啟動-05）。"],
  ["tenlead-1","tl_care",      "daily","T",1,"發一則關心訊息給客戶/夥伴","💌","","主動發一則關心訊息給客戶或夥伴，維繫關係。"],
  ["tenlead-1","tl_os",        "daily","T",1,"講出心裡OS：對任何人說一句本來不敢說的心話","🫶","","褪去客套，對任何人說出一句你本來不敢說的真心話（秘招2／開發-13）。"],
  ["tenlead-1","tl_sellresult","daily","P",1,"不賣產品賣結果：分享一次你的天麗故事","✨","","不賣產品賣結果——分享一次你自己的天麗故事或使用後的具體轉變（秘招1）。"],
  ["tenlead-1","tl_feel",      "daily","I",1,"詢問對方感受：問「你願意聽嗎」","🌸","","開發時至少問一次對方的感受，當顧問不當推銷員（秘招3／開發-14）。"],
  ["tenlead-1","tl_newlead",   "daily","I",1,"開接觸 1 位新名單","➕","","每天主動接觸/開發 1 位新名單。"],
  ["tenlead-1","tl_learn",     "daily","P",1,"精進 1 次專業知識","📚","","學一個產品或專業知識點，並記錄下來。"],
  // ── 每週池 5 支（每週做 2）──
  ["tenlead-1","tl_post",       "weekly","A",2,"社群發一則貼文（見證/故事）吸引人","📱","","用見證或故事的結構發一則貼文/限動，吸引人來詢問。"],
  ["tenlead-1","tl_call_mentor","weekly","P",2,"跟上線老師通電話一次","📞","","每週跟上線老師通一次電話，請益、對齊、借力。"],
  ["tenlead-1","tl_story",      "weekly","T",2,"做到先講故事再講產品","📖","","介紹前先講自己的故事（不相信→體驗→有結果），不要一開口就講產品（啟動-07）。"],
  ["tenlead-1","tl_understand", "weekly","T",2,"做到不急著講產品，先了解對方","👂","","這週至少一次，忍住不推產品，先用問句了解對方的需求與煩惱，讓他覺得你真的懂他。"],
  ["tenlead-1","tl_updatelist", "weekly","I",2,"名單內更新自己的客戶狀況","🗂️","","更新名單裡客戶的最新狀況/溫度（誰進到哪一步），讓名單保持是活的。"],
  // ── 里程碑・一次性 6 支（行動/結果型，自打卡免審核）──
  ["tenlead-1","tl_goal",   "once","I",2,"寫下你的九月業績目標","🎯","","寫下你九月要創造的業績/收入目標數字（啟動-16）。"],
  ["tenlead-1","tl_abcd",   "once","A",3,"寫下你的名單","📋","","把身邊的名單完整寫下來（可依 A最熟／B一般熟／C半生不熟／D陌生 分級）（列名單-15）。"],
  ["tenlead-1","tl_comm5",  "once","T",3,"用盡全力溝通 5 個名單（無論結果）","🗣️","","對 5 個名單用盡全力真誠溝通，不論成交與否都算完成。"],
  ["tenlead-1","tl_comm10", "once","T",5,"用盡全力溝通 10 個名單（無論結果）","🗣️","","對 10 個名單用盡全力真誠溝通，不論成交與否都算完成。"],
  ["tenlead-1","tl_firstsale",   "once","I",5,"成功成交一筆訂單","💰","","成功賣出產品、做出一筆業績（賣貨）。"],
  ["tenlead-1","tl_signdownline","once","I",5,"成功簽下一位下線夥伴","🤝","","成功邀請並簽下第一位下線夥伴加入團隊（拉人）。"],
  // ── 課程打卡 6 堂（special，自打卡免審核）──
  ["tenlead-1","tl_micro1","special","A",3,"微課堂｜列名單是給出愛（7/19）","🎓","","參加 7/19(日) 8:00-9:00「列名單是給出愛」微課堂。"],
  ["tenlead-1","tl_micro2","special","T",3,"微課堂｜開發新人3秘招（7/26）","🎓","","參加 7/26(日) 8:00-9:00「開發新人3秘招」微課堂。"],
  ["tenlead-1","tl_micro3","special","P",3,"微課堂｜上下合作10倍勝秘訣（8/2）","🎓","","參加 8/2(日) 8:00-9:30「上下合作10倍勝秘訣」微課堂。"],
  ["tenlead-1","tl_ws1","special","I",5,"挑戰工作坊｜變現實戰1（8/9）","🏆","","參加 8/9(日) 8:00-9:30「變現實戰工作坊1・挑戰業績」。"],
  ["tenlead-1","tl_ws2","special","I",5,"挑戰工作坊｜小單變大單（8/16）","🏆","","參加 8/16(日) 8:00-9:00「小單變大單方法」。"],
  ["tenlead-1","tl_ws3","special","I",5,"挑戰工作坊｜變現實戰2（8/23）","🏆","","參加 8/23(日) 8:00-9:30「變現實戰工作坊2・挑戰業績」。"]
];

/* 徽章（scope=workshop 用天麗打卡/成交過濾）。解鎖判定＝該人 metric >= value。
   欄位對齊 (設定)榮譽品項：honorId | workshopId | metric | value | icon | name | desc | tier | celebrate | scope */
var TENLEAD_HONORS = [
  ["honorId","workshopId","metric","value","icon","name","desc","tier","celebrate","scope"],
  ["tl_firstdeal","tenlead-1","dealCount",    1,      "🎉","天麗開紅盤","課程期間簽下第一單",       "銅",true,"workshop"],
  ["tl_deal5",    "tenlead-1","dealCount",    5,      "🔥","連續開單手","累積簽下 5 單，證明可複製", "銀",true,"workshop"],
  ["tl_rev10w",   "tenlead-1","revenueTotal", 100000, "💎","十萬戰將",  "課程期間做出 10 萬營業額",  "金",true,"workshop"],
  ["tl_streak7",  "tenlead-1","streak",       7,      "🌟","七日不斷",  "連續 7 天完成打卡",         "銀",true,"workshop"],
  ["tl_trust",    "tenlead-1","investPct.T",  50,     "🤝","信賴達人",  "信任肌肉投入衝到 50%",        "銀",true,"workshop"],
  ["tl_push",     "tenlead-1","investPct.I",  50,     "🚀","推進高手",  "推進肌肉投入衝到 50%",        "銀",true,"workshop"]
];

/* 分隊：同隊名自動成組（≥2 隊才顯示戰隊區）。隊名先用「1隊…15隊」，改第二欄即可改名。
   靠「姓名」與開通名單比對（互為包含即命中），未對到會回報→手動補。 */
var TENLEAD_TEAMS = [
  ["若鳳","1隊"],["秀蘭","1隊"],["美惠","1隊"],
  ["惠青","2隊"],["琦淇","2隊"],["家家","2隊"],
  ["小蔓","3隊"],["朵朵","3隊"],["雅芬","3隊"],
  ["小米","4隊"],["玟慧","4隊"],["麗嘉瑩","4隊"],
  ["張妤蘭","5隊"],["何冠忻","5隊"],
  ["張芸芸","6隊"],["朝玲","6隊"],
  ["惠怡","7隊"],["吳宥溱","7隊"],
  ["佩燕","8隊"],["慧敏","8隊"],
  ["美琴","9隊"],["碧勳","9隊"],
  ["秀蓁","10隊"],["瑞娥","10隊"],
  ["覃靖涵","11隊"],["孔祥田","11隊"],["心柔","11隊"],
  ["豫臻","12隊"],["黃麗星","12隊"],
  ["啟英","13隊"],["愛花","13隊"],["李素靜","13隊"],
  ["幸伶","14隊"],["Sherene","14隊"],["Yes","14隊"],
  ["Vivi","15隊"],["小庭","15隊"]
];

/* 一鍵：建課程 + 任務 + 徽章 + 開通欄。安全可重跑（任務整組覆蓋、其餘已存在就跳過）。 */
function setupTenlead() {
  var a = tl_ensureWorkshop_();
  var b = updateTenleadTasks();
  var c = tl_appendSeed_(TABS.honors, TENLEAD_HONORS, "honorId", null);
  var d = addTenleadEnrollColumn();
  return [a, b, c, d].join("；");
}

/* 確保 (設定)課程 有 tenlead-1 列：存在就設 active/team=TRUE，不存在就 append。 */
function tl_ensureWorkshop_() {
  var sh = ss_().getSheetByName(TABS.workshops);
  if (!sh) return "找不到 " + TABS.workshops;
  var h = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(function(x){ return String(x).trim(); });
  var idC = h.indexOf("workshopId"), aC = h.indexOf("active"), tC = h.indexOf("team");
  if (idC < 0) return TABS.workshops + " 缺 workshopId 欄";
  var data = sh.getDataRange().getValues();
  for (var r = 1; r < data.length; r++) {
    if (String(data[r][idC]).trim() === TENLEAD_WID) {
      if (aC > -1) sh.getRange(r + 1, aC + 1).setValue(true);
      if (tC > -1) sh.getRange(r + 1, tC + 1).setValue(true);
      return "課程 tenlead-1 已存在，設 active/team=TRUE";
    }
  }
  var line = h.map(function(col){
    if (col === "workshopId") return TENLEAD_WID;
    if (col === "name")       return "天麗變現共訓營";
    if (col === "active")     return true;
    if (col === "team")       return true;
    return "";
  });
  sh.appendRow(line);
  return "已新增課程 tenlead-1";
}

/* 天麗任務整組覆蓋：把 tenlead-1 舊列全濾掉，依 TENLEAD_TASKS 重寫。
   一次清空+一次寫回（不逐列 deleteRow，避免 GAS「發生不明錯誤」）。其餘課程原順序保留。 */
function updateTenleadTasks() {
  var sh = ss_().getSheetByName(TABS.tasks);
  if (!sh) return "找不到任務分頁";
  var lastRow = sh.getLastRow(), lastCol = sh.getLastColumn();
  var h = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(function(x){ return String(x).trim(); });
  var wC = h.indexOf("workshopId");
  if (wC < 0) return "任務分頁缺 workshopId 欄";
  var all = lastRow > 1 ? sh.getRange(2, 1, lastRow - 1, lastCol).getValues() : [];
  var kept = all.filter(function(r){ return String(r[wC]).trim() !== TENLEAD_WID; });
  var removed = all.length - kept.length;
  var header = TENLEAD_TASKS[0];
  var seedRows = [];
  for (var s = 1; s < TENLEAD_TASKS.length; s++) {
    var row = TENLEAD_TASKS[s];
    seedRows.push(h.map(function(col){ var ci = header.indexOf(col); return ci > -1 ? row[ci] : ""; }));
  }
  var body = kept.concat(seedRows);
  if (lastRow > 1) sh.getRange(2, 1, lastRow - 1, lastCol).clearContent();
  if (body.length) sh.getRange(2, 1, body.length, lastCol).setValues(body);
  return "天麗任務：移除舊 " + removed + " 列、寫入 " + seedRows.length + " 列";
}

/* 依表頭把 seed（第一列＝欄名）append 進分頁；同 keyCol 值已存在就跳過（給徽章用）。
   scopeWid 有值時只在該 workshop 範圍內判重；分頁不存在會自動建表頭。 */
function tl_appendSeed_(tab, seed, keyCol, scopeWid) {
  var sh = ss_().getSheetByName(tab);
  if (!sh) { sh = ss_().insertSheet(tab); sh.getRange(1, 1, 1, seed[0].length).setValues([seed[0]]); }
  var h = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(function(x){ return String(x).trim(); });
  var header = seed[0];
  var kSeed = header.indexOf(keyCol);
  var shKC = h.indexOf(keyCol), shWC = h.indexOf("workshopId");
  var existing = {};
  var data = sh.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (scopeWid && shWC > -1 && String(data[i][shWC]).trim() !== scopeWid) continue;
    if (shKC > -1) existing[String(data[i][shKC]).trim()] = true;
  }
  var toAdd = [];
  for (var s = 1; s < seed.length; s++) {
    var row = seed[s];
    if (existing[String(row[kSeed]).trim()]) continue;
    toAdd.push(h.map(function(col){ var ci = header.indexOf(col); return ci > -1 ? row[ci] : ""; }));
  }
  if (toAdd.length) sh.getRange(sh.getLastRow() + 1, 1, toAdd.length, h.length).setValues(toAdd);
  return tab + " 新增 " + toAdd.length + " 列（已存在的已跳過）";
}

/* 在 (遊戲)開通名單 加一欄「tenlead-1」並套核取方塊（欄名必須＝workshopId，程式才讀得到）。
   已存在就只補套核取方塊，不重複加欄。 */
function addTenleadEnrollColumn() {
  var sh = ss_().getSheetByName(TABS.enrollments);
  if (!sh) return "找不到 " + TABS.enrollments;
  var lastCol = sh.getLastColumn();
  var headers = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h){ return String(h).trim(); });
  var col = headers.indexOf(TENLEAD_WID) + 1;
  var added = false;
  if (col < 1) { col = lastCol + 1; sh.getRange(1, col).setValue(TENLEAD_WID); added = true; }
  var lastRow = sh.getLastRow();
  if (lastRow >= 2) {
    var rule = SpreadsheetApp.newDataValidation().requireCheckbox().build();
    var rng = sh.getRange(2, col, lastRow - 1, 1);
    rng.setDataValidation(rule);
    var cur = rng.getValues(), changed = false;
    for (var i = 0; i < cur.length; i++) { if (cur[i][0] === "" || cur[i][0] === null) { cur[i][0] = false; changed = true; } }
    if (changed) rng.setValues(cur);
  }
  return "開通名單 " + (added ? "已新增" : "已存在") + " 「" + TENLEAD_WID + "」欄（第 " + col + " 欄），已套核取方塊";
}

/* ═══════════════════════════════════════════════════════════════════════════
   ██ 超引力 兩門新課（顧問課／公眾演說） ██  —— dashboard.html／私教學員層
   跟天麗同一套模式（同一張 Sheet 開分頁欄、不 fork），但這兩門課**還沒有課程內容**，
   這裡只做「登記課程 + 開通名單加欄」兩件事，不像天麗那樣連 TASKS/HONORS 一起造——
   沒有真實課綱就不亂編任務，等你有內容了再另外設計 tasks（跟 tl_appendSeed_ 同一招）。

   操作順序：
     1) setupChaoyinli()   建課程 + 開通名單各加一欄（一鍵，安全可重跑）
     2) 到「(遊戲)開通名單」勾選對應學員的「超引力-顧問課」／「超引力-公眾演說」欄開通
     3) 開通後這些人打開連結會被 index.html 的 routeFor() 導去 dashboard.html
        （跟天麗、一階/二階/三階共用同一支介面檔，還沒拆新版）
   ═══════════════════════════════════════════════════════════════════════════ */
var CHAOYINLI_WORKSHOPS = [
  { id: "超引力-顧問課",   name: "超引力-顧問課" },
  { id: "超引力-公眾演說", name: "超引力-公眾演說" }
];

/* 通用版 tl_ensureWorkshop_：確保 (設定)課程 有這個 workshopId 的列，存在就設 active=TRUE。
   跟天麗那支各自獨立，不動天麗已經在跑的東西。 */
function ensureWorkshop_(wid, name) {
  var sh = ss_().getSheetByName(TABS.workshops);
  if (!sh) return "找不到 " + TABS.workshops;
  var h = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(function(x){ return String(x).trim(); });
  var idC = h.indexOf("workshopId"), aC = h.indexOf("active");
  if (idC < 0) return TABS.workshops + " 缺 workshopId 欄";
  var data = sh.getDataRange().getValues();
  for (var r = 1; r < data.length; r++) {
    if (String(data[r][idC]).trim() === wid) {
      if (aC > -1) sh.getRange(r + 1, aC + 1).setValue(true);
      return "課程「" + wid + "」已存在，設 active=TRUE";
    }
  }
  var line = h.map(function(col){
    if (col === "workshopId") return wid;
    if (col === "name")       return name;
    if (col === "active")     return true;
    return "";
  });
  sh.appendRow(line);
  return "已新增課程「" + wid + "」";
}

/* 通用版 addTenleadEnrollColumn：在 (遊戲)開通名單 加一欄（欄名＝workshopId）並套核取方塊。
   已存在就只補套核取方塊，不重複加欄。 */
function addEnrollColumn_(wid) {
  var sh = ss_().getSheetByName(TABS.enrollments);
  if (!sh) return "找不到 " + TABS.enrollments;
  var lastCol = sh.getLastColumn();
  var headers = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h){ return String(h).trim(); });
  var col = headers.indexOf(wid) + 1;
  var added = false;
  if (col < 1) { col = lastCol + 1; sh.getRange(1, col).setValue(wid); added = true; }
  var lastRow = sh.getLastRow();
  if (lastRow >= 2) {
    var rule = SpreadsheetApp.newDataValidation().requireCheckbox().build();
    var rng = sh.getRange(2, col, lastRow - 1, 1);
    rng.setDataValidation(rule);
    var cur = rng.getValues(), changed = false;
    for (var i = 0; i < cur.length; i++) { if (cur[i][0] === "" || cur[i][0] === null) { cur[i][0] = false; changed = true; } }
    if (changed) rng.setValues(cur);
  }
  return "開通名單 " + (added ? "已新增" : "已存在") + " 「" + wid + "」欄（第 " + col + " 欄），已套核取方塊";
}

/* L1-L4 任務池（超引力-顧問課）：從真的逐字稿萃取（5-逐字稿-raw/引力L1、L2、L3 的
   素材.csv「練習任務」列）挑出來，муscle 對照 productkit 22-技巧對小肌群對應與練習庫
   逐格核對過。⚠️ 只收 L1(A)／L3(P)，**L2(T) 先不收**——L2 逐字稿 8/22 萃取，
   但 T 整組內容是 8/30 才重構（含 7-11-4 退場），L2 的任務對應到哪個 T 格已經對不準了，
   等 T 重新萃取或老師確認再補。L4(I) 沒逐字稿，先落空——focusTaskInfo() 找不到真任務
   時会自動退回 judgement.js 的 fallbackMove()，畫面不會空。
   欄位對齊 (設定)任務：workshopId | taskKey | cadence | dim | muscle | pts | name | icon | needReview | desc */
var CHAOYINLI_TASKS = [
  ["workshopId","taskKey","cadence","dim","muscle","pts","name","icon","needReview","desc"],
  ["超引力-顧問課","cy_a1_admire","daily","A","A1",5,"欣賞練習：每天欣賞三件好","👋",false,
    "每天欣賞你身邊發生的美麗事物、欣賞別人的好（爸媽、孩子、同事）、動不動就稱讚別人。稱讚的肌肉需要練習，先練欣賞才能真誠稱讚。"],
  ["超引力-顧問課","cy_a2_beef","daily","A","A2",10,"打造你的牛肉案例庫","🥩",false,
    "每天記一塊你曾經創造過的結果（before→after），累積成自己的牛肉庫。任何前後對比都算，不限大小。"],
  ["超引力-顧問課","cy_a3_hero","once","A","A3",20,"寫下你的英雄之旅","📖",true,
    "把你的故事按英雄之旅結構寫出來：平凡起點→怎麼卡關→轉折→現在的結果。這是你最吸引人的自我介紹底稿。"],
  ["超引力-顧問課","cy_p1_gap","special","P","P1",20,"把你的服務視覺化成一張圖","🔍",true,
    "用ChatGPT討論，把你的服務/知識體系拆成客戶看得懂的步驟，畫成一張視覺化流程圖（歸類成3件事最好記）。放進你的成交簡報，讓客戶一眼看懂會經歷哪些階段。"],
  ["超引力-顧問課","cy_p1_five_why","daily","P","P1",10,"用「五個為什麼」把問題挖到第三層","🔍",false,
    "拿光頭常用問題集，練習用「五個為什麼」把客戶的問題挖到第三層以上，並把問題從皮（行為）帶到肉（感受）、骨（信念）。目標是改掉問問題不夠深的口語習慣。"],
  ["超引力-顧問課","cy_p2_demo","special","P","P2",30,"設計你的大絕招試吃品","✨",true,
    "設計一個5–10分鐘、能讓客戶產生體驗感的「試吃品」，走大絕招三步驟：先讓他用自己的版本做一次→帶入他的生活情境→接收他的回饋。從五覺（視聽觸味嗅）擇一切入，目標是讓客戶在短時間內產生「WOW」。"],
  ["超引力-顧問課","cy_p3_proof","weekly","P","P3",15,"收集見證、成效數據與第三方背書","🗺️",true,
    "建立你的見證系統：收單當下請對方留真實回饋，約定一個月後回報變化（結果數據）；同時整理成效數據與第三方背書（證照/名次/推薦函）。平常就存檔素材照片，三年後會極度感謝現在有做。"]
];

/* 任務整組覆蓋（跟 updateTenleadTasks 同一招）：把「超引力-顧問課」舊列全濾掉，
   依 CHAOYINLI_TASKS 重寫。其餘課程（含天麗）原順序保留、完全不動。 */
function updateChaoyinliTasks() {
  var sh = ss_().getSheetByName(TABS.tasks);
  if (!sh) return "找不到任務分頁";
  var lastRow = sh.getLastRow(), lastCol = sh.getLastColumn();
  var h = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(function(x){ return String(x).trim(); });
  var wC = h.indexOf("workshopId");
  if (wC < 0) return "任務分頁缺 workshopId 欄";
  var all = lastRow > 1 ? sh.getRange(2, 1, lastRow - 1, lastCol).getValues() : [];
  var kept = all.filter(function(r){ return String(r[wC]).trim() !== "超引力-顧問課"; });
  var removed = all.length - kept.length;
  var header = CHAOYINLI_TASKS[0];
  var seedRows = [];
  for (var s = 1; s < CHAOYINLI_TASKS.length; s++) {
    var row = CHAOYINLI_TASKS[s];
    seedRows.push(h.map(function(col){ var ci = header.indexOf(col); return ci > -1 ? row[ci] : ""; }));
  }
  var body = kept.concat(seedRows);
  if (lastRow > 1) sh.getRange(2, 1, lastRow - 1, lastCol).clearContent();
  if (body.length) sh.getRange(2, 1, body.length, lastCol).setValues(body);
  return "超引力-顧問課任務：移除舊 " + removed + " 列、寫入 " + seedRows.length + " 列（A1/A2/A3/P1×2/P2/P3，T 跟 I 還沒有真任務，會自動退回 fallbackMove()）";
}

/* 一鍵：登記「超引力-顧問課」「超引力-公眾演說」兩門課 + 開通名單各加一欄 + L1/L3 真任務。
   安全可重跑（任務整組覆蓋、其餘已存在就跳過）。 */
function setupChaoyinli() {
  var a = CHAOYINLI_WORKSHOPS.map(function(w){
    return ensureWorkshop_(w.id, w.name) + "；" + addEnrollColumn_(w.id);
  }).join("\n");
  var b = updateChaoyinliTasks();
  return a + "\n" + b;
}

/* 依姓名批次填「團隊」欄分隊。只覆蓋對到的天麗夥伴列，其他人不動；未對到會回報。
   前提：該夥伴已在開通名單有列、姓名對得上 LINE 顯示名。 */
function assignTenleadTeams() {
  var sh = ss_().getSheetByName(TABS.students);
  if (!sh) return "找不到開通名單";
  var lastRow = sh.getLastRow(), lastCol = sh.getLastColumn();
  if (lastRow < 2) return "開通名單沒有學員列";
  var h = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(function(x){ return String(x).trim(); });
  var nameC = -1, teamC = -1;
  for (var c = 0; c < h.length; c++) {
    if (nameC < 0 && ["姓名","LINE名稱","name"].indexOf(h[c]) > -1) nameC = c;
    if (teamC < 0 && ["團隊","team"].indexOf(h[c]) > -1) teamC = c;
  }
  if (nameC < 0) return "找不到「姓名」欄";
  if (teamC < 0) { teamC = lastCol; sh.getRange(1, teamC + 1).setValue("團隊"); }
  var names = sh.getRange(2, nameC + 1, lastRow - 1, 1).getValues();
  var out = sh.getRange(2, teamC + 1, lastRow - 1, 1).getValues();
  var matched = {}, count = 0;
  for (var i = 0; i < names.length; i++) {
    var nm = String(names[i][0]).trim();
    if (!nm) continue;
    for (var t = 0; t < TENLEAD_TEAMS.length; t++) {
      var key = TENLEAD_TEAMS[t][0];
      if (nm === key || nm.indexOf(key) > -1 || key.indexOf(nm) > -1) {
        out[i][0] = TENLEAD_TEAMS[t][1]; matched[key] = 1; count++; break;
      }
    }
  }
  sh.getRange(2, teamC + 1, lastRow - 1, 1).setValues(out);
  var missing = TENLEAD_TEAMS.filter(function(x){ return !matched[x[0]]; }).map(function(x){ return x[0] + "(" + x[1] + ")"; });
  return "已分隊 " + count + " 人；未對到（需手動填）：" + (missing.join("、") || "無");
}

/* 測試用：完全移除天麗——刪 (設定)任務/榮譽品項/課程 的 tenlead-1 列、
   (遊戲)打卡紀錄/成交紀錄 課程=tenlead-1 的列、(遊戲)開通名單 的 tenlead-1 欄。別的課不動。 */
function removeTenlead() {
  var msgs = [];
  msgs.push(tl_deleteRowsByWid_(TABS.tasks,     ["workshopId"]));
  msgs.push(tl_deleteRowsByWid_(TABS.honors,    ["workshopId"]));
  msgs.push(tl_deleteRowsByWid_(TABS.workshops, ["workshopId"]));
  msgs.push(tl_deleteRowsByWid_(TABS.checkins,  ["課程", "workshopId"]));
  msgs.push(tl_deleteRowsByWid_(TABS.revenue,   ["課程", "workshopId"]));
  msgs.push(tl_removeEnrollColumn_());
  return msgs.join("；");
}

/* 刪某分頁裡「課程欄＝tenlead-1」的所有列（由下往上刪才不會位移）。 */
function tl_deleteRowsByWid_(tab, aliases) {
  var sh = ss_().getSheetByName(tab);
  if (!sh) return tab + " 不存在";
  var lastRow = sh.getLastRow(), lastCol = sh.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return tab + " 無資料";
  var headers = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h){ return String(h).trim(); });
  var wc = -1;
  for (var a = 0; a < aliases.length; a++) { var idx = headers.indexOf(aliases[a]); if (idx > -1) { wc = idx; break; } }
  if (wc < 0) return tab + " 找不到課程欄";
  var vals = sh.getRange(2, wc + 1, lastRow - 1, 1).getValues();
  var deleted = 0;
  for (var r = vals.length - 1; r >= 0; r--) {
    if (String(vals[r][0]).trim() === TENLEAD_WID) { sh.deleteRow(r + 2); deleted++; }
  }
  return tab + " 刪 " + deleted + " 列";
}

/* 刪 (遊戲)開通名單 的 tenlead-1 欄。 */
function tl_removeEnrollColumn_() {
  var sh = ss_().getSheetByName(TABS.enrollments);
  if (!sh) return "開通名單不存在";
  var headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(function(h){ return String(h).trim(); });
  var col = headers.indexOf(TENLEAD_WID) + 1;
  if (col < 1) return "開通名單無 tenlead-1 欄";
  sh.deleteColumn(col);
  return "開通名單刪 tenlead-1 欄";
}
