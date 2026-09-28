import React, { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';

/*
 * Slim fixed Start-free bar for phones. Appears once the visitor scrolls
 * past the hero and hides again near the very bottom (where the signup
 * form and footer already have CTAs). Desktop never sees it.
 */
export default function MobileStickyCTA() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const nearBottom = y + window.innerHeight > document.body.scrollHeight - 700;
      setShow(y > window.innerHeight * 0.9 && !nearBottom);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className={`lg:hidden fixed inset-x-0 bottom-0 z-40 transition-transform duration-300 ${show ? 'translate-y-0' : 'translate-y-full'}`}
      aria-hidden={!show}
    >
      <div className="liquid-glass border-t border-[color:var(--color-border)] px-4 py-3 flex items-center justify-between gap-3">
        <span className="text-[13.5px] font-medium text-slate-800 leading-tight">Study smarter, free forever.</span>
        <a href="#signup" className="btn-violet inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-[14px] font-medium shrink-0">
          Start free <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
