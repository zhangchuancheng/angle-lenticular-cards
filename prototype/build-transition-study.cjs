const fs=require('fs'),path=require('path'),assert=require('assert');
const root=__dirname,read=n=>fs.readFileSync(path.join(root,n),'utf8');
const baseline=read('final.html');
const old='const blend=smooth(.38,.62,f),bend=Math.sin(Math.PI*blend);';
assert(baseline.includes(old));
let page=baseline.replace(old,'const blend=smooth(.5-transitionWidth/2,.5+transitionWidth/2,f),bend=Math.sin(Math.PI*blend);');
page=page.replace('<title>ANGLE — 三张照片，一张镭射卡</title>','<title>ANGLE — 变画区间调节</title>');
page=page.replace('<div class="controls">',`<div class="transition-study"><p>变画区间对照 · 两版使用相同的 F 版反光</p><div class="transition-options"><button data-width=".24" aria-pressed="false">原版 24%</button><button data-width=".32" aria-pressed="true">试验 32%</button></div><p id="transitionNote">当前：32% 变画区间。切换按钮可在相同角度、相同照片下比较。</p><a href="baseline24.html" target="_blank" rel="noopener">打开保留的 24% 完整样片 ↗</a></div><div class="controls">`);
page=page.replace('</style>',`.transition-study{border:1px solid #ffffff25;border-radius:12px;padding:16px;margin-top:20px}.transition-study p{font-size:12px;margin:0 0 12px}.transition-study a{font-size:12px;color:#cbd3b4}.transition-options{display:flex;gap:10px;margin-bottom:12px}.transition-options button{flex:1;border:1px solid #ffffff30;border-radius:8px;background:#25262a;color:#ddd;padding:12px}.transition-options button[aria-pressed=true]{background:#d9fa7b;color:#171914;border-color:#d9fa7b}</style>`);
page=page.replace('<script>','<script>\nlet transitionWidth=.32;\n');
page=page.replace('变画区间对照 · 两版使用相同的 F 版反光','变画区间调节 · F 版反光保持一致');
page=page.replace('<div class="transition-options">',`<div class="row"><label for="transitionRange">变画区间</label><output id="transitionValue" class="value">32%</output></div><input id="transitionRange" type="range" min="8" max="80" step="1" value="32"><div class="labels"><span>8% · 更快换画</span><span>80% · 更长过渡</span></div><p class="foot">区间越大，过渡越长，重影停留也越久。</p><div class="transition-options">`);
page=page.replace('<p id="transitionNote">当前：32% 变画区间。切换按钮可在相同角度、相同照片下比较。</p>','<p id="transitionNote">当前：32% 变画区间。拖动滑块实时比较，也可用快捷按钮恢复原版。</p>');
page=page.replace('</script>',`function setTransitionWidth(value){
 transitionWidth=Math.max(8,Math.min(80,Math.round(value)))/100;
 const percent=Math.round(transitionWidth*100);
 $('#transitionRange').value=percent;$('#transitionValue').textContent=percent+'%';
 document.querySelectorAll('[data-width]').forEach(b=>b.setAttribute('aria-pressed',String(Math.round(+b.dataset.width*100)===percent)));
 $('#transitionNote').textContent='当前：'+percent+'% 变画区间。拖动滑块实时比较，也可用快捷按钮恢复原版。';wake();
}
$('#transitionRange').oninput=e=>setTransitionWidth(+e.target.value);
document.querySelectorAll('[data-width]').forEach(button=>button.onclick=()=>setTransitionWidth(+button.dataset.width*100));\n</script>`);
const rendering=s=>s.slice(s.indexOf('function reflectSurface(){'),s.indexOf('let lastTime=0;'));
assert.equal(rendering(page).replace('const blend=smooth(.5-transitionWidth/2,.5+transitionWidth/2,f),bend=Math.sin(Math.PI*blend);',old),rendering(baseline));
new Function(page.match(/<script>([\s\S]*?)<\/script>/)[1]);
fs.writeFileSync(path.join(root,'baseline24.html'),baseline);
fs.writeFileSync(path.join(root,'transition32.html'),page);
assert.equal(read('final.html'),baseline);
console.log('32% study ready; original page unchanged. Only transition bounds differ in rendering.');
