let requestSequence = 0;
export class TranslationEngine {
 constructor() {
  this.failed=false; this.pending = new Map(); this.bridge = window.VoiceBridgeAndroid;
  this.listener = ({detail:e}) => {
   const pending = this.pending.get(e.id);
   if (!pending) return;
   if (e.type === 'progress') {
    clearTimeout(pending.timer);
    pending.timer = setTimeout(() => this.timeout(e.id), 300000);
    pending.progress?.({message:e.text, progress:e.progress}); return;
   }
   clearTimeout(pending.timer); this.pending.delete(e.id);
   if (e.type === 'error') {this.failed=true;pending.reject(Error(e.text));}
   else pending.resolve(e.type === 'translated' ? {translation:e.text} : {});
  };
  window.addEventListener('voice-bridge-model', this.listener);
 }
 timeout(id) {
  const pending = this.pending.get(id);
  if (!pending) return;
  this.pending.delete(id);this.failed=true;
  pending.reject(Error('The language pack did not respond. Connect to Wi-Fi, check free storage, then retry.'));
 }
 run(action, data, progress) {
  const id = ++requestSequence;
  return new Promise((resolve, reject) => {
   const timer = setTimeout(() => this.timeout(id), action === 'prepare' ? 300000 : 120000);
   this.pending.set(id, {resolve,reject,progress,timer});
   try {
    if (action === 'prepare') {
     progress?.({message:this.bridge?.browser ? 'Preparing translation models · first download needs Wi-Fi…' : 'Preparing language packs · first download needs Wi-Fi (about 30 MB per language)…'});
     this.bridge.prepare(data.source, data.target, id, data.session);
    } else if (action === 'translate') this.bridge.translate(data.text, data.source, id);
    else throw Error('Unsupported translation action');
   } catch (error) { clearTimeout(timer); this.pending.delete(id); reject(error); }
  });
 }
 close() {
  window.removeEventListener('voice-bridge-model', this.listener); if(this.bridge?.browser)this.bridge.closeTranslation(this.pending.size===0&&!this.failed);else this.bridge?.closeTranslation();
  for (const pending of this.pending.values()) {clearTimeout(pending.timer);pending.reject(Error('Stopped'));}
  this.pending.clear();
 }
}
