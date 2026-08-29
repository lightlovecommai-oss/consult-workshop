# 溝通健身房 v2 · Session 交接包

> 用途：把「溝通健身房」現況一次交清，讓**新 session 從這裡接手做 v2**（策略改版＋新課綱上架）。
> 開新 session 規則：**從 `4-溝通健身房/consult-workshop` 目錄啟動 claude（Opus）**，一次做一件事。

---

## 0. 一句話
LINE LIFF 的學員遊戲化儀表板：打卡累積 ATPI **4 大肌肉**、成交做市場驗證、畫成長雷達/走勢圖、榮譽/稱號/戰隊/代幣兌換。純 HTML+CSS+原生 JS，資料全在 **Google Sheet（Apps Script Web App）**。
**🔄 2026-08-28 定位改版**：溝通健身房＝**整家公司的招牌／場館＋獨立產品線（99 元會員費）**。~~1+1 系統的第二個月引擎~~ 已退役——課程不再綁健身房月，課程留存改由「回放 1 年＋討論會籍 1 年」承擔。健身房現在有三種用法：①99 會員的自主練習場（獨立產品線）②教練課學員的課間實作場（一週迴路中段）③Workshop 現場競賽計分板。

- 線上：`https://lightlovecommai-oss.github.io/consult-workshop/`（GitHub Pages，push main 1–2 分鐘更新）
- Repo：`lightlovecommai-oss/consult-workshop`（**oss 帳號、main 分支**）
- 企劃大腦（產品定義真相）：`../../5-企劃與產品手冊/productkit`；核心概念＝`1-手冊（內部）/01-核心定義字典.md`

## 1. 架構（四件一組）
- **靜態站**（本 repo）：`index.html`（入口取 lineId）→ `dashboard.html`（儀表板本體）；`showcase.html`（對外展示）；`atpi-core.js`（跨專案共用 ATPI 邏輯，comconverttest 也用同一份）→ `common.js`（本專案資料層）；引入順序固定 `atpi-core.js`→`common.js`。
- **後端**：`apps-script/Code.gs`（Google Apps Script Web App，所有 GET/POST 端點）。
- **端點常數**（`common.js` 檔頭）：`LIFF_ID="2010316474-wmb1ODe0"`、`SHEET_API=…/exec`。
- **資料**：一份 Google Sheet「溝通變現資料」，分頁分三套系（漏斗/遊戲/設定），細節見專案記憶 `sheet-communication-data-architecture`。

## 2. 資料模型（Sheet 分頁 · Code.gs 的 TABS）
- `(設定)課程` `workshopId|name|active|team`｜`(設定)任務` `workshopId|taskKey|cadence|dim|pts|name|icon|needReview|desc|locked`
- `(設定)榮譽品項` `honorId|workshopId|metric|value|icon|name|desc|tier|celebrate|scope`｜`(設定)兌換品項` `rewardId|name|desc|cost|value|icon|active`（**全站共用一個代幣錢包，沒有 workshopId 欄**）
- `(遊戲)開通名單`（＝人主檔＋開通寬表：每門課一欄，欄名＝workshopId，打勾＝開通；「團隊」欄＝戰隊分組）
- `(遊戲)打卡紀錄`／`(遊戲)成交紀錄`／`(遊戲)榮譽事件`／`(遊戲)兌換紀錄`／`(遊戲)待審核`｜`(漏斗)能力測驗`（comconverttest 寫入，自評來源）
- **多 workshop 是資料驅動**：任務/徽章/開通都靠分頁，不寫死；ATPI 是「人(lineId)」的屬性、跨課合併，workshop 只是輸入管道。

