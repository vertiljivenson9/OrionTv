"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import { Loader2, AlertCircle, RefreshCw, Volume2, VolumeX } from "lucide-react";

interface HLSPlayerProps {
  url: string;
  channelName: string;
  channelLogo?: string | null;
  onError?: (error: string) => void;
  onPlay?: () => void;
  fallbackUrls?: string[];
  onClose: () => void;
}

type PlayerState = 'loading' | 'playing' | 'error';

export default function HLSPlayer({
  url,
  channelName,
  channelLogo,
  onError,
  onPlay,
  fallbackUrls = [],
  onClose,
}: HLSPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  const [state, setState] = useState<PlayerState>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);

  // All available URLs (primary + fallbacks)
  const allUrls = [url, ...fallbackUrls].filter(Boolean);
  const currentUrl = allUrls[currentUrlIndex] || url;

  // Clear timeout
  const clearTimeout = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Set loading timeout (4 seconds max)
  const setLoadingTimeout = useCallback(() => {
    clearTimeout();
    timeoutRef.current = window.setTimeout(() => {
      console.log('[Player] Loading timeout - trying fallback');
      handleFallbackOrError('Tiempo de espera agotado');
    }, 4000);
  }, [clearTimeout]);

  // Handle error with fallback
  const handleFallbackOrError = useCallback((error: string) => {
    // Try next URL if available
    if (currentUrlIndex < allUrls.length - 1 && retryCountRef.current < 3) {
      console.log(`[Player] Trying fallback URL ${currentUrlIndex + 1}`);
      retryCountRef.current++;
      setCurrentUrlIndex((prev) => prev + 1);
      setState('loading');
      setErrorMessage('');
      return;
    }

    // No more fallbacks - show error
    console.error('[Player] All sources failed:', error);
    setState('error');
    setErrorMessage(error);
    onError?.(error);
  }, [currentUrlIndex, allUrls.length, onError]);

  // Initialize player
  const initPlayer = useCallback((streamUrl: string) => {
    const video = videoRef.current;
    if (!video) return;

    // Cleanup existing instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Clear previous source
    video.removeAttribute('src');
    video.load();

    setState('loading');
    setErrorMessage('');
    setLoadingTimeout();

    console.log('[Player] Initializing with URL:', streamUrl.substring(0, 80));

    // Check if HLS is supported
    if (!Hls.isSupported()) {
      // Try native HLS (Safari)
      video.src = streamUrl;
      video.play().catch((err) => {
        console.error('[Player] Native play error:', err);
        handleFallbackOrError('No se puede reproducir este stream');
      });
      return;
    }

    // Create HLS instance with strict config
    const hls = new Hls({
      manifestLoadingTimeOut: 4000,
      manifestLoadingMaxRetry: 1,
      levelLoadingTimeOut: 4000,
      levelLoadingMaxRetry: 1,
      fragLoadingTimeOut: 4000,
      fragLoadingMaxRetry: 1,
      maxBufferLength: 10,
      maxMaxBufferLength: 15,
      maxBufferSize: 30 * 1000 * 1000,
      maxBufferHole: 0.5,
      lowLatencyMode: false,
      startLevel: -1, // Auto
      capLevelToPlayerSize: true,
      enableWorker: true,
    });

    hlsRef.current = hls;

    // Event handlers
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      console.log('[Player] Manifest parsed');
      clearTimeout();
      video.play().catch(() => {});
    });

    hls.on(Hls.Events.FRAG_LOADED, () => {
      clearTimeout();
      setState('playing');
      onPlay?.();
    });

    hls.on(Hls.Events.ERROR, (_, data) => {
      if (data.fatal) {
        console.error('[Player] Fatal error:', data.type, data.details);
        clearTimeout();

        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            handleFallbackOrError('Error de conexión');
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            // Try to recover media error
            hls.recoverMediaError();
            break;
          default:
            handleFallbackOrError('Error desconocido');
            break;
        }
      }
    });

    // Load source
    hls.loadSource(streamUrl);
    hls.attachMedia(video);
  }, [setLoadingTimeout, clearTimeout, handleFallbackOrError, onPlay]);

  // Video element events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlaying = () => {
      clearTimeout();
      setState('playing');
    };

    const onWaiting = () => {
      setLoadingTimeout();
    };

    const onError = () => {
      const error = video.error;
      if (error) {
        console.error('[Player] Video error:', error.message);
        handleFallbackOrError(error.message || 'Error de reproducción');
      }
    };

    video.addEventListener('playing', onPlaying);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('error', onError);

    return () => {
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('error', onError);
    };
  }, [clearTimeout, handleFallbackOrError, setLoadingTimeout]);

  // Initialize when URL changes
  useEffect(() => {
    if (currentUrl) {
      retryCountRef.current = 0;
      initPlayer(currentUrl);
    }

    return () => {
      clearTimeout();
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentUrl, initPlayer, clearTimeout]);

  // Retry function
  const handleRetry = () => {
    setCurrentUrlIndex(0);
    retryCountRef.current = 0;
    setState('loading');
    setErrorMessage('');
    if (url) {
      initPlayer(url);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  return (
    <div
      className="relative w-full h-full bg-black"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        muted={isMuted}
        autoPlay
      />

      {/* Loading Overlay */}
      {state === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
          <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: '#FF6B4A' }} />
          <p className="text-white text-lg font-medium">Conectando...</p>
          <p className="text-white/50 text-sm mt-1">{channelName}</p>
        </div>
      )}

      {/* Error Overlay */}
      {state === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-10 p-4">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-white text-lg font-medium mb-2">Canal no disponible</p>
          <p className="text-white/50 text-sm text-center mb-4 max-w-md">
            {errorMessage || 'No se pudo conectar con el stream. Intenta con otro canal.'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors"
              style={{ background: '#FF6B4A', color: 'white' }}
            >
              <RefreshCw className="w-4 h-4" />
              Reintentar
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-medium bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Channel Info Overlay */}
      {state === 'playing' && (
        <div
          className={`absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent transition-opacity duration-300 z-10 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="flex items-center gap-3">
            {channelLogo && (
              <img
                src={channelLogo}
                alt={channelName}
                className="w-10 h-10 object-contain rounded"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            <div>
              <h3 className="text-white font-semibold">{channelName}</h3>
              <span className="text-xs px-2 py-0.5 rounded text-white font-medium"
                style={{ background: '#FF6B4A' }}>
                EN VIVO
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Controls */}
      {state === 'playing' && (
        <div
          className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 z-10 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors text-sm font-medium"
            >
              Cerrar Player
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
