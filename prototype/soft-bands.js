
// A stationary two-dimensional phase field avoids coherent full-width scanlines.
// Only the blend mask is filtered; source photos keep their original resolution.
function createSoftBandPhases(width,height){
 const raw=new Float32Array(width*height),horizontal=new Float32Array(raw.length),phases=new Float32Array(raw.length);
 let seed=0x936ef;
 for(let i=0;i<raw.length;i++){
  seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;
  raw[i]=(seed>>>0)/4294967295*2-1;
 }
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=y*width+x;
  horizontal[i]=(raw[y*width+Math.max(0,x-1)]+2*raw[i]+raw[y*width+Math.min(width-1,x+1)])/4;
 }
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=y*width+x;
  phases[i]=(horizontal[Math.max(0,y-1)*width+x]+2*horizontal[i]+horizontal[Math.min(height-1,y+1)*width+x])*.05/4;
 }
 return phases;
}
function softBandResponse(progress,phase){return smooth(.35+phase,.65+phase,progress);}
let softBandCache=null;
function paintSoftBands(image,progress){
 if(progress<=.30)return;
 if(progress>=.70){ctx.drawImage(image,0,0);return;}
 if(!softBandCache){
  const width=175,height=250,mask=document.createElement('canvas'),layer=document.createElement('canvas');
  mask.width=width;mask.height=height;layer.width=W;layer.height=H;
  const maskCtx=mask.getContext('2d'),layerCtx=layer.getContext('2d');
  softBandCache={mask,layer,maskCtx,layerCtx,pixels:maskCtx.createImageData(width,height),phases:createSoftBandPhases(width,height)};
 }
 const {mask,layer,maskCtx,layerCtx,pixels,phases}=softBandCache;
 for(let i=0;i<phases.length;i++)pixels.data[i*4+3]=Math.round(softBandResponse(progress,phases[i])*255);
 maskCtx.putImageData(pixels,0,0);
 layerCtx.globalCompositeOperation='source-over';layerCtx.clearRect(0,0,W,H);
 layerCtx.drawImage(image,0,0);
 layerCtx.globalCompositeOperation='destination-in';layerCtx.imageSmoothingEnabled=true;layerCtx.imageSmoothingQuality='high';
 layerCtx.drawImage(mask,0,0,W,H);
 layerCtx.globalCompositeOperation='source-over';ctx.drawImage(layer,0,0);
}
