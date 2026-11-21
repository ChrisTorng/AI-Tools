"""Local upload/download UI; upstream files remain unmodified."""
import argparse,re,shutil,subprocess,sys,threading,uuid,zipfile
from pathlib import Path
from fastapi import FastAPI,UploadFile,File,Form,HTTPException
from fastapi.responses import HTMLResponse,FileResponse
import uvicorn

ROOT=Path(__file__).resolve().parent
SOURCE=ROOT/'app'/'source'
STORE=ROOT/'app'/'runs'
STORE.mkdir(parents=True,exist_ok=True)
MODE='dettato'
JOBS={}
LOCK=threading.Lock()
api=FastAPI()
PAGE="""<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><meta charset="utf-8">
<title>APP_TITLE</title><style>body{font:16px system-ui;max-width:740px;margin:20px auto;padding:10px;color-scheme:light dark}
form{display:grid;gap:12px}input,select,button{padding:8px;font:inherit}#status{white-space:pre-wrap;border:1px solid #aaa6;border-radius:8px;padding:12px}
a{display:inline-block;margin:6px}</style>
<h1>APP_TITLE</h1><p>APP_DESC</p>
<form id="form"><label>File: <input name="file" type="file" accept="APP_EXT" required></label>
APP_CONTROLS<button type="submit">Process file</button></form><p>Inputs, results, and logs remain local in app/runs.</p>
<div id="status" role="status">Ready.</div>
<script>
const form=document.querySelector('#form'),status=document.querySelector('#status');
form.addEventListener('submit',async e=>{
e.preventDefault();status.textContent='Uploading…';
try{
 const r=await fetch('/api/jobs',{method:'POST',body:new FormData(form)}),j=await r.json();
 if(!r.ok)throw Error(j.detail||r.statusText);
 const id=j.id;const poll=async()=>{
  const rr=await fetch('/api/jobs/'+id),s=await rr.json();
  status.replaceChildren(document.createTextNode(s.status+(s.error?': '+s.error:'')+'\n'));
  if(s.status==='done'){
   for(const name of s.files){const a=document.createElement('a');a.href='/api/jobs/'+id+'/files/'+name.split('/').map(encodeURIComponent).join('/');a.textContent=name;status.appendChild(a)}
  }else if(s.status==='failed'){const a=document.createElement('a');a.href='/api/jobs/'+id+'/log';a.textContent='View log';status.appendChild(a)}
  else setTimeout(poll,1200);
 };poll();
}catch(err){status.textContent=String(err)}
});
</script>
"""

@api.get('/',response_class=HTMLResponse)
def index():
 if MODE=='dettato':
  return PAGE.replace('APP_TITLE','Dettato — audio to MIDI').replace('APP_DESC','Audio → multi-track MIDI + JSON').replace('APP_EXT','.wav,.mp3,.flac,.ogg,.m4a,.aac,.aiff').replace('APP_CONTROLS','')
 return PAGE.replace('APP_TITLE','Copista — sheet music to MusicXML').replace('APP_DESC','Upload an image/PDF. Default PDF range: first page.').replace('APP_EXT','.png,.jpg,.jpeg,.tif,.tiff,.pdf').replace('APP_CONTROLS','<label>PDF pages (e.g. 1-3): <input name="pages" value="1" pattern="[0-9]+(-[0-9]+)?"></label><label>Detector: <select name="detector"><option value="28m">28M (recommended)</option><option value="2m">2M (fast)</option></select></label>')

