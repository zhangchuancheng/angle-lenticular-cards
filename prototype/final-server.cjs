const http=require('http'),fs=require('fs'),path=require('path');
http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 const name=pathname==='/'?'final.html':pathname.slice(1);
 if(!['final.html','source.jpg','pokemon-charizard.png','pokemon-pikachu.png','pokemon-umbreon.png'].includes(name)){res.writeHead(404);return res.end();}
 fs.readFile(path.join(__dirname,name),(err,data)=>{
  if(err){res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',name.endsWith('.png')?'image/png':name.endsWith('.jpg')?'image/jpeg':'text/html; charset=utf-8');
  res.end(data);
 });
}).listen(5189,'127.0.0.1',()=>console.log('ANGLE sample: http://127.0.0.1:5189/'));
