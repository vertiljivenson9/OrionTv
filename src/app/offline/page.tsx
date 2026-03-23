"use client";

import { useState } from "react";
import { WifiOff, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: '#0A0A0F' }}>
      {/* Stars background effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              width: Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animationDelay: Math.random() * 3 + 's',
              animationDuration: Math.random() * 2 + 2 + 's',
              opacity: Math.random() * 0.5 + 0.2,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-md">
        {/* Icon */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto rounded-full flex items-center justify-center" style={{ background: 'rgba(255, 107, 74, 0.1)' }}>
            <WifiOff className="w-12 h-12" style={{ color: '#FF6B4A' }} />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white mb-4">
          Sin conexión a Internet
        </h1>

        {/* Message */}
        <p className="text-white/60 mb-8 leading-relaxed">
          Lo sentimos, necesitas estar conectado a Internet para disfrutar de OrionTV.
          Por favor, verifica tu conexión e intenta de nuevo.
        </p>

        {/* Retry Button */}
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-white transition-all disabled:opacity-50"
          style={{ background: '#FF6B4A' }}
        >
          {isRetrying ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Reconectando...
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5" />
              Reintentar
            </>
          )}
        </button>
      </div>
    </div>
  );
}
