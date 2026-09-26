import React from 'react';

/**
 * Hand-drawn style SVG decorations - pencils, pens, notebooks, test tubes,
 * students, and small infinity loops. Used as decorative backgrounds.
 */
export function Pencil({ className = '', color = '#2563eb', size = 64 }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" fill="none">
      <g stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 50 L40 20 L52 32 L22 62" />
        <path d="M40 20 L46 14 L52 14 L52 20 L46 26" />
        <path d="M14 46 L18 50" />
        <path d="M16 56 L22 62 L8 60 Z" fill={color} fillOpacity="0.15" />
      </g>
    </svg>
  );
}

export function Pen({ className = '', color = '#0ea5e9', size = 64 }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" fill="none">
      <g stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 52 L36 24 L48 36 L20 60 L8 58 Z" />
        <path d="M36 24 L46 14" />
        <path d="M46 14 L54 22 L50 26 L42 18 Z" />
        <path d="M20 60 L24 56" />
      </g>
    </svg>
  );
}

export function Notebook({ className = '', color = '#dc2626', size = 64 }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" fill="none">
      <g stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="12" y="8" width="38" height="48" rx="3" />
        <line x1="20" y1="8" x2="20" y2="56" />
        <line x1="24" y1="20" x2="44" y2="20" />
        <line x1="24" y1="28" x2="44" y2="28" />
        <line x1="24" y1="36" x2="40" y2="36" />
        <line x1="24" y1="44" x2="36" y2="44" />
      </g>
    </svg>
  );
}

export function TestTube({ className = '', color = '#10b981', size = 64 }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" fill="none">
      <g stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M24 6 L40 6" />
        <path d="M26 6 L26 48 a6 6 0 0 0 12 0 L38 6" />
        <path d="M26 36 a6 6 0 0 0 12 0" fill={color} fillOpacity="0.18" />
        <circle cx="30" cy="42" r="1.2" fill={color} />
        <circle cx="34" cy="40" r="0.9" fill={color} />
      </g>
    </svg>
  );
}

export function Student({ className = '', color = '#2563eb', size = 64 }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" fill="none">
      <g stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        {/* graduation cap */}
        <path d="M10 22 L32 14 L54 22 L32 30 Z" fill={color} fillOpacity="0.12" />
        <path d="M50 24 L50 36" />
        <path d="M50 36 a2 2 0 0 0 2 2 a2 2 0 0 0 -2 2 a2 2 0 0 0 -2 -2 a2 2 0 0 0 2 -2 Z" fill={color} />
        <path d="M18 26 L18 36 C 22 42 42 42 46 36 L46 26" />
        {/* face */}
        <circle cx="32" cy="46" r="6" />
        <path d="M22 60 c 0 -6 5 -10 10 -10 s 10 4 10 10" />
      </g>
    </svg>
  );
}

export function Ruler({ className = '', color = '#f59e0b', size = 64 }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" fill="none">
      <g stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="22" width="48" height="14" rx="2" />
        <line x1="14" y1="22" x2="14" y2="28" />
        <line x1="20" y1="22" x2="20" y2="30" />
        <line x1="26" y1="22" x2="26" y2="28" />
        <line x1="32" y1="22" x2="32" y2="30" />
        <line x1="38" y1="22" x2="38" y2="28" />
        <line x1="44" y1="22" x2="44" y2="30" />
        <line x1="50" y1="22" x2="50" y2="28" />
      </g>
    </svg>
  );
}

export function InfinityMark({ className = '', color = '#2563eb', size = 64, opacity = 0.5 }) {
  return (
    <svg className={className} width={size} height={size * 0.5} viewBox="0 0 200 100" style={{ opacity }}>
      <path d="M30,50 C30,20 70,20 100,50 C130,80 170,80 170,50 C170,20 130,20 100,50 C70,80 30,80 30,50 Z" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Composite scattered background: infinity loops + study-themed clipart.
 * Sits inside a relatively-positioned parent.
 */
export default function StudyDecor({ density = 'normal' }) {
  const items = density === 'dense'
    ? [
        { C: Pencil, top: '6%',  left: '4%',  rot: -12, size: 78, op: 0.35, color: '#2563eb' },
        { C: TestTube, top: '12%', right: '6%', rot: 16, size: 72, op: 0.32, color: '#10b981' },
        { C: Notebook, top: '46%', left: '3%', rot: -6, size: 86, op: 0.30, color: '#dc2626' },
        { C: Pen, top: '60%', right: '5%', rot: 22, size: 82, op: 0.34, color: '#0ea5e9' },
        { C: Student, bottom: '8%', left: '38%', rot: -4, size: 86, op: 0.28, color: '#2563eb' },
        { C: Ruler, top: '32%', left: '46%', rot: 10, size: 78, op: 0.28, color: '#f59e0b' },
      ]
    : [
        { C: Pencil, top: '8%', left: '6%', rot: -14, size: 60, op: 0.30, color: '#2563eb' },
        { C: TestTube, top: '64%', right: '6%', rot: 14, size: 60, op: 0.28, color: '#10b981' },
        { C: Notebook, bottom: '8%', left: '8%', rot: -6, size: 62, op: 0.26, color: '#dc2626' },
        { C: Pen, top: '14%', right: '12%', rot: 22, size: 60, op: 0.28, color: '#0ea5e9' },
      ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* infinity marks */}
      <div className="absolute top-[5%] right-[28%] -rotate-12"><InfinityMark size={260} color="#2563eb" opacity={0.32} /></div>
      <div className="absolute bottom-[12%] left-[18%] rotate-6"><InfinityMark size={220} color="#0ea5e9" opacity={0.28} /></div>
      <div className="absolute top-[58%] right-[6%] rotate-12"><InfinityMark size={180} color="#dc2626" opacity={0.24} /></div>

      {/* clipart */}
      {items.map(({ C, color, op, rot, size, ...pos }, i) => (
        <div key={i} className="absolute" style={{ ...pos, transform: `rotate(${rot}deg)`, opacity: op }}>
          <C color={color} size={size} />
        </div>
      ))}
    </div>
  );
}
