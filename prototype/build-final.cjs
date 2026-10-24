const fs=require('fs'),path=require('path'),assert=require('assert');
const root=__dirname,read=n=>fs.readFileSync(path.join(root,n),'utf8');
const original=read('iridescent-frame.html');
let page=original.replace(/<\/style><style>[\s\S]*?<\/style>/,'</style>')
 .replace('<title>ANGLE — 光栅实验室</title>','<title>ANGLE — 三张照片，一张镭射卡</title>')
 .replace('光栅实验室 · STUDY 001','三张照片 · 一张镭射卡')
 .replace('滑过光的边界，让色彩与人物一起变换。','上传你的照片，左右拖动卡片，<br>看画面与彩色反光随角度变化。')
 .replace('<button data-mode="bands">分带实验</button>','')
 .replace('＋ 换成我的三张照片','＋ 一次上传三张照片')
 .replace('照片仅在本机处理 · 当前素材取自你提供的商品截图','照片仅在本机处理，不上传服务器 · 按左、中、右顺序排列，居中裁剪')
 .replace('ANGLE / INTERACTIVE LENTICULAR STUDY','ANGLE / THREE VIEWS, ONE CARD')
 .replace('拖拽 · 变画 · 镭射 / 本地效果样片','<a href="http://127.0.0.1:5188/" target="_blank" rel="noopener">查看保留的 E/F 对照 ↗</a>');
