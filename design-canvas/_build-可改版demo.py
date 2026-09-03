#!/usr/bin/env python3
"""把 .dc.html 五屏打包成一支可在瀏覽器直接改字的 demo。

改完按「匯出修改」會下載一份 JSON，丟給 AI 就能落回 .dc.html。
用法：python3 _build-可改版demo.py
"""
import json
import re
from pathlib import Path

HERE = Path(__file__).parent
OUT = HERE / "影響力健檢-可改版.html"

canvas = json.loads((HERE / "canvas.json").read_text(encoding="utf-8"))


def artboard_body(fname):
    """取出 <x-dc> 裡、<helmet> 之後的內容（helmet 的 style 是全域的，另外抽一份就好）。"""
    src = (HERE / fname).read_text(encoding="utf-8")
    inner = re.search(r"<x-dc>(.*)</x-dc>", src, re.S).group(1)
    return re.sub(r"<helmet>.*?</helmet>", "", inner, flags=re.S).strip()


boards = []
for ab in canvas["artboards"]:
    boards.append({
        "file": ab["file"],
        "key": ab["file"].replace(".dc.html", ""),
        "title": ab["title"],
        "html": artboard_body(ab["file"]),
    })

notes = [{"text": a["text"]} for a in canvas.get("annotations", [])]

cards = "\n".join(
    f'<section class="board" data-file="{b["file"]}">'
    f'<header class="bt">{b["title"]}'
    f'<span class="bf">{b["file"]}</span></header>'
    f'<div class="frame" data-key="{b["key"]}">{b["html"]}</div>'
    f"</section>"
    for b in boards
)

notes_html = "\n".join(
    '<div class="note">' + n["text"].replace("&", "&amp;").replace("<", "&lt;").replace("\n", "<br>") + "</div>"
    for n in notes
)

