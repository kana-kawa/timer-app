// Web Audio API でビープ音を生成する（音声ファイル不要）

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  return ctx;
}

/**
 * ブラウザの自動再生制限を解除する。ユーザー操作のイベント内で呼ぶ必要がある。
 */
export function unlockAudio() {
  const c = getContext();
  if (c && c.state === "suspended") void c.resume();
}

/** 「ピピピッ」と3回鳴らす。volume は 0〜100 */
export function playBeep(volume: number) {
  const c = getContext();
  if (!c || volume <= 0) return;
  if (c.state === "suspended") void c.resume();

  const gainValue = Math.min(1, Math.max(0, volume / 100)) * 0.4;
  const start = c.currentTime + 0.02;
  for (let i = 0; i < 3; i++) {
    const t = start + i * 0.22;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(gainValue, t + 0.01);
    gain.gain.setValueAtTime(gainValue, t + 0.12);
    gain.gain.linearRampToValueAtTime(0, t + 0.15);
    osc.connect(gain).connect(c.destination);
    osc.start(t);
    osc.stop(t + 0.16);
  }
}
