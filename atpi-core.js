/* ═══════════════════════════════════════════════════════════
   ATPI 核心共用檔（跨專案共用，改這裡兩個專案會一起生效）
   使用專案：consult-workshop（任務儀表板）、comconverttest（測驗結果頁）
   內容：四維度順序、潛力值公式、變現路徑文案庫
   不放這裡：各專案自己的計分方式、題庫/任務庫、LIFF/Sheet 設定
   ═══════════════════════════════════════════════════════════ */

var DORD = ["A", "T", "P", "I"];

/* ── 潛力值公式（改這裡就全部生效）── */
function calcPotential(scores) {
  var unlocked = Math.round(Math.pow(scores.A/100 * scores.T/100 * scores.P/100 * scores.I/100, 0.8) * 1000);
  return { unlocked: unlocked, locked: 1000 - unlocked };
}

/* ── 單一強項 → 變現路徑敘述 ── */
var STRONG_PATH = {
  A: "想像這個場景：你在一個商業活動或社群聚會開口說話，周圍的人自然把目光轉向你，有人開始追問「然後呢？」，有人默默加了你的 LINE。\n\n這就是你最容易、也是天賦的變現路徑——吸引型。你不需要刻意推銷，人自然往你身邊靠。最適合你的場景：社群經營、內容創作、演講分享，讓陌生人主動找上門。",
  T: "想像這個場景：你跟一個潛在客戶聊了半小時，對方把從沒跟別人說過的困擾都說出來了，最後主動問你「你有沒有什麼課程或服務？」\n\n這就是你最容易、也是天賦的變現路徑——關係型。你不用追客戶，客戶會追你。最適合你的場景：1對1 深度諮詢、長期顧問關係、讓滿意的客戶主動介紹新客戶。",
  P: "想像這個場景：你在一個場合分享了一個觀點或案例，對方聽完沉默了幾秒，然後說「這個人真的很懂，我想跟他聊聊」——主動問你有沒有合作的方式。\n\n這就是你最容易、也是天賦的變現路徑——權威型。你的專業本身就是最強的吸引力。最適合你的場景：顧問服務、企業培訓、高單價專業諮詢，讓對方覺得「值得付這個價格」。",
  I: "想像這個場景：你在台上或現場說完一段話，台下的人紛紛走過來問你「怎麼跟你合作」、「下一堂課什麼時候開」——你還沒開口推銷，他們已經準備好了。\n\n這就是你最容易、也是天賦的變現路徑——推進型。你天生能讓人在當下做決定。最適合你的場景：演講現場收單、工作坊、活動型銷售，把每次亮相變成一次成交機會。"
};

