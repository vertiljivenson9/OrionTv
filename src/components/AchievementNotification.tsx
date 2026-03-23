"use client";

import { useEffect, useState } from "react";
import { X, Trophy } from "lucide-react";
import type { Achievement } from "@/lib/user-stats";

interface AchievementNotificationProps {
  achievement: Achievement | null;
  onClose: () => void;
}

export default function AchievementNotification({
  achievement,
  onClose,
}: AchievementNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (achievement) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [achievement, onClose]);

  if (!achievement) return null;

  return (
    <div
      className={`fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-[70] transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <div
        className="rounded-xl p-4 flex items-start gap-3"
        style={{
          background: 'linear-gradient(135deg, rgba(255,107,74,0.15) 0%, rgba(255,170,0,0.1) 100%)',
          border: '1px solid rgba(255,107,74,0.3)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div className="text-3xl">{achievement.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4" style={{ color: '#FF6B4A' }} />
            <span className="text-sm font-medium" style={{ color: '#FF6B4A' }}>
              ¡Logro Desbloqueado!
            </span>
          </div>
          <h4 className="text-white font-semibold mt-1">{achievement.name}</h4>
          <p className="text-white/60 text-sm">{achievement.description}</p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="p-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4 text-white/40" />
        </button>
      </div>
    </div>
  );
}
