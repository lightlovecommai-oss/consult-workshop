/* ═══════════════════════════════════════════════════════════
   track.js — 數位足跡共用件
   規範真相＝productkit 1-手冊（內部）/31-數位足跡與追蹤規範.md

   跟 atpi-core.js 一樣是**跨專案共用**：健身房這份是本尊，
   comconverttest／LP 放同步副本（各自獨立 GitHub Pages，沒辦法 src 對方的檔）。

   ⭐ 鐵則：這裡**只 push dataLayer，絕不直接呼叫 gtag／fbq**。
      五個專案有四個是 GitHub Pages，把工具商 API 寫進頁面，
      等於以後每加一個 pixel 都要重新發版全部專案。走 GTM 就只動後台設定。

   ⚠️ 低摩擦守則同樣適用：**追蹤壞掉永遠不可以擋住使用者往下走。**
      整份每個對外函式都包 try/catch，出事只寫 console，絕不 throw。
   ═══════════════════════════════════════════════════════════ */

var GTM_ID = "GTM-TWLHJWL8";

/* 合法事件字典（規範 §4）。打錯字的在 console 警告但照送——
   擋下來只會讓漏斗少一格，不會讓命名變乾淨。 */
var TRACK_EVENTS = [
  "page_view", "session_source",
  "quiz_view", "quiz_explain_view", "quiz_start", "quiz_question_answered",
  "quiz_abandon", "quiz_complete", "result_view", "result_section_view",
  "secret_view", "result_share", "lead_submit", "lead_skip",
  "gym_enter_click", "gym_first_open", "checkin_complete", "muscle_eval_submit", "workshop_register",
  "consult_book_click", "consult_booked", "purchase",
  "cta_click", "scroll_depth", "screen_view"
];

/* ── 進站來源：只認第一次 ──
   他可能今天從廣告進來、三個月後從 LINE 訊息回來才成交。
   要回頭認出「是那支廣告帶他來的」，就必須**只記第一次**、之後不覆蓋。 */
var ATTRIB_KEY = "cw_attrib_v1", SID_KEY = "cw_sid";

function trackSessionId() {
  try {
    var s = localStorage.getItem(SID_KEY);
    if (!s) {
      s = "s_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
      localStorage.setItem(SID_KEY, s);
    }
    return s;
  } catch (e) { return ""; }
}

function firstTouch_() {
  try {
    var saved = JSON.parse(localStorage.getItem(ATTRIB_KEY) || "null");
    var q = new URLSearchParams(location.search);
    var fresh = {
      utmSource:   q.get("utm_source")   || "",
      utmMedium:   q.get("utm_medium")   || "",
      utmCampaign: q.get("utm_campaign") || "",
      fbclid:      q.get("fbclid")       || "",
      ts: Date.now()
    };
    var hasNew = fresh.utmSource || fresh.utmMedium || fresh.utmCampaign || fresh.fbclid;
    if (saved && !hasNew) return saved;          // 已經記過、這次沒帶新的 → 保留原本那筆
    if (!saved && !hasNew) return fresh;         // 兩邊都空，不用寫進 localStorage 佔位
    localStorage.setItem(ATTRIB_KEY, JSON.stringify(fresh));
    return fresh;
  } catch (e) { return { utmSource:"", utmMedium:"", utmCampaign:"", fbclid:"", ts:0 }; }
}

function cookie_(name) {
  try {
    var m = document.cookie.match("(^|;)\\s*" + name + "\\s*=\\s*([^;]+)");
    return m ? m.pop() : "";
  } catch (e) { return ""; }
}

/* GA4 的 _ga cookie 長這樣：GA1.1.1234567890.1699999999
   client_id ＝ 後兩段（前兩段是版本與網域層級，回灌時對不上要用的不是它們）。 */
function gaClientId_() {
  var raw = cookie_("_ga");
  if (!raw) return "";
  var p = raw.split(".");
  return p.length >= 4 ? p.slice(-2).join(".") : "";
}

/* Meta 的 _fbc 通常由 pixel 自己種；pixel 還沒裝好的期間，
   就照官方格式從網址的 fbclid 自己組一份，免得這段時間的廣告點擊全丟掉。 */
function fbc_() {
  var c = cookie_("_fbc");
  if (c) return c;
  var f = firstTouch_();
  return f.fbclid ? "fb.1." + (f.ts || Date.now()) + "." + f.fbclid : "";
}

/* 寫進 Google Sheet 用的那包（對齊 Code.gs 的 TRACK_COLS）。
   ⚠️ 這包**不含 line_user_id 與 Email**——那兩個是主鍵/個資，各端點本來就有自己的欄位，
      不從這裡送，也不會被塞進任何第三方（規範 §6）。 */
function trackPayload() {
  try {
    var f = firstTouch_();
    return {
      sessionId: trackSessionId(), gaClientId: gaClientId_(), fbc: fbc_(), fbp: cookie_("_fbp"),
      utmSource: f.utmSource, utmMedium: f.utmMedium, utmCampaign: f.utmCampaign
    };
  } catch (e) { return {}; }
}

/* ── 漏斗階段：從檔名推，不用每頁自己填 ── */
function funnelStage_() {
  try {
    var p = (location.pathname.split("/").pop() || "index").replace(".html", "");
    var map = { "": "entry", index: "entry", visitor: "visitor", join: "join",
                member: "member", pro: "pro", dashboard: "legacy", showcase: "showcase" };
    return map[p] || p;
  } catch (e) { return ""; }
}

var TRACK_UID = "";
function setTrackUser(uid) {
  TRACK_UID = uid || "";
  /* user_id 一送出去就會綁住之後所有事件，所以拿到身分的第一時間就要送 */
  track("session_source", {});
}

/* ── 主函式 ── */
function track(name, params) {
  try {
    if (TRACK_EVENTS.indexOf(name) < 0) console.warn("[track] 不在事件字典裡的名稱：" + name);
    var t = trackPayload();
    window.dataLayer = window.dataLayer || [];
    var payload = {
      event: name,
      line_user_id: TRACK_UID,
      session_id: t.sessionId,
      funnel_stage: funnelStage_(),
      utm_source: t.utmSource, utm_medium: t.utmMedium, utm_campaign: t.utmCampaign
    };
    for (var k in (params || {})) payload[k] = params[k];
    window.dataLayer.push(payload);
  } catch (e) { console.log("[track] " + e); }
}

/* ── 載入 GTM ──
   本機（file:／localhost）不載，免得開發流量污染正式報表。 */
(function initGTM(){
  try {
    window.dataLayer = window.dataLayer || [];
    var h = location.hostname;
    if (!h || h === "localhost" || h === "127.0.0.1") { console.log("[track] 本機環境，不載入 GTM"); return; }
    window.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
    var f = document.getElementsByTagName("script")[0];
    var j = document.createElement("script");
    j.async = true;
    j.src = "https://www.googletagmanager.com/gtm.js?id=" + GTM_ID;
    f.parentNode.insertBefore(j, f);
  } catch (e) { console.log("[track] GTM 載入失敗（不影響功能）：" + e); }
})();
