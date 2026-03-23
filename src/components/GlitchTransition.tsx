"use client";

import { useEffect, useState } from "react";

interface GlitchTransitionProps {
  isActive: boolean;
  channelName?: string;
  duration?: number; // in milliseconds
  onComplete?: () => void;
}

export default function GlitchTransition({
  isActive,
  channelName,
  duration = 300,
  onComplete,
}: GlitchTransitionProps) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setPhase(0);
      return;
    }

    // Phase sequence: static -> glitch -> reveal
    const phases = [1, 2, 3, 4];
    const phaseDurations = [
      duration * 0.2, // static appear
      duration * 0.3, // glitch effect
      duration * 0.3, // channel name
      duration * 0.2, // fade out
    ];

    let totalElapsed = 0;
    phases.forEach((p, i) => {
      setTimeout(() => {
        setPhase(p);
        if (p === 4) {
          setTimeout(() => {
            onComplete?.();
          }, phaseDurations[i]);
        }
      }, totalElapsed);
      totalElapsed += phaseDurations[i];
    });
  }, [isActive, duration, onComplete]);

  if (!isActive || phase === 0) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
      {/* Static noise background */}
      <div
        className={`absolute inset-0 transition-opacity duration-100 ${
          phase >= 1 && phase < 4 ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background: '#000',
        }}
      >
        {/* Scanlines */}
        <div
          className="absolute inset-0"
          style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
          }}
        />

        {/* Animated noise */}
        <div
          className="absolute inset-0 animate-pulse"
          style={{
            background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            opacity: 0.1,
          }}
        />
      </div>

      {/* Glitch bars */}
      {phase >= 2 && phase < 4 && (
        <>
          <div
            className="absolute left-0 right-0 h-1 bg-white animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              opacity: 0.8,
            }}
          />
          <div
            className="absolute left-0 right-0 h-2"
            style={{
              top: `${Math.random() * 100}%`,
              background: '#FF6B4A',
              opacity: 0.5,
            }}
          />
          <div
            className="absolute left-0 right-0 h-1 bg-white"
            style={{
              top: `${Math.random() * 100}%`,
              opacity: 0.6,
            }}
          />
        </>
      )}

      {/* Channel name display */}
      {phase >= 3 && phase < 4 && channelName && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center animate-pulse">
            <div
              className="text-4xl font-bold text-white tracking-wider"
              style={{
                textShadow: '3px 3px 0 #FF6B4A, -3px -3px 0 #4A6FFF',
              }}
            >
              {channelName}
            </div>
            <div className="text-sm text-white/60 mt-2">Cargando...</div>
          </div>
        </div>
      )}
    </div>
  );
}
