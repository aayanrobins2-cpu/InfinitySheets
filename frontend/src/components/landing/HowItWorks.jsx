import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HOW_IT_WORKS } from '../../data/mock';
import { ArrowDown } from 'lucide-react';
import Reveal from './Reveal';
import { DoodleLaptop, DoodleStationery } from '../decor/StudyDoodles';
import Emphasis from './Emphasis';
import StepDemo from './StepDemo';

// The demo panel auto-advances through the steps like flashcards;
// hovering/focusing a step pins it, and cycling resumes on leave.
const CYCLE_MS = 3500;

export default function HowItWorks() {
  const [auto, setAuto] = useState(0);
  const [pinned, setPinned] = useState(null);
  const reduced = React.useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );
  const active = pinned ?? auto;

  useEffect(() => {
    if (reduced || pinned !== null) return;
    const t = setInterval(() => setAuto((a) => (a + 1) % HOW_IT_WORKS.length), CYCLE_MS);
    return () => clearInterval(t);
  }, [reduced, pinned]);

  // When a pin is released, keep cycling from the pinned step.
  const release = (i) => { setAuto(i); setPinned(null); };
  return (
    <section id="how" className="section-bg">
      <div className="max-w-[1280px] mx-auto px-6 py-20 lg:py-28">
        <Reveal>
          <div className="relative text-center max-w-[860px] mx-auto">
            <h2 className="h-display text-[46px] sm:text-[60px] lg:text-[70px] leading-[1.05]">From your first worksheet to mastery.</h2>
            <p className="mt-6 text-[17px] sm:text-[18px] text-slate-500 leading-relaxed max-w-[680px] mx-auto">
              A simple loop that adapts to you, every step targets your{' '}
              <Emphasis variant="underline" className="font-medium text-slate-700">weak concepts</Emphasis>, so practice gets sharper over time.
            </p>
            <div className="hidden lg:block absolute -left-48 top-8"><DoodleLaptop /></div>
            <div className="hidden lg:block absolute -right-44 top-16"><DoodleStationery /></div>
          </div>
        </Reveal>
        <div className="mt-16 grid lg:grid-cols-[1fr_1.05fr] gap-10 lg:gap-14 items-start max-w-[1100px] mx-auto w-full">
          {/* Steps on the left */}
          <div className="flex flex-col">
            {HOW_IT_WORKS.map((s, i) => (
              <React.Fragment key={s.n}>
                <Reveal delay={i * 0.05}>
                  <button
                    type="button"
                    onMouseEnter={() => setPinned(i)}
                    onMouseLeave={() => release(i)}
                    onFocus={() => setPinned(i)}
                    onBlur={() => release(i)}
                    onClick={() => setPinned(i)}
                    className={`w-full text-left liquid-glass rounded-2xl px-6 py-5 flex items-start gap-5 transition-all ${active === i ? 'ring-2 ring-blue-400/60' : 'opacity-80 hover:opacity-100'}`}
                  >
                    <div className={`shrink-0 text-[34px] font-semibold tracking-tight leading-none tabular-nums select-none ${active === i ? 'text-blue-500' : 'text-blue-300'}`}>{s.n}</div>
                    <div className="min-w-0 pt-0.5">
                      <div className="text-[17px] font-semibold text-slate-900">{s.title}</div>
                      <p className="text-[14px] text-slate-600 mt-1 leading-relaxed">{s.text}</p>
                    </div>
                  </button>
                </Reveal>
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="flex justify-center py-1.5 text-blue-400">
                    <ArrowDown className="w-5 h-5" strokeWidth={2.4} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
          {/* Live demo of the active step on the right */}
          <Reveal delay={0.15}>
            <div className="lg:sticky lg:top-24">
              <div className="relative liquid-glass rounded-3xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[12px] tracking-wider uppercase font-semibold text-slate-500">
                    Step {HOW_IT_WORKS[active].n} &middot; {HOW_IT_WORKS[active].title}
                  </span>
                  <span className="flex gap-1.5">
                    {HOW_IT_WORKS.map((_, i) => (
                      <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === active ? 'bg-blue-500' : 'bg-slate-300'}`} />
                    ))}
                  </span>
                </div>
                <div style={{ perspective: 900 }}>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={active}
                      initial={reduced ? false : { rotateX: -70, opacity: 0 }}
                      animate={{ rotateX: 0, opacity: 1 }}
                      exit={reduced ? undefined : { rotateX: 55, opacity: 0 }}
                      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                      style={{ transformOrigin: 'center bottom' }}
                    >
                      <StepDemo step={active} />
                    </motion.div>
                  </AnimatePresence>
                </div>
                <p className="hover-hint text-[12px] text-slate-400 mt-2 text-center">Hover a step to pause on it.</p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
