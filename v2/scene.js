// One deterministic scene function per frame. No exposure pulses, opacity animation or black shutters.
const canvas=root.querySelector('canvas'),ctx=canvas.getContext('2d');canvas.width=1920;canvas.height=1080;
const W=1920,H=1080,PI=Math.PI,TAU=PI*2;
const C={bg:'#182b37',ink:'#263a46',edge:'#7d9296',light:'#eee8d5',mint:'#9ddcc9',red:'#d67b62',gold:'#d8b984',coat:'#4e8a8c',dark:'#172935'};
const cl=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),ss=x=>(x=cl(x),x*x*(3-2*x)),lerp=(a,b,u)=>a+(b-a)*u;
const u=(t,a,b)=>ss((t-a)/(b-a)),rnd=i=>{let r=Math.sin(i*91.21+2.9)*13847.33;return r-Math.floor(r)};
const captions=[...root.querySelectorAll('.caption')],heads=[...root.querySelectorAll('.chapter')];
let now=0,metrics={};
function poly(p,fill,stroke=null,w=2){ctx.beginPath();p.forEach((v,i)=>i?ctx.lineTo(...v):ctx.moveTo(...v));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=w;ctx.stroke()}}
function line(p,c=C.edge,w=2,dash=[]){ctx.beginPath();p.forEach((v,i)=>i?ctx.lineTo(...v):ctx.moveTo(...v));ctx.strokeStyle=c;ctx.lineWidth=w;ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([])}
function ell(x,y,rx,ry,c,stroke=null,w=2){ctx.beginPath();ctx.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,TAU);if(c){ctx.fillStyle=c;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=w;ctx.stroke()}}
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x,y,w,h)}
function arrow(x,y,dx,dy,c=C.gold,w=2){line([[x,y],[x+dx,y+dy]],c,w);let a=Math.atan2(dy,dx);line([[x+dx-12*Math.cos(a-.45),y+dy-12*Math.sin(a-.45)],[x+dx,y+dy],[x+dx-12*Math.cos(a+.45),y+dy-12*Math.sin(a+.45)]],c,w)}
function pill(x,y,w,h,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,10);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke()}}
function background(){
 rect(0,0,W,H,C.bg);
 // Unchanging illumination. Silhouettes are atmosphere, not flashes keyed to text.
 poly([[0,610],[0,425],[170,340],[330,426],[615,292],[865,435],[1130,322],[1380,430],[1630,310],[1920,403],[1920,650]],'#233c48');
 poly([[0,650],[0,530],[310,430],[537,522],[760,418],[1070,553],[1340,430],[1590,520],[1810,440],[1920,470],[1920,690]],'#2b4651');
 ell(1575,250,54,54,'#afbeb2');ell(1575,250,77,77,null,'#627c81',1);
 // Fixed small texture keeps a stable luminance reference in the corners.
 for(let i=0;i<120;i++){let x=rnd(i)*W,y=rnd(i+211)*740;rect(x,y,1,1,'#526b74')}
 line([[100,174],[1820,174]],'#48606a',1);
}
function ground(fn,start=-180,end=2140,fill='#374f55'){
 let p=[];for(let x=start;x<=end;x+=18)p.push([x,fn(x)]);p.push([end,1100],[start,1100]);poly(p,fill);
 let top=[];for(let x=start;x<=end;x+=14)top.push([x,fn(x)]);line(top,'#b1b6a0',5);
 let soil=[];for(let x=start;x<=end;x+=25)soil.push([x,fn(x)+36+Math.sin(x/73)*4]);line(soil,'#5c726d',2);
 for(let i=0;i<37;i++){let x=start+rnd(i+8)*(end-start),y=fn(x)+55+rnd(i+88)*100;if(y<860)line([[x,y],[x+8,y-3],[x+17,y+1]],'#526a67',1)}
}
function grass(x,y){for(let i=0;i<5;i++)line([[x+i*7,y],[x+i*7-4,y-10-rnd(i+x)*10]],'#819081',2)}
function river(y=780,level=0){
 rect(-200,y-level,2300,420,'#234b5b');
 for(let i=0;i<22;i++){
  let yy=y-level+12+i*12;let pts=[];for(let x=-200;x<2140;x+=30)pts.push([x,yy+Math.sin(x/90-now*1.1+i)*3]);line(pts,i%3?'#396574':'#779393',i%3?1:2);
 }
 for(let i=0;i<40;i++){let x=(rnd(i)*2300+now*28)%2300-200,yy=y-level+20+rnd(i+78)*180;line([[x,yy],[x+25,yy]],'#597f87',1)}
}
function flag(x,y,wind=1){
 line([[x,y],[x,y-180]],'#acb29b',5);ell(x,y-181,4,4,C.gold);
 let dir=wind>=0?1:-1,amp=Math.abs(wind),pts=[[x,y-170]];
 for(let k=1;k<=9;k++)pts.push([x+dir*k*10,y-170+Math.sin(now*5-k*.55)*7*amp+(1-amp)*k*3]);
 for(let k=9;k>=1;k--)pts.push([x+dir*k*10,y-143+Math.sin(now*5-k*.55)*7*amp+(1-amp)*k*3]);pts.push([x,y-143]);poly(pts,C.red);
 for(let i=0;i<4;i++)grass(x-45+i*25,y);
}
function gauge(x,y,rise=0){
 pill(x-16,y-210,32,244,'#b6b39a','#344e58');
 for(let i=0;i<10;i++)line([[x-12,y-190+i*21],[x+(i%2?0:10),y-190+i*21]],'#3a555d',2);
 rect(x-11,y-21-rise,22,10,C.red);
}
function bridge(t,{edge=1190,groundY=700,damage=1,water=0}={}){
 river(groundY+118,water);
 // Stone banks end at the crossing; the gap is unmistakable, not a line on land.
 ground(()=>groundY,-200,edge);ground(()=>groundY,edge+420,2200);
 poly([[edge-40,groundY],[edge+6,groundY+1],[edge-10,groundY+123],[edge-45,groundY+216],[edge-80,groundY+230]],'#596b66','#819184',2);
 poly([[edge+420,groundY],[edge+468,groundY],[edge+485,groundY+190],[edge+437,groundY+164]],'#596b66','#819184',2);
 line([[edge-65,groundY-115],[edge-65,groundY+25]],'#a8a992',8);line([[edge+480,groundY-115],[edge+480,groundY+25]],'#a8a992',8);
 let rope=[];for(let i=0;i<=24;i++){let q=i/24;rope.push([edge-65+q*545,groundY-105+Math.sin(q*PI)*60])}line(rope,'#b2aa88',3);
 for(let i=0;i<11;i++){
  let x=edge+i*38;let missing=damage>.7&&i>=3&&i<=6;
  if(!missing){ctx.save();ctx.translate(x,groundY+Math.sin(i*.7+now*2)*damage*3);ctx.rotate(i>=2&&i<=7?damage*(i-5)*.085:0);poly([[0,-5],[34,-5],[34,8],[0,8]],'#9c947a','#d1c6a0',2);ctx.restore()}
 }
 if(damage>.7){let a=.17*Math.sin(now*1.5);ctx.save();ctx.translate(edge+87,groundY);ctx.rotate(.68+a);poly([[0,-5],[80,-5],[80,8],[0,8]],'#8f8a72','#b7ac89',2);ctx.restore()}
 gauge(edge+330,groundY+165,water*.7);flag(edge-95,groundY,1-2*u(t,50.81,54.12));
}
function ik(a,b,l1,l2,bend){let dx=b[0]-a[0],dy=b[1]-a[1],d=Math.hypot(dx,dy),dd=cl(d,.01,l1+l2-.01),angle=Math.atan2(dy,dx),r=Math.acos(cl((l1*l1+dd*dd-l2*l2)/(2*l1*dd),-1,1));return [a[0]+l1*Math.cos(angle+bend*r),a[1]+l1*Math.sin(angle+bend*r)]}
function local(x,y,a,xx,yy){return [x+xx*Math.cos(a)-yy*Math.sin(a),y+xx*Math.sin(a)+yy*Math.cos(a)]}
function cart(x,fn,{slide=0,brake=0,sail=0,wind=1,slip=0,scale=1}={}){
 let gy=fn(x),ang=Math.atan2(fn(x+1)-fn(x-1),2),handle=local(x,gy,ang,-181,-125);
 ctx.save();ctx.translate(x,gy);ctx.rotate(ang);ctx.scale(scale,scale);
 ell(0,0,140,13,'#233c43');
 // Far wheel, frame and near wheel share exact world displacement rotation.
 function wheel(xx,far){ctx.save();ctx.translate(xx,-34);let radius=34;ell(0,0,radius,radius,far?'#263b43':'#20323a',far?'#83938b':'#c4bfa8',4);ctx.rotate(x/radius+slip);for(let i=0;i<8;i++){let a=i*TAU/8;line([[0,0],[Math.cos(a)*29,Math.sin(a)*29]],far?'#6f8583':'#9caaa0',2)}ell(0,0,7,7,C.gold);ctx.restore()}
 wheel(75,true);line([[-181,-125],[-115,-98],[106,-98],[116,-37]],'#c3b799',7);
 poly([[-112,-98],[105,-98],[122,-81],[-97,-81]],'#b5a88d','#ddd0ae',2);
 poly([[-97,-81],[122,-81],[122,-64],[-97,-64]],'#6e7569');
 for(let k=0;k<6;k++)line([[-90+k*33,-97],[-74+k*33,-82]],'#6e7569',2);
 // Recognizable red cargo. Its inertia is visible while the chassis stops.
 ctx.save();ctx.translate(slide,0);
 poly([[-69,-187],[51,-187],[71,-170],[-49,-170]],'#d69c76','#f0c193',2);
 poly([[-69,-187],[-49,-170],[-49,-99],[-69,-114]],'#874e44','#d79b79',2);
 poly([[-49,-170],[71,-170],[71,-99],[-49,-99]],'#b86f55','#e4ac82',2);
 rect(-5,-168,31,66,'#ddba86');line([[-49,-142],[71,-142]],'#754a3c',2);
 ctx.restore();
 // Anchor rope straightens as crate moves; always physically touches its upper corners.
 let sag=Math.max(0,1-slide/40)*9;ctx.beginPath();ctx.moveTo(-95,-99);ctx.lineTo(-68+slide,-188);ctx.quadraticCurveTo(slide,-188+sag,51+slide,-188);ctx.lineTo(101,-99);ctx.strokeStyle='#e5d6ae';ctx.lineWidth=3;ctx.stroke();
 // Clamp brake physically contacts the rear wheel when lever lowers.
 let leverY=lerp(-142,-119,brake);line([[-181,-125],[-166,leverY]],brake>.4?C.red:C.gold,6);
 line([[-166,leverY],[-87,-54]],'#7f968c',2);poly([[-105,-54],[-70,-54],[-67,-42],[-104,-42]],brake>.4?C.red:'#647b75');
 wheel(-75,false);
 // Cloth folded to a mast, opens only when the wind has earned a place in the story.
 line([[18,-98],[18,-291]],'#bcb28f',4);
 const span=8+sail*125,flutter=Math.sin(now*5)*wind*sail*8;
 poly([[20,-286],[20+span,-268+flutter],[20+span,-204+flutter*.4],[20,-195]],sail>.1?'#d9d4b8':'#8e9d91','#aeb5a3',2);
 if(sail>.1){for(let k=1;k<4;k++)line([[20+span*k/4,-282+k*4],[20+span*k/4,-198-k*2+flutter*.4]],'#b2b6a0',1);line([[20+span,-204+flutter*.4],[100,-98]],'#a9b8a2',2)}
 ctx.restore();return {x,y:gy,a:ang,handle,slide,brake,sail};
}
function person(px,fn,hand,{walk=0,push=0,pull=0,inspect=0,brake=0,pace=1}={}){
 let gy=fn(px),lean=push*24-pull*27,hip=[px,gy-101],shoulder=[px+lean,gy-170],head=[shoulder[0]+8,shoulder[1]-31];
 function foot(phase){let cycle=walk/103.2258+phase,p=cycle-Math.floor(cycle),fx,lift=0;if(p<.62)fx=px+32-p*103.2258;else{let q=(p-.62)/.38;fx=px-32+ss(q)*64;lift=Math.sin(q*PI)*23}const move=cl(pace);fx=lerp(px+(phase?31:-27),fx,move);lift*=move;if(Math.abs(walk)<.001){fx=px+(phase?31:-27);lift=0}return [fx,fn(fx)-7-lift]}
 let feet=[foot(0),foot(.5)];
 // Two knees solved from hip and planted/swinging feet. A shoe's sole meets the ground.
 for(let k=1;k>=0;k--){let a=[hip[0]+(k?6:-4),hip[1]+4],b=feet[k],knee=ik(a,b,56,56,k?-1:1);line([a,knee,b],k?'#354d59':'#597783',17);line([[b[0]-7,b[1]+4],[b[0]+17,b[1]+4]],k?'#1b2f39':'#d2cbb1',9)}
 poly([[shoulder[0]-16,shoulder[1]-5],[shoulder[0]+17,shoulder[1]],[hip[0]+23,hip[1]+13],[hip[0]-23,hip[1]+13]],C.coat,'#9db7b1',2);
 line([[shoulder[0]+1,shoulder[1]+4],[hip[0]+1,hip[1]+8]],'#315f67',2);
 // Rear arm then front arm share the same cart contact, not free-floating swings.
 let target=[hand[0],hand[1]];
 let elbow=ik([shoulder[0]+10,shoulder[1]+12],target,36,38,1);
 line([[shoulder[0]+10,shoulder[1]+12],elbow,target],'#659b99',12);ell(target[0],target[1],6,6,'#e0c69d');
 ell(head[0],head[1],18,23,'#ddc49f','#b8b599',1);
 poly([[head[0]-18,head[1]-4],[head[0]-15,head[1]-23],[head[0]+7,head[1]-26],[head[0]+20,head[1]-9],[head[0]+3,head[1]-13]],'#293841');
 poly([[head[0]+13,head[1]-1],[head[0]+23,head[1]+4],[head[0]+13,head[1]+7]],'#ddc49f');
 ell(head[0]+10,head[1]-4,2,2,'#283d44');
 let scarfY=shoulder[1]-7;line([[shoulder[0]-8,scarfY],[shoulder[0]+17,scarfY+3]],C.red,8);
 poly([[shoulder[0]-7,scarfY],[shoulder[0]-55,scarfY-7+Math.sin(now*4)*4],[shoulder[0]-32,scarfY+9],[shoulder[0]-9,scarfY+8]],C.red);
 metrics={handError:Math.hypot(target[0]-hand[0],target[1]-hand[1]),footGap:Math.min(...feet.map(f=>Math.abs(fn(f[0])-(f[1]+7)))),hip,shoulder,handle:target};
}
function pair(t,x,fn,opts={}){let c=cart(x,fn,opts);person(x-207,fn,c.handle,{walk:opts.walk??x,push:opts.push??0,pull:opts.pull??0,brake:opts.brake??0,pace:opts.pace??1});return c}

