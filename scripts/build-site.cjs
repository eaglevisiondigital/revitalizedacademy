const fs=require('node:fs'),path=require('node:path');
const {config,deploymentGuard}=require('./staging/config.cjs');
const root=path.resolve(__dirname,'..');
function build(env=process.env,output=path.join(root,'dist')){
 const c=config(env);deploymentGuard(c,env);
 const files=require('../config/public-files.json');
 // Resolve and validate before touching the output; never publish the repository root.
 if(path.resolve(output)===root)throw Error('Cannot publish repository root');
 fs.rmSync(output,{recursive:true,force:true});fs.mkdirSync(output,{recursive:true});
 for(const file of files){
  if(file.includes('..')||file.startsWith('/')||!/^((assets|css|data|js|member|portal|journey|v)\/.*\.(html|css|js|json|png|jpg|jpeg|webp|svg|ico|woff2?|mp4)|[^/]+\.(html|ico|png|webmanifest|txt|xml)|_redirects|_headers)$/.test(file))throw Error('Unsafe public manifest path: '+file);
  const source=path.join(root,file);if(fs.lstatSync(source).isSymbolicLink())throw Error('Public symlinks are forbidden');
  const target=path.join(output,file);fs.mkdirSync(path.dirname(target),{recursive:true});
  if(file.endsWith('.html')){
   const text=fs.readFileSync(source,'utf8').replace(/<head([^>]*)>/i,'<head$1>\n<script src="/runtime-config.js"></script>\n<script src="/js/environment.js"></script>');
   fs.writeFileSync(target,text);
  }else fs.copyFileSync(source,target);
 }
 fs.writeFileSync(path.join(output,'runtime-config.js'),'window.RVA_PUBLIC_CONFIG = '+JSON.stringify(c)+';\n');
 return {files:files.length+1,environment:c.environment};
}
module.exports={build};
if(require.main===module)console.log(build());
