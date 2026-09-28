import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Reveal from './Reveal';
import { SUBJECT_PROGRESS, subjectStats } from '../../data/landingProgress';
import { DoodleAtom } from '../decor/StudyDoodles';
import Emphasis from './Emphasis';

/*
 * Interactive predicted-grade chart. Hovering a data point shows a
 * per-attempt tooltip (topic + score + date); hovering a line shows that
 * subject's summary next to it; clicking a line jumps to the subject
 * breakdown section at the bottom of the page.
 */
function Chart() {
  const w = 640, h = 320, pad = 38;
  const [hover, setHover] = useState(null); // {si, ai} for point, {si} for line
  const goSubjects = () => { document.getElementById('subjects')?.scrollIntoView({ behavior: 'smooth' }); };

  const n = SUBJECT_PROGRESS[0].attempts.length;
  const stepX = (w - pad * 2) / (n - 1);
  const y = (v) => h - pad - ((v - 30) / 70) * (h - pad * 2);
  const x = (i) => pad + i * stepX;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" role="img" aria-label="Worksheet scores improving over ten weeks across Physics, Mathematics, and Chemistry">
        {[45, 60, 75, 90].map((g) => (
          <g key={g}>
            <line x1={pad} x2={w - pad} y1={y(g)} y2={y(g)} stroke="#e2e8f0" strokeDasharray="4 5" />
            <text x={w - pad + 6} y={y(g) + 4} fontSize="11" fill="#94a3b8">{g}%</text>
          </g>
        ))}
        {SUBJECT_PROGRESS.map((s, si) => {
          const path = s.attempts.map((a, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(a.score)}`).join(' ');
          const lineHover = hover && hover.si === si;
          return (
            <g key={s.id}>
              {/* fat invisible hit area for the line */}
              <path
                d={path} fill="none" stroke="transparent" strokeWidth="16" style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHover({ si })} onMouseLeave={() => setHover(null)} onClick={goSubjects}
              />
              <motion.path
                d={path} fill="none" stroke={s.color} strokeWidth={lineHover ? 4.5 : 3}
                strokeLinecap="round" style={{ pointerEvents: 'none' }}
                initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }}
                transition={{ duration: 1.4, delay: si * 0.25, ease: 'easeInOut' }}
              />
              {s.attempts.map((a, ai) => (
                <circle
                  key={ai} cx={x(ai)} cy={y(a.score)} r={hover && hover.si === si && hover.ai === ai ? 7 : 4.5}
                  fill={s.color} stroke="#fff" strokeWidth="2" style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHover({ si, ai })} onMouseLeave={() => setHover(null)} onClick={goSubjects}
                />
              ))}
            </g>
          );
        })}
      </svg>

      {/* Point tooltip: topic + score + date */}
      {hover && hover.ai !== undefined && (() => {
        const s = SUBJECT_PROGRESS[hover.si];
        const a = s.attempts[hover.ai];
        const left = (x(hover.ai) / w) * 100;
        const top = (y(a.score) / h) * 100;
        return (
          <div
            className="absolute z-10 liquid-glass rounded-xl px-3.5 py-2.5 pointer-events-none -translate-x-1/2"
            style={{ left: `${Math.min(84, Math.max(16, left))}%`, top: `${top}%`, transform: 'translate(-50%, -120%)' }}
          >
            <div className="text-[12.5px] font-semibold" style={{ color: s.color }}>{s.subject} &middot; {a.topic}</div>
            <div className="text-[12px] text-slate-700"><span className="font-semibold">{a.score}%</span> &middot; {a.date}</div>
          </div>
        );
      })()}

      {/* Line summary: shown while hovering a line (not a point) */}
      {hover && hover.ai === undefined && (() => {
        const s = SUBJECT_PROGRESS[hover.si];
        const st = subjectStats(s);
        return (
          <div className="absolute top-2 left-2 z-10 liquid-glass rounded-xl px-4 py-3 pointer-events-none">
            <div className="text-[13px] font-semibold" style={{ color: s.color }}>{s.subject}</div>
            <div className="text-[12px] text-slate-700 mt-0.5">
              +{st.improvement}% in 10 weeks &middot; avg {st.avg}% &middot; predicted {s.predictedFrom} &rarr; {s.predictedTo}
            </div>
            <div className="text-[11px] text-blue-600 mt-1 font-medium">Click for the full breakdown &darr;</div>
          </div>
        );
      })()}
    </div>
  );
}

export default function PredictedGrade() {
  return (
    <section className="section-light overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-6 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
          <Reveal>
            <div className="relative">
              <div className="hidden xl:block absolute -left-8 -top-24"><DoodleAtom /></div>
              <h2 className="h-display text-[44px] sm:text-[56px] lg:text-[64px] leading-[1.05]">
                Know your grade <span className="font-serif-italic">before</span> the exam does.
              </h2>
              <p className="mt-6 text-[16.5px] text-slate-600 leading-relaxed max-w-[520px]">
                Every worksheet sharpens your predicted score. For courses like the IGCSE and IB,
                where predicted grades shape university applications, that means no more guessing
                how ready you are, <Emphasis variant="underline" className="font-medium text-slate-700">you can see it</Emphasis>, and you can change it while there is still time.
              </p>
              <p className="mt-4 text-[14px] text-slate-500 max-w-[520px]">
                Hover any point for the attempt&rsquo;s topic, score, and date. Click a line to see the
                full subject breakdown.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="rounded-3xl liquid-glass shadow-xl shadow-slate-900/5 p-6 sm:p-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-[13px] font-semibold text-slate-900">Worksheet scores &middot; ten weeks</div>
                  <div className="text-[11.5px] text-slate-400">Illustration of the progress view</div>
                </div>
                <div className="flex items-center gap-3">
                  {SUBJECT_PROGRESS.map((s) => (
                    <span key={s.id} className="inline-flex items-center gap-1.5 text-[11.5px] text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} /> {s.subject}
                    </span>
                  ))}
                </div>
              </div>
              <Chart />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