function view(cx,cy,z,fn){ctx.save();ctx.translate(W/2,570);ctx.scale(z,z);ctx.translate(-cx,-cy);fn();ctx.restore()}
function dust(x,y,t,strength=1){for(let i=0;i<12;i++){let q=(t*.8+rnd(i))%1;ell(x-10-q*100,y-4-q*12,3+q*7,1+q*2,null,'#93a69b',.6*strength)}}
function mark(x,y,num,color=C.mint){ell(x,y,22,22,C.dark,color,2);ctx.fillStyle=color;ctx.font='bold 20px monospace';ctx.textAlign='center';ctx.fillText(num,x,y+7);ctx.textAlign='left'}
function hook(t){
 const fn=x=>690;
 // First frame already contains a moving cart, an open gap and a displaced crate.
 let approach=1-Math.pow(1-cl(t/2.47),3),stop=u(t,2.12,2.47),x=lerp(1025,1127,approach),slide=lerp(13,43,u(t,2.47,3.43));
 let brake=stop,settle=1-u(t,5.07,6.94),shake=t>2.47&&t<3.43?Math.sin((t-2.47)*22)*Math.exp(-(t-2.47)*4)*4:0;
 view(1060,535,1.38,()=>{
  bridge(t,{edge:1245,groundY:690,damage:1});
  // A destination flag across the gap makes the wrong tempting direction readable.
  flag(1790,690,.8);arrow(1630,617,95,0,C.gold,2);
  let c=cart(x+shake,fn,{slide,brake,sail:0});
  person(x-207,fn,c.handle,{walk:x,push:0,pull:.9*stop,brake,pace:1-stop});
  if(t<2.47)dust(x-76,690,t);
  if(t>3.43){line([[x+112,680],[1245,680]],C.red,2);line([[1245,666],[1245,695]],C.red,2)}
  if(t>5.07){mark(x-82,578,'!',C.red);line([[x-82,598],[x-82,642]],C.red,2)}
 });
}
function departure(t){
 let localT=t-8.27,fn=x=>770-.14*(x-430),x=lerp(730,795,u(t,8.27,11.18));
 view(1000,590,1.05,()=>{
  ground(fn);flag(1510,fn(1510),lerp(.9,-.7,u(t,11.18,14.16)));
  // Local stone and chock show the invariant through observed action.
  let q=u(t,11.18,14.16),rockX=lerp(1310,1090,q);ell(rockX,fn(rockX)-14,17,14,'#aaa88f','#d1c6a8',2);
  if(t>=14.16){arrow(1250,fn(1250)-66,-110,15,C.gold,2);poly([[x-118,fn(x-118)],[x-74,fn(x-74)],[x-85,fn(x-85)-24]],'#bda781','#ead3a8',2)}
  pair(t,x,fn,{brake:u(t,14.16,15.97),push:.15,walk:x,pace:1-u(t,10.79,11.18)});
  // Bottom of valley and water respond independently of the fixed road slope.
  line([[1460,fn(1460)+64],[1630,fn(1630)+90]],'#7c9b9d',2);
 });
}
function uphill(t){
 const fn=x=>790-.24*(x-400),start=17.52;
 let struggle=u(t,17.52,20.52),release=u(t,23.1,25.41),x=780+struggle*49+Math.sin((t-start)*4)*5*(1-release)-release*12;
 let detail=t>=20.52&&t<23.1;
 view(detail?x-50:970,detail?fn(x)-85:540,detail?1.65:1.28,()=>{
  ground(fn);grass(1180,fn(1180));grass(1390,fn(1390));
  // A gentler route is revealed beyond a fork, not conjured at the end.
  line([[1070,fn(1070)],[1260,fn(1070)-12],[1550,fn(1070)-35]],'#7ea99b',5,[12,8]);
  flag(1470,fn(1470),.25);
  let pushing=1-release,slip=Math.sin(t*11)*.27*pushing;
  pair(t,x,fn,{push:.9*pushing,brake:release,walk:pushing*(t-start)*24+780,pace:pushing,slip});
  if(pushing>.1)dust(x-72,fn(x-72),t,pushing);
  // Scale anchored to the wheel makes little real progress visible despite effort.
  line([[730,fn(730)+35],[940,fn(940)+35]],'#d7c39c',2);for(let k=0;k<8;k++){let xx=730+k*30;line([[xx,fn(xx)+30],[xx,fn(xx)+43]],'#d7c39c',2)}
  if(t>25.41){arrow(1050,fn(1050)-80,180,-6,C.mint,3);mark(1280,fn(1280)-53,'2',C.mint)}
 });
}
function downhill(t){
 // Same cart, same load, opposite slope. The body changes from pushing to restraining.
 const fn=x=>650+85*Math.cos((cl(x,450,1650)-450)/1200*PI);
 let climb=u(t,29.03,32.63),accel=u(t,32.63,35.52),brake=u(t,35.13,35.52),stop=u(t,35.52,37.53);
 let x=lerp(650,840,climb)+lerp(0,265,accel)+40*stop;
 const groundFn=x=>650+(x<850?-(x-850)*.12:(x-850)*.2);
 let detail=t>=35.52&&t<37.53;
 view(detail?x-75:1020,detail?groundFn(x)-100:545,detail?1.65:1.22,()=>{
  ground(groundFn);flag(1510,groundFn(1510),.85);
  let c=cart(x,groundFn,{slide:19*stop,brake,sail:0});
  person(x-207,groundFn,c.handle,{walk:x,push:.55*(1-climb),pull:brake*.8,brake,pace:1-stop});
  if(t>32.63&&t<35.52){arrow(x+125,groundFn(x)-120,90,18,C.gold,3);dust(x-75,groundFn(x),t)}
  if(t>35.52){mark(x-163,groundFn(x)-172,'!',C.red);line([[x-160,groundFn(x)-151],[x-90,groundFn(x)-50]],C.red,2)}
 });
}
function tailwind(t){
 const fn=x=>716+Math.sin(x/620)*12;
 let sail=u(t,40.39,42.43),x=lerp(680,1310,u(t,42.43,50.81));
 view(1030,560,1.04,()=>{
  ground(fn);flag(500,fn(500),1);flag(1620,fn(1620),1);
  pair(t,x,fn,{sail,wind:1,push:0,walk:x,pace:u(t,42.43,43.27)*(1-u(t,50.4,50.81))});
  for(let k=0;k<6;k++){let xx=((t-40)*90+k*210)%1400+350,yy=420+Math.sin(k)*35;arrow(xx,yy,75,0,'#8bb5ad',2)}
  if(sail>.2)line([[x+140,fn(x)-255],[x+195,fn(x)-248]],'#d6d0ad',2);
 });
}
function retreat(t){
 let y=705,fn=x=>y,unfurl=1-u(t,50.81,54.12),back=u(t,56.78,60.17),x=1120-back*270;
 let detail=t>=54.12&&t<56.78;
 view(detail?1430:1090,detail?716:550,detail?1.47:1.22,()=>{
  bridge(t,{edge:1340,groundY:y,damage:u(t,50.81,54.12),water:lerp(0,92,u(t,50.81,56.78))});
  pair(t,x,fn,{sail:unfurl,wind:-.4,brake:1-unfurl,pull:.65*back,walk:x,pace:u(t,56.78,57.5)*(1-u(t,59.6,60.17))});
  if(t>54.12){arrow(1270,618,-120,0,C.mint,3);mark(1460,682,'!',C.red)}
  if(t>60.17){poly([[x-112,y],[x-75,y],[x-88,y-22]],'#bca889','#e2c99d',2)}
 });
}

