
const styleDescriptions={
 b:'清晰停留、短角度变画和轻微折射。B 版参数独立保留，可继续调节。',
 fade:'按早期思路重建：整张照片连续渐变叠合。过渡较长，中间会出现重影。',
 sweep:'沿用保留的 A 版：画面按区域逐步显现。中间可能看到左右画面分界。',
 lenses:'沿用 C 版：细密透镜单元交错显露画面。可调密度，中间可能看到条纹。',
 bands:'细条错开过渡，去掉大块波浪拼接；左端、正面和右端保持单张。中间仍可能有细纹或重影。',
 'bands-legacy':'保留的旧分带：水平细条按大幅波浪错相，端点也可能残留其他画面，仅供对照。'
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
