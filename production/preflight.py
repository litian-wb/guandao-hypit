from pathlib import Path
import json,re
P=Path(__file__).parent
T=json.loads((P/'timing.json').read_text());s=(P/'chat.svml').read_text()
assert T['duration']==90.8 and T['fps']==60
assert round(T['duration']*T['fps'])==5448
inst=re.findall(r'<time:Instant id="([^"]+)" at="(\d+)f"',s)
assert len(inst)==len(T['events'])==30
joined=''.join(e['text'] for e in T['events'])
for phrase in ['万物皆变，规律不变','弱时观势','盛时知止','势来则乘','势尽则退','不是为了算尽未来','是为了在变化来临之前','看懂自己该往哪里走']:
 assert phrase in joined,phrase
for (id,frame),event in zip(inst,T['events']):
 assert id==event['id'] and int(frame)==round(event['time']*60)
 assert 0<=event['time']<90.8
for a,b in zip(T['events'],T['events'][1:]):
 duration=b['time']-a['time'];chars=len(re.sub(r'[，。：“”·？ ]','',a['text']))
 assert duration>=2.0 and chars/duration<=6.0,(a['title'],duration,chars)

assert all(0<=b['t']<=T['duration'] for b in T['beats'])
report={'passed':True,'duration':90.8,'fps':60,'frames':5448,'events':30,'beats':len(T['beats']),'source_copy_covered':True,'font_body_px':48,'minimum_event_spacing_s':min(b['time']-a['time'] for a,b in zip(T['events'],T['events'][1:]))}
(P/'preflight.json').write_text(json.dumps(report,indent=2))
lines=['# 90.8秒版事件时间轴','', '原始BGM时钟不变速。事件按最近60fps帧对齐；视觉入场在事件起点0–0.32秒完成，动作响应从事件起点发生。','', '|时间|帧|关键词|完整字幕|','|---:|---:|---|---|']
for e in T['events']:lines.append(f'|{e["time"]:.3f}|{round(e["time"]*60)}|{e["title"]}|{e["text"]}|')
(P.parent/'TIMELINE.md').write_text('\n'.join(lines)+'\n')
print(json.dumps(report,indent=2))
