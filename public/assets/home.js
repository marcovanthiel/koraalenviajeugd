/* =====================================================================
   KORAAL · VIA JEUGD — frontpagina
   Variant 1: Samenvloeiing (stroomveld + sprankeling, met intensiteit)
   Variant 2: Koraaltuin (generatieve koraalgroei)
   Eén schakelaar wisselt live tussen beide. Slechts één loopt tegelijk.

   Los bestand i.p.v. inline <script> zodat de Worker-CSP (script-src 'self')
   het niet blokkeert.
   ===================================================================== */

const BLAUW=[0,64,128], CYAAN=[0,144,208], BG=[247,245,240];
const TAU=Math.PI*2;
const REDUCED=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function el(tag,cls){ const e=document.createElement(tag); if(cls)e.className=cls; return e; }
function makeCaption(root, subtitle){
  const c=el('div','caption');
  c.innerHTML='<div class="merk">Koraal&nbsp;&middot;&nbsp;Via&nbsp;Jeugd</div>'+
              '<div class="sub">'+subtitle+'</div>';
  root.appendChild(c); return c;
}

/* =====================================================================
   VARIANT 1 — SAMENVLOEIING
   ===================================================================== */
function Variant1(root){
  const cv=el('canvas'); root.appendChild(cv);
  const ctx=cv.getContext('2d',{alpha:false});
  const caption=makeCaption(root,'Samen verder &middot; 1 maart 2027');
  const meter=el('div'); meter.style.cssText=
    'position:fixed;top:74px;left:50%;transform:translateX(-50%);color:#004080;'+
    'font-size:13px;letter-spacing:.18em;text-transform:uppercase;font-weight:600;'+
    'opacity:0;transition:opacity .5s ease;z-index:15;pointer-events:none';
  root.appendChild(meter);

  /* Perlin improved noise (public domain) */
  const Noise=(function(){
    const perm=[151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,
    142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,
    32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,
    77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,
    25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,
    109,198,173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,
    227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,
    167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,228,251,
    34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,
    106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,
    128,195,78,66,215,61,156,180];
    const p=new Uint8Array(512); for(let i=0;i<512;i++)p[i]=perm[i&255];
    const fade=t=>t*t*t*(t*(t*6-15)+10), lerp=(t,a,b)=>a+t*(b-a);
    function grad(h,x,y,z){h&=15;const u=h<8?x:y;const v=h<4?y:(h===12||h===14?x:z);return((h&1)===0?u:-u)+((h&2)===0?v:-v);}
    return function(x,y,z){
      const X=Math.floor(x)&255,Y=Math.floor(y)&255,Z=Math.floor(z)&255;
      x-=Math.floor(x);y-=Math.floor(y);z-=Math.floor(z);
      const u=fade(x),v=fade(y),w=fade(z);
      const A=p[X]+Y,AA=p[A]+Z,AB=p[A+1]+Z,B=p[X+1]+Y,BA=p[B]+Z,BB=p[B+1]+Z;
      return lerp(w,lerp(v,lerp(u,grad(p[AA],x,y,z),grad(p[BA],x-1,y,z)),lerp(u,grad(p[AB],x,y-1,z),grad(p[BB],x-1,y-1,z))),
                   lerp(v,lerp(u,grad(p[AA+1],x,y,z-1),grad(p[BA+1],x-1,y,z-1)),lerp(u,grad(p[AB+1],x,y-1,z-1),grad(p[BB+1],x-1,y-1,z-1))));
    };
  })();

  let W,H,DPR,cx,cy,diag;
  let intensity=0.6;
  const STEPS=12, palette=[];
  function buildPalette(alpha){ palette.length=0;
    for(let i=0;i<=STEPS;i++){const t=i/STEPS,lift=Math.sin(t*Math.PI)*22;
      const r=Math.round(BLAUW[0]+(CYAAN[0]-BLAUW[0])*t+lift*0.1);
      const g=Math.round(BLAUW[1]+(CYAAN[1]-BLAUW[1])*t+lift*0.5);
      const b=Math.round(BLAUW[2]+(CYAAN[2]-BLAUW[2])*t+lift*0.3);
      palette.push('rgba('+r+','+g+','+b+','+alpha+')');}
  }
  buildPalette(REDUCED?0.07:0.11);

  let particles=[],N=0;
  function targetCount(){let n=Math.round(W*H/(REDUCED?2600:900));return Math.max(700,Math.min(REDUCED?1400:3400,n));}
  function seed(p,side){p.side=side;const band=0.30;
    if(side===0)p.x=Math.random()*band*W; else p.x=W-Math.random()*band*W;
    p.y=Math.random()*H;p.px=p.x;p.py=p.y;p.max=320+Math.random()*520;
    p.spd=0.7+Math.random()*0.8;p.w=Math.random()<0.10?1.6+Math.random()*1.2:0.6+Math.random()*0.7;
    p.shine=Math.random()<0.16;}
  function initParticles(){N=targetCount();particles=new Array(N);
    for(let i=0;i<N;i++){const p={};seed(p,i%2);p.age=Math.random()*p.max|0;particles[i]=p;}}

  let sparks=[],AMBIENT=0;
  function ambientTarget(){return REDUCED?60:Math.max(60,Math.min(420,Math.round(W*H/9000*(0.45+intensity))));}
  function spawnAmbient(s){
    if(Math.random()<0.6){const r=Math.pow(Math.random(),0.6)*diag*0.22,a=Math.random()*TAU;s.x=cx+Math.cos(a)*r;s.y=cy+Math.sin(a)*r;}
    else{s.x=Math.random()*W;s.y=Math.random()*H;}
    s.vx=0;s.vy=0;s.drag=0.94;s.life=0;s.max=70+Math.random()*120;
    s.size=0.7+Math.random()*1.8;s.bright=0.5+Math.random()*0.5;s.white=Math.random()<0.5;s.burst=false;}
  function initSparks(){AMBIENT=ambientTarget();sparks=[];
    for(let i=0;i<AMBIENT;i++){const s={};spawnAmbient(s);s.life=Math.random()*s.max|0;sparks.push(s);}}
  let nextFlare=0;
  function flare(ax,ay){if(REDUCED)return;const count=Math.round((18+Math.random()*22)*(0.5+intensity));
    for(let i=0;i<count;i++){const a=Math.random()*TAU,sp=1.2+Math.random()*4.2;
      sparks.push({x:ax,y:ay,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,drag:0.93,life:0,max:38+Math.random()*46,
        size:1.0+Math.random()*2.4,bright:0.8+Math.random()*0.2,white:Math.random()<0.7,burst:true});}}

  function resize(){DPR=Math.min(window.devicePixelRatio||1,2);W=window.innerWidth;H=window.innerHeight;
    cx=W*0.5;cy=H*0.5;diag=Math.hypot(W,H);cv.width=W*DPR;cv.height=H*DPR;
    cv.style.width=W+'px';cv.style.height=H+'px';ctx.setTransform(DPR,0,0,DPR,0,0);
    ctx.fillStyle='rgb('+BG[0]+','+BG[1]+','+BG[2]+')';ctx.fillRect(0,0,W,H);initParticles();initSparks();}

  let z=0,raf=0,running=false;
  function frame(){
    if(!running)return;
    const ms=performance.now();
    const flowScale=0.0016+0.0007*Math.sin(ms*0.000031);
    const turb=1.6+0.45*Math.sin(ms*0.000017);
    const conf=0.35+0.30*Math.sin(ms*0.000023+1.2);
    const rot=0.6*Math.sin(ms*0.000013);
    z+=REDUCED?0.0011:0.0026;
    ctx.fillStyle='rgba('+BG[0]+','+BG[1]+','+BG[2]+','+(REDUCED?0.030:0.046)+')';ctx.fillRect(0,0,W,H);
    ctx.lineCap='round';
    const ax=cx+Math.sin(ms*0.00007)*W*0.06, ay=cy+Math.cos(ms*0.00009)*H*0.05;
    for(let i=0;i<N;i++){const p=particles[i];
      const n=Noise(p.x*flowScale,p.y*flowScale,z);let ang=n*TAU*turb+rot;
      let vx=Math.cos(ang),vy=Math.sin(ang);
      const dx=ax-p.x,dy=ay-p.y,d=Math.hypot(dx,dy)+1e-3;
      const pull=conf*(0.35+0.65*Math.min(1,d/(diag*0.5)));vx+=(dx/d)*pull;vy+=(dy/d)*pull;
      const m=Math.hypot(vx,vy)+1e-6,step=(REDUCED?0.9:1.5)*p.spd;vx=vx/m*step;vy=vy/m*step;
      p.px=p.x;p.py=p.y;p.x+=vx;p.y+=vy;
      const near=1-Math.min(1,d/(diag*0.42));let t=p.side===0?0.04:0.96;t=t+(0.5-t)*near*0.9;
      const idx=Math.max(0,Math.min(STEPS,(t*STEPS)|0));
      ctx.strokeStyle=palette[idx];ctx.lineWidth=p.w;
      ctx.beginPath();ctx.moveTo(p.px,p.py);ctx.lineTo(p.x,p.y);ctx.stroke();
      if(p.shine&&(near>0.18||Math.random()<0.04)){const a=0.10+near*0.22;
        ctx.fillStyle='rgba(120,210,245,'+a+')';ctx.beginPath();ctx.arc(p.x,p.y,p.w*0.9+0.4,0,TAU);ctx.fill();}
      p.age++;if(p.age>p.max||p.x<-20||p.x>W+20||p.y<-20||p.y>H+20){seed(p,p.side);p.age=0;}}
    const glow=0.5+0.5*Math.sin(ms*0.00045),gk=0.55+intensity*0.6,rad=diag*(0.17+0.06*glow);
    const g=ctx.createRadialGradient(ax,ay,0,ax,ay,rad);
    g.addColorStop(0,'rgba(0,144,208,'+((0.06+0.06*glow)*gk)+')');
    g.addColorStop(0.5,'rgba(0,144,208,'+((0.025+0.02*glow)*gk)+')');
    g.addColorStop(1,'rgba(0,144,208,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    if(ms>nextFlare){flare(ax,ay);nextFlare=ms+(3200+Math.random()*4200)/(0.5+intensity);}
    ctx.save();
    for(let i=sparks.length-1;i>=0;i--){const s=sparks[i];
      s.x+=s.vx;s.y+=s.vy;s.vx*=s.drag;s.vy*=s.drag;
      if(!s.burst){const n=Noise(s.x*flowScale*1.3,s.y*flowScale*1.3,z+10);s.x+=Math.cos(n*TAU)*0.25;s.y+=Math.sin(n*TAU)*0.25;}
      s.life++;const f=s.life/s.max;
      if(f>=1){if(s.burst)sparks.splice(i,1);else spawnAmbient(s);continue;}
      const a=Math.sin(Math.PI*f)*s.bright*(0.7+0.3*Math.sin(ms*0.02+s.x*0.05));if(a<=0.02)continue;
      const sz=s.size*(s.burst?(1-f*0.4):1);
      ctx.shadowColor='rgba(0,144,208,'+(a*0.9)+')';ctx.shadowBlur=sz*7;
      ctx.fillStyle='rgba(0,144,208,'+(a*0.85)+')';ctx.beginPath();ctx.arc(s.x,s.y,sz,0,TAU);ctx.fill();
      ctx.shadowBlur=sz*3;ctx.fillStyle=s.white?'rgba(255,255,255,'+a+')':'rgba(180,235,255,'+a+')';
      ctx.beginPath();ctx.arc(s.x,s.y,sz*0.42,0,TAU);ctx.fill();}
    ctx.shadowBlur=0;ctx.restore();
    raf=requestAnimationFrame(frame);
  }

  let meterTimer=null;
  function showMeter(){const pct=Math.round(intensity/1.5*100),bars=Math.round(intensity/1.5*10);
    meter.textContent='Intensiteit  '+'█'.repeat(bars)+'░'.repeat(10-bars)+'  '+pct+'%';
    meter.style.opacity='.6';clearTimeout(meterTimer);meterTimer=setTimeout(()=>meter.style.opacity='0',1800);}
  function setIntensity(v){intensity=Math.max(0,Math.min(1.5,v));initSparks();showMeter();}

  return {
    label:'1–4 = weergave · ↑↓ = intensiteit · spatie = vonk · F = volledig scherm · C = tekst',
    resize,
    start(){running=true;resize();raf=requestAnimationFrame(frame);},
    stop(){running=false;cancelAnimationFrame(raf);meter.style.opacity='0';},
    toggleCaption(){caption.classList.toggle('hidden');},
    key(e){const k=e.key.toLowerCase();
      if(e.key==='ArrowUp'||k==='+'||k==='='){e.preventDefault();setIntensity(intensity+0.15);}
      else if(e.key==='ArrowDown'||k==='-'||k==='_'){e.preventDefault();setIntensity(intensity-0.15);}
      else if(k===' '){e.preventDefault();particles.forEach((p,i)=>seed(p,i%2));flare(cx,cy);}}
  };
}

/* =====================================================================
   VARIANT 2 — KORAALTUIN
   ===================================================================== */
function Variant2(root){
  const cv=el('canvas'); root.appendChild(cv);
  const ctx=cv.getContext('2d',{alpha:false});
  const caption=makeCaption(root,'Samen groeien &middot; 1 maart 2027');

  let W,H,DPR,floorY;

  // warme koraal-paletten (op-merk: tropisch roze + zonnegloed-oranje), 3-stops
  const PSTEPS=20;
  function ramp(c0,c1,c2){const a=[];for(let i=0;i<=PSTEPS;i++){const t=i/PSTEPS;let r,g,b;
    if(t<0.5){const u=t/0.5;r=c0[0]+(c1[0]-c0[0])*u;g=c0[1]+(c1[1]-c0[1])*u;b=c0[2]+(c1[2]-c0[2])*u;}
    else{const u=(t-0.5)/0.5;r=c1[0]+(c2[0]-c1[0])*u;g=c1[1]+(c2[1]-c1[1])*u;b=c1[2]+(c2[2]-c1[2])*u;}
    a.push([Math.round(r),Math.round(g),Math.round(b)]);}return a;}
  // index 0 = dikke basis (diep), index PSTEPS = dunne tip (licht)
  const PAL_PINK=ramp([150,46,74],[221,115,162],[250,214,206]);   // tropisch roze koraal
  const PAL_WARM=ramp([165,55,42],[230,126,86],[250,221,186]);    // zonnegloed-oranje koraal
  const CORE=[255,246,238], POLYP=[255,243,228];

  let SEG,ATTRACT,KILL,maxNodes,nAttr,trunkW;
  function tune(){SEG=Math.max(4,Math.round(Math.min(W,H)/175));ATTRACT=SEG*8;KILL=SEG*1.7;
    const area=W*H;maxNodes=Math.max(1400,Math.min(4200,Math.round(area/360)));
    nAttr=Math.max(1000,Math.min(2600,Math.round(area/820)));
    trunkW=Math.max(10,Math.min(W,H)/42);}

  let nodes,sx,sy,nw,attr,grid,cell,frontier,phase,holdUntil,fadeStart,fadeAlpha,stallFrames,motes;
  function gkey(x,y){return((x/cell)|0)+'_'+((y/cell)|0);}
  function gridInsert(i){const k=gkey(nodes[i].x,nodes[i].y);let b=grid.get(k);if(!b){b=[];grid.set(k,b);}b.push(i);}
  function nearest(ax,ay){const gx=(ax/cell)|0,gy=(ay/cell)|0;let best=-1,bd=ATTRACT*ATTRACT;
    for(let X=gx-1;X<=gx+1;X++)for(let Y=gy-1;Y<=gy+1;Y++){const b=grid.get(X+'_'+Y);if(!b)continue;
      for(let j=0;j<b.length;j++){const idx=b[j],dx=nodes[idx].x-ax,dy=nodes[idx].y-ay,d=dx*dx+dy*dy;if(d<bd){bd=d;best=idx;}}}
    return best<0?null:{idx:best,d:Math.sqrt(bd)};}
  function addNode(x,y,parent,warm){const i=nodes.length;
    nodes.push({x,y,parent,flow:1,sw:Math.random()*TAU,warm:parent>=0?nodes[parent].warm:warm});gridInsert(i);
    if(parent>=0){let a=parent;while(a>=0){nodes[a].flow++;a=nodes[a].parent;}}frontier.push(i);return i;}

  function resetReef(){tune();nodes=[];frontier=[];grid=new Map();cell=ATTRACT;fadeAlpha=1;phase='grow';stallFrames=0;
    floorY=H*0.82;
    const colonies=4+(Math.random()*4|0);
    for(let i=0;i<colonies;i++){const x=W*(0.10+0.80*((i+0.5+(Math.random()-0.5)*0.5)/colonies));
      addNode(x,floorY+H*0.02,-1,Math.random()<0.5);}
    const extra=2+(Math.random()*3|0);
    for(let i=0;i<extra;i++)addNode(W*(0.08+0.84*Math.random()),floorY-H*0.02*Math.random(),-1,Math.random()<0.5);
    attr={x:new Float32Array(nAttr),y:new Float32Array(nAttr),alive:new Uint8Array(nAttr)};
    const yTop=H*0.12,ySpan=floorY-yTop;
    for(let i=0;i<nAttr;i++){attr.x[i]=W*(0.05+0.90*Math.random());const r=Math.pow(Math.random(),0.9);attr.y[i]=yTop+ySpan*r;attr.alive[i]=1;}}

  function growStep(){if(nodes.length>=maxNodes)return false;const infl=new Map();let anyAlive=false;
    for(let i=0;i<nAttr;i++){if(!attr.alive[i])continue;anyAlive=true;const nr=nearest(attr.x[i],attr.y[i]);if(!nr)continue;
      if(nr.d<KILL){attr.alive[i]=0;continue;}const n=nodes[nr.idx];let dx=attr.x[i]-n.x,dy=attr.y[i]-n.y;
      const dl=Math.hypot(dx,dy)||1;dx/=dl;dy/=dl;let e=infl.get(nr.idx);if(!e){e=[0,0,0];infl.set(nr.idx,e);}e[0]+=dx;e[1]+=dy;e[2]++;}
    if(infl.size===0)return anyAlive?null:false;
    frontier=[];
    infl.forEach((e,idx)=>{if(nodes.length>=maxNodes)return;let dx=e[0],dy=e[1];dy-=0.42;dx+=(Math.random()-0.5)*0.55;
      const dl=Math.hypot(dx,dy)||1,n=nodes[idx];addNode(n.x+dx/dl*SEG,n.y+dy/dl*SEG,idx);});
    return true;}

  function initMotes(){const n=REDUCED?30:Math.max(40,Math.min(120,Math.round(W*H/16000)));motes=[];
    for(let i=0;i<n;i++)motes.push({x:Math.random()*W,y:Math.random()*H,vy:-(0.04+Math.random()*0.14),
      ph:Math.random()*TAU,sz:0.6+Math.random()*1.8,sp:0.5+Math.random()*1.1});}

  function resize(){DPR=Math.min(window.devicePixelRatio||1,2);W=window.innerWidth;H=window.innerHeight;
    cv.width=W*DPR;cv.height=H*DPR;cv.style.width=W+'px';cv.style.height=H+'px';ctx.setTransform(DPR,0,0,DPR,0,0);
    resetReef();initMotes();}

  function paintBg(){
    const g=ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#F6FBFD');g.addColorStop(0.55,'#E4F1F4');g.addColorStop(1,'#D6E8EC');
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    // zachte lichtschachten van boven (zonlicht door water)
    ctx.save();ctx.globalCompositeOperation='lighter';
    const ms=performance.now();
    for(let i=0;i<4;i++){const x=W*(0.12+0.24*i)+Math.sin(ms*0.00007+i*1.7)*W*0.03;
      const lg=ctx.createLinearGradient(x,0,x+W*0.06,H);
      lg.addColorStop(0,'rgba(255,255,255,0.16)');lg.addColorStop(0.6,'rgba(222,240,248,0.05)');lg.addColorStop(1,'rgba(255,255,255,0)');
      ctx.fillStyle=lg;ctx.beginPath();ctx.moveTo(x-W*0.045,0);ctx.lineTo(x+W*0.045,0);ctx.lineTo(x+W*0.12,H);ctx.lineTo(x+W*0.02,H);ctx.closePath();ctx.fill();}
    ctx.restore();
    // zachte zandbodem
    const sg=ctx.createLinearGradient(0,floorY-H*0.05,0,H);
    sg.addColorStop(0,'rgba(232,221,196,0)');sg.addColorStop(1,'rgba(226,212,182,0.6)');
    ctx.fillStyle=sg;ctx.fillRect(0,floorY-H*0.05,W,H-(floorY-H*0.05));}

  let raf=0,running=false;
  function frame(){
    if(!running)return;
    const ms=performance.now(),t=ms*0.001;
    if(phase==='grow'){const steps=REDUCED?1:2;
      for(let s=0;s<steps;s++){const r=growStep();
        if(r===false){phase='hold';holdUntil=ms+(REDUCED?20000:32000);break;}
        if(r===null){if(++stallFrames>40){phase='hold';holdUntil=ms+32000;}}else stallFrames=0;}}
    else if(phase==='hold'){if(ms>holdUntil){phase='fade';fadeStart=ms;}}
    else if(phase==='fade'){fadeAlpha=1-(ms-fadeStart)/(REDUCED?5000:6500);if(fadeAlpha<=0){resetReef();}}
    paintBg();
    const N=nodes.length;
    if(!sx||sx.length<maxNodes+64){sx=new Float32Array(maxNodes+64);sy=new Float32Array(maxNodes+64);nw=new Float32Array(maxNodes+64);}
    const amp=REDUCED?2.5:7,cur=Math.sin(t*0.22)*0.5;
    for(let i=0;i<N;i++){const n=nodes[i],hf=Math.max(0,(floorY-n.y)/(floorY*0.9));
      const s=(Math.sin(t*0.6+n.y*0.010+n.sw)+cur)*amp*hf;
      sx[i]=n.x+s;sy[i]=n.y+Math.cos(t*0.45+n.sw)*amp*0.22*hf;
      nw[i]=Math.max(1.4,Math.min(trunkW,1.4+Math.pow(n.flow,0.46)*1.05));}
    ctx.lineCap='round';ctx.lineJoin='round';
    // 1) takken: dik bij de basis, taps naar de tip, warme koraalkleur
    for(let i=0;i<N;i++){const n=nodes[i],p=n.parent;if(p<0)continue;const w=nw[i];
      const tip=Math.max(0,Math.min(1,1-(w-1.4)/(trunkW-1.4)));     // 0=basis(diep) 1=tip(licht)
      const pal=n.warm?PAL_WARM:PAL_PINK,c=pal[(tip*PSTEPS)|0];
      ctx.strokeStyle='rgba('+c[0]+','+c[1]+','+c[2]+','+(0.9*fadeAlpha)+')';ctx.lineWidth=w;
      ctx.beginPath();ctx.moveTo(sx[p],sy[p]);ctx.lineTo(sx[i],sy[i]);ctx.stroke();}
    // 2) lichte kern op dikkere takken -> ronde, vlezige vorm
    for(let i=0;i<N;i++){const n=nodes[i],p=n.parent;if(p<0)continue;const w=nw[i];if(w<5)continue;
      ctx.strokeStyle='rgba('+CORE[0]+','+CORE[1]+','+CORE[2]+','+(0.18*fadeAlpha)+')';ctx.lineWidth=w*0.42;
      ctx.beginPath();ctx.moveTo(sx[p],sy[p]);ctx.lineTo(sx[i],sy[i]);ctx.stroke();}
    // 3) poliep-tips: zachte lichte knopjes op de uiteinden (geen vonken)
    for(let i=0;i<N;i++){const n=nodes[i];if(n.flow!==1)continue;const w=nw[i];
      ctx.fillStyle='rgba('+POLYP[0]+','+POLYP[1]+','+POLYP[2]+','+(0.55*fadeAlpha)+')';
      ctx.beginPath();ctx.arc(sx[i],sy[i],Math.max(1.7,w*1.05),0,TAU);ctx.fill();}
    // 4) zachte glinstering op groei-tips
    if(phase==='grow'&&frontier.length){for(let k=0;k<frontier.length;k++){const i=frontier[k];if(i>=N)continue;
      ctx.fillStyle='rgba(255,250,242,'+(0.5*fadeAlpha)+')';ctx.beginPath();ctx.arc(sx[i],sy[i],2.0,0,TAU);ctx.fill();}}
    // 5) marine snow (zwevende deeltjes)
    for(let i=0;i<motes.length;i++){const m=motes[i];m.y+=m.vy;m.x+=Math.sin(t*0.4*m.sp+m.ph)*0.10;
      if(m.y<-6){m.y=H+6;m.x=Math.random()*W;}const a=(0.16+0.18*Math.sin(t*1.4*m.sp+m.ph));if(a<=0.02)continue;
      ctx.fillStyle='rgba(255,255,255,'+a+')';ctx.beginPath();ctx.arc(m.x,m.y,m.sz,0,TAU);ctx.fill();}
    raf=requestAnimationFrame(frame);
  }

  return {
    label:'1–4 = weergave · spatie = nieuw rif · F = volledig scherm · C = tekst',
    resize,
    start(){running=true;resize();raf=requestAnimationFrame(frame);},
    stop(){running=false;cancelAnimationFrame(raf);},
    toggleCaption(){caption.classList.toggle('hidden');},
    key(e){if(e.key.toLowerCase()===' '){e.preventDefault();resetReef();}}
  };
}

/* =====================================================================
   PRESENTATIE — slideshow van slide-afbeeldingen (knop 3 & 4)
   cfg = { dir:'/presentaties/foto/', count:44, naam:"Foto's" }
   ===================================================================== */
function Presentation(root, cfg){
  const pad=n=>(n<10?'0':'')+n;
  const norm=i=>((i%cfg.count)+cfg.count)%cfg.count;
  const url=i=>cfg.dir+pad(norm(i)+1)+'.webp';

  // twee gestapelde lagen voor een zachte cross-fade
  const layers=[el('img','pres__img'),el('img','pres__img')];
  layers.forEach(l=>{l.alt=cfg.naam+' — dia';l.decoding='async';root.appendChild(l);});
  let front=0;

  function navBtn(dir){
    const b=el('button','pres__nav pres__nav--'+(dir<0?'prev':'next'));
    b.setAttribute('aria-label',dir<0?'Vorige dia':'Volgende dia');
    const pts=dir<0?'15 5 8 12 15 19':'9 5 16 12 9 19';
    b.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="'+pts+'"/></svg>';
    b.addEventListener('click',e=>{e.stopPropagation();show(idx+dir);});
    return b;
  }
  root.appendChild(navBtn(-1));
  root.appendChild(navBtn(1));

  const bar=el('div','pres__bar');
  const playBtn=el('button');playBtn.setAttribute('aria-label','Afspelen of pauzeren');
  const count=el('span','pres__count');
  const range=el('input','pres__range');range.type='range';range.min=2;range.max=15;range.step=1;
  range.setAttribute('aria-label','Snelheid diavoorstelling');
  const speedVal=el('span','pres__speedval');
  bar.appendChild(playBtn);bar.appendChild(count);bar.appendChild(range);bar.appendChild(speedVal);
  bar.addEventListener('click',e=>e.stopPropagation());
  root.appendChild(bar);

  let idx=0,timer=null,playing=false,running=false;
  let secs=parseInt(lsGet('koraal-pres-s')||'7',10);if(!(secs>=2&&secs<=15))secs=7;
  range.value=secs;speedVal.textContent=secs+'s';

  function clearTimer(){if(timer){clearTimeout(timer);timer=null;}}
  function schedule(){clearTimer();if(playing&&running)timer=setTimeout(()=>show(idx+1),secs*1000);}
  function setPlaying(p){playing=p;playBtn.textContent=p?'⏸':'▶';schedule();}

  function show(i){
    idx=norm(i);
    count.textContent=(idx+1)+' / '+cfg.count;
    const u=url(idx);
    const ld=new Image();
    ld.onload=function(){
      if(!running)return;
      const back=layers[front^1];
      back.src=u;
      back.classList.add('is-on');               // nieuwe laag in beeld (fade-in)
      layers[front].classList.remove('is-on');   // oude laag uit beeld (fade-out)
      front^=1;
    };
    ld.src=u;if(ld.complete)ld.onload();
    new Image().src=url(idx+1);   // volgende voorladen
    schedule();
  }

  playBtn.addEventListener('click',e=>{e.stopPropagation();setPlaying(!playing);});
  range.addEventListener('input',e=>{e.stopPropagation();secs=parseInt(range.value,10)||7;
    speedVal.textContent=secs+'s';lsSet('koraal-pres-s',secs);schedule();});

  return {
    label:'1–4 = weergave · klik / → = volgende dia · spatie = pauze · F = volledig scherm',
    resize(){},
    start(){running=true;show(0);setPlaying(true);},   // elke keer bij dia 1 beginnen
    stop(){running=false;setPlaying(false);clearTimer();layers.forEach(l=>l.classList.remove('is-on'));},
    toggleCaption(){},
    click(){show(idx+1);},                    // klik op de dia = volgende
    key(e){
      if(e.key==='ArrowRight'){e.preventDefault();show(idx+1);}
      else if(e.key==='ArrowLeft'){e.preventDefault();show(idx-1);}
      else if(e.key===' '){e.preventDefault();setPlaying(!playing);}
    }
  };
}

/* =====================================================================
   CONTROLLER — schakelaar tussen de varianten
   ===================================================================== */
const stage1=document.getElementById('stage1');
const stage2=document.getElementById('stage2');
const stage3=document.getElementById('stage3');
const stage4=document.getElementById('stage4');
const sw=document.getElementById('switch');
const hint=document.getElementById('hint');
const buttons=[...sw.querySelectorAll('button')];

const PRES_FOTO  ={dir:'/presentaties/foto/',  count:44, naam:"Foto's"};
const PRES_VRAGEN={dir:'/presentaties/vragen/',count:6,  naam:'Vragen aan groepen'};

const variants={
  1:{root:stage1, mod:null, make:r=>Variant1(r)},
  2:{root:stage2, mod:null, make:r=>Variant2(r)},
  3:{root:stage3, mod:null, make:r=>Presentation(r,PRES_FOTO)},
  4:{root:stage4, mod:null, make:r=>Presentation(r,PRES_VRAGEN)}
};
let activeId=null;

function lsGet(k){try{return localStorage.getItem(k);}catch(e){return null;}}
function lsSet(k,v){try{localStorage.setItem(k,v);}catch(e){}}

let hintTimer=null;
function flashHint(text){hint.textContent=text;hint.classList.remove('gone');
  clearTimeout(hintTimer);hintTimer=setTimeout(()=>hint.classList.add('gone'),5500);}

function activate(id){
  id=String(id);
  if(activeId===id)return;
  // huidige stoppen
  if(activeId&&variants[activeId].mod) variants[activeId].mod.stop();
  variants[activeId?activeId:'1']; // no-op guard
  if(activeId) variants[activeId].root.classList.add('off');
  // doel klaarzetten (lazy build)
  const v=variants[id];
  if(!v.mod) v.mod = v.make(v.root);
  v.root.classList.remove('off');
  v.mod.start();
  activeId=id;
  buttons.forEach(b=>b.classList.toggle('active', b.dataset.v===id));
  flashHint(v.mod.label);
  lsSet('koraal-variant', id);
}

buttons.forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();activate(b.dataset.v);}));