function mapScene(t){
 // Paper is an object with hands, folds and a marked crossing, not a screen of unrelated icons.
 let open=u(t,63.58,65.17),close=u(t,73.68,76.14);
 view(1000,520,1,()=>{
  ground(()=>770);bridge(t,{edge:1380,groundY:770,damage:1,water:85});
  let c=cart(700,()=>770,{brake:1});
  person(493,()=>770,c.handle,{walk:0,push:0,pull:0});
 });
 ctx.save();ctx.translate(960,525);ctx.rotate(-.025);
 let sx=.94+.06*open-.1*close;ctx.scale(sx,sx);
 pill(-590,-238,1180,460,'#d4c4a0','#e3d2ad');
 // Map folds and contour lines are quiet; the chosen route is the thing that changes.
 for(let k=0;k<8;k++){let p=[];for(let x=-565;x<560;x+=16)p.push([x,-172+k*45+Math.sin(x/110+k)*18]);line(p,'#b2aa88',1)}
 line([[-190,-232],[-190,214]],'#b0a585',2);line([[204,-232],[204,214]],'#b0a585',2);
 line([[-490,103],[-260,73],[-45,20],[200,-50],[452,-101]],'#735e4f',7,[14,7]);
 line([[-490,103],[-360,-100],[-30,-132],[300,-125],[452,-101]],'#668d76',6);
 // Physical bridge drawing, its short route and a red slash when evidence contradicts it.
 for(let k=0;k<7;k++)line([[55+k*13,-26],[65+k*13,17]],'#705f4a',3);
 if(t>=67.49){const p=u(t,67.49,68.12);line([[35,-65],[35+135*p,-65+100*p]],C.red,8);line([[35,35],[35+135*p,35-100*p]],C.red,8)}
 ell(-490,103,11,11,C.red);ell(452,-101,12,12,C.gold,'#6b775c',2);
 // A compass is on the paper and doesn't claim to predict the wind.
 arrow(480,130,0,-77,'#746a50',3);line([[440,92],[520,92]],'#a39270',2);
 // Two cropped sleeves/hands grip the sheet, anchoring the close-up in the same character.
 poly([[-610,130],[-553,155],[-559,270],[-625,270]],C.coat,'#9db7b1',2);
 poly([[552,130],[611,110],[626,270],[561,270]],C.coat,'#9db7b1',2);
 ell(-571,118,18,28,'#ddc49f');ell(572,109,18,28,'#ddc49f');
 ctx.restore();
 // Three pieces of real evidence in the upper strip correspond to objects already seen.
 if(t>=71.06){
  line([[400,270],[540,270],[555,251]],C.red,4);line([[575,249],[585,273],[680,273]],C.red,4);
  gauge(970,323,76);flag(1390,343,-.9);
 }
}
function measure(t){
 const fn=x=>736;
 view(1020,545,1.05,()=>{
  bridge(t,{edge:1450,groundY:736,damage:1,water:85});
  pair(t,920,fn,{brake:1,walk:0});
  // Cargo and vehicle dimensions become concrete, beside the now-visible detour sign.
  let p=u(t,76.14,77.8);line([[808,790],[808+225*p,790]],C.gold,3);
  for(let k=0;k<10;k++){let x=808+k*25;if(x<=808+225*p)line([[x,784],[x,798]],C.gold,2)}
  line([[808,776],[808,805]],C.gold,3);if(p>.95)line([[1033,776],[1033,805]],C.gold,3);
  line([[1150,736],[1150,490]],'#a7a88f',7);
  poly([[1082,499],[1259,499],[1290,521],[1259,543],[1082,543]],'#8caa91','#d0c9a5',2);
  arrow(1135,521,101,0,C.dark,4);
  // Wide ramp branches before the broken bridge, no sudden teleport to another world.
  line([[1130,720],[1240,652],[1410,614],[1700,597]],C.mint,6,[16,10]);
 });
}
function ending(t){
 const turn=u(t,79.21,82.29),advance=u(t,82.29,90.8);
 // Cart goes along a raised, wider bypass. The broken bridge remains in the lower right.
 const fn=x=>730-95*ss((x-990)/600);
 let x=920+turn*130+advance*500,z=lerp(1.08,.86,u(t,85.03,90.8));
 view(1080,550,z,()=>{
  river(880,60);
  ground(fn,-200,2140);
  // Show the rejected crossing in the valley instead of erasing the problem.
  line([[1380,817],[1480,841]],'#7d8f82',5);line([[1595,854],[1740,854]],'#7d8f82',5);
  for(let k=0;k<6;k++)line([[1400+k*14,810+k*3],[1408+k*14,832+k*3]],'#bbb393',3);
  line([[1495,817],[1569,878]],C.red,3);
  line([[1625,604],[1625,495]],'#d0c6a4',6);poly([[1628,501],[1692,512],[1628,536]],C.mint);
  flag(490,fn(490),.55);grass(1120,fn(1120));grass(1530,fn(1530));
  pair(t,x,fn,{brake:0,sail:0,push:.18,walk:x});
  // The crate is fixed and all parts are retained: the visual payoff to the sliding box.
 });
}
function frameState(t){
 const scene=t<8.27?'hook':t<17.52?'departure':t<29.03?'uphill':t<40.39?'downhill':t<50.81?'tailwind':t<63.58?'retreat':t<76.14?'map':t<79.21?'measure':'ending';
 return {scene,t,metrics};
}
return frame=>{
 now=frame/60;const t=now;ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;
 background();
 if(t<8.27)hook(t);else if(t<17.52)departure(t);else if(t<29.03)uphill(t);else if(t<40.39)downhill(t);else if(t<50.81)tailwind(t);else if(t<63.58)retreat(t);else if(t<76.14)mapScene(t);else if(t<79.21)measure(t);else ending(t);
 // A fixed caption bed; no fades, no event-linked darkening. Exposure never keyed to BGM.
 rect(0,896,W,184,C.bg);line([[130,1015],[1790,1015]],'#526d73',1);
 line([[130,1015],[130+1660*cl(t/90.8),1015]],C.mint,2);
 let idx=0;for(let i=0;i<data.events.length;i++)if(t>=data.events[i].time)idx=i;
 captions.forEach((el,i)=>el.style.display=i===idx?'block':'none');
 heads.forEach((el,i)=>el.style.display=(data.events[idx].chapter&&i===idx)?'block':'none');
 const tag=root.querySelector('.scene-tag');if(tag)tag.textContent=frameState(t).scene==='hook'?'最后一寸':t<17.52?'回到出发时':t<29.03?'上坡':t<40.39?'下坡':t<50.81?'顺风':t<63.58?'桥前':t<76.14?'纸上与眼前':t<79.21?'量一量自己':'另一条路';
 root.__audit={...frameState(t),exposure:1};
};
