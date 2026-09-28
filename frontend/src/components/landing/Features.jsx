import React from 'react';
import { FEATURES } from '../../data/mock';
import Reveal from './Reveal';
import { DoodleStationery, DoodleTestTubes } from '../decor/StudyDoodles';

/* Mini looping demos shown inside a card while it is hovered.
   SVG-based so they stay crisp and theme-aware. */
export function FeatureDemo({ kind }) {
  const card = { fill: 'var(--doodle-paper, #fff)', stroke: '#cbd5e1', strokeWidth: 1.2 };
  return (
    <svg viewBox="0 0 260 110" className="w-full h-auto" aria-hidden="true">
      {kind === 'weakness' && (
        <g>
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <rect x="16" y={18 + i * 30} width="60" height="7" rx="3.5" fill="#e2e8f0" />
              <rect x="88" y={16 + i * 30} width="150" height="11" rx="5.5" fill="#eff6ff" />
              <rect x="88" y={16 + i * 30} width={[130, 45, 100][i]} height="11" rx="5.5" fill={i === 1 ? '#f87171' : '#60a5fa'} />
            </g>
          ))}
          <rect x="84" y="8" width="3.5" height="92" rx="1.75" fill="#3b82f6" opacity="0.5" className="demo-scan" />
        </g>
      )}
      {kind === 'targeted' && (
        <g>
          <rect x="30" y="22" width="160" height="80" rx="10" fill="#e2e8f0" opacity="0.7" />
          <g className="demo-slide">
            <rect x="18" y="10" width="160" height="80" rx="10" {...card} />
            <rect x="30" y="22" width="70" height="13" rx="6.5" fill="#fee2e2" />
            <text x="65" y="32" textAnchor="middle" fontSize="8.5" fill="#b91c1c" fontWeight="600">Weak topic</text>
            <rect x="30" y="44" width="120" height="6" rx="3" fill="#e2e8f0" />
            <rect x="30" y="56" width="100" height="6" rx="3" fill="#e2e8f0" />
            <rect x="30" y="72" width="52" height="13" rx="6.5" fill="#3b82f6" />
            <text x="56" y="82" textAnchor="middle" fontSize="8.5" fill="#fff" fontWeight="600">Start</text>
          </g>
          <g className="demo-pop">
            <circle cx="216" cy="54" r="24" fill="none" stroke="#93c5fd" strokeWidth="2" />
            <circle cx="216" cy="54" r="14" fill="none" stroke="#60a5fa" strokeWidth="2" />
            <circle cx="216" cy="54" r="5" fill="#3b82f6" />
          </g>
        </g>
      )}
      {kind === 'grades' && (
        <g>
          <path d="M16 92 L60 80 L104 84 L148 62 L192 50 L240 26" fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" className="demo-draw" />
          <g className="demo-pop">
            <rect x="176" y="60" width="70" height="22" rx="11" fill="#dcfce7" stroke="#4ade80" strokeWidth="1.2" />
            <text x="211" y="75" textAnchor="middle" fontSize="10" fill="#15803d" fontWeight="700">Grade 7</text>
          </g>
        </g>
      )}
      {kind === 'feedback' && (
        <g>
          <rect x="16" y="14" width="150" height="34" rx="12" {...card} />
          <text x="30" y="35" fontSize="10" fill="#64748b">Your answer: 4.2 m/s</text>
          <g className="demo-slide">
            <rect x="60" y="58" width="184" height="38" rx="12" fill="#eff6ff" stroke="#93c5fd" strokeWidth="1.2" />
            <text x="74" y="74" fontSize="9.5" fill="#1d4ed8" fontWeight="600">Almost, remember to convert</text>
            <text x="74" y="87" fontSize="9.5" fill="#1d4ed8" fontWeight="600">km/h to m/s before dividing.</text>
          </g>
        </g>
      )}
      {kind === 'bank' && (
        <g>
          {[0, 1, 2, 3].map((i) => (
            <g key={i} className={i === 3 ? 'demo-slide' : undefined}>
              <rect x={20 + i * 14} y={78 - i * 18} width="120" height="46" rx="8" {...card} />
              <rect x={32 + i * 14} y={90 - i * 18} width="70" height="6" rx="3" fill="#e2e8f0" />
            </g>
          ))}
          <g className="demo-pop">
            <rect x="172" y="40" width="72" height="22" rx="11" fill="#eff6ff" stroke="#93c5fd" strokeWidth="1.2" />
            <text x="208" y="55" textAnchor="middle" fontSize="10" fill="#2563eb" fontWeight="700">10 exams</text>
          </g>
        </g>
      )}
      {kind === 'fresh' && (
        <g>
          <rect x="18" y="16" width="170" height="80" rx="10" {...card} />
          <rect x="32" y="30" width="110" height="7" rx="3.5" fill="#e2e8f0" />
          <rect x="32" y="44" width="130" height="7" rx="3.5" fill="#e2e8f0" />
          <rect x="32" y="58" width="90" height="7" rx="3.5" fill="#e2e8f0" />
          <g className="demo-pop">
            <path d="M212 34 l5 12 12 5 -12 5 -5 12 -5 -12 -12 -5 12 -5 z" fill="#3b82f6" />
            <path d="M234 66 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 z" fill="#93c5fd" />
          </g>
          <rect x="32" y="74" width="60" height="12" rx="6" fill="#dbeafe" className="demo-bar" />
        </g>
      )}
    </svg>
  );
}

export const DEMO_KINDS = ['weakness', 'targeted', 'grades', 'feedback', 'bank', 'fresh'];

/* Hover expands on desktop; on touch devices a tap toggles the demo. */
function FeatureCard({ f, kind }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div
      tabIndex={0}
      onClick={() => setOpen((o) => !o)}
      className={`feature-card liquid-glass rounded-2xl p-6 h-full hover-lift cursor-default ${open ? 'demo-open' : ''}`}
    >
      <div className="feature-demo">
        <FeatureDemo kind={kind} />
      </div>
      <h3 className="text-[18px] font-semibold text-slate-900 mb-2">{f.title}</h3>
      <p className="text-[14.5px] text-slate-600 leading-relaxed">{f.desc}</p>
    </div>
  );
}

export default function Features() {
  return (
    <section id="features" className="relative section-light overflow-hidden">
      <div className="hidden lg:block absolute right-[4%] top-16"><DoodleTestTubes /></div>
      <div className="hidden lg:block absolute left-[3%] bottom-12"><DoodleStationery /></div>
      <div className="max-w-[1280px] mx-auto px-6 py-24 lg:py-28">
        <div className="max-w-[760px]">
          <h2 className="h-display text-[44px] sm:text-[54px] lg:text-[62px]">Everything you need to study smarter.</h2>
          <p className="mt-4 text-[15px] text-slate-500">Hover a card to see the feature in action.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 0.08} y={20}>
              <FeatureCard f={f} kind={DEMO_KINDS[i] || 'fresh'} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
