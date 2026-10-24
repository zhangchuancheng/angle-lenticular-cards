const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=__dirname,original=fs.readFileSync(path.join(root,'index.html'),'utf8');
const hash=crypto.createHash('sha256').update(original).digest('hex');
const frameStyle=`<style>header,.info,footer,.drag-hint{display:none}html,body{background:transparent;overflow:hidden}main{display:block;padding:12px;margin:0;max-width:none}.stage{min-height:0;height:485px;background:none}.card{width:310px;max-width:90vw;border-radius:16px}@media(max-width:400px){.stage{height:390px}.card{width:255px}}</style>`;
const bridge=`
window.addEventListener('message',async e=>{
 if(e.origin!==location.origin||e.source!==parent)return;
 if(e.data.type==='angle'){stopAuto();target=Math.max(-1,Math.min(1,e.data.value));wake();}
 if(e.data.type==='power'){power=e.data.value;wake();}
 if(e.data.type==='images'){try{const loaded=await Promise.all(e.data.images.map(url=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=url;})));pictures=loaded.map((im,i)=>makeScene(im,i));wake();parent.postMessage({type:'loaded'},location.origin);}catch{parent.postMessage({type:'error'},location.origin);}}
});
parent.postMessage({type:'ready'},location.origin);
`;
function frame(source){return source.replace('</style>', '</style>'+frameStyle).replace("$('#position').value=Math.round(target*1000);wake();","$('#position').value=Math.round(target*1000);parent.postMessage({type:'drag',value:target},location.origin);wake();").replace('</script>',bridge+'</script>');}
const oldLoop='for(let x=0;x<W;x+=2){const lens=x/W-.5,offset=lens*.62+Math.sin(x*.68)*.014;ctx.globalAlpha=smooth(.38+offset,.62+offset,f);ctx.drawImage(pictures[base+1],x,0,2,H,x,0,2,H);}';
if(!original.includes(oldLoop))throw Error('Baseline renderer changed');
// Whole-surface angular response avoids a single spatial wipe boundary.
// Stable views occupy 76% of each interval; refraction exists only in the flip.
const newLoop=`const blend=smooth(.38,.62,f),bend=Math.sin(Math.PI*blend);
 ctx.clearRect(0,0,W,H);
 const paint=(image,weight,direction)=>{if(weight<=0)return;ctx.save();ctx.globalAlpha=weight;
  for(let x=0;x<W;x+=4){const u=x/W;const offset=direction*bend*(Math.sin(u*Math.PI*2)*2.8+Math.sin(u*Math.PI*64)*.55);const sx=Math.max(0,Math.min(W-4,x+offset));ctx.drawImage(image,sx,0,4,H,x,0,4,H);}
  ctx.restore();};
 paint(pictures[base],1,1);paint(pictures[base+1],blend,-1);`;
let variant=original.replace(oldLoop,newLoop).replace('const labelMix=smooth(.15,.85,f)','const labelMix=smooth(.38,.62,f)');
fs.writeFileSync(path.join(root,'baseline-frame.html'),frame(original));
fs.writeFileSync(path.join(root,'experiment-frame.html'),frame(variant));
fs.writeFileSync(path.join(root,'comparison-baseline.sha256'),hash+'\n');
console.log('Comparison generated. Original index.html unchanged: '+hash);