@api.post('/api/jobs')
async def create(file:UploadFile=File(...),pages:str=Form('1'),detector:str=Form('28m')):
 filename=Path(file.filename or 'unknown').name
 ext=Path(filename).suffix.lower()
 allowed={'.wav','.mp3','.flac','.ogg','.m4a','.aac','.aiff'} if MODE=='dettato' else {'.png','.jpg','.jpeg','.tif','.tiff','.pdf'}
 if ext not in allowed:raise HTTPException(400,'Unsupported file type')
 if MODE=='copista':
  m=re.fullmatch(r'[1-9]\d*(?:-[1-9]\d*)?',pages)
  lo,_,hi=pages.partition('-')
  if not m or int(hi or lo)<int(lo):raise HTTPException(400,'Invalid PDF range')
  if detector not in {'28m','2m'}:raise HTTPException(400,'Invalid detector')
 jid=uuid.uuid4().hex
 folder=STORE/jid
 folder.mkdir(parents=True)
 src=folder/(jid[:8]+'-'+filename)
 n=0
 try:
  with src.open('wb') as f:
   while data:=await file.read(1024*1024):
    n+=len(data)
    if n>512*1024*1024:raise HTTPException(413,'File exceeds 512 MiB')
    f.write(data)
  if n==0:raise HTTPException(400,'Empty file')
 except Exception:
  shutil.rmtree(folder,ignore_errors=True)
  raise
 JOBS[jid]={'id':jid,'status':'queued','files':[],'error':None}
 threading.Thread(target=process,args=(jid,src,pages,detector),daemon=True).start()
 return {'id':jid}

def device():
 try:
  import torch
  return 'cuda' if torch.cuda.is_available() else 'cpu'
 except Exception:return 'cpu'

def process(jid,src,pages,detector):
 with LOCK:
  job=JOBS[jid];job['status']='running'
  folder=STORE/jid;out=folder/'out';out.mkdir()
  if MODE=='dettato':
   cli=Path(sys.executable).parent/('dettato.exe' if sys.platform=='win32' else 'dettato')
   cmd=[str(cli),str(src),'-o',str(out)]
  else:
   cmd=[sys.executable,'-m','copisteria.pipeline','--out',str(out),'--device',device(),'--detector',detector]
   cmd+=['--pdf',str(src),'--range',pages] if src.suffix.lower()=='.pdf' else [str(src)]
  try:
   with (folder/'process.log').open('w',encoding='utf-8') as log:
    result=subprocess.run(cmd,cwd=SOURCE,stdout=log,stderr=subprocess.STDOUT,check=False)
   if result.returncode:raise RuntimeError('Model exited with code '+str(result.returncode))
   if not any(p.is_file() for p in out.rglob('*')):raise RuntimeError('No outputs generated')
   with zipfile.ZipFile(out/'results.zip','w',compression=zipfile.ZIP_DEFLATED) as z:
    for p in out.rglob('*'):
     if p.is_file() and p.name!='results.zip':z.write(p,p.relative_to(out))
   job['files']=[p.relative_to(out).as_posix() for p in sorted(out.rglob('*')) if p.is_file()]
   job['status']='done'
  except Exception as e:job['error']=str(e);job['status']='failed'

@api.get('/api/jobs/{jid}')
def status(jid:str):
 if jid not in JOBS:raise HTTPException(404,'Job unknown (server restarted?)')
 return JOBS[jid]

@api.get('/api/jobs/{jid}/log')
def log(jid:str):
 if jid not in JOBS:raise HTTPException(404)
 p=STORE/jid/'process.log'
 if not p.is_file():raise HTTPException(404)
 return FileResponse(p,media_type='text/plain')

@api.get('/api/jobs/{jid}/files/{filename:path}')
def download(jid:str,filename:str):
 if jid not in JOBS:raise HTTPException(404)
 base=(STORE/jid/'out').resolve()
 p=(base/filename).resolve()
 if not p.is_relative_to(base) or not p.is_file():raise HTTPException(404)
 return FileResponse(p,media_type='text/html') if p.suffix=='.html' else FileResponse(p,filename=p.name)

if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('--mode',choices=['dettato','copista'],required=True);ap.add_argument('--port',type=int,required=True)
 args=ap.parse_args();MODE=args.mode
 print(f'Running on http://127.0.0.1:{args.port}',flush=True)
 uvicorn.run(api,host='127.0.0.1',port=args.port)
