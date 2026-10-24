const fs=require('fs'),path=require('path'),crypto=require('crypto');const root=__dirname;
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const protectedFiles=['index.html','compare.html','baseline-frame.html','experiment-frame.html'];
const hashes=Object.fromEntries(protectedFiles.map(n=>[n,crypto.createHash('sha256').update(read(n)).digest('hex')]));
const oldLoop='for(let x=0;x<W;x+=2){const lens=x/W-.5,offset=lens*.62+Math.sin(x*.68)*.014;ctx.globalAlpha=smooth(.38+offset,.62+offset,f);ctx.drawImage(pictures[base+1],x,0,2,H,x,0,2,H);}';
let frame=read('baseline-frame.html');if(!frame.includes(oldLoop))throw Error('Expected preserved A renderer');
const microLoop=`// Repeated micro-apertures reveal the next view inside every lenticule.
 // No full-card spatial ramp, random mask, or alpha crossfade between faces.
 const progress=smooth(.08,.92,f),pitch=W/lensCount;
 ctx.globalAlpha=1;
 if(progress>=1){ctx.drawImage(pictures[base+1],0,0);}
 else if(progress>0){
  for(let i=0;i<lensCount;i++){
   const x=i*pitch,aperture=pitch*progress;
   // A small periodic phase difference prevents all micro-edges advancing in lockstep.
   // It vanishes at both endpoints, so each extreme is exactly one source image.
   const phase=Math.sin(i*2.399963)*.12*Math.sin(Math.PI*progress);
   const start=x+(pitch-aperture)*Math.max(0,Math.min(1,.5+phase));
   ctx.save();ctx.beginPath();ctx.rect(start,0,aperture,H);ctx.clip();
   ctx.drawImage(pictures[base+1],0,0);ctx.restore();
  }
 }`;
frame=frame.replace(oldLoop,microLoop).replace('const smooth=(a,b,v)=>','let lensCount=116;\nconst smooth=(a,b,v)=>').replace("if(e.data.type==='power')", "if(e.data.type==='lenses'){lensCount=Math.max(40,Math.min(200,Math.round(e.data.value)));wake();}\n if(e.data.type==='power')");
fs.writeFileSync(path.join(root,'lens-frame.html'),frame);
let page=read('compare.html').replace('ANGLE / 变画对照','ANGLE / 细密透镜对照').replace('ANGLE / A:B','ANGLE / A:C').replace('B实验版','C实验版').replace('<span>B</span>实验版 · 清晰停留','<span>C</span>实验版 · 细密透镜').replace('短角度变画，过渡时轻微折射。','细小单元同时变画，不集中成一条切线。').replace('B 实验版光栅卡','C 细密透镜光栅卡').replace('experiment-frame.html','lens-frame.html').replaceAll('B 版','C 版');
page=page.replace('打开保留的原版 ↗','保留的原版 ↗').replace('</header>','<a href="http://127.0.0.1:5184/" target="_blank">保留的 A/B 对照 ↗</a></header>');
page=page.replace('只比较变画方式。','只比较变画方式。这次的 C 版延长了细条交错过程。');
page=page.replace('0% 19%,#b397df 19% 31%,#8aa25d 31% 69%,#b397df 69% 81%,#8aa25d 81%','0% 4%,#b397df 4% 46%,#8aa25d 46% 54%,#b397df 54% 96%,#8aa25d 96%');
page=page.replace("f>.38&&f<.62?'C 版：短角度变画中'","f>.08&&f<.92?'C 版：透镜单元交错变画中'");
page=page.replace('中点仍可能短暂叠影；实验重点是缩短重影区，不用硬切线遮掩。','C 版用细条交错显露两张图。中点可能看见纹理或视觉混合；调整透镜密度比较观感。');
page=page.replace('<div class="buttons"><button id="upload">','<div class="top"><label for="lenses">C 版透镜密度</label><output id="lensValue">116 列</output></div><input id="lenses" type="range" min="40" max="200" step="1" value="116"><div class="labels"><span>粗 · 纹理清楚</span><span>细 · 更容易视觉混合</span></div><div class="buttons"><button id="upload">');
page=page.replace('let angle=0,playing=false','let lensCount=116;let angle=0,playing=false');
page=page.replace("e.source.postMessage({type:'power',value:power},location.origin)","e.source.postMessage({type:'power',value:power},location.origin);e.source.postMessage({type:'lenses',value:lensCount},location.origin)");
page=page.replace("document.querySelector('#upload').onclick", "document.querySelector('#lenses').oninput=e=>{lensCount=+e.target.value;document.querySelector('#lensValue').textContent=lensCount+' 列';send({type:'lenses',value:lensCount})};\ndocument.querySelector('#upload').onclick");
page=page.replace('</style>','.pane p{min-height:40px}</style>');
fs.writeFileSync(path.join(root,'lens-compare.html'),page);
for(const [name,hash] of Object.entries(hashes)){if(hash!==crypto.createHash('sha256').update(read(name)).digest('hex'))throw Error(name+' was modified');}
for(const name of ['lens-compare.html','lens-frame.html'])new Function(read(name).match(/<script>([\s\S]*?)<\/script>/)[1]);
console.log('C study generated; original and A/B files unchanged; scripts parse.');
