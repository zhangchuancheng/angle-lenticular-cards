const http=require('http'),fs=require('fs'),path=require('path');
const allowed=['transition32.html','baseline24.html','pokemon-charizard.png','pokemon-pikachu.png','pokemon-umbreon.png'];
http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 const name=pathname==='/'?'transition32.html':pathname.slice(1);
 if(!allowed.includes(name)){res.writeHead(404);return res.end();}
 fs.readFile(path.join(__dirname,name),(err,data)=>{
  if(err){res.writeHead(404);return res.end();}
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Content-Type',name.endsWith('.png')?'image/png':'text/html; charset=utf-8');res.end(data);
 });
}).listen(5190,'127.0.0.1',()=>console.log('Transition comparison: http://127.0.0.1:5190/'));
