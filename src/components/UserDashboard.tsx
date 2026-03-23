"use client";

import { useState, useEffect } from "react";
import {
  Tv,
  Clock,
  Flame,
  Globe,
  Trophy,
  X,
  ChevronRight,
  Heart,
  MapPin,
  Play,
} from "lucide-react";
import {
  getFormattedStats,
  getAchievements,
  type Achievement
} from "@/lib/user-stats";

interface UserDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  favoritesCount: number;
}

export default function UserDashboard({ isOpen, onClose, favoritesCount }: UserDashboardProps) {
  const [stats, setStats] = useState({
    totalChannels: 0,
    watchTimeFormatted: '0m',
    streak: 0,
    categories: 0,
    countries: 0,
    todayChannels: 0,
  });
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [activeTab, setActiveTab] = useState<'stats' | 'achievements'>('stats');

  useEffect(() => {
    if (isOpen) {
      setStats(getFormattedStats());
      setAchievements(getAchievements());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const unlockedCount = achievements.filter(a => a.unlockedAt).length;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: '#0A0A0F', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <h2 className="text-lg font-bold text-white">Tu Actividad</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'stats' ? 'text-white border-b-2' : 'text-white/50'
            }`}
            style={activeTab === 'stats' ? { borderColor: '#FF6B4A' } : {}}
          >
            Estadísticas
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'achievements' ? 'text-white border-b-2' : 'text-white/50'
            }`}
            style={activeTab === 'achievements' ? { borderColor: '#FF6B4A' } : {}}
          >
            Logros ({unlockedCount}/{achievements.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {activeTab === 'stats' ? (
            <div className="space-y-4">
              {/* Main stats grid */}
              <div className="grid grid-cols-2 gap-3">
                <div
                  className="p-4 rounded-xl"
                  style={{ background: 'rgba(255,107,74,0.1)' }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Tv className="w-4 h-4" style={{ color: '#FF6B4A' }} />
                    <span className="text-xs text-white/50">Canales vistos</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{stats.totalChannels}</div>
                </div>

                <div
                  className="p-4 rounded-xl"
                  style={{ background: 'rgba(74,111,255,0.1)' }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4" style={{ color: '#4A6FFF' }} />
                    <span className="text-xs text-white/50">Tiempo total</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{stats.watchTimeFormatted}</div>
                </div>

                <div
                  className="p-4 rounded-xl"
                  style={{ background: 'rgba(255,170,0,0.1)' }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Flame className="w-4 h-4" style={{ color: '#FFAA00' }} />
                    <span className="text-xs text-white/50">Racha actual</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{stats.streak} días</div>
                </div>

                <div
                  className="p-4 rounded-xl"
                  style={{ background: 'rgba(255,107,74,0.1)' }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Play className="w-4 h-4" style={{ color: '#FF6B4A' }} />
                    <span className="text-xs text-white/50">Hoy</span>
                  </div>
                  <div className="text-2xl font-bold text-white">{stats.todayChannels}</div>
                </div>
              </div>

              {/* Additional stats */}
              <div className="space-y-2">
                <div
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                >
                  <div className="flex items-center gap-3">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span className="text-white/70">Favoritos guardados</span>
                  </div>
                  <span className="text-white font-medium">{favoritesCount}</span>
                </div>

                <div
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                >
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4" style={{ color: '#4A6FFF' }} />
                    <span className="text-white/70">Categorías exploradas</span>
                  </div>
                  <span className="text-white font-medium">{stats.categories}</span>
                </div>

                <div
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-green-500" />
                    <span className="text-white/70">Países descubiertos</span>
                  </div>
                  <span className="text-white font-medium">{stats.countries}</span>
                </div>
              </div>

              {/* Share link */}
              <div
                className="p-3 rounded-lg text-center"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                <p className="text-xs text-white/40 mb-1">Comparte OrionTV con amigos</p>
                <a
                  href="https://orion-tv-indol.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:underline"
                  style={{ color: '#FF6B4A' }}
                >
                  orion-tv-indol.vercel.app
                </a>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    achievement.unlockedAt ? '' : 'opacity-40'
                  }`}
                  style={{
                    background: achievement.unlockedAt
                      ? 'rgba(255,107,74,0.1)'
                      : 'rgba(255,255,255,0.03)',
                  }}
                >
                  <div className="text-2xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{achievement.name}</span>
                      {achievement.unlockedAt && (
                        <Trophy className="w-4 h-4" style={{ color: '#FF6B4A' }} />
                      )}
                    </div>
                    <span className="text-xs text-white/50">{achievement.description}</span>
                  </div>
                  {achievement.unlockedAt && (
                    <ChevronRight className="w-4 h-4 text-white/30" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
