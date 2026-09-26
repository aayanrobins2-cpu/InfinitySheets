import React, { useLayoutEffect, useRef } from 'react';
import { useInView } from 'framer-motion';

/*
 * Draws attention to a short phrase with a study-notes flourish that
 * animates in the first time it scrolls into view:
 *   variant="highlight" — yellow marker sweep (add `amber` for dark sections)
 *   variant="underline" — hand-drawn underline
 *   variant="circle"    — hand-drawn loop (for tiny phrases like a price)
 * Reduced-motion users see the finished mark with no animation.
 */
// The marks are stretched to fit the phrase (preserveAspectRatio="none") and
// drawn with a non-scaling stroke, so a fixed dash length is wrong: too short
// and a long underline stops part-way; too long and a loop carries on past
// its end. Measure the path's real on-screen length and draw exactly that.
function useExactDash(pathRef, vbW, vbH) {
  useLayoutEffect(() => {
    const path = pathRef.current;
    const svg = path?.ownerSVGElement;
    if (!path || !svg || !path.getTotalLength) return undefined;
    const measure = () => {
      const box = svg.getBoundingClientRect();
      const sx = box.width / vbW; const sy = box.height / vbH;
      const total = path.getTotalLength();
      const steps = 64;
      let len = 0; let prev = path.getPointAtLength(0);
      for (let i = 1; i <= steps; i += 1) {
        const pt = path.getPointAtLength((total * i) / steps);
        len += Math.hypot((pt.x - prev.x) * sx, (pt.y - prev.y) * sy);
        prev = pt;
      }
      const d = Math.ceil(len) + 4;
      path.style.setProperty('--dash', `${d}`);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [pathRef, vbW, vbH]);
}

export default function Emphasis({ children, variant = 'highlight', amber = false, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const uRef = useRef(null);
  const cRef = useRef(null);
  useExactDash(uRef, 100, 8);
  useExactDash(cRef, 100, 100);

  if (variant === 'underline') {
    return (
      <span ref={ref} className={`u-mark ${inView ? 'u-on' : ''} ${className}`}>
        {children}
        <svg className="u-line" viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true">
          <path ref={uRef} d="M1 5.5 Q 26 1.5, 50 4 T 99 3.5" />
        </svg>
      </span>
    );
  }

  if (variant === 'circle') {
    return (
      <span ref={ref} className={`c-mark ${inView ? 'c-on' : ''} ${className}`}>
        {children}
        <svg className="c-ring" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path ref={cRef} d="M74 14 C 94 22, 96 60, 66 80 C 34 100, 4 80, 8 46 C 11 18, 44 6, 78 14 C 90 17, 96 26, 94 34" />
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
