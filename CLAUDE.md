# consult-workshop — 變現型顧問實戰營・學員儀表板

LINE LIFF 的學員遊戲化儀表板，用任務打卡累積 ATPI 四力、畫成長圖。
純 HTML + CSS + 原生 JS，無框架，資料來自 Google Sheet（Apps Script API）。

- **線上網址**：https://lightlovecommai-oss.github.io/consult-workshop/
- **Repo**：https://github.com/lightlovecommai-oss/consult-workshop

## 檔案分工
- `atpi-core.js` — **跨專案共用核心**（另一個專案 comconverttest 也用同一套）。放 ATPI 通用邏輯：`DORD`、潛力值公式 `calcPotential`、甜蜜路徑資料 `COMBO_PATH`/`STRONG_PATH`/`WEAK_DESC`、判斷函式 `getCombo`，以及共用渲染函式 `drawRadarSVG`/`renderGrowthCard`/`renderTrendChart`。**改這裡兩個專案會一起生效。**
- `common.js` — 本專案資料層：四維度 `DIMS`、等級 `LEVELS`、徽章、計分函式，以及接 Google Sheet 的 `loadStudents()`/`loadConfig()`/`loadLogs()`/`loadLeaderboard()`。**任務不再寫死**——由 `loadConfig()` 從 `tasks` 分頁讀進 `TASKS`/`WORKSHOPS`/`ENROLLMENTS`。
- `apps-script/Code.gs` — 後端 Google Apps Script（Web App）。所有 GET/POST 端點都在這；改分頁名稱在檔頭 `TABS`。部署方式見檔頭註解與下方「Google Sheet 設定」。
- `index.html` — 入口：用 `?id=` 或 LIFF 取得學員 lineId，導向 dashboard。
- `dashboard.html` — 學員儀表板本體（含課程切換 pills，任務／回報／排行榜依所選課程呈現）。
- `showcase.html` — 對外展示頁（示範學員成長軌跡）。
- HTML 引入順序固定為 `atpi-core.js` → `common.js`。

## Google Sheet 設定（多 workshop 資料驅動）
分頁（欄位＝第一列標題，順序可任意，名稱對齊 `Code.gs` 的 `TABS`）：
- **學員**：`LINE userId | 姓名 | 團隊`（只當身份；舊的 出席/社群分享/作業/團隊賽 加總欄已不參與計分，可留可刪）。
- **workshops**：`workshopId | name | active`（active 空白或 true 視為開啟）。
- **tasks**（取代寫死的任務池）：`workshopId | taskKey | cadence | dim | pts | name | icon | needReview`。cadence＝`once`(專案)/`special`(需審核)/`daily`/`weekly`；dim＝`A|T|P|I`；needReview=true 的任務學員端顯示「待審核」不可自打，由導師補列打卡才計分。
- **enrollments**：`lineId | workshopId`（誰報了哪些課；沒設則暫時給看全部）。
- **打卡紀錄**：`lineId | workshopId | taskKey | cadence | dim | pts | date`（投入的唯一真相來源）。
- **成交紀錄**：`lineId | workshopId | amount | date | note | A | T | P | I`。
- **測驗結果**：自評來源（comconverttest 寫入），`userId | scoreA | scoreT | scoreP | scoreI`。

⚠️ 遷移：既有學員的專案/特殊點數要改成在 tasks 定義好、再到「打卡紀錄」補列（帶 workshopId/dim/pts/cadence），否則新版計分讀不到。舊「打卡紀錄」列若沒有 workshopId，能力仍算得到（靠 dim），但會被歸到空字串課程，建議回填 workshopId。

## ATPI 底層邏輯
- 四維度 A吸引力 / T信任力 / P專業力 / I推進力（I 統一叫「推進力」，不要用「影響力」）。
- **變現潛力值 = A×T×P×I 相乘**（各 0-1，見 `calcPotential`）。因為是相乘，任一維度為 0 潛力值就是 0——這是特性不是 bug。
- 變現流程甜蜜點：取最強兩維度組合查 `COMBO_PATH`（6 選 1）。

## 姊妹專案
`comconverttest`（溝通變現能力測驗，本機在 `/Users/ivor/comconvertai/comconverttest`）是「測驗 + 結果頁」，本專案是「任務儀表板」。兩者共用 ATPI 內容邏輯，各自有自己的資料來源與計分方式。共用的部分應集中在 `atpi-core.js`。

## 本機測試（重要，避免踩坑）
- launch.json 用 `serve` 起靜態站。
- **`serve` 會把 `.html?query` 做 301 重導並吃掉 query string**。測 dashboard 要用乾淨網址 `/dashboard?id=<lineId>`，不要用 `/dashboard.html?id=`（會掉參數、頁面跳回 showcase）。
- 若 port 3000 被其他 session 佔用，在 launch.json 設 `"autoPort": true` 讓它自動換 port。
- 測試用真實 lineId：先 `await loadStudents()` 再取 `STUDENTS[0].lineId`。
- 在瀏覽器外（非 LINE）開會一直噴 `liff.init()` 的 URL 警告，屬正常，可忽略。

## 多 workshop 架構（會同時開多個、未來擴增）
- **ATPI 是「人（lineId）」的屬性，不是 workshop 的**：同一學員跨所有 workshop 共用一份 ATPI、一個儀表板；各 workshop 的任務分全部加總進同 4 維投入池。workshop 只是輸入管道。
- 投入計分已改用**飽和曲線**（見下），跨多 workshop 無限加總不爆表、加 workshop 免校準。
- `calcDims` 已改成**靠打卡紀錄裡存的 `dim`/`pts` 加總**（`loadLogs` 會保留這兩欄），不再回查本專案任務池——別的 workshop 的任務 key 不在這裡也算得到；沒帶 dim/pts 的舊資料退回用 taskId 查任務池。
- 排行榜**各 workshop 各一張**：`baseScore(s, workshopId)` 可依 workshop 過濾（任務尚未帶 `workshop` 欄前為 no-op）。能力雷達圖／潛力值仍是全域合併。
- 尚待後端：`checkins` 加 `workshopId`、`workshops`/`tasks`/`enrollments` 分頁、資料驅動任務、各 workshop 分榜 UI。全貌見專案記憶 multi-workshop-architecture。

## 已知待處理
- 計分口徑：每維能力 = 投入%（**飽和曲線** `100 × 累積分 /(累積分 + DIMS[k].k)`，累積到 `k` 分＝50%，永遠逼近 100 不爆表）× 市場驗證係數（`validationFactor`，見計分常數 `TARGET_AMOUNT`/`TARGET_COUNT`/`VALID_FLOOR`）。`DIMS[k].k`（半滿點，取代舊的固定滿分 `max`）與 `TARGET_*` 都是軟旋鈕，待真實數據微調。設計全貌見專案記憶 scoring-model-design。
- 等級門檻 `LEVELS`（0/10/18/24/29）是舊「29 滿分」模型留下的；`totalScore` 現含每日/每週會無限累積，血條已改 `levelProgress()` 走「到下一級的進度」不爆表，但門檻本身要不要納入每日/每週、重新設計，待定。
- 打卡與成交**都已接 Google Sheet 持久化**：載入用 `loadLogs()`（GET `?action=logs`）讀回、`postCheckin()`/`postRevenue()`（POST）寫入「打卡紀錄」/「成交紀錄」分頁；成交會存下當下四維分數快照供走勢圖用。自評起點用 `loadSelfEval()`（GET `?userId=`）讀同一試算表的測驗結果，只顯示不計分。

## Git
改完直接 commit + push 到 main，GitHub Pages 約 1-2 分鐘更新。
