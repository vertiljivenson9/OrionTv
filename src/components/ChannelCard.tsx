"use client";

import { Heart, Play, Tv } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

interface Channel {
  id: string;
  name: string;
  logo: string | null;
  country: string | null;
  categories: string[];
}

interface ChannelCardProps {
  channel: Channel;
  isFavorite: boolean;
  onWatch: () => void;
  onToggleFavorite: () => void;
}

export default function ChannelCard({
  channel,
  isFavorite,
  onWatch,
  onToggleFavorite,
}: ChannelCardProps) {
  return (
    <div className="channel-card bg-surface border border-border rounded-xl overflow-hidden group">
      {/* Logo Section */}
      <div className="relative aspect-video bg-muted/30 flex items-center justify-center overflow-hidden">
        {channel.logo ? (
          <img
            src={channel.logo}
            alt={channel.name}
            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-surface">
            <Tv className="w-12 h-12 text-muted-foreground" />
          </div>
        )}
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
          <Button
            size="sm"
            className="bg-primary hover:bg-primary/90 text-white"
            onClick={onWatch}
          >
            <Play className="w-4 h-4 mr-1" />
            Ver
          </Button>
          <Button
            size="sm"
            variant={isFavorite ? "default" : "outline"}
            className={isFavorite 
              ? "bg-red-500 hover:bg-red-600 text-white" 
              : "bg-transparent border-white/30 text-white hover:bg-white/10"
            }
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
          </Button>
        </div>

        {/* Favorite Badge */}
        {isFavorite && (
          <div className="absolute top-2 right-2">
            <Heart className="w-5 h-5 text-red-500 fill-red-500 drop-shadow-lg" />
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="p-3">
        <h3 className="font-semibold text-foreground truncate mb-1" title={channel.name}>
          {channel.name}
        </h3>
        <div className="flex items-center justify-between">
          {channel.country && (
            <Badge variant="outline" className="text-xs border-border text-muted-foreground">
              {channel.country}
            </Badge>
          )}
          {channel.categories.length > 0 && (
            <span className="text-xs text-muted-foreground truncate ml-2">
              {channel.categories.slice(0, 2).join(", ")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