/* ── 變現流程甜蜜點（依最強兩維度組合查表）── */
var COMBO_PATH = {
  AT: {
    title: "社群養粉 × 轉介紹成交",
    flow: "① 發內容，吸引力自然帶來陌生流量\n② 有人私訊，信任力讓他覺得你懂他\n③ 聊著聊著，對方主動問「你有什麼服務？」\n④ 不用推銷，他們已經說服自己了",
    tips: "專業力弱 → 別賣方法論，賣「陪你一起做」的陪伴型服務\n推進力弱 → 不做現場收單，改用限時報名表單讓截止日期幫你逼單\n定價走中低客單，靠口碑和量滾起來"
  },
  AP: {
    title: "知識型內容 × 課程產品",
    flow: "① 持續輸出有深度的內容，吸引力帶流量、專業力讓人覺得你很懂\n② 累積一群「覺得你很厲害」的追蹤者\n③ 推出課程或工作坊（不需要深度信任就能成交）\n④ 課程體驗本身幫你建立信任力，之後再升級高單價",
    tips: "信任力弱 → 靠出現頻率建熟悉感，常出現 = 類信任，不靠深聊\n推進力弱 → 用稀缺名額＋截止日期讓環境幫你推進，不用自己開口\n最適合做課程、電子書、訂閱制"
  },
  AI: {
    title: "演講亮相 × 現場收單 → 後端升級",
    flow: "① 上台或辦活動，吸引力讓台下捨不得滑手機\n② 活動結束前用推進力現場推低客單入門產品，趁熱打鐵\n③ 進來的人靠課程體驗建立信任力和專業力\n④ 後端再做一次高單價升級",
    tips: "信任力弱 → 不靠個人關係，靠見證和學員案例讓別人說話\n專業力弱 → 賣結果不賣方法（「學員平均 3 個月增加 20 萬」比「7 步驟方法論」更有力）\n前端低客單可以很低，甚至免費，靠吸引力和推進力把人收進來"
  },
  PT: {
    title: "深度服務 × 口碑轉介紹循環",
    flow: "① 先在現有人脈裡找第一批客戶，信任力讓對方覺得你真的懂他\n② 專業力撐住高單價，交付讓對方超滿意\n③ 主動請客戶介紹下一個人（客戶的吸引力幫你做你做不到的事）\n④ 新客戶帶著信任進來，直接進入成交",
    tips: "吸引力弱 → 不做冷流量，找吸引力強的合作夥伴導流，你專攻後端成交和交付\n推進力弱 → 諮詢結尾問「如果繼續，三個月後你想達到什麼？」讓對方自己描繪未來，自然說 yes\n走高客單，靠深度不靠量"
  },
  IT: {
    title: "人脈深耕 × 結果說話 → 持續升價",
    flow: "① 從現有人脈找第一批客戶，信任力讓他們願意試試看\n② 推進力在對話結尾自然帶到成交，不拖\n③ 拿到真實結果，讓結果替代專業力的位置\n④ 靠口碑和結果持續升價，不需要陌生流量",
    tips: "吸引力弱 → 不自己冷啟動，去別人的場合露臉（上 Podcast、聯名活動、商業社群）\n專業力弱 → 用學員結果替代理論（「他做了這件事之後收入翻倍了」比「我有方法論」更有說服力）\n這個組合最怕沒有舞台，要積極被介紹到人脈圈"
  },
  IP: {
    title: "專業提案 × B2B 企業成交",
    flow: "① 鎖定企業或機構客戶，不靠個人魅力，靠提案和結果說話\n② 專業力撐住提案品質，讓對方覺得「這個人真的懂」\n③ 推進力推動決策層，縮短採購周期，讓他們現在做決定\n④ 交付後直接談下一個合約，不需要重新開發",
    tips: "吸引力弱 → 靠精緻的提案書和案例集替代個人魅力\n信任力弱 → 用流程建立信任（回覆快、交付準時、清楚的合約），不靠個人溫度\n另一條路：找吸引力和信任力強的合夥人做前端，你專攻後端提案和交付"
  }
};

/* ── 單一弱項 → 缺口說明 ── */
var WEAK_DESC = {
  A: "吸引力是成交流程的入口——沒有人被你吸引進來，後面的信任、專業、推進都沒有機會發揮。\n\n你需要的不是更努力說話，而是讓說話本身更有磁性，讓對方自然想靠近。",
  T: "信任力是成交的地基——對方可能覺得你很厲害，但還沒有到「願意掏錢給你」的程度。\n\n你需要的是讓對方在短時間內感覺「你真的懂我」，打開心房才能打開錢包。",
  P: "專業力決定對方願不願意付你高單價——如果對方覺得你說的東西「聽起來不錯但不確定有沒有用」，就不會成交。\n\n你需要的是把你的能力用對方聽得懂的語言說出來。",
  I: "推進力是臨門一腳——前面吸引、信任、專業都做對了，但對方就是沒有採取行動。\n\n你需要的是在對的時機給對方一個說「好」的理由，而不是等他自己決定。"
};

/* ── 依分數找出強項組合 × 甜蜜路徑（各專案共用同一套判斷邏輯，不用各自重算）── */
function getCombo(scores) {
  var sorted = DORD.slice().sort(function(a, b) { return scores[b] - scores[a]; });
  var sk = sorted[0], sk2 = sorted[1], wk = sorted[3];
  var comboKey = [sk, sk2].sort().join("");
  var combo = COMBO_PATH[comboKey] || COMBO_PATH[Object.keys(COMBO_PATH)[0]];
  return { sorted: sorted, sk: sk, sk2: sk2, wk: wk, comboKey: comboKey, combo: combo };
}

/* ═══════════════════════════════════════════════════════════
   以下是渲染輔助函式（依賴呼叫端已定義好 DIMS 全域變數，
   以及 CSS 裡的 .hdiv 樣式）。跟上面的純資料不同，這類函式
   綁定了固定版面，只在「大部分專案都會長一樣」的部分才共用。
   ═══════════════════════════════════════════════════════════ */

