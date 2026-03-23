"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Filters from "@/components/Filters";
import ChannelGrid from "@/components/ChannelGrid";
import VideoPlayer from "@/components/VideoPlayer";
import { Loader2 } from "lucide-react";
import type { Channel } from "@/lib/channels";

interface FavoriteChannel {
  id: string;
  name: string;
  logo: string | null;
  country: string | null;
  addedAt: string;
}

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // State
  const [channels, setChannels] = useState<Channel[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<Channel[]>([]);
  const [favorites, setFavorites] = useState<FavoriteChannel[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [page, setPage] = useState(1);
  const [totalChannels, setTotalChannels] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  // Filters
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  
  // Video Player
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);

  // Observer ref for infinite scroll
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

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
  const fetchChannelsData = useCallback(async (pageNum: number, append: boolean = false) => {
    if (!user) return;
    
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const params = new URLSearchParams();
      params.set("page", pageNum.toString());
      params.set("limit", "100");
      if (search) params.set("search", search);
      if (country) params.set("country", country);
      if (category) params.set("category", category);

      const response = await fetch(`/api/channels?${params.toString()}`);
      const data = await response.json();
      
      if (append) {
        setChannels(prev => [...prev, ...data.channels]);
      } else {
        setChannels(data.channels || []);
      }
      
      setFilteredChannels(append 
        ? prev => [...prev, ...data.channels]
        : data.channels || []
      );
      setCountries(data.countries || []);
      setCategories(data.categories || []);
      setTotalChannels(data.total || 0);
      setHasMore(data.hasMore || false);
    } catch (error) {
      console.error("Error fetching channels:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [user, search, country, category]);

  // Initial fetch
  useEffect(() => {
    if (user) {
      setPage(1);
      setChannels([]);
      setFilteredChannels([]);
      fetchChannelsData(1, false);
    }
  }, [user, search, country, category]); // Re-fetch when filters change

  // Infinite scroll observer
  useEffect(() => {
    if (loading || loadingMore || !hasMore) return;

    const options = {
      root: null,
      rootMargin: "100px",
      threshold: 0.1,
    };

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchChannelsData(nextPage, true);
      }
    }, options);

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, loadingMore, hasMore, page, fetchChannelsData]);

  // Fetch favorites
  useEffect(() => {
    async function fetchFavorites() {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/favorites", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        setFavorites(data.favorites || []);
      } catch (error) {
        console.error("Error fetching favorites:", error);
      }
    }

    fetchFavorites();
  }, [user]);

  // Toggle favorite
  const toggleFavorite = async (channel: Channel) => {
    if (!user) return;
    const isFavorite = favorites.some((f) => f.id === channel.id);

    try {
      const token = await user.getIdToken();
      
      if (isFavorite) {
        const response = await fetch(`/api/favorites?channelId=${channel.id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        setFavorites(data.favorites || []);
      } else {
        const response = await fetch("/api/favorites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ channel }),
        });
        const data = await response.json();
        setFavorites(data.favorites || []);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  // Watch channel - instant playback
  const handleWatch = (channel: Channel) => {
    if (channel.url) {
      setStreamUrl(channel.url);
      setSelectedChannel(channel);
    }
  };

  // Close player
  const handleClosePlayer = () => {
    setSelectedChannel(null);
    setStreamUrl(null);
  };

  // Get channels to display
  const displayChannels = showFavorites
    ? channels.filter((ch) => favorites.some((f) => f.id === ch.id))
    : channels;

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
        showFavorites={showFavorites}
        setShowFavorites={setShowFavorites}
        favoriteCount={favorites.length}
      />

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6 space-y-6">
        {/* Page Title */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            {showFavorites ? "Mis Favoritos" : "Todos los Canales"}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)' }}>
            {showFavorites
              ? `${favorites.length} canales guardados`
              : `${totalChannels.toLocaleString()} canales disponibles`}
          </p>
        </div>

        {/* Filters */}
        <Filters
          search={search}
          setSearch={setSearch}
          country={country}
          setCountry={setCountry}
          category={category}
          setCategory={setCategory}
          countries={countries}
          categories={categories}
        />

        {/* Channel Grid */}
        <ChannelGrid
          channels={displayChannels}
          favorites={favorites.map((f) => f.id)}
          loading={loading}
          onWatch={handleWatch}
          onToggleFavorite={toggleFavorite}
        />

        {/* Load More Trigger */}
        {!showFavorites && hasMore && (
          <div ref={loadMoreRef} className="flex justify-center py-8">
            {loadingMore && (
              <div className="flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Cargando más canales...</span>
              </div>
            )}
          </div>
        )}

        {/* End of list */}
        {!hasMore && !loading && channels.length > 0 && !showFavorites && (
          <div className="text-center py-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Has llegado al final de la lista
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t py-6" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            © 2024 Orion Stream. Todos los derechos reservados.{" "}
            <a href="/terms" style={{ color: '#FF6B4A' }}>Términos</a>
            {" "}·{" "}
            <a href="/privacy" style={{ color: '#FF6B4A' }}>Privacidad</a>
          </p>
        </div>
      </footer>

      {/* Video Player */}
      {selectedChannel && (
        <VideoPlayer
          channel={selectedChannel}
          streamUrl={streamUrl}
          onClose={handleClosePlayer}
        />
      )}
    </div>
  );
}
