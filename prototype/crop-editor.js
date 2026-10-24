
// Crop source photos before feeding them to the unchanged B/F renderer.
const freshCrop=()=>({zoom:1,x:0,y:0});
let editingIndex=0,cropBackup=null,cropDrag=null;
const cropDialog=$('#cropDialog'),cropCanvas=$('#cropCanvas');
function cropGeometry(index){
 const image=originals[index],crop=crops[index];
 const scale=Math.max(W/image.width,H/image.height)*crop.zoom;
 const width=image.width*scale,height=image.height*scale;
 return {width,height,extraX:Math.max(0,(width-W)/2),extraY:Math.max(0,(height-H)/2)};
}
function renderCrop(index){
 const image=originals[index],crop=crops[index],g=cropGeometry(index);
 const result=document.createElement('canvas');result.width=W;result.height=H;
 result.getContext('2d').drawImage(image,-g.extraX+crop.x*g.extraX,-g.extraY+crop.y*g.extraY,g.width,g.height);
 return result;
}
function syncCropEditor(){
 const crop=crops[editingIndex],g=cropGeometry(editingIndex);
 $('#cropZoom').value=Math.round(crop.zoom*100);$('#cropZoomValue').textContent=Math.round(crop.zoom*100)+'%';
 $('#cropX').value=Math.round(crop.x*100);$('#cropY').value=Math.round(crop.y*100);
 $('#cropX').disabled=g.extraX<.01;$('#cropY').disabled=g.extraY<.01;
 document.querySelectorAll('[data-edit]').forEach(button=>button.setAttribute('aria-pressed',String(+button.dataset.edit===editingIndex)));
 cropCanvas.getContext('2d').drawImage(pictures[editingIndex],0,0,350,500);
}
function refreshCrop(){pictures[editingIndex]=renderCrop(editingIndex);syncCropEditor();updatePreviews();wake();}
function selectCrop(index){editingIndex=index;cropDrag=null;stopAuto();setTarget(index-1);syncCropEditor();}
function openCrop(index){
 if(!originals[index])return;
 cropBackup=crops.map(c=>({...c}));selectCrop(index);cropDialog.showModal();
}
function finishCrop(cancel=false){
 if(cancel&&cropBackup){crops=cropBackup;pictures=crops.map((_,i)=>renderCrop(i));updatePreviews();wake();}
 cropBackup=null;cropDrag=null;cropDialog.close();
 $('#status').textContent=cancel?'已取消本次裁剪调整。':'构图已更新，左右拖动卡片查看三张照片。';
}
document.querySelectorAll('[data-edit]').forEach(button=>button.onclick=()=>selectCrop(+button.dataset.edit));
$('#cropZoom').oninput=e=>{crops[editingIndex].zoom=+e.target.value/100;refreshCrop();};
$('#cropX').oninput=e=>{crops[editingIndex].x=+e.target.value/100;refreshCrop();};
$('#cropY').oninput=e=>{crops[editingIndex].y=+e.target.value/100;refreshCrop();};
$('#cropReset').onclick=()=>{crops[editingIndex]=freshCrop();refreshCrop();};
$('#cropDone').onclick=()=>finishCrop();$('#cropCancel').onclick=()=>finishCrop(true);
cropDialog.addEventListener('cancel',e=>{e.preventDefault();finishCrop(true);});
$('#cropReplace').onclick=()=>{singleIndex=editingIndex;finishCrop();$('#singleFile').click();};
cropCanvas.addEventListener('pointerdown',e=>{cropDrag={x:e.clientX,y:e.clientY,crop:{...crops[editingIndex]}};cropCanvas.setPointerCapture(e.pointerId);});
cropCanvas.addEventListener('pointermove',e=>{
 if(!cropDrag)return;
 const g=cropGeometry(editingIndex),rect=cropCanvas.getBoundingClientRect(),crop=crops[editingIndex];
 const clamp=v=>Math.max(-1,Math.min(1,v));
 crop.x=g.extraX>.01?clamp(cropDrag.crop.x+(e.clientX-cropDrag.x)*W/rect.width/g.extraX):0;
 crop.y=g.extraY>.01?clamp(cropDrag.crop.y+(e.clientY-cropDrag.y)*H/rect.height/g.extraY):0;
 refreshCrop();
});
for(const event of ['pointerup','pointercancel','lostpointercapture'])cropCanvas.addEventListener(event,()=>cropDrag=null);
