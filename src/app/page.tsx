"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import HLSPlayer from "@/components/HLSPlayer";
import WelcomeScreen from "@/components/WelcomeScreen";
import DigitalClock from "@/components/DigitalClock";
import UserDashboard from "@/components/UserDashboard";
import GlitchTransition from "@/components/GlitchTransition";
import AchievementNotification from "@/components/AchievementNotification";
import ShareChannelButton from "@/components/ShareChannelButton";
import TrendingBadge from "@/components/TrendingBadge";
import {
  Loader2, Tv, Search, Heart, X, ChevronUp, ChevronDown, Play,
  Shuffle, Clock, Sparkles, BarChart3, Flame
} from "lucide-react";
import type { Channel } from "@/lib/channel-service";
import {
  getRecentChannels,
  addRecentChannel,
  getRandomChannel,
  type RecentChannel
} from "@/lib/recent-channels";
import {
  trackChannelView,
  trackRandomChannel,
  trackFavorite,
  getFormattedStats,
  type Achievement
} from "@/lib/user-stats";

const WELCOME_ACCEPTED_KEY = 'oriontv_welcome_accepted';

// Channel card component (GRID style)
const ChannelCard = ({
  channel,
  isActive,
  isFavorite,
  onClick,
  onToggleFavorite,
  showTime = false,
}: {
  channel: Channel;
  isActive: boolean;
  isFavorite: boolean;
  onClick: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
  showTime?: boolean;
}) => (
  <div
    onClick={onClick}
    className={`relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200 group ${
      isActive ? 'ring-2 ring-[#FF6B4A] scale-[1.02]' : 'hover:scale-[1.02]'
    }`}
    style={{ background: 'rgba(255,255,255,0.03)' }}
  >
    {/* Logo Area */}
    <div className="aspect-video relative flex items-center justify-center overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
      {channel.logo ? (
        <img
          src={channel.logo}
          alt={channel.name}
          className="w-full h-full object-contain p-4"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : (
        <Tv className="w-12 h-12 text-white/30" />
      )}
      
      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="p-3 rounded-full bg-[#FF6B4A] text-white hover:bg-[#FF6B4A]/80 transition-colors"
        >
          <Play className="w-5 h-5 fill-white" />
        </button>
        <button
          onClick={onToggleFavorite}
          className="p-3 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
        >
          <Heart
            className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`}
          />
        </button>
      </div>

      {/* Live Badge */}
      {isActive && (
        <div className="absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium text-white" style={{ background: '#FF6B4A' }}>
          EN VIVO
        </div>
      )}
    </div>

    {/* Info */}
    <div className="p-3">
      <div className="font-medium text-white truncate text-sm">{channel.name}</div>
      <div className="text-xs text-white/40 truncate flex items-center gap-1">
        <span>{channel.category}</span>
        {showTime && 'watchedAt' in channel && (
          <span className="text-white/30">• {formatTimeAgo((channel as RecentChannel).watchedAt)}</span>
        )}
      </div>
    </div>
  </div>
);

// Format time ago
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  return `${diffDays}d`;
}

// Category section component (GRID)
const CategorySection = ({
  category,
  channels,
  activeChannel,
  favorites,
  onSelect,
  onToggleFavorite,
}: {
  category: string;
  channels: Channel[];
  activeChannel: Channel | null;
  favorites: string[];
  onSelect: (channel: Channel) => void;
  onToggleFavorite: (channel: Channel, e: React.MouseEvent) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="py-4 px-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between py-2 hover:bg-white/5 transition-colors rounded-lg px-2"
      >
        <span className="font-semibold text-white flex items-center gap-2">
          {category}
          <span className="text-xs text-white/40 font-normal">{channels.length}</span>
        </span>
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-white/50" />
          ) : (
            <ChevronDown className="w-4 h-4 text-white/50" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 mt-3">
          {channels.slice(0, 24).map((channel) => (
            <ChannelCard
              key={channel.id}
              channel={channel}
              isActive={activeChannel?.id === channel.id}
              isFavorite={favorites.includes(channel.id)}
              onClick={() => onSelect(channel)}
              onToggleFavorite={(e) => onToggleFavorite(channel, e)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Offline overlay
function OfflineOverlay() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6" style={{ background: '#0A0A0F' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              width: Math.random() * 2 + 1 + 'px',
              height: Math.random() * 2 + 1 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animationDelay: Math.random() * 3 + 's',
              opacity: Math.random() * 0.5 + 0.2,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center max-w-md">
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center" style={{ background: 'rgba(255, 107, 74, 0.1)' }}>
            <Tv className="w-10 h-10" style={{ color: '#FF6B4A' }} />
          </div>
        </div>
        <h2 className="text-xl font-bold text-white mb-3">Sin conexión a Internet</h2>
        <p className="text-white/60 mb-6">
          Lo sentimos, conéctate a una conexión a Internet para disfrutar de OrionTV.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 rounded-xl font-medium text-white transition-all"
          style={{ background: '#FF6B4A' }}
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  // Channels state
  const [groupedChannels, setGroupedChannels] = useState<Record<string, Channel[]>>({});
  const [allChannels, setAllChannels] = useState<Channel[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Player state
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [activeChannelIndex, setActiveChannelIndex] = useState<number>(-1);
  const [showPlayer, setShowPlayer] = useState(false);
  const [isPlayerMinimized, setIsPlayerMinimized] = useState(false);

  // Favorites & Recent
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentChannels, setRecentChannels] = useState<RecentChannel[]>([]);

  // Dashboard & Achievements
  const [showDashboard, setShowDashboard] = useState(false);
  const [showGlitch, setShowGlitch] = useState(false);
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
  const [loadStartTime, setLoadStartTime] = useState<number>(0);

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check if welcome was accepted
  useEffect(() => {
    const accepted = localStorage.getItem(WELCOME_ACCEPTED_KEY);
    if (accepted === 'true') {
      setShowWelcome(false);
    }
    // Load recent channels
    setRecentChannels(getRecentChannels());
  }, []);

  // Auth check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        router.push("/login");
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // Handle welcome accept
  const handleWelcomeAccept = useCallback(() => {
    localStorage.setItem(WELCOME_ACCEPTED_KEY, 'true');
    setShowWelcome(false);
  }, []);

  // Fetch channels
  useEffect(() => {
    async function fetchChannels() {
      try {
        const response = await fetch('/api/channels?grouped=true');
        const data = await response.json();

        if (data.grouped) {
          setGroupedChannels(data.grouped);
          setCategories(data.categories || []);

          // Flatten all channels for random/zapping
          const flatChannels: Channel[] = [];
          for (const chs of Object.values(data.grouped)) {
            flatChannels.push(...(chs as Channel[]));
          }
          setAllChannels(flatChannels);
        }
      } catch (error) {
        console.error('Error fetching channels:', error);
      } finally {
        setLoading(false);
      }
    }

    if (user && !showWelcome) {
      fetchChannels();
    }
  }, [user, showWelcome]);

  // Fetch favorites
  useEffect(() => {
    async function fetchFavorites() {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/favorites', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setFavorites((data.favorites || []).map((f: { id: string }) => f.id));
      } catch (error) {
        console.error('Error fetching favorites:', error);
      }
    }

    if (user && !showWelcome) {
      fetchFavorites();
    }
  }, [user, showWelcome]);

  // Select channel - NO SCROLL, instant change
  const handleSelectChannel = useCallback((channel: Channel) => {
    if (activeChannel?.id === channel.id) {
      setIsPlayerMinimized(false);
      return;
    }

    // Show glitch transition
    setShowGlitch(true);
    setLoadStartTime(Date.now());

    // Find index in current display list
    const currentList = selectedCategory === 'Favoritos'
      ? allChannels.filter(ch => favorites.includes(ch.id))
      : selectedCategory
        ? groupedChannels[selectedCategory] || []
        : allChannels;

    const index = currentList.findIndex(ch => ch.id === channel.id);
    setActiveChannelIndex(index);

    setActiveChannel(channel);
    setShowPlayer(true);
    setIsPlayerMinimized(false);

    // Add to recent
    const updated = addRecentChannel(channel);
    setRecentChannels(updated);

    // Track stats and check achievements
    const result = trackChannelView(channel);
    if (result.newAchievements.length > 0) {
      setNewAchievement(result.newAchievements[0]);
    }
  }, [activeChannel, selectedCategory, allChannels, groupedChannels, favorites]);

  // Previous channel
  const handlePrevChannel = useCallback(() => {
    const currentList = selectedCategory === 'Favoritos'
      ? allChannels.filter(ch => favorites.includes(ch.id))
      : selectedCategory
        ? groupedChannels[selectedCategory] || []
        : allChannels;

    if (currentList.length === 0) return;

    const newIndex = activeChannelIndex > 0
      ? activeChannelIndex - 1
      : currentList.length - 1;

    const newChannel = currentList[newIndex];
    if (newChannel) {
      setActiveChannelIndex(newIndex);
      setActiveChannel(newChannel);
      const updated = addRecentChannel(newChannel);
      setRecentChannels(updated);
    }
  }, [activeChannelIndex, selectedCategory, allChannels, groupedChannels, favorites]);

  // Next channel
  const handleNextChannel = useCallback(() => {
    const currentList = selectedCategory === 'Favoritos'
      ? allChannels.filter(ch => favorites.includes(ch.id))
      : selectedCategory
        ? groupedChannels[selectedCategory] || []
        : allChannels;

    if (currentList.length === 0) return;

    const newIndex = activeChannelIndex < currentList.length - 1
      ? activeChannelIndex + 1
      : 0;

    const newChannel = currentList[newIndex];
    if (newChannel) {
      setActiveChannelIndex(newIndex);
      setActiveChannel(newChannel);
      const updated = addRecentChannel(newChannel);
      setRecentChannels(updated);
    }
  }, [activeChannelIndex, selectedCategory, allChannels, groupedChannels, favorites]);

  // Random channel
  const handleRandomChannel = useCallback(() => {
    const randomChannel = getRandomChannel(allChannels);
    if (randomChannel) {
      setShowGlitch(true);
      setLoadStartTime(Date.now());
      setActiveChannel(randomChannel);
      const index = allChannels.findIndex(ch => ch.id === randomChannel.id);
      setActiveChannelIndex(index);
      setShowPlayer(true);
      setIsPlayerMinimized(false);
      const updated = addRecentChannel(randomChannel);
      setRecentChannels(updated);

      // Track random channel usage
      const achievement = trackRandomChannel();
      if (achievement) {
        setNewAchievement(achievement);
      }
    }
  }, [allChannels]);

  // Toggle favorite
  const handleToggleFavorite = useCallback(async (channel: Channel, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    const isFavorite = favorites.includes(channel.id);

    try {
      const token = await user.getIdToken();

      if (isFavorite) {
        await fetch(`/api/favorites?channelId=${channel.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        setFavorites((prev) => prev.filter((id) => id !== channel.id));
      } else {
        await fetch('/api/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ channel }),
        });
        const newCount = favorites.length + 1;
        setFavorites((prev) => [...prev, channel.id]);

        // Track favorite achievement
        const achievement = trackFavorite(newCount);
        if (achievement) {
          setNewAchievement(achievement);
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }, [user, favorites]);

  // Close player
  const handleClosePlayer = useCallback(() => {
    setShowPlayer(false);
    setActiveChannel(null);
  }, []);

  // Minimize player
  const handleMinimizePlayer = useCallback(() => {
    setIsPlayerMinimized(true);
  }, []);

  // Expand player
  const handleExpandPlayer = useCallback(() => {
    setIsPlayerMinimized(false);
  }, []);

  // Filter channels by search
  const filteredGroupedChannels = useMemo(() => {
    if (!searchQuery) return groupedChannels;

    const filtered: Record<string, Channel[]> = {};
    const query = searchQuery.toLowerCase();

    for (const [category, channels] of Object.entries(groupedChannels)) {
      const matchingChannels = channels.filter(
        (ch) =>
          ch.name.toLowerCase().includes(query) ||
          ch.category.toLowerCase().includes(query)
      );
      if (matchingChannels.length > 0) {
        filtered[category] = matchingChannels;
      }
    }

    return filtered;
  }, [groupedChannels, searchQuery]);

  // Filter by selected category
  const displayGroupedChannels = useMemo(() => {
    if (selectedCategory === 'Favoritos') {
      const favChannels: Record<string, Channel[]> = {};
      for (const [category, channels] of Object.entries(groupedChannels)) {
        const favs = channels.filter(ch => favorites.includes(ch.id));
        if (favs.length > 0) {
          favChannels[category] = favs;
        }
      }
      return favChannels;
    }
    if (selectedCategory) {
      return { [selectedCategory]: filteredGroupedChannels[selectedCategory] || [] };
    }
    return filteredGroupedChannels;
  }, [filteredGroupedChannels, selectedCategory, groupedChannels, favorites]);

  // Total channels count
  const totalChannels = useMemo(() => {
    return Object.values(groupedChannels).reduce((sum, chs) => sum + chs.length, 0);
  }, [groupedChannels]);

  // Show welcome screen
  if (showWelcome && !authLoading && user) {
    return <WelcomeScreen onAccept={handleWelcomeAccept} />;
  }

  // Show offline overlay
  if (!isOnline) {
    return <OfflineOverlay />;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0F' }}>
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto" style={{ color: '#FF6B4A' }} />
          <p style={{ color: 'rgba(255,255,255,0.5)' }}>Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0A0A0F' }}>
      {/* Header */}
      <Header
        user={user}
        showFavorites={selectedCategory === 'Favoritos'}
        setShowFavorites={(show) => setSelectedCategory(show ? 'Favoritos' : null)}
        favoriteCount={favorites.length}
        onRandomChannel={handleRandomChannel}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar with clock and stats button */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
          <DigitalClock showIcon={true} />
          <button
            onClick={() => setShowDashboard(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <BarChart3 className="w-4 h-4" style={{ color: '#FF6B4A' }} />
            <span className="text-sm text-white/60">Mi Actividad</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-4 border-b border-white/10 sticky top-0 z-10" style={{ background: '#0A0A0F' }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Buscar canales..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-[#FF6B4A] transition-colors"
            />
          </div>

          {/* Category Pills */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                !selectedCategory
                  ? 'bg-[#FF6B4A] text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              Todos ({totalChannels})
            </button>
            <button
              onClick={() => setSelectedCategory('Favoritos')}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                selectedCategory === 'Favoritos'
                  ? 'bg-[#FF6B4A] text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              Favoritos ({favorites.length})
            </button>
            {/* Random Channel Button */}
            <button
              onClick={handleRandomChannel}
              className="px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors bg-white/10 text-white/70 hover:bg-white/20 flex items-center gap-1"
            >
              <Shuffle className="w-3 h-3" />
              Sorpresa
            </button>
            {categories.slice(0, 8).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-[#FF6B4A] text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Channel List */}
        <div className="flex-1 overflow-y-auto">
          {/* Recent Channels Section */}
          {!selectedCategory && !searchQuery && recentChannels.length > 0 && (
            <div className="py-4 px-4">
              <div className="flex items-center justify-between py-2 px-2">
                <span className="font-semibold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4" style={{ color: '#FF6B4A' }} />
                  Vistos Recientemente
                </span>
                <span className="text-xs text-white/50">{recentChannels.length}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 mt-3">
                {recentChannels.slice(0, 6).map((channel) => (
                  <ChannelCard
                    key={channel.id}
                    channel={channel}
                    isActive={activeChannel?.id === channel.id}
                    isFavorite={favorites.includes(channel.id)}
                    onClick={() => handleSelectChannel(channel)}
                    onToggleFavorite={(e) => handleToggleFavorite(channel, e)}
                    showTime
                  />
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin" style={{ color: '#FF6B4A' }} />
              <p className="mt-4 text-white/50">Cargando canales...</p>
            </div>
          ) : Object.keys(displayGroupedChannels).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Tv className="w-16 h-16 text-white/30" />
              <p className="mt-4 text-white/50">No se encontraron canales</p>
            </div>
          ) : (
            Object.entries(displayGroupedChannels).map(([category, channels]) => (
              <CategorySection
                key={category}
                category={category}
                channels={channels}
                activeChannel={activeChannel}
                favorites={favorites}
                onSelect={handleSelectChannel}
                onToggleFavorite={handleToggleFavorite}
              />
            ))
          )}
        </div>
      </div>

      {/* Glitch Transition */}
      <GlitchTransition
        isActive={showGlitch}
        channelName={activeChannel?.name}
        duration={300}
        onComplete={() => setShowGlitch(false)}
      />

      {/* PLAYER OVERLAY */}
      {showPlayer && activeChannel && !isPlayerMinimized && (
        <div className="fixed inset-0 z-50 bg-black">
          <HLSPlayer
            url={activeChannel.url}
            channelName={activeChannel.name}
            channelLogo={activeChannel.logo}
            onClose={handleClosePlayer}
            onPrevChannel={handlePrevChannel}
            onNextChannel={handleNextChannel}
            onRandomChannel={handleRandomChannel}
            onError={(error) => {
              console.error('Player error:', error);
            }}
            onPlay={() => {
              console.log('Playing:', activeChannel.name);
              setShowGlitch(false);
            }}
          />
          {/* Share button */}
          <div className="absolute top-4 right-36 z-10">
            <ShareChannelButton
              channelName={activeChannel.name}
              channelId={activeChannel.id}
              compact
            />
          </div>
          <button
            onClick={handleMinimizePlayer}
            className="absolute top-4 right-20 p-2 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
          >
            <ChevronDown className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* MINIMIZED PLAYER */}
      {showPlayer && activeChannel && isPlayerMinimized && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-white/10 p-3"
          onClick={handleExpandPlayer}
        >
          <div className="flex items-center gap-3 max-w-screen-xl mx-auto">
            <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
              {activeChannel.logo ? (
                <img
                  src={activeChannel.logo}
                  alt={activeChannel.name}
                  className="w-10 h-10 object-contain"
                />
              ) : (
                <Tv className="w-6 h-6 text-white/50" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-white truncate">{activeChannel.name}</div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded text-white font-medium"
                  style={{ background: '#FF6B4A' }}>
                  EN VIVO
                </span>
                <span className="text-xs text-white/50">Toca para expandir</span>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClosePlayer();
              }}
              className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* User Dashboard Modal */}
      <UserDashboard
        isOpen={showDashboard}
        onClose={() => setShowDashboard(false)}
        favoritesCount={favorites.length}
      />

      {/* Achievement Notification */}
      <AchievementNotification
        achievement={newAchievement}
        onClose={() => setNewAchievement(null)}
      />
    </div>
  );
}
