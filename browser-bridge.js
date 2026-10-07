// Adapt browser services to the same controller used by the Android app.
const emit=(name,detail)=>window.dispatchEvent(new CustomEvent(name,{detail}));
const event=(id,type,extra={})=>emit('voice-bridge',{id,type,...extra});
const modelEvent=(id,type,text='',extra={})=>emit('voice-bridge-model',{id,type,text,...extra});
const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
let worker,source,target,recognition,utterance,attempt=0,activeSession=-1,activeRequest=-1;
function engine(){
 if(!worker){
  const createdWorker=new Worker(new URL('./translator-worker.js',import.meta.url),{type:'module'});worker=createdWorker;
  createdWorker.onmessage=({data})=>{if(worker===createdWorker)modelEvent(data.id,data.type==='result'?(data.translation!==undefined?'translated':'ready'):data.type,data.message||data.translation||'',{progress:data.progress});};
  createdWorker.onerror=()=>{if(worker!==createdWorker)return;modelEvent(activeRequest,'error','The translation engine could not start. Reload Voice Bridge in Chrome.');closeTranslation();};
 }
 return worker;
}
function closeTranslation(){worker?.terminate();worker=null;activeRequest=-1;}
function stopListening(){attempt++;if(recognition){recognition.onend=null;recognition.abort();recognition=null;}}
function stopSpeech(){utterance=null;window.speechSynthesis?.cancel();}
const bridge={
 browser:true,speechAvailable:!!Recognition,
 prepare(from,to,id,session){source=from;target=to;activeSession=session;activeRequest=id;engine().postMessage({id,action:'prepare',source:from,target:to});void navigator.storage?.persist?.().catch(()=>{});},
 translate(text,from,id){activeRequest=id;engine().postMessage({id,action:'translate',text,source:from,target:from===source?target:source});},
 closeTranslation,
 start(language,id){
  stopListening();activeSession=id;
  if(!Recognition){event(id,'error',{message:'Speech is unavailable. Open this app in Chrome or use Type a phrase.'});return;}
  const rec=new Recognition(),token=attempt;recognition=rec;
  rec.lang=language;rec.continuous=false;rec.interimResults=true;
  let words='',failed=false;
  const valid=()=>token===attempt&&id===activeSession;
  rec.onstart=()=>{if(valid())event(id,'ready');};
  rec.onspeechstart=()=>{if(valid())event(id,'speech');};
  rec.onspeechend=()=>{if(valid())event(id,'recognizing');};
  rec.onresult=e=>{if(!valid())return;words=Array.from(e.results,r=>r[0].transcript).join(' ').trim();event(id,'partial',{text:words});};
  rec.onerror=e=>{
   if(!valid())return;if(e.error==='no-speech')return;failed=true;
   event(id,'error',{message:e.error==='not-allowed'||e.error==='service-not-allowed'?'Allow microphone permission in Chrome settings, or type a phrase below.':e.error==='audio-capture'?'No microphone is available. Type a phrase below.':'Speech could not connect. Check your internet connection or type a phrase below.'});
  };
  rec.onend=()=>{if(!valid())return;recognition=null;if(!failed)event(id,words?'result':'empty',words?{text:words}:{});};
  try{rec.start();}catch{event(id,'error',{message:'Could not open the microphone. Check permission or type a phrase below.'});}
 },
 stopListening,finish(){recognition?.stop();},
 cancel(){activeSession=-1;stopListening();stopSpeech();closeTranslation();},
 stopSpeech,
 read(text,language,id){
  stopListening();stopSpeech();
  if(!window.speechSynthesis){event(id,'read-error',{message:'Voice playback is unavailable. Your translation is shown above.'});return;}
  const speech=new SpeechSynthesisUtterance(text);utterance=speech;speech.lang=language;
  const voice=window.speechSynthesis.getVoices().find(v=>v.lang.toLowerCase().startsWith(language.split('-')[0].toLowerCase()));
  if(voice)speech.voice=voice;
  const valid=()=>utterance===speech&&activeSession===id;
  speech.onend=()=>{if(valid()){utterance=null;event(id,'read-end');}};
  speech.onerror=()=>{if(valid()){utterance=null;event(id,'read-error',{message:'Voice playback failed. Install a voice for this language or turn off automatic playback.'});}};
  window.speechSynthesis.speak(speech);
 }
};
window.VoiceBridgeAndroid=bridge;
window.speechSynthesis?.getVoices();
