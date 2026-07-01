var LIFF_ID = "2010316474-UovQ1zhe";
var SHEET_API = "https://script.google.com/macros/s/AKfycbwEwlg4cFa7B_e76ULJM26C2B9fgjwjFTXPFb_yRMWt1wZs33iTGnEI1LZ9v8uZHvdz/exec";

/* ── 四維度定義 ── */
var DIMS = {
  A: {name:"吸引力", desc:"別人主動想靠近你",     color:"#e8734a", key:"social",   max:9,  inner:"批判心少・容易欣賞別人"},
  T: {name:"信任力", desc:"別人願意跟你說秘密",   color:"#5DCAA5", key:"team",     max:6,  inner:"真誠・心口合一"},
  P: {name:"專業力", desc:"別人理解並買你的服務", color:"#378ADD", key:"homework", max:10, inner:"不斷精進・有上進心・當責"},
  I: {name:"推進力", desc:"別人聽你的話採取行動", color:"#c8a84b", key:"attend",   max:4,  inner:"自己先願意配合・臣服"}
};
/* DORD、calcPotential、COMBO_PATH 已搬到共用檔 atpi-core.js（此檔案的 HTML 需先引入它） */

/* ── 等級定義 ── */
var LEVELS = [
  {min:0,  title:"見習顧問", beat:20, next:"累積到 10 分，解鎖「顧問」稱號"},
  {min:10, title:"顧問",     beat:45, next:"累積到 18 分，解鎖「資深顧問」稱號"},
  {min:18, title:"資深顧問", beat:68, next:"累積到 24 分，解鎖「變現顧問」稱號"},
  {min:24, title:"變現顧問", beat:88, next:"累積到 29 分，解鎖「顧問大師」稱號"},
  {min:29, title:"顧問大師", beat:97, next:"你已站上頂端，現在聚焦長期合作與規模化"}
];

/* ── 徽章定義 ── */
var BADGES = [
  {key:"attend",   icon:"📅", name:"出席徽章", desc:"準時出席"},
  {key:"social",   icon:"📣", name:"分享徽章", desc:"社群分享"},
  {key:"homework", icon:"✍️", name:"作業徽章", desc:"逐字稿繳交"},
  {key:"team",     icon:"🏆", name:"團隊徽章", desc:"團隊賽得分"}
];

/* ── 任務定義 ── */
var TASK_DEFS = [
  {key:"attend1", cat:"attend",  pts:2, name:"第 1 場準時出席",    icon:"📅", bg:"#fff8f4"},
  {key:"attend2", cat:"attend",  pts:2, name:"第 2 場準時出席",    icon:"📅", bg:"#fff8f4"},
  {key:"social1", cat:"social",  pts:3, name:"社群分享：自己故事", icon:"📣", bg:"#fff4f0"},
  {key:"social2", cat:"social",  pts:3, name:"社群分享：導師故事", icon:"📖", bg:"#fff4f0"},
  {key:"social3", cat:"social",  pts:3, name:"社群分享：培訓心得", icon:"✨", bg:"#fff4f0"}
];

var SPECIAL_DEFS = [
  {key:"hw1",   cat:"homework", pts:5, name:"作業：開場逐字稿", icon:"✍️", bg:"#fff8f4", desc:"繳交後導師批改，加分後通知"},
  {key:"hw2",   cat:"homework", pts:5, name:"作業：收單逐字稿", icon:"📝", bg:"#fff8f4", desc:"繳交後導師批改，加分後通知"},
  {key:"team1", cat:"team",     pts:6, name:"團隊賽得分",       icon:"⚔️", bg:"#fff4ec", desc:"兩兩互練 Role Play・導師計分"}
];

/* ── 計算函式 ── */
function catSum(s, cat) {
  var sum = 0;
  TASK_DEFS.concat(SPECIAL_DEFS).forEach(function(t) {
    if (t.cat === cat && s.tasks[t.key]) sum += t.pts;
  });
  return sum;
}

function initTasks(raw) {
  var tasks = {};
  var allDefs = TASK_DEFS.concat(SPECIAL_DEFS);
  ["attend","social","homework","team"].forEach(function(cat) {
    var remain = cat === "team" ? (raw.team_score || 0) : raw[cat];
    allDefs.filter(function(t) { return t.cat === cat; }).forEach(function(t) {
      if (remain >= t.pts) { tasks[t.key] = true; remain -= t.pts; }
      else { tasks[t.key] = false; }
    });
  });
  return tasks;
}

function totalScore(s) {
  return catSum(s,"attend") + catSum(s,"social") + catSum(s,"homework") + catSum(s,"team");
}

function levelFor(total) {
  var lv = LEVELS[0];
  LEVELS.forEach(function(l) { if (total >= l.min) lv = l; });
  return lv;
}

function calcDims(s) {
  var sc = {};
  DORD.forEach(function(k) {
    sc[k] = Math.round((catSum(s, DIMS[k].key) / DIMS[k].max) * 100);
  });
  return sc;
}

/* ── 學員資料 ── */
var STUDENTS = [];

async function loadStudents() {
  var sr = await fetch(SHEET_API + "?action=students");
  var sd = await sr.json();
  if (sd.status === "ok" && sd.students) {
    STUDENTS = sd.students.map(function(s) {
      var st = {
        lineId:     s["LINE userId"] || s.lineId,
        name:       s["姓名"]       || s.name,
        team:       s["團隊"]       || s.team,
        attend:     +(s["出席"]     || s.attend     || 0),
        social:     +(s["社群分享"] || s.social     || 0),
        homework:   +(s["作業"]     || s.homework   || 0),
        team_score: +(s["團隊賽"]   || s.team_score || 0)
      };
      st.tasks = initTasks(st);
      return st;
    });
  }
}