/* ── 四維能力雷達圖（SVG 向量版，取代舊的 canvas 畫法）
      svgEl：一個 <svg> DOM 元素；scores：{A,T,P,I} 0-100 分數 ── */
function drawRadarSVG(svgEl, scores) {
  svgEl.innerHTML = "";
  var cx = 130, cy = 140, mr = 90;
  var vals = DORD.map(function(k) { return scores[k] / 100; });
  var angles = DORD.map(function(_, i) { return (Math.PI*2*i/4) - Math.PI/2; });
  function pt(r, a) { return [cx + r*Math.cos(a), cy + r*Math.sin(a)]; }
  function el(tag, attrs) {
    var e = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.keys(attrs).forEach(function(k) { e.setAttribute(k, attrs[k]); });
    return e;
  }
  [0.25,0.5,0.75,1.0].forEach(function(f) {
    var pts = angles.map(function(a) { var p = pt(mr*f, a); return p[0]+","+p[1]; }).join(" ");
    svgEl.appendChild(el("polygon", {points:pts, fill:f===1?"rgba(240,228,218,0.4)":"none", stroke:"rgba(168,128,96,0.18)", "stroke-width":"0.8"}));
  });
  angles.forEach(function(a) {
    var p = pt(mr, a);
    svgEl.appendChild(el("line", {x1:cx, y1:cy, x2:p[0], y2:p[1], stroke:"rgba(168,128,96,0.15)", "stroke-width":"0.8"}));
  });
  var dpts = angles.map(function(a, i) { var p = pt(mr*Math.min(vals[i],1), a); return p[0]+","+p[1]; }).join(" ");
  svgEl.appendChild(el("polygon", {points:dpts, fill:"rgba(232,115,74,0.15)", stroke:"#e8734a", "stroke-width":"2", "stroke-linejoin":"round"}));

  var tip = el("g", {id:"radar-tip", opacity:"0", style:"pointer-events:none;"});
  var tipBg = el("rect", {rx:"8", ry:"8", fill:"#2d1f0f", height:"26"});
  var tipTxt = el("text", {"font-size":"12", "font-weight":"600", fill:"#fff", "text-anchor":"middle", "dominant-baseline":"middle", "font-family":"-apple-system,sans-serif"});
  tip.appendChild(tipBg); tip.appendChild(tipTxt); svgEl.appendChild(tip);
  function showTip(px, py, txt, color) {
    tipTxt.textContent = txt;
    tipBg.setAttribute("fill", color);
    var tw = txt.length*7.5+16;
    tipBg.setAttribute("width", tw); tipBg.setAttribute("x", px-tw/2); tipBg.setAttribute("y", py-34);
    tipTxt.setAttribute("x", px); tipTxt.setAttribute("y", py-21);
    tip.setAttribute("opacity", "1");
  }
  svgEl.addEventListener("click", function() { tip.setAttribute("opacity", "0"); });

  DORD.forEach(function(k, i) {
    var p = pt(mr*Math.min(vals[i],1), angles[i]);
    var hit = el("circle", {cx:p[0], cy:p[1], r:"14", fill:"transparent", style:"cursor:pointer;"});
    var c = el("circle", {cx:p[0], cy:p[1], r:"5", fill:DIMS[k].color, stroke:"#fff", "stroke-width":"1.5", style:"pointer-events:none;"});
    hit.addEventListener("click", function(e) {
      e.stopPropagation();
      showTip(p[0], p[1], DIMS[k].name+" "+scores[k], DIMS[k].color);
    });
    svgEl.appendChild(hit); svgEl.appendChild(c);
  });
  DORD.forEach(function(k, i) {
    var p = pt(mr+22, angles[i]);
    var t = el("text", {x:p[0], y:p[1], "font-size":"12", "font-weight":"500", fill:DIMS[k].color, "text-anchor":"middle", "dominant-baseline":"middle", "font-family":"-apple-system,sans-serif"});
    t.textContent = DIMS[k].name;
    svgEl.appendChild(t);
  });
}