window.addEventListener('keydown',e=>{
  const k=e.key.toLowerCase();
  if(k==='1'){activate('1');return;}
  if(k==='2'){activate('2');return;}
  if(k==='3'){activate('3');return;}
  if(k==='4'){activate('4');return;}
  if(k==='f'){if(!document.fullscreenElement)document.documentElement.requestFullscreen?.();else document.exitFullscreen?.();return;}
  if(k==='c'){variants[activeId]?.mod.toggleCaption();return;}
  variants[activeId]?.mod.key(e);
});

document.addEventListener('click',e=>{
  if(sw.contains(e.target))return;          // schakelaar niet als trigger
  const m=variants[activeId]?.mod;
  if(m&&m.click){m.click(e);return;}        // presentaties: klik = volgende dia
  if(!document.fullscreenElement)document.documentElement.requestFullscreen?.();
  else document.exitFullscreen?.();
});

window.addEventListener('resize',()=>{variants[activeId]?.mod.resize();});

/* volledig scherm: knoppenbalk + cursor verschijnen bij muisbeweging, verdwijnen na rust */
let _idleT=null;
function wakeChrome(){
  document.body.classList.remove('fs-idle');
  clearTimeout(_idleT);
  if(document.fullscreenElement) _idleT=setTimeout(()=>document.body.classList.add('fs-idle'),3000);
}
document.addEventListener('mousemove',wakeChrome,{passive:true});
document.addEventListener('touchstart',wakeChrome,{passive:true});
document.addEventListener('fullscreenchange',wakeChrome);

/* start: onthouden keuze of standaard variant 1 */
const _saved=lsGet('koraal-variant');
activate(['2','3','4'].includes(_saved)?_saved:'1');
