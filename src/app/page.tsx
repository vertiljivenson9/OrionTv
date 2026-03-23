"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import HLSPlayer from "@/components/HLSPlayer";
import WelcomeScreen from "@/components/WelcomeScreen";
import {
  Loader2, Tv, Search, Heart, X, ChevronUp, ChevronDown, Play,
  Shuffle, Clock, Sparkles
} from "lucide-react";
import type { Channel } from "@/lib/channel-service";
import {
  getRecentChannels,
  addRecentChannel,
  getRandomChannel,
  type RecentChannel
} from "@/lib/recent-channels";

const WELCOME_ACCEPTED_KEY = 'oriontv_welcome_accepted';

// Channel item component
const ChannelItem = ({
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
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-150 ${
      isActive
        ? 'bg-[#FF6B4A] text-white scale-[1.02]'
        : 'hover:bg-white/5 text-white/80 hover:text-white'
    }`}
  >
    <div
      className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden ${
        isActive ? 'bg-white/20' : 'bg-white/10'
      }`}
    >
      {channel.logo ? (
        <img
          src={channel.logo}
          alt={channel.name}
          className="w-10 h-10 object-contain"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : (
        <Tv className={`w-6 h-6 ${isActive ? 'text-white' : 'text-white/50'}`} />
      )}
    </div>

    <div className="flex-1 min-w-0 text-left">
      <div className="font-medium truncate">{channel.name}</div>
      <div className={`text-xs truncate flex items-center gap-2 ${isActive ? 'text-white/70' : 'text-white/40'}`}>
        {channel.category}
        {showTime && 'watchedAt' in channel && (
          <span className="text-white/30">
            • {formatTimeAgo((channel as RecentChannel).watchedAt)}
          </span>
        )}
      </div>
    </div>

    <button
      onClick={onToggleFavorite}
      className={`p-2 rounded-lg transition-colors ${
        isActive ? 'hover:bg-white/20' : 'hover:bg-white/10'
      }`}
    >
      <Heart
        className={`w-4 h-4 ${
          isFavorite
            ? 'fill-red-500 text-red-500'
            : isActive
              ? 'text-white/70'
              : 'text-white/40'
        }`}
      />
    </button>

    {isActive && (
      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
        <Play className="w-4 h-4 text-white fill-white" />
      </div>
    )}
  </button>
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

// Category section component
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
    <div className="border-b border-white/10">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
      >
        <span className="font-semibold text-white">{category}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/50">{channels.length}</span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-white/50" />
          ) : (
            <ChevronDown className="w-4 h-4 text-white/50" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-2 pb-2 space-y-1">
          {channels.slice(0, 30).map((channel) => (
            <ChannelItem
              key={channel.id}
              channel={channel}
              isActive={activeChannel?.id === channel.id}
              isFavorite={favorites.includes(channel.id)}
              onClick={() => onSelect(channel)}
              onToggleFavorite={(e) => onToggleFavorite(channel, e)}
            />
          ))}
          {channels.length > 30 && (
            <div className="text-center py-2 text-white/40 text-xs">
              +{channels.length - 30} más
            </div>
          )}
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
      setActiveChannel(randomChannel);
      const index = allChannels.findIndex(ch => ch.id === randomChannel.id);
      setActiveChannelIndex(index);
      setShowPlayer(true);
      setIsPlayerMinimized(false);
      const updated = addRecentChannel(randomChannel);
      setRecentChannels(updated);
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
        setFavorites((prev) => [...prev, channel.id]);
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
            <div className="border-b border-white/10">
              <button className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors">
                <span className="font-semibold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4" style={{ color: '#FF6B4A' }} />
                  Vistos Recientemente
                </span>
                <span className="text-xs text-white/50">{recentChannels.length}</span>
              </button>
              <div className="px-2 pb-2 space-y-1">
                {recentChannels.slice(0, 5).map((channel) => (
                  <ChannelItem
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
            }}
          />
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
    </div>
  );
}
