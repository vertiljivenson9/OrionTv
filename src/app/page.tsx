"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import HLSPlayer from "@/components/HLSPlayer";
import { Loader2, Tv, Search, ChevronRight, Heart } from "lucide-react";
import type { Channel } from "@/lib/channel-service";

// Virtualized channel item component
function ChannelItem({
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
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
        isActive
          ? 'bg-[#FF6B4A] text-white'
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
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <Tv className={`w-6 h-6 ${channel.logo ? 'hidden' : ''} ${isActive ? 'text-white' : 'text-white/50'}`} />
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
          isActive
            ? 'hover:bg-white/20'
            : 'hover:bg-white/10'
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

      {/* Arrow */}
      <ChevronRight className={`w-4 h-4 ${isActive ? 'text-white' : 'text-white/30'}`} />
    </button>
  );
}

// Category section component
function CategorySection({
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
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="border-b border-white/10">
      {/* Category Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
      >
        <span className="font-semibold text-white">{category}</span>
        <span className="text-xs text-white/50">{channels.length} canales</span>
      </button>

      {/* Channels List */}
      {isExpanded && (
        <div className="px-2 pb-2 space-y-1">
          {channels.slice(0, 20).map((channel) => (
            <ChannelItem
              key={channel.id}
              channel={channel}
              isActive={activeChannel?.id === channel.id}
              isFavorite={favorites.includes(channel.id)}
              onClick={() => onSelect(channel)}
              onToggleFavorite={(e) => onToggleFavorite(channel, e)}
            />
          ))}
          {channels.length > 20 && (
            <div className="text-center py-2 text-white/40 text-xs">
              +{channels.length - 20} más
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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

  // Select channel
  const handleSelectChannel = useCallback((channel: Channel) => {
    setActiveChannel(channel);
    setShowPlayer(true);
  }, []);

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
    if (selectedCategory) {
      return { [selectedCategory]: filteredGroupedChannels[selectedCategory] || [] };
    }
    return filteredGroupedChannels;
  }, [filteredGroupedChannels, selectedCategory]);

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

      {/* Main Content - TV Style Layout */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Player Section - Fixed at top on mobile, left on desktop */}
        {showPlayer && activeChannel && (
          <div className="lg:w-[60%] lg:sticky lg:top-0 lg:h-screen bg-black">
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
          </div>
        )}

        {/* Channel List Section */}
        <div className="flex-1 flex flex-col lg:max-h-screen lg:overflow-hidden">
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
          <div className="flex-1 overflow-y-auto lg:max-h-[calc(100vh-180px)]">
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
      </div>
    </div>
  );
}
