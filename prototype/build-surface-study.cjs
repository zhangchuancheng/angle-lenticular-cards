const fs=require('fs'),path=require('path'),crypto=require('crypto');const root=__dirname,read=n=>fs.readFileSync(path.join(root,n),'utf8'),hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const keep=['index.html','experiment-frame.html','foil-frame.html','foil-compare.html'];const before=Object.fromEntries(keep.map(n=>[n,hash(read(n))]));
const source=read('foil-frame.html'),start=source.indexOf("if(mode!=='plain'){"),end=source.indexOf('const shade=',start);if(start<0||end<0)throw Error('Missing foil block');
const setup=`
// A separate reflection layer; B's image selector and deformation stay untouched.
const surfaceCanvas=document.createElement('canvas');surfaceCanvas.width=280;surfaceCanvas.height=400;
const surfaceCtx=surfaceCanvas.getContext('2d',{willReadFrequently:true});
const surfacePixels=surfaceCtx.createImageData(280,400),grain=new Float32Array(280*400);
for(let i=0;i<grain.length;i++){const r=Math.sin(i*12.9898+78.233)*43758.5453;grain[i]=r-Math.floor(r);}
function reflectSurface(){
 if(power===0)return;
 surfaceCtx.clearRect(0,0,280,400);surfaceCtx.drawImage(canvas,0,0,280,400);
 const sourcePixels=surfaceCtx.getImageData(0,0,280,400).data,out=surfacePixels.data;
 const tilt=current*8*Math.PI/180;
 // A soft rectangular studio light reflected in a gently curved foil surface.
 // Curvature and microstructure are an artistic approximation, not measured optics.
 const highlightX=.38+Math.sin(tilt)*3.2,highlightY=.29-current*.06;
 const grazing=1+.35*Math.abs(current);
 for(let y=0;y<400;y++)for(let x=0;x<280;x++){
  const i=y*280+x,k=i*4,u=x/279,v=y/399,g=grain[i];
  const nx=(u-.5)*.18+(g-.5)*.012,ny=(v-.5)*.10;
  const dx=(u-highlightX+(v-.5)*.13+nx*.1)/.27,dy=(v-highlightY+ny*.1)/.35;
  const radius=dx*dx+dy*dy;
  const broad=Math.exp(-radius*1.8);
  const softbox=Math.exp(-Math.pow(Math.abs(dx)*1.7,4)-Math.pow(Math.abs(dy)*1.35,4));
  const luminance=(sourcePixels[k]*.2126+sourcePixels[k+1]*.7152+sourcePixels[k+2]*.0722)/255;
  const inkResponse=.32+.68*Math.sqrt(luminance);
  const ridges=.9+.1*Math.sin(x*2.8+nx*18);
  const fresnel=.05+.1*Math.pow(Math.abs(current),2);
  const spectral=power*grazing*broad*(.30+.48*(1-softbox))*inkResponse*ridges;
  const phase=tilt*23+nx*17+ny*8+radius*.85;
  const neutral=power*(softbox*.34+broad*.055)*( .65+.35*inkResponse);
  const sparkle=(g>.982?Math.pow((g-.982)/.018,3):0)*softbox*power*.11;
  for(let c=0;c<3;c++){
   const interference=.5+.5*Math.cos(phase+c*2.094);
   const value=neutral+spectral*interference+sparkle+fresnel*broad*power*.12;
   out[k+c]=Math.round(Math.min(1,value)*255);
  }
  out[k+3]=255;
 }
 surfaceCtx.putImageData(surfacePixels,0,0);
 ctx.save();ctx.globalAlpha=1;ctx.globalCompositeOperation='screen';ctx.imageSmoothingEnabled=true;ctx.drawImage(surfaceCanvas,0,0,W,H);ctx.restore();
}
`;
let variant=source.slice(0,start)+"if(mode!=='plain'){reflectSurface();}\n"+source.slice(end);variant=variant.replace('function draw(){',setup+'\nfunction draw(){');fs.writeFileSync(path.join(root,'surface-frame.html'),variant);
let page=read('foil-compare.html').replace('ANGLE / 镭射对照','ANGLE / 表面反光对照').replace('ANGLE / FOIL','ANGLE / SURFACE').replace('src="foil-frame.html"','src="surface-frame.html"').replace('src="experiment-frame.html"','src="foil-frame.html"');
page=page.replace('<span>B</span>当前彩色扫光','<span>D</span>保留 · 多层镭射膜').replace('保留的单条彩光与柔边高光。','上一版多层彩光，作为对照。').replace('<span>D</span>新镭射实验','<span>E</span>实验 · 表面反射').replace('分层彩光、细微表面纹理与独立高光。','白色柔亮反射、角度变色与细微表面纹理。').replace('B 版当前反光','保留的多层镭射膜').replace('B 版新镭射光','新表面反光实验');
page=page.replace('左侧保留当前效果。','左侧固定为多层镭射膜，右侧模拟表面反射。');
page=page.replace(/<div class="buttons presets">[\s\S]*?<\/div>/,'');
page=page.replace('</header>','<a href="http://127.0.0.1:5186/" target="_blank">保留的镭射对照 ↗</a></header>');
page=page.replace('</style>','header{gap:12px;flex-wrap:wrap}header a{font-size:11px}header b{font-size:17px}.pane p{min-height:42px}</style>');
page=page.replace('先停在正面附近，小幅拖动观察反光，避免把变画和光泽混在一起判断。','先在正面附近小幅拖动，看反光的亮度和颜色如何变化；表面反射是视觉模拟，并非真实材质测量。');
fs.writeFileSync(path.join(root,'surface-compare.html'),page);
for(const n of ['surface-frame.html','surface-compare.html'])new Function(read(n).match(/<script>([\s\S]*?)<\/script>/)[1]);
const imageBlock=s=>s.slice(s.indexOf('function draw(){'),s.indexOf("if(mode!=='plain'){"));if(imageBlock(source)!==imageBlock(variant))throw Error('B transition changed');
for(const n of keep)if(hash(read(n))!==before[n])throw Error('Preserved file changed: '+n);
console.log('New surface study generated. B transition and all previous versions unchanged. Syntax OK.');
