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
import {
  Loader2, Tv, Search, Heart, X, ChevronUp, ChevronDown, Play,
  Shuffle, Clock, BarChart3, AlertTriangle, Eye, EyeOff
} from "lucide-react";
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
  type Achievement
} from "@/lib/user-stats";

const WELCOME_ACCEPTED_KEY = 'oriontv_welcome_accepted';
const ADULT_ENABLED_KEY = 'oriontv_adult_enabled';

// Types for the new channel structure
interface Channel {
  id: string;
  name: string;
  logo: string | null;
  url: string;
  country: string;
  countryCode: string;
  language_primary: string | null;
  is_spanish: boolean;
  is_adult: boolean;
  section: 'deportes' | 'peliculas' | 'series' | 'infantil' | 'español' | 'general';
  categories: string[];
  network: string | null;
}

interface Section {
  id: string;
  name: string;
  count: number;
}

// Section icons and colors
const SECTION_CONFIG: Record<string, { icon: string; color: string; bgGradient: string }> = {
  'deportes': { 
    icon: '⚽', 
    color: 'text-green-400',
    bgGradient: 'from-green-500/20 to-transparent'
  },
  'peliculas': { 
    icon: '🎬', 
    color: 'text-purple-400',
    bgGradient: 'from-purple-500/20 to-transparent'
  },
  'series': { 
    icon: '📺', 
    color: 'text-blue-400',
    bgGradient: 'from-blue-500/20 to-transparent'
  },
  'infantil': { 
    icon: '👶', 
    color: 'text-yellow-400',
    bgGradient: 'from-yellow-500/20 to-transparent'
  },
  'español': { 
    icon: '🇪🇸', 
    color: 'text-red-400',
    bgGradient: 'from-red-500/20 to-transparent'
  },
  'general': { 
    icon: '📡', 
    color: 'text-gray-400',
    bgGradient: 'from-gray-500/20 to-transparent'
  }
};

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

      {/* Country Flag Badge */}
      <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-medium text-white/80 bg-black/40 backdrop-blur-sm">
        {channel.countryCode}
      </div>
    </div>

    {/* Info */}
    <div className="p-3">
      <div className="font-medium text-white truncate text-sm">{channel.name}</div>
      <div className="text-xs text-white/40 truncate flex items-center gap-1">
        <span>{(channel.categories && channel.categories[0]) || channel.country}</span>
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

