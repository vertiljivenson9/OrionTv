"use client";

import { useEffect, useState } from "react";
import { WifiOff, RefreshCw } from "lucide-react";

export default function NotFound() {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      window.location.href = '/';
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
        {/* 404 Text */}
        <div className="mb-6">
          <span
            className="text-8xl font-bold"
            style={{
              background: 'linear-gradient(135deg, #FF6B4A 0%, #FF8A70 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            404
          </span>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white mb-4">
          Página no encontrada
        </h1>

        {/* Message */}
        <p className="text-white/60 mb-8 leading-relaxed">
          Lo sentimos, la página que buscas no existe o ha sido movida.
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
              Cargando...
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5" />
              Ir al inicio
            </>
          )}
        </button>
      </div>
    </div>
  );
}
