"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import HLSPlayer from "@/components/HLSPlayer";
import { Loader2, Tv, Search, Heart, X, ChevronUp, ChevronDown, Play } from "lucide-react";
import type { Channel } from "@/lib/channel-service";

// Channel item component - Optimized for fast rendering
const ChannelItem = ({
  channel,
  isActive,
  isFavorite,
  onClick,
  onToggleFavorite,
}: {
  channel: Channel;
  isActive: boolean;
  isFavorite: boolean;
  onClick: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-150 ${
      isActive
        ? 'bg-[#FF6B4A] text-white scale-[1.02]'
        : 'hover:bg-white/5 text-white/80 hover:text-white'
    }`}
  >
    {/* Logo */}
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

    {/* Info */}
    <div className="flex-1 min-w-0 text-left">
      <div className="font-medium truncate">{channel.name}</div>
      <div className={`text-xs truncate ${isActive ? 'text-white/70' : 'text-white/40'}`}>
        {channel.category}
      </div>
    </div>

    {/* Favorite button */}
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

    {/* Play indicator */}
    {isActive && (
      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
        <Play className="w-4 h-4 text-white fill-white" />
      </div>
    )}
  </button>
);

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

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Channels state
  const [groupedChannels, setGroupedChannels] = useState<Record<string, Channel[]>>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Player state
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [isPlayerMinimized, setIsPlayerMinimized] = useState(false);

  // Favorites state
  const [favorites, setFavorites] = useState<string[]>([]);

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

  // Fetch channels
  useEffect(() => {
    async function fetchChannels() {
      try {
        const response = await fetch('/api/channels?grouped=true');
        const data = await response.json();

        if (data.grouped) {
          setGroupedChannels(data.grouped);
          setCategories(data.categories || []);
        }
      } catch (error) {
        console.error('Error fetching channels:', error);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchChannels();
    }
  }, [user]);

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

    fetchFavorites();
  }, [user]);

  // Select channel - NO SCROLL, instant change
  const handleSelectChannel = useCallback((channel: Channel) => {
    // If same channel, toggle player
    if (activeChannel?.id === channel.id) {
      setIsPlayerMinimized(false);
      return;
    }

    // Change channel instantly
    setActiveChannel(channel);
    setShowPlayer(true);
    setIsPlayerMinimized(false);
  }, [activeChannel]);

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

  // Close player completely
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
      // Show only favorite channels
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
      />

      {/* Main Content - Full screen channel list */}
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
            {categories.slice(0, 10).map((cat) => (
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

        {/* Channel List - Full height, scrollable */}
        <div className="flex-1 overflow-y-auto">
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

      {/* FIXED PLAYER OVERLAY - No scroll needed */}
      {showPlayer && activeChannel && !isPlayerMinimized && (
        <div className="fixed inset-0 z-50 bg-black">
          {/* Player */}
          <HLSPlayer
            url={activeChannel.url}
            channelName={activeChannel.name}
            channelLogo={activeChannel.logo}
            onClose={handleClosePlayer}
            onError={(error) => {
              console.error('Player error:', error);
            }}
            onPlay={() => {
              console.log('Playing:', activeChannel.name);
            }}
          />

          {/* Minimize button */}
          <button
            onClick={handleMinimizePlayer}
            className="absolute top-4 right-20 p-2 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
          >
            <ChevronDown className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* MINIMIZED PLAYER - Bottom bar */}
      {showPlayer && activeChannel && isPlayerMinimized && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-white/10 p-3"
          onClick={handleExpandPlayer}
        >
          <div className="flex items-center gap-3 max-w-screen-xl mx-auto">
            {/* Logo */}
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

            {/* Info */}
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

            {/* Close button */}
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
