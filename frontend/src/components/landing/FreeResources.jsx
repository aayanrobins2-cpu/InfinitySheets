import React from 'react';
import { ArrowRight, Library } from 'lucide-react';
import Reveal from './Reveal';
import { RESOURCE_TRACKS } from '../../data/resources';
import { DoodleTestTubes } from '../decor/StudyDoodles';

export default function FreeResources() {
  return (
    <section className="section-dark overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-6 py-28 lg:py-32">
        <div className="grid lg:grid-cols-[1.15fr_1fr] gap-12 lg:gap-16 items-center">
          <Reveal from="left">
            <div>
              <h2 className="h-display text-slate-900 text-[46px] sm:text-[58px] lg:text-[66px] leading-[1.05]">
                Every past paper. Every syllabus. One page.
              </h2>
              <p className="mt-6 text-[17px] sm:text-[18px] text-slate-600 leading-relaxed max-w-[560px]">
                Every subject, fully accounted for. We collected the official past papers, syllabi, and best free archives for all
                {' '}{RESOURCE_TRACKS.length} curricula, so you never dig through ten tabs again.
                No account. No catch. Just links to the real sources.
              </p>
              <a
                href="#resources"
                className="mt-8 inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-[15.5px] font-medium transition-colors"
              >
                Browse free resources <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </Reveal>
          <Reveal from="right" delay={0.15}>
            <div className="relative">
              <div className="hidden lg:block absolute -top-24 right-2"><DoodleTestTubes /></div>
              <div className="rounded-3xl liquid-glass p-7">
                <div className="text-[12px] tracking-wider uppercase font-semibold text-slate-500 mb-4">Covered curricula</div>
                <div className="flex flex-wrap gap-2.5">
                  {RESOURCE_TRACKS.map((t) => (
                    <a
                      key={t.id}
                      href={`#resources?track=${t.id}`}
                      className="px-4 py-2 rounded-full border border-slate-300 text-slate-700 text-[14px] hover:border-blue-400 hover:text-blue-700 transition-colors"
                    >
                      {t.short}
                    </a>
                  ))}
                </div>
                <p className="mt-5 text-[13px] text-slate-500">Official sources first &middot; updated as boards publish</p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
