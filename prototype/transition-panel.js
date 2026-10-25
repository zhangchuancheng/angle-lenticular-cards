
const styleDescriptions={
 b:'清晰停留、短角度变画和轻微折射。B 版参数独立保留，可继续调节。',
 fade:'按早期思路重建：整张照片连续渐变叠合。过渡较长，中间会出现重影。',
 sweep:'沿用保留的 A 版：画面按区域逐步显现。中间可能看到左右画面分界。',
 lenses:'沿用 C 版：细密透镜单元交错显露画面。可调密度，中间可能看到条纹。',
 bands:'沿用早期分带实验：水平细条错相变画，中间会出现波浪式交错。'
};
function selectTransitionStyle(value){
 if(!Object.hasOwn(styleDescriptions,value))return;
 transitionStyle=value;
 $('#transitionStyle').value=value;
 $('#styleDescription').textContent=styleDescriptions[value];
 $('#bControls').hidden=value!=='b';$('#lensControls').hidden=value!=='lenses';
 wake();
}
$('#transitionStyle').onchange=e=>selectTransitionStyle(e.target.value);
$('#lensCount').oninput=e=>{lensCount=+e.target.value;$('#lensValue').textContent=lensCount+' 列';wake();};
$('#midpoint').onclick=()=>{stopAuto();setTarget(target<0?-.5:.5);};
