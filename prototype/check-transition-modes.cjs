const fs=require('fs'),path=require('path'),assert=require('assert'),vm=require('vm');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const preserved=read('baseline-current.html'),updated=read('transition32.html');
const drawCode=html=>html.slice(html.indexOf('function draw(){'),html.indexOf('let lastTime=0;'));
const foilCode=html=>html.slice(html.indexOf('const surfaceCanvas='),html.indexOf('function draw(){'));
assert.equal(foilCode(updated),foilCode(preserved),'F reflection must be byte-identical');
function render(html,style,angle,width=.32,density=116,imageMode='foil'){
 const operations=[],nodes=new Map(),images=[{id:0},{id:1},{id:2}];
 const gradient={addColorStop:(...args)=>operations.push(['colorStop',...args])};
 let alpha=1;const stack=[];
 const ctx=new Proxy({},{
  set(object,key,value){if(key==='globalAlpha'){assert(Number.isFinite(value)&&value>=0&&value<=1);alpha=value;}operations.push(['set',key,typeof value==='object'?'gradient':value]);object[key]=value;return true;},
  get(object,key){
   if(key==='createLinearGradient')return(...args)=>{operations.push([key,...args]);return gradient;};
   if(key==='save')return()=>{stack.push(alpha);operations.push(['save']);};
   if(key==='restore')return()=>{alpha=stack.pop();operations.push(['restore']);};
   return(...args)=>{for(const value of args)if(typeof value==='number')assert(Number.isFinite(value));operations.push([key,...args.map(v=>v&&typeof v==='object'?v.id:v)]);};
  }
 });
 const sandbox={W:700,H:1000,current:angle,target:angle,transitionWidth:width,transitionStyle:style,lensCount:density,pictures:images,ctx,mode:imageMode,power:.7,
  smooth:(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);},
  reflectSurface:()=>operations.push(['F reflection']),
  $:selector=>{if(!nodes.has(selector))nodes.set(selector,{style:{}});return nodes.get(selector);},
  document:{querySelectorAll:()=>images.map(()=>({classList:{toggle(){}}}))}
 };
 vm.createContext(sandbox);vm.runInContext(drawCode(html)+'\ndraw();',sandbox);
 assert.equal(stack.length,0,'Canvas save/restore balance');
 assert.equal(operations.filter(op=>op[0]==='F reflection').length,1,'One F pass per frame');
 return operations;
}
const angles=[-1,-.8,-.66,-.62,-.5,-.38,-.34,-.2,0,.2,.34,.38,.5,.62,.66,.8,1];
for(const width of [.08,.24,.32,.48,.8])for(const angle of angles){
 assert.deepEqual(render(updated,'b',angle,width),render(preserved,'b',angle,width),'B differs at '+angle+' / '+width);
}
for(const style of ['fade','sweep','lenses','bands','bands-legacy'])for(const angle of angles)render(updated,style,angle);
for(const density of [40,200])for(const angle of angles)render(updated,'lenses',angle,.32,density);
for(const style of ['fade','sweep','lenses','bands'])assert.notDeepEqual(render(updated,style,.5),render(updated,'b',.5),'Mode must change the image composition');
for(const angle of angles)assert.deepEqual(render(updated,'bands-legacy',angle),render(preserved,'b',angle,.32,116,'bands'),'Legacy bands must be preserved');

// Replay full-width image draws as per-row source weights. This catches endpoint
// contamination (the reported +28-degree bug), third-view leakage and empty rows.
function bandWeights(operations){
 const rows=Array.from({length:1000},()=>[0,0,0]);let alpha=1;
 for(const op of operations){
  if(op[0]==='set'&&op[1]==='globalAlpha')alpha=op[2];
  if(op[0]==='clearRect')for(const row of rows)row.fill(0);
  if(op[0]!=='drawImage')continue;
  const image=op[1],y=op.length===4?0:op[7],height=op.length===4?1000:op[9];
  for(let line=y;line<y+height;line++)for(let channel=0;channel<3;channel++)rows[line][channel]=rows[line][channel]*(1-alpha)+(channel===image?alpha:0);
 }
 return rows;
}
const oldRight=bandWeights(render(updated,'bands-legacy',1));
assert(oldRight.some(row=>row[1]>.01),'Regression fixture must reproduce the reported leftover image');
for(const [angle,image] of [[-1,0],[-.95,0],[-.8,0],[-.2,1],[-.05,1],[0,1],[.05,1],[.2,1],[.8,2],[.95,2],[1,2]]){
 for(const row of bandWeights(render(updated,'bands',angle)))assert.deepEqual(row,[0,1,2].map(i=>i===image?1:0),'Unclean view at '+angle);
}
for(const start of [-1,0]){
 let previous=new Array(1000).fill(0);
 for(let step=0;step<=40;step++){
  const angle=start+step/40,rows=bandWeights(render(updated,'bands',angle)),next=start+2;
  rows.forEach((weights,row)=>{
   assert(Math.abs(weights.reduce((a,b)=>a+b,0)-1)<1e-12,'Empty or overdrawn row');
   assert.equal(weights[start===-1?2:0],0,'Unrelated third view leaked');
   assert(weights[next]+1e-12>=previous[row],'Row switched backwards while dragging forward');
   previous[row]=weights[next];
  });
 }
}
console.log('Verified B/F unchanged, legacy bands preserved, clean band endpoints/dwell zones, no third-view leakage and monotonic per-row transitions.');
