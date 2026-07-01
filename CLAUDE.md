# consult-workshop — 變現型顧問實戰營・學員儀表板

LINE LIFF 的學員遊戲化儀表板，用任務打卡累積 ATPI 四力、畫成長圖。
純 HTML + CSS + 原生 JS，無框架，資料來自 Google Sheet（Apps Script API）。

- **線上網址**：https://lightlovecommai-oss.github.io/consult-workshop/
- **Repo**：https://github.com/lightlovecommai-oss/consult-workshop

## 檔案分工
- `atpi-core.js` — **跨專案共用核心**（另一個專案 comconverttest 也用同一套）。放 ATPI 通用邏輯：`DORD`、潛力值公式 `calcPotential`、甜蜜路徑資料 `COMBO_PATH`/`STRONG_PATH`/`WEAK_DESC`、判斷函式 `getCombo`，以及共用渲染函式 `drawRadarSVG`/`renderGrowthCard`/`renderTrendChart`。**改這裡兩個專案會一起生效。**
- `common.js` — 本專案資料層：四維度 `DIMS`、等級 `LEVELS`、徽章、任務定義、計分函式、`loadStudents()` 接 Google Sheet。
- `index.html` — 入口：用 `?id=` 或 LIFF 取得學員 lineId，導向 dashboard。
- `dashboard.html` — 學員儀表板本體。
- `showcase.html` — 對外展示頁（示範學員成長軌跡）。
- HTML 引入順序固定為 `atpi-core.js` → `common.js`。

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

## 已知待處理
- `calcDims` 的百分比是用「整個營期固定滿分」(`DIMS[k].max`) 換算，但每日/每週任務可無限累積，長期會超過滿分。目前用 `Math.min(100,...)` 頂住，**「多久算 100%」的校準尚未定案**。
- 每日/每週打卡（`dailyLog`/`weeklyLog`）**已接 Google Sheet 持久化**：載入用 `loadLogs()`（GET `?action=logs`）讀回、打卡用 `postCheckin()`（POST `action:"checkin"`）寫入「打卡紀錄」分頁。回報成交（`revenueLog`）**仍只存記憶體**，尚未持久化（下一步：新增「成交紀錄」寫入，並補上成交當下的四維分數快照欄位供走勢圖用）。

## Git
改完直接 commit + push 到 main，GitHub Pages 約 1-2 分鐘更新。
