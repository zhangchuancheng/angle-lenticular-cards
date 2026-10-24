const fs=require('fs'),path=require('path'),crypto=require('crypto');const root=__dirname,read=n=>fs.readFileSync(path.join(root,n),'utf8'),hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const keep=['experiment-frame.html','surface-frame.html','surface-compare.html'];const before=Object.fromEntries(keep.map(n=>[n,hash(read(n))]));
const source=read('surface-frame.html');
const oldSpectral='const spectral=power*grazing*broad*(.30+.48*(1-softbox))*inkResponse*ridges;';
if(!source.includes(oldSpectral))throw Error('E baseline mismatch');
let variant=source.replace(oldSpectral,
 '// Stronger chromatic reflection in the existing highlight footprint.\n  // Retain the neutral softbox core; no moving rainbow overlay is introduced.\n  const spectral=power*grazing*broad*(.30+.90*(1-softbox))*inkResponse*ridges;')
 .replace('const phase=tilt*23+nx*17+ny*8+radius*.85;','const phase=tilt*34+nx*22+ny*12+radius*.85;')
 .replace('const interference=.5+.5*Math.cos(phase+c*2.094);','const interference=Math.pow(.5+.5*Math.cos(phase+c*2.094),1.65);');
fs.writeFileSync(path.join(root,'iridescent-frame.html'),variant);
let page=read('surface-compare.html').replace('ANGLE / 表面反光对照','ANGLE / 彩色表面反光对照').replace('ANGLE / SURFACE','ANGLE / IRIDESCENCE')
 .replace('src="surface-frame.html"','src="iridescent-frame.html"').replace('src="foil-frame.html"','src="surface-frame.html"')
 .replace('<span>D</span>保留 · 多层镭射膜','<span>E</span>保留 · 表面反射').replace('上一版多层彩光，作为对照。','保留的白色柔光与克制彩色。')
 .replace('<span>E</span>实验 · 表面反射','<span>F</span>实验 · 彩色反射增强').replace('白色柔亮反射、角度变色与细微表面纹理。','保留白色高光，增强反射边缘的角度变色。')
 .replace('保留的多层镭射膜','保留的 E 版表面反射').replace('新表面反光实验','F 版彩色反射增强')
 .replace('左侧固定为多层镭射膜，右侧模拟表面反射。','左侧保留 E 版，右侧仅增强同一反射区域里的彩色变化。');
page=page.replace('<header>','<header>').replace('</header>','<a href="http://127.0.0.1:5187/" target="_blank">保留的 D/E 对照 ↗</a></header>');
fs.writeFileSync(path.join(root,'iridescent-compare.html'),page);
for(const n of ['iridescent-frame.html','iridescent-compare.html'])new Function(read(n).match(/<script>([\s\S]*?)<\/script>/)[1]);
const draw=s=>s.slice(s.indexOf('function draw(){'),s.indexOf('let lastTime='));if(draw(source)!==draw(variant))throw Error('B transition or card compositing changed');
for(const n of keep)if(hash(read(n))!==before[n])throw Error('Preserved file changed');
console.log('F study generated. B drawing and existing E comparison unchanged. Scripts parse.');
