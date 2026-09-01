# 溝通健身房 v3 · Session 交接包

> 前一份＝`_健身房v2-SESSION交接.md`（v2 已完成，內容仍可查架構，但 §7/§8 待辦已過期）。
> 開新 session 規則：**從 `4-溝通健身房/consult-workshop` 目錄啟動 claude（Opus）**，一次做一件事。
> **最後更新**：2026-09-01

---

## 0. v3 是什麼

**v2 做完了**（12 小肌群進計分＋會員模式＋分析師解盤台，見 §3）。
**v3 ＝ 依三種 TA 拆成三種畫面 ＋ 啟用自有網域。**

現在的問題：`member.html` 是「一種會員」的畫面，但實際上有**三種人**會進來，
他們的目的、看到的東西、下一步都不一樣。硬塞同一頁會三邊都不對。

---

## 1. ⭐ 三種 TA（使用者 2026-09-01 口述・v3 主軸）

| # | 誰 | 付多少 | 進來看到什麼 | **這一層的 job** |
|---|---|---|---|---|
| **1** | **參觀路人** | 免費 | 量好 InBody（ATPI 體測）→ 做一些**簡單的健身房體驗**→ **看到裡面很多人在練**→ 幾個小打任務 | **拉到 99**（賣點＝InBody 解析 ＋ 巡場教練協助 ＋ 社群） |
| **2** | **健身房會員** | **99／月** | 量好 InBody → **專人解盤** → **3 個月內跟進肌肉練習狀況**。視角＝**讓他練「最有體驗」的那 1–2 塊就好** | **跟進到教練課**：有體驗感後 → 參加分享會 或 進諮詢買課 |
| **3** | **會員＋教練課** | **3.28 萬** 或 **10.8 萬** | **L1–L4** 打好基礎、每一塊肌肉都練；**L5–L8** 綜合放大、找出自己的甜蜜路徑 | **真的實戰落地出變現結果** |

**⚠️ 這一條直接推翻 v2 的預設**：
v2 的 `member.html` 派的是「**最弱三塊**」（`pickTodaySet` → `weakestThree`），
但第 2 層的正確視角是「**練最有體驗的 1–2 塊**」——**不是最弱，是最容易做出感覺的**。
這兩者常常不是同一塊（最弱的往往最難、最容易讓人放棄）。
→ v3 要新增一個「**體驗優先度**」的排序，不能只用分數低排序。

**平台**：目前全部 web，**以後會做 app 版**——所以現在別做任何綁死 web 的架構決定。

---

## 2. ⭐ 網域（要啟用）

- **`atpifit.com` 已註冊**（2026-08-16，自動續訂＋WHOIS 隱私已開，DNS 走 Cloudflare 免費方案）。
- 現在站在 `https://lightlovecommai-oss.github.io/consult-workshop/`，**還沒接自有網域**。
- 英文品牌名＝**ATPIFit**（`ATPI`＋`Fit`；A-T-P-I 順序不可寫成 APTI，駝峰只在 F 大寫）。
  ⚠️ `ATPI` **單獨不可當對外品牌**（英國差旅巨頭 ATPI Limited 持有 atpi.com 與國際商標）。
- 做法＝GitHub Pages 自訂網域（repo Settings → Pages → Custom domain ＋ Cloudflare CNAME）。
  **注意**：加 `CNAME` 檔後，`liff.openWindow`／`addToHomeGuide()` 裡**寫死的 github.io 網址要一起改**
  （`dashboard.html` 的 `addToHomeGuide()` 有 hardcode base URL），還有 LINE Developers 的 LIFF Endpoint URL。

---

## 3. v2 已交付（已 commit＋push，線上可看）

| 檔 | 是什麼 |
|---|---|
| `atpi-core.js` | `MUSCLES` 12 小肌群（跨專案共用）、`MORD`、`DIM_RESULT` 結果句、`weakestMuscles`、`dimFromMuscles`、`EVAL_ANCHORS` |
| `common.js` | 體格分 `calcMuscleScores`／投入分 `calcMuscleInvest`／判讀 `readWeakest`／`currentStreak`／`daysSinceJoin`／`postMuscleEval` |
| `judgement.js` | 判讀規則表（12 塊 symptom/homework/opener/evidence）＋`buildScript()`＋**內建動作庫 fallback**（`pickTodaySet`） |
| `member.html` | **會員模式・溫暖版**：今天／體格／館／我。開練＝記對方反應（3 下點擊）、關係軌跡、家人煞車 |
| `report.html` | **分析師解盤工作台**：體格總覽（層1）→ 最低三塊判讀（層2）→ 逐字腳本 → 12 塊教練校準 |
| `apps-script/Code.gs` | 打卡加 `muscle/對方反應/對象/關係/發生什麼`、新 `(遊戲)體測紀錄` 分頁、`action=eval`、`migrateV2()` |