## 3. 計分機制（改任何規則前必懂）
- **變現潛力 = A×T×P×I 相乘**（各 0–1，`atpi-core.js` 的 `calcPotential`）。
  ⚠️ **2026-08-28 D4A 口徑修正**：~~缺一即零~~ 作廢 → 改「**任一塊趨近零時嚴重折損**」。字面的零可被證偽（被引薦、被指定找上門的成交，A 幾乎為零仍然成交）。相乘保留為品牌金句與直覺說明。
  ⚠️ **現行唯一骨架＝門檻級聯**（沿用「四種火」）：A 點火 0–10° → T 抬底線 10–50°（棘輪·不可逆）→ P 墊天花板 50–90°（底線未到無效）→ I 閥門 90–100°。一句話＝「**信賴感是門檻，解決問題是放大器；門檻沒過，專業是負分。**」
  ⚠️ **不要再把四塊切成「信賴感／解決問題」兩半**——P 是跨界項（能力本來就是信任的一部分）、I 是第三類（兌現層）。舊句「變現＝50%信賴感＋50%解決問題」已全面停用。
- 每維能力 = **投入%（飽和曲線 `100×累積/(累積+DIMS[k].k)`，到 k 分＝50%，逼近 100 不爆表）**，**只吃行為證據、沒有第二個乘數**。
  ⚠️ **2026-08-28 D5A 已改**：舊算法再乘 `validationFactor`（由成交金額×筆數算）＝**循環論證**（用成交回推能力、再用能力預測變現）。該函式已改名 `marketValidation(s)`、改成**獨立顯示的外部驗證欄位**，**不乘進任何分數**。`TARGET_AMOUNT/TARGET_COUNT` 現在只當市場驗證的分母；`VALID_FLOOR` 只剩 `legacyFactor` 對照舊快照。
  ⚠️ **歷史資料不回頭改寫**：成交紀錄的 `A|T|P|I` 快照，2026-08-28 之後存的是「當下練出來的投入分」，之前的舊列是「投入×驗證係數」——走勢圖跨那條線比較時要知道。
- `calcDims` 靠打卡紀錄存的 `dim/pts` 加總（跨課），別的 workshop 任務 key 不在本地也算得到。
- **多維任務**：`dim` 欄支援逗號（如 `A,T,P`），分數平均分攤（近期改動）。
- 榮譽/稱號/戰隊/代幣：榮譽是「人」的屬性跨課合併；稱號綁潛力 0–1000；戰隊靠「團隊」欄同名成組（≥2 隊才顯示）；代幣天花板＝已開通課的 once/special 任務滿分加總。

## 4. 現有課程（workshops）
> ⚠️ **2026-08-28 命名改版，但 workshopId 不動**：`一階/二階/三階` 是 **Google Sheet 裡的實際資料鍵**，改了會讓線上開通名單、打卡紀錄全部對不上，**維持原值**。
> 對外／文件的新說法對照：**一階＝鍛鍊段 L1–L4**／**二階＝放大段 L5–L8**（兩者合為 **超引力顧問課**・3.28 萬）／**三階＝演說段 L9–L13**（**超引力公眾演說課**・10.8 萬・演說段由 4 堂改 5 堂）。系列名＝**超引力成交學**。
> 要改 workshopId 是一次資料遷移（需同步 Sheet 多個分頁），列為未來獨立任務、不要順手做。

| workshopId（資料鍵·不動） | 說明 | team |
|---|---|---|
| 二階 | 放大段 L5–L8（1v1 甜蜜路徑・目前定錨、預設落點） | 關(愛的貨幣) |
| 一階 | 鍛鍊段 L1–L4（**一課一塊肌肉**：L1 吸引／L2 信任／L3 專業／L4 推進＝12 小肌群）。⚠️ 舊敘述「4週對應A/T/P/I」仍成立，但舊規則「不含 I」已作廢 | 關 |
| 三階 | 演說段 L9–L13（1vN 公眾演說・**由 4 堂改 5 堂**） | 關 |
| 1v1顧問實戰／主持人實戰／短影音實戰 | 工作坊 | 開(戰隊) |
| **tenlead-1** | **天麗變現共訓營**（同站新 workshop，見 §6） | 開 |

## 5. 最近改動（這一輪已完成、已上線）
- **PWA/桌面化**：改名「溝通健身房」、換 icon（對話框＋啞鈴）、加到主畫面引導、manifest 調整（`dashboard.html`/`manifest.json`/icon）。
- **多維 dim**（A,T,P 逗號、平均分攤）＋一階 social/先修/多維任務改版＋`updateLevel1Tasks`。
- **Code.gs 整合梳理**：天麗段收斂成單一真相區（見 §6）。

