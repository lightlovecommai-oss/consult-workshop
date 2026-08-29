# 溝通健身房（consult-workshop）— 變現型顧問實戰營・學員儀表板

> ↔ **企劃大腦**：本專案是產品「溝通健身房（1+1 陪跑引擎）」的執行。產品定義／商業模式見 `../../5-企劃與產品手冊/productkit`（核心概念真相＝`1-手冊（內部）/01-核心定義字典.md`）。

LINE LIFF 的學員遊戲化儀表板，用任務打卡累積 ATPI 四力、畫成長圖。
純 HTML + CSS + 原生 JS，無框架，資料來自 Google Sheet（Apps Script API）。

- **線上網址**：https://lightlovecommai-oss.github.io/consult-workshop/
- **Repo**：https://github.com/lightlovecommai-oss/consult-workshop

## 檔案分工
- `atpi-core.js` — **跨專案共用核心**（另一個專案 comconverttest 也用同一套）。放 ATPI 通用邏輯：`DORD`、潛力值公式 `calcPotential`、甜蜜路徑資料 `COMBO_PATH`/`STRONG_PATH`/`WEAK_DESC`、判斷函式 `getCombo`，以及共用渲染函式 `drawRadarSVG`/`renderGrowthCard`/`renderTrendChart`。**改這裡兩個專案會一起生效。**
- `common.js` — 本專案資料層：四維度 `DIMS`、等級 `LEVELS`、徽章、計分函式，以及接 Google Sheet 的 `loadStudents()`/`loadConfig()`/`loadLogs()`/`loadLeaderboard()`。**任務不再寫死**——由 `loadConfig()` 從 `tasks` 分頁讀進 `TASKS`/`WORKSHOPS`/`ENROLLMENTS`。
- `apps-script/Code.gs` — 後端 Google Apps Script（Web App）。所有 GET/POST 端點都在這；改分頁名稱在檔頭 `TABS`。部署方式見檔頭註解與下方「Google Sheet 設定」。
- `judgement.js` — **判讀規則表 v1**（v2 新增）：12 塊各自的 `symptom/homework/opener/evidence`＋`VERDICT`＋`buildScript()`（解盤逐字腳本）＋**內建動作庫 fallback**（`pickTodaySet()`／`fallbackMove()`）。真相日後以 productkit 27§8.7 的正式判讀規則表為準。
- `index.html` — 入口：用 `?id=` 或 LIFF 取得學員 lineId，導向 dashboard。
- `dashboard.html` — **學員模式**儀表板（含課程切換 pills，任務／回報／排行榜依所選課程呈現）。
- `member.html` — **會員模式**（v2 新增・溫暖版）：今天／體格／館／我 四分頁。關掉變現潛力／成交回報／市場驗證／代幣／排行榜；核心是「開練＝記下對方的反應」與**關係軌跡**。
- `report.html` — **分析師解盤工作台**（v2 新增）：選人 → 體格總覽（層 1）→ 最低三塊判讀（層 2）→ 逐字腳本 → 教練校準。`?id=` 可直接開某人。
- `showcase.html` — 對外展示頁（示範學員成長軌跡）。
- HTML 引入順序固定為 `atpi-core.js` → `common.js`（→ `judgement.js`，member/report 才需要）。

## Google Sheet 設定（多 workshop 資料驅動）
分頁（欄位＝第一列標題，順序可任意，名稱對齊 `Code.gs` 的 `TABS`）：
- **學員**：`LINE userId | 姓名 | 團隊`（只當身份；舊的 出席/社群分享/作業/團隊賽 加總欄已不參與計分，可留可刪）。
- **workshops**：`workshopId | name | active`（active 空白或 true 視為開啟）。
- **tasks**（取代寫死的任務池）：`workshopId | taskKey | cadence | dim | muscle | pts | name | icon | needReview`。cadence＝`once`(專案)/`special`(需審核)/`daily`/`weekly`；dim＝`A|T|P|I`；**muscle＝`A1`–`I3`（v2 新增，可留空、可多值 `A1,T1`）**；needReview=true 的任務學員端顯示「待審核」不可自打，由導師補列打卡才計分。
- **enrollments**：`lineId | workshopId`（誰報了哪些課；沒設則暫時給看全部）。
- **打卡紀錄**：`lineId | workshopId | taskKey | cadence | dim | muscle | pts | date | 對方反應 | 對象 | 發生什麼`（投入的唯一真相來源）。後四欄 v2 新增，**全部可空**（見「低摩擦守則」）。
- **(遊戲)體測紀錄**（v2 新增，`migrateV2()` 自動建）：`lineId | 小肌群 | 分數(1–5) | 來源 | 日期 | 週次`。來源＝`quiz`(測驗基線)/`self`(週測自評)/`coach`(教練校準)。
- **成交紀錄**：`lineId | workshopId | amount | date | note | A | T | P | I`。
- **測驗結果**：自評來源（comconverttest 寫入），`userId | scoreA | scoreT | scoreP | scoreI`。

