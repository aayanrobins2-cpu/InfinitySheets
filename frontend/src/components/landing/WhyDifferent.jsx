import React from 'react';
import { Check, X } from 'lucide-react';
import Reveal from './Reveal';
import { DoodleAtom, DoodleBooks } from '../decor/StudyDoodles';
import Emphasis from './Emphasis';

const COMPARISON = [
  { them: 'Rereading notes until they blur together', us: 'Answering exam-style questions that stick' },
  { them: 'Highlighting feels productive, proves nothing', us: 'Every answer is marked, instantly' },
  { them: 'Practicing what you already know', us: 'Sheets tuned to your weak concepts' },
  { them: 'One-size-fits-all past papers', us: 'Difficulty tweaked to your level, per topic' },
  { them: 'No idea if you are actually ready', us: 'A live score and predicted grade' },
];

export default function WhyDifferent() {
  return (
    <section className="relative section-dark overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-6 py-20 lg:py-28">
        <div className="hidden lg:block absolute left-[3%] top-24"><DoodleAtom /></div>
        <div className="hidden lg:block absolute right-[4%] bottom-24"><DoodleBooks width={100} /></div>
        <Reveal>
          <div className="text-center max-w-[860px] mx-auto">
            <h2 className="h-display text-slate-900 text-[44px] sm:text-[60px] lg:text-[72px] leading-[1.05]">
              Real practice, <Emphasis variant="highlight" amber>real results</Emphasis>.
            </h2>
            <p className="mt-7 text-[16.5px] sm:text-[18px] leading-relaxed text-slate-600 max-w-[720px] mx-auto">
              Practice sheets catered to your exact exam, the right boards, the right question
              styles, the right mark schemes, and tweaked to your level as you improve. Where
              you struggle, the sheets meet you where you are and build you up. Where you are
              strong, they push you further. That is how scores actually move.
            </p>
          </div>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="mt-16 max-w-[920px] mx-auto w-full relative">
            <div className="rounded-3xl liquid-glass overflow-hidden">
              <div className="grid grid-cols-2 border-b border-slate-200">
                <div className="px-6 py-4 text-[13px] font-semibold text-slate-500 uppercase tracking-wider">Traditional studying</div>
                <div className="px-6 py-4 text-[13px] font-semibold text-blue-700 uppercase tracking-wider border-l border-slate-200">InfinitySheets</div>
              </div>
              {COMPARISON.map((row, i) => (
                <div key={i} className={`grid grid-cols-2 ${i > 0 ? 'border-t border-slate-100' : ''}`}>
                  <div className="px-6 py-4 flex items-start gap-3">
                    <X className="w-4 h-4 mt-0.5 shrink-0 text-slate-500" />
                    <span className="text-[14px] text-slate-500 leading-snug">{row.them}</span>
                  </div>
                  <div className="px-6 py-4 flex items-start gap-3 border-l border-slate-100">
                    <Check className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" strokeWidth={2.6} />
                    <span className="text-[14px] text-slate-800 leading-snug">{row.us}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-6 text-[12.5px] text-slate-500 italic text-center max-w-[720px] mx-auto">
            Active recall, spaced repetition, and instant feedback are among the most-replicated
            findings in cognitive science and learning research, that loop is exactly what
            InfinitySheets automates.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
