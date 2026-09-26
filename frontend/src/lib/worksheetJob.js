// Whether a worksheet is being written in the background, so the app keeps the
// worksheet builder alive while the student looks at other pages.
//   'idle'       nothing running
//   'generating' the AI is writing questions
//   'ready'      finished while the student was elsewhere; opens on return
let status = 'idle';
const listeners = new Set();

export function getWorksheetJob() { return status; }
export function setWorksheetJob(next) {
  if (next === status) return;
  status = next;
  listeners.forEach((fn) => fn(status));
}
export function subscribeWorksheetJob(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
