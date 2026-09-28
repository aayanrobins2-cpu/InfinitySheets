import React from 'react';
import { Check, ArrowRight, Sparkles } from 'lucide-react';
import { PLUS_PITCH } from '../../lib/entitlements';
import { PlusMark, PlusName } from '../app/PlusUpgradeBanner';
import Reveal from './Reveal';
import { DoodleGradCap } from '../decor/StudyDoodles';
import Emphasis from './Emphasis';

const FEATURES = [
  'Personalized worksheets for your exact syllabus',
  'Weakness analysis on every answer',
  'Accurate scores & predicted grades',
  'Custom feedback & advice after every sheet',
  'Progress tracking & streaks',
];

export default function Pricing() {
  return (
    <section id="pricing" className="relative section-light overflow-hidden">
      <div className="hidden lg:block absolute left-[4%] bottom-16"><DoodleGradCap /></div>
      <div className="max-w-[1280px] mx-auto px-6 py-28 lg:py-32">
        <div className="max-w-[1100px] mx-auto">
          <Reveal>
            <div className="max-w-[760px]">
              <h2 className="h-display text-[44px] sm:text-[54px] lg:text-[60px] leading-[1.05]">Your grades deserve better. This costs nothing.</h2>
              <p className="mt-6 text-[16px] text-slate-600 leading-relaxed max-w-[520px]">
                The training that moves exam results has always sat behind a price, coaching fees, paid
                question banks, private tutors. We built InfinitySheets so the only thing standing between
                you and a better grade is the decision to start. Every feature. Every subject. Free.
              </p>
              <p className="mt-4 text-[16px] text-slate-600 leading-relaxed max-w-[520px]">
                One worksheet today is how it begins. Ten weeks from now, it looks like a grade you
                didn&rsquo;t think was yours.
              </p>
            </div>
          </Reveal>
          <div className="mt-14 grid md:grid-cols-2 gap-6 items-stretch">
          <Reveal from="scale" delay={0.1}>
            <div className="relative h-full rounded-3xl p-8 liquid-glass-clear shadow-2xl shadow-slate-900/10 border border-violet-300/40" data-testid="pricing-plus">
              <div className="text-[11px] tracking-[0.14em] uppercase font-semibold text-violet-600 inline-flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> For going further</div>
              <div className="mt-3 text-[44px] leading-[1.1] font-semibold tracking-tight text-slate-900"><PlusName /></div>
              <div className="text-[15px] text-slate-500 mt-1">Everything in Free, no ads, and:</div>
              <ul className="mt-6 flex flex-col gap-3">
                {PLUS_PITCH.filter((f) => !/^No ads/.test(f)).map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 mt-0.5 text-violet-600 shrink-0" strokeWidth={2.6} />
                    <span className="text-[14.5px] text-slate-700">{f}</span>
                  </li>
                ))}
              </ul>
              <a href="#signup" className="mt-8 inline-flex items-center justify-center gap-2 w-full py-3 rounded-lg text-[15px] font-medium btn-violet transition-colors">
                Start free, upgrade anytime <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </Reveal>
          <Reveal from="scale" delay={0.15}>
            <div className="relative h-full rounded-3xl p-8 liquid-glass-clear shadow-2xl shadow-slate-900/10">
              <div className="text-[11px] tracking-[0.14em] uppercase font-semibold text-blue-600">Everything, free</div>
              <div className="flex items-baseline gap-3 mt-3">
                <Emphasis variant="circle">
                  <span className="text-[72px] font-semibold tracking-tight text-slate-900 px-1">$0</span>
                </Emphasis>
                <span className="text-[15px] text-slate-500">forever &middot; every feature</span>
              </div>
              <ul className="mt-6 flex flex-col gap-3">
                {FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 mt-0.5 text-emerald-600" strokeWidth={2.6} />
                    <span className="text-[14.5px] text-slate-700">{f}</span>
                  </li>
                ))}
              </ul>
              <a href="#signup" className="mt-8 inline-flex items-center justify-center gap-2 w-full py-3 rounded-lg text-[15px] font-medium bg-blue-500 hover:bg-blue-400 text-white transition-colors">
                Make the change <ArrowRight className="w-4 h-4" />
              </a>
              <p className="mt-4 text-[12px] text-slate-500 text-center">Supported by ads, so it stays free for everyone.</p>
            </div>
          </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
