"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface DigitalClockProps {
  showIcon?: boolean;
  showSeconds?: boolean;
  format24h?: boolean;
  className?: string;
}

export default function DigitalClock({
  showIcon = true,
  showSeconds = false,
  format24h = true,
  className = '',
}: DigitalClockProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, showSeconds ? 1000 : 60000); // Update every second if showing seconds, else every minute

    return () => clearInterval(timer);
  }, [showSeconds]);

  const formatTime = () => {
    let hours = time.getHours();
    const minutes = time.getMinutes().toString().padStart(2, '0');
    const seconds = time.getSeconds().toString().padStart(2, '0');

    if (!format24h) {
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      return showSeconds
        ? `${hours}:${minutes}:${seconds} ${ampm}`
        : `${hours}:${minutes} ${ampm}`;
    }

    return showSeconds
      ? `${hours.toString().padStart(2, '0')}:${minutes}:${seconds}`
      : `${hours.toString().padStart(2, '0')}:${minutes}`;
  };

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${className}`}
      style={{ background: 'rgba(255,255,255,0.05)' }}
    >
      {showIcon && <Clock className="w-4 h-4" style={{ color: '#FF6B4A' }} />}
      <span className="font-mono text-sm text-white/80 tabular-nums">
        {formatTime()}
      </span>
    </div>
  );
}
