"use client";

import { useEffect, useRef, useState } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import { X, Maximize2, Minimize2, Loader2 } from "lucide-react";
import { Button } from "./ui/button";

interface Channel {
  id: string;
  name: string;
  logo: string | null;
}

interface VideoPlayerProps {
  channel: Channel;
  streamUrl: string | null;
  onClose: () => void;
}

export default function VideoPlayer({ channel, streamUrl, onClose }: VideoPlayerProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!videoRef.current || !streamUrl) return;

    // Initialize Video.js player
    const videoElement = document.createElement("video");
    videoElement.className = "video-js vjs-big-play-centered vjs-theme-city";
    videoElement.setAttribute("playsinline", "true");
    videoRef.current.appendChild(videoElement);

    const player = videojs(videoElement, {
      controls: true,
      autoplay: true,
      preload: "auto",
      fluid: true,
      responsive: true,
      sources: [
        {
          src: streamUrl,
          type: streamUrl.includes(".m3u8") ? "application/x-mpegURL" : "video/mp4",
        },
      ],
      html5: {
        vhs: {
          overrideNative: true,
          enableLowInitialPlaylist: true,
          smoothQualityChange: true,
          fastQualityChange: true,
        },
        nativeAudioTracks: false,
        nativeVideoTracks: false,
      },
    });

    playerRef.current = player;

    player.on("loadstart", () => {
      setIsLoading(true);
      setError(null);
    });

    player.on("loadeddata", () => {
      setIsLoading(false);
    });

    player.on("playing", () => {
      setIsLoading(false);
    });

    player.on("error", () => {
      const error = player.error();
      console.error("Video.js error:", error);
      setError(
        error?.message || "No se pudo cargar el stream. Intenta con otro canal."
      );
      setIsLoading(false);
    });

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, [streamUrl]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  if (!streamUrl) {
    return (
      <div className="fixed bottom-0 left-0 right-0 md:relative md:bottom-auto md:left-auto md:right-auto bg-surface border-t md:border border-border rounded-t-2xl md:rounded-2xl p-4 z-40">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              {channel.logo ? (
                <img
                  src={channel.logo}
                  alt={channel.name}
                  className="w-8 h-8 object-contain"
                />
              ) : (
                <div className="w-4 h-4 bg-primary rounded" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{channel.name}</h3>
              <span className="text-xs text-muted-foreground">Stream no disponible</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="aspect-video bg-background rounded-xl flex items-center justify-center">
          <p className="text-muted-foreground">Este canal no tiene un stream disponible</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 md:relative md:bottom-auto md:left-auto md:right-auto bg-surface border-t md:border border-border rounded-t-2xl md:rounded-2xl p-4 z-40 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center overflow-hidden">
            {channel.logo ? (
              <img
                src={channel.logo}
                alt={channel.name}
                className="w-8 h-8 object-contain"
              />
            ) : (
              <div className="w-4 h-4 bg-primary rounded" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{channel.name}</h3>
            <div className="flex items-center gap-2">
              <span className="live-badge text-xs px-2 py-0.5 rounded text-white font-medium">
                EN VIVO
              </span>
              {isLoading && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Cargando...
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
            {isFullscreen ? (
              <Minimize2 className="w-5 h-5" />
            ) : (
              <Maximize2 className="w-5 h-5" />
            )}
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Video Container */}
      <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10 p-4">
            <p className="text-red-400 text-center mb-2">{error}</p>
            <p className="text-muted-foreground text-sm text-center">
              El canal puede estar temporalmente no disponible.
            </p>
          </div>
        )}
        <div ref={videoRef} className="w-full h-full" />
      </div>
    </div>
  );
}
