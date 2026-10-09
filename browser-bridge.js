// Adapt browser services to the same controller used by the Android app.
const emit=(name,detail)=>window.dispatchEvent(new CustomEvent(name,{detail}));
const event=(id,type,extra={})=>emit('voice-bridge',{id,type,...extra});
const modelEvent=(id,type,text='',extra={})=>emit('voice-bridge-model',{id,type,text,...extra});
const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
let audioContext,japaneseMode='fast',japaneseFallback=false,speechTimer,emptyJapanese=0;
let capture,autoMode=false,detectSequence=0,detectPending=null;
let worker,source,target,recognition,utterance,attempt=0,activeSession=-1,activeRequest=-1;
function engine(){
 if(!worker){
  const createdWorker=new Worker(new URL('./translator-worker.js',import.meta.url),{type:'module'});worker=createdWorker;
  createdWorker.onmessage=({data})=>{if(worker!==createdWorker)return;if(detectPending&&data.id===detectPending.request){const p=detectPending;if(p.token!==attempt||p.session!==activeSession)return;if(data.type==='recognized'){clearTimeout(p.timer);detectPending=null;event(p.session,data.original?'result':'empty',{text:data.original,language:data.language});}else if(data.type==='error'){clearTimeout(p.timer);detectPending=null;event(p.session,'error',{message:data.message});}else if(data.type==='progress')event(p.session,'recognizing',{message:data.message});return;}if(worker===createdWorker)modelEvent(data.id,data.type==='result'?(data.translation!==undefined?'translated':'ready'):data.type,data.message||data.translation||'',{progress:data.progress});};
  createdWorker.onerror=()=>{if(worker!==createdWorker)return;if(detectPending)event(detectPending.session,'error',{message:'Auto recognition could not start. Try a manual speaker.'});modelEvent(activeRequest,'error','The translation engine could not start. Reload Voice Bridge in Chrome.');closeTranslation();};
 }
 return worker;
}
function closeTranslation(keepWarm=false){if(audioContext){void audioContext.close().catch(()=>{});audioContext=null;}if(!keepWarm){worker?.terminate();worker=null;}activeRequest=-1;}
function stopListening(){attempt++;clearTimeout(speechTimer);clearTimeout(detectPending?.timer);detectPending=null;if(capture){capture.node.port.postMessage({enabled:false});capture.stream.getTracks().forEach(t=>t.stop());capture.node.disconnect();capture.input.disconnect();capture=null;}if(recognition){recognition.onend=null;recognition.abort();recognition=null;}}
function stopSpeech(){utterance=null;window.speechSynthesis?.cancel();}
const bridge={
 get japaneseLocal(){return japaneseMode==='local'||japaneseFallback||!Recognition;},setJapaneseMode(value){japaneseMode=value==='local'?'local':'fast';japaneseFallback=false;emptyJapanese=0;},browser:true,speechAvailable:!!Recognition,autoAvailable:!!navigator.mediaDevices?.getUserMedia&&!!window.AudioWorkletNode,setAuto(value){autoMode=value;if(bridge.autoAvailable){try{audioContext||=new (window.AudioContext||window.webkitAudioContext)();void audioContext.resume().catch(()=>{});}catch{}}},
 prepare(from,to,id,session){source=from;target=to;activeSession=session;activeRequest=id;engine().postMessage({id,action:'prepare',source:from,target:to,auto:autoMode});void navigator.storage?.persist?.().catch(()=>{});},
 translate(text,from,id){activeRequest=id;engine().postMessage({id,action:'translate',text,source:from,target:from===source?target:source});},
 closeTranslation,
 start(language,id){
  stopListening();activeSession=id;
  if(language==='auto'||(language==='ja-JP'&&bridge.japaneseLocal)){void startAuto(id,attempt,language==='ja-JP'?'ja':undefined);return;}
  if(!Recognition){event(id,'error',{message:'Speech is unavailable. Open this app in Chrome or use Type a phrase.'});return;}
  const rec=new Recognition(),token=attempt;recognition=rec;
  rec.lang=language;rec.continuous=false;rec.interimResults=true;
  let words='',failed=false;
  const valid=()=>token===attempt&&id===activeSession;
  const fallback=(reason='recognition did not respond')=>{if(!valid()||language!=='ja-JP'||!bridge.autoAvailable)return false;japaneseFallback=true;stopListening();event(id,'notice',{message:'Faster Japanese failed ('+reason+'). On-device speech is taking over; repeat your phrase when Listening appears.',fallback:true});void startAuto(id,attempt,'ja');return true;};
  speechTimer=setTimeout(()=>{if(!fallback()&&valid())event(id,'error',{message:'Speech did not open. Check microphone permission or type your phrase.'});},12000);
  rec.onstart=()=>{if(valid()){clearTimeout(speechTimer);event(id,'ready');}};
  rec.onspeechstart=()=>{if(valid())event(id,'speech');};
  rec.onspeechend=()=>{if(valid()){event(id,'recognizing');if(language==='ja-JP')speechTimer=setTimeout(()=>fallback(),5000);}};
  rec.onresult=e=>{if(!valid())return;words=Array.from(e.results,r=>r[0].transcript).join(' ').trim();event(id,'partial',{text:words});if(words&&Array.from(e.results).every(r=>r.isFinal===true)){stopListening();emptyJapanese=0;event(id,'result',{text:words});}};
  rec.onerror=e=>{
   if(!valid())return;if(e.error==='no-speech')return;if(language==='ja-JP'&&!['not-allowed','audio-capture','aborted'].includes(e.error)&&fallback(e.error))return;failed=true;clearTimeout(speechTimer);
   event(id,'error',{message:e.error==='not-allowed'||e.error==='service-not-allowed'?'Allow microphone permission in Chrome settings, or type a phrase below.':e.error==='audio-capture'?'No microphone is available. Type a phrase below.':'Speech could not connect. Check your internet connection or type a phrase below.'});
  };
  rec.onend=()=>{if(!valid())return;clearTimeout(speechTimer);if(words)emptyJapanese=0;recognition=null;if(!failed)event(id,words?'result':'empty',words?{text:words}:{});};
  try{rec.start();}catch(error){if(fallback(error.name||'startup error'))return;clearTimeout(speechTimer);event(id,'error',{message:'Could not open the microphone. Check permission or type a phrase below.'});}
 },
 stopListening,finish(){if(capture)capture.node.port.postMessage({finish:true});else recognition?.stop();},
 cancel(){japaneseFallback=false;emptyJapanese=0;activeSession=-1;stopListening();stopSpeech();closeTranslation(true);},
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

async function startAuto(id,token,language){
 let stream,context;const valid=()=>token===attempt&&id===activeSession;
 try{
  stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
  if(!valid()){stream.getTracks().forEach(t=>t.stop());return;}
  context=audioContext||=new (window.AudioContext||window.webkitAudioContext)();
  if(!context.captureLoaded){await context.audioWorklet.addModule(new URL('./conversation-capture.js',import.meta.url));context.captureLoaded=true;}await context.resume();
  if(!valid()){stream.getTracks().forEach(t=>t.stop());if(context!==audioContext)await context.close();return;}
  const input=context.createMediaStreamSource(stream),node=new AudioWorkletNode(context,'conversation-capture');
  capture={stream,context,input,node};input.connect(node);node.connect(context.destination);
  node.port.onmessage=({data})=>{
   if(!valid())return;
   if(data.type==='level')event(id,'rms',{level:data.level*10});
   else if(data.type==='speech')event(id,'speech');
   else if(data.type==='no-speech')event(id,'empty');
   else if(data.type==='turn'){
    const audio=new Float32Array(Math.round(data.audio.length*16000/data.rate));
    for(let i=0;i<audio.length;i++){const at=i*data.rate/16000,left=Math.floor(at),f=at-left;audio[i]=data.audio[left]*(1-f)+(data.audio[Math.min(left+1,data.audio.length-1)]||0)*f;}
    stopListening();const request=--detectSequence;detectPending={request,session:id,token:attempt,timer:setTimeout(()=>{if(detectPending?.request===request)event(id,'error',{message:'Auto recognition timed out. Try a shorter phrase or a manual speaker.'});},300000)};
    event(id,'recognizing');engine().postMessage({id:request,action:'detect',source:language,audio},[audio.buffer]);
   }
  };
  node.port.postMessage({enabled:true});event(id,'ready');
 }catch(error){stream?.getTracks().forEach(t=>t.stop());if(context&&context!==audioContext)void context.close();if(valid())event(id,'error',{message:error.name==='NotAllowedError'?'Allow microphone permission to use Auto, or type a phrase below.':'Auto could not open the microphone. Try a manual speaker or type a phrase.'});}
}
