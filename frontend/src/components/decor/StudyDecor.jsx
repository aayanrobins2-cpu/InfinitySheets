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

export function OpenBook({ className = '', color = '#2563eb', size = 64 }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" fill="none">
      <g stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 14 C16 10 25 12 31 18 V53 C24 47 15 45 5 48 Z" fill={color} fillOpacity="0.08" />
        <path d="M59 14 C48 10 39 12 33 18 V53 C40 47 49 45 59 48 Z" fill={color} fillOpacity="0.08" />
        <path d="M32 18 V53" />
        <path d="M11 22 C18 20 23 21 27 24 M11 29 C18 27 23 28 27 31 M37 24 C42 21 48 20 53 22 M37 31 C42 28 48 27 53 29" opacity="0.65" />
      </g>
    </svg>
  );
}

export function Worksheet({ className = '', color = '#7c3aed', size = 64 }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" fill="none">
      <g stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 6 H40 L52 18 V58 H14 Z" fill={color} fillOpacity="0.07" />
        <path d="M40 6 V18 H52" />
        <path d="M21 28 L24 31 L29 24 M34 28 H45 M21 40 L24 43 L29 36 M34 40 H45 M21 51 H45" />
      </g>
    </svg>
  );
}

export function Flask({ className = '', color = '#10b981', size = 64 }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" fill="none">
      <g stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M24 7 H40 M27 7 V25 L13 50 A5 5 0 0 0 18 57 H46 A5 5 0 0 0 51 50 L37 25 V7" />
        <path d="M20 43 Q32 37 44 43 L50 52 A4 4 0 0 1 46 57 H18 A4 4 0 0 1 14 52 Z" fill={color} fillOpacity="0.12" />
        <circle cx="27" cy="48" r="1.2" fill={color} /><circle cx="36" cy="45" r="1" fill={color} /><circle cx="40" cy="51" r="1.3" fill={color} />
      </g>
    </svg>
  );
}

export function Calculator({ className = '', color = '#f59e0b', size = 64 }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" fill="none">
      <g stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="13" y="5" width="38" height="54" rx="5" fill={color} fillOpacity="0.06" />
        <rect x="20" y="12" width="24" height="10" rx="2" />
        {[0, 1, 2].map((r) => [0, 1, 2].map((c) => <rect key={`${r}-${c}`} x={20 + c * 9} y={29 + r * 9} width="5" height="5" rx="1" />))}
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
        { C: OpenBook, top: '6%', left: '4%', rot: -8, size: 86, op: 0.34, color: '#2563eb' },
        { C: Flask, top: '11%', right: '6%', rot: 12, size: 78, op: 0.30, color: '#10b981' },
        { C: Worksheet, top: '45%', left: '3%', rot: -6, size: 82, op: 0.28, color: '#7c3aed' },
        { C: Pen, top: '60%', right: '5%', rot: 22, size: 82, op: 0.30, color: '#0ea5e9' },
        { C: Calculator, bottom: '7%', left: '38%', rot: -4, size: 78, op: 0.25, color: '#f59e0b' },
        { C: Ruler, top: '32%', left: '46%', rot: 10, size: 78, op: 0.24, color: '#f59e0b' },
      ]
    : [
        { C: OpenBook, top: '8%', left: '6%', rot: -7, size: 68, op: 0.28, color: '#2563eb' },
        { C: Flask, top: '64%', right: '6%', rot: 12, size: 66, op: 0.25, color: '#10b981' },
        { C: Worksheet, bottom: '8%', left: '8%', rot: -5, size: 66, op: 0.24, color: '#7c3aed' },
        { C: Pen, top: '14%', right: '12%', rot: 22, size: 62, op: 0.25, color: '#0ea5e9' },
      ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* infinity marks */}
      <div className="absolute top-[4%] right-[28%] -rotate-6"><InfinityMark size={280} color="#2563eb" opacity={0.30} /></div>
      <div className="absolute bottom-[10%] left-[20%] rotate-6"><InfinityMark size={230} color="#0ea5e9" opacity={0.25} /></div>
      <div className="absolute top-[54%] right-[8%] rotate-12"><InfinityMark size={190} color="#7c3aed" opacity={0.20} /></div>

      {/* clipart */}
      {items.map(({ C, color, op, rot, size, ...pos }, i) => (
        <div key={i} className="absolute" style={{ ...pos, transform: `rotate(${rot}deg)`, opacity: op }}>
          <C color={color} size={size} />
        </div>
      ))}
    </div>
  );
}
