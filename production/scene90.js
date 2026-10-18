// Deterministic frame-addressable canvas scene, no media-generation API.
const canvas=root.querySelector('canvas'),ctx=canvas.getContext('2d');
canvas.width=1920;canvas.height=1080;
const W=1920,H=1080,TAU=Math.PI*2;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
const mix=(a,b,u)=>a+(b-a)*u;
const range=(t,a,b)=>smooth((t-a)/(b-a));
const rand=i=>{const v=Math.sin(i*12.9898+78.233)*43758.5453;return v-Math.floor(v)};
const C={mint:'#74e7d1',gold:'#e2bd85',red:'#e16859',white:'#e9f2ed',muted:'#7b969e'};
const events=data.events, beats=data.beats||[];
let clock=0;
const sections=[...root.querySelectorAll('.section')];
function path(points,color,width=1,fill=false){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));if(fill){ctx.closePath();ctx.fillStyle=color;ctx.fill()}else{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke()}}
function line(x,y,x2,y2,c,w=1){path([[x,y],[x2,y2]],c,w)}
function ellipse(x,y,rx,ry,color,w=1,fill=false){ctx.beginPath();ctx.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,TAU);if(fill){ctx.fillStyle=color;ctx.fill()}else{ctx.strokeStyle=color;ctx.lineWidth=w;ctx.stroke()}}
function arrow(x,y,angle,len,color,alpha=1){ctx.save();ctx.globalAlpha*=alpha;ctx.translate(x,y);ctx.rotate(angle);line(0,0,len,0,color,2);path([[len-9,-5],[len,0],[len-9,5]],color,2);ctx.restore()}
function glow(x,y,r,color,a){ctx.save();ctx.globalAlpha=a;const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,2*r,2*r);ctx.restore()}
// Persistent geography: a wide channel flows left to right, safe bay in lower left.
const mid=x=>548+42*Math.sin(x/365)-.035*(x-960);
const half=x=>160+18*Math.sin(x/240+1);
const water=(x,v)=>mid(x)+half(x)*v;
const bank=[];
for(let x=-150;x<=2100;x+=15)bank.push([x,water(x,-1)]);
for(let x=2100;x>=-150;x-=15)bank.push([x,water(x,1)]);
function geometry(t,pulse){
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#0c1b27');g.addColorStop(.5,'#122f39');g.addColorStop(1,'#070e17');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  glow(1050,440,880,'#234c54',.32);
  // Very restrained, dimensional terrain. Fixed banks are the invariant.
  for(let side=0;side<2;side++){
    for(let n=0;n<9;n++){
      const pts=[];for(let x=-150;x<=2100;x+=14){const off=(side?1:-1)*(half(x)+20+n*19);pts.push([x,mid(x)+off+Math.sin(x/130+n*.31)*8])}
      path(pts,'rgba(133,165,164,'+(.04+n*.003)+')',1);
    }
  }
  path(bank,'#0d2532',1,true);
  ctx.save();ctx.beginPath();bank.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.clip();
  const a=ctx.createLinearGradient(0,360,0,760);a.addColorStop(0,'#163e49');a.addColorStop(.47,'#0b2634');a.addColorStop(1,'#102e3e');ctx.fillStyle=a;ctx.fillRect(0,300,W,520);
  for(let k=0;k<30;k++){
    const v=(k/29)*1.86-.93;const pts=[];
    for(let x=-100;x<2100;x+=18)pts.push([x,water(x,v)+Math.sin(x/77-clock*(.5+rand(k)*.4)+k*.7)*(4+2*Math.sin(clock*.5))]);
    path(pts,'rgba(115,205,200,'+(.025+(.5+.5*Math.sin(k))* .045)+')',k%5===0?1.5:.7);
  }
  const travel=clock*29+90*Math.sin(clock*.05);
  for(let k=0;k<150;k++){
    const x=((rand(k+10)*2300+travel*(.6+rand(k+300)))%2300)-190;
    const v=(rand(k+80)*2-1)*.92;const y=water(x,v)+Math.sin(clock+k)*2;
    line(x,y,x+8+rand(k+111)*29,y-1,'rgba(146,231,219,'+(.05+rand(k+69)*.15)+')',.8+rand(k)*.8);
  }
  ctx.restore();
  const inv=range(t,11.18,14.16);ctx.globalAlpha=.24+.58*inv;
  path(bank.slice(0,151),'#71999b',1.2);
  const low=[];for(let x=-150;x<2100;x+=15)low.push([x,water(x,1)]);path(low,'#5d868a',1.2);
  ctx.globalAlpha=1;
  // Bay, a place to observe and to retreat into, always exists in the same terrain.
  ellipse(430,710,226,93,'#0d2836',1,true);ellipse(430,710,226,93,'#577f85',1.2);
  for(let k=0;k<6;k++)ctx.globalAlpha=.04+k*.012,ellipse(430,710,192-k*21,68-k*7,C.mint,1);
  ctx.globalAlpha=1;
  // A fixed north marker and six riverbed contour marks.
  ctx.save();ctx.globalAlpha=.2+.45*inv;arrow(1715,275,-Math.PI/2,59,C.white);ctx.restore();
  for(let k=0;k<7;k++){const x=300+k*205;line(x,water(x,-1)-6,x,water(x,-1)-18,C.muted,1)}
}
function boatPosition(t){
  // Continuous piecewise track with shared positions at every handoff.
  const K=[
    [0,1120,525],[2.47,1180,522],[5.07,1250,526],[8.27,1290,530],
    [8.28,290,665],[11.18,310,670],[20.52,350,680],[25.41,368,681],
    [29.03,400,665],[32.63,760,556],[35.52,1060,524],[37.53,1140,522],
    [40.39,1150,522],[44.02,1260,520],[48.17,1320,530],
    [50.81,1230,573],[54.12,1040,645],[56.78,950,666],[60.17,930,668],
    [63.58,930,668],[67.49,930,668],[71.06,950,663],[73.68,980,633],
    [76.14,1030,580],[79.21,1140,515],[82.29,1235,474],
    [85.03,1390,430],[88.25,1595,405],[90.8,1710,401]
  ];let a=K[0],b=K[1];for(let i=0;i<K.length-1;i++)if(t>=K[i][0]){a=K[i];b=K[i+1]}
  const u=smooth((t-a[0])/(b[0]-a[0]));return {x:mix(a[1],b[1],u),y:mix(a[2],b[2],u)};
}
function drawBoat(t,pulse){
  const pos=boatPosition(t),ahead=boatPosition(Math.min(90.799,t+.04)),behind=boatPosition(Math.max(0,t-.04));
  const vx=ahead.x-behind.x,vy=ahead.y-behind.y;
  const danger=t<8.28?range(t,2.47,5.07)*.09*Math.sin(clock*5):0;
  const angle=(Math.abs(vx)+Math.abs(vy)>.02?clamp(Math.atan2(vy,Math.abs(vx)+.001),-.3,.3):-.015)+danger;
  const show=1,sail=1-.82*range(t,37.53,40.39)+.82*range(t,40.39,42.43)-.82*range(t,48.17,50.81)+.7*range(t,76.14,79.21);
  ctx.save();ctx.globalAlpha=show;ctx.translate(pos.x,pos.y+Math.sin(clock*2.3)*1.7);ctx.rotate(angle);ctx.scale(1.18,1.18);
  glow(0,19,105,C.mint,.1);ellipse(0,24,92,15,'rgba(0,0,0,.4)',1,true);
  // Wake reacts to motion but doesn't move the hull independently.
  for(let k=0;k<4;k++){const q=(clock*.42+k*.25)%1;ctx.globalAlpha=show*(1-q)*.3;ellipse(-20-q*70,24,42+q*35,5+q*8,C.mint,1.1)}ctx.globalAlpha=show;
  path([[-91,0],[-50,12],[53,12],[100,-4],[65,29],[-51,29]],'#546a68',1,true);
  path([[-91,0],[-44,7],[62,7],[100,-4],[52,18],[-49,17]],'#d9dbca',1,true);
  line(-67,8,73,8,'#f1ebd3',2);line(-20,-112,-20,7,'#c9b795',3);
  const sw=64*sail;
  path([[-16,-106],[-16,-8],[-16+sw,-8]],'#e5e7d8',1,true);
  path([[-24,-100],[-24,-11],[-24-31*sail,-11]],'#93aaad',1,true);
  line(-16,-106,-16+sw,-8,'#e9dbc0',1.4);
  // Tiny navigator is physically attached to the hull, no sliding walk cycle.
  ellipse(32,-18,5,5,'#ddbd86',1,true);line(32,-13,31,2,'#c9d6d0',3);line(31,-7,45,-5,'#c9d6d0',2);
  const rudder=range(t,48.17,50.81)-range(t,56.78,60.17)+range(t,71.06,73.68)-range(t,79.21,82.29);
  line(-69,10,-111,35+rudder*15,'#c5b18c',3);
  ctx.restore();
  return pos;
}
function vortex(t,pulse){
  const show=t<8.28?1:range(t,32.63,35.52)*(1-range(t,56.78,60.17));
  if(show<=0)return;ctx.save();ctx.globalAlpha=show;ctx.translate(1455,530);glow(0,0,200,C.red,.13);
  for(let j=0;j<7;j++){
    const pts=[];for(let a=0;a<Math.PI*3;a+=.13){const r=12+a*12;pts.push([Math.cos(a+j*.9-clock*.75)*r,Math.sin(a+j*.9-clock*.75)*r*.38])}
    path(pts,'rgba(221,107,91,'+(.12+j*.025)+')',1.5);
  }
  ellipse(0,0,169+2*pulse,70+pulse,C.red,1.2);
  for(let k=0;k<4;k++)arrow(-100+k*50,-100+Math.sin(k)*12,Math.PI*.2,23,C.red,.6);
  ctx.restore();
}
function trajectories(t,pos,pulse){
  // Observing: the scan starts from the craft, not from an unrelated overlay.
  const scan=range(t,20.28,20.52)*(1-range(t,29.03,31));
  if(scan>0){ctx.save();ctx.globalAlpha=scan*.45;for(let k=0;k<3;k++){const q=(clock*.22+k/3)%1;ellipse(pos.x,pos.y,35+q*240,15+q*100,C.mint,1.3*(1-q))}ctx.restore()}
  // Stream comes alive, and the vessel uses it.
  const ride=range(t,40.17,40.39)*(1-range(t,48.17,50.81));
  if(ride>0){ctx.save();ctx.globalAlpha=ride*.8;for(let k=0;k<7;k++){const x=650+k*110;arrow(x,water(x,.05),-.1,40,C.mint,.5+.3*Math.sin(clock*3-k))}ctx.restore()}
  // Planned alternatives become deliberately uncertain rather than claiming prophecy.
  const prediction=range(t,63.58,65.17)*(1-range(t,71.06,73.68));
  if(prediction>0){ctx.save();ctx.globalAlpha=prediction;ctx.setLineDash([7,15]);for(let j=0;j<3;j++){
    const pts=[];for(let u=0;u<=1;u+=.025)pts.push([pos.x+u*630,pos.y-80*u+(j-1)*160*u*u]);
    path(pts,j===1?'#d4b581':'#6c8a96',1.5);const e=pts[pts.length-1];ellipse(e[0],e[1],13,13,'#839898',1);
    for(let k=0;k<10;k++){const u=rand(k+j*99);ellipse(e[0]+(u-.5)*110,e[1]+(rand(k+85+j)-.5)*85,1.7,1.7,'rgba(147,173,177,.5)',1,true)}
  }ctx.setLineDash([]);ctx.restore()}
  // The warning wave originates upstream and approaches the boat before it turns.
  const front=range(t,71.06,72.19)*(1-range(t,79.21,81.56));
  if(front>0){ctx.save();ctx.globalAlpha=front*.7;const fx=mix(520,1100,range(t,71.06,76.14));
    for(let k=0;k<4;k++){const pts=[];for(let y=375;y<740;y+=8)pts.push([fx+Math.sin(y/70)*14-k*17,y]);path(pts,k===0?C.gold:'rgba(226,189,133,.2)',k===0?2:1)}
    ctx.restore()}
  const way=range(t,76.14,77.8);
  if(way>0){ctx.save();ctx.globalAlpha=way;const pts=[];for(let u=0;u<1;u+=.01)pts.push([990+u*780,640-240*u-42*Math.sin(u*Math.PI)]);
    ctx.setLineDash([9,12]);path(pts,'rgba(116,231,209,.65)',2);ctx.setLineDash([]);
    for(let k=0;k<4;k++){const u=.2+k*.18;arrow(990+u*780,640-240*u-42*Math.sin(u*Math.PI),-.37,27,C.mint,.75)}
    ctx.restore()}
}
function weather(t,pulse){
  // Observable wind vane shifts before the body of the current: not an arbitrary label.
  const show=t<8.28?1:range(t,16.92,17.52)*(1-range(t,60.17,61.43));
  if(show>0){ctx.save();ctx.globalAlpha=show*.65;
    const x=1585,y=294,angle=-.25+1.15*range(t,48.17,50.81);
    ellipse(x,y,41,41,'rgba(157,185,180,.35)',1);arrow(x-20*Math.cos(angle),y-20*Math.sin(angle),angle,44,t>48.17?C.red:C.gold);
    for(let i=0;i<6;i++){const xx=850+i*112,yy=342+Math.sin(clock+i)*4;arrow(xx,yy,angle,36,t>48.17?C.red:C.muted,.5)}
    ctx.restore();
  }
  // Foreground crest grows before the stop; actual shape evolves, not a still layer.
  const high=range(t,32.63,35.52)*(1-range(t,40.39,42.43));
  if(high>0){ctx.save();ctx.globalAlpha=high*.8;
    for(let k=0;k<5;k++){const pts=[];for(let x=1210;x<1580;x+=8){const u=(x-1210)/370;pts.push([x,520-Math.sin(u*Math.PI)*70+Math.sin(u*11-clock)*7+k*10])}path(pts,k===0?C.gold:'rgba(226,189,133,.2)',k===0?2.5:1.1)}
    ctx.restore();
  }
}
function choice(t,pos,pulse){
  // Hook: the tempting continuation points straight into the whirlpool.
  if(t<8.28){ctx.save();ctx.globalAlpha=.35+.2*range(t,2.47,5.07);ctx.setLineDash([8,11]);
    path([[pos.x+90,pos.y],[1360,520],[1455,530]],C.red,2);ctx.setLineDash([]);
    arrow(pos.x+115,pos.y,0,65,C.red,.8);ctx.restore();
  }
  // During retreat, a ghost continuation shows the rejected route without replacing the real boat.
  const rejected=range(t,50.81,51.53)*(1-range(t,56.78,58.69));
  if(rejected>0){ctx.save();ctx.globalAlpha=rejected*.6;ctx.setLineDash([5,12]);path([[1280,520],[1390,520],[1455,530]],C.red,2);ctx.setLineDash([]);
    line(1380,495,1410,525,C.red,3);line(1380,525,1410,495,C.red,3);
    const pts=[];for(let u=0;u<1;u+=.03)pts.push([1320-390*u,530+138*Math.sin(u*Math.PI/2)]);path(pts,C.mint,1.6);ctx.restore();
  }
  // A sounding line resolves the abstraction of first checking one's own boat.
  const check=range(t,23.1,24.14)*(1-range(t,29.03,31));
  if(check>0){ctx.save();ctx.globalAlpha=check*.6;const xx=pos.x+115;
    line(xx,pos.y-20,xx,pos.y+83,C.gold,1);line(xx-9,pos.y+83,xx+9,pos.y+83,C.gold,2);
    for(let i=0;i<5;i++)line(xx-5,pos.y+i*15,xx+5,pos.y+i*15,C.muted,1);ctx.restore();
  }
}
function overlay(t,idx,pulse,pos){
  ctx.save();ctx.strokeStyle='rgba(134,175,180,.2)';ctx.lineWidth=1;
  // Scientific framing stays subdued; title and object carry the main hierarchy.
  line(132,160,242,160,'rgba(116,231,209,.45)',2);
  for(let k=0;k<3;k++)line(132+k*10,173,132+k*10,177,'rgba(116,231,209,.45)',1);
  // Fixed direction indicator: graphic meaning of invariant, never numerical mysticism.
  if(t>=14.16){const a=range(t,14.16,15.97);ctx.globalAlpha=a*.7;for(let k=0;k<4;k++)arrow(1040+k*80,300,0,37,C.mint,.45);ctx.globalAlpha=1}
  // Subtle impact ring at the scene event rather than repetitive full-screen flashes.
  if(idx>=0){const age=t-events[idx].time,q=clamp(age/.78);if(age<.78){ctx.globalAlpha=(1-q)*.16;ellipse(pos.x,pos.y,80+q*230,35+q*98,[0,1,2,12,13,17,18].includes(idx)?C.red:C.mint,2)}}
  const v=ctx.createRadialGradient(W/2,H/2,250,W/2,H/2,1150);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.64)');ctx.fillStyle=v;ctx.fillRect(0,0,W,H);
  // Procedural grain / drifting specks: deterministic in the absolute movie time.
  for(let k=0;k<135;k++){const x=(rand(k+501)*W+t*(1.2+rand(k)*2))%W,y=(rand(k+611)*H-t*(.8+rand(k+2)))%H;ctx.globalAlpha=.03+rand(k+33)*.08;ctx.fillStyle=C.white;ctx.fillRect(x,y,1.2,1.2)}
  ctx.globalAlpha=1;line(132,1025,1788,1025,'rgba(127,162,171,.14)',1);line(132,1025,132+1656*clamp(t/90.8),1025,'rgba(116,231,209,.65)',2);
  ctx.restore();
}
return frame=>{
  const t=frame/60;clock=t;
  let idx=0;for(let i=0;i<events.length;i++)if(t>=events[i].time)idx=i;
  let pulse=0;for(const b of beats){const dt=t-b.t;if(dt>=0&&dt<.28)pulse=Math.max(pulse,b.strength*Math.exp(-dt*16))}
  ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#08131d';ctx.fillRect(0,0,W,H);
  // Pull back only when the argument changes to navigation; world identities persist.
  const hook=t<8.28;
  const bay=range(t,20.52,23.1)*(1-range(t,29.03,32.63));
  const crest=range(t,32.63,35.52)*(1-range(t,40.39,44.02));
  const retreat=range(t,48.17,50.81)*(1-range(t,56.78,60.17));
  const map=range(t,60.17,63.58)*(1-range(t,76.14,79.21));
  const zoom=hook?1.23:1+bay*.12+crest*.09+retreat*.08-map*.14;
  const cameraX=hook?1180:960-bay*130+crest*80+retreat*75;
  ctx.save();ctx.translate(W/2,H/2);ctx.scale(zoom,zoom);ctx.translate(-cameraX,-H/2);
  geometry(t,pulse);vortex(t,pulse);weather(t,pulse);
  const pos=boatPosition(t);trajectories(t,pos,pulse);drawBoat(t,pulse);choice(t,pos,pulse);ctx.restore();overlay(t,idx,pulse,pos);
  sections.forEach((el,i)=>{const on=i===idx;el.style.display=on?'block':'none';if(on){const age=t-events[i].time,p=1-Math.pow(1-clamp(age/.32),3);el.style.opacity=String(p);el.querySelector('.keyword').style.transform='translateY('+(16*(1-p))+'px)';}});
  const number=root.querySelector('.number');number.textContent=String(t<11.18?0:t<20.52?1:t<32.63?2:t<40.39?3:t<48.17?4:t<60.17?5:t<71.06?6:7).padStart(2,'0');
  // Intentional flash-forward to flashback cut, masked by a short dark shutter.
  const curtain=(t>8.08&&t<8.48)?Math.max(0,1-Math.abs(t-8.28)/.2):0;
  if(curtain>0){ctx.fillStyle='rgba(5,12,18,'+curtain+')';ctx.fillRect(0,0,W,H)}
};
