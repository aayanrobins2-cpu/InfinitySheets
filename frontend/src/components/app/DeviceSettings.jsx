import React, { useCallback, useEffect, useState } from 'react';
import { Laptop, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { listDevices, releaseDevice } from '../../lib/deviceAccounts';

// The three devices an account may be signed in on. Signing out of one here
// frees the slot for a new phone or laptop; the device you are on cannot be
// removed from itself (sign out instead).
export default function DeviceList() {
  const [devices, setDevices] = useState(null);
  const [busy, setBusy] = useState(null);

  const load = useCallback(() => { listDevices().then(setDevices).catch(() => setDevices([])); }, []);
  useEffect(load, [load]);

  const remove = async (d) => {
    setBusy(d.id);
    try {
      await releaseDevice(d.id);
      toast.success(`${d.label} signed out`);
      load();
    } catch (e) {
      toast.error(e?.message || 'Could not remove that device');
    } finally { setBusy(null); }
  };

  if (devices === null) return <div className="text-[13px] text-slate-500 inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading your devices…</div>;

  return (
    <div data-testid="device-list">
      <div className="text-[12.5px] text-slate-500 mb-3">{devices.length} of 3 devices in use. Every account can be signed in on three devices; remove one to free a slot.</div>
      <div className="flex flex-col gap-2">
        {devices.length === 0 && <div className="text-[13px] text-slate-500">No devices recorded yet.</div>}
        {devices.map((d) => (
          <div key={d.id} className="flex items-center gap-3 rounded-xl border border-[color:var(--color-border)] px-3.5 py-2.5 bg-white">
            <span className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0"><Laptop className="w-4 h-4" /></span>
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-medium text-slate-900 truncate">
                {d.label}{d.current && <span className="ml-2 align-middle px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-semibold">This device</span>}
              </div>
              <div className="text-[11.5px] text-slate-500">Last used {new Date(d.lastSeen).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</div>
            </div>
            {!d.current && (
              <button type="button" onClick={() => remove(d)} disabled={busy === d.id} className="w-8 h-8 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center disabled:opacity-50" aria-label={`Sign out ${d.label}`} data-testid={`device-remove-${d.id}`}>
                {busy === d.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