⚠️ 遷移：既有學員的專案/特殊點數要改成在 tasks 定義好、再到「打卡紀錄」補列（帶 workshopId/dim/pts/cadence），否則新版計分讀不到。舊「打卡紀錄」列若沒有 workshopId，能力仍算得到（靠 dim），但會被歸到空字串課程，建議回填 workshopId。

## ATPI 底層邏輯
- 四維度 A吸引力 / T信任力 / P專業力 / I推進力（I 統一叫「推進力」，不要用「影響力」）。
  ⚠️ **productkit 字典已把維度名正式改為「吸引肌肉／信任肌肉／專業肌肉／推進肌肉」**（「力」＝天賦語氣、「肌肉」＝可練語氣），本專案 `DIMS[].name` 尚未跟改＝已知待處理。
- **變現潛力值 = A×T×P×I 相乘**（各 0-1，見 `calcPotential`）。因為是相乘，任一維度為 0 潛力值就是 0——這是特性不是 bug。
- 變現流程甜蜜點：取最強兩維度組合查 `COMBO_PATH`（6 選 1）。

## 12 小肌群層（v2・已進計分）
定義真相＝productkit《01-核心定義字典》ATPI 條；程式真相＝`atpi-core.js` 的 `MUSCLES`／`MORD`（**comconverttest 也吃同一份**）。

**⚠️ 小肌群有兩個數字，刻意不混**——判讀要兩個交叉才看得出處置（productkit 27§8.7）：

| | 來源 | 是什麼 | 函式 |
|---|---|---|---|
| **體格分 1–5** | 體測紀錄分頁（quiz／self／coach） | 能力・解盤念的是這個 | `calcMuscleScores(s)`、大肌肉平均 `calcDimScores5(s)` |
| **投入分／%** | 打卡紀錄的 `muscle` 欄 | 努力・看他有沒有在練 | `calcMuscleInvest(s)`、`muscleTrainCount(s, mk, since)` |

- **半滿點** `muscleHalfPoint_()` ＝ `DIMS[dim].k / 3`——**推導不是另拍一組數字**，這樣「三塊各投入 x」時小肌群% 會跟大肌肉% 對得起來，之後校準 `DIMS[].k` 會自動跟著動。
- **最弱三塊** `weakestThree(s)`（解盤層 1）；**判讀** `readWeakest(s, since)` 回 `verdict`：
  - `untrained`（分數低＋沒練）→ 給標準功課
  - `plateau`（分數低＋練很多，門檻 `PLATEAU_MIN_COUNT`）→ 要客製 debug ＝ **升單訊號**
