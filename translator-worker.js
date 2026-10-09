// Models execute locally. Only public model files download from Hugging Face.
const codes={en:'eng_Latn',ja:'jpn_Jpan',es:'spa_Latn',ru:'rus_Cyrl',ko:'kor_Hang',zh:'zho_Hans',fr:'fra_Latn',pt:'por_Latn',vi:'vie_Latn',de:'deu_Latn'};
const models=new Map(),translations=new Map();let runtime;
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
  send(id,'progress',{message:model.includes('whisper')?'Downloading Auto speech pack · keep Wi-Fi connected…':model.includes('nllb')?'Downloading multilingual pack (about 900 MB on first use) · keep Wi-Fi connected…':'Downloading English/Japanese pack (about 150 MB per direction) · keep Wi-Fi connected…'});
  const options={dtype:'q8',device:'wasm',progress_callback:p=>{if(p.status==='progress')send(id,'progress',{message:'Downloading '+p.file+'…',progress:Math.round(p.progress)});else if(p.status==='done')send(id,'progress',{message:'Preparing language pack…'});}};
  const pipeline=await runtime.pipeline(model.includes('whisper')?'automatic-speech-recognition':'translation',model,options);
  models.set(model,pipeline);
 }
 return models.get(model);
}
function split(text){
 const sentences=typeof Intl.Segmenter==='function'?Array.from(new Intl.Segmenter(undefined,{granularity:'sentence'}).segment(text),s=>s.segment):[text];
 const parts=[];
 for(const sentence of sentences){let rest=sentence.trim();while(rest.length>180){let at=rest.lastIndexOf(' ',180);if(at<60)at=180;parts.push(rest.slice(0,at).trim());rest=rest.slice(at).trim();}if(rest)parts.push(rest);}
 const grouped=[];for(const part of parts){const last=grouped.length-1;if(last>=0&&grouped[last].length+part.length+1<=180)grouped[last]+=' '+part;else grouped.push(part);}return grouped;
}
function invalidTranslation(output,input){
 if(!output)return true;
 const repeated=/([\p{L}\p{N}]+)(?:[\s.,!?]+\1){5,}/iu;
 const loop=/(\S{2,12})\1{5,}/u;
 return (repeated.test(output)&&!repeated.test(input))||(loop.test(output)&&!loop.test(input));
}
async function run({id,action,source,target,text,audio,auto}){
 try{
  if(action==='detect'){
   const r=await load(id,'Xenova/whisper-base');send(id,'progress',{message:'Detecting English or Japanese…'});
   const features=await r.processor(audio);
   let language=source;
   if(!language){const detected=await r.model.generate({inputs:features.input_features,decoder_input_ids:[r.model.generation_config.decoder_start_token_id],max_new_tokens:1,suppress_tokens:[],begin_suppress_tokens:[],forced_decoder_ids:null});
   language=r.tokenizer.decode(detected[0].tolist(),{skip_special_tokens:false}).match(/<\|([a-z]{2})\|>/)?.[1];}
   if(!['en','ja'].includes(language)){send(id,'recognized',{original:'',language});return;}
   const out=await r.model.generate({inputs:features.input_features,language:language==='ja'?'japanese':'english',task:'transcribe',return_timestamps:false,max_new_tokens:160});
   let original=r.tokenizer.decode(out[0].tolist(),{skip_special_tokens:true}).trim();if(/^\s*[[(].*[\])]\s*$/.test(original)||invalidTranslation(original,''))original='';send(id,'recognized',{original,language});return;
  }
  if(!codes[source]||!codes[target])throw Error('Choose a supported language.');
  if(action==='prepare'){for(const model of new Set([select(source,target),select(target,source)]))await load(id,model);if(auto)await load(id,'Xenova/whisper-base');send(id,'result');return;}
  if(action!=='translate'||!text?.trim())throw Error('Type or speak a phrase first.');
  if(source===target){send(id,'result',{translation:text.trim()});return;}
  const key=JSON.stringify([source,target,text.trim()]);if(translations.has(key)){send(id,'result',{translation:translations.get(key)});return;}
  const model=select(source,target),parts=split(text),result=[];
  for(let i=0;i<parts.length;i++){
   send(id,'progress',{message:parts.length>1?`Translating phrase ${i+1} of ${parts.length}…`:'Translating on this device…'});
   const options={max_new_tokens:256,num_beams:1};if(model.includes('nllb'))Object.assign(options,{src_lang:codes[source],tgt_lang:codes[target]});
   let translator=await load(id,model),output=await translator(parts[i],options),translated=output[0]?.translation_text?.trim();
   if(invalidTranslation(translated,parts[i])){
    send(id,'progress',{message:'Retrying an unreliable translation…'});
    await translator.dispose?.();models.delete(model);translator=await load(id,model);
    output=await translator(parts[i],{...options,num_beams:3,no_repeat_ngram_size:3,repetition_penalty:1.1});translated=output[0]?.translation_text?.trim();
   }
   if(invalidTranslation(translated,parts[i]))throw Error('The translation model returned unreliable repeated text. Nothing was read aloud. Please retry or type a clearer phrase.');
   result.push(translated);
  }
  const translation=result.join(target==='ja'||target==='zh'?'':' ');if(translations.size>=128)translations.delete(translations.keys().next().value);translations.set(key,translation);send(id,'result',{translation});
 }catch(error){send(id,'error',{message:error.message||'Could not load the language pack. Check Wi-Fi and free storage, then retry.'});}
}
let queue=Promise.resolve();self.onmessage=({data})=>{queue=queue.then(()=>run(data));};
