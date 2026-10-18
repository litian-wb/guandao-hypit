from pathlib import Path
import json,html
P=Path('/var/minis/workspace/guandao');timing=json.loads((P/'production/timing.json').read_text());ev=timing['events']
(P/'analysis/font-text.txt').write_text('观道变化之中进退有度'+''.join(e['title']+e['text'] for e in ev))
parts=[]
for i,e in enumerate(ev):
 c='#e16859' if i in [0,1,2,12,13,17,18] else '#e2bd85' if i in [5,6,22] else '#83e4d0';size=86 if len(e['title'])>7 else 104 if len(e['title'])>5 else 130
 parts.append(f'<section class="section"><div class="keyword" style="font-size:{size}px;color:{c}">{html.escape(e["title"])}</div><div class="caption">{html.escape(e["text"])}</div></section>')
js=(P/'production/scene90.js').read_text()
body='''<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:Scene;src:url(scene-font.woff2);font-weight:700}*{box-sizing:border-box}html,body{margin:0;background:#08131d}#stage{position:relative;width:1920px;height:1080px;overflow:hidden;background:#08131d;font-family:Scene,sans-serif;font-weight:700}canvas{position:absolute;inset:0;width:100%;height:100%}.brand{position:absolute;left:132px;top:104px;letter-spacing:8px;font-size:25px;color:#a1bbb9}.edition{position:absolute;right:132px;top:104px;letter-spacing:4px;font-size:22px;color:#77979a}.number{position:absolute;right:132px;top:145px;font:22px monospace;color:#527d83;letter-spacing:5px}.section{position:absolute;inset:0;display:none}.keyword{position:absolute;left:132px;top:215px;letter-spacing:6px;white-space:nowrap;line-height:1.25;filter:drop-shadow(0 4px 12px rgba(0,0,0,.3))}.caption{position:absolute;left:132px;right:132px;bottom:103px;text-align:center;white-space:nowrap;letter-spacing:3px;text-shadow:0 2px 10px #000;font-size:48px;line-height:1.25;color:#edf2ec}
</style><div id="stage"><canvas></canvas><div class="brand">观 道</div><div class="edition">变化之中 · 进退有度</div><div class="number">01</div>'''+''.join(parts)+'''</div><script>
const root=document.getElementById('stage'),data='''+json.dumps(timing,ensure_ascii=False)+''';
window.drawFrame=(new Function('root','data','''+json.dumps(js,ensure_ascii=False)+'''))(root,data);
window.setTime=t=>{drawFrame(Math.round(t*60));return t};document.fonts.ready.then(()=>setTime(8));
</script>'''
(P/'analysis/preview.html').write_text(body)
print('preview prepared')
