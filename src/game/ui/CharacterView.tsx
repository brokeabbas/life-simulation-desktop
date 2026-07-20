// src/game/ui/CharacterView.tsx
import type { Gender } from '../types';

function faceForMood(happiness: number) {
  if (happiness >= 75) return 'happy';
  if (happiness <= 30) return 'sad';
  return 'neutral';
}

export default function CharacterView({ gender, happiness = 50 }: { gender: Gender; happiness?: number }) {
  const mood = faceForMood(happiness);
  const hairColor = gender === 'female' ? '#7c4dff' : '#3b82f6';
  const shirt = gender === 'female' ? '#ef68a5' : '#8b5cf6';

  // Simple 2D paper-doll: head + hair + body + face
  return (
    <div className="character">
      <svg width="180" height="220" viewBox="0 0 180 220" fill="none">
        {/* shadow */}
        <ellipse cx="90" cy="206" rx="40" ry="8" fill="rgba(0,0,0,.35)" />
        {/* body */}
        <path d="M55 150c0-18 16-30 35-30s35 12 35 30v32c0 4-3 7-7 7H62c-4 0-7-3-7-7v-32z" fill={shirt} stroke="#1f2937" strokeWidth="2"/>
        {/* neck */}
        <rect x="80" y="120" width="20" height="16" rx="6" fill="#f7d0c2" />
        {/* head */}
        <circle cx="90" cy="92" r="32" fill="#f9e0d6" stroke="#1f2937" strokeWidth="2"/>
        {/* hair */}
        {gender === 'female' ? (
          <>
            <path d="M58 88c0-22 16-34 32-34s32 12 32 34c0 10-4 20-10 26-4 4-10 7-22 7s-18-3-22-7c-6-6-10-16-10-26z" fill={hairColor}/>
            <path d="M56 110c-4 12-3 26 10 32" stroke={hairColor} strokeWidth="8" strokeLinecap="round"/>
            <path d="M124 110c4 12 3 26-10 32" stroke={hairColor} strokeWidth="8" strokeLinecap="round"/>
          </>
        ) : (
          <>
            <path d="M60 85c5-16 18-27 30-27s25 11 30 27c-8 6-18 10-30 10s-22-4-30-10z" fill={hairColor}/>
            <rect x="62" y="80" width="56" height="12" rx="6" fill={hairColor} />
          </>
        )}
        {/* eyes */}
        <circle cx="78" cy="92" r="3" fill="#0b0920"/>
        <circle cx="102" cy="92" r="3" fill="#0b0920"/>
        {/* mouth */}
        {mood === 'happy' && <path d="M78 106c4 6 20 6 24 0" stroke="#0b0920" strokeWidth="3" strokeLinecap="round"/>}
        {mood === 'neutral' && <line x1="80" y1="106" x2="100" y2="106" stroke="#0b0920" strokeWidth="3" strokeLinecap="round" />}
        {mood === 'sad' && <path d="M78 110c4-6 20-6 24 0" stroke="#0b0920" strokeWidth="3" strokeLinecap="round"/>}
        {/* shoulders outline */}
        <path d="M50 150c6-22 22-34 40-34s34 12 40 34" stroke="rgba(255,255,255,.12)" strokeWidth="2" strokeLinecap="round"/>
        {/* shirt collar */}
        <path d="M75 140l15 10 15-10" stroke="rgba(255,255,255,.35)" strokeWidth="3" strokeLinecap="round"/>
      </svg>
    </div>
  );
}
