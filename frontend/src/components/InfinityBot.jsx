import React from 'react';

/**
 * InfinityBot — the InfinitySheets AI mascot. A friendly rounded robot head
 * whose eyes join into the ∞ from the logo, with a little antenna. Drawn in
 * currentColor so it takes the colour of wherever it sits; drop-in for a
 * lucide icon (same `className` sizing, e.g. "w-5 h-5").
 */
export default function InfinityBot({ className = 'w-5 h-5', title }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" role={title ? 'img' : undefined} aria-hidden={title ? undefined : 'true'}>
      {title && <title>{title}</title>}
      {/* antenna */}
      <path d="M12 5.2V3" />
      <circle cx="12" cy="2.4" r="0.9" fill="currentColor" stroke="none" />
      {/* head */}
      <rect x="3.5" y="5.2" width="17" height="13.6" rx="4.6" />
      {/* ears */}
      <path d="M3.5 11v2.6M20.5 11v2.6" strokeWidth="2.6" />
      {/* infinity eyes */}
      <path d="M12 12c-1-1.3-1.9-2-3-2a2 2 0 0 0 0 4c1.1 0 2-.7 3-2Zm0 0c1 1.3 1.9 2 3 2a2 2 0 0 0 0-4c-1.1 0-2 .7-3 2Z" strokeWidth="1.6" />
      {/* smile */}
      <path d="M10 16.2c1.2.7 2.8.7 4 0" strokeWidth="1.5" />
    </svg>
  );
}