/* ── 起點 vs 現在：四維度成長條 + 潛力值（+ 選填的右側欄位，如年收入）── */
function renderGrowthCard(startScores, nowScores, footerRight) {
  var dimRows = DORD.map(function(k) {
    var d = DIMS[k], sv = startScores[k], ev = nowScores[k], diff = ev - sv;
    return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:7px;">'
      + '<div style="width:36px;font-size:11px;color:'+d.color+';">'+d.name+'</div>'
      + '<div style="flex:1;height:4px;background:#ede4da;border-radius:2px;">'
      + '<div style="height:4px;border-radius:2px;background:'+d.color+';width:'+ev+'%;"></div></div>'
      + '<div style="font-size:11px;color:#a08060;width:76px;text-align:right;">'+sv+' → '+ev
      + ' <span style="color:#5DCAA5;font-weight:500;">+'+diff+'</span></div>'
      + '</div>';
  }).join("");
  var potential = calcPotential(nowScores).unlocked;
  var footer = '<div style="display:flex;justify-content:space-between;font-size:12px;">'
    + '<div style="color:#6b4c30;">已解鎖潛力 <span style="color:#e8734a;font-weight:600;">'+potential+'</span> / 1000</div>'
    + (footerRight ? '<div style="color:#6b4c30;">'+footerRight+'</div>' : '')
    + '</div>';
  return '<div style="font-size:12px;color:#a08060;margin-bottom:8px;">起點 vs 現在</div>' + dimRows + '<div class="hdiv"></div>' + footer;
}

/* ── 自評起點 × 市場驗證：中性並列，不是「成長」框架（自評只是起點假設）。
   selfScores＝測驗自評 ATPI；marketScores＝市場驗證後的能力（calcDims）。 */
function renderSelfEvalCompare(selfScores, marketScores) {
  var rows = DORD.map(function(k) {
    var d = DIMS[k];
    return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:7px;">'
      + '<div style="width:40px;font-size:11px;color:'+d.color+';">'+d.name+'</div>'
      + '<div style="flex:1;height:4px;background:#ede4da;border-radius:2px;">'
      +   '<div style="height:4px;border-radius:2px;background:'+d.color+';width:'+Math.min(100,marketScores[k])+'%;"></div>'
      + '</div>'
      + '<div style="font-size:11px;color:#a08060;width:104px;text-align:right;">自評 '+selfScores[k]
      +   ' ｜ 市場 <strong style="color:'+d.color+';">'+marketScores[k]+'</strong></div>'
      + '</div>';
  }).join("");
  return '<div style="font-size:12px;color:#a08060;margin-bottom:4px;">你怎麼看自己 × 市場怎麼看你</div>'
    + '<div style="font-size:11px;color:#a08060;margin-bottom:10px;">自評是你的起點假設，市場驗證（成交）才會把能力一格一格解鎖出來</div>'
    + rows;
}

/* ── 潛力值 × 金額 走勢圖（雙線共用同一座標軸）
      points: [{label, A, T, P, I, income}, ...]，至少要 2 筆才有線可畫
      incomeUnit：金額的單位文字，預設「萬」── */
