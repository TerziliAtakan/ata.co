/* ================= placeholder imagery (canvas) =================
   Painted scenes stand in for photography so the layout reads as it will with real media.
   Each canvas is replaced by <img>/<picture> (lazy, sized, WebP/AVIF) in production. */
const rnd=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x)};
const lg=(c,x0,y0,x1,y1,st)=>{const g=c.createLinearGradient(x0,y0,x1,y1);st.forEach(([o,col])=>g.addColorStop(o,col));return g};
const box=(c,x,y,w,h,f)=>{c.fillStyle=f;c.fillRect(x,y,w,h)};
function glow(c,x,y,r,rgb,a){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(${rgb},${a})`);g.addColorStop(1,`rgba(${rgb},0)`);c.fillStyle=g;c.fillRect(x-r,y-r,2*r,2*r)}
function ridge(c,W,H,base,amp,s,fill,f=1){c.beginPath();c.moveTo(0,H);for(let i=0;i<=120;i++){const u=i/120,x=u*W;const y=base-amp*(.55*Math.sin(u*3.1*f+s)+.3*Math.sin(u*7.3*f+s*2.1)+.15*Math.sin(u*17*f+s*3.7)+.4);c.lineTo(x,y)}c.lineTo(W,H);c.closePath();c.fillStyle=fill;c.fill()}
function sea(c,W,H,y0,top,bot,t,sx,s){box(c,0,y0,W,H-y0,lg(c,0,y0,0,H,[[0,top],[1,bot]]));
  for(let i=0;i<90;i++){const k=i/90,y=y0+(H-y0)*Math.pow(k,1.7);const len=W*(.02+.09*rnd(i+s))*(0.4+k);let x=(rnd(i*3+s)*W+t*(8+20*k)*(rnd(i)>.5?1:-1))%(W+len);if(x<-len)x+=W+len;
    const near=Math.max(0,1-Math.abs(x-sx)/(W*.16));c.fillStyle=`rgba(255,228,196,${.05+.35*near*(1-k*.5)})`;c.fillRect(x,y,len,Math.max(1,H*.002*(1+k)))}}
function person(c,x,y,h,col){c.fillStyle=col;c.beginPath();c.arc(x,y-h*.9,h*.1,0,7);c.fill();c.beginPath();c.moveTo(x-h*.14,y-h*.02);c.lineTo(x-h*.12,y-h*.62);c.quadraticCurveTo(x,y-h*.8,x+h*.12,y-h*.62);c.lineTo(x+h*.14,y-h*.02);c.closePath();c.fill()}
let NOISE;function grain(c,W,H){if(!NOISE){NOISE=document.createElement("canvas");NOISE.width=NOISE.height=96;const n=NOISE.getContext("2d"),d=n.createImageData(96,96);for(let i=0;i<d.data.length;i+=4){const v=Math.random()*255;d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=16}n.putImageData(d,0,0)}c.fillStyle=c.createPattern(NOISE,"repeat");c.fillRect(0,0,W,H)}
function vignette(c,W,H,a=.35){const g=c.createRadialGradient(W/2,H/2,Math.min(W,H)*.3,W/2,H/2,Math.max(W,H)*.75);g.addColorStop(0,"rgba(0,0,0,0)");g.addColorStop(1,`rgba(0,0,0,${a})`);c.fillStyle=g;c.fillRect(0,0,W,H)}

const SCENES={
  coast(c,W,H,s,t,cv){const hz=H*(.6+.04*rnd(s));const sx=W*(.55+.25*rnd(s+1));
    box(c,0,0,W,hz,lg(c,0,0,0,hz,[[0,"#26303b"],[.45,"#6b6667"],[.8,"#c29878"],[1,"#e6c59c"]]));
    glow(c,sx,hz-H*.03,H*.5,"255,212,168",.5);c.fillStyle="#f7ddb9";c.beginPath();c.arc(sx,hz-H*.03,H*.022,0,7);c.fill();
    ridge(c,W,H,hz,H*.06,s,"rgba(60,62,72,.9)",1.4);
    sea(c,W,H,hz,"#50525a","#12161c",t,sx,s);
    if(cv.dataset.figure){ridge(c,W,H,H*.93,H*.012,s+2,"#0d0f12",.5);person(c,W*.2,H*.9,H*.17,"#0d0f12");if(cv.dataset.figure==="2")person(c,W*.27,H*.9,H*.155,"#0d0f12");box(c,W*.05,H*.83,W*.004,H*.08,"#0d0f12");box(c,W*.05,H*.83,W*.3,H*.004,"rgba(13,15,18,.9)")}
    vignette(c,W,H,.4)},
  range(c,W,H,s,t,cv){box(c,0,0,W,H,lg(c,0,0,0,H,[[0,"#aeb6bb"],[.55,"#e3d8c6"],[1,"#d7c7ae"]]));glow(c,W*.25,H*.25,H*.6,"255,236,205",.55);
    ridge(c,W,H,H*.52,H*.2,s,"#9aa0a3",1.2);ridge(c,W,H,H*.62,H*.17,s+1.3,"#767d7f",1.5);ridge(c,W,H,H*.74,H*.11,s+2.2,"#4f5554",1.8);
    if(cv.dataset.sea){sea(c,W,H,H*.8,"#4d5c63","#1d262b",t,W*.3,s)}else ridge(c,W,H,H*.9,H*.05,s+3,"#2a2e2c",2.2);vignette(c,W,H,.3)},
  villa(c,W,H,s){box(c,0,0,W,H,lg(c,0,0,0,H,[[0,"#8499a5"],[.6,"#e6d6bf"],[1,"#e9dcc8"]]));glow(c,W*.8,H*.3,H*.6,"255,225,190",.5);
    ridge(c,W,H,H*.64,H*.08,s,"rgba(105,114,118,.55)",1.3);box(c,0,H*.76,W,H*.24,lg(c,0,H*.76,0,H,[[0,"#c9b89e"],[1,"#8f7d65"]]));
    const x0=W*(.14+.06*rnd(s));box(c,x0,H*.52,W*.62,H*.25,"#eee8dd");box(c,x0+W*.04,H*.56,W*.34,H*.2,lg(c,0,H*.56,0,H*.76,[[0,"#2a3237"],[1,"#171b1e"]]));
    box(c,x0+W*.4,H*.58,W*.18,H*.16,"#d6cdbf");box(c,x0+W*.1,H*.37,W*.66,H*.15,"#f5f0e7");box(c,x0+W*.14,H*.4,W*.44,H*.09,"#1d2327");
    box(c,x0+W*.1,H*.52,W*.66,H*.012,"rgba(0,0,0,.18)");c.fillStyle="rgba(255,240,215,.18)";c.fillRect(x0+W*.14,H*.4,W*.12,H*.09);
    box(c,W*.06,H*.8,W*.62,H*.06,lg(c,0,H*.8,0,H*.86,[[0,"#7fa3aa"],[1,"#3f6a74"]]));box(c,W*.06,H*.8,W*.62,H*.004,"rgba(255,255,255,.5)");
    c.fillStyle="#2f3a2c";c.beginPath();c.ellipse(W*.88,H*.55,W*.022,H*.2,0,0,7);c.fill();c.beginPath();c.ellipse(W*.93,H*.6,W*.018,H*.15,0,0,7);c.fill();
    person(c,W*.72,H*.84,H*.11,"#1b1d1f");vignette(c,W,H,.3)},
  interior(c,W,H,s){box(c,0,0,W,H,lg(c,0,0,W,0,[[0,"#d9cfc0"],[1,"#c8bba8"]]));const wx=W*.1,wy=H*.12,ww=W*.54,wh=H*.6;
    c.save();c.beginPath();c.rect(wx,wy,ww,wh);c.clip();box(c,wx,wy,ww,wh*.62,lg(c,0,wy,0,wy+wh*.62,[[0,"#9fb4c0"],[1,"#eadcc4"]]));glow(c,wx+ww*.7,wy+wh*.5,wh*.6,"255,230,200",.6);
    sea(c,W,wy+wh,wy+wh*.62,"#6d8793","#34505c",0,wx+ww*.7,s);c.restore();
    c.strokeStyle="#2a2724";c.lineWidth=Math.max(2,W*.006);c.strokeRect(wx,wy,ww,wh);c.beginPath();c.moveTo(wx+ww/2,wy);c.lineTo(wx+ww/2,wy+wh);c.stroke();
    box(c,0,H*.72,W,H*.28,lg(c,0,H*.72,0,H,[[0,"#b7a38a"],[1,"#8a7660"]]));c.fillStyle="rgba(255,240,215,.28)";c.beginPath();c.moveTo(wx,H*.72);c.lineTo(wx+ww,H*.72);c.lineTo(wx+ww*1.25,H);c.lineTo(wx+ww*.1,H);c.fill();
    box(c,W*.58,H*.64,W*.36,H*.1,"#ece5d9");box(c,W*.58,H*.6,W*.36,H*.06,"#e2d9cb");box(c,W*.6,H*.74,W*.32,H*.025,"#3a3531");box(c,W*.36,H*.77,W*.16,H*.02,"#3b3430");
    c.strokeStyle="#2b2825";c.lineWidth=Math.max(1,W*.003);c.beginPath();c.moveTo(W*.96,H*.72);c.lineTo(W*.96,H*.2);c.quadraticCurveTo(W*.96,H*.12,W*.86,H*.14);c.stroke();glow(c,W*.86,H*.18,H*.12,"255,225,180",.6);vignette(c,W,H,.28)},
  land(c,W,H,s){box(c,0,0,W,H,lg(c,0,0,0,H*.45,[[0,"#bfc6c4"],[1,"#efe2c9"]]));glow(c,W*.7,H*.3,H*.5,"255,232,200",.5);box(c,0,H*.38,W,H*.07,"#7c94a0");ridge(c,W,H,H*.4,H*.06,s,"rgba(120,126,120,.5)",1);
    const cols=["#a99d73","#8e8a62","#b6a77d","#78754f","#9c9068"];cols.forEach((col,i)=>ridge(c,W,H,H*(.47+i*.11),H*.035,s+i,col,.8));
    for(let i=0;i<70;i++){const y=H*(.5+.5*Math.pow(rnd(i+s),.8)),x=rnd(i*7+s)*W,r=H*.008*(1+6*((y-H*.5)/(H*.5)));c.fillStyle="rgba(0,0,0,.18)";c.beginPath();c.ellipse(x+r*.6,y+r*.35,r*1.1,r*.4,0,0,7);c.fill();c.fillStyle="#4a5037";c.beginPath();c.arc(x,y,r,0,7);c.fill()}vignette(c,W,H,.3)},
  street(c,W,H,s){box(c,0,0,W,H,lg(c,0,0,0,H,[[0,"#9eb0b8"],[.5,"#e5d4b9"]]));const top=H*.22,bot=H*.64;box(c,0,top,W,bot-top,lg(c,0,top,0,bot,[[0,"#cdb18a"],[1,"#a98d67"]]));
    box(c,0,top,W,H*.015,"#8e7556");const n=5+Math.floor(rnd(s)*2),aw=W/n;for(let i=0;i<n;i++){const x=i*aw+aw*.18,w=aw*.64,y=top+H*.12;c.fillStyle="#2c2823";c.beginPath();c.moveTo(x,bot);c.lineTo(x,y+w/2);c.arc(x+w/2,y+w/2,w/2,Math.PI,0);c.lineTo(x+w,bot);c.fill();glow(c,x+w/2,bot-H*.06,w*.5,"255,200,140",.35)}
    box(c,0,bot,W,H-bot,lg(c,0,bot,0,H,[[0,"#56696f"],[1,"#1b252a"]]));for(let i=0;i<n;i++){c.fillStyle="rgba(20,18,15,.35)";c.fillRect(i*aw+aw*.2,bot,aw*.6,H*.18)}sea(c,W,H,bot,"rgba(0,0,0,0)","rgba(0,0,0,0)",0,W*.5,s);
    c.fillStyle="#efe8dc";c.beginPath();c.moveTo(W*.55,H*.72);c.lineTo(W*.8,H*.72);c.lineTo(W*.77,H*.77);c.lineTo(W*.58,H*.77);c.fill();box(c,W*.66,H*.52,W*.004,H*.2,"#efe8dc");vignette(c,W,H,.35)},
  aerial(c,W,H,s){box(c,0,0,W,H,lg(c,0,0,W,H,[[0,"#244f5c"],[.55,"#5f9aa0"],[1,"#9fcaca"]]));c.fillStyle="#dcc9a6";c.beginPath();c.moveTo(W,0);
    const pts=[];for(let i=0;i<=40;i++){const u=i/40;pts.push([W*(.55+.22*u+.04*Math.sin(u*9+s)),H*u])}pts.forEach(p=>c.lineTo(p[0],p[1]));c.lineTo(W,H);c.fill();
    for(let k=0;k<3;k++){c.strokeStyle=`rgba(255,255,255,${.55-k*.15})`;c.lineWidth=Math.max(1,W*.003);c.beginPath();pts.forEach((p,i)=>c[i?"lineTo":"moveTo"](p[0]-W*(.012+k*.018),p[1]));c.stroke()}
    for(let i=0;i<34;i++){const r=rnd(i+s),y=H*rnd(i*5+s),x=W*(.66+.22*y/H)+W*.12*r;c.fillStyle="rgba(0,0,0,.18)";c.beginPath();c.arc(x+W*.006,y+W*.006,W*.009,0,7);c.fill();c.fillStyle=r>.5?"#f3efe6":"#c9a98a";c.beginPath();c.arc(x,y,W*.009,0,7);c.fill()}vignette(c,W,H,.25)},
  night(c,W,H,s){box(c,0,0,W,H,lg(c,0,0,0,H,[[0,"#0d121a"],[.6,"#2a3242"],[.7,"#51475a"]]));glow(c,W*.5,H*.62,H*.5,"190,120,110",.25);ridge(c,W,H,H*.6,H*.16,s,"#0b0e13",1.2);
    for(let i=0;i<14;i++){const x=W*(.1+.8*rnd(i+s)),w=W*(.03+.05*rnd(i*2+s)),h=H*(.05+.12*rnd(i*3+s));box(c,x,H*.66-h,w,h,"#141922");for(let j=0;j<4;j++)if(rnd(i*9+j+s)>.4)box(c,x+w*.2,H*.66-h+h*(.15+j*.2),w*.6,h*.06,"rgba(255,205,150,.75)")}
    box(c,0,H*.66,W,H*.34,lg(c,0,H*.66,0,H,[[0,"#151b24"],[1,"#07090d"]]));for(let i=0;i<60;i++){const x=W*rnd(i+s*3);c.fillStyle=`rgba(255,200,140,${.08+.2*rnd(i)})`;c.fillRect(x,H*.67+H*.3*rnd(i*4),W*.02*rnd(i*6),Math.max(1,H*.003))}vignette(c,W,H,.4)},
  portrait(c,W,H,s){box(c,0,0,W,H,lg(c,0,0,W,0,[[0,"#4a4239"],[.5,"#262320"],[1,"#141312"]]));glow(c,0,H*.35,W*.9,"240,215,180",.45);const cx=W*(.52+.06*rnd(s)),hy=H*.36,hr=Math.min(W,H)*.12;
    c.fillStyle="#0f0e0d";c.beginPath();c.ellipse(cx,hy,hr*.82,hr,0,0,7);c.fill();c.fillRect(cx-hr*.35,hy+hr*.7,hr*.7,hr*.6);c.beginPath();c.moveTo(cx-hr*2.8,H);c.bezierCurveTo(cx-hr*2.6,hy+hr*1.9,cx-hr*1.2,hy+hr*1.4,cx,hy+hr*1.35);c.bezierCurveTo(cx+hr*1.2,hy+hr*1.4,cx+hr*2.6,hy+hr*1.9,cx+hr*2.8,H);c.fill();
    c.strokeStyle="rgba(240,212,176,.35)";c.lineWidth=Math.max(1.5,W*.004);c.beginPath();c.ellipse(cx,hy,hr*.82,hr,0,Math.PI*.6,Math.PI*1.35);c.stroke();vignette(c,W,H,.45)},
  meet(c,W,H,s,t){const hz=H*.5;box(c,0,0,W,hz,lg(c,0,0,0,hz,[[0,"#3a3f48"],[.6,"#9a826c"],[1,"#e0bb92"]]));glow(c,W*(.6+.2*rnd(s)),hz-H*.02,H*.55,"255,210,160",.55);
    ridge(c,W,H,hz,H*.05,s,"rgba(58,60,68,.85)",1.2);sea(c,W,H,hz,"#5a5a5e","#22262c",t,W*.7,s);
    box(c,0,H*.58,W,H*.012,"rgba(15,15,17,.9)");for(let i=0;i<24;i++)box(c,W*i/24,H*.58,Math.max(1,W*.003),H*.2,"rgba(15,15,17,.55)");
    box(c,0,H*.78,W,H*.22,lg(c,0,H*.78,0,H,[[0,"#2a2622"],[1,"#141210"]]));
    box(c,W*.36,H*.7,W*.28,H*.018,"#1a1714");box(c,W*.49,H*.718,W*.02,H*.1,"#1a1714");
    box(c,W*.41,H*.675,W*.02,H*.025,"#e9e1d4");box(c,W*.57,H*.675,W*.02,H*.025,"#e9e1d4");
    person(c,W*.32,H*.86,H*.34,"#100f0e");person(c,W*.68,H*.86,H*.33,"#100f0e");
    c.strokeStyle="rgba(240,212,176,.3)";c.lineWidth=Math.max(1.5,W*.003);c.beginPath();c.arc(W*.68,H*.86-H*.33*.9,H*.033,Math.PI*1.1,Math.PI*1.9);c.stroke();vignette(c,W,H,.4)},
  map(c,W,H,s){box(c,0,0,W,H,"#e5dfd3");c.fillStyle="#a9bec2";c.beginPath();c.moveTo(0,0);for(let i=0;i<=60;i++){const u=i/60;c.lineTo(W*u,H*(.34+.1*Math.sin(u*5+s)+.04*Math.sin(u*17+s)))}c.lineTo(W,0);c.fill();
    c.strokeStyle="#fbf8f2";c.lineWidth=Math.max(2,W*.006);for(let k=0;k<5;k++){c.beginPath();c.moveTo(0,H*(.5+k*.12));c.bezierCurveTo(W*.3,H*(.45+k*.1+.05*rnd(k+s)),W*.6,H*(.6+k*.08),W,H*(.5+k*.11));c.stroke()}
    c.strokeStyle="rgba(123,30,44,.5)";c.setLineDash([6,6]);c.beginPath();c.arc(W*.52,H*.58,H*.16,0,7);c.stroke();c.setLineDash([]);c.fillStyle="#7B1E2C";c.beginPath();c.arc(W*.52,H*.58,Math.max(5,H*.022),0,7);c.fill()}
};
function paint(cv,t=0){const r=cv.getBoundingClientRect();if(!r.width||!r.height)return false;const d=Math.min(devicePixelRatio||1,1.5);const W=Math.round(r.width*d),H=Math.round(r.height*d);
  if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H}const c=cv.getContext("2d");const s=+(cv.dataset.seed||1);(SCENES[cv.dataset.scene]||SCENES.coast)(c,W,H,s,t,cv);grain(c,W,H);cv.dataset.painted="1";return true}
const sio="IntersectionObserver" in window?new IntersectionObserver(es=>es.forEach(en=>{if(en.isIntersecting&&paint(en.target))sio.unobserve(en.target)}),{rootMargin:"300px 0px"}):null;
function lazyScenes(root){$$("canvas[data-scene]",root).forEach(cv=>{if(sio){sio.unobserve(cv);sio.observe(cv)}else paint(cv)})}
let rT;addEventListener("resize",()=>{clearTimeout(rT);rT=setTimeout(()=>$$(".page:not([hidden]) canvas[data-painted]").forEach(cv=>paint(cv)),200)});

