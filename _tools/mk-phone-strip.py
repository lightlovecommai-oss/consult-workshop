"""把整頁長截圖切成手機螢幕那麼高的幾片，橫著排成一張——一眼看完整條捲動。

  python3 _tools/mk-phone-strip.py <長截圖.png> <輸出.png> [每片高=844] [底色]
"""
import sys

from PIL import Image

src, dst = sys.argv[1], sys.argv[2]
panel_h = int(sys.argv[3]) if len(sys.argv) > 3 else 844
pad, gap = 24, 16

im = Image.open(src).convert("RGB")
w, h = im.size
bg = sys.argv[4] if len(sys.argv) > 4 else "#%02x%02x%02x" % im.getpixel((2, 2))

# 截圖視窗開得比頁面高，尾巴是整片底色——先找到最後一列有東西的位置再切
edge = im.getpixel((2, h - 2))
content_h = h
for y in range(h - 1, 0, -1):
    if any(px != edge for px in im.crop((0, y, w, y + 1)).getdata()):
        content_h = min(h, y + 40)
        break

panels = [im.crop((0, t, w, min(t + panel_h, content_h)))
          for t in range(0, content_h, panel_h)]
if panels[-1].size[1] < panel_h // 4:
    panels.pop()

out_w = pad * 2 + len(panels) * w + (len(panels) - 1) * gap
out = Image.new("RGB", (out_w, pad * 2 + panel_h), bg)
for i, p in enumerate(panels):
    out.paste(p, (pad + i * (w + gap), pad))
out.save(dst)
print("%s  %d 片  %s" % (dst, len(panels), out.size))
