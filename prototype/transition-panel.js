
const styleDescriptions={
 b:'清晰停留、短角度变画和轻微折射。变画区间可独立调节。',
 fade:'整张照片平滑叠合，过渡较长，中间会出现重影。',
 'bands-soft':'细小区域柔和交错，保留完整单张停留区；照片不做模糊，中间可能有重影。',
 bands:'水平细条错开过渡，左端、正面和右端保持单张；中间可见横纹或重影。',
 lenses:'细密透镜单元交错显露画面，可调透镜密度；中间可能看到条纹。',
 sweep:'画面分区逐步显现，中间可能看到左右画面分界。'
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
