// Who may use InfinitySheets on this device, and on how many devices.
//
// Two separate rules:
//
//   1. One account per device. A student gets one account on a browser, so
//      streaks, predicted grades and the "already answered" pool describe one
//      person. A device that an ADMIN has signed into is exempt entirely —
//      admins test with several accounts on one machine.
//   2. Three devices per account, for every account (free, paid or admin).
//      That one is enforced server-side (public.claim_device), so clearing
//      site data does not buy a fourth device.
//
// Rule 1 lives in localStorage and is a fairness guard, not a security
// control; rule 2 is the one that actually holds.
import { supabase } from './supabase';

const KEY = 'infinitysheets_device_accounts';
const ID_KEY = 'infinitysheets_device_id';

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    const v = raw ? JSON.parse(raw) : null;
    return Array.isArray(v) ? v.filter((x) => x && x.id) : [];
  } catch (_) { return []; }
}

function write(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, 12))); } catch (_) { /* private mode */ }
}

/** A stable id for this browser, created on first use. */
export function deviceId() {
  try {
    let id = localStorage.getItem(ID_KEY);
    if (!id) {
      id = (crypto.randomUUID && crypto.randomUUID()) || `d_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(ID_KEY, id);
    }
    return id;
  } catch (_) {
    return null; // private mode: the server check is skipped, rule 1 still applies
  }
}

/** A human label for the device list ("Chrome on Windows"). */
export function deviceLabel() {
  try {
    const ua = navigator.userAgent || '';
    const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Chrome\//.test(ua) ? 'Chrome'
      : /Safari\//.test(ua) ? 'Safari' : /Firefox\//.test(ua) ? 'Firefox' : 'Browser';
    const os = /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS'
      : /Mac OS X/.test(ua) ? 'Mac' : /Linux/.test(ua) ? 'Linux' : 'this device';
    return `${browser} on ${os}`;
  } catch (_) { return 'This device'; }
}

/** Accounts that have signed in on this device: [{ id, email, admin, at }]. */
export function deviceAccounts() { return read(); }

/** True once any admin has signed in here — the device is then unrestricted. */
export function deviceHasAdmin() { return read().some((x) => x.admin); }

/** The student account this device belongs to, if any. */
export function deviceOwner() { return read().find((x) => !x.admin) || null; }

/**
 * Rule 1 — may this account be used on this device?
 *   { allowed: true }            — free device, the owner, an admin, or an
 *                                  admin has used this device before
 *   { allowed: false, owner }    — a different student account owns it
 */
export function canUseDevice({ id, isAdmin } = {}) {
  if (isAdmin) return { allowed: true };
  if (deviceHasAdmin()) return { allowed: true };   // admin device: no limit
  const owner = deviceOwner();
  if (!owner || owner.id === id) return { allowed: true };
  return { allowed: false, owner };
}

/** Remember a successful sign-in. The first student recorded owns the device. */
export function rememberDeviceAccount({ id, email, isAdmin } = {}) {
  if (!id) return;
  const list = read();
  const i = list.findIndex((x) => x.id === id);
  const entry = { id, email: email || null, at: new Date().toISOString(), admin: !!isAdmin };
  if (i >= 0) list[i] = { ...list[i], ...entry };
  else if (isAdmin) list.push(entry);
  else list.unshift(entry);
  write(list);
}

export function forgetDeviceAccount(id) {
  write(read().filter((x) => x.id !== id));
}

/**
 * Rule 2 — claim one of this account's three device slots.
 * Resolves { ok, devices, limit, list } — { ok: true } when anything is
 * unavailable, so a network hiccup never locks anyone out.
 */
export async function claimDeviceSlot() {
  const id = deviceId();
  if (!id) return { ok: true, skipped: true };
  try {
    const { data, error } = await supabase.rpc('claim_device', { p_device: id, p_label: deviceLabel() });
    if (error) return { ok: true, skipped: true };
    return data || { ok: true };
  } catch (_) {
    return { ok: true, skipped: true };
  }
}

/** Devices this account currently occupies, newest first. */
export async function listDevices() {
  try {
    const { data, error } = await supabase
      .from('account_devices')
      .select('device_id, label, last_seen')
      .order('last_seen', { ascending: false });
    if (error) return [];
    const here = deviceId();
    return (data || []).map((d) => ({ id: d.device_id, label: d.label || 'A device', lastSeen: d.last_seen, current: d.device_id === here }));
  } catch (_) { return []; }
}

/** Free a device slot (used from Settings). */
export async function releaseDevice(id) {
  const { error } = await supabase.rpc('release_device', { p_device: id });
  if (error) throw error;
}

export const DEVICE_LIMIT_MESSAGE = 'This device is already set up for another InfinitySheets account. Sign in with that account, or use your own device, one account per device keeps streaks and predicted grades honest.';
export const ACCOUNT_DEVICE_LIMIT_MESSAGE = 'This account is already signed in on 3 devices, which is the limit. Sign out of one of them (Settings → Devices) and try again.';
