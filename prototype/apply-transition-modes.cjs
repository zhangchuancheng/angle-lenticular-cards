const fs=require('fs'),path=require('path'),assert=require('assert');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
module.exports=page=>{
 const before=page;
 const sweep=read('baseline-frame.html').match(/for\(let x=0;x<W;x\+=2\)[^\n]+/)[0];
 const lenses=read('lens-frame.html');
 const lensStart=lenses.indexOf('// Repeated micro-apertures');
 const lensEnd=lenses.indexOf('\n}ctx.globalAlpha=1;',lensStart);
 assert(lensStart>=0&&lensEnd>lensStart);
 const branches=`}else if(transitionStyle==='bands'){
 // Fixed, fine row offsets only select between the two adjacent views.
 // They do not shift the view index, so -28, 0 and +28 degrees remain pure views.
 // The stagger is spatially fine and stationary: no large travelling wave regions.
 for(let y=0;y<H;y+=2){
  const row=y/2,height=Math.min(2,H-y);
  const shift=Math.sin(row*2.399963)*.075+Math.sin(row*.754877)*.025;
  const mix=smooth(.39+shift,.61+shift,f);
  if(mix<=0)continue;
  ctx.globalAlpha=mix;ctx.drawImage(pictures[base+1],0,y,W,height,0,y,W,height);
 }
}else if(transitionStyle==='fade'){
 // Recreate the early whole-image blend; no spatial mask or refraction.
 ctx.globalAlpha=smooth(0,1,f);ctx.drawImage(pictures[base+1],0,0);
}else if(transitionStyle==='sweep'){
 ${sweep}
}else if(transitionStyle==='lenses'){
 ${lenses.slice(lensStart,lensEnd)}
}else{
 const blend=smooth(.5-transitionWidth/2,.5+transitionWidth/2,f)`;
 const originalBranch="}else{\n const blend=smooth(.5-transitionWidth/2,.5+transitionWidth/2,f)";
 assert(page.includes(originalBranch));
 page=page.replace("if(mode==='bands'){","if(transitionStyle==='bands-legacy'){").replace(originalBranch,branches);
 page=page.replace('let transitionWidth=.32;','let transitionWidth=.32;\nlet transitionStyle=\'b\',lensCount=116;');

 // Move the existing angle/range controls beside the card; keep one instance of every input.
 const studyStart=page.indexOf('<div class="transition-study">');
 const studyEnd=page.indexOf('<div class="controls">',studyStart);
 assert(studyStart>=0&&studyEnd>studyStart);
 let study=page.slice(studyStart,studyEnd);
 page=page.slice(0,studyStart)+page.slice(studyEnd);
 study=study.replace('<div class="transition-study">','<div class="transition-study" id="bControls">')
  .replace('<p>变画区间调节 · F 版反光保持一致</p>','')
  .replace('>变画区间</label>','>B 版变画区间</label>')
  .replace('<p class="foot">区间越大，过渡越长，重影停留也越久。</p>','')
  .replace(/<a href="baseline24.html"[\s\S]*?<\/a>/,'');
 const angleStart=page.indexOf('<div class="row"><span>观看角度</span>');
 const angleEnd=page.indexOf('<div class="modes">',angleStart);
 assert(angleStart>=0&&angleEnd>angleStart);
 const angle=page.slice(angleStart,angleEnd).replace('<span>观看角度</span>','<label for="position">观看角度</label>');
 page=page.slice(0,angleStart)+page.slice(angleEnd);
 page=page.replace('<button id="auto">自动演示</button>','');
 const panel=read('transition-panel.html').replace('<!-- B_CONTROLS -->',study).replace('<!-- ANGLE_CONTROLS -->',angle);
 const stageStart=page.indexOf('<section class="stage">'),stageEnd=page.indexOf('</section>',stageStart)+10;
 assert(stageStart>=0&&stageEnd>stageStart);
 page=page.slice(0,stageStart)+'<section class="preview-area">'+page.slice(stageStart,stageEnd)+panel+'</section>'+page.slice(stageEnd);
 page=page.replace('左右拖动光栅卡片，也可使用右侧角度滑块','左右拖动光栅卡片，也可使用观看角度滑块');
 page=page.replace('</style>',read('transition-panel.css')+'</style>');
 page=page.replace('</script>',read('transition-panel.js')+'</script>');
 // No changes to the selected B branch or the complete F reflection pipeline.
 const undo=page.replace("if(transitionStyle==='bands-legacy'){","if(mode==='bands'){").replace(branches,originalBranch);
 const drawing=s=>s.slice(s.indexOf('function reflectSurface(){'),s.indexOf('let lastTime=0;'));
 assert.equal(drawing(undo),drawing(before),'Existing B and F rendering must remain unchanged');
 new Function(page.match(/<script>([\s\S]*?)<\/script>/)[1]);
 return page;
};