function renderTrendChart(points, incomeUnit) {
  incomeUnit = incomeUnit || "萬";
  if (!points || points.length < 2) {
    return '<div style="font-size:12px;color:#a08060;margin-bottom:4px;">潛力值 × 金額走勢</div>'
      + '<div style="font-size:12px;color:#a08060;padding:24px 0;text-align:center;">還沒有足夠的紀錄，累積 2 筆以上「回報成交」後就會畫出趨勢線</div>';
  }
  var data = points.map(function(p) { return { label:p.label, v:calcPotential(p).unlocked, income:p.income }; });
  var W=300, H=170, pl=34, pr=30, pt=18, pb=38;
  var pw=W-pl-pr, ph=H-pt-pb, n=data.length;
  /* 潛力值（0-1000）和金額量級差很多，共用一軸會把某條線壓在底部——改雙軸各自算 max。
     左軸＝潛力（橘），右軸＝金額（綠）。 */
  function niceMax(arr) { var m = Math.max.apply(null, arr); return Math.ceil((m || 1) / 100) * 100 || 100; }
  var vMax = niceMax(data.map(function(d){ return d.v; }));
  var iMax = niceMax(data.map(function(d){ return d.income; }));
  function xP(i) { return pl + i*(pw/(n-1)); }
  function yV(v) { return pt + ph - (v/vMax)*ph; }
  function yI(inc) { return pt + ph - (inc/iMax)*ph; }
  var gridLines = "";
  [0,0.25,0.5,0.75,1].forEach(function(f) {
    var y = pt + ph*(1-f);
    gridLines += '<line x1="'+pl+'" y1="'+y+'" x2="'+(W-pr)+'" y2="'+y+'" stroke="rgba(168,128,96,0.12)" stroke-width="0.5"/>';
  });
  var axisLabels =
    '<text x="'+(pl-4)+'" y="'+(pt)+'" text-anchor="end" font-size="8" fill="#e8734a">'+vMax+'</text>'
   +'<text x="'+(pl-4)+'" y="'+(pt+ph/2)+'" text-anchor="end" font-size="8" fill="#e8734a">'+(vMax/2)+'</text>'
   +'<text x="'+(pl-4)+'" y="'+(pt+ph)+'" text-anchor="end" font-size="8" fill="#e8734a">0</text>'
   +'<text x="'+(W-pr+4)+'" y="'+(pt)+'" text-anchor="start" font-size="8" fill="#5DCAA5">'+iMax+'</text>'
   +'<text x="'+(W-pr+4)+'" y="'+(pt+ph/2)+'" text-anchor="start" font-size="8" fill="#5DCAA5">'+(iMax/2)+'</text>'
   +'<text x="'+(W-pr+4)+'" y="'+(pt+ph)+'" text-anchor="start" font-size="8" fill="#5DCAA5">0</text>';
  var vPts = data.map(function(d,i) { return xP(i)+","+yV(d.v); }).join(" ");
  var iPts = data.map(function(d,i) { return xP(i)+","+yI(d.income); }).join(" ");
  var vArea = "M"+xP(0)+","+yV(data[0].v)+" "+data.map(function(d,i){return "L"+xP(i)+","+yV(d.v);}).join(" ")+" L"+xP(n-1)+","+(pt+ph)+" L"+xP(0)+","+(pt+ph)+" Z";
  var iArea = "M"+xP(0)+","+yI(data[0].income)+" "+data.map(function(d,i){return "L"+xP(i)+","+yI(d.income);}).join(" ")+" L"+xP(n-1)+","+(pt+ph)+" L"+xP(0)+","+(pt+ph)+" Z";
  var dots = "";
  data.forEach(function(d, i) {
    var x=xP(i), yv=yV(d.v), yi=yI(d.income);
    dots += '<circle cx="'+x+'" cy="'+yv+'" r="3.5" fill="#e8734a" stroke="#fff" stroke-width="1.5"/>';
    dots += '<circle cx="'+x+'" cy="'+yi+'" r="3.5" fill="#5DCAA5" stroke="#fff" stroke-width="1.5"/>';
    dots += '<text x="'+x+'" y="'+(H-pb+14)+'" text-anchor="middle" font-size="8.5" fill="#a08060">'+d.label+'</text>';
    dots += '<text x="'+x+'" y="'+(yv-7)+'" text-anchor="middle" font-size="8" fill="#e8734a">'+d.v+'</text>';
    if (d.income > 0) dots += '<text x="'+x+'" y="'+(yi-7)+'" text-anchor="middle" font-size="8" fill="#5DCAA5">'+d.income+incomeUnit+'</text>';
  });
  var svg = '<svg viewBox="0 0 '+W+' '+H+'" width="100%" xmlns="http://www.w3.org/2000/svg">'
   +'<defs>'
   +'<linearGradient id="gV" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#e8734a" stop-opacity="0.2"/><stop offset="100%" stop-color="#e8734a" stop-opacity="0"/></linearGradient>'
   +'<linearGradient id="gI" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#5DCAA5" stop-opacity="0.15"/><stop offset="100%" stop-color="#5DCAA5" stop-opacity="0"/></linearGradient>'
   +'</defs>'+gridLines+axisLabels
   +'<path d="'+vArea+'" fill="url(#gV)"/>'
   +'<path d="'+iArea+'" fill="url(#gI)"/>'
   +'<polyline points="'+vPts+'" fill="none" stroke="#e8734a" stroke-width="2" stroke-linejoin="round"/>'
   +'<polyline points="'+iPts+'" fill="none" stroke="#5DCAA5" stroke-width="2" stroke-linejoin="round" stroke-dasharray="5,3"/>'
   +dots+'</svg>';
  var legend =
    '<div style="display:flex;gap:14px;margin-bottom:8px;">'
   +'<div style="display:flex;align-items:center;gap:5px;font-size:11px;color:#6b4c30;"><div style="width:14px;height:2px;background:#e8734a;border-radius:1px;"></div>已解鎖潛力</div>'
   +'<div style="display:flex;align-items:center;gap:5px;font-size:11px;color:#6b4c30;"><div style="width:14px;height:2px;background:#5DCAA5;border-radius:1px;"></div>金額（'+incomeUnit+'）</div>'
   +'</div>';
  return '<div style="font-size:12px;color:#a08060;margin-bottom:4px;">潛力值 × 金額走勢</div>' + legend + svg;
}

