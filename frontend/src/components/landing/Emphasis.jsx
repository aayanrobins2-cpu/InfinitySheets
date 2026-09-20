import React, { useRef } from 'react';
import { useInView } from 'framer-motion';

/*
 * Draws attention to a short phrase with a study-notes flourish that
 * animates in the first time it scrolls into view:
 *   variant="highlight" — yellow marker sweep (add `amber` for dark sections)
 *   variant="underline" — hand-drawn underline
 *   variant="circle"    — hand-drawn loop (for tiny phrases like a price)
 * Reduced-motion users see the finished mark with no animation.
 */
export default function Emphasis({ children, variant = 'highlight', amber = false, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });

  if (variant === 'underline') {
    return (
      <span ref={ref} className={`u-mark ${inView ? 'u-on' : ''} ${className}`}>
        {children}
        <svg className="u-line" viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true">
          <path d="M1 5.5 Q 26 1.5, 50 4 T 99 3.5" />
        </svg>
      </span>
    );
  }

  if (variant === 'circle') {
    return (
      <span ref={ref} className={`c-mark ${inView ? 'c-on' : ''} ${className}`}>
        {children}
        <svg className="c-ring" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d="M74 14 C 94 22, 96 60, 66 80 C 34 100, 4 80, 8 46 C 11 18, 44 6, 78 14 C 90 17, 96 26, 94 34" />
        </svg>
      </span>
    );
  }

  return (
    <span ref={ref} className={`hl-mark ${amber ? 'hl-amber' : ''} ${inView ? 'hl-on' : ''} ${className}`}>
      {children}
    </span>
  );
}
