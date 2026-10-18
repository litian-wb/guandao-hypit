from pathlib import Path
import os,sys,json,shutil,subprocess
root=Path.cwd(); engine=root/'engine'; project=root/'project'; out=project/'output';out.mkdir(exist_ok=True)
mode=os.environ.get('RENDER_MODE','smoke')
scene=engine/'examples/semantic-composition'
def run(args,**kw):
    print('+',' '.join(map(str,args)),flush=True)
    return subprocess.run(list(map(str,args)),cwd=engine,check=True,**kw)
def cli(*args,**kw):return run(['node','bin/hypit.mjs',*args],**kw)
try:
    if mode=='production':
        for f in ['chat.svml','chat.svrun','chat.svs']:
            shutil.copyfile(project/'production'/f,scene/f)
        shutil.copyfile(project/'production/render.ts',scene/'packages/chat-scene/src/render.ts')
        run(['pnpm','--filter','@example/chat-scene','build'])
    cfg=json.loads((scene/'hypit.runtime.json').read_text())
    cfg['endpoints']['html.local']['config']={'chromePath':shutil.which('google-chrome'),'workers':1,'maxWorkers':1,'defaultConcurrency':1}
    (scene/'hypit.runtime.json').write_text(json.dumps(cfg))
    common=['--project',str(scene)]
    rt=['--runtime',str(scene/'hypit.runtime.json')]
    cli('check',str(scene/'chat.svml'),*common)
    cli('programs','prepare',*rt,'--endpoint','html.local','--endpoint','media.local')
    p=cli('build',str(scene/'chat.svrun'),*common,*rt,'--follow','--json',capture_output=True,text=True)
    (out/'build.json').write_text(p.stdout);(out/'build.log').write_text(p.stderr)
    print(p.stdout,flush=True)
    data=json.loads(p.stdout);build=data['build'];bid=build['id']
    cli('get',bid,*common,'--output','final.video','--to',str(out/'silent.mp4'))
    if mode=='production':
        run(['ffmpeg','-v','error','-i',out/'silent.mp4','-i',project/'assets/bgm.mp3','-map','0:v','-map','1:a','-c:v','copy','-c:a','aac','-b:a','192k','-af','afade=t=out:st=49.6:d=0.8','-t','50.4','-movflags','+faststart','-y',out/'guandao-final.mp4'])
        (out/'silent.mp4').unlink()
        final=out/'guandao-final.mp4'
    else:final=out/'silent.mp4'
    probe=run(['ffprobe','-v','error','-show_format','-show_streams','-of','json',final],capture_output=True,text=True)
    (out/'probe.json').write_text(probe.stdout)
    run(['ffmpeg','-v','error','-i',final,'-f','null','-'],stderr=open(out/'decode-errors.log','w'))
    print('RENDER_SUCCESS',final,flush=True)
except subprocess.CalledProcessError as e:
    if e.stdout:(out/'failure.stdout').write_text(str(e.stdout))
    if e.stderr:(out/'failure.stderr').write_text(str(e.stderr))
    raise
finally:
    cli('runtime','down','--runtime',str(scene/'hypit.runtime.json'))