**測試網址**（`?demo=1` ＝ 假資料在前端，不寫 Sheet）：
- `https://lightlovecommai-oss.github.io/consult-workshop/member.html?demo=1`
- `https://lightlovecommai-oss.github.io/consult-workshop/report.html?demo=1`

### 🔴 後端還沒部署——沒做這三步，v2 的資料層是斷的

1. 本機 `apps-script/Code.gs` 全選 → 貼進 Apps Script 編輯器
2. 執行一次 **`migrateV2`**（補欄位＋建體測分頁）
3. 部署 → 管理部署 → 編輯 → 版本「新增」→ 部署（網址不變，`SHEET_API` 不用改）

沒做的話：體格全「未量」、開練看起來成功但 `muscle/對方反應/對象` 全被丟掉、關係軌跡永遠空的、解盤台校準送不出去。

---

## 4. 已定案・不要再重新討論

| 定案 | 理由 |
|---|---|
| **小肌群有兩個數字，不混** — 體格分 1–5（能力·解盤念這個）／投入分（努力·看有沒有在練） | 兩個交叉才判讀得出處置：低分+沒練→給標準功課；低分+練很多→轉顧問（升單訊號）。只有一個數字這兩種人會被當成同一種 |
| **小肌群半滿點＝`DIMS[dim].k / 3`**（推導，不另拍數字） | 「三塊各投入 x」時小肌群% 會跟大肌肉% 對得起來；日後校準 `k` 會自動跟著動 |
| **沒量過的小肌群不給預設值** | 「還沒量」和「量出來很低」是兩件事；給 0 會讓新人一入館就被判 12 塊全弱 |
| **低摩擦守則**：必填全點擊、打字選填；細節只在「明顯有／超乎預期」才問；「沒反應」不扣分 | 成功指標是「每天多少人點得下去」，不是「紀錄多完整」。沒人用的話一筆資料都沒有 |
| **家人／朋友煞車不可拿掉** | 大包裝「力量是為了給愛，不是廝殺」。把每段關係都推向成交會讓產品變成業務工具 |
| **溫暖版＝會員／科技版＝學員** | productkit 字典「兩種 TA 的贏法」鐵則③ |
| **workshopId `一階/二階/三階` 不動** | 那是 Sheet 的實際資料鍵，改了線上開通名單與打卡紀錄全部對不上。要改是獨立的資料遷移任務 |

---

## 5. 🔴 未決・要使用者或下個 session 拍板

| # | 問題 | 現況／傾向 |
|---|---|---|
| 1 | **「體驗優先度」怎麼定？** 第 2 層要練「最有體驗的 1–2 塊」，不是最弱三塊 | 現在只有 `weakestThree`（純分數低排序）。需要在 `MUSCLES` 或 `JUDGEMENT` 加一個「見效快慢」欄。**參考**：productkit 27§3 已標過「見效快、適合首發：A1／A2／P2／I2；見效慢別放首發：T3（7-11-4 長期累積）、A3（故事要打磨）」——這份清單可以直接當種子 |
| 2 | **⚠️ 關係軌跡跟 G6 打不打架？** | 我做的軌跡把 `A→T→P→I` 當**有序流程**畫在同一個人身上；但字典 G6（2026-08-28）明文說「**4 大肌肉＝能力向量（無序）／四種火・水溫＝關係階段（有序）**，兩者不同層、**不可混用同一組分數**」。字典「關係軌跡」條目前仍寫著 ATPI 順序——**兩條規則可能互相矛盾，要判**。若 G6 優先，軌跡要改成畫「四種火」而不是 ATPI |
| 3 | **參觀路人層要不要獨立頁？** | 傾向要（`visitor.html`）——它的重點是「看到很多人在練」＋幾個小任務，跟會員頁的體格/軌跡完全不同 |
| 4 | **過頭訊號的 UI** | `EVAL_ANCHORS` 已於 2026-08-30 改成**非單調**（做太多會扣分，出現過頭訊號該格封頂 3 分），但 member/report 的填答 UI **還沒補過頭勾選**。12 格全表＝productkit 22 檔 §四 |
| 5 | **體測填答畫面沒做** | `postMuscleEval(source:"self")` 已備妥，畫面還沒做。沒有它，體格分只會停在測驗基線不會動＝迴路缺一環 |
| 6 | **測驗要出 12 小肌群基線** | `comconverttest` 目前只輸出 4 維。**在另一個 repo**，要另開 session |
| 7 | **開練紀錄流進 Skool** | 27§8.6 硬規則「打卡要打在看得到的地方」＝環境柱與社群柱的量測前提，完全沒做。要先確認 Skool API 能力 |