## 6. 天麗（tenlead-1）現況 — 已上線
- **不 fork、同 Sheet 同 LIFF**，只是一個新 workshop（為了同測驗入口、未來升單無縫接軌）。真相：專案記憶 `tenlead-workshop-same-sheet`。
- Code.gs 檔尾「██ 天麗變現共訓營 ██」單一真相：`TENLEAD_TASKS`(24 支：每日7/每週5/里程碑6/課程6，全自打卡免審核)、`TENLEAD_HONORS`(6)、`TENLEAD_TEAMS`(15 隊)。
- 一次性函式：`setupTenlead()`（一鍵建課程+任務+徽章+開通欄）、`updateTenleadTasks()`（整組覆蓋，改任務就重跑）、`addTenleadEnrollColumn()`、`assignTenleadTeams()`（依姓名分隊）、`removeTenlead()`（測試清空）。
- 待收尾：3 位待歸屬（蔡侑庭/蘇育清/姿嬅）、12 位待進名單再補隊。

## 7. 🚧 v2 要做的（新課綱 · 策略改版）
**主線＝鍛鍊段（L1–L4）大改版・小肌群層**（承 productkit 04「L1 一週迴路」；CLAUDE.md「已知待處理」第一條）：
1. **打卡計分細到子肌群**：現在只算 A/T/P/I 四維，要細到 **A1/A2/A3 各自累積**，健檢報告畫**三條子進度條**。
2. **每日打卡順手做子肌群自評 1–5**（列健身房代辦·實驗中，效果待觀察）。
3. 任務仍走 `tasks` 分頁 schema（cadence/dim/pts）；**dim 仍是 A，子肌群用 taskKey 區分**（不動 schema，靠 taskKey 命名切子群）。

→ **新 session 第一步**：先讀 `productkit/1-手冊（內部）/04-決策追蹤清單.md` 與核心定義字典，確認「新課綱＝子肌群定義」的最終版，再回來動 `atpi-core.js`/`common.js`/`Code.gs`。

## 8. 開新 session 要先問/先確認的
- 新課綱把 ATPI 拆成哪些子肌群？命名慣例？（會決定 taskKey 命名與報告 UI）
- 小肌群是**只有鍛鍊段（L1–L4）**，還是放大段/演說段、天麗也要？（影響是否動全域計分）
  ⚠️ 2026-08-28：productkit 有**另一個 session 正在重梳 L1–L4 的小肌群與技巧**，動這塊前先跟那邊對齊。
- 子進度條要進 `dashboard.html` 哪一區？潛力值/雷達圖還是維持四維，只多一層子群明細？
- 每日自評要不要進計分，還是純顯示（像測驗自評那樣不計分）？

## 9. 操作備忘
- **本機測試**：launch.json 用 `serve`；測 dashboard 用乾淨網址 `/dashboard?id=<lineId>`（別用 `.html?id=`，serve 會 301 吃掉 query）。真實 lineId：先 `await loadStudents()` 取 `STUDENTS[0].lineId`。
- **改後端**：Code.gs 貼進 GAS → 部署→管理部署→編輯→版本「新增」→部署（網址不變，SHEET_API 不用改）。
- **改前端**：直接 commit+push main，Pages 1–2 分鐘更新。
- **GAS 踩雷**：大量改列別逐列 `deleteRow`（會跳「發生不明錯誤」），用「一次清空+一次寫回」。
- **git 身分**：這台沒設 commit email（顯示 ivor@…local），需要正確 email 要先 `git config`。

## 10. 相關專案記憶（新 session 可 recall）
`tenlead-workshop-same-sheet`、`sheet-communication-data-architecture`、`membership-recurring-model`、`big-package-communication-road`、`brand-naming-layers`、`visual-style-dyson-exploded`、`competitor-positioning-whitespace`、`l1-pending-deliverables`。
