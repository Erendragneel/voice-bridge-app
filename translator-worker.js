// Models execute locally. Only public model files download from Hugging Face.
const codes={en:'eng_Latn',ja:'jpn_Jpan',es:'spa_Latn',ru:'rus_Cyrl',ko:'kor_Hang',zh:'zho_Hans',fr:'fra_Latn',pt:'por_Latn',vi:'vie_Latn',de:'deu_Latn'};
const models=new Map();let runtime;
const send=(id,type,data={})=>self.postMessage({id,type,...data});
const select=(source,target)=>source==='en'&&target==='ja'?'Kadonox/fugumt-en-ja-onnx':source==='ja'&&target==='en'?'Kadonox/fugumt-ja-en-onnx':'Xenova/nllb-200-distilled-600M';
async function load(id,model){
 if(!runtime){
  send(id,'progress',{message:'Loading the translation engine…'});
  runtime=await import('./vendor/transformers.min.js');
  runtime.env.allowLocalModels=false;runtime.env.useBrowserCache=true;
  runtime.env.backends.onnx.wasm.numThreads=1;runtime.env.backends.onnx.wasm.proxy=false;
  runtime.env.backends.onnx.wasm.wasmPaths=new URL('./vendor/',import.meta.url).href;
 }
 if(!models.has(model)){
  send(id,'progress',{message:model.includes('nllb')?'Downloading multilingual pack (about 900 MB on first use) · keep Wi-Fi connected…':'Downloading English/Japanese pack (about 150 MB per direction) · keep Wi-Fi connected…'});
  const pipeline=await runtime.pipeline('translation',model,{
   dtype:'q8',device:'wasm',
   progress_callback:p=>{if(p.status==='progress')send(id,'progress',{message:'Downloading '+p.file+'…',progress:Math.round(p.progress)});else if(p.status==='done')send(id,'progress',{message:'Preparing language pack…'});}
  });
  models.set(model,pipeline);
 }
 return models.get(model);
}
function split(text){
 const sentences=typeof Intl.Segmenter==='function'?Array.from(new Intl.Segmenter(undefined,{granularity:'sentence'}).segment(text),s=>s.segment):[text];
 const parts=[];
 for(const sentence of sentences){let rest=sentence.trim();while(rest.length>180){let at=rest.lastIndexOf(' ',180);if(at<60)at=180;parts.push(rest.slice(0,at).trim());rest=rest.slice(at).trim();}if(rest)parts.push(rest);}
 return parts;
}
async function run({id,action,source,target,text}){
 try{
  if(!codes[source]||!codes[target])throw Error('Choose a supported language.');
  if(action==='prepare'){for(const model of new Set([select(source,target),select(target,source)]))await load(id,model);send(id,'result');return;}
  if(action!=='translate'||!text?.trim())throw Error('Type or speak a phrase first.');
  if(source===target){send(id,'result',{translation:text.trim()});return;}
  const model=select(source,target),translator=await load(id,model),parts=split(text),result=[];
  for(let i=0;i<parts.length;i++){
   send(id,'progress',{message:parts.length>1?`Translating phrase ${i+1} of ${parts.length}…`:'Translating on this device…'});
   const options={max_new_tokens:256,num_beams:1};if(model.includes('nllb'))Object.assign(options,{src_lang:codes[source],tgt_lang:codes[target]});
   const output=await translator(parts[i],options),translated=output[0]?.translation_text?.trim();
   if(!translated)throw Error('No translation was returned. Try a shorter phrase.');result.push(translated);
  }
  send(id,'result',{translation:result.join(target==='ja'||target==='zh'?'':' ')});
 }catch(error){send(id,'error',{message:error.message||'Could not load the language pack. Check Wi-Fi and free storage, then retry.'});}
}
let queue=Promise.resolve();self.onmessage=({data})=>{queue=queue.then(()=>run(data));};
