import React from 'react';
import { Flask, OpenBook, Pen, Worksheet } from './StudyDecor';

/**
 * Futuristic infinity-pattern background.
 * Used as a decorative absolute overlay inside positioned containers.
 * Props:
 *   variant: 'soft' | 'bold' | 'hero'
 *   className: extra classes
 */
export default function InfinityBackground({ variant = 'soft', className = '' }) {
  const stroke = variant === 'bold' ? 1.5 : 1.1;
  const op = variant === 'hero' ? 0.5 : variant === 'bold' ? 0.4 : 0.3;
  return (
    <div className={`infinity-bg ${className}`} aria-hidden="true">
      <InfSvg className="inf-1" size={420} stroke={stroke} color="#2563eb" opacity={op} />
      <InfSvg className="inf-2" size={520} stroke={stroke} color="#0ea5e9" opacity={op * 0.9} />
      <InfSvg className="inf-3" size={380} stroke={stroke} color="#dc2626" opacity={op * 0.75} />
      <InfSvg className="inf-4" size={300} stroke={stroke} color="#2563eb" opacity={op * 0.6} />
      <OpenBook className="study-book" size={86} color="#ffffff" />
      <Worksheet className="study-sheet" size={74} color="#ffffff" />
      <Flask className="study-flask" size={78} color="#ffffff" />
      <Pen className="study-pen" size={68} color="#ffffff" />
    </div>
  );
}

function InfSvg({ size, stroke, color, opacity, className }) {
  return (
    <svg className={className} width={size} height={size * 0.5} viewBox="0 0 200 100" style={{ opacity }}>
      {/* infinity path drawn as two lobes */}
      <path
        d="M30,50 C30,20 70,20 100,50 C130,80 170,80 170,50 C170,20 130,20 100,50 C70,80 30,80 30,50 Z"
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
      />
    </svg>
  );
}
