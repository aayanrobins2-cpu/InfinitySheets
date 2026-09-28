// AI credits: free accounts get a daily allowance, enforced by the ai-chat
// function (it is the source of truth). Every AI reply carries the latest
// balance, which lands here so the top-bar counter updates straight away.
let credits = null; // { plan, used, limit, left, resetsAt } | null (unknown)
const listeners = new Set();

export function getCredits() { return credits; }
export function setCredits(next) {
  if (!next) return;
  credits = next;
  listeners.forEach((fn) => fn(credits));
}
export function subscribeCredits(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