/* ═══════════════════════════════════════════════════════════
   榮譽系統（跨專案共用目錄）
   榮譽是「人」的屬性、跟著人走、跨 workshop 共用一份牆。
   這裡只放「純目錄 HONORS + 通用評估器」；各專案用自己的資料組出
   正規化 ctx 再傳進來（跟 drawRadarSVG 一樣：共用邏輯、各自餵資料）。
   ctx 形狀：{scores:{A,T,P,I}, potential, revenueTotal, dealCount,
             checkinCount, investPct:{A,T,P,I}, dimsCovered,
             workshopsActive, streak, bestWeekDays}
   本專案 consult-workshop 餵得齊全部；comconverttest 只餵得出分數/潛力類，
   投入/成交類自然點不亮（顯示未解鎖）。
   ═══════════════════════════════════════════════════════════ */

/* 四維分級徽章的階梯：門檻綁「投入%」，各維 k 不同也公平（跟計分同一把尺）。 */
var HONOR_TIERS = [
  {tier:"bronze",  label:"銅", pct:30, icon:"🥉"},
  {tier:"silver",  label:"銀", pct:50, icon:"🥈"},
  {tier:"gold",    label:"金", pct:70, icon:"🥇"},
  {tier:"diamond", label:"鑽", pct:85, icon:"💎"}
];

/* 🔥 努力堅持（來自打卡，人人可得） */
var HONORS_EFFORT = [
  {id:"streak7",   cat:"effort", icon:"🔥", name:"連七",     desc:"連續打卡 7 天",    metric:"streak",          value:7},
  {id:"streak30",  cat:"effort", icon:"🔥", name:"連三十",   desc:"連續打卡 30 天",   metric:"streak",          value:30,  celebrate:true},
  {id:"streak100", cat:"effort", icon:"🏔️", name:"連百",     desc:"連續打卡 100 天",  metric:"streak",          value:100, celebrate:true},
  {id:"allweek",   cat:"effort", icon:"📅", name:"全勤週",   desc:"一週天天都打卡",   metric:"bestWeekDays",    value:7,   celebrate:true},
  {id:"balanced",  cat:"effort", icon:"🌈", name:"四維並進", desc:"四維都有投入不偏科", metric:"dimsCovered",   value:4},
  {id:"crossws",   cat:"effort", icon:"🎓", name:"跨界學員", desc:"在 2 門以上課都打卡", metric:"workshopsActive", value:2, celebrate:true},
  {id:"check100",  cat:"effort", icon:"💯", name:"百次打卡", desc:"累積打卡 100 次",  metric:"checkinCount",    value:100},
  {id:"check500",  cat:"effort", icon:"🏅", name:"五百次打卡", desc:"累積打卡 500 次", metric:"checkinCount",    value:500, celebrate:true}
];

