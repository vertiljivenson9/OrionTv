"use client";

import { useEffect, useState } from "react";

type StreamQuality = 'checking' | 'good' | 'slow' | 'offline';

interface StreamQualityIndicatorProps {
  loadTime?: number;
  hasError?: boolean;
  compact?: boolean;
}

export default function StreamQualityIndicator({
  loadTime,
  hasError,
  compact = false,
}: StreamQualityIndicatorProps) {
  const [quality, setQuality] = useState<StreamQuality>('checking');

  useEffect(() => {
    if (hasError) {
      setQuality('offline');
      return;
    }

    if (loadTime === undefined) {
      setQuality('checking');
      return;
    }

    if (loadTime < 2000) {
      setQuality('good');
    } else if (loadTime < 4000) {
      setQuality('slow');
    } else {
      setQuality('offline');
    }
  }, [loadTime, hasError]);

  const getQualityInfo = () => {
    switch (quality) {
      case 'checking':
        return { color: '#9CA3AF', label: 'Verificando', dot: 'animate-pulse' };
      case 'good':
        return { color: '#22C55E', label: 'Online', dot: '' };
      case 'slow':
        return { color: '#F59E0B', label: 'Lento', dot: 'animate-pulse' };
      case 'offline':
        return { color: '#EF4444', label: 'Offline', dot: '' };
    }
  };

  const info = getQualityInfo();

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <div
          className={`w-2 h-2 rounded-full ${info.dot}`}
          style={{ background: info.color }}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
      <div
        className={`w-2.5 h-2.5 rounded-full ${info.dot}`}
        style={{ background: info.color }}
      />
      <span className="text-xs text-white/60">{info.label}</span>
    </div>
  );
}
