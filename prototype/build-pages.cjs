const fs=require('fs'),path=require('path'),assert=require('assert');
const output=path.join(__dirname,'../docs');fs.mkdirSync(output,{recursive:true});
const routes={5183:'original.html',5184:'compare.html',5185:'lens-compare.html',5186:'foil-compare.html',5187:'surface-compare.html',5188:'iridescent-compare.html',5189:'final.html',5190:'index.html'};
for(const name of fs.readdirSync(__dirname)){
 if(!name.endsWith('.html')&&!['source.jpg','pokemon-charizard.png','pokemon-pikachu.png','pokemon-umbreon.png'].includes(name))continue;
 const destination=name==='index.html'?'original.html':name;
 if(name.endsWith('.html')){
  const html=fs.readFileSync(path.join(__dirname,name),'utf8').replace(/http:\/\/127\.0\.0\.1:(518[3-9]|5190)\//g,(_,port)=>routes[port]);
  fs.writeFileSync(path.join(output,destination),html);
 }else fs.copyFileSync(path.join(__dirname,name),path.join(output,destination));
}
fs.copyFileSync(path.join(output,'transition32.html'),path.join(output,'index.html'));
fs.writeFileSync(path.join(output,'.nojekyll'),'');
for(const name of fs.readdirSync(output).filter(n=>n.endsWith('.html'))){
 const html=fs.readFileSync(path.join(output,name),'utf8');
 assert(!html.includes('127.0.0.1'),'Local URL in '+name);
 for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)){
  if(/^(https?:|data:)/.test(match[1]))continue;
  assert(fs.existsSync(path.join(output,match[1])),name+' references missing '+match[1]);
 }
 for(const script of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new Function(script[1]);
}
console.log('Pages export ready: relative links, image assets and inline scripts checked.');
