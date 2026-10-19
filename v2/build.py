from pathlib import Path
import json,html,re,shutil
P=Path(__file__).parent;O=P/'generated';O.mkdir(exist_ok=True)
events=[{'time':round(t*60)/60,'title':h,'text':s,'chapter':c,'id':f'act{i}'} for i,(t,h,s,c) in enumerate(json.loads((P/'events.json').read_text()))]
timing={'duration':90.8,'fps':60,'events':events}
(O/'timing.json').write_text(json.dumps(timing,ensure_ascii=False,indent=2))
js=(P/'scene.js').read_text()
css='''canvas{position:absolute;inset:0;width:100%;height:100%}.brand{position:absolute;left:130px;top:104px;letter-spacing:6px;color:#b8c6bd;font-size:26px}.scene-tag{position:absolute;right:130px;top:110px;color:#9db0af;font:26px sans-serif;letter-spacing:3px}.caption{position:absolute;left:130px;right:130px;bottom:132px;text-align:center;white-space:nowrap;letter-spacing:2px;line-height:1.3}.chapter{position:absolute;left:130px;top:205px;white-space:nowrap;letter-spacing:5px;line-height:1.3}'''
header='''import { sealVisualTrack } from "@hypit/composition";
import type { VisualElement } from "@hypit/composition";
import { htmlVisual } from "@hypit/html-program";
import type { FontStackRef } from "@hypit/media";
import type { Timeline } from "@hypit/timeline";
import type { SpatialFrame } from "@hypit/spatial";
import { assertTemporalWindowFor } from "@hypit/temporal";
import type { TemporalInstant, TemporalWindow } from "@hypit/temporal";
export type Message = { id:string; sender:string; text:string; side:"left"|"right"; at:TemporalInstant };
export type ChatOptions={id:string;title:string;entranceFrames:number};
export function renderChat(timeline:Timeline,within:SpatialFrame,window:TemporalWindow,font:FontStackRef,messages:readonly Message[],options:ChatOptions){
assertTemporalWindowFor(window,{subjectId:options.id,timeline});let order=0;
const text=(id:string,value:string,size:number,color:string):VisualElement=>({id,kind:"text",parent:"guandao",order:++order,text:value,fonts:font.faces,style:[{name:"font-size",value:`${size}px`},{name:"line-height",value:1.3},{name:"color",value:color}]});
const children=[text("brand","观 道 / 一车之重",26,"#b8c6bd"),...messages.flatMap((m,i)=>[text(`head-${i}`,m.sender,66,"#a9dfc8"),text(`cap-${i}`,m.text,48,"#f1ecdb")])];
const html=`<canvas></canvas><div class="brand">{{brand}}</div><div class="scene-tag"></div>${messages.map((m,i)=>`<div class="chapter">{{head-${i}}}</div><div class="caption">{{cap-${i}}}</div>`).join("")}`;
const events=messages.map(m=>({time:(m.at.frame-window.span.startFrame)/60,title:m.sender,text:m.text,chapter:m.side==="right"}));
'''
footer='''return sealVisualTrack({id:options.id,timelineId:timeline.id,visualIr:"hypit.visual-ir@1",presents:[{id:options.id,order:0,z:0,span:window.span,elements:[{id:"guandao",kind:"program",order:0,program,style:[{name:"position",value:"absolute"},{name:"left",value:`${within.xPx}px`},{name:"top",value:`${within.yPx}px`},{name:"width",value:`${within.widthPx}px`},{name:"height",value:`${within.heightPx}px`}]},...children]}]});}
'''
(O/'render.ts').write_text(header+'const program=htmlVisual({html,css:'+json.dumps(':scope{background:#182b37;overflow:hidden}'+css)+',data:{events},setup:'+json.dumps(js,ensure_ascii=False)+'});\n'+footer)
old=Path('/var/minis/workspace/guandao/production/chat.svml').read_text();x=old[:old.index('  <time:Clock')]
x+='  <time:Clock id="clock" frame-rate="60"/>\n  <time:Timeline id="animation" clock={clock} end="5448f">\n'
for e in events:x+=f'    <time:Instant id="{e["id"]}" at="{round(e["time"]*60)}f"/>\n'
x+='''  </time:Timeline>
  <spatial:Canvas id="canvas" width="1920" height="1080"/>
  <fonts:Face id="font-face" package="@fontsource-variable/noto-sans-sc" weight="700" style="normal"/>
  <media:FontStack id="font" primary={font-face}/>
  <chat:Scene id="journey" timeline={animation.timeline} within={canvas.bounds} font={font} during={animation.window} title="观道">
'''
for e in events:
 side='right' if e['chapter'] else 'left';x+=f'    <chat:Message id="{e["id"]}" sender="{html.escape(e["title"],quote=True)}" text="{html.escape(e["text"],quote=True)}" side="{side}" at={{animation.{e["id"]}}}/>\n'
x+='''  </chat:Scene>
  <film:Film id="main" canvas={canvas.canvas} timeline={animation.timeline} appearance={style.film.main}>
    <film:Track source={journey.visual}/>
  </film:Film>
  <html:Video id="final" composition={main.composition} timeline={animation.timeline}/>
</svml>
'''
(O/'chat.svml').write_text(x);shutil.copyfile(P.parent/'production/chat.svrun',O/'chat.svrun')
(O/'chat.svs').write_text('<?svml using="@hypit/recipe@1"?>\n<sheet version="1">film.main { background: #182b37; }</sheet>\n')
parts=['<canvas></canvas><div class="brand">观 道 / 一车之重</div><div class="scene-tag"></div>']
for e in events:parts.append(f'<div class="chapter" style="font-size:66px;color:#a9dfc8">{html.escape(e["title"])}</div><div class="caption" style="font-size:48px;color:#f1ecdb">{html.escape(e["text"])}</div>')
preview='''<!doctype html><meta charset="utf-8"><style>@font-face{font-family:Scene;src:url(scene-font.woff2);font-weight:700}*{box-sizing:border-box}html,body{margin:0;background:#182b37}#stage{width:1920px;height:1080px;position:relative;overflow:hidden;font-family:Scene,sans-serif;font-weight:700}'''+css+'</style><div id="stage">'+''.join(parts)+'</div><script>const root=document.getElementById("stage"),data='+json.dumps(timing,ensure_ascii=False)+';window.drawFrame=(new Function("root","data",'+json.dumps(js,ensure_ascii=False)+'))(root,data);window.setTime=t=>{drawFrame(Math.round(t*60));return root.__audit};document.fonts.ready.then(()=>setTime(0));</script>'
(O/'preview.html').write_text(preview)
(P/'font-text.txt').write_text('观道一车之重'+''.join(e['title']+e['text'] for e in events))
def tc(t):
 n=round(t*1000);return f'{n//3600000:02}:{n//60000%60:02}:{n//1000%60:02},{n%1000:03}'
rows=[];audit=[]
for i,e in enumerate(events):
 end=events[i+1]['time'] if i+1<len(events) else 90.8
 chars=len(re.sub(r'[，。；：？ /]','',e['text']));rate=chars/(end-e['time']);assert rate<6.8,(e,rate)
 audit.append({'frame':round(e['time']*60),'chars_per_second':round(rate,2),'text':e['text']})
 rows.append(f'{i+1}\n{tc(e["time"])} --> {tc(end)}\n{e["text"]}\n')
(O/'guandao-v2.srt').write_text('\n'.join(rows));(O/'text-audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2))
print('Generated v2:',len(events),'events;',len(js),'JS characters; max reading rate:',max(r['chars_per_second'] for r in audit))
