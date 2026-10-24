const fs=require('fs'),path=require('path');
module.exports=page=>{
 page=page.replace('let uploadRevision=0,singleIndex=0;','let uploadRevision=0,singleIndex=0;let originals=[],crops=[];');
 page=page.replace('return makeScene(img,index);','return img;');
 page=page.replace('if(index===null)pictures=scenes;else pictures[index]=scenes[0];',`if(index===null){originals=scenes;crops=scenes.map(()=>freshCrop());pictures=scenes.map((_,i)=>renderCrop(i));}else{originals[index]=scenes[0];crops[index]=freshCrop();pictures[index]=renderCrop(index);}`);
 page=page.replace("$('#status').textContent=index===null?'三张照片已就位。可点击缩略图单独替换，左右拖动卡片查看。':'照片已替换，已转到对应画面。';", "$('#status').textContent='照片已载入。可分别调整三张照片的大小和位置。';openCrop(index===null?0:index);");
 page=page.replace("singleIndex=+button.dataset.photo;$('#singleFile').click();","openCrop(+button.dataset.photo);");
 page=page.replace('pictures=[0,1,2].map(i=>makeScene(img,i,true));updatePreviews();','pictures=[0,1,2].map(i=>makeScene(img,i,true));originals=pictures.slice();crops=pictures.map(()=>freshCrop());updatePreviews();');
 page=page.replaceAll('· 替换</span>','· 调整</span>').replaceAll('aria-label="替换','aria-label="调整').replace('按左、中、右顺序排列，居中裁剪','点击缩略图调整大小和位置');
 page=page.replace('</style>',fs.readFileSync(path.join(__dirname,'crop-editor.css'),'utf8')+'</style>');
 page=page.replace('<script>',fs.readFileSync(path.join(__dirname,'crop-editor.html'),'utf8')+'<script>');
 page=page.replace('</script>',fs.readFileSync(path.join(__dirname,'crop-editor.js'),'utf8')+'</script>');
 return page;
};
