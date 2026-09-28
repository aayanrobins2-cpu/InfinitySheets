import React from 'react';
import { InfinityMark, Pen, Worksheet } from './StudyDecor';

/**
 * Hand-drawn academic empty-state illustrations. Strokes use currentColor so
 * they adapt to light and dark mode without introducing separate image files.
 */

export function OpenBook({ className = '', size = 180 }) {
  return (
    <svg className={className} width={size} height={size * 0.65} viewBox="0 0 180 120" fill="none">
      <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.75">
        <path d="M10 30 C 30 22, 70 22, 88 32 L 88 102 C 70 92, 30 92, 10 100 Z" />
        <path d="M170 30 C 150 22, 110 22, 92 32 L 92 102 C 110 92, 150 92, 170 100 Z" />
        <line x1="90" y1="32" x2="90" y2="102" />
        <path d="M22 42 L 78 42" opacity="0.55" />
        <path d="M22 52 L 70 52" opacity="0.55" />
        <path d="M22 62 L 76 62" opacity="0.55" />
        <path d="M22 72 L 64 72" opacity="0.55" />
        <path d="M102 42 L 158 42" opacity="0.55" />
        <path d="M102 52 L 150 52" opacity="0.55" />
        <path d="M102 62 L 156 62" opacity="0.55" />
        <path d="M102 72 L 142 72" opacity="0.55" />
        <path d="M118 86 Q 132 78, 146 86" />
      </g>
    </svg>
  );
}

export function EmptyLab({ className = '', size = 260 }) {
  return (
    <svg className={className} width={size} height={size * 0.65} viewBox="0 0 260 170" fill="none">
      <g stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" opacity="0.7">
        {/* Bench */}
        <line x1="6" y1="140" x2="254" y2="140" />
        <line x1="14" y1="140" x2="14" y2="158" />
        <line x1="246" y1="140" x2="246" y2="158" />
        {/* Wall shelf */}
        <line x1="40" y1="36" x2="220" y2="36" />
        <line x1="40" y1="36" x2="40" y2="44" />
        <line x1="220" y1="36" x2="220" y2="44" />

        {/* Beaker (left) */}
        <path d="M52 80 L52 130 a8 8 0 0 0 8 8 L80 138 a8 8 0 0 0 8 -8 L88 80 Z" />
        <line x1="50" y1="80" x2="90" y2="80" />
        <line x1="58" y1="110" x2="82" y2="110" opacity="0.5" />

        {/* Test tube stand */}
        <line x1="108" y1="138" x2="148" y2="138" />
        <line x1="112" y1="120" x2="112" y2="138" />
        <line x1="144" y1="120" x2="144" y2="138" />
        <line x1="112" y1="120" x2="144" y2="120" />
        <path d="M118 80 L118 116 a4 4 0 0 0 8 0 L126 80" />
        <line x1="116" y1="80" x2="128" y2="80" />
        <path d="M134 80 L134 116 a4 4 0 0 0 8 0 L142 80" />
        <line x1="132" y1="80" x2="144" y2="80" />

        {/* Flask (right) */}
        <path d="M180 88 L180 100 L168 132 a6 6 0 0 0 5 8 L207 140 a6 6 0 0 0 5 -8 L200 100 L200 88 Z" />
        <line x1="176" y1="88" x2="204" y2="88" />
        <path d="M176 130 Q 190 122, 204 130" opacity="0.4" />

        {/* Worksheet and infinity mark on the shelf */}
        <g transform="translate(188,4)">
          <rect x="0" y="0" width="20" height="28" rx="2" />
          <path d="M5 8 H15 M5 14 H15 M5 20 H12" opacity="0.55" />
        </g>
        <path d="M52 22 C52 15 61 15 68 22 C75 29 84 29 84 22 C84 15 75 15 68 22 C61 29 52 29 52 22 Z" />
      </g>
    </svg>
  );
}

/**
 * Composite background for empty pages. Uses currentColor for all strokes so
 * placing it inside a `text-slate-300 dark:text-slate-600` wrapper makes it
 * adapt nicely to either theme. Decorative only — pointer-events: none.
 */
export default function EmptyStateScene({ variant = 'lab', className = '' }) {
  return (
    <div className={`pointer-events-none select-none ${className}`} aria-hidden="true">
      <div className="relative w-full h-full text-slate-300 dark:text-slate-600">
        <div className="absolute top-3 left-3 -rotate-6 opacity-50">
          <InfinityMark size={170} color="currentColor" opacity={0.75} />
        </div>
        <div className="absolute top-4 right-8 rotate-6 opacity-45">
          <Worksheet size={72} color="currentColor" />
        </div>
        <div className="absolute bottom-7 left-[12%] -rotate-12 opacity-40">
          <Pen size={64} color="currentColor" />
        </div>
        {/* Centered scene */}
        <div className="absolute inset-x-0 bottom-6 flex items-end justify-center gap-10">
          {variant === 'lab' && <EmptyLab size={300} />}
          {variant === 'book' && <OpenBook size={220} />}
          {variant === 'both' && (
            <>
              <OpenBook size={180} className="mb-2" />
              <EmptyLab size={280} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
