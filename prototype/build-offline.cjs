const fs=require('fs'),path=require('path'),assert=require('assert');
const source=fs.readFileSync(path.join(__dirname,'transition32.html'),'utf8');
let html=source;
for(const name of ['pokemon-charizard.png','pokemon-pikachu.png','pokemon-umbreon.png']){
 const data='data:image/png;base64,'+fs.readFileSync(path.join(__dirname,name)).toString('base64');
 assert(html.includes("'"+name+"'"));html=html.replace("'"+name+"'",JSON.stringify(data));
}
html=html.replace(/<a\b[^>]*>[\s\S]*?<\/a>/g,'');
html=html.replace('<title>ANGLE — 变画区间调节</title>','<title>ANGLE — 离线光栅卡</title>')
 .replace('三张照片 · 一张镭射卡','离线版 · 无需联网')
 .replace('照片仅在本机处理，不上传服务器 · 点击缩略图调整大小和位置','离线运行 · 点击缩略图调整构图 · 刷新后恢复示例照片');
const render=s=>s.slice(s.indexOf('function reflectSurface(){'),s.indexOf('let lastTime=0;'));
assert.equal(render(html),render(source),'Rendering must stay unchanged');
assert(!/https?:\/\/|(?:src|href)="(?!data:|#)/.test(html),'Offline page must not reference network or other files');
assert.equal((html.match(/data:image\/png;base64,/g)||[]).length,3);
new Function(html.match(/<script>([\s\S]*?)<\/script>/)[1]);
const out=path.join(__dirname,'../离线版');fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'ANGLE-离线光栅卡.html'),html);
console.log('Offline single HTML ready: '+Buffer.byteLength(html)+' bytes; 3 embedded images; rendering unchanged.');
