/**
 * Tiện ích phát âm thanh thông báo cho Chủ sân
 * Hỗ trợ phát file tĩnh /sounds/notification.mp3
 * Kèm fallback Web Audio API (chuông chime ngân 2 nốt) nếu file mp3 bị chặn hoặc chưa sẵn sàng.
 */

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioContext) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        audioContext = new AudioCtx();
      }
    }
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume();
    }
    return audioContext;
  } catch (e) {
    console.warn('Web Audio API not supported:', e);
    return null;
  }
}

/**
 * Phát âm thanh chime 2 nốt bằng Web Audio API
 */
export function playChimeFallback(volume = 0.5) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Nốt 1: 880Hz (A5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(volume * 0.4, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.6);

    // Nốt 2: 1318.51Hz (E6) sau 0.1s
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1318.51, now + 0.12);
    gain2.gain.setValueAtTime(volume * 0.6, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.9);
  } catch (e) {
    console.warn('Cannot play chime fallback:', e);
  }
}

/**
 * Phát âm thanh thông báo:
 * Ưu tiên phát file /sounds/notification.mp3
 * Nếu lỗi hoặc không phát được, fallback sang Web Audio API chime.
 */
export function playNotificationSound() {
  try {
    const audio = new Audio('/sounds/notification.MP3');
    audio.volume = 0.8;
    const playPromise = audio.play();

    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        // Trình duyệt chặn autoplay do người dùng chưa tương tác, hoặc file mp3 không hợp lệ
        console.warn('Audio element play failed, trying Web Audio API chime fallback:', err.message);
        playChimeFallback(0.6);
      });
    }
  } catch (e) {
    console.warn('Audio tag failed, fallback to Web Audio API:', e);
    playChimeFallback(0.6);
  }
}