page=page.replace('<div class="controls">',`<div class="photo-tray" aria-label="三张照片的顺序">
${['左侧','正面','右侧'].map((name,i)=>`<button class="photo" data-photo="${i}" aria-label="替换${name}照片"><img alt="${name}照片预览"><span>${String(i+1).padStart(2,'0')} ${name} · 替换</span></button>`).join('')}
</div><input id="singleFile" hidden type="file" accept="image/jpeg,image/png,image/webp,image/avif"><div class="controls">`);
page=page.replace('</style>',`
.photo-tray{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:16px}.photo{padding:0;overflow:hidden;border:1px solid #ffffff25;border-radius:10px;background:#1c1d21;color:#bbb;text-align:left}.photo:hover{border-color:#d9fa7b}.photo img{display:block;width:100%;height:86px;object-fit:cover}.photo span{display:block;padding:9px 7px;font-size:11px}.photo:focus-visible,button:focus-visible,.card:focus-visible{outline:2px solid #d9fa7b;outline-offset:4px}.stage{min-height:620px}.foot{line-height:1.7}.status{line-height:1.7}header small{letter-spacing:1px}footer a{text-decoration:none}.modes{margin:18px 0}.controls{margin-top:22px}main{gap:55px}.card{user-select:none}@media(max-width:800px){.stage{min-height:520px}.card{width:300px}main{gap:20px}header small{font-size:10px}h1{font-size:36px}.photo img{height:92px}}@media(max-width:380px){.stage{min-height:460px}.card{width:270px}header small{letter-spacing:0}.actions button{padding:10px}.logo{font-size:20px}}
</style>`);
page=page.replace('id="card" aria-label=','id="card" tabindex="0" aria-label=');
page=page.replace("parent.postMessage({type:'drag',value:target},location.origin);",'');
const uploadStart=page.indexOf("$('#files').onchange=");
const uploadEnd=page.indexOf('\nconst img=new Image();',uploadStart);
page=page.slice(0,uploadStart)+`
let uploadRevision=0,singleIndex=0;
function updatePreviews(){document.querySelectorAll('[data-photo] img').forEach((img,i)=>{img.src=pictures[i].toDataURL('image/jpeg',.8);});}
async function decodePhoto(file,index){
 const url=URL.createObjectURL(file);
 try{const img=new Image();await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=url;});return makeScene(img,index);}
 finally{URL.revokeObjectURL(url);}
}
async function acceptPhotos(files,index=null){
 if((index===null&&files.length!==3)||(index!==null&&files.length!==1)){$('#status').textContent=index===null?'请一次选择三张照片，分别对应左侧、正面和右侧。':'请选择一张照片。';return;}
 const revision=++uploadRevision;$('#status').textContent='正在读取照片…';
 try{
  const scenes=await Promise.all(files.map((file,i)=>decodePhoto(file,index===null?i:index)));
  if(revision!==uploadRevision)return;
  if(index===null)pictures=scenes;else pictures[index]=scenes[0];
  updatePreviews();stopAuto();setTarget(index===null?0:index-1);
  $('#status').textContent=index===null?'三张照片已就位。可点击缩略图单独替换，左右拖动卡片查看。':'照片已替换，已转到对应画面。';
 }catch{if(revision===uploadRevision)$('#status').textContent='图片读取失败，原照片已保留。请使用 JPG、PNG 或 WebP。';}
}
$('#files').onchange=e=>{const files=[...e.target.files];e.target.value='';if(files.length)acceptPhotos(files);};
document.querySelectorAll('[data-photo]').forEach(button=>button.onclick=()=>{singleIndex=+button.dataset.photo;$('#singleFile').click();});
$('#singleFile').onchange=e=>{const files=[...e.target.files];e.target.value='';if(files.length)acceptPhotos(files,singleIndex);};
$('#card').addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();stopAuto();setTarget(target+(e.key==='ArrowRight'?.05:-.05));}});
`+page.slice(uploadEnd);
page=page.replace("pictures=[0,1,2].map(i=>makeScene(img,i,true));wake();","if(!pictures.length){pictures=[0,1,2].map(i=>makeScene(img,i,true));updatePreviews();wake();}");
page=page.slice(0,page.indexOf("window.addEventListener('message'"))+'</script></html>\n';
page=require('./crop-integration.cjs')(page);
const defaultStart=page.indexOf('const img=new Image();img.onload=');
const defaultEnd=page.indexOf("img.src='source.jpg';",defaultStart)+"img.src='source.jpg';".length;
assert(defaultStart>=0&&defaultEnd>defaultStart);
page=page.slice(0,defaultStart)+`
Promise.all(['pokemon-charizard.png','pokemon-pikachu.png','pokemon-umbreon.png'].map(src=>new Promise((resolve,reject)=>{
 const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=src;
}))).then(images=>{
 if(uploadRevision||pictures.length)return;
 originals=images;crops=images.map(()=>freshCrop());pictures=images.map((_,i)=>renderCrop(i));updatePreviews();wake();
}).catch(()=>{if(!pictures.length)$('#status').textContent='示例素材加载失败，请上传三张照片。';});
`+page.slice(defaultEnd);
const rendering=s=>s.slice(s.indexOf('function reflectSurface(){'),s.indexOf('let lastTime=0;'));
assert.equal(rendering(page),rendering(original),'B transition and F reflection must remain identical');
// Remove only the sample's number and bottom captions, after B/F compositing.
const captions="ctx.font='bold 126px sans-serif';const labelMix=smooth(.38,.62,f);ctx.globalAlpha=.8*(1-labelMix);ctx.fillText('0'+(base+1),35,190);ctx.globalAlpha=.8*labelMix;ctx.fillText('0'+(base+2),35,190);ctx.globalAlpha=1;ctx.font='18px monospace';ctx.fillText('LENTICULAR COLLECTION',38,930);ctx.font='12px monospace';ctx.fillText('DRAG TO EXPLORE  /  THREE VIEWS IN ONE',38,959);";
assert(page.includes(captions),'Expected decorative captions must exist');
page=page.replace(captions,'');
assert.equal(rendering(page),rendering(original).replace(captions,''),'Only decorative captions may change');
const topCaption="ctx.fillStyle='#fff';ctx.font='20px monospace';ctx.fillText('ANGLE / CHANGING PERSPECTIVES',38,56);";
assert(page.includes(topCaption),'Expected top caption must exist');
page=page.replace(topCaption,'');
assert.equal(rendering(page),rendering(original).replace(captions,'').replace(topCaption,''),'Only sample captions may change');
new Function(page.match(/<script>([\s\S]*?)<\/script>/)[1]);
fs.writeFileSync(path.join(root,'final.html'),page);
console.log('Standalone page ready: B/F rendering unchanged; inline script parses.');