HTML = f"""<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<title>影響力健檢・可改版 demo</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;600;700&display=swap">
<style>
  * {{ box-sizing: border-box; }}
  body {{ margin:0; background:#1b1512; color:#EFE6DE;
         font-family:"Noto Sans TC","PingFang TC",-apple-system,sans-serif; }}
  a {{ color:#AF5433; }}

  /* ---- 工具列 ---- */
  #bar {{ position:sticky; top:0; z-index:99; display:flex; align-items:center; gap:14px;
          background:#241b17; border-bottom:1px solid #3a2c25; padding:11px 18px; }}
  #bar h1 {{ font-size:15px; font-weight:700; margin:0; letter-spacing:.04em; }}
  #bar .sp {{ flex:1; }}
  button {{ font-family:inherit; font-size:14px; font-weight:600; border:0; border-radius:9px;
            padding:9px 15px; cursor:pointer; background:#C6603A; color:#fff; }}
  button.ghost {{ background:transparent; color:#C9B6A8; border:1px solid #4a382f; }}
  button:disabled {{ opacity:.4; cursor:default; }}
  #count {{ font-size:13px; color:#C99A4E; font-weight:600; }}
  #hint {{ font-size:13px; color:#9b8478; }}
  label.zoom {{ font-size:13px; color:#9b8478; display:flex; align-items:center; gap:7px; }}

  /* ---- 畫布 ---- */
  #canvas {{ display:flex; gap:26px; padding:26px 22px 90px; align-items:flex-start;
             overflow-x:auto; transform-origin:0 0; }}
  .board {{ flex:0 0 auto; }}
  .bt {{ font-size:14px; font-weight:700; color:#EFE6DE; padding:0 2px 9px;
         display:flex; align-items:baseline; gap:9px; }}
  .bf {{ font-size:12px; font-weight:400; color:#7d6a60; }}
  .frame {{ width:390px; background:#EFE6DE; color:#4A1B0C; border-radius:6px; overflow:hidden;
            box-shadow:0 10px 34px rgba(0,0,0,.45); }}
  .frame, .frame * {{ font-family:"Noto Sans TC","PingFang TC",-apple-system,sans-serif; }}

  /* ---- 可編輯 ---- */
  [data-edit] {{ outline:1px dashed transparent; border-radius:3px; transition:outline-color .12s, background .12s; }}
  body.marks [data-edit] {{ outline-color:rgba(198,96,58,.42); }}
  [data-edit]:hover {{ outline-color:rgba(198,96,58,.8); background:rgba(198,96,58,.07); }}
  [data-edit]:focus {{ outline:2px solid #C6603A; background:#fff; }}
  [data-edit].dirty {{ background:#FFF6D9; outline-color:#C99A4E; }}
  /* 選取用淡琥珀底＋深墨字，不用系統的反白（會蓋掉字看不到改了什麼） */
  [data-edit]::selection {{ background:#FFD79A; color:#4A1B0C; }}
  [data-edit] *::selection {{ background:#FFD79A; color:#4A1B0C; }}

  /* ---- 修改清單 ---- */
  #panel {{ position:fixed; top:0; right:0; bottom:0; width:390px; z-index:120; overflow-y:auto;
            background:#241b17; border-left:1px solid #3a2c25; padding:18px 18px 40px;
            transform:translateX(100%); transition:transform .18s; }}
  #panel.open {{ transform:none; }}
  #panel h2 {{ font-size:14px; margin:0 0 14px; color:#EFE6DE; display:flex; align-items:center; }}
  #panel h2 button {{ margin-left:auto; }}
  .chg {{ background:#2f2420; border:1px solid #3f312a; border-radius:10px; padding:12px 13px; margin-bottom:11px; }}
  .chg .loc {{ font-size:11.5px; color:#8a7266; margin-bottom:7px; letter-spacing:.03em; }}
  .chg .old {{ font-size:13px; color:#9b8478; text-decoration:line-through; line-height:1.7; }}
  .chg .new {{ font-size:13.5px; color:#FFD79A; line-height:1.75; margin-top:5px; }}
  .chg .go {{ font-size:12px; color:#C6603A; cursor:pointer; margin-top:8px; display:inline-block; }}
  #panel .empty {{ font-size:13px; color:#8a7266; }}

  /* ---- 註記 ---- */
  #notes {{ padding:0 22px 60px; display:flex; gap:16px; flex-wrap:wrap; }}
  .note {{ flex:0 0 300px; background:#3a2f22; border:1px solid #56452f; color:#e6d5b8;
           border-radius:11px; padding:13px 15px; font-size:12.5px; line-height:1.75; white-space:normal; }}
  #notes h2 {{ width:100%; font-size:14px; color:#9b8478; margin:0 0 4px; }}
</style>
</head>
<body class="marks">

<div id="bar">
  <h1>影響力健檢・可改版</h1>
  <span id="hint">點任何一段字就能直接改</span>
  <span class="sp"></span>
  <label class="zoom">縮放
    <input id="zoom" type="range" min="40" max="130" value="100">
    <span id="zv">100%</span>
  </label>
  <button class="ghost" id="toggle">隱藏虛線</button>
  <span id="count">尚未修改</span>
  <button class="ghost" id="review">看修改清單</button>
  <button id="export" disabled>匯出修改</button>
</div>

<div id="panel">
  <h2>我改了哪些<button class="ghost" id="closePanel">關閉</button></h2>
  <div id="chgs"></div>
</div>

<div id="canvas">
{cards}
</div>

<div id="notes">
  <h2>畫布註記（唯讀・給你當上下文）</h2>
  {notes_html}
</div>

<script>
// 走訪 DOM，把「直接含文字」的元素標成可編輯——這樣結構不會被改壞，只有字能動。
const SKIP = new Set(['SCRIPT','STYLE','SVG','PATH','CIRCLE','LINE','POLYGON','INPUT','BR']);
const store = [];

document.querySelectorAll('.frame').forEach(frame => {{
  const key = frame.dataset.key;
  let n = 0;
  frame.querySelectorAll('*').forEach(el => {{
    if (SKIP.has(el.tagName.toUpperCase())) return;
    if (el.closest('svg')) return;
    // 只認「自己身上就有非空白文字節點」的元素
    const hasOwnText = [...el.childNodes].some(
      c => c.nodeType === 3 && c.textContent.trim().length > 0
    );
    if (!hasOwnText) return;
    // 巢狀的不再標一次：外層已經可編輯了，內層再標會讓瀏覽器整塊選起來（＝反白蓋住字）
    if (el.parentElement && el.parentElement.closest('[data-edit]')) return;
    const id = key + ':' + (n++);
    el.setAttribute('data-edit', id);
    el.setAttribute('contenteditable', 'true');
    el.spellcheck = false;
    store.push({{ id, file: key + '.dc.html', el, original: el.innerText }});
  }});
}});

// 貼上一律轉純文字，免得把 Word／網頁的樣式帶進來
document.addEventListener('paste', e => {{
  const host = e.target.closest && e.target.closest('[data-edit]');
  if (!host) return;
  e.preventDefault();
  document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
}});

const byId = Object.fromEntries(store.map(s => [s.id, s]));
const countEl = document.getElementById('count');
const exportBtn = document.getElementById('export');

function changed() {{
  return store.filter(s => s.el.innerText.trim() !== s.original.trim());
}}
const chgsEl = document.getElementById('chgs');
const panel = document.getElementById('panel');
const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function renderPanel(c) {{
  if (!c.length) {{ chgsEl.innerHTML = '<div class="empty">還沒有修改。點畫布上任何一段字改改看。</div>'; return; }}
  chgsEl.innerHTML = c.map(s => (
    '<div class="chg">'
    + '<div class="loc">' + esc(s.file) + '</div>'
    + '<div class="old">' + esc(s.original.trim()) + '</div>'
    + '<div class="new">' + esc(s.el.innerText.trim()) + '</div>'
    + '<div class="go" data-goto="' + s.id + '">跳到這一處 →</div>'
    + '</div>'
  )).join('');
}}

chgsEl.addEventListener('click', e => {{
  const id = e.target.dataset && e.target.dataset.goto;
  if (!id) return;
  byId[id].el.scrollIntoView({{ behavior: 'smooth', block: 'center', inline: 'center' }});
}});

function refresh() {{
  const c = changed();
  store.forEach(s => s.el.classList.toggle(
    'dirty', s.el.innerText.trim() !== s.original.trim()
  ));
  countEl.textContent = c.length ? `已改 ${{c.length}} 處` : '尚未修改';
  exportBtn.disabled = c.length === 0;
  renderPanel(c);
}}

document.getElementById('review').addEventListener('click', () => panel.classList.toggle('open'));
document.getElementById('closePanel').addEventListener('click', () => panel.classList.remove('open'));

document.getElementById('canvas').addEventListener('input', refresh);

exportBtn.addEventListener('click', () => {{
  const payload = {{
    生成時間: new Date().toISOString(),
    說明: '把這支檔交給 AI，他會把修改落回對應的 .dc.html',
    修改: changed().map(s => ({{
      檔案: s.file,
      id: s.id,
      原文: s.original.trim(),
      改成: s.el.innerText.trim()
    }}))
  }};
  const blob = new Blob([JSON.stringify(payload, null, 2)], {{ type: 'application/json' }});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = '畫布修改.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 3000);
}});

const zoom = document.getElementById('zoom'), canvas = document.getElementById('canvas');
zoom.addEventListener('input', () => {{
  const z = zoom.value / 100;
  canvas.style.transform = `scale(${{z}})`;
  canvas.style.width = (100 / z) + '%';
  document.getElementById('zv').textContent = zoom.value + '%';
}});

const toggle = document.getElementById('toggle');
toggle.addEventListener('click', () => {{
  document.body.classList.toggle('marks');
  toggle.textContent = document.body.classList.contains('marks') ? '隱藏虛線' : '顯示虛線';
}});

refresh();
</script>
</body>
</html>
"""

OUT.write_text(HTML, encoding="utf-8")
edits = HTML.count("data-edit=")
print(f"寫出 {OUT.name}")
print(f"  {len(boards)} 屏、{len(notes)} 則註記、{round(len(HTML)/1024)} KB")
