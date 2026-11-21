'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=__dirname,base=path.join(root,'app'),source=path.join(base,'source');
const mode=path.basename(root).startsWith('dettato')?'dettato':'copista';
const repo=mode==='dettato'?'https://github.com/kobimusic/dettato.git':'https://github.com/kobimusic/copisteria.git';
const py=path.join(base,'.venv',process.platform==='win32'?'Scripts/python.exe':'bin/python');
function run(command,args,opts={}){console.log('>',command,args.join(' '));const p=cp.spawnSync(command,args,{stdio:'inherit',...opts});if(p.error)throw p.error;if(p.status!==0)throw Error(command+' failed ('+p.status+')')}
function has(command){let p=cp.spawnSync(command,['--version'],{stdio:'ignore'});return !p.error&&p.status===0}
function setup(){
 if(!['linux','win32'].includes(process.platform)||process.arch!=='x64')throw Error('Windows/Linux x64 only');
 if(!has('uv')||!has('git'))throw Error('Requires Pinokio AI bundle with uv and git');
 fs.mkdirSync(base,{recursive:true});
 if(!fs.existsSync(path.join(source,'.git')))run('git',['clone','--depth','1',repo,source]);
 else run('git',['-C',source,'pull','--ff-only']);
 run('uv',['python','install','3.12']);
 if(!fs.existsSync(py))run('uv',['venv','--python','3.12',path.join(base,'.venv')]);
 run('uv',['pip','install','--python',py,'-e',source,'fastapi','uvicorn','python-multipart',...(mode==='copista'?['huggingface_hub']:[])]);
 if(mode==='copista'){
  const dir=path.join(source,'models');
  for(const id of ['copista-28m','copista-2m']){
   const code="from huggingface_hub import snapshot_download; snapshot_download(repo_id="+JSON.stringify('kobimusic/'+id)+",local_dir="+JSON.stringify(dir)+",allow_patterns=['*.pt'])";
   run(py,['-c',code],{cwd:source});
  }
  if(!has('pdftoppm'))console.warn('PDF needs poppler-utils: sudo apt install poppler-utils');
 }else if(!has('ffmpeg'))console.warn('Some audio codecs need ffmpeg');
 run(py,['-c',"import torch;print('PyTorch',torch.__version__,'CUDA',torch.cuda.is_available())"]);
 fs.writeFileSync(path.join(base,'.installed'),new Date().toISOString());
}
function start(){
 if(!fs.existsSync(path.join(base,'.installed')))throw Error('Install first');
 const port=mode==='dettato'?'50881':'50882';
 const child=cp.spawn(py,[path.join(root,'web.py'),'--port',port,'--mode',mode],{cwd:source,env:{...process.env,PYTHONUNBUFFERED:'1'},stdio:'inherit'});
 for(const sig of ['SIGINT','SIGTERM'])process.on(sig,()=>child.kill(sig));
 child.on('error',e=>{console.error(e);process.exitCode=1});child.on('exit',code=>{process.exitCode=code||0});
}
try{const cmd=process.argv[2];if(['install','update'].includes(cmd))setup();else if(cmd==='start')start();else throw Error('Invalid command');}catch(e){console.error(e.stack||e);process.exitCode=1}
