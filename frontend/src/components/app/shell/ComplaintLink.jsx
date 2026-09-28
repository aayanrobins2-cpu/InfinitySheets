import React from 'react';
import { HelpCircle } from 'lucide-react';
import { useApp } from '../../../context/AppContext';

// Small "?" in the top bar: opens the student's mail app with a pre-filled
// message to the team (help, a problem, or a complaint).
const COMPLAINT_EMAIL = 'aayan.robins@gmail.com';

export default function ComplaintLink() {
  const { state } = useApp();
  const user = state.user;
  const subject = encodeURIComponent('InfinitySheets complaint');
  const body = encodeURIComponent(`Hi,

I have a complaint about InfinitySheets:



, ${user?.name || 'A student'}${user?.email ? ` (${user.email})` : ''}`);
  return (
    <a
      href={`mailto:${COMPLAINT_EMAIL}?subject=${subject}&body=${body}`}
      title="Have a complaint? Email us"
      aria-label="Have a complaint? Email us"
      className="w-8 h-8 rounded-full border border-[color:var(--color-border)] text-slate-500 hover:text-slate-900 hover:bg-slate-50 inline-flex items-center justify-center transition-colors"
      data-testid="complaint-button"
    >
      <HelpCircle className="w-4 h-4" />
    </a>
  );
}
