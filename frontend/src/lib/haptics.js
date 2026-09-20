// Vibration feedback on phones (navigator.vibrate — Android Chrome/Firefox;
// iOS Safari has no API, so it is a silent no-op there). Patterns are short
// and distinct so a student can feel right/wrong without looking.
//
// Respects the "Vibration feedback" toggle in Settings (on by default) and
// the OS reduced-motion preference.

const PATTERNS = {
  light: 10,               // a tap / selection
  medium: 20,              // lift, submit
  success: [12, 40, 18],   // correct answer, task done
  error: [45, 60, 45],     // wrong answer
  warning: [30, 40, 30, 40, 30], // time's up
  celebrate: [15, 30, 15, 30, 40], // badge unlocked, sheet finished
};

let enabled = true;
export function setHapticsEnabled(on) { enabled = on !== false; }

export function haptic(kind = 'light') {
  try {
    if (!enabled) return;
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    navigator.vibrate(PATTERNS[kind] || PATTERNS.light);
  } catch (_) { /* never let feedback break the app */ }
}