- **沒量過的小肌群不給預設值**——「還沒量」和「量出來很低」是兩件事，`weakestThree` 也不會選中它。
- **舊資料零回填**：打卡列沒有 `muscle` 時，`logMuscles_()` 回查任務池；查不到就只計進大肌肉，不會亂灌小肌群。
- 體測寫入 `postMuscleEval(lineId, evals, source)`（一次多筆）＋樂觀更新 `applyMuscleEval()`；`evaledThisWeek(s)` 判斷第一頁要不要把主行動換成體測（quiz 基線不算）。
- 開練帶額外欄位：`doCheckin(s, task, workshopId, {reaction, target, note})`——**三欄全可空**，低摩擦守則規定不可拿它們擋打卡。

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
- ~~一階大改版・子肌群層~~ → **12 小肌群已進計分**（見上節）。**剩下的是 UI 與資料**：
  1. **後端要跑一次 `migrateV2()`**（Apps Script 編輯器執行）＋重新部署，否則新欄位與體測分頁不存在。
  2. **任務分頁的 `muscle` 欄要填**（A1–I3）——不填的話小肌群投入分全是 0，只有大肌肉算得到。
  3. **測驗要出 12 小肌群基線**：`comconverttest` 目前只輸出 4 維，要改成 12 塊並以 `source=quiz` 寫進體測紀錄，否則新會員入館時體格是空的、`weakestThree` 選不出東西（productkit 04 使用者五點邏輯鏈第 1 點）。
  4. **剩下的 UI**：①**體測填答**（會員週日自評 9 或 12 題，`postMuscleEval(source:"self")` 已備妥、畫面還沒做）②**巡場清單**（暖暖包看誰沒來，10 月前要有）③`index.html` **依身分路由**到 member / dashboard（現在只導 dashboard）。
- **會員模式的社群區塊是 mock**：「今天 N 位夥伴在練」「館裡熱議」是寫死的示意（畫面上標了「示意」）。要真的接 Skool，還有 27§8.6 的硬規則「**開練紀錄自動流一份進 Skool**」——那是環境柱與社群柱的量測前提，目前完全沒做。
- **dashboard（學員模式）用語尚未跟上語彙表**：仍寫「打卡／任務」，字典已定為「開練／動作」（器材＝App、館＝Skool、一組＝3 動作封頂）。member.html 已用新語彙。
- **`atpi-core.js` 的長篇文案仍是「〇〇力」**（`STRONG_PATH`／`COMBO_PATH`／`WEAK_DESC`），**改動會同時影響 comconverttest**，需另開一輪處理。結構化維度名 `DIMS[].name` 已改為「〇〇肌肉」。
- 計分口徑（**2026-08-28 裁決 D5A 改版**）：每維能力 = 投入%（**飽和曲線** `100 × 累積分 /(累積分 + DIMS[k].k)`，累積到 `k` 分＝50%，永遠逼近 100 不爆表），**只吃行為證據（打卡／練習紀錄），沒有第二個乘數**。`DIMS[k].k`（半滿點，取代舊的固定滿分 `max`）是軟旋鈕，待真實數據微調。設計全貌見專案記憶 scoring-model-design。
  - ⚠️ **舊口徑已作廢**：`calcDims` 曾經再乘上 `validationFactor`（由成交金額×筆數算出）＝「用成交回推能力、再用能力預測變現」的循環論證。該函式已改名 `marketValidation(s)`、改用途成**獨立顯示的外部驗證欄位**（回傳 `{amount,count,amtAchieve,cntAchieve,index,pct,legacyFactor}`），**不乘進任何分數**。常數 `TARGET_AMOUNT`/`TARGET_COUNT` 現在只當市場驗證的分母；`VALID_FLOOR` 只剩 `legacyFactor` 用來對照舊快照，**禁止再乘進能力分**。
  - 成交紀錄分頁的 `A|T|P|I` 快照欄語意同步換了：2026-08-28 之後存的是「當下練出來的投入分」，之前的舊列是「投入×驗證係數」且**不回頭改寫**（歷史保留原樣），走勢圖跨那條線比較時要知道。
- 等級門檻 `LEVELS`（0/10/18/24/29）是舊「29 滿分」模型留下的；`totalScore` 現含每日/每週會無限累積，血條已改 `levelProgress()` 走「到下一級的進度」不爆表，但門檻本身要不要納入每日/每週、重新設計，待定。
- 打卡與成交**都已接 Google Sheet 持久化**：載入用 `loadLogs()`（GET `?action=logs`）讀回、`postCheckin()`/`postRevenue()`（POST）寫入「打卡紀錄」/「成交紀錄」分頁；成交會存下當下四維分數快照供走勢圖用。自評起點用 `loadSelfEval()`（GET `?userId=`）讀同一試算表的測驗結果，只顯示不計分。

## Git
改完直接 commit + push 到 main，GitHub Pages 約 1-2 分鐘更新。
