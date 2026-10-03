"""從 visitor.html 生一份 demo：資料走假的，右下角可以切四種狀態。

  python3 _tools/mk-visitor-demo.py      # 在 consult-workshop 底下跑

產出 demo-visitor-v6.html，跟 visitor.html 同一層——相對路徑的 common.js 那幾支才接得到。
⚠️ 檔名不要用底線開頭：這個 repo 沒有 .nojekyll，GitHub Pages 的 Jekyll 會把 _ 開頭的檔案
   整個略過，推上去也開不了。版號跟著 demo-visitor-v5.html 往下接。
visitor.html 改完要重跑這支，不要手改產出檔。
"""
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

STUB = r"""<script>
/* ── 本機 demo 的假資料層。真的後端一律不碰：postCheckin 也擋掉，
      所以在這裡亂點不會寫進試算表，也不會送 GA。 ── */
(function(){
  var S = (new URLSearchParams(location.search).get("s") || "full");
  var EV = [["A1",3],["A2",2],["A3",2],["T1",4],["T2",3],["T3",5],
            ["P1",3],["P2",1],["P3",3],["I1",2],["I2",4],["I3",3]];
  var DATA = {
    checkins: [{date:"2026-09-29"},{date:"2026-09-30"},{date:"2026-10-01"}],
    evals: EV.map(function(x){ return {muscle:x[0], score:x[1], source:"quiz", date:"2026-09-20"}; }),
    student: {}, enrollments: []
  };
  window.loadBootstrap = function(){
    return new Promise(function(res, rej){
      if (S === "load") return;                                  // 永遠不回＝停在載入骨架
      setTimeout(function(){
        if (S === "err") return rej(new Error("demo: 後端讀不到"));
        if (S === "empty") return res({checkins:[], evals:[], student:{}, enrollments:[]});
        res(DATA);
      }, 400);
    });
  };
  window.seatEscape_  = function(){ return false; };
  window.rememberUid_ = function(){};
  window.postCheckin  = function(){ return Promise.resolve({status:"ok"}); };
  window.track        = function(){};

  addEventListener("DOMContentLoaded", function(){
    var modes = [["full","有健檢"],["empty","還沒測"],["load","載入中"],["err","讀不到"]];
    var bar = document.createElement("div");
    bar.id = "demobar";
    bar.innerHTML = '<b>DEMO</b>' + modes.map(function(m){
      return '<a href="?s=' + m[0] + '"' + (m[0] === S ? ' class="on"' : '') + '>' + m[1] + '</a>';
    }).join("") + '<a href="#" id="demoreset">清紀錄</a>';
    document.body.appendChild(bar);
    document.getElementById("demoreset").onclick = function(e){
      e.preventDefault();
      try { localStorage.removeItem("vz_visitor_v3"); } catch(err){}
      location.reload();
    };
  });
})();
</script>
<style>
#demobar{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(10px + env(safe-area-inset-bottom));
  z-index:90;display:flex;align-items:center;gap:4px;background:rgba(20,16,12,.92);
  backdrop-filter:blur(10px);border-radius:999px;padding:5px 7px;box-shadow:0 8px 28px rgba(0,0,0,.3);}
#demobar b{font-size:9px;letter-spacing:.16em;color:#C9A87A;padding:0 6px;}
#demobar a{font-size:12px;color:rgba(247,241,236,.72);text-decoration:none;padding:6px 11px;border-radius:999px;white-space:nowrap;}
#demobar a.on{background:#C6603A;color:#fff;font-weight:700;}
/* 整頁長截圖是開一個超高的視窗拍的，固定定位的切換列會被釘在最底下變成一片空白。
   真手機不可能有這麼高的視窗，所以拿高度當「這是截圖」的判準。 */
@media (min-height:1200px){ #demobar{display:none;} }
</style>
"""

ANCHOR = '<script src="judgement.js"></script>'
UID_LINE = 'UID = urlUid_ || localStorage.getItem("cw_uid") || "";'

src = open(os.path.join(ROOT, "visitor.html"), encoding="utf-8").read()
assert ANCHOR in src, "找不到 judgement.js 那行，visitor.html 的 script 順序變了"
assert UID_LINE in src, "找不到 UID 那行，visitor.html 的身份區塊變了"

out = src.replace(ANCHOR, ANCHOR + "\n" + STUB)
out = out.replace(UID_LINE, 'UID = "DEMO-USER";   /* demo 固定身份 */')
out = out.replace("<title>", "<title>[DEMO] ", 1)
# 這頁跟 visitor.html 幾乎一模一樣，不擋索引會變成自己跟自己打對台
out = out.replace("<title>", '<meta name="robots" content="noindex,nofollow">\n<title>', 1)

dst = os.path.join(ROOT, "demo-visitor-v6.html")
open(dst, "w", encoding="utf-8").write(out)
print("寫好了：" + dst)
