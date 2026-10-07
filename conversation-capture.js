// Detect a turn after a pause. No audio leaves the device.
class ConversationCapture extends AudioWorkletProcessor {
  constructor() {
    super(); this.enabled = false; this.noise = 0.0005; this.meterSamples = 0; this.reset();
    this.port.onmessage = ({ data }) => {
      if (data.finish && this.enabled) { this.finish(); return; }
      this.enabled = !!data.enabled; this.reset();
    };
  }
  reset() { this.frames = []; this.preroll = []; this.count = 0; this.voiced = 0; this.quiet = 0; this.talking = false; }
  finish() {
    if (this.voiced >= sampleRate * 0.25) {
      this.enabled = false;
      const audio = new Float32Array(this.count); let offset = 0;
      for (const frame of this.frames) { audio.set(frame, offset); offset += frame.length; }
      this.port.postMessage({ type: 'turn', audio, rate: sampleRate }, [audio.buffer]);
    } else this.port.postMessage({ type: 'no-speech' });
    this.reset();
  }
  process(inputs) {
    const input = inputs[0]?.[0]; if (!this.enabled || !input) return true;
    let power = 0; for (const value of input) power += value * value;
    const rms = Math.sqrt(power / input.length);
    // Phone noise suppression can make a soft voice much quieter than the
    // original fixed gate. Adapt to quiet-room noise and retain word starts.
    const threshold = Math.max(0.002, Math.min(0.006, this.noise * 3));
    const speech = rms > (this.talking ? threshold * 0.65 : threshold);
    if (!speech && !this.talking) this.noise = this.noise * 0.98 + rms * 0.02;
    this.meterSamples += input.length;
    if (this.meterSamples >= sampleRate * 0.15) {
      this.port.postMessage({ type: 'level', level: Math.min(1, rms * 25) }); this.meterSamples = 0;
    }
    const frame = new Float32Array(input);
    if (!this.talking) {
      this.preroll.push(frame);
      if (this.preroll.length * frame.length > sampleRate * 0.4) this.preroll.shift();
      if (!speech) return true;
      this.talking = true; this.frames = this.preroll; this.preroll = [];
      this.count = this.frames.reduce((sum, part) => sum + part.length, 0);
      this.port.postMessage({ type: 'speech' });
    } else { this.frames.push(frame); this.count += frame.length; }
    if (speech) { this.voiced += frame.length; this.quiet = 0; } else this.quiet += frame.length;
    if (this.quiet >= sampleRate * 0.45 || this.count >= sampleRate * 12) this.finish();
    return true;
  }
}
registerProcessor('conversation-capture', ConversationCapture);
