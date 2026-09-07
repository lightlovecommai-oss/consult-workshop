/* 產生 GTM 容器匯入檔（一次性工具，產完可留著改設定用）。
   跑法：node gtm-build.js  →  gtm-atpifit-匯入用.json */

var GA4_ID = "G-0N74RRP810";
var CONFIG_TAG_NAME = "GA4 設定 - atpifit";

/* 要當事件參數送出去的資料層欄位。track.js 每個事件都會帶前六個，
   後五個是特定事件才有（沒有時 GA4 會自動略過，不會送空值）。 */
var DLV = [
  "line_user_id", "session_id", "funnel_stage",
  "utm_source", "utm_medium", "utm_campaign",
  "screen", "cta_id", "task_key", "dim", "muscle"
];

var EVENT_REGEX = "^(quiz_.*|result_.*|lead_.*|gym_.*|secret_view|consult_.*|"
  + "checkin_complete|muscle_eval_submit|workshop_register|purchase|"
  + "cta_click|scroll_depth|screen_view|session_source)$";

var ACC = "0", CID = "0";
function base(extra) { return Object.assign({ accountId: ACC, containerId: CID, fingerprint: "0" }, extra); }
function tpl(k, v) { return { type: "TEMPLATE", key: k, value: v }; }
function map(pairs) { return { type: "MAP", map: pairs }; }

var variable = DLV.map(function (name, i) {
  return base({
    variableId: String(i + 1),
    name: "DLV - " + name,
    type: "v",
    parameter: [
      { type: "INTEGER", key: "dataLayerVersion", value: "2" },
      { type: "BOOLEAN", key: "setDefaultValue", value: "false" },
      tpl("name", name)
    ]
  });
});

var trigger = [base({
  triggerId: "1",
  name: "所有 ATPI 事件",
  type: "CUSTOM_EVENT",
  customEventFilter: [{
    type: "MATCH_REGEX",
    parameter: [tpl("arg0", "{{_event}}"), tpl("arg1", EVENT_REGEX)]
  }]
})];

var tag = [
  base({
    tagId: "1",
    name: CONFIG_TAG_NAME,
    type: "googtag",
    parameter: [
      tpl("tagId", GA4_ID),
      {
        type: "LIST", key: "configSettingsTable",
        list: [map([tpl("parameter", "user_id"), tpl("parameterValue", "{{DLV - line_user_id}}")])]
      }
    ],
    firingTriggerId: ["2147479553"],   /* 內建「All Pages」 */
    tagFiringOption: "ONCE_PER_EVENT",
    monitoringMetadata: { type: "MAP" }
  }),
  base({
    tagId: "2",
    name: "GA4 事件 - 全部（動態事件名）",
    type: "gaawe",
    parameter: [
      { type: "BOOLEAN", key: "sendEcommerceData", value: "false" },
      tpl("eventName", "{{_event}}"),
      {
        type: "LIST", key: "eventSettingsTable",
        list: DLV.map(function (n) {
          return map([tpl("parameter", n), tpl("parameterValue", "{{DLV - " + n + "}}")]);
        })
      },
      { type: "TAG_REFERENCE", key: "measurementId", value: CONFIG_TAG_NAME }
    ],
    firingTriggerId: ["1"],
    tagFiringOption: "ONCE_PER_EVENT",
    monitoringMetadata: { type: "MAP" }
  })
];

var out = {
  exportFormatVersion: 2,
  exportTime: new Date().toISOString().replace("T", " ").slice(0, 19),
  containerVersion: {
    path: "accounts/" + ACC + "/containers/" + CID + "/versions/0",
    accountId: ACC,
    containerId: CID,
    containerVersionId: "0",
    container: base({
      path: "accounts/" + ACC + "/containers/" + CID,
      name: "atpifit",
      publicId: "GTM-TWLHJWL8",
      usageContext: ["WEB"]
    }),
    tag: tag,
    trigger: trigger,
    variable: variable
  }
};

require("fs").writeFileSync(__dirname + "/gtm-atpifit-匯入用.json", JSON.stringify(out, null, 2));
console.log("已產出：變數 " + variable.length + "／觸發條件 " + trigger.length + "／代碼 " + tag.length);
