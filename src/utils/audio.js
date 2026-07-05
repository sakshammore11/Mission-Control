export const playStrictAlarm = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    
    // Play a sequence of harsh, disciplinarian beeps
    const playBeep = (freq, startTime, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime + startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(ctx.currentTime + startTime);
      osc.stop(ctx.currentTime + startTime + duration);
    };

    // 3 sharp beeps
    playBeep(880, 0, 0.2);
    playBeep(880, 0.3, 0.2);
    playBeep(880, 0.6, 0.6);
  } catch (e) {
    console.error("Audio not supported or blocked", e);
  }
};