---

## 6. 踩過的坑・別重踩

1. **`loadBootstrap()` 的正規化會吃掉新欄位。** 後端加了 `muscle` 前端卻拿不到——因為 `loadBootstrap` 逐欄重建物件，沒列到的欄位直接消失。**加後端欄位時，一定要同步改 `loadBootstrap` 的 map。**
2. **全庫置換 pattern 太寬會誤殺。**（本 session 真的犯了，而且記憶裡早就記過同一個坑）
   把「讓他覺得你懂 → 讓他覺得有解」全庫置換，誤殺了 `COMBO_PATH` 裡合法的 T 描述「信任肌肉讓他覺得**你懂他**」，也把變更記錄的「舊值→新值」改成「新值→新值」讓記錄失去意義。
   **→ 置換前先 `grep -n` 看每一處的上下文；變更記錄／註解裡的舊值是刻意保留的，不能改。**
3. **`serve` 會把 `.html?query` 做 301 並吃掉 query string。** 本機測要用乾淨網址 `/member?demo=1`，不要 `/member.html?demo=1`。
4. **前端注入測試會跟 `boot()` 的 `await` 搶。** 頁面剛載入就注入假資料，`boot()` 的 fetch 稍後回來會把 `S` 蓋掉，症狀是「資料莫名消失、fallback 被觸發」。**注入和操作要放同一次 `javascript_exec`。**
5. **字串拼 HTML 漏 `</div>` 會讓卡片互相巢狀。** `arcHTML` 漏一個收尾，三張軌跡卡變巢狀，導致 `card.querySelectorAll('.node')` 撈到別張卡的節點、家人煞車套錯人。**改 `.map().join()` 產生的卡片時，先數開合標籤。**
6. **🔴 多 session 撞檔。** `atpi-core.js`／`judgement.js`／`common.js` 這輪同時被另一個 session 改（commit `aaaf311`、`fda2d10`）。
   **動這批檔前先 `git log --oneline -6` 看有沒有別人剛推**；撞到就先停手交接，別硬改。

---

## 7. 下一步（按優先序）

1. **【卡使用者】部署後端三步**（§3 紅字）——不做的話 v2 全部只是畫面，測不了真流程。
2. **【可自己做】三種 TA 拆頁**——先定「體驗優先度」（§5-1，種子清單已有），再拆 `visitor.html` ／改 `member.html` 的派課邏輯 ／`index.html` 依身分路由。
3. **【卡使用者】啟用 `atpifit.com`**（§2）——需要 Cloudflare DNS 與 GitHub Pages 設定權限，並同步改 LIFF Endpoint 與程式裡寫死的 base URL。

**開工第一件事**：先讀 `productkit/1-手冊（內部）/01-核心定義字典.md`（最後更新 2026-08-28 之後又改過多輪）與 `04-決策追蹤清單.md` 的覆盤紀錄。
**本 session 的教訓是：字典改得比程式快很多，用舊版字典寫程式會寫出作廢用詞。**

---

## 8. 怎麼驗收沒壞

```bash
cd 4-溝通健身房/consult-workshop
for f in atpi-core.js common.js judgement.js; do node --check $f; done   # 語法
npx -y serve -l 3100 .                                                   # 本機起站
# 然後開 http://localhost:3100/member?demo=1 與 /report?demo=1
cd ../../5-企劃與產品手冊/productkit && python3 check.py                  # 定義漂移（要全綠）
```

---

## 9. 操作備忘（沿用 v2）

- **改後端**：Code.gs 貼進 GAS → 部署→管理部署→編輯→版本「新增」→部署（網址不變）。
- **改前端**：commit＋push main，GitHub Pages 1–2 分鐘更新。
- **GAS 踩雷**：大量改列別逐列 `deleteRow`（會跳「發生不明錯誤」），用「一次清空＋一次寫回」。
- **git 身分**：本機已設 `lightlovecommai-oss` / `lightlovecommai@gmail.com`（v2 交接說沒設，已不成立）。
- 架構／資料模型／天麗現況＝見 `_健身房v2-SESSION交接.md` §1／§2／§6（那幾節仍然正確）。

## 10. 相關專案記憶（新 session 可 recall）

`atpi-product-architecture`、`membership-recurring-model`、`sheet-communication-data-architecture`、
`tenlead-workshop-same-sheet`、`multi-session-file-collision`、`bulk-edit-safety`、
`gym-task-dim-comma-gotcha`、`brand-naming-layers`、`big-package-communication-road`。
