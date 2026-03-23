"use client";

import { Flame } from "lucide-react";

interface TrendingBadgeProps {
  viewers?: number;
  rank?: number;
  compact?: boolean;
}

export default function TrendingBadge({ viewers, rank, compact = false }: TrendingBadgeProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-orange-500/20 text-orange-400">
        <Flame className="w-3 h-3" />
      </div>
    );
  }

  const formatViewers = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium"
      style={{
        background: 'linear-gradient(135deg, rgba(255,107,74,0.2) 0%, rgba(255,170,0,0.2) 100%)',
        color: '#FF6B4A',
      }}
    >
      <Flame className="w-3.5 h-3.5" />
      {rank && <span>#{rank}</span>}
      {viewers && <span>{formatViewers(viewers)} viendo</span>}
    </div>
  );
}
