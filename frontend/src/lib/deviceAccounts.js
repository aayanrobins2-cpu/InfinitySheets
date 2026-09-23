// One account per device.
//
// A student gets one InfinitySheets account on a device: streaks, predicted
// grades and spaced repetition all describe one person, and a second account
// on the same browser is either someone dodging a finished question bank or
// two people sharing a history. Admins are exempt — they need to sign into
// test accounts to check what students see.
//
// This is a fairness guard, not a security control: it lives in localStorage,
// so clearing site data or using another browser resets it. It exists to stop
// casual duplicate accounts, and it never blocks the account that already
// owns the device.

const KEY = 'infinitysheets_device_accounts';

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    const v = raw ? JSON.parse(raw) : null;
    return Array.isArray(v) ? v.filter((x) => x && x.id) : [];
  } catch (_) { return []; }
}

function write(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, 8))); } catch (_) { /* private mode */ }
}

/** Accounts that have signed in on this device: [{ id, email, at }]. */
export function deviceAccounts() { return read(); }

/** The account this device belongs to, if any. */
export function deviceOwner() { return read()[0] || null; }

/**
 * May this account be used on this device?
 *   { allowed: true }                     — free device, or it is the owner
 *   { allowed: false, owner }             — a different account already owns it
 * Admins are always allowed.
 */
export function canUseDevice({ id, email, isAdmin } = {}) {
  if (isAdmin) return { allowed: true };
  const owner = deviceOwner();
  if (!owner || owner.id === id) return { allowed: true };
  return { allowed: false, owner };
}

/** Remember a successful sign-in. The first one recorded owns the device. */
export function rememberDeviceAccount({ id, email, isAdmin } = {}) {
  if (!id) return;
  const list = read();
  const i = list.findIndex((x) => x.id === id);
  const entry = { id, email: email || null, at: new Date().toISOString(), admin: !!isAdmin };
  // An admin signing in never takes ownership of the device, so their test
  // logins do not lock a student out of their own browser.
  if (i >= 0) list[i] = { ...list[i], ...entry };
  else if (isAdmin) list.push(entry);
  else list.unshift(entry);
  write(list);
}

/** Only used when an account is deleted from this device. */
export function forgetDeviceAccount(id) {
  write(read().filter((x) => x.id !== id));
}

export const DEVICE_LIMIT_MESSAGE = 'This device is already set up for another InfinitySheets account. Sign in with that account, or use your own device — one account per device keeps streaks and predicted grades honest.';