// Section component (GRID)
const SectionGrid = ({
  section,
  channels,
  activeChannel,
  favorites,
  onSelect,
  onToggleFavorite,
}: {
  section: Section;
  channels: Channel[];
  activeChannel: Channel | null;
  favorites: string[];
  onSelect: (channel: Channel) => void;
  onToggleFavorite: (channel: Channel, e: React.MouseEvent) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const config = SECTION_CONFIG[section.id] || SECTION_CONFIG['general'];

  return (
    <div className="py-4 px-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between py-2 hover:bg-white/5 transition-colors rounded-lg px-2"
      >
        <span className="font-semibold text-white flex items-center gap-2">
          <span className="text-lg">{config.icon}</span>
          <span className={config.color}>{section.name}</span>
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

// Adult content warning modal
const AdultWarningModal = ({
  onAccept,
  onDecline
}: {
  onAccept: () => void;
  onDecline: () => void;
}) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
    <div className="max-w-md w-full rounded-2xl p-6 space-y-4" style={{ background: '#15151F' }}>
      <div className="flex items-center gap-3 text-red-400">
        <AlertTriangle className="w-8 h-8" />
        <h2 className="text-xl font-bold">Contenido para Adultos</h2>
      </div>
      
      <p className="text-white/70">
        Estás a punto de activar la sección de contenido para adultos. Este material está destinado 
        únicamente a personas mayores de 18 años.
      </p>
      
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
        <p className="text-sm text-red-300">
          ⚠️ Al continuar, confirmas que tienes al menos 18 años de edad y que aceptas ver contenido 
          clasificado para adultos.
        </p>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onDecline}
          className="flex-1 px-4 py-3 rounded-lg bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={onAccept}
          className="flex-1 px-4 py-3 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
        >
          <Eye className="w-4 h-4" />
          Tengo 18+ años
        </button>
      </div>
    </div>
  </div>
);

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
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

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

  // Adult content state
  const [adultEnabled, setAdultEnabled] = useState(false);
  const [showAdultWarning, setShowAdultWarning] = useState(false);

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

  // Check if welcome was accepted and adult enabled
  useEffect(() => {
    try {
      const accepted = localStorage.getItem(WELCOME_ACCEPTED_KEY);
      const adult = localStorage.getItem(ADULT_ENABLED_KEY);
      if (accepted === 'true') {
        setShowWelcome(false);
      }
      if (adult === 'true') {
        setAdultEnabled(true);
      }
      // Load recent channels
      setRecentChannels(getRecentChannels());
    } catch (e) {
      console.error('LocalStorage error:', e);
    }
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

  // Handle adult toggle
  const handleAdultToggle = useCallback(() => {
    if (!adultEnabled) {
      setShowAdultWarning(true);
    } else {
      setAdultEnabled(false);
      localStorage.setItem(ADULT_ENABLED_KEY, 'false');
    }
  }, [adultEnabled]);

  // Handle adult accept
  const handleAdultAccept = useCallback(() => {
    setAdultEnabled(true);
    localStorage.setItem(ADULT_ENABLED_KEY, 'true');
    setShowAdultWarning(false);
  }, []);

  // Handle adult decline
  const handleAdultDecline = useCallback(() => {
    setShowAdultWarning(false);
  }, []);

  // Fetch channels
  useEffect(() => {
    async function fetchChannels() {
      try {
        const adultParam = adultEnabled ? '&adult=true' : '';
        const response = await fetch(`/api/channels?grouped=true${adultParam}`);
        const data = await response.json();

        if (data.grouped) {
          setGroupedChannels(data.grouped);
          setSections(data.sections || []);

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
  }, [user, showWelcome, adultEnabled]);

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

    // Find index in current display list
    const currentList = selectedSection === 'Favoritos'
      ? allChannels.filter(ch => favorites.includes(ch.id))
      : selectedSection
        ? groupedChannels[selectedSection] || []
        : allChannels;

    const index = currentList.findIndex(ch => ch.id === channel.id);
    setActiveChannelIndex(index);

    setActiveChannel(channel);
    setShowPlayer(true);
    setIsPlayerMinimized(false);

    // Add to recent
    const updated = addRecentChannel(channel as any);
    setRecentChannels(updated);

    // Track stats and check achievements
    const result = trackChannelView(channel as any);
    if (result.newAchievements.length > 0) {
      setNewAchievement(result.newAchievements[0]);
    }
  }, [activeChannel, selectedSection, allChannels, groupedChannels, favorites]);

  // Previous channel
  const handlePrevChannel = useCallback(() => {
    const currentList = selectedSection === 'Favoritos'
      ? allChannels.filter(ch => favorites.includes(ch.id))
      : selectedSection
        ? groupedChannels[selectedSection] || []
        : allChannels;

    if (currentList.length === 0) return;

    const newIndex = activeChannelIndex > 0
      ? activeChannelIndex - 1
      : currentList.length - 1;

    const newChannel = currentList[newIndex];
    if (newChannel) {
      setActiveChannelIndex(newIndex);
      setActiveChannel(newChannel);
      const updated = addRecentChannel(newChannel as any);
      setRecentChannels(updated);
    }
  }, [activeChannelIndex, selectedSection, allChannels, groupedChannels, favorites]);

  // Next channel
  const handleNextChannel = useCallback(() => {
    const currentList = selectedSection === 'Favoritos'
      ? allChannels.filter(ch => favorites.includes(ch.id))
      : selectedSection
        ? groupedChannels[selectedSection] || []
        : allChannels;

    if (currentList.length === 0) return;

    const newIndex = activeChannelIndex < currentList.length - 1
      ? activeChannelIndex + 1
      : 0;

    const newChannel = currentList[newIndex];
    if (newChannel) {
      setActiveChannelIndex(newIndex);
      setActiveChannel(newChannel);
      const updated = addRecentChannel(newChannel as any);
      setRecentChannels(updated);
    }
  }, [activeChannelIndex, selectedSection, allChannels, groupedChannels, favorites]);

  // Random channel
  const handleRandomChannel = useCallback(() => {
    const randomChannel = getRandomChannel(allChannels as any);
    if (randomChannel) {
      setShowGlitch(true);
      setActiveChannel(randomChannel as Channel);
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

    for (const [section, channels] of Object.entries(groupedChannels)) {
      const matchingChannels = channels.filter(
        (ch) =>
          ch.name.toLowerCase().includes(query) ||
          (ch.categories && ch.categories.some(cat => cat.toLowerCase().includes(query))) ||
          ch.country.toLowerCase().includes(query)
      );
      if (matchingChannels.length > 0) {
        filtered[section] = matchingChannels;
      }
    }

    return filtered;
  }, [groupedChannels, searchQuery]);

  // Filter by selected section
  const displayGroupedChannels = useMemo(() => {
    if (selectedSection === 'Favoritos') {
      const favChannels: Record<string, Channel[]> = {};
      for (const [section, channels] of Object.entries(groupedChannels)) {
        const favs = channels.filter(ch => favorites.includes(ch.id));
        if (favs.length > 0) {
          favChannels[section] = favs;
        }
      }
      return favChannels;
    }
    if (selectedSection) {
      return { [selectedSection]: filteredGroupedChannels[selectedSection] || [] };
    }
    return filteredGroupedChannels;
  }, [filteredGroupedChannels, selectedSection, groupedChannels, favorites]);

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
        showFavorites={selectedSection === 'Favoritos'}
        setShowFavorites={(show) => setSelectedSection(show ? 'Favoritos' : null)}
        favoriteCount={favorites.length}
        onRandomChannel={handleRandomChannel}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar with clock and stats button */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
          <DigitalClock showIcon={true} />
          <div className="flex items-center gap-3">
            {/* Adult Toggle Button */}
            <button
              onClick={handleAdultToggle}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                adultEnabled 
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {adultEnabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span className="text-sm">{adultEnabled ? 'Adultos ON' : 'Adultos OFF'}</span>
            </button>
            <button
              onClick={() => setShowDashboard(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              <BarChart3 className="w-4 h-4" style={{ color: '#FF6B4A' }} />
              <span className="text-sm text-white/60">Mi Actividad</span>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="p-4 border-b border-white/10 sticky top-0 z-10" style={{ background: '#0A0A0F' }}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Buscar canales, países, categorías..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-[#FF6B4A] transition-colors"
            />
          </div>

          {/* Section Pills */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedSection(null)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                !selectedSection
                  ? 'bg-[#FF6B4A] text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              Todos ({totalChannels})
            </button>
            <button
              onClick={() => setSelectedSection('Favoritos')}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                selectedSection === 'Favoritos'
                  ? 'bg-[#FF6B4A] text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              ❤️ Favoritos ({favorites.length})
            </button>
            {/* Random Channel Button */}
            <button
              onClick={handleRandomChannel}
              className="px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors bg-white/10 text-white/70 hover:bg-white/20 flex items-center gap-1"
            >
              <Shuffle className="w-3 h-3" />
              Sorpresa
            </button>
            {/* Section buttons */}
            {sections.map((section) => {
              const config = SECTION_CONFIG[section.id] || SECTION_CONFIG['general'];
              return (
                <button
                  key={section.id}
                  onClick={() => setSelectedSection(section.id)}
                  className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                    selectedSection === section.id
                      ? 'bg-[#FF6B4A] text-white'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {config.icon} {section.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Channel List */}
        <div className="flex-1 overflow-y-auto">
          {/* Recent Channels Section */}
          {!selectedSection && !searchQuery && recentChannels.length > 0 && (
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
                    channel={channel as Channel}
                    isActive={activeChannel?.id === channel.id}
                    isFavorite={favorites.includes(channel.id)}
                    onClick={() => handleSelectChannel(channel as Channel)}
                    onToggleFavorite={(e) => handleToggleFavorite(channel as Channel, e)}
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
            sections
              .filter(s => displayGroupedChannels[s.id]?.length > 0)
              .map((section) => (
                <SectionGrid
                  key={section.id}
                  section={section}
                  channels={displayGroupedChannels[section.id] || []}
                  activeChannel={activeChannel}
                  favorites={favorites}
                  onSelect={handleSelectChannel}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))
          )}
        </div>
      </div>

      {/* Adult Warning Modal */}
      {showAdultWarning && (
        <AdultWarningModal
          onAccept={handleAdultAccept}
          onDecline={handleAdultDecline}
        />
      )}

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