/* 💎 變現里程碑（來自成交，稀有・會發光）。門檻對齊計分常數 TARGET_AMOUNT/TARGET_COUNT/潛力畢業錨點。 */
var HONORS_REVENUE = [
  {id:"firstdeal", cat:"revenue", tier:"rare",   icon:"🎉", name:"開張大吉",     desc:"回報第一筆成交",         metric:"dealCount",    value:1,       celebrate:true},
  {id:"rev1w",     cat:"revenue", tier:"rare",   icon:"💰", name:"破萬",         desc:"累計成交突破 1 萬",      metric:"revenueTotal", value:10000},
  {id:"rev10w",    cat:"revenue", tier:"rare",   icon:"💰", name:"破十萬",       desc:"累計成交突破 10 萬",     metric:"revenueTotal", value:100000,  celebrate:true},
  {id:"rev100w",   cat:"revenue", tier:"legend", icon:"💰", name:"破百萬",       desc:"累計成交突破 100 萬",    metric:"revenueTotal", value:1000000, celebrate:true},
  {id:"club300",   cat:"revenue", tier:"legend", icon:"👑", name:"三百萬俱樂部", desc:"累計成交達畢業錨點 300 萬", metric:"revenueTotal", value:3000000, celebrate:true},
  {id:"deal3",     cat:"revenue", tier:"rare",   icon:"✍️", name:"穩定簽單",     desc:"累計簽下 3 單",          metric:"dealCount",    value:3},
  {id:"deal5",     cat:"revenue", tier:"rare",   icon:"✍️", name:"簽單達人",     desc:"累計簽下 5 單",          metric:"dealCount",    value:5,       celebrate:true},
  {id:"pot300",    cat:"revenue", tier:"rare",   icon:"⭐", name:"潛力覺醒",     desc:"變現潛力突破 300",       metric:"potential",    value:300,     celebrate:true},
  {id:"pot600",    cat:"revenue", tier:"legend", icon:"🌟", name:"潛力大師",     desc:"變現潛力突破 600",       metric:"potential",    value:600,     celebrate:true},
  {id:"sweetmaster", cat:"revenue", tier:"legend", icon:"🗝️", name:"甜蜜點大師", desc:"最強兩維都破 60 且反覆成交，走通你的變現路徑",
     test:function(ctx){
       var s = ctx.scores;
       var sorted = DORD.slice().sort(function(a,b){ return s[b] - s[a]; });
       return s[sorted[0]] >= 60 && s[sorted[1]] >= 60 && ctx.dealCount >= 3;
     }, celebrate:true}
];

/* 🏅 四維分級徽章：DORD × 四階自動展開（名稱由呼叫端用自己的維度名合成）。 */
var HONORS_DIM = [];
DORD.forEach(function(k) {
  HONOR_TIERS.forEach(function(t) {
    HONORS_DIM.push({
      id:"dim_"+k+"_"+t.tier, cat:"dim", dim:k, tier:t.tier, tierLabel:t.label,
      icon:t.icon, metric:"investPct."+k, value:t.pct,
      celebrate:(t.tier === "gold" || t.tier === "diamond")
    });
  });
});

/* 完整目錄（各專案可再 concat 自己 workshop 的專屬榮譽——Phase 2）。 */
var HONORS = HONORS_DIM.concat(HONORS_EFFORT, HONORS_REVENUE);

/* 稱號：由已解鎖成就合成，優先序 變現 > 分級 > 堅持。頂在成就頁橫幅。 */
var HONOR_TITLES = [
  {id:"club300",   title:"三百萬變現家"},
  {id:"rev100w",   title:"百萬實戰家"},
  {id:"pot600",    title:"潛力大師"},
  {id:"sweetmaster", title:"甜蜜點大師"},
  {id:"deal5",     title:"簽單達人"},
  {id:"rev10w",    title:"十萬俱樂部"},
  {id:"pot300",    title:"潛力覺醒者"},
  {id:"firstdeal", title:"開張新星"},
  {id:"streak100", title:"鐵人顧問"},
  {id:"streak30",  title:"堅持者"},
  {id:"balanced",  title:"均衡型選手"}
];

/* 取 ctx 裡的指標值（支援 "investPct.A" 這種點路徑）。 */
function honorMetricVal(ctx, metric) {
  if (!metric) return undefined;
  var parts = metric.split("."), v = ctx;
  for (var i = 0; i < parts.length; i++) { if (v == null) return undefined; v = v[parts[i]]; }
  return v;
}
/* 單一榮譽是否解鎖：有 test 用 test，否則 ctx[metric] >= value。 */
function honorMet(h, ctx) {
  if (typeof h.test === "function") return !!h.test(ctx);
  var v = honorMetricVal(ctx, h.metric);
  return typeof v === "number" && v >= h.value;
}
/* 回傳已解鎖的榮譽 id 陣列（依 HONORS 順序）。 */
function evalHonors(ctx) {
  return HONORS.filter(function(h){ return honorMet(h, ctx); }).map(function(h){ return h.id; });
}
/* 依已解鎖清單選出顯示稱號（優先序見 HONOR_TITLES），沒有就給預設。 */
function pickTitle(earnedIds) {
  for (var i = 0; i < HONOR_TITLES.length; i++) {
    if (earnedIds.indexOf(HONOR_TITLES[i].id) > -1) return HONOR_TITLES[i].title;
  }
  return "見習學員";
}
/* 依 id 取回完整榮譽定義（慶祝彈窗用）。 */
function honorById(id) {
  for (var i = 0; i < HONORS.length; i++) { if (HONORS[i].id === id) return HONORS[i]; }
  return null;
}
