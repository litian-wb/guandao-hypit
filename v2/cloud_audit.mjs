import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const base=process.cwd(),project=path.join(base,'project'),engine=path.join(base,'engine');
const require=createRequire(path.join(engine,'packages/provider-html-local/package.json'));
const puppeteer=require('puppeteer-core');
const out=path.join(project,'output');await fs.mkdir(out,{recursive:true});
const browser=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage();await page.setViewport({width:1920,height:1080,deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(pathToFileURL(path.join(project,'v2/generated/preview.html')).href);await page.evaluate(()=>document.fonts.ready);
 const checks=await page.evaluate(()=>{
  const bad=[],bg=[],samples=[];
  for(let i=0;i<data.events.length;i++){
   let e=data.events[i];setTime(e.time+.6);
   const el=document.querySelectorAll('.caption')[i];let range=document.createRange();range.selectNodeContents(el);let r=range.getBoundingClientRect();
   if(r.left<115||r.right>1805||r.bottom>970||r.top<880)bad.push({i,text:e.text,rect:r.toJSON()});
   let px=[...document.querySelector('canvas').getContext('2d').getImageData(40,40,1,1).data];bg.push(px);
   let s=root.__audit;if(s.metrics.handError>.5||s.metrics.footGap>1.5)bad.push({i,contacts:s.metrics});
   samples.push({t:e.time,scene:s.scene,metrics:s.metrics});
  }
  return {bad,bg,samples};
 });
 const signatures={};for(const t of [.2,20.8,35.7,57.1]){
  let hashes=[];for(let i=0;i<60;i++){
   const src=await page.evaluate(t=>{setTime(t);let mini=document.createElement('canvas');mini.width=320;mini.height=180;mini.getContext('2d').drawImage(document.querySelector('canvas'),0,0,320,180);return mini.toDataURL();},t+i/60);
   hashes.push(createHash('sha256').update(src).digest('hex'));
  }signatures[t]={tested:60,unique:new Set(hashes).size};
 }
 for(const t of [0,1.2,2.6,3.4,6.1,9.5,15,19,21.7,26,30,34,36.1,39,42,46,49,52,55,58,61,65,68,72,75,77.3,80.2,84,88.5,90.5]){
  await page.evaluate(t=>setTime(t),t);await page.screenshot({path:path.join(out,`audit-${String(t).replace('.','_')}.jpg`),type:'jpeg',quality:78});
 }
 const same=checks.bg.every(v=>JSON.stringify(v)===JSON.stringify(checks.bg[0]));
 const report={errors,subtitleAndContactViolations:checks.bad,staticCornerBrightnessConstant:same,backgroundRgba:checks.bg[0],motionSamples:signatures,samples:checks.samples};
 await fs.writeFile(path.join(out,'v2-audit.json'),JSON.stringify(report,null,2));
 if(errors.length||checks.bad.length||!same||Object.values(signatures).some(v=>v.unique<60))throw Error('Preflight visual/contacts/brightness checks failed; see v2-audit.json');
 console.log('V2_PREFLIGHT_PASSED',JSON.stringify({bg:checks.bg[0],events:checks.samples.length,motion:signatures}));
}finally{await browser.close()}
