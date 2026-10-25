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
  paintSoftBands:(image,progress)=>operations.push(['soft band mask',image.id,progress]),
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
for(const style of ['fade','sweep','lenses','bands','bands-soft','bands-legacy'])for(const angle of angles)render(updated,style,angle);
for(const density of [40,200])for(const angle of angles)render(updated,'lenses',angle,.32,density);
for(const style of ['fade','sweep','lenses','bands','bands-soft'])assert.notDeepEqual(render(updated,style,.5),render(updated,'b',.5),'Mode must change the image composition');
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
// Check the actual micro-mask response, including its two-dimensional spatial
// coherence. Large full-width row changes are the reported scanline regression.
const softSource=read('soft-bands.js');assert(updated.includes(softSource),'Micro-mask source must be embedded');
const offscreens=[],composites=[];
const soft=vm.runInNewContext(softSource+'\n({createSoftBandPhases,softBandResponse,paintSoftBands})',{
 W:700,H:1000,Float32Array,
 smooth:(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);},
 ctx:{drawImage:(...args)=>composites.push(args)},
 document:{createElement(){
  const surface={width:0,height:0,calls:[]};
  const context={createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),
   putImageData(pixels){surface.pixels=pixels;},clearRect(){surface.calls.length=0;},
   drawImage(image,...args){surface.calls.push({image,args,operation:this.globalCompositeOperation});}};
  surface.getContext=()=>context;offscreens.push(surface);return surface;
 }}
});
const maskWidth=175,maskHeight=250,phases=soft.createSoftBandPhases(maskWidth,maskHeight);
assert.deepEqual(phases,soft.createSoftBandPhases(maskWidth,maskHeight),'Reversing the drag must reuse a stationary pattern');
const means=[];
for(let y=0;y<maskHeight;y++){
 let sum=0,min=1,max=0;
 for(let x=0;x<maskWidth;x++){
  const weight=soft.softBandResponse(.5,phases[y*maskWidth+x]);sum+=weight;min=Math.min(min,weight);max=Math.max(max,weight);
 }
 assert(max-min>.03,'Mask must break up coherent full-width rows');means.push(sum/maskWidth);
}
assert(Math.max(...means)-Math.min(...means)<.05,'Full-width band contrast must stay below five percent');
for(const phase of phases){
 assert(Number.isFinite(phase)&&Math.abs(phase)<=.05);
 for(const progress of [0,.05,.2,.3])assert.equal(soft.softBandResponse(progress,phase),0);
 for(const progress of [.7,.8,.95,1])assert.equal(soft.softBandResponse(progress,phase),1);
 let previous=0;
 for(let step=0;step<=40;step++){
  const weight=soft.softBandResponse(step/40,phase);
  assert(weight>=previous&&weight<=1,'Micro-mask must change monotonically and stay bounded');previous=weight;
 }
}
const testPhoto={id:'source-photo'};
soft.paintSoftBands(testPhoto,.2);assert.equal(composites.length,0);
soft.paintSoftBands(testPhoto,.8);assert.equal(composites.pop()[0],testPhoto);
soft.paintSoftBands(testPhoto,.5);
assert.equal(offscreens.length,2);const [mask,layer]=offscreens;
assert.equal(layer.calls[0].image,testPhoto);assert.equal(layer.calls[0].operation,'source-over');
assert.equal(layer.calls[1].image,mask);assert.equal(layer.calls[1].operation,'destination-in');
assert.equal(composites.pop()[0],layer);assert.equal(layer.width,700);assert.equal(layer.height,1000);
const midpointPixels=mask.pixels.data.slice();
soft.paintSoftBands({id:'replacement-photo'},.6);soft.paintSoftBands(testPhoto,.5);
assert.deepEqual(mask.pixels.data,midpointPixels,'Returning to an angle must restore the same mask');
assert.equal(offscreens.length,2,'Mask/layer allocation must be reused while dragging');
for(const angle of angles){
 const op=render(updated,'bands-soft',angle).find(op=>op[0]==='soft band mask'),base=Math.min(1,Math.floor(angle+1));
 assert.equal(op[1],base+1);assert.equal(op[2],angle+1-base);
}
console.log('Verified B/F and legacy bands, clean dwell zones, monotonic adjacent-view transitions, and a stationary micro-mask with low full-width band contrast.');
