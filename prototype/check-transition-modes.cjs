const fs=require('fs'),path=require('path'),assert=require('assert'),vm=require('vm');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const preserved=read('baseline-current.html'),updated=read('transition32.html');
const drawCode=html=>html.slice(html.indexOf('function draw(){'),html.indexOf('let lastTime=0;'));
const foilCode=html=>html.slice(html.indexOf('const surfaceCanvas='),html.indexOf('function draw(){'));
assert.equal(foilCode(updated),foilCode(preserved),'F reflection must be byte-identical');
function render(html,style,angle,width=.32,density=116){
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
 const sandbox={W:700,H:1000,current:angle,target:angle,transitionWidth:width,transitionStyle:style,lensCount:density,pictures:images,ctx,mode:'foil',power:.7,
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
for(const style of ['fade','sweep','lenses','bands'])for(const angle of angles)render(updated,style,angle);
for(const density of [40,200])for(const angle of angles)render(updated,'lenses',angle,.32,density);
for(const style of ['fade','sweep','lenses','bands'])assert.notDeepEqual(render(updated,style,.5),render(updated,'b',.5),'Mode must change the image composition');
console.log('Verified 85 B frames against the preserved page; F unchanged; all modes and lens-density bounds render finite, balanced Canvas operations.');
