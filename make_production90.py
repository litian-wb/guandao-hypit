from pathlib import Path
import json,shutil
P=Path('/var/minis/workspace/guandao');out=P/'production';out.mkdir(exist_ok=True)
source=Path('/var/minis/workspace/hypit-review/examples/semantic-composition')
events=[(0.02, '让你翻船的', '让你翻船的，未必是风浪。'), (2.47, '未必是风浪', '也可能是那句：'), (5.07, '再往前一点', '“再往前一点，就能赢了。”'), (8.27, '同一条河', '同一条河，为什么有人进，有人退？'), (11.18, '万物皆变', '万物皆变，规律不变。'), (14.16, '规律不变', '变的是水势，不变的是进退的分寸。'), (17.52, '风转 · 水落', '风会转向，水有涨落。'), (20.52, '弱时观势', '弱时观势，不是站在岸边空等。'), (23.1, '先别硬闯', '船小的时候，别急着跟浪较劲。'), (25.41, '先看水 · 再看风', '看清哪里有力，哪里会把你卷回。'), (29.03, '等方向清楚', '方向清楚了，再把第一步迈出去。'), (32.63, '盛时知止', '盛时知止，不是突然胆小。'), (35.52, '顺风 ≠ 永远加速', '顺风时，别忘了借的是风。'), (37.53, '浪尖之前 · 收帆', '越接近浪尖，越要知道何时收帆。'), (40.39, '势来则乘', '势来则乘，让方向替你省力。'), (44.02, '借势 · 不逞强', '借的是势，不是把蛮力当本事。'), (48.17, '势尽则退', '势尽则退，别把退让看成失败。'), (50.81, '风已转向', '风已经变了，再用力，也回不到刚才。'), (54.12, '再进 · 只是执拗', '此刻再进，可能只是舍不得停下。'), (56.78, '留住下一程', '退一步，是把下一程的可能留下。'), (60.17, '观道', '所以，观道，'), (63.58, '不算尽未来', '不是为了算尽未来。'), (67.49, '推演 ≠ 保证', '你可以推演很多条路，却不能保证每阵风。'), (71.06, '变化来临之前', '是为了在变化来临之前，'), (73.68, '认出第一道转向', '认出水面第一道转向。'), (76.14, '先调整自己', '不等风浪推着你走，先调整自己。'), (79.21, '不必赢过每场风', '你不需要赢过每一场风。'), (82.29, '看懂自己', '你要看懂的，是自己。'), (85.03, '该往哪里走', '看懂自己该往哪里走。'), (88.25, '进退 · 由你', '这一次，进退，由你。')]
events=[{'time':round(t*60)/60,'title':a,'text':b,'id':f'beat{i}'} for i,(t,a,b) in enumerate(events)]
beats=json.loads((P/'analysis/beats-analysis.json').read_text())['onsets'];beats=[b for b in beats if b['t']<=90.8 and b['strength']>.3]
(out/'timing.json').write_text(json.dumps({'duration':90.8,'fps':60,'events':events,'beats':beats},ensure_ascii=False,indent=2))
# The existing official surface already models events as named instant/message inputs.
js=(out/'scene90.js').read_text()
header='''import { sealVisualTrack } from "@hypit/composition";
import type { VisualElement } from "@hypit/composition";
import { htmlVisual } from "@hypit/html-program";
import type { FontStackRef } from "@hypit/media";
import type { Timeline } from "@hypit/timeline";
import type { SpatialFrame } from "@hypit/spatial";
import { assertTemporalWindowFor } from "@hypit/temporal";
import type { TemporalInstant, TemporalWindow } from "@hypit/temporal";
export type Message = { id: string; sender: string; text: string; side: "left" | "right"; at: TemporalInstant };
export type ChatOptions = { id: string; title: string; entranceFrames: number };
export function renderChat(timeline: Timeline, within: SpatialFrame, window: TemporalWindow,
  font: FontStackRef, messages: readonly Message[], options: ChatOptions) {
  assertTemporalWindowFor(window, { subjectId: options.id, timeline });
  let order=0;
  const text=(id:string,value:string,size:number,color:string):VisualElement=>({id,kind:"text",parent:"guandao",order:++order,text:value,fonts:font.faces,style:[{name:"font-size",value:`${size}px`},{name:"line-height",value:1.25},{name:"color",value:color}]});
  const children=[text("brand","观 道",25,"#a1bbb9"),text("edition","变化之中 · 进退有度",22,"#77979a"),
    ...messages.flatMap((m,i)=>[text(`title-${i}`,m.sender,m.sender.length>7?86:m.sender.length>5?104:130,[0,1,2,12,13,17,18].includes(i)?"#e16859":[5,6,22].includes(i)?"#e2bd85":"#83e4d0"),text(`line-${i}`,m.text,48,"#edf2ec")])];
  const html=`<canvas></canvas><div class="brand">{{brand}}</div><div class="edition">{{edition}}</div><div class="number">01</div>${messages.map((m,i)=>`<section class="section"><div class="keyword">{{title-${i}}}</div><div class="caption">{{line-${i}}}</div></section>`).join("")}`;
  const css=`:scope{background:#08131d;overflow:hidden}canvas{position:absolute;inset:0;width:100%;height:100%}.brand{position:absolute;left:132px;top:104px;letter-spacing:8px}.edition{position:absolute;right:132px;top:104px;letter-spacing:4px}.number{position:absolute;right:132px;top:145px;font:22px monospace;color:#527d83;letter-spacing:5px}.section{position:absolute;inset:0;display:none}.keyword{position:absolute;left:132px;top:215px;letter-spacing:6px;white-space:nowrap;filter:drop-shadow(0 4px 12px rgba(0,0,0,.3))}.caption{position:absolute;left:132px;right:132px;bottom:103px;text-align:center;white-space:nowrap;letter-spacing:3px;text-shadow:0 2px 10px #000}`;
  const events=messages.map(m=>({time:(m.at.frame-window.span.startFrame)/60,title:m.sender,text:m.text}));
'''
footer='''
  return sealVisualTrack({id:options.id,timelineId:timeline.id,visualIr:"hypit.visual-ir@1",presents:[{id:options.id,order:0,z:0,span:window.span,elements:[{id:"guandao",kind:"program",order:0,program,style:[{name:"position",value:"absolute"},{name:"left",value:`${within.xPx}px`},{name:"top",value:`${within.yPx}px`},{name:"width",value:`${within.widthPx}px`},{name:"height",value:`${within.heightPx}px`}]},...children]}]});
}
'''
(out/'render.ts').write_text(header+'  const program=htmlVisual({html,css,data:{events,beats:'+json.dumps(beats)+'},setup:'+json.dumps(js,ensure_ascii=False)+'});\n'+footer)
xml='''<?svml using="@hypit/markup@1"?>
<svml>
  <import as="time" from="@hypit/timeline-author@1"/>
  <import as="spatial" from="@hypit/spatial@1"/>
  <import as="media" from="@hypit/media@1"/>
  <import as="fonts" from="@hypit/fontsource@1"/>
  <import as="chat" from="@example/chat-scene@1"/>
  <import as="film" from="@hypit/film@1"/>
  <import as="html" from="@hypit/html-video@1"/>
  <import as="style" source="./chat.svs"/>
  <time:Clock id="animation-clock" frame-rate="60"/>
  <time:Timeline id="animation" clock={animation-clock} end="90.8s">
'''
for e in events:xml+=f'    <time:Instant id="{e["id"]}" at="{round(e["time"]*60)}f"/>\n'
xml+='''  </time:Timeline>
  <spatial:Canvas id="canvas" width="1920" height="1080"/>
  <fonts:Face id="font-face" package="@fontsource-variable/noto-sans-sc" weight="700" style="normal"/>
  <media:FontStack id="font" primary={font-face}/>
  <chat:Scene id="navigation" timeline={animation.timeline} within={canvas.bounds} font={font} during={animation.window} title="观道">
'''
for e in events:xml+=f'    <chat:Message id="{e["id"]}" sender="{e["title"]}" text="{e["text"]}" side="left" at={{animation.{e["id"]}}}/>\n'
xml+='''  </chat:Scene>
  <film:Film id="main" canvas={canvas.canvas} timeline={animation.timeline} appearance={style.film.main}>
    <film:Track source={navigation.visual}/>
  </film:Film>
  <html:Video id="final" composition={main.composition} timeline={animation.timeline}/>
</svml>
'''
(out/'chat.svml').write_text(xml)
(out/'chat.svrun').write_text((source/'chat.svrun').read_text())
(out/'chat.svs').write_text('<?svml using="@hypit/recipe@1"?>\n<sheet version="1">\n film.main { background: #08131d; }\n</sheet>\n')
shutil.copyfile('/var/minis/attachments/uploads/开智小曲.mp3',P/'assets/bgm.mp3')
print('Created SVML/SVS/SVRun and deterministic 60fps component. Events:',len(events))
