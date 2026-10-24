const fs=require('fs'),path=require('path'),crypto=require('crypto');const root=__dirname,read=n=>fs.readFileSync(path.join(root,n),'utf8');
const old=read('experiment-frame.html'),oldHash=crypto.createHash('sha256').update(old).digest('hex');
const start=old.indexOf("if(mode!=='plain'){"),end=old.indexOf('const shade=',start);if(start<0||end<0)throw Error('Foil boundaries not found');
const newFoil=`if(mode!=='plain'){
 ctx.save();
 // Separate moving spectral ribbons, surface ridges and white specular light.
 // All layers have transparent tails; unaffected areas retain source colors.
 const center=W*(.5+current*.88),spread=foilStyle==='soft'?.36:.23;
 const ribbon=(cx,width,slant,alpha,hueShift)=>{
  const g=ctx.createLinearGradient(cx-W*width,H*(.5-slant),cx+W*width,H*(.5+slant));
  for(let i=0;i<=12;i++){const t=i/12,env=Math.pow(Math.sin(t*Math.PI),2.4),hue=285-t*260+hueShift;g.addColorStop(t,'hsla('+hue+',90%,68%,'+(env*alpha)+')');}
  ctx.fillStyle=g;ctx.globalCompositeOperation='color';ctx.globalAlpha=power*.42;ctx.fillRect(0,0,W,H);
  ctx.globalCompositeOperation='screen';ctx.globalAlpha=power*.55;ctx.fillRect(0,0,W,H);
 };
 ribbon(center,spread,.065,foilStyle==='vivid'?.98:.78,current*24);
 if(foilStyle==='film'){
  ribbon(W*(.64-current*.46),.105,-.035,.34,80-current*32);
  ctx.globalCompositeOperation='screen';
  for(let y=0;y<H;y+=5){const xLight=center-(y-H/2)*.42;const glint=.5+.5*Math.sin(y*.37+current*7);const g=ctx.createLinearGradient(xLight-W*.2,0,xLight+W*.2,0);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.5,'rgba(211,230,255,'+(.065*power*glint)+')');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.globalAlpha=1;ctx.fillRect(0,y,W,1);}
 }
 const gleam=ctx.createLinearGradient(center-W*.14,H*.46,center+W*.14,H*.54);
 gleam.addColorStop(0,'rgba(255,255,255,0)');gleam.addColorStop(.38,'rgba(255,255,255,.02)');gleam.addColorStop(.53,'rgba(255,249,232,.32)');gleam.addColorStop(.68,'rgba(225,244,255,.04)');gleam.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=gleam;ctx.globalCompositeOperation='screen';ctx.globalAlpha=power;ctx.fillRect(0,0,W,H);ctx.restore();
}
`;
let variant=old.slice(0,start)+newFoil+old.slice(end);variant=variant.replace('const smooth=(a,b,v)=>',"let foilStyle='film';\nconst smooth=(a,b,v)=>").replace("if(e.data.type==='power')","if(e.data.type==='foilStyle'){foilStyle=e.data.value;wake();}\n if(e.data.type==='power')");fs.writeFileSync(path.join(root,'foil-frame.html'),variant);
let page=read('compare.html').replace('ANGLE / 变画对照','ANGLE / 镭射对照').replace('ANGLE / A:B','ANGLE / FOIL').replace('同一个角度，两种变画。','同一张卡，两种反光。').replace('拖动任意一张卡，两边同步。彩色扫光、照片和强度一致，只比较变画方式。','两边都使用选定的 B 版变画。同步拖动，只比较镭射光；左侧保留当前效果。').replace('<span>A</span>保留版 · 柔和过渡','<span>B</span>当前彩色扫光').replace('较长的混合区，变化更缓。','保留的单条彩光与柔边高光。').replace('<span>B</span>实验版 · 清晰停留','<span>D</span>新镭射实验').replace('短角度变画，过渡时轻微折射。','分层彩光、细微表面纹理与独立高光。').replace('src="experiment-frame.html"','src="foil-frame.html"').replace('src="baseline-frame.html"','src="experiment-frame.html"').replace('A 保留版光栅卡','B 版当前反光').replace('B 实验版光栅卡','B 版新镭射光').replace('中点仍可能短暂叠影；实验重点是缩短重影区，不用硬切线遮掩。','两侧的变画方式完全一致。先停在正面附近，小幅拖动观察反光，避免把变画和光泽混在一起判断。');
page=page.replace('</header>','<a href="http://127.0.0.1:5184/" target="_blank">保留的 A/B 对照 ↗</a></header>').replace('</style>','.pane p{min-height:40px}.presets{margin-bottom:22px}button.chosen{border-color:#d8f783;color:#d8f783}</style>');
page=page.replace('<div class="top"><label for="power">','<div class="buttons presets"><button class="chosen" data-foil="film">多层镭射膜</button><button data-foil="vivid">鲜明彩色扫光</button><button data-foil="soft">宽幅柔光</button></div><div class="top"><label for="power">');
page=page.replace('let angle=0,playing=false',"let foilStyle='film';let angle=0,playing=false").replace("e.source.postMessage({type:'power',value:power},location.origin)","e.source.postMessage({type:'power',value:power},location.origin);e.source.postMessage({type:'foilStyle',value:foilStyle},location.origin)");
page=page.replace("document.querySelector('#upload').onclick","document.querySelectorAll('[data-foil]').forEach(b=>b.onclick=()=>{foilStyle=b.dataset.foil;document.querySelectorAll('[data-foil]').forEach(x=>x.classList.toggle('chosen',x===b));send({type:'foilStyle',value:foilStyle})});\ndocument.querySelector('#upload').onclick");
fs.writeFileSync(path.join(root,'foil-compare.html'),page);
for(const n of ['foil-frame.html','foil-compare.html'])new Function(read(n).match(/<script>([\s\S]*?)<\/script>/)[1]);
if(crypto.createHash('sha256').update(read('experiment-frame.html')).digest('hex')!==oldHash)throw Error('B changed');
if(old.slice(old.indexOf('function draw()'),start)!==variant.slice(variant.indexOf('function draw()'),variant.indexOf("if(mode!=='plain'){")))throw Error('Transition changed');
console.log('Foil study generated; B file and transition unchanged; scripts parse.');
