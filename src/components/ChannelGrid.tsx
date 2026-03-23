"use client";

import ChannelCard from "./ChannelCard";
import { Loader2, Tv } from "lucide-react";

interface Channel {
  id: string;
  name: string;
  logo: string | null;
  country: string | null;
  categories: string[];
  url?: string | null;
}

interface ChannelGridProps {
  channels: Channel[];
  favorites: string[];
  loading: boolean;
  onWatch: (channel: Channel) => void;
  onToggleFavorite: (channel: Channel) => void;
}

export default function ChannelGrid({
  channels,
  favorites,
  loading,
  onWatch,
  onToggleFavorite,
}: ChannelGridProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: '#FF6B4A' }} />
        <p style={{ color: 'rgba(255,255,255,0.5)' }}>Cargando canales...</p>
      </div>
    );
  }

  if (channels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Tv className="w-16 h-16 mb-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
        <h3 className="text-xl font-semibold text-white mb-2">
          No se encontraron canales
        </h3>
        <p className="text-center max-w-md" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Intenta ajustar los filtros de búsqueda para encontrar más canales.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Results count */}
      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
        {channels.length} canales encontrados
      </p>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {channels.map((channel) => (
          <ChannelCard
            key={channel.id}
            channel={channel}
            isFavorite={favorites.includes(channel.id)}
            onWatch={() => onWatch(channel)}
            onToggleFavorite={() => onToggleFavorite(channel)}
          />
        ))}
      </div>
    </div>
  );
}
